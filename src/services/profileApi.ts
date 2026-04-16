import { executeAuthorizedRequest, forceReauthIfNeeded } from './authSession';

const RAW_CANDIDATE_API_BASE_URL = import.meta.env.VITE_CANDIDATE_API_BASE_URL?.trim() || '';

function isNgrokHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized.endsWith('.ngrok-free.app') || normalized.endsWith('.ngrok.app');
}

function getCandidateApiBaseUrl(): string {
  if (!RAW_CANDIDATE_API_BASE_URL) return '';

  const trimmed = RAW_CANDIDATE_API_BASE_URL.replace(/\/$/, '');
  return trimmed;
}

const CANDIDATE_API_BASE_URL = getCandidateApiBaseUrl();

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

export type OpenToWorkStatus =
  | 'Open to opportunities'
  | 'Visible to matched recruiters'
  | 'Private';

export interface CandidateProfile {
  id: string;
  user_id: string;
  full_name: string;
  headline: string;
  location: string;
  about: string;
  profile_strength: number;
  is_open_to_work: boolean;
  open_to_work_status: OpenToWorkStatus;
  total_years_experience: number;
  share_slug: string;
  is_public: boolean;
  last_shared_at: string | null;
}

export interface CandidateJobPreferences {
  id: string;
  profile_id: string;
  roles: string[];
  locations: string[];
  work_mode: string;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  notice_period: string | null;
  open_to_relocation: boolean;
}

export interface UpdateJobPreferencesPayload {
  roles?: string[];
  locations?: string[];
  work_mode?: string;
  job_type?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  notice_period?: string | null;
  open_to_relocation?: boolean;
}

export interface UpdateProfilePayload {
  about?: string;
  headline?: string;
  location?: string;
  total_years_experience?: number;
  is_open_to_work?: boolean;
  open_to_work_status?: OpenToWorkStatus;
}

export interface CreateProfileSkillPayload {
  name: string;
  category: string;
  proficiency_level: number;
}

export interface CreateProfileExperiencePayload {
  role_title: string;
  company: string;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
  description: string;
  achievements: string[];
}

export interface UpdateProfileExperiencePayload {
  role_title?: string;
  company?: string;
  start_date?: string;
  end_date?: string | null;
  is_current?: boolean;
  description?: string;
  achievements?: string[];
}

export interface CandidateProfileResponse {
  profile: CandidateProfile;
  experiences: Array<Record<string, unknown>>;
  skills: unknown[];
  job_preferences: CandidateJobPreferences | null;
  cvs?: Array<Record<string, unknown>>;
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

function asNumber(input: unknown): number {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function asNullableNumber(input: unknown): number | null {
  if (input === null || input === undefined || input === '') return null;
  return asNumber(input);
}

function asBoolean(input: unknown): boolean {
  return input === true;
}

const OPEN_TO_WORK_STATUSES: OpenToWorkStatus[] = [
  'Open to opportunities',
  'Visible to matched recruiters',
  'Private',
];

function asOpenToWorkStatus(input: unknown, fallback: OpenToWorkStatus): OpenToWorkStatus {
  if (typeof input !== 'string') return fallback;
  const trimmed = input.trim();
  if (trimmed === 'Closed to opportunities') return 'Private';
  if (OPEN_TO_WORK_STATUSES.includes(trimmed as OpenToWorkStatus)) {
    return trimmed as OpenToWorkStatus;
  }
  return fallback;
}

function asRecordArray(input: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
}

function normalizeJobPreferences(raw: unknown): CandidateJobPreferences | null {
  const jobPreferencesRaw = asRecord(raw);
  if (!jobPreferencesRaw) return null;

  return {
    id: asString(jobPreferencesRaw.id),
    profile_id: asString(jobPreferencesRaw.profile_id),
    roles: Array.isArray(jobPreferencesRaw.roles) ? jobPreferencesRaw.roles.filter((item): item is string => typeof item === 'string') : [],
    locations: Array.isArray(jobPreferencesRaw.locations) ? jobPreferencesRaw.locations.filter((item): item is string => typeof item === 'string') : [],
    work_mode: asString(jobPreferencesRaw.work_mode),
    job_type: asString(jobPreferencesRaw.job_type),
    salary_min: asNullableNumber(jobPreferencesRaw.salary_min),
    salary_max: asNullableNumber(jobPreferencesRaw.salary_max),
    salary_currency: asNullableString(jobPreferencesRaw.salary_currency),
    notice_period: asNullableString(jobPreferencesRaw.notice_period),
    open_to_relocation: asBoolean(jobPreferencesRaw.open_to_relocation),
  };
}

function normalizeProfileResponse(payload: unknown): CandidateProfileResponse {
  const root = asRecord(payload) || {};
  const profileRaw = asRecord(root.profile) || root;
  const isOpenToWork = asBoolean(profileRaw.is_open_to_work);
  const fallbackStatus: OpenToWorkStatus = isOpenToWork ? 'Open to opportunities' : 'Private';

  const profile: CandidateProfile = {
    id: asString(profileRaw.id),
    user_id: asString(profileRaw.user_id),
    full_name: asString(profileRaw.full_name),
    headline: asString(profileRaw.headline),
    location: asString(profileRaw.location),
    about: asString(profileRaw.about),
    profile_strength: asNumber(profileRaw.profile_strength),
    is_open_to_work: isOpenToWork,
    open_to_work_status: asOpenToWorkStatus(profileRaw.open_to_work_status, fallbackStatus),
    total_years_experience: asNumber(profileRaw.total_years_experience),
    share_slug: asString(profileRaw.share_slug),
    is_public: asBoolean(profileRaw.is_public),
    last_shared_at: asNullableString(profileRaw.last_shared_at),
  };

  const job_preferences = normalizeJobPreferences(root.job_preferences);

  const response: CandidateProfileResponse = {
    profile,
    experiences: asRecordArray(root.experiences),
    skills: Array.isArray(root.skills) ? root.skills : [],
    job_preferences,
  };

  const cvs = asRecordArray(root.cvs);
  if (cvs.length > 0) {
    response.cvs = cvs;
  }

  return response;
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

export async function getCandidateProfile(accessToken: string): Promise<CandidateProfileResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/profile`, {
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
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `Profile fetch failed with status ${response.status}`);
  }

  return normalizeProfileResponse(payload);
}

export async function updateCandidateProfile(
  accessToken: string,
  updates: UpdateProfilePayload
): Promise<CandidateProfileResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('No changes to update.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/profile`, {
      method: 'PATCH',
      headers: getCandidateRequestHeaders(nextAccessToken, true),
      body: JSON.stringify(updates),
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
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `Profile update failed with status ${response.status}`);
  }

  return normalizeProfileResponse(payload);
}

export async function updateJobPreferences(
  accessToken: string,
  updates: UpdateJobPreferencesPayload
): Promise<CandidateJobPreferences | null> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('No changes to update.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/profile/job-preferences`, {
      method: 'PATCH',
      headers: getCandidateRequestHeaders(nextAccessToken, true),
      body: JSON.stringify(updates),
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
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `Job preferences update failed with status ${response.status}`);
  }

  const root = asRecord(payload) || {};
  return (
    normalizeJobPreferences(root.job_preferences)
    || normalizeJobPreferences(root.data)
    || normalizeJobPreferences(payload)
  );
}

export async function createProfileSkill(
  accessToken: string,
  payload: CreateProfileSkillPayload
): Promise<unknown> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/profile/skills`, {
      method: 'POST',
      headers: getCandidateRequestHeaders(nextAccessToken, true),
      body: JSON.stringify(payload),
    })
  );

  const raw = await response.text();
  let responsePayload: unknown = null;
  if (raw) {
    try {
      responsePayload = JSON.parse(raw);
    } catch {
      responsePayload = null;
    }
  }

  if (!response.ok) {
    forceReauthIfNeeded(response.status, responsePayload);
    throw new Error(getApiDetailMessage(responsePayload) || getApiMessage(responsePayload) || `Create skill failed with status ${response.status}`);
  }

  return responsePayload;
}

export async function deleteProfileSkill(accessToken: string, skillId: string): Promise<void> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedSkillId = skillId.trim();
  if (!trimmedSkillId) {
    throw new Error('Skill id is required.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/profile/skills/${encodeURIComponent(trimmedSkillId)}`, {
      method: 'DELETE',
      headers: getCandidateRequestHeaders(nextAccessToken),
    })
  );

  const raw = await response.text();
  let responsePayload: unknown = null;
  if (raw) {
    try {
      responsePayload = JSON.parse(raw);
    } catch {
      responsePayload = null;
    }
  }

  if (!response.ok) {
    forceReauthIfNeeded(response.status, responsePayload);
    throw new Error(
      getApiDetailMessage(responsePayload)
      || getApiMessage(responsePayload)
      || `Delete skill failed with status ${response.status}`
    );
  }
}

export async function createProfileExperience(
  accessToken: string,
  payload: CreateProfileExperiencePayload
): Promise<unknown> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/profile/experiences`, {
      method: 'POST',
      headers: getCandidateRequestHeaders(nextAccessToken, true),
      body: JSON.stringify(payload),
    })
  );

  const raw = await response.text();
  let responsePayload: unknown = null;
  if (raw) {
    try {
      responsePayload = JSON.parse(raw);
    } catch {
      responsePayload = null;
    }
  }

  if (!response.ok) {
    forceReauthIfNeeded(response.status, responsePayload);
    throw new Error(
      getApiDetailMessage(responsePayload)
      || getApiMessage(responsePayload)
      || `Create experience failed with status ${response.status}`
    );
  }

  return responsePayload;
}

export async function updateProfileExperience(
  accessToken: string,
  experienceId: string,
  payload: UpdateProfileExperiencePayload
): Promise<unknown> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedExperienceId = experienceId.trim();
  if (!trimmedExperienceId) {
    throw new Error('Experience id is required.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/profile/experiences/${encodeURIComponent(trimmedExperienceId)}`, {
      method: 'PATCH',
      headers: getCandidateRequestHeaders(nextAccessToken, true),
      body: JSON.stringify(payload),
    })
  );

  const raw = await response.text();
  let responsePayload: unknown = null;
  if (raw) {
    try {
      responsePayload = JSON.parse(raw);
    } catch {
      responsePayload = null;
    }
  }

  if (!response.ok) {
    forceReauthIfNeeded(response.status, responsePayload);
    throw new Error(
      getApiDetailMessage(responsePayload)
      || getApiMessage(responsePayload)
      || `Update experience failed with status ${response.status}`
    );
  }

  return responsePayload;
}

export async function deleteProfileExperience(accessToken: string, experienceId: string): Promise<void> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedExperienceId = experienceId.trim();
  if (!trimmedExperienceId) {
    throw new Error('Experience id is required.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/profile/experiences/${encodeURIComponent(trimmedExperienceId)}`, {
      method: 'DELETE',
      headers: getCandidateRequestHeaders(nextAccessToken),
    })
  );

  const raw = await response.text();
  let responsePayload: unknown = null;
  if (raw) {
    try {
      responsePayload = JSON.parse(raw);
    } catch {
      responsePayload = null;
    }
  }

  if (!response.ok) {
    forceReauthIfNeeded(response.status, responsePayload);
    throw new Error(
      getApiDetailMessage(responsePayload)
      || getApiMessage(responsePayload)
      || `Delete experience failed with status ${response.status}`
    );
  }
}
