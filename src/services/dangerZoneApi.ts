import { executeAuthorizedRequest, forceReauthIfNeeded } from './authSession';

const RAW_AUTH_API_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL?.trim() || '';

function isNgrokHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized.endsWith('.ngrok-free.app') || normalized.endsWith('.ngrok.app');
}

function getAuthApiBaseUrl(): string {
  if (!RAW_AUTH_API_BASE_URL) return '';
  return RAW_AUTH_API_BASE_URL.replace(/\/$/, '');
}

const AUTH_API_BASE_URL = getAuthApiBaseUrl();

function getAuthRequestHeaders(accessToken: string): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    if (/^https?:\/\//i.test(RAW_AUTH_API_BASE_URL)) {
      const parsed = new URL(RAW_AUTH_API_BASE_URL);
      if (isNgrokHost(parsed.hostname)) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }
    }
  } catch {
    // Ignore malformed URL
  }

  return headers;
}

function getDangerZonePath(action: 'deactivate-account' | 'delete-acount'): string {
  const normalizedBase = AUTH_API_BASE_URL.toLowerCase();
  const pathPrefix = normalizedBase.endsWith('/auth') ? '' : '/auth';
  return `${pathPrefix}/${action}`;
}

function getApiMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const message = (payload as { message?: unknown }).message;
  if (typeof message !== 'string') return null;
  const trimmed = message.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getApiSuccessMessage(payload: unknown): string | null {
  const topLevelMessage = getApiMessage(payload);
  if (topLevelMessage) return topLevelMessage;

  if (typeof payload !== 'object' || payload === null) return null;
  const data = (payload as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null) return null;

  const nestedMessage = (data as { message?: unknown }).message;
  if (typeof nestedMessage !== 'string') return null;
  const trimmed = nestedMessage.trim();
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

async function postDangerAction(accessToken: string, path: string): Promise<string | null> {
  if (!AUTH_API_BASE_URL) {
    throw new Error('Missing VITE_AUTH_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${AUTH_API_BASE_URL}${path}`, {
      method: 'POST',
      headers: getAuthRequestHeaders(nextAccessToken),
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
      || `Request failed with status ${response.status}`
    );
  }

  const code = getApiCode(payload);
  if (code && /(ERROR|FAIL)/i.test(code)) {
    throw new Error(
      getApiDetailMessage(payload)
      || getApiMessage(payload)
      || `Request failed with code ${code}`
    );
  }

  return getApiSuccessMessage(payload);
}

export async function deactivateAccount(accessToken: string): Promise<string | null> {
  return postDangerAction(accessToken, getDangerZonePath('deactivate-account'));
}

export async function deleteAccount(accessToken: string): Promise<string | null> {
  return postDangerAction(accessToken, getDangerZonePath('delete-acount'));
}
