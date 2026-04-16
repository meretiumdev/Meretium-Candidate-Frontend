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
    'Content-Type': 'application/json',
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

export interface CandidateApplicationScreeningAnswer {
  question_id: string;
  answer: string;
}

export type CandidateApplicationStatus =
  | 'APPLIED'
  | 'IN_REVIEW'
  | 'INTERVIEW'
  | 'OFFERED'
  | 'HIRED'
  | 'REJECTED';

export interface CandidateApplicationScreeningAnswerRead {
  question_id: string;
  question_text: string;
  answer: string | number | boolean | null;
}

export interface CandidateApplicationStatusHistoryItem {
  status: string;
  changed_at: string;
}

export interface CandidateApplicationItem {
  id: string;
  job_id: string;
  candidate_id: string;
  job_title_snapshot: string;
  company_name_snapshot: string;
  location_snapshot: string;
  cv_id: string;
  cover_letter: string;
  screening_answers: CandidateApplicationScreeningAnswerRead[];
  status: string;
  applied_at: string;
  interview_details: unknown | null;
  status_history: CandidateApplicationStatusHistoryItem[];
}

export interface CandidateApplicationsStats {
  total: number;
  applied: number;
  in_review: number;
  interview: number;
  offered: number;
  hired: number;
  rejected: number;
}

export interface CandidateApplicationsListResponse {
  stats: CandidateApplicationsStats;
  applications: CandidateApplicationItem[];
  total: number;
}

export interface GetCandidateApplicationsParams {
  skip?: number;
  limit?: number;
  status?: CandidateApplicationStatus | null;
}

export interface CandidateApplyJobPayload {
  cv_id: string;
  cover_letter: string;
  screening_answers: CandidateApplicationScreeningAnswer[];
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function asString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim();
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

function asNonNegativeInt(input: unknown, fallback = 0): number {
  const value = asNullableNumber(input);
  if (value === null) return fallback;
  return Math.max(0, Math.trunc(value));
}

function asAnswerValue(input: unknown): string | number | boolean | null {
  if (typeof input === 'string') return input;
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'boolean') return input;
  return null;
}

function normalizeScreeningAnswers(input: unknown): CandidateApplicationScreeningAnswerRead[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;

      return {
        question_id: asString(record.question_id),
        question_text: asString(record.question_text),
        answer: asAnswerValue(record.answer),
      };
    })
    .filter((item): item is CandidateApplicationScreeningAnswerRead => item !== null);
}

function normalizeStatusHistory(input: unknown): CandidateApplicationStatusHistoryItem[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;

      return {
        status: asString(record.status),
        changed_at: asString(record.changed_at),
      };
    })
    .filter((item): item is CandidateApplicationStatusHistoryItem => item !== null);
}

function normalizeApplicationItem(raw: unknown): CandidateApplicationItem | null {
  const record = asRecord(raw);
  if (!record) return null;

  const id = asString(record.id);
  if (!id) return null;

  return {
    id,
    job_id: asString(record.job_id),
    candidate_id: asString(record.candidate_id),
    job_title_snapshot: asString(record.job_title_snapshot),
    company_name_snapshot: asString(record.company_name_snapshot),
    location_snapshot: asString(record.location_snapshot),
    cv_id: asString(record.cv_id),
    cover_letter: asString(record.cover_letter),
    screening_answers: normalizeScreeningAnswers(record.screening_answers),
    status: asString(record.status),
    applied_at: asString(record.applied_at),
    interview_details: record.interview_details ?? null,
    status_history: normalizeStatusHistory(record.status_history),
  };
}

function normalizeApplicationsResponse(payload: unknown): CandidateApplicationsListResponse {
  const root = asRecord(payload) || {};
  const statsRecord = asRecord(root.stats) || {};
  const applicationsRaw = Array.isArray(root.applications) ? root.applications : [];

  const applications = applicationsRaw
    .map((item) => normalizeApplicationItem(item))
    .filter((item): item is CandidateApplicationItem => item !== null);

  const responseTotal = asNullableNumber(root.total);
  const statsTotal = asNullableNumber(statsRecord.total);

  const total = Math.max(
    0,
    Math.trunc(responseTotal ?? statsTotal ?? applications.length)
  );

  const inReview = asNonNegativeInt(statsRecord.in_review);
  const interview = asNonNegativeInt(statsRecord.interview);
  const offered = asNonNegativeInt(statsRecord.offered);
  const hired = asNonNegativeInt(statsRecord.hired);
  const rejected = asNonNegativeInt(statsRecord.rejected);
  const computedApplied = Math.max(0, total - inReview - interview - offered - hired - rejected);
  const applied = asNonNegativeInt(statsRecord.applied, computedApplied);

  return {
    stats: {
      total,
      applied,
      in_review: inReview,
      interview,
      offered,
      hired,
      rejected,
    },
    applications,
    total,
  };
}

export async function getCandidateApplications(
  accessToken: string,
  params: GetCandidateApplicationsParams = {}
): Promise<CandidateApplicationsListResponse> {
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

  const queryParams = new URLSearchParams();
  queryParams.set('skip', String(skip));
  queryParams.set('limit', String(limit));

  if (typeof params.status === 'string' && params.status.trim()) {
    queryParams.set('status', params.status.trim());
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/applications?${queryParams.toString()}`, {
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
      || `Applications fetch failed with status ${response.status}`
    );
  }

  return normalizeApplicationsResponse(payload);
}

export async function applyToCandidateJob(
  accessToken: string,
  jobId: string,
  payload: CandidateApplyJobPayload
): Promise<unknown> {
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

  const cvId = payload.cv_id.trim();
  if (!cvId) {
    throw new Error('CV selection is required.');
  }

  const coverLetter = payload.cover_letter.trim();
  if (!coverLetter) {
    throw new Error('Cover letter is required.');
  }

  const screeningAnswers = payload.screening_answers
    .map((item) => ({
      question_id: item.question_id.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question_id.length > 0);

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/applications/apply/${encodeURIComponent(trimmedJobId)}`, {
      method: 'POST',
      headers: getCandidateRequestHeaders(nextAccessToken),
      body: JSON.stringify({
        cv_id: cvId,
        cover_letter: coverLetter,
        screening_answers: screeningAnswers,
      }),
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
      || `Application submit failed with status ${response.status}`
    );
  }

  return responsePayload;
}
