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

export interface CandidateDashboardRecommendationCompany {
  name: string;
  logo_url: string;
  is_verified: boolean;
}

export interface CandidateDashboardRecommendationJob {
  id: string;
  title: string;
  company: CandidateDashboardRecommendationCompany;
  location: string;
  job_type: string;
  min_salary: number | null;
  max_salary: number | null;
  currency: string;
  required_skills: string[];
  posted_at: string;
  description: string;
  match_percentage: number | null;
  is_saved: boolean;
  recommendation_reason: string;
}

export interface CandidateDashboardRecommendationsResponse {
  items: CandidateDashboardRecommendationJob[];
  total: number | null;
}

export interface GetCandidateRecommendationsParams {
  top_n?: number;
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function asString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim();
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
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
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

function asStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
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

function normalizeRecommendationJob(raw: unknown): CandidateDashboardRecommendationJob | null {
  const root = asRecord(raw);
  if (!root) return null;

  const companyRecord = asRecord(root.company) || {};
  const companyName = asString(companyRecord.name) || asString(root.company_name) || asString(root.company);
  const companyLogoUrl = asString(companyRecord.logo_url) || asString(root.company_logo_url);
  const companyVerified = asBoolean(companyRecord.is_verified) || asBoolean(root.is_company_verified);
  const recommendationReason = asString(root.recommendation_reason)
    || asString(root.why_recommended)
    || asString(root.match_reason);

  return {
    id: asString(root.id),
    title: asString(root.title),
    company: {
      name: companyName,
      logo_url: companyLogoUrl,
      is_verified: companyVerified,
    },
    location: asString(root.location),
    job_type: asString(root.job_type),
    min_salary: asNullableNumber(root.min_salary),
    max_salary: asNullableNumber(root.max_salary),
    currency: asString(root.currency),
    required_skills: asStringArray(root.required_skills),
    posted_at: asString(root.posted_at),
    description: asString(root.description),
    match_percentage: asNullableNumber(root.match_percentage),
    is_saved: asBoolean(root.is_saved),
    recommendation_reason: recommendationReason,
  };
}

function normalizeRecommendationsResponse(payload: unknown): CandidateDashboardRecommendationsResponse {
  let itemsRaw: unknown[] = [];
  let total: number | null = null;

  if (Array.isArray(payload)) {
    itemsRaw = payload;
  } else {
    const root = asRecord(payload) || {};
    if (Array.isArray(root.items)) itemsRaw = root.items;
    else if (Array.isArray(root.data)) itemsRaw = root.data;
    else if (Array.isArray(root.results)) itemsRaw = root.results;
    else if (Array.isArray(root.recommendations)) itemsRaw = root.recommendations;
    total = asNullableNumber(root.total);
  }

  const items = itemsRaw
    .map((item) => normalizeRecommendationJob(item))
    .filter((item): item is CandidateDashboardRecommendationJob => item !== null);

  return {
    items,
    total: total === null ? null : Math.max(0, Math.trunc(total)),
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

export async function getCandidateRecommendations(
  accessToken: string,
  params: GetCandidateRecommendationsParams = {}
): Promise<CandidateDashboardRecommendationsResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const rawTopN = Number(params.top_n);
  const topN = Number.isFinite(rawTopN) ? Math.max(1, Math.trunc(rawTopN)) : 10;

  const queryParams = new URLSearchParams();
  queryParams.set('top_n', String(topN));

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/recommendations?${queryParams.toString()}`, {
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
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `Recommendations fetch failed with status ${response.status}`);
  }

  return normalizeRecommendationsResponse(payload);
}
