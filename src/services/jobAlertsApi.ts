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

function asNumber(input: unknown): number {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function asNullableString(input: unknown): string | null {
  const value = asString(input);
  return value.length > 0 ? value : null;
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

function parseResponsePayload(raw: string): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export type CandidateJobAlertFrequency = 'daily' | 'weekly';

function toApiFrequency(value: CandidateJobAlertFrequency): 'DAILY' | 'WEEKLY' {
  return value === 'daily' ? 'DAILY' : 'WEEKLY';
}

export interface CreateCandidateJobAlertPayload {
  job_role: string;
  location?: string | null;
  work_mode?: string | null;
  frequency: CandidateJobAlertFrequency;
}

export interface CandidateJobAlert {
  id: string;
  job_role: string;
  location: string | null;
  work_mode: string | null;
  frequency: string;
}

export interface CandidateJobAlertCountItem {
  id: string;
  job_role: string;
  new_matches_count: number;
}

function normalizeJobAlert(raw: unknown): CandidateJobAlert | null {
  const root = asRecord(raw);
  if (!root) return null;

  return {
    id: asString(root.id),
    job_role: asString(root.job_role),
    location: asNullableString(root.location),
    work_mode: asNullableString(root.work_mode),
    frequency: asString(root.frequency),
  };
}

function normalizeJobAlertCountItem(raw: unknown): CandidateJobAlertCountItem | null {
  const root = asRecord(raw);
  if (!root) return null;

  const id = asString(root.id);
  const jobRole = asString(root.job_role);
  if (!id || !jobRole) return null;

  return {
    id,
    job_role: jobRole,
    new_matches_count: Math.max(0, Math.trunc(asNumber(root.new_matches_count))),
  };
}

function normalizeJobAlertsCount(payload: unknown): CandidateJobAlertCountItem[] {
  let itemsRaw: unknown[] = [];

  if (Array.isArray(payload)) {
    itemsRaw = payload;
  } else {
    const root = asRecord(payload) || {};
    if (Array.isArray(root.items)) itemsRaw = root.items;
    else if (Array.isArray(root.data)) itemsRaw = root.data;
    else if (Array.isArray(root.results)) itemsRaw = root.results;
  }

  return itemsRaw
    .map((item) => normalizeJobAlertCountItem(item))
    .filter((item): item is CandidateJobAlertCountItem => item !== null);
}

export async function createCandidateJobAlert(
  accessToken: string,
  payload: CreateCandidateJobAlertPayload
): Promise<CandidateJobAlert | null> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const jobRole = payload.job_role.trim();
  if (!jobRole) {
    throw new Error('Job role is required.');
  }

  const body = {
    job_role: jobRole,
    location: payload.location?.trim() || null,
    work_mode: payload.work_mode?.trim() || null,
    frequency: toApiFrequency(payload.frequency),
  };

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/job-alerts`, {
      method: 'POST',
      headers: {
        ...getCandidateRequestHeaders(nextAccessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  );

  const raw = await response.text();
  const responsePayload = parseResponsePayload(raw);

  if (!response.ok) {
    forceReauthIfNeeded(response.status, responsePayload);
    throw new Error(
      getApiDetailMessage(responsePayload)
      || getApiMessage(responsePayload)
      || `Create job alert failed with status ${response.status}`
    );
  }

  const direct = normalizeJobAlert(responsePayload);
  if (direct) return direct;

  const root = asRecord(responsePayload) || {};
  return normalizeJobAlert(root.data) || null;
}

export async function getCandidateJobAlertsCount(accessToken: string): Promise<CandidateJobAlertCountItem[]> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/job-alerts/count`, {
      method: 'GET',
      headers: getCandidateRequestHeaders(nextAccessToken),
    })
  );

  const raw = await response.text();
  const responsePayload = parseResponsePayload(raw);

  if (!response.ok) {
    forceReauthIfNeeded(response.status, responsePayload);
    throw new Error(
      getApiDetailMessage(responsePayload)
      || getApiMessage(responsePayload)
      || `Job alerts fetch failed with status ${response.status}`
    );
  }

  return normalizeJobAlertsCount(responsePayload);
}
