const RAW_AUTH_API_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL?.trim() || '';

function getAuthApiBaseUrl(): string {
  if (!RAW_AUTH_API_BASE_URL) return '';

  const trimmed = RAW_AUTH_API_BASE_URL.replace(/\/$/, '');
  return trimmed;
}

const AUTH_API_BASE_URL = getAuthApiBaseUrl();

interface ApiResponseEnvelope<TData> {
  code?: string;
  message?: string;
  data?: TData;
  errors?: unknown;
}

interface ApiErrorParams {
  status: number;
  message: string;
  code: string | null;
  payload: unknown;
}

interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'candidate';
}

interface RegisterResponseData {
  user_id: string;
}

interface SendPhoneOtpRequest {
  user_id: string;
  phone_number: string;
}

interface VerifyPhoneOtpRequest extends SendPhoneOtpRequest {
  otp: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface GoogleAuthRequest {
  token: string;
}

type ApiResponse<TData> = ApiResponseEnvelope<TData>;

export class ApiError extends Error {
  status: number;
  code: string | null;
  payload: unknown;

  constructor({ status, message, code, payload }: ApiErrorParams) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

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
  if (!Array.isArray(detail) || detail.length === 0) return null;

  const firstDetail = detail[0];
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

function getStringOrNumberValue(input: unknown): string | null {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof input === 'number' && Number.isFinite(input)) {
    return String(input);
  }

  return null;
}

export function getApiErrorStatus(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const status = (payload as { status?: unknown }).status;
  const topLevelStatus = getStringOrNumberValue(status);
  if (topLevelStatus) return topLevelStatus;

  const errors = (payload as { errors?: unknown }).errors;
  if (typeof errors !== 'object' || errors === null) return null;

  const nestedStatus = (errors as { status?: unknown }).status;
  return getStringOrNumberValue(nestedStatus);
}

export function getApiErrorUserId(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const topLevelUserId = getStringOrNumberValue((payload as { user_id?: unknown }).user_id);
  if (topLevelUserId) return topLevelUserId;

  const errors = (payload as { errors?: unknown }).errors;
  if (typeof errors !== 'object' || errors === null) return null;

  return getStringOrNumberValue((errors as { user_id?: unknown }).user_id);
}

export function getApiErrorPhoneNumber(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const topLevelPhoneNumber = getStringOrNumberValue((payload as { phone_number?: unknown }).phone_number);
  if (topLevelPhoneNumber) return topLevelPhoneNumber;
  const topLevelPhone = getStringOrNumberValue((payload as { phone?: unknown }).phone);
  if (topLevelPhone) return topLevelPhone;

  const errors = (payload as { errors?: unknown }).errors;
  if (typeof errors !== 'object' || errors === null) return null;

  const nestedPhoneNumber = getStringOrNumberValue((errors as { phone_number?: unknown }).phone_number);
  if (nestedPhoneNumber) return nestedPhoneNumber;

  return getStringOrNumberValue((errors as { phone?: unknown }).phone);
}

async function post<TResponse>(path: string, body: unknown): Promise<TResponse> {
  if (!AUTH_API_BASE_URL) {
    throw new Error('Missing VITE_AUTH_API_BASE_URL in environment variables.');
  }

  const response = await fetch(`${AUTH_API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
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

  const message = getApiMessage(payload);
  const detailMessage = getApiDetailMessage(payload);
  const code = getApiCode(payload);

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code,
      message: detailMessage || message || `Request failed with status ${response.status}`,
      payload,
    });
  }

  // Some endpoints may return custom success codes that do not start with "SUCCESS".
  // Treat only explicit error-like codes as failures when HTTP status is already 2xx.
  if (code && /(ERROR|FAIL)/i.test(code)) {
    throw new ApiError({
      status: response.status,
      code,
      message: detailMessage || message || `Request failed with code ${code}`,
      payload,
    });
  }

  return payload as TResponse;
}

export async function registerUser(payload: RegisterRequest): Promise<ApiResponse<RegisterResponseData>> {
  return post<ApiResponse<RegisterResponseData>>('/register', payload);
}

export async function sendPhoneOtp(payload: SendPhoneOtpRequest): Promise<ApiResponse<unknown>> {
  return post<ApiResponse<unknown>>('/send-phone-otp', payload);
}

export async function verifyPhoneOtp(payload: VerifyPhoneOtpRequest): Promise<ApiResponse<unknown>> {
  return post<ApiResponse<unknown>>('/verify-phone-otp', payload);
}

export async function loginUser(payload: LoginRequest): Promise<ApiResponse<unknown>> {
  return post<ApiResponse<unknown>>('/login', payload);
}

export async function googleAuthUser(payload: GoogleAuthRequest): Promise<ApiResponse<unknown>> {
  return post<ApiResponse<unknown>>('/google', payload);
}
