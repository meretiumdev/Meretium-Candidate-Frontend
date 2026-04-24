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

function getCandidateRequestHeaders(accessToken: string, includeJsonContentType = false): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }

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

function getRecordValue(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function getStringValue(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim();
}

function getNumberValue(input: unknown): number {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function getBooleanValue(input: unknown): boolean {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    const normalized = input.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return false;
}

function assertApiSuccess(response: Response, raw: string, payload: unknown, action: string): void {
  if (!response.ok) {
    forceReauthIfNeeded(response.status, payload);
    throw new Error(
      getApiDetailMessage(payload)
      || getApiMessage(payload)
      || raw.trim()
      || `${action} failed with status ${response.status}`
    );
  }

  const code = getApiCode(payload);
  if (code && /(ERROR|FAIL)/i.test(code)) {
    throw new Error(
      getApiDetailMessage(payload)
      || getApiMessage(payload)
      || `${action} failed with code ${code}`
    );
  }
}

export interface CandidateNotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface CandidateNotificationsResponse {
  notifications: CandidateNotificationItem[];
  total: number;
  unread_notifications_count: number;
}

export interface CandidateUnreadCountsResponse {
  unread_notifications_count: number;
  unread_messages_count: number;
}

function normalizeNotificationItem(input: unknown): CandidateNotificationItem {
  const raw = getRecordValue(input) || {};

  return {
    id: getStringValue(raw.id),
    user_id: getStringValue(raw.user_id),
    type: getStringValue(raw.type),
    title: getStringValue(raw.title),
    message: getStringValue(raw.message),
    data: getRecordValue(raw.data),
    is_read: getBooleanValue(raw.is_read),
    created_at: getStringValue(raw.created_at),
    updated_at: getStringValue(raw.updated_at),
  };
}

function normalizeNotificationsPayload(payload: unknown): CandidateNotificationsResponse {
  const payloadRecord = getRecordValue(payload) || {};
  const dataRecord = getRecordValue(payloadRecord.data);
  const source = dataRecord || payloadRecord;

  const notificationsRaw = Array.isArray(source.notifications) ? source.notifications : [];
  const notifications = notificationsRaw
    .map((item) => normalizeNotificationItem(item))
    .filter((item) => item.id);

  return {
    notifications,
    total: Math.max(0, getNumberValue(source.total)),
    unread_notifications_count: Math.max(0, getNumberValue(source.unread_notifications_count)),
  };
}

function normalizeUnreadCountsPayload(payload: unknown): CandidateUnreadCountsResponse {
  const payloadRecord = getRecordValue(payload) || {};
  const dataRecord = getRecordValue(payloadRecord.data);
  const source = dataRecord || payloadRecord;

  return {
    unread_notifications_count: Math.max(0, getNumberValue(source.unread_notifications_count)),
    unread_messages_count: Math.max(0, getNumberValue(source.unread_messages_count)),
  };
}

export async function getCandidateNotifications(
  accessToken: string,
  options?: { skip?: number; limit?: number }
): Promise<CandidateNotificationsResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const queryParams = new URLSearchParams();
  queryParams.set('skip', String(Math.max(0, options?.skip ?? 0)));
  queryParams.set('limit', String(Math.max(1, options?.limit ?? 30)));

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/notifications?${queryParams.toString()}`, {
      method: 'GET',
      headers: getCandidateRequestHeaders(nextAccessToken),
    })
  );

  const raw = await response.text();
  const responsePayload = parseResponsePayload(raw);
  assertApiSuccess(response, raw, responsePayload, 'Fetch notifications');

  return normalizeNotificationsPayload(responsePayload);
}

export async function getCandidateUnreadCounts(accessToken: string): Promise<CandidateUnreadCountsResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/notifications/unread-count`, {
      method: 'GET',
      headers: getCandidateRequestHeaders(nextAccessToken),
    })
  );

  const raw = await response.text();
  const responsePayload = parseResponsePayload(raw);
  assertApiSuccess(response, raw, responsePayload, 'Fetch unread counts');

  return normalizeUnreadCountsPayload(responsePayload);
}

export async function markCandidateNotificationRead(
  accessToken: string,
  notificationId: string
): Promise<void> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedNotificationId = notificationId.trim();
  if (!trimmedNotificationId) {
    throw new Error('Notification id is required.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/notifications/${encodeURIComponent(trimmedNotificationId)}/read`, {
      method: 'PATCH',
      headers: getCandidateRequestHeaders(nextAccessToken),
    })
  );

  const raw = await response.text();
  const responsePayload = parseResponsePayload(raw);
  assertApiSuccess(response, raw, responsePayload, 'Mark notification as read');
}

export async function markAllCandidateNotificationsRead(accessToken: string): Promise<void> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/notifications/read-all`, {
      method: 'POST',
      headers: getCandidateRequestHeaders(nextAccessToken),
    })
  );

  const raw = await response.text();
  const responsePayload = parseResponsePayload(raw);
  assertApiSuccess(response, raw, responsePayload, 'Mark all notifications as read');
}
