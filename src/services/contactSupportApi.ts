import { executeAuthorizedRequest, forceReauthIfNeeded } from './authSession';

const RAW_CANDIDATE_API_BASE_URL = import.meta.env.VITE_CANDIDATE_API_BASE_URL?.trim() || '';

export const CONTACT_SUPPORT_CATEGORIES = [
  'Account & Login',
  'Profile & CV',
  'Job Applications',
  'Technical Issue',
  'Billing & Subscription',
  'Privacy & Data',
  'Other',
] as const;

export type ContactSupportCategory = (typeof CONTACT_SUPPORT_CATEGORIES)[number];

export interface ContactSupportPayload {
  category: ContactSupportCategory;
  subject: string;
  description: string;
  file?: File | null;
}

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

function getApiMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const message = (payload as { message?: unknown }).message;
  if (typeof message !== 'string') return null;
  const trimmedMessage = message.trim();
  return trimmedMessage.length > 0 ? trimmedMessage : null;
}

function getApiSuccessMessage(payload: unknown): string | null {
  const topLevelMessage = getApiMessage(payload);
  if (topLevelMessage) return topLevelMessage;

  if (typeof payload !== 'object' || payload === null) return null;
  const data = (payload as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null) return null;

  const nestedMessage = (data as { message?: unknown }).message;
  if (typeof nestedMessage !== 'string') return null;
  const trimmedNestedMessage = nestedMessage.trim();
  return trimmedNestedMessage.length > 0 ? trimmedNestedMessage : null;
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

function getApiCode(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const code = (payload as { code?: unknown }).code;
  if (typeof code === 'string') return code;

  const errors = (payload as { errors?: unknown }).errors;
  if (typeof errors !== 'object' || errors === null) return null;
  const nestedCode = (errors as { code?: unknown }).code;
  return typeof nestedCode === 'string' ? nestedCode : null;
}

function parseResponsePayload(raw: string): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function submitContactSupportRequest(accessToken: string, payload: ContactSupportPayload): Promise<string | null> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const body = new FormData();
  body.append('category', payload.category);
  body.append('subject', payload.subject.trim());
  body.append('description', payload.description.trim());
  if (payload.file) {
    body.append('file', payload.file);
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/contact-support`, {
      method: 'POST',
      headers: getCandidateRequestHeaders(nextAccessToken),
      body,
    })
  );

  const raw = await response.text();
  const responsePayload = parseResponsePayload(raw);

  if (!response.ok) {
    forceReauthIfNeeded(response.status, responsePayload);
    throw new Error(
      getApiDetailMessage(responsePayload)
      || getApiMessage(responsePayload)
      || raw.trim()
      || `Contact support request failed with status ${response.status}`
    );
  }

  const code = getApiCode(responsePayload);
  if (code && /(ERROR|FAIL)/i.test(code)) {
    throw new Error(
      getApiDetailMessage(responsePayload)
      || getApiMessage(responsePayload)
      || `Contact support request failed with code ${code}`
    );
  }

  return getApiSuccessMessage(responsePayload);
}
