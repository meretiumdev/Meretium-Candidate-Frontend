import store, { logout, refreshTokens } from '../redux/store';
import { refreshAccessToken } from './authApi';

function readString(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getApiCode(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const topLevelCode = readString((payload as { code?: unknown }).code);
  if (topLevelCode) return topLevelCode;

  const errors = (payload as { errors?: unknown }).errors;
  if (typeof errors !== 'object' || errors === null) return null;

  return readString((errors as { code?: unknown }).code);
}

function getApiMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  return readString((payload as { message?: unknown }).message);
}

function getApiDetailMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === 'string') return readString(detail);
  if (!Array.isArray(detail) || detail.length === 0) return null;

  const firstDetail = detail[0];
  if (typeof firstDetail === 'string') return readString(firstDetail);
  if (typeof firstDetail !== 'object' || firstDetail === null) return null;

  return readString((firstDetail as { msg?: unknown }).msg);
}

function hasInvalidTokenText(input: string): boolean {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return false;

  return (
    normalized.includes('token is invalid')
    || normalized.includes('invalid token')
    || normalized.includes('token not valid')
    || normalized.includes('token has expired')
    || normalized.includes('invalid signature')
  );
}

function shouldForceAuth(status: number, payload: unknown): boolean {
  if (status === 401) return true;

  const code = getApiCode(payload)?.toLowerCase() || '';
  if (code.includes('token')) return true;

  const message = getApiMessage(payload);
  if (message && hasInvalidTokenText(message)) return true;

  const detailMessage = getApiDetailMessage(payload);
  if (detailMessage && hasInvalidTokenText(detailMessage)) return true;

  return false;
}

function parseResponsePayload(raw: string): unknown {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readResponsePayload(response: Response): Promise<unknown> {
  try {
    const raw = await response.clone().text();
    return parseResponsePayload(raw);
  } catch {
    return null;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessTokenSilently(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const currentRefreshToken = store.getState().auth.refreshToken?.trim() || '';
    if (!currentRefreshToken) return false;

    try {
      const response = await refreshAccessToken({ refresh_token: currentRefreshToken });
      store.dispatch(refreshTokens(response));
      const nextAccessToken = store.getState().auth.accessToken?.trim() || '';
      return nextAccessToken.length > 0;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function executeAuthorizedRequest(
  accessToken: string,
  request: (token: string) => Promise<Response>
): Promise<Response> {
  const firstResponse = await request(accessToken);
  if (firstResponse.ok) return firstResponse;

  const firstPayload = await readResponsePayload(firstResponse);
  if (!shouldForceAuth(firstResponse.status, firstPayload)) {
    return firstResponse;
  }

  const refreshed = await refreshAccessTokenSilently();
  if (!refreshed) return firstResponse;

  const nextAccessToken = store.getState().auth.accessToken?.trim() || '';
  if (!nextAccessToken) return firstResponse;

  return request(nextAccessToken);
}

export function forceReauthIfNeeded(status: number, payload: unknown): void {
  if (!shouldForceAuth(status, payload)) return;

  store.dispatch(logout());

  if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
    window.location.replace('/auth');
  }
}
