import { forceReauthIfNeeded } from './authSession';

const RAW_CANDIDATE_API_BASE_URL = import.meta.env.VITE_CANDIDATE_API_BASE_URL?.trim() || '';

function getCandidateApiBaseUrl(): string {
  if (!RAW_CANDIDATE_API_BASE_URL) return '';

  const trimmed = RAW_CANDIDATE_API_BASE_URL.replace(/\/$/, '');
  return trimmed;
}

const CANDIDATE_API_BASE_URL = getCandidateApiBaseUrl();

function getApiMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const message = (payload as { message?: unknown }).message;
  if (typeof message !== 'string') return null;
  const trimmedMessage = message.trim();
  return trimmedMessage.length > 0 ? trimmedMessage : null;
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

export interface UpdateCandidateCvPayload {
  is_primary?: boolean;
  file_name?: string;
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

  const response = await fetch(`${CANDIDATE_API_BASE_URL}/cvs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${trimmedAccessToken}`,
    },
    body: formData,
  });

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

  const response = await fetch(`${CANDIDATE_API_BASE_URL}/cvs/${encodeURIComponent(trimmedCvId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${trimmedAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

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

  const response = await fetch(`${CANDIDATE_API_BASE_URL}/cvs/${encodeURIComponent(trimmedCvId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${trimmedAccessToken}`,
    },
  });

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
