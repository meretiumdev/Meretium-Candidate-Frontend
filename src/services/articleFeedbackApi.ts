import { executeAuthorizedRequest, forceReauthIfNeeded } from './authSession';

const RAW_ADMIN_API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL?.trim() || '';

function isNgrokHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized.endsWith('.ngrok-free.app') || normalized.endsWith('.ngrok.app');
}

function getAdminApiBaseUrl(): string {
  if (!RAW_ADMIN_API_BASE_URL) return '';
  return RAW_ADMIN_API_BASE_URL.replace(/\/$/, '');
}

const ADMIN_API_BASE_URL = getAdminApiBaseUrl();

function getAdminRequestHeaders(accessToken: string): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  try {
    if (/^https?:\/\//i.test(RAW_ADMIN_API_BASE_URL)) {
      const parsed = new URL(RAW_ADMIN_API_BASE_URL);
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

export interface SubmitArticleFeedbackPayload {
  article_id: string;
  is_helpful: boolean;
}

export async function submitArticleFeedback(
  accessToken: string,
  payload: SubmitArticleFeedbackPayload
): Promise<string | null> {
  if (!ADMIN_API_BASE_URL) {
    throw new Error('Missing VITE_ADMIN_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedArticleId = payload.article_id.trim();
  if (!trimmedArticleId) {
    throw new Error('Article id is required.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${ADMIN_API_BASE_URL}/article-feedback/submit`, {
      method: 'POST',
      headers: getAdminRequestHeaders(nextAccessToken),
      body: JSON.stringify({
        article_id: trimmedArticleId,
        is_helpful: payload.is_helpful,
      }),
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
      || `Submit article feedback failed with status ${response.status}`
    );
  }

  const code = getApiCode(responsePayload);
  if (code && /(ERROR|FAIL)/i.test(code)) {
    throw new Error(
      getApiDetailMessage(responsePayload)
      || getApiMessage(responsePayload)
      || `Submit article feedback failed with code ${code}`
    );
  }

  return getApiMessage(responsePayload);
}
