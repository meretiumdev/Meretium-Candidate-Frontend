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
  note?: string;
  phase_metadata?: Record<string, unknown> | null;
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

export interface CandidateApplicationCvItem {
  id: string;
  file_name: string;
  file_url: string;
}

export interface CandidateApplicationInterviewDetails {
  date: string;
  time: string;
  location: string;
  link: string;
  status: string;
  candidate_response: string;
}

export interface CandidateApplicationOfferDetails {
  salary: string;
  benefits: string[];
  start_date: string;
  offer_extended_at: string;
  offer_expires_at: string;
  candidate_response: string;
  responded_at: string;
}

export interface CandidateApplicationDetail {
  id: string;
  status: string;
  job_title_snapshot: string;
  company_name_snapshot: string;
  location_snapshot: string;
  cv_id: string;
  cv: CandidateApplicationCvItem | null;
  cover_letter: string;
  screening_answers: CandidateApplicationScreeningAnswerRead[];
  interview_details: CandidateApplicationInterviewDetails | null;
  offer_details: CandidateApplicationOfferDetails | null;
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

export type CandidateApplicationsSortBy = 'recently_applied' | 'oldest';

export interface GetCandidateApplicationsParams {
  skip?: number;
  limit?: number;
  application_status?: CandidateApplicationStatus | null;
  sort_by?: CandidateApplicationsSortBy | null;
}

export interface CandidateApplyJobPayload {
  cv_id: string;
  cover_letter: string;
  screening_answers: CandidateApplicationScreeningAnswer[];
}

export interface CandidateGeneratedCoverLetterResponse {
  cover_letter: string;
  job_title: string;
  company_name: string;
}

export type CandidateOfferAction = 'accept' | 'decline';
export type CandidateInterviewAction = 'accept' | 'reschedule';

export interface CandidateInterviewResponsePayload {
  action: CandidateInterviewAction;
  preferred_date?: string;
  preferred_time?: string;
  note?: string;
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

function readStringFromRecord(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
  }
  return '';
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

  const normalized: CandidateApplicationStatusHistoryItem[] = [];

  for (const item of input) {
    const record = asRecord(item);
    if (!record) continue;

    const historyItem: CandidateApplicationStatusHistoryItem = {
      status: asString(record.status),
      changed_at: asString(record.changed_at),
      phase_metadata: asRecord(record.phase_metadata),
    };

    const note = asString(record.note);
    if (note) {
      historyItem.note = note;
    }

    normalized.push(historyItem);
  }

  return normalized;
}

function normalizeApplicationCv(input: unknown): CandidateApplicationCvItem | null {
  const record = asRecord(input);
  if (!record) return null;

  const id = asString(record.id);
  const fileUrl = readStringFromRecord(record, ['file_url', 'url']);
  if (!id && !fileUrl) return null;

  return {
    id,
    file_name: readStringFromRecord(record, ['file_name', 'name', 'filename']),
    file_url: fileUrl,
  };
}

function readAnswerValue(record: Record<string, unknown>): string | number | boolean | null {
  const direct = asAnswerValue(record.answer);
  if (direct !== null) return direct;

  const response = asAnswerValue(record.response);
  if (response !== null) return response;

  const value = asAnswerValue(record.value);
  if (value !== null) return value;

  for (const [key, candidate] of Object.entries(record)) {
    if (
      key === 'question_id'
      || key === 'id'
      || key === 'questionId'
      || key === 'question_text'
      || key === 'question'
      || key === 'label'
      || key === 'prompt'
    ) {
      continue;
    }

    const fallback = asAnswerValue(candidate);
    if (fallback !== null) return fallback;
  }

  return null;
}

function normalizeDetailScreeningAnswers(input: unknown): CandidateApplicationScreeningAnswerRead[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) return null;

      const questionId = readStringFromRecord(record, ['question_id', 'id', 'questionId']);
      const questionText = readStringFromRecord(record, ['question_text', 'question', 'label', 'prompt']);

      return {
        question_id: questionId || `question-${index + 1}`,
        question_text: questionText || `Question ${index + 1}`,
        answer: readAnswerValue(record),
      };
    })
    .filter((item): item is CandidateApplicationScreeningAnswerRead => item !== null);
}

function normalizeInterviewDetails(input: unknown): CandidateApplicationInterviewDetails | null {
  const record = asRecord(input);
  if (!record) return null;

  return {
    date: asString(record.date),
    time: asString(record.time),
    location: asString(record.location),
    link: asString(record.link),
    status: asString(record.status),
    candidate_response: asString(record.candidate_response),
  };
}

function normalizeOfferDetails(input: unknown): CandidateApplicationOfferDetails | null {
  const record = asRecord(input);
  if (!record) return null;

  return {
    salary: asString(record.salary),
    benefits: Array.isArray(record.benefits)
      ? record.benefits.map((item) => asString(item)).filter((item) => item.length > 0)
      : [],
    start_date: asString(record.start_date),
    offer_extended_at: asString(record.offer_extended_at),
    offer_expires_at: asString(record.offer_expires_at),
    candidate_response: asString(record.candidate_response),
    responded_at: asString(record.responded_at),
  };
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

function normalizeApplicationDetail(raw: unknown): CandidateApplicationDetail | null {
  const record = asRecord(raw);
  if (!record) return null;

  const id = asString(record.id);
  if (!id) return null;

  const cv = normalizeApplicationCv(record.cv);
  const cvId = asString(record.cv_id) || cv?.id || '';

  return {
    id,
    status: asString(record.status),
    job_title_snapshot: asString(record.job_title_snapshot),
    company_name_snapshot: asString(record.company_name_snapshot),
    location_snapshot: asString(record.location_snapshot),
    cv_id: cvId,
    cv,
    cover_letter: asString(record.cover_letter),
    screening_answers: normalizeDetailScreeningAnswers(record.screening_answers),
    interview_details: normalizeInterviewDetails(record.interview_details),
    offer_details: normalizeOfferDetails(record.offer_details),
    status_history: normalizeStatusHistory(record.status_history),
  };
}

function extractApplicationDetailFromActionPayload(payload: unknown): CandidateApplicationDetail | null {
  const direct = normalizeApplicationDetail(payload);
  if (direct) return direct;

  const root = asRecord(payload);
  if (!root) return null;

  const nestedCandidates: unknown[] = [
    root.application,
    root.application_detail,
    root.detail,
    root.data,
    root.result,
  ];

  for (const candidate of nestedCandidates) {
    const normalized = normalizeApplicationDetail(candidate);
    if (normalized) return normalized;

    const candidateRecord = asRecord(candidate);
    if (!candidateRecord) continue;

    const nestedNormalized = normalizeApplicationDetail(candidateRecord.application);
    if (nestedNormalized) return nestedNormalized;
  }

  return null;
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

  // `total` can represent filtered list count while `stats.total` can represent
  // overall application count for tabs/cards. Keep them independent.
  const total = Math.max(0, Math.trunc(responseTotal ?? applications.length));
  const statsTotalValue = Math.max(0, Math.trunc(statsTotal ?? total));

  const inReview = asNonNegativeInt(statsRecord.in_review);
  const interview = asNonNegativeInt(statsRecord.interview);
  const offered = asNonNegativeInt(statsRecord.offered);
  const hired = asNonNegativeInt(statsRecord.hired);
  const rejected = asNonNegativeInt(statsRecord.rejected);
  const computedApplied = Math.max(0, statsTotalValue - inReview - interview - offered - hired - rejected);
  const applied = asNonNegativeInt(statsRecord.applied, computedApplied);

  return {
    stats: {
      total: statsTotalValue,
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

function normalizeGeneratedCoverLetterResponse(payload: unknown): CandidateGeneratedCoverLetterResponse {
  const root = asRecord(payload) || {};

  return {
    cover_letter: asString(root.cover_letter),
    job_title: asString(root.job_title),
    company_name: asString(root.company_name),
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

  if (typeof params.application_status === 'string' && params.application_status.trim()) {
    queryParams.set('application_status', params.application_status.trim());
  }

  if (typeof params.sort_by === 'string' && params.sort_by.trim()) {
    queryParams.set('sort_by', params.sort_by.trim());
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

export async function getCandidateApplicationDetail(
  accessToken: string,
  applicationId: string
): Promise<CandidateApplicationDetail> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedApplicationId = applicationId.trim();
  if (!trimmedApplicationId) {
    throw new Error('Application id is required.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/applications/${encodeURIComponent(trimmedApplicationId)}`, {
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
      || `Application detail fetch failed with status ${response.status}`
    );
  }

  const normalized = normalizeApplicationDetail(payload);
  if (!normalized) {
    throw new Error('Received invalid application detail response.');
  }

  return normalized;
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

export async function generateCandidateCoverLetter(
  accessToken: string,
  jobId: string
): Promise<CandidateGeneratedCoverLetterResponse> {
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

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/cover-letter/generate`, {
      method: 'POST',
      headers: getCandidateRequestHeaders(nextAccessToken),
      body: JSON.stringify({ job_id: trimmedJobId }),
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
      || `Cover letter generation failed with status ${response.status}`
    );
  }

  const normalized = normalizeGeneratedCoverLetterResponse(payload);
  if (!normalized.cover_letter) {
    throw new Error('Received an empty cover letter.');
  }

  return normalized;
}

export async function respondToCandidateOffer(
  accessToken: string,
  applicationId: string,
  action: CandidateOfferAction
): Promise<CandidateApplicationDetail | null> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedApplicationId = applicationId.trim();
  if (!trimmedApplicationId) {
    throw new Error('Application id is required.');
  }

  const normalizedAction = action.trim().toLowerCase();
  if (normalizedAction !== 'accept' && normalizedAction !== 'decline') {
    throw new Error('Only accept and decline actions are allowed.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/applications/${encodeURIComponent(trimmedApplicationId)}/offer`, {
      method: 'POST',
      headers: getCandidateRequestHeaders(nextAccessToken),
      body: JSON.stringify({ action: normalizedAction }),
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
      || `Offer response failed with status ${response.status}`
    );
  }

  return extractApplicationDetailFromActionPayload(payload);
}

export async function respondToCandidateInterview(
  accessToken: string,
  applicationId: string,
  payload: CandidateInterviewResponsePayload
): Promise<CandidateApplicationDetail | null> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedApplicationId = applicationId.trim();
  if (!trimmedApplicationId) {
    throw new Error('Application id is required.');
  }

  const normalizedAction = payload.action.trim().toLowerCase();
  if (normalizedAction !== 'accept' && normalizedAction !== 'reschedule') {
    throw new Error('Only accept and reschedule actions are allowed.');
  }

  const preferredDate = payload.preferred_date?.trim() || '';
  const preferredTime = payload.preferred_time?.trim() || '';
  const note = payload.note?.trim() || '';

  const requestBody: Record<string, string> = {
    action: normalizedAction,
  };

  if (normalizedAction !== 'accept') {
    if (!preferredDate) {
      throw new Error('Preferred date is required for reschedule.');
    }
    if (!preferredTime) {
      throw new Error('Preferred time is required for reschedule.');
    }

    requestBody.preferred_date = preferredDate;
    requestBody.preferred_time = preferredTime;
    requestBody.note = note;
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/applications/${encodeURIComponent(trimmedApplicationId)}/interview`, {
      method: 'POST',
      headers: getCandidateRequestHeaders(nextAccessToken),
      body: JSON.stringify(requestBody),
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
      || `Interview response failed with status ${response.status}`
    );
  }

  return extractApplicationDetailFromActionPayload(responsePayload);
}
