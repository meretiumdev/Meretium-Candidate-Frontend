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

function normalizeConversationsPayload(payload: unknown): unknown[] {
  const direct = Array.isArray(payload) ? payload : null;
  if (direct) return direct;

  const payloadObj = getRecordValue(payload);
  if (!payloadObj) return [];

  const nestedData = payloadObj.data;
  if (Array.isArray(nestedData)) return nestedData;

  const dataObj = getRecordValue(nestedData);
  const dataItems = dataObj?.items;
  if (Array.isArray(dataItems)) return dataItems;

  const topLevelItems = payloadObj.items;
  return Array.isArray(topLevelItems) ? topLevelItems : [];
}

function normalizeMessagesPayload(payload: unknown): Record<string, unknown> {
  const payloadObj = getRecordValue(payload);
  if (!payloadObj) return {};

  const dataObj = getRecordValue(payloadObj.data);
  return dataObj || payloadObj;
}

function normalizeSentMessagePayload(payload: unknown): unknown {
  const payloadObj = getRecordValue(payload);
  if (!payloadObj) return payload;

  const dataObj = getRecordValue(payloadObj.data);
  if (!dataObj) return payloadObj;

  const messageObj = getRecordValue(dataObj.message);
  if (messageObj) return messageObj;

  return dataObj;
}

export interface CandidateConversationSummary {
  id: string;
  job_id: string;
  job_title_snapshot: string;
  company_name_snapshot: string;
  application_id: string;
  application_status: string;
  recruiter_user_id: string;
  recruiter_name_snapshot: string;
  created_at: string;
  updated_at: string;
  last_message: string;
  unread_count: number;
}

export interface CandidateConversationDetail extends CandidateConversationSummary {
  candidate_id: string;
}

export interface CandidateConversationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  message_type: string;
  content: string;
  event_metadata: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface CandidateConversationMessagesResponse {
  conversation: CandidateConversationDetail | null;
  messages: CandidateConversationMessage[];
  total: number;
}

function normalizeConversationSummary(input: unknown): CandidateConversationSummary {
  const raw = getRecordValue(input) || {};

  return {
    id: getStringValue(raw.id),
    job_id: getStringValue(raw.job_id),
    job_title_snapshot: getStringValue(raw.job_title_snapshot),
    company_name_snapshot: getStringValue(raw.company_name_snapshot),
    application_id: getStringValue(raw.application_id),
    application_status: getStringValue(raw.application_status),
    recruiter_user_id: getStringValue(raw.recruiter_user_id),
    recruiter_name_snapshot: getStringValue(raw.recruiter_name_snapshot),
    created_at: getStringValue(raw.created_at),
    updated_at: getStringValue(raw.updated_at),
    last_message: getStringValue(raw.last_message),
    unread_count: getNumberValue(raw.unread_count),
  };
}

function normalizeConversationDetail(input: unknown): CandidateConversationDetail | null {
  const raw = getRecordValue(input);
  if (!raw) return null;

  const summary = normalizeConversationSummary(raw);

  return {
    ...summary,
    candidate_id: getStringValue(raw.candidate_id),
  };
}

function normalizeConversationMessage(input: unknown): CandidateConversationMessage {
  const raw = getRecordValue(input) || {};
  const eventMetadataRaw = getRecordValue(raw.event_metadata);
  const isReadRaw = raw.is_read;

  return {
    id: getStringValue(raw.id),
    conversation_id: getStringValue(raw.conversation_id),
    sender_id: getStringValue(raw.sender_id),
    sender_role: getStringValue(raw.sender_role),
    message_type: getStringValue(raw.message_type),
    content: getStringValue(raw.content),
    event_metadata: eventMetadataRaw,
    is_read: typeof isReadRaw === 'boolean' ? isReadRaw : false,
    created_at: getStringValue(raw.created_at),
  };
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

export async function getCandidateConversations(
  accessToken: string,
  params?: { q?: string }
): Promise<CandidateConversationSummary[]> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const queryParams = new URLSearchParams();
  const q = params?.q?.trim() || '';
  if (q) queryParams.set('q', q);
  const querySuffix = queryParams.toString() ? `?${queryParams.toString()}` : '';

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/messaging/conversations${querySuffix}`, {
      method: 'GET',
      headers: getCandidateRequestHeaders(nextAccessToken),
    })
  );

  const raw = await response.text();
  const responsePayload = parseResponsePayload(raw);
  assertApiSuccess(response, raw, responsePayload, 'Fetch conversations');

  const conversationItems = normalizeConversationsPayload(responsePayload);
  return conversationItems
    .map((item) => normalizeConversationSummary(item))
    .filter((item) => item.id);
}

export async function getCandidateConversationMessages(
  accessToken: string,
  conversationId: string,
  options?: { skip?: number; limit?: number }
): Promise<CandidateConversationMessagesResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedConversationId = conversationId.trim();
  if (!trimmedConversationId) {
    throw new Error('Conversation id is required.');
  }

  const queryParams = new URLSearchParams();
  queryParams.set('skip', String(Math.max(0, options?.skip ?? 0)));
  queryParams.set('limit', String(Math.max(1, options?.limit ?? 30)));

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(
      `${CANDIDATE_API_BASE_URL}/messaging/conversations/${encodeURIComponent(trimmedConversationId)}/messages?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: getCandidateRequestHeaders(nextAccessToken),
      }
    )
  );

  const raw = await response.text();
  const responsePayload = parseResponsePayload(raw);
  assertApiSuccess(response, raw, responsePayload, 'Fetch conversation messages');

  const normalizedPayload = normalizeMessagesPayload(responsePayload);
  const conversation = normalizeConversationDetail(normalizedPayload.conversation);
  const messagesRaw = Array.isArray(normalizedPayload.messages) ? normalizedPayload.messages : [];
  const messages = messagesRaw.map((item) => normalizeConversationMessage(item)).filter((item) => item.id);
  const total = getNumberValue(normalizedPayload.total) || messages.length;

  return {
    conversation,
    messages,
    total,
  };
}

export async function sendCandidateConversationMessage(
  accessToken: string,
  conversationId: string,
  payload: { content: string }
): Promise<CandidateConversationMessage> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedConversationId = conversationId.trim();
  if (!trimmedConversationId) {
    throw new Error('Conversation id is required.');
  }

  const trimmedContent = payload.content.trim();
  if (!trimmedContent) {
    throw new Error('Message content is required.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(
      `${CANDIDATE_API_BASE_URL}/messaging/conversations/${encodeURIComponent(trimmedConversationId)}/messages`,
      {
        method: 'POST',
        headers: getCandidateRequestHeaders(nextAccessToken, true),
        body: JSON.stringify({ content: trimmedContent }),
      }
    )
  );

  const raw = await response.text();
  const responsePayload = parseResponsePayload(raw);
  assertApiSuccess(response, raw, responsePayload, 'Send message');

  const normalizedMessage = normalizeConversationMessage(normalizeSentMessagePayload(responsePayload));
  if (!normalizedMessage.id || !normalizedMessage.content) {
    return {
      id: `temp-${Date.now()}`,
      conversation_id: trimmedConversationId,
      sender_id: '',
      sender_role: 'candidate',
      message_type: 'chat',
      content: trimmedContent,
      event_metadata: null,
      is_read: true,
      created_at: new Date().toISOString(),
    };
  }

  return normalizedMessage;
}
