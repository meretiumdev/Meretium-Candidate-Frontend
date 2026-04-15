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

function getCandidateRequestHeaders(accessToken: string): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  // For direct ngrok URLs (non-dev-proxy usage), bypass ngrok browser interstitial.
  try {
    if (/^https?:\/\//i.test(RAW_CANDIDATE_API_BASE_URL)) {
      const parsed = new URL(RAW_CANDIDATE_API_BASE_URL);
      if (isNgrokHost(parsed.hostname)) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }
    }
  } catch {
    // ignore malformed URLs
  }

  return headers;
}

export interface CandidateDashboardPipelineStats {
  applied: number;
  under_review: number;
  interview: number;
  offered: number;
  rejected: number;
}

export interface CandidateDashboardOnboarding {
  is_cv_uploaded: boolean;
  is_profile_reviewed: boolean;
  is_skills_added: boolean;
  is_experience_added: boolean;
  is_onboarding_complete: boolean;
}

export interface CandidateDashboardResponse {
  onboarding: CandidateDashboardOnboarding;
  pipeline_stats: CandidateDashboardPipelineStats;
  profile_strength: number;
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function asNumber(input: unknown): number {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function asBoolean(input: unknown): boolean {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    const normalized = input.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  if (typeof input === 'number') {
    if (input === 1) return true;
    if (input === 0) return false;
  }
  return false;
}

function getApiMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const message = (payload as { message?: unknown }).message;
  if (typeof message !== 'string') return null;
  const trimmed = message.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getApiDetailMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === 'string') {
    const trimmed = detail.trim();
    return trimmed.length > 0 ? trimmed : null;
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

  const trimmed = msg.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeDashboardResponse(payload: unknown): CandidateDashboardResponse {
  const root = asRecord(payload) || {};
  const pipelineRaw = asRecord(root.pipeline_stats) || {};
  const onboardingRaw = asRecord(root.onboarding) || {};

  return {
    onboarding: {
      is_cv_uploaded: asBoolean(onboardingRaw.is_cv_uploaded),
      is_profile_reviewed: asBoolean(onboardingRaw.is_profile_reviewed),
      is_skills_added: asBoolean(onboardingRaw.is_skills_added),
      is_experience_added: asBoolean(onboardingRaw.is_experience_added),
      is_onboarding_complete: asBoolean(onboardingRaw.is_onboarding_complete),
    },
    pipeline_stats: {
      applied: asNumber(pipelineRaw.applied),
      under_review: asNumber(pipelineRaw.under_review),
      interview: asNumber(pipelineRaw.interview),
      offered: asNumber(pipelineRaw.offered),
      rejected: asNumber(pipelineRaw.rejected),
    },
    profile_strength: asNumber(root.profile_strength),
  };
}

export async function getCandidateDashboard(accessToken: string): Promise<CandidateDashboardResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/dashboard/`, {
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
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `Dashboard fetch failed with status ${response.status}`);
  }

  return normalizeDashboardResponse(payload);
}
