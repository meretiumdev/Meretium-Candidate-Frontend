import { executeAuthorizedRequest, forceReauthIfNeeded } from './authSession';

const RAW_CANDIDATE_API_BASE_URL = import.meta.env.VITE_CANDIDATE_API_BASE_URL?.trim() || '';

function isNgrokHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized.endsWith('.ngrok-free.app') || normalized.endsWith('.ngrok.app');
}

function getCandidateApiBaseUrl(): string {
  if (!RAW_CANDIDATE_API_BASE_URL) return '';
  return RAW_CANDIDATE_API_BASE_URL.replace(/\/$/, '');
}

const CANDIDATE_API_BASE_URL = getCandidateApiBaseUrl();
const SETTINGS_CACHE_TTL_MS = 5000;

function getCandidateRequestHeaders(accessToken: string): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    if (/^https?:\/\//i.test(RAW_CANDIDATE_API_BASE_URL)) {
      const parsed = new URL(RAW_CANDIDATE_API_BASE_URL);
      if (isNgrokHost(parsed.hostname)) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }
    }
  } catch {
    // Ignore malformed URL
  }

  return headers;
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function asString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim();
}

function asNullableString(input: unknown): string | null {
  const value = asString(input);
  return value.length > 0 ? value : null;
}

function asBoolean(input: unknown, fallback = false): boolean {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'number') return input === 1;
  if (typeof input === 'string') {
    const normalized = input.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return fallback;
}

function getApiMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const message = (payload as { message?: unknown }).message;
  if (typeof message !== 'string') return null;
  const trimmedMessage = message.trim();
  return trimmedMessage.length > 0 ? trimmedMessage : null;
}

function getApiDetailMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === 'string') {
    const trimmedDetail = detail.trim();
    return trimmedDetail.length > 0 ? trimmedDetail : null;
  }

  if (!Array.isArray(detail) || detail.length === 0) return null;

  const firstDetail = detail[0];
  if (typeof firstDetail === 'string') {
    const trimmed = firstDetail.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof firstDetail !== 'object' || firstDetail === null) return null;
  const msg = (firstDetail as { msg?: unknown }).msg;
  if (typeof msg !== 'string') return null;
  const trimmedMsg = msg.trim();
  return trimmedMsg.length > 0 ? trimmedMsg : null;
}

function asSettingsRoot(payload: unknown): Record<string, unknown> {
  const root = asRecord(payload) || {};
  const data = asRecord(root.data);
  return data || root;
}

export type CandidateProfileVisibility = 'public' | 'matched' | 'private';

export interface CandidateSettingsAccount {
  avatar: string | null;
  full_name: string;
  email: string;
  sign_method: string;
  phone_number: string;
  phone_verified: boolean;
}

export interface CandidateSettingsProfileAndVisibility {
  profile_visibility: CandidateProfileVisibility;
  allow_cv_download: boolean;
  show_last_active: boolean;
  is_open_to_work: boolean;
}

export interface CandidateSettingsCvReference {
  id: string;
  name: string;
}

export interface CandidateSettingsCvAndDataManagement {
  default_cv: CandidateSettingsCvReference | null;
  quick_apply_default_cv: CandidateSettingsCvReference | null;
}

export interface CandidateSettingsNotificationSettings {
  application_updates_inapp: boolean;
  application_updates_email: boolean;
  interview_invites_inapp: boolean;
  interview_invites_email: boolean;
  offer_updates_inapp: boolean;
  offer_updates_email: boolean;
  new_messages_inapp: boolean;
  new_messages_email: boolean;
  profile_viewed_inapp: boolean;
  profile_viewed_email: boolean;
  job_recommendations_inapp: boolean;
  job_recommendations_email: boolean;
  product_updates_inapp: boolean;
  product_updates_email: boolean;
}

export interface CandidateSettingsAiPreferences {
  use_ai_to_improve_profile: boolean;
  auto_generate_cover_letters: boolean;
  show_ai_match_to_recruiters: boolean;
  allow_ai_cv_analysis: boolean;
}

export interface CandidateSettingsResponse {
  account: CandidateSettingsAccount;
  profile_and_visibility: CandidateSettingsProfileAndVisibility;
  cv_and_data_management: CandidateSettingsCvAndDataManagement;
  notification_settings: CandidateSettingsNotificationSettings;
  ai_preferences: CandidateSettingsAiPreferences;
}

interface CachedCandidateSettings {
  token: string;
  data: CandidateSettingsResponse;
  fetchedAt: number;
}

let cachedCandidateSettings: CachedCandidateSettings | null = null;
let candidateSettingsRequestInFlight: Promise<CandidateSettingsResponse> | null = null;
let inFlightToken = '';

function normalizeProfileVisibility(input: unknown): CandidateProfileVisibility {
  const normalized = asString(input).toLowerCase();
  if (
    normalized === 'public'
    || normalized === 'open'
    || normalized === 'open_to_all'
    || normalized === 'open_to_all_recruiters'
  ) {
    return 'public';
  }

  if (
    normalized === 'matched'
    || normalized === 'matched_only'
    || normalized === 'only_matched'
    || normalized === 'only_matched_recruiters'
  ) {
    return 'matched';
  }

  return 'private';
}

function normalizeCvReference(input: unknown): CandidateSettingsCvReference | null {
  if (input === null || input === undefined) return null;

  if (typeof input === 'string' || typeof input === 'number') {
    const value = String(input).trim();
    if (!value) return null;
    return { id: value, name: value };
  }

  const record = asRecord(input);
  if (!record) return null;

  const id = asString(record.id) || asString(record.cv_id) || asString(record.value);
  const name = asString(record.name) || asString(record.file_name) || asString(record.filename) || asString(record.title) || asString(record.label);

  if (!id && !name) return null;

  return {
    id: id || name,
    name: name || id,
  };
}

function normalizeSettingsResponse(payload: unknown): CandidateSettingsResponse {
  const root = asSettingsRoot(payload);
  const accountRaw = asRecord(root.account) || {};
  const profileVisibilityRaw = asRecord(root.profile_and_visibility) || {};
  const cvAndDataRaw = asRecord(root.cv_and_data_management) || {};
  const notificationsRaw = asRecord(root.notification_settings) || {};
  const aiPreferencesRaw = asRecord(root.ai_preferences) || {};

  return {
    account: {
      avatar: asNullableString(accountRaw.avatar),
      full_name: asString(accountRaw.full_name),
      email: asString(accountRaw.email),
      sign_method: asString(accountRaw.sign_method),
      phone_number: asString(accountRaw.phone_number),
      phone_verified: asBoolean(accountRaw.phone_verified),
    },
    profile_and_visibility: {
      profile_visibility: normalizeProfileVisibility(profileVisibilityRaw.profile_visibility),
      allow_cv_download: asBoolean(profileVisibilityRaw.allow_cv_download, true),
      show_last_active: asBoolean(profileVisibilityRaw.show_last_active, true),
      is_open_to_work: asBoolean(profileVisibilityRaw.is_open_to_work, true),
    },
    cv_and_data_management: {
      default_cv: normalizeCvReference(cvAndDataRaw.default_cv),
      quick_apply_default_cv: normalizeCvReference(cvAndDataRaw.quick_apply_default_cv),
    },
    notification_settings: {
      application_updates_inapp: asBoolean(notificationsRaw.application_updates_inapp, true),
      application_updates_email: asBoolean(notificationsRaw.application_updates_email, true),
      interview_invites_inapp: asBoolean(notificationsRaw.interview_invites_inapp, true),
      interview_invites_email: asBoolean(notificationsRaw.interview_invites_email, true),
      offer_updates_inapp: asBoolean(notificationsRaw.offer_updates_inapp, true),
      offer_updates_email: asBoolean(notificationsRaw.offer_updates_email, true),
      new_messages_inapp: asBoolean(notificationsRaw.new_messages_inapp, true),
      new_messages_email: asBoolean(notificationsRaw.new_messages_email, true),
      profile_viewed_inapp: asBoolean(notificationsRaw.profile_viewed_inapp, true),
      profile_viewed_email: asBoolean(notificationsRaw.profile_viewed_email, true),
      job_recommendations_inapp: asBoolean(notificationsRaw.job_recommendations_inapp, true),
      job_recommendations_email: asBoolean(notificationsRaw.job_recommendations_email, true),
      product_updates_inapp: asBoolean(notificationsRaw.product_updates_inapp, true),
      product_updates_email: asBoolean(notificationsRaw.product_updates_email, true),
    },
    ai_preferences: {
      use_ai_to_improve_profile: asBoolean(aiPreferencesRaw.use_ai_to_improve_profile, true),
      auto_generate_cover_letters: asBoolean(aiPreferencesRaw.auto_generate_cover_letters, true),
      show_ai_match_to_recruiters: asBoolean(aiPreferencesRaw.show_ai_match_to_recruiters, true),
      allow_ai_cv_analysis: asBoolean(aiPreferencesRaw.allow_ai_cv_analysis, true),
    },
  };
}

export async function getCandidateSettings(accessToken: string): Promise<CandidateSettingsResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const now = Date.now();
  if (
    cachedCandidateSettings
    && cachedCandidateSettings.token === trimmedAccessToken
    && now - cachedCandidateSettings.fetchedAt <= SETTINGS_CACHE_TTL_MS
  ) {
    return cachedCandidateSettings.data;
  }

  if (candidateSettingsRequestInFlight && inFlightToken === trimmedAccessToken) {
    return candidateSettingsRequestInFlight;
  }

  const requestPromise = (async () => {
    const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
      fetch(`${CANDIDATE_API_BASE_URL}/settings`, {
        method: 'GET',
        headers: getCandidateRequestHeaders(nextAccessToken),
      })
    );

    const raw = await response.text();
    let payload: unknown = null;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      forceReauthIfNeeded(response.status, payload);
      throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `Settings fetch failed with status ${response.status}`);
    }

    const normalizedResponse = normalizeSettingsResponse(payload);
    cachedCandidateSettings = {
      token: trimmedAccessToken,
      data: normalizedResponse,
      fetchedAt: Date.now(),
    };

    return normalizedResponse;
  })();

  candidateSettingsRequestInFlight = requestPromise;
  inFlightToken = trimmedAccessToken;

  try {
    return await requestPromise;
  } finally {
    if (candidateSettingsRequestInFlight === requestPromise) {
      candidateSettingsRequestInFlight = null;
      inFlightToken = '';
    }
  }
}
