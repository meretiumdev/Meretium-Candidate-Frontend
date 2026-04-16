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

export interface CandidateApplyJobPayload {
  cv_id: string;
  cover_letter: string;
  screening_answers: CandidateApplicationScreeningAnswer[];
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
