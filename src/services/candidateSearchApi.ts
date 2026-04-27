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

export interface CandidateSearchJob {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string;
  location: string;
  job_type: string;
}

export interface CandidateSearchCompany {
  id: string;
  name: string;
  logo_url: string;
  location: string;
}

export interface CandidateSearchSkill {
  name: string;
}

export interface CandidateSearchResponse {
  jobs: CandidateSearchJob[];
  companies: CandidateSearchCompany[];
  skills: CandidateSearchSkill[];
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
    // Ignore malformed URL.
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

function getApiMessage(payload: unknown): string | null {
  const root = asRecord(payload);
  if (!root) return null;

  const message = asString(root.message);
  return message || null;
}

function getApiDetailMessage(payload: unknown): string | null {
  const root = asRecord(payload);
  if (!root) return null;

  const detail = root.detail;
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

  const firstDetailRecord = asRecord(firstDetail);
  const msg = asString(firstDetailRecord?.msg);
  return msg || null;
}

function normalizeSearchJob(input: unknown): CandidateSearchJob | null {
  const root = asRecord(input);
  if (!root) return null;

  const id = asString(root.id);
  if (!id) return null;

  return {
    id,
    title: asString(root.title),
    company_name: asString(root.company_name),
    company_logo_url: asString(root.company_logo_url),
    location: asString(root.location),
    job_type: asString(root.job_type),
  };
}

function normalizeSearchCompany(input: unknown): CandidateSearchCompany | null {
  const root = asRecord(input);
  if (!root) return null;

  const id = asString(root.id);
  if (!id) return null;

  return {
    id,
    name: asString(root.name),
    logo_url: asString(root.logo_url),
    location: asString(root.location),
  };
}
//
function normalizeSearchSkill(input: unknown): CandidateSearchSkill | null {
  const root = asRecord(input);
  if (!root) return null;

  const name = asString(root.name);
  if (!name) return null;

  return { name };
}

function normalizeSearchResponse(payload: unknown): CandidateSearchResponse {
  const root = asRecord(payload) || {};
  const jobsRaw = Array.isArray(root.jobs) ? root.jobs : [];
  const companiesRaw = Array.isArray(root.companies) ? root.companies : [];
  const skillsRaw = Array.isArray(root.skills) ? root.skills : [];

  return {
    jobs: jobsRaw
      .map((item) => normalizeSearchJob(item))
      .filter((item): item is CandidateSearchJob => item !== null),
    companies: companiesRaw
      .map((item) => normalizeSearchCompany(item))
      .filter((item): item is CandidateSearchCompany => item !== null),
    skills: skillsRaw
      .map((item) => normalizeSearchSkill(item))
      .filter((item): item is CandidateSearchSkill => item !== null),
  };
}

export async function searchCandidateDirectory(
  accessToken: string,
  search: string
): Promise<CandidateSearchResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedSearch = search.trim();
  if (!trimmedSearch) {
    return { jobs: [], companies: [], skills: [] };
  }

  const queryParams = new URLSearchParams();
  queryParams.set('search', trimmedSearch);

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/search?${queryParams.toString()}`, {
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
      || `Search failed with status ${response.status}`
    );
  }

  return normalizeSearchResponse(payload);
}
