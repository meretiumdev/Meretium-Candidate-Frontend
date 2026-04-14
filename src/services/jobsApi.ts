import { forceReauthIfNeeded } from './authSession';

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

export interface CandidateJobsApiCompany {
  name: string;
  logo_url: string;
  is_verified: boolean;
}

export interface CandidateJobsApiJob {
  id: string;
  title: string;
  company: CandidateJobsApiCompany;
  location: string;
  job_type: string;
  min_salary: number | null;
  max_salary: number | null;
  currency: string;
  required_skills: string[];
  posted_at: string;
  description: string;
  match_percentage: number | null;
}

export interface CandidateJobDetailResponse extends CandidateJobsApiJob {
  department: string;
  work_mode: string;
  experience_level: string;
  company_description: string;
  company_industry: string;
  company_size_range: string;
  job_description_full: string;
  key_responsibilities: string[];
  benefits: string[];
  preferred_skills: string[];
  must_have_requirements: string[];
  nice_to_have_requirements: string[];
  applicant_count: number;
}

export interface GetCandidateJobsParams {
  skip?: number;
  limit?: number;
  date_posted?: string | null;
  job_type?: string | null;
  experience_level?: string | null;
  work_mode?: string | null;
  min_salary?: number | null;
  max_salary?: number | null;
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function asString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim();
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

function asNullableNumber(input: unknown): number | null {
  if (input === null || input === undefined || input === '') return null;
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
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
  const trimmedMsg = msg.trim();
  return trimmedMsg.length > 0 ? trimmedMsg : null;
}

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

function normalizeJob(raw: unknown): CandidateJobsApiJob | null {
  const root = asRecord(raw);
  if (!root) return null;

  const companyRaw = asRecord(root.company) || {};

  return {
    id: asString(root.id),
    title: asString(root.title),
    company: {
      name: asString(companyRaw.name),
      logo_url: asString(companyRaw.logo_url),
      is_verified: asBoolean(companyRaw.is_verified),
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
  };
}

function normalizeJobsResponse(payload: unknown): CandidateJobsApiJob[] {
  let jobsRaw: unknown[] = [];

  if (Array.isArray(payload)) {
    jobsRaw = payload;
  } else {
    const root = asRecord(payload) || {};
    if (Array.isArray(root.data)) jobsRaw = root.data;
    else if (Array.isArray(root.results)) jobsRaw = root.results;
  }

  return jobsRaw
    .map((item) => normalizeJob(item))
    .filter((item): item is CandidateJobsApiJob => item !== null);
}

function asNumber(input: unknown): number {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeJobDetailResponse(payload: unknown): CandidateJobDetailResponse {
  const base = normalizeJob(payload);
  const root = asRecord(payload) || {};

  return {
    id: base?.id || '',
    title: base?.title || '',
    company: base?.company || {
      name: '',
      logo_url: '',
      is_verified: false,
    },
    location: base?.location || '',
    job_type: base?.job_type || '',
    min_salary: base?.min_salary ?? null,
    max_salary: base?.max_salary ?? null,
    currency: base?.currency || '',
    required_skills: base?.required_skills || [],
    posted_at: base?.posted_at || '',
    description: base?.description || '',
    match_percentage: base?.match_percentage ?? null,
    department: asString(root.department),
    work_mode: asString(root.work_mode),
    experience_level: asString(root.experience_level),
    company_description: asString(root.company_description),
    company_industry: asString(root.company_industry),
    company_size_range: asString(root.company_size_range),
    job_description_full: asString(root.job_description_full),
    key_responsibilities: asStringArray(root.key_responsibilities),
    benefits: asStringArray(root.benefits),
    preferred_skills: asStringArray(root.preferred_skills),
    must_have_requirements: asStringArray(root.must_have_requirements),
    nice_to_have_requirements: asStringArray(root.nice_to_have_requirements),
    applicant_count: asNumber(root.applicant_count),
  };
}

export async function getCandidateJobs(
  accessToken: string,
  params: GetCandidateJobsParams = {}
): Promise<CandidateJobsApiJob[]> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const rawSkip = Number(params.skip);
  const rawLimit = Number(params.limit);
  const skip = Number.isFinite(rawSkip) ? Math.max(0, Math.trunc(rawSkip)) : 0;
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.trunc(rawLimit)) : 10;
  const minSalary = asNullableNumber(params.min_salary);
  const maxSalary = asNullableNumber(params.max_salary);

  const queryParams = new URLSearchParams();
  queryParams.set('skip', String(skip));
  queryParams.set('limit', String(limit));

  if (typeof params.date_posted === 'string' && params.date_posted.trim()) {
    queryParams.set('date_posted', params.date_posted.trim());
  }

  if (typeof params.job_type === 'string' && params.job_type.trim()) {
    queryParams.set('job_type', params.job_type.trim());
  }

  if (typeof params.experience_level === 'string' && params.experience_level.trim()) {
    queryParams.set('experience_level', params.experience_level.trim());
  }

  if (typeof params.work_mode === 'string' && params.work_mode.trim()) {
    queryParams.set('work_mode', params.work_mode.trim());
  }

  if (minSalary !== null) {
    queryParams.set('min_salary', String(Math.max(0, Math.trunc(minSalary))));
  }

  if (maxSalary !== null) {
    queryParams.set('max_salary', String(Math.max(0, Math.trunc(maxSalary))));
  }

  const response = await fetch(`${CANDIDATE_API_BASE_URL}/jobs?${queryParams.toString()}`, {
    method: 'GET',
    headers: getCandidateRequestHeaders(trimmedAccessToken),
  });

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
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `Jobs fetch failed with status ${response.status}`);
  }

  return normalizeJobsResponse(payload);
}

export async function getCandidateJobDetail(
  accessToken: string,
  jobId: string
): Promise<CandidateJobDetailResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedJobId = jobId.trim();
  if (!trimmedJobId) {
    throw new Error('Job id is required.');
  }

  const response = await fetch(`${CANDIDATE_API_BASE_URL}/jobs/${encodeURIComponent(trimmedJobId)}`, {
    method: 'GET',
    headers: getCandidateRequestHeaders(trimmedAccessToken),
  });

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
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `Job detail fetch failed with status ${response.status}`);
  }

  return normalizeJobDetailResponse(payload);
}
