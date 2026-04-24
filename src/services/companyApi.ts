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

export type CandidateCompanyJobStatus = 'ACTIVE' | 'CLOSED';
export type CandidateCompanyJobsSortBy = 'most_relevant' | 'highest_salary' | 'most_recent';

export interface CandidateCompanyStats {
  jobs_posted: number | null;
  applicants_count: number | null;
  response_rate: string;
  last_active: string;
}

export interface CandidateCompanySocialLinks {
  linkedin: string;
  twitter: string;
  website: string;
}

export interface CandidateCompanyDetail {
  id: string;
  name: string;
  tagline: string;
  description: string;
  industry: string;
  size_range: string;
  location: string;
  work_mode: string;
  founded_year: string;
  website: string;
  email: string;
  logo_url: string;
  banner_url: string;
  is_verified: boolean;
  stats: CandidateCompanyStats;
  social_links: CandidateCompanySocialLinks;
}

export interface CandidateCompanyJobItem {
  id: string;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  min_salary: number | null;
  max_salary: number | null;
  currency: string;
  status: CandidateCompanyJobStatus | '';
  posted_at: string;
  required_skills: string[];
  is_company_verified: boolean;
}

export interface CandidateCompanyJobsResponse {
  items: CandidateCompanyJobItem[];
  total: number | null;
}

export interface GetCandidateCompanyJobsParams {
  skip?: number;
  limit?: number;
  search?: string | null;
  status?: CandidateCompanyJobStatus | null;
  sort_by?: CandidateCompanyJobsSortBy | null;
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function asString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim();
}

function asResponseRate(input: unknown): string {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return `${input}%`;
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return '';
    if (trimmed.endsWith('%')) return trimmed;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return `${parsed}%`;
    return trimmed;
  }

  return '';
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

function normalizeCompanyDetail(payload: unknown): CandidateCompanyDetail {
  const root = asRecord(payload) || {};
  const dataRaw = asRecord(root.data);
  const companyRaw = asRecord(root.company) || dataRaw || root;
  const statsRaw = asRecord(companyRaw.stats) || asRecord(root.stats) || {};
  const socialRaw = asRecord(companyRaw.social_links) || asRecord(root.social_links) || {};

  const website = asString(companyRaw.website) || asString(socialRaw.website);
  const socialLinks: CandidateCompanySocialLinks = {
    linkedin: asString(socialRaw.linkedin) || asString(companyRaw.linkedin_url),
    twitter: asString(socialRaw.twitter) || asString(companyRaw.twitter_url),
    website,
  };

  return {
    id: asString(companyRaw.id),
    name: asString(companyRaw.name),
    tagline: asString(companyRaw.tagline) || asString(companyRaw.headline),
    description: asString(companyRaw.description) || asString(companyRaw.about),
    industry: asString(companyRaw.industry),
    size_range: asString(companyRaw.size_range)
      || asString(companyRaw.company_size_range)
      || asString(companyRaw.size),
    location: asString(companyRaw.location) || asString(companyRaw.headquarters),
    work_mode: asString(companyRaw.work_mode),
    founded_year: asString(companyRaw.founded_year)
      || asString(companyRaw.founded)
      || asString(companyRaw.year_founded),
    website,
    email: asString(companyRaw.email) || asString(companyRaw.contact_email),
    logo_url: asString(companyRaw.logo_url) || asString(companyRaw.logo),
    banner_url: asString(companyRaw.banner_url) || asString(companyRaw.cover_image_url),
    is_verified: asBoolean(companyRaw.is_verified),
    stats: {
      jobs_posted: asNullableNumber(statsRaw.jobs_posted) ?? asNullableNumber(companyRaw.jobs_posted),
      applicants_count:
        asNullableNumber(statsRaw.applicants_count)
        ?? asNullableNumber(companyRaw.applicants_count)
        ?? asNullableNumber(statsRaw.applicants),
      response_rate: asResponseRate(statsRaw.response_rate ?? companyRaw.response_rate),
      last_active: asString(statsRaw.last_active)
        || asString(statsRaw.last_active_at)
        || asString(companyRaw.last_active)
        || asString(companyRaw.last_active_at),
    },
    social_links: socialLinks,
  };
}

function normalizeCompanyJob(raw: unknown): CandidateCompanyJobItem | null {
  const root = asRecord(raw);
  if (!root) return null;

  const jobRaw = asRecord(root.job) || root;
  const companyRaw = asRecord(jobRaw.company) || asRecord(root.company) || {};
  const rawStatus = asString(jobRaw.status).toUpperCase();
  const status = rawStatus === 'ACTIVE' || rawStatus === 'CLOSED' ? rawStatus : '';

  return {
    id: asString(jobRaw.id),
    title: asString(jobRaw.title),
    company_name: asString(companyRaw.name) || asString(jobRaw.company_name),
    location: asString(jobRaw.location),
    job_type: asString(jobRaw.job_type),
    min_salary: asNullableNumber(jobRaw.min_salary),
    max_salary: asNullableNumber(jobRaw.max_salary),
    currency: asString(jobRaw.currency),
    status,
    posted_at: asString(jobRaw.posted_at),
    required_skills: asStringArray(jobRaw.required_skills),
    is_company_verified: asBoolean(companyRaw.is_verified) || asBoolean(jobRaw.is_company_verified),
  };
}

function normalizeCompanyJobsResponse(payload: unknown): CandidateCompanyJobsResponse {
  const root = asRecord(payload) || {};

  let itemsRaw: unknown[] = [];
  if (Array.isArray(payload)) itemsRaw = payload;
  else if (Array.isArray(root.items)) itemsRaw = root.items;
  else if (Array.isArray(root.jobs)) itemsRaw = root.jobs;
  else if (Array.isArray(root.data)) itemsRaw = root.data;
  else if (Array.isArray(root.results)) itemsRaw = root.results;

  const items = itemsRaw
    .map((item) => normalizeCompanyJob(item))
    .filter((item): item is CandidateCompanyJobItem => item !== null && item.id.length > 0);

  const total = asNullableNumber(root.total);

  return {
    items,
    total: total === null ? null : Math.max(0, Math.trunc(total)),
  };
}

export async function getCandidateCompanyDetail(
  accessToken: string,
  companyId: string
): Promise<CandidateCompanyDetail> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedCompanyId = companyId.trim();
  if (!trimmedCompanyId) {
    throw new Error('Company id is required.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/companies/${encodeURIComponent(trimmedCompanyId)}`, {
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
    throw new Error(
      getApiDetailMessage(payload)
      || getApiMessage(payload)
      || `Company fetch failed with status ${response.status}`
    );
  }

  return normalizeCompanyDetail(payload);
}

export async function getCandidateCompanyJobs(
  accessToken: string,
  companyId: string,
  params: GetCandidateCompanyJobsParams = {}
): Promise<CandidateCompanyJobsResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedCompanyId = companyId.trim();
  if (!trimmedCompanyId) {
    throw new Error('Company id is required.');
  }

  const rawSkip = Number(params.skip);
  const rawLimit = Number(params.limit);
  const skip = Number.isFinite(rawSkip) ? Math.max(0, Math.trunc(rawSkip)) : 0;
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.trunc(rawLimit)) : 10;

  const queryParams = new URLSearchParams();
  queryParams.set('skip', String(skip));
  queryParams.set('limit', String(limit));

  if (typeof params.search === 'string' && params.search.trim()) {
    queryParams.set('search', params.search.trim());
  }

  if (typeof params.status === 'string' && params.status.trim()) {
    queryParams.set('status', params.status.trim().toUpperCase());
  }

  if (typeof params.sort_by === 'string' && params.sort_by.trim()) {
    queryParams.set('sort_by', params.sort_by.trim());
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/companies/${encodeURIComponent(trimmedCompanyId)}/jobs?${queryParams.toString()}`, {
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
    throw new Error(
      getApiDetailMessage(payload)
      || getApiMessage(payload)
      || `Company jobs fetch failed with status ${response.status}`
    );
  }

  return normalizeCompanyJobsResponse(payload);
}
