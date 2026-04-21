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

function getCandidateRequestHeaders(accessToken: string, includeJsonContentType = false): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }

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

function getApiSuccessMessage(payload: unknown): string | null {
  const topLevelMessage = getApiMessage(payload);
  if (topLevelMessage) return topLevelMessage;

  if (typeof payload !== 'object' || payload === null) return null;
  const data = (payload as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null) return null;

  const nestedMessage = (data as { message?: unknown }).message;
  if (typeof nestedMessage !== 'string') return null;
  const trimmedNestedMessage = nestedMessage.trim();
  return trimmedNestedMessage.length > 0 ? trimmedNestedMessage : null;
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

function getApiCode(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const code = (payload as { code?: unknown }).code;
  if (typeof code === 'string') return code;

  const errors = (payload as { errors?: unknown }).errors;
  if (typeof errors !== 'object' || errors === null) return null;
  const nestedCode = (errors as { code?: unknown }).code;
  return typeof nestedCode === 'string' ? nestedCode : null;
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
  quick_apply_default_cv: boolean;
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

export interface CandidateSettingsActiveSession {
  id: string;
  device_name: string;
  city: string | null;
  country: string | null;
  last_used_at: string;
  is_current: boolean;
}

export interface CandidateSettingsResponse {
  account: CandidateSettingsAccount;
  profile_and_visibility: CandidateSettingsProfileAndVisibility;
  cv_and_data_management: CandidateSettingsCvAndDataManagement;
  notification_settings: CandidateSettingsNotificationSettings;
  ai_preferences: CandidateSettingsAiPreferences;
  active_sessions: CandidateSettingsActiveSession[];
}

interface CachedCandidateSettings {
  token: string;
  data: CandidateSettingsResponse;
  fetchedAt: number;
}

interface GetCandidateSettingsOptions {
  forceRefresh?: boolean;
}

interface CandidateDataExportBlobResult {
  type: 'blob';
  blob: Blob;
  fileName: string | null;
  message: string | null;
}

interface CandidateDataExportUrlResult {
  type: 'url';
  url: string;
  fileName: string | null;
  message: string | null;
}

interface CandidateDataExportMessageResult {
  type: 'message';
  message: string;
}

export type CandidateDataExportResult =
  | CandidateDataExportBlobResult
  | CandidateDataExportUrlResult
  | CandidateDataExportMessageResult;

let cachedCandidateSettings: CachedCandidateSettings | null = null;
let candidateSettingsRequestInFlight: Promise<CandidateSettingsResponse> | null = null;
let inFlightToken = '';

export function clearCandidateSettingsCache(): void {
  cachedCandidateSettings = null;
  candidateSettingsRequestInFlight = null;
  inFlightToken = '';
}

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

function normalizeQuickApplyDefaultCv(input: unknown): boolean {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'number') return input === 1;

  if (typeof input === 'string') {
    const normalized = input.trim().toLowerCase();
    if (!normalized) return false;
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
    return true;
  }

  if (input === null || input === undefined) return false;

  const record = asRecord(input);
  if (!record) return false;

  if ('enabled' in record) return asBoolean(record.enabled, false);
  if ('is_enabled' in record) return asBoolean(record.is_enabled, false);
  if ('value' in record) return asBoolean(record.value, false);
  if ('active' in record) return asBoolean(record.active, false);

  // Backward compatible with object-based payloads from older APIs.
  return true;
}

function normalizeActiveSession(input: unknown): CandidateSettingsActiveSession | null {
  const record = asRecord(input);
  if (!record) return null;

  const id = asString(record.id);
  if (!id) return null;

  return {
    id,
    device_name: asString(record.device_name) || 'Unknown device',
    city: asNullableString(record.city),
    country: asNullableString(record.country),
    last_used_at: asString(record.last_used_at),
    is_current: asBoolean(record.is_current, false),
  };
}

function normalizeSettingsResponse(payload: unknown): CandidateSettingsResponse {
  const root = asSettingsRoot(payload);
  const accountRaw = asRecord(root.account) || {};
  const profileVisibilityRaw = asRecord(root.profile_and_visibility) || {};
  const cvAndDataRaw = asRecord(root.cv_and_data_management) || {};
  const notificationsRaw = asRecord(root.notification_settings) || {};
  const aiPreferencesRaw = asRecord(root.ai_preferences) || {};
  const activeSessionsRaw = Array.isArray(root.active_sessions) ? root.active_sessions : [];

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
      quick_apply_default_cv: normalizeQuickApplyDefaultCv(cvAndDataRaw.quick_apply_default_cv),
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
    active_sessions: activeSessionsRaw
      .map((session) => normalizeActiveSession(session))
      .filter((session): session is CandidateSettingsActiveSession => session !== null),
  };
}

function getCandidateScopedPath(path: string): string {
  const cleanedPath = path.trim().replace(/^\/+/, '');
  const normalizedBase = CANDIDATE_API_BASE_URL.toLowerCase();
  const pathPrefix = normalizedBase.endsWith('/candidate') ? '' : '/candidate';
  return `${pathPrefix}/${cleanedPath}`;
}

function getCandidateSettingsPatchPath(resource: 'notification-settings' | 'ai-preferences'): string {
  return getCandidateScopedPath(resource);
}

function readDataExportUrl(payload: unknown): string {
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  }

  const root = asRecord(payload);
  if (!root) return '';

  const topLevelUrl = asString(root.url)
    || asString(root.download_url)
    || asString(root.file_url)
    || asString(root.export_url);
  if (topLevelUrl) return topLevelUrl;

  const data = asRecord(root.data);
  if (!data) return '';

  return asString(data.url)
    || asString(data.download_url)
    || asString(data.file_url)
    || asString(data.export_url);
}

function readDataExportFileName(payload: unknown): string | null {
  const root = asRecord(payload);
  if (!root) return null;

  const topLevelName = asString(root.file_name) || asString(root.filename) || asString(root.name);
  if (topLevelName) return topLevelName;

  const data = asRecord(root.data);
  if (!data) return null;

  const nestedName = asString(data.file_name) || asString(data.filename) || asString(data.name);
  return nestedName || null;
}

function parseFileNameFromContentDisposition(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      const decoded = decodeURIComponent(utf8Match[1].trim());
      return decoded || null;
    } catch {
      // Fall through to basic filename parsing.
    }
  }

  const basicMatch = contentDisposition.match(/filename\s*=\s*"?([^\";]+)"?/i);
  if (!basicMatch?.[1]) return null;
  const cleaned = basicMatch[1].trim();
  return cleaned || null;
}

function getDefaultExportFileName(contentType: string): string {
  const normalized = contentType.toLowerCase();

  if (normalized.includes('application/zip')) return 'candidate-data-export.zip';
  if (normalized.includes('application/pdf')) return 'candidate-data-export.pdf';
  if (normalized.includes('text/csv') || normalized.includes('application/csv')) return 'candidate-data-export.csv';
  if (normalized.includes('application/json')) return 'candidate-data-export.json';

  return 'candidate-data-export.bin';
}

async function patchCandidateSettings(accessToken: string, path: string, body: unknown): Promise<string | null> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: getCandidateRequestHeaders(nextAccessToken, true),
      body: JSON.stringify(body),
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
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `Settings update failed with status ${response.status}`);
  }

  const code = getApiCode(payload);
  if (code && /(ERROR|FAIL)/i.test(code)) {
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `Settings update failed with code ${code}`);
  }

  return getApiSuccessMessage(payload);
}

export async function getCandidateSettings(
  accessToken: string,
  options: GetCandidateSettingsOptions = {}
): Promise<CandidateSettingsResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const forceRefresh = options.forceRefresh === true;
  const now = Date.now();
  if (
    !forceRefresh
    &&
    cachedCandidateSettings
    && cachedCandidateSettings.token === trimmedAccessToken
    && now - cachedCandidateSettings.fetchedAt <= SETTINGS_CACHE_TTL_MS
  ) {
    return cachedCandidateSettings.data;
  }

  if (!forceRefresh && candidateSettingsRequestInFlight && inFlightToken === trimmedAccessToken) {
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

export async function exportCandidateData(accessToken: string): Promise<CandidateDataExportResult> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const endpointPath = getCandidateScopedPath('data-management/export');
  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}${endpointPath}`, {
      method: 'GET',
      headers: getCandidateRequestHeaders(nextAccessToken),
    })
  );

  if (!response.ok) {
    const errorRaw = await response.text();
    let errorPayload: unknown = null;
    if (errorRaw) {
      try {
        errorPayload = JSON.parse(errorRaw);
      } catch {
        errorPayload = errorRaw;
      }
    }

    forceReauthIfNeeded(response.status, errorPayload);
    const fallbackError = typeof errorPayload === 'string' ? errorPayload.trim() : '';
    throw new Error(
      getApiDetailMessage(errorPayload)
      || getApiMessage(errorPayload)
      || fallbackError
      || `Data export failed with status ${response.status}`
    );
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('application/json') || contentType.includes('text/json')) {
    const raw = await response.text();
    let payload: unknown = null;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = raw;
      }
    }

    const exportUrl = readDataExportUrl(payload);
    const fileName = readDataExportFileName(payload);
    const message = getApiSuccessMessage(payload);

    if (exportUrl) {
      return {
        type: 'url',
        url: exportUrl,
        fileName,
        message,
      };
    }

    return {
      type: 'message',
      message: message || 'Data export request submitted successfully.',
    };
  }

  if (contentType.startsWith('text/')) {
    const rawText = (await response.text()).trim();
    if (rawText.startsWith('http://') || rawText.startsWith('https://')) {
      return {
        type: 'url',
        url: rawText,
        fileName: null,
        message: null,
      };
    }

    return {
      type: 'message',
      message: rawText || 'Data export request submitted successfully.',
    };
  }

  const blob = await response.blob();
  const fileNameFromHeader = parseFileNameFromContentDisposition(response.headers.get('content-disposition'));

  return {
    type: 'blob',
    blob,
    fileName: fileNameFromHeader || getDefaultExportFileName(contentType),
    message: null,
  };
}

export async function updateCandidateNotificationSettings(
  accessToken: string,
  payload: Partial<CandidateSettingsNotificationSettings>
): Promise<string | null> {
  return patchCandidateSettings(accessToken, getCandidateSettingsPatchPath('notification-settings'), payload);
}

export async function updateCandidateAiPreferences(
  accessToken: string,
  payload: Partial<CandidateSettingsAiPreferences>
): Promise<string | null> {
  return patchCandidateSettings(accessToken, getCandidateSettingsPatchPath('ai-preferences'), payload);
}
