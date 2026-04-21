import { executeAuthorizedRequest, forceReauthIfNeeded } from './authSession';

const RAW_CANDIDATE_API_BASE_URL = import.meta.env.VITE_CANDIDATE_API_BASE_URL?.trim() || '';

function isNgrokHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized.endsWith('.ngrok-free.app') || normalized.endsWith('.ngrok.app');
}

function getCandidateApiBaseUrl(): string {
  if (!RAW_CANDIDATE_API_BASE_URL) return '';

  const trimmed = RAW_CANDIDATE_API_BASE_URL.replace(/\/$/, '');
  return trimmed;
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
    // Ignore malformed URL
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

interface UploadCandidateCvParams {
  file: File;
  accessToken: string;
}

export interface CandidateCvItem {
  id: string;
  name: string;
  uploaded_at: string;
  is_primary: boolean;
}

export interface UpdateCandidateCvPayload {
  is_primary?: boolean;
  file_name?: string;
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function asString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim();
}

function asBoolean(input: unknown): boolean {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'number') return input === 1;
  if (typeof input === 'string') {
    const normalized = input.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
  return false;
}

function readString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
  }
  return '';
}

function readDownloadUrl(payload: unknown): string {
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  }

  const root = asRecord(payload);
  if (!root) return '';

  const direct = readString(root, ['url', 'download_url', 'file_url', 'cv_url']);
  if (direct) return direct;

  const data = asRecord(root.data);
  if (!data) return '';

  return readString(data, ['url', 'download_url', 'file_url', 'cv_url']);
}

function normalizeCv(raw: unknown, index: number): CandidateCvItem | null {
  const root = asRecord(raw);
  if (!root) return null;

  const id = readString(root, ['id', 'cv_id']);
  if (!id) return null;

  return {
    id,
    name: readString(root, ['name', 'file_name', 'filename', 'title']) || `CV ${index + 1}`,
    uploaded_at: readString(root, ['uploaded_at', 'updated_at', 'created_at', 'date']),
    is_primary: asBoolean(root.is_primary) || asBoolean(root.is_default) || asBoolean(root.default),
  };
}

function normalizeCvsResponse(payload: unknown): CandidateCvItem[] {
  let cvsRaw: unknown[] = [];

  if (Array.isArray(payload)) {
    cvsRaw = payload;
  } else {
    const root = asRecord(payload) || {};
    if (Array.isArray(root.items)) cvsRaw = root.items;
    else if (Array.isArray(root.data)) cvsRaw = root.data;
    else if (Array.isArray(root.results)) cvsRaw = root.results;
    else if (asRecord(root.cvs) && Array.isArray((root.cvs as { items?: unknown }).items)) {
      cvsRaw = (root.cvs as { items: unknown[] }).items;
    }
  }

  return cvsRaw
    .map((item, index) => normalizeCv(item, index))
    .filter((item): item is CandidateCvItem => item !== null);
}

export async function getCandidateCvs(accessToken: string): Promise<CandidateCvItem[]> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/cvs`, {
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
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `CV list fetch failed with status ${response.status}`);
  }

  return normalizeCvsResponse(payload);
}

export async function uploadCandidateCv({ file, accessToken }: UploadCandidateCvParams): Promise<unknown> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/cvs`, {
      method: 'POST',
      headers: getCandidateRequestHeaders(nextAccessToken),
      body: formData,
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
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `CV upload failed with status ${response.status}`);
  }

  return payload;
}

export async function updateCandidateCv(
  accessToken: string,
  cvId: string,
  payload: UpdateCandidateCvPayload
): Promise<unknown> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedCvId = cvId.trim();
  if (!trimmedCvId) {
    throw new Error('CV id is required.');
  }

  const requestBody = {
    ...(payload.is_primary !== undefined ? { is_primary: payload.is_primary } : {}),
    ...(payload.file_name !== undefined ? { file_name: payload.file_name } : {}),
  };

  if (Object.keys(requestBody).length === 0) {
    throw new Error('No CV updates provided.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/cvs/${encodeURIComponent(trimmedCvId)}`, {
      method: 'PATCH',
      headers: getCandidateRequestHeaders(nextAccessToken, true),
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
      || `CV update failed with status ${response.status}`
    );
  }

  return responsePayload;
}

export async function deleteCandidateCv(accessToken: string, cvId: string): Promise<void> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedCvId = cvId.trim();
  if (!trimmedCvId) {
    throw new Error('CV id is required.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/cvs/${encodeURIComponent(trimmedCvId)}`, {
      method: 'DELETE',
      headers: getCandidateRequestHeaders(nextAccessToken),
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
      || `CV delete failed with status ${response.status}`
    );
  }
}

export async function deleteAllCandidateCvs(accessToken: string): Promise<string | null> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/cvs/delete-all`, {
      method: 'DELETE',
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
      || `All CV delete failed with status ${response.status}`
    );
  }

  return getApiSuccessMessage(payload);
}

export async function getCandidateCvDownloadUrl(accessToken: string, cvId: string): Promise<string> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedCvId = cvId.trim();
  if (!trimmedCvId) {
    throw new Error('CV id is required.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/cvs/${encodeURIComponent(trimmedCvId)}/download`, {
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
      payload = raw;
    }
  }

  if (!response.ok) {
    forceReauthIfNeeded(response.status, payload);
    throw new Error(
      getApiDetailMessage(payload)
      || getApiMessage(payload)
      || `CV download URL fetch failed with status ${response.status}`
    );
  }

  const downloadUrl = readDownloadUrl(payload);
  if (downloadUrl) return downloadUrl;

  if (response.redirected && response.url) {
    return response.url;
  }

  throw new Error('CV download URL is missing from response.');
}
