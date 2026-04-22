import { configureStore, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: unknown | null;
  profile: CandidateProfileState | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string | null;
  tokenExpiresAt: number | null;
}

type OpenToWorkStatus =
  | 'Open to opportunities'
  | 'Visible to matched recruiters'
  | 'Private';

interface CandidateProfileState {
  id: string;
  user_id: string;
  full_name: string;
  headline: string;
  location: string;
  about: string;
  profile_strength: number;
  is_open_to_work: boolean;
  open_to_work_status: OpenToWorkStatus;
  total_years_experience: number;
  share_slug: string | null;
  is_public: boolean;
  quick_apply_default_cv: boolean;
  allow_cv_download: boolean;
  show_last_active: boolean;
  last_shared_at: string | null;
}

interface LoginData {
  user: unknown | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string | null;
  expiresIn: number | null;
}

function parseStoredUser(raw: string | null): unknown | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    return null;
  }
}

function getStringValue(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getNumberValue(input: unknown): number | null {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getNullableBooleanValue(input: unknown): boolean | null {
  if (typeof input === 'boolean') return input;
  if (input === null) return null;
  return null;
}

function getBooleanValue(input: unknown, fallback = false): boolean {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'number') return input === 1;
  if (typeof input === 'string') {
    const normalized = input.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return fallback;
}

function getRecordValue(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function getNullableStringValue(input: unknown): string | null {
  const value = getStringValue(input);
  return value ?? null;
}

function getOpenToWorkStatus(
  input: unknown,
  fallback: OpenToWorkStatus
): OpenToWorkStatus {
  if (typeof input !== 'string') return fallback;
  const trimmed = input.trim();
  if (
    trimmed === 'Open to opportunities'
    || trimmed === 'Visible to matched recruiters'
    || trimmed === 'Private'
  ) {
    return trimmed as OpenToWorkStatus;
  }
  if (trimmed === 'Closed to opportunities') return 'Private';
  return fallback;
}

function normalizeProfileState(input: unknown): CandidateProfileState | null {
  const raw = getRecordValue(input);
  if (!raw) return null;

  const id = getStringValue(raw.id) || '';
  const userId = getStringValue(raw.user_id) || '';
  if (!id || !userId) return null;

  const isOpenToWork = getBooleanValue(raw.is_open_to_work, false);
  const fallbackStatus: OpenToWorkStatus = isOpenToWork ? 'Open to opportunities' : 'Private';

  return {
    id,
    user_id: userId,
    full_name: getStringValue(raw.full_name) || '',
    headline: getStringValue(raw.headline) || '',
    location: getStringValue(raw.location) || '',
    about: getStringValue(raw.about) || '',
    profile_strength: getNumberValue(raw.profile_strength) ?? 0,
    is_open_to_work: isOpenToWork,
    open_to_work_status: getOpenToWorkStatus(raw.open_to_work_status, fallbackStatus),
    total_years_experience: getNumberValue(raw.total_years_experience) ?? 0,
    share_slug: getNullableStringValue(raw.share_slug),
    is_public: getBooleanValue(raw.is_public, false),
    quick_apply_default_cv: getBooleanValue(raw.quick_apply_default_cv, false),
    allow_cv_download: getBooleanValue(raw.allow_cv_download, false),
    show_last_active: getBooleanValue(raw.show_last_active, false),
    last_shared_at: getNullableStringValue(raw.last_shared_at),
  };
}

function parseStoredProfile(raw: string | null): CandidateProfileState | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeProfileState(parsed);
    if (normalized) return normalized;
  } catch {
    // fall through to cleanup
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('profile');
  }

  return null;
}

function extractLoginData(payload: unknown): LoginData {
  if (typeof payload !== 'object' || payload === null) {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      tokenType: null,
      expiresIn: null,
    };
  }

  const payloadObj = payload as Record<string, unknown>;
  const dataObj = typeof payloadObj.data === 'object' && payloadObj.data !== null
    ? (payloadObj.data as Record<string, unknown>)
    : {};
  const dataTokenObj = getRecordValue(dataObj.token);
  const payloadTokenObj = getRecordValue(payloadObj.token);
  const dataTokensObj = getRecordValue(dataObj.tokens);
  const payloadTokensObj = getRecordValue(payloadObj.tokens);
  const dataUserObj = getRecordValue(dataObj.user);
  const payloadUserObj = getRecordValue(payloadObj.user);
  const goto = getStringValue(dataObj.goto ?? payloadObj.goto);
  const isOnboarded = getNullableBooleanValue(dataObj.is_onboarded ?? payloadObj.is_onboarded);

  let user: unknown | null = dataObj.user ?? payloadObj.user ?? null;
  if (dataUserObj || payloadUserObj) {
    user = {
      ...(payloadUserObj || {}),
      ...(dataUserObj || {}),
      goto,
      is_onboarded: isOnboarded,
    };
  }
  const accessToken = getStringValue(
    dataObj.access_token
    ?? dataObj.accessToken
    ?? dataObj.token
    ?? dataTokenObj?.access_token
    ?? dataTokenObj?.accessToken
    ?? dataTokenObj?.token
    ?? dataTokensObj?.access_token
    ?? dataTokensObj?.accessToken
    ?? dataTokensObj?.token
    ?? payloadObj.access_token
    ?? payloadObj.accessToken
    ?? payloadObj.token
    ?? payloadTokenObj?.access_token
    ?? payloadTokenObj?.accessToken
    ?? payloadTokenObj?.token
    ?? payloadTokensObj?.access_token
    ?? payloadTokensObj?.accessToken
    ?? payloadTokensObj?.token
  );
  const refreshToken = getStringValue(
    dataObj.refresh_token
    ?? dataObj.refreshToken
    ?? dataTokenObj?.refresh_token
    ?? dataTokenObj?.refreshToken
    ?? dataTokensObj?.refresh_token
    ?? dataTokensObj?.refreshToken
    ?? payloadObj.refresh_token
    ?? payloadObj.refreshToken
    ?? payloadTokenObj?.refresh_token
    ?? payloadTokenObj?.refreshToken
    ?? payloadTokensObj?.refresh_token
    ?? payloadTokensObj?.refreshToken
  );
  const tokenType = getStringValue(
    dataObj.token_type
    ?? dataObj.tokenType
    ?? dataTokenObj?.token_type
    ?? dataTokenObj?.tokenType
    ?? dataTokensObj?.token_type
    ?? dataTokensObj?.tokenType
    ?? payloadObj.token_type
    ?? payloadObj.tokenType
    ?? payloadTokenObj?.token_type
    ?? payloadTokenObj?.tokenType
    ?? payloadTokensObj?.token_type
    ?? payloadTokensObj?.tokenType
  );
  const expiresIn = getNumberValue(
    dataObj.expires_in
    ?? dataObj.expiresIn
    ?? dataTokenObj?.expires_in
    ?? dataTokenObj?.expiresIn
    ?? dataTokensObj?.expires_in
    ?? dataTokensObj?.expiresIn
    ?? payloadObj.expires_in
    ?? payloadObj.expiresIn
    ?? payloadTokenObj?.expires_in
    ?? payloadTokenObj?.expiresIn
    ?? payloadTokensObj?.expires_in
    ?? payloadTokensObj?.expiresIn
  );

  return {
    user,
    accessToken,
    refreshToken,
    tokenType,
    expiresIn,
  };
}

const savedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
const savedProfile = typeof window !== 'undefined' ? localStorage.getItem('profile') : null;
const savedAccessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
const savedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
const savedTokenType = typeof window !== 'undefined' ? localStorage.getItem('tokenType') : null;
const savedTokenExpiresAtRaw = typeof window !== 'undefined' ? localStorage.getItem('tokenExpiresAt') : null;
const savedTokenExpiresAt = savedTokenExpiresAtRaw ? Number(savedTokenExpiresAtRaw) : null;

const initialState: AuthState = {
  user: parseStoredUser(savedUser),
  profile: parseStoredProfile(savedProfile),
  accessToken: savedAccessToken || null,
  refreshToken: savedRefreshToken || null,
  tokenType: savedTokenType || null,
  tokenExpiresAt: Number.isFinite(savedTokenExpiresAt) ? savedTokenExpiresAt : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<unknown>) => {
      const { user, accessToken, refreshToken, tokenType, expiresIn } = extractLoginData(action.payload);
      const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null;

      state.user = user;
      state.profile = null;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.tokenType = tokenType;
      state.tokenExpiresAt = expiresAt;

      if (user !== null) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
      localStorage.removeItem('profile');

      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      } else {
        localStorage.removeItem('accessToken');
      }

      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      } else {
        localStorage.removeItem('refreshToken');
      }

      if (tokenType) {
        localStorage.setItem('tokenType', tokenType);
      } else {
        localStorage.removeItem('tokenType');
      }

      if (expiresAt) {
        localStorage.setItem('tokenExpiresAt', String(expiresAt));
      } else {
        localStorage.removeItem('tokenExpiresAt');
      }
    },
    refreshTokens: (state, action: PayloadAction<unknown>) => {
      const { accessToken, refreshToken, tokenType, expiresIn } = extractLoginData(action.payload);
      const nextAccessToken = getStringValue(accessToken);
      if (!nextAccessToken) return;

      const nextRefreshToken = getStringValue(refreshToken) || state.refreshToken;
      const nextTokenType = getStringValue(tokenType) || state.tokenType;
      const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null;

      state.accessToken = nextAccessToken;
      state.refreshToken = nextRefreshToken;
      state.tokenType = nextTokenType;
      state.tokenExpiresAt = expiresAt;

      localStorage.setItem('accessToken', nextAccessToken);

      if (nextRefreshToken) {
        localStorage.setItem('refreshToken', nextRefreshToken);
      } else {
        localStorage.removeItem('refreshToken');
      }

      if (nextTokenType) {
        localStorage.setItem('tokenType', nextTokenType);
      } else {
        localStorage.removeItem('tokenType');
      }

      if (expiresAt) {
        localStorage.setItem('tokenExpiresAt', String(expiresAt));
      } else {
        localStorage.removeItem('tokenExpiresAt');
      }
    },
    setProfile: (state, action: PayloadAction<unknown>) => {
      const profile = normalizeProfileState(action.payload);
      state.profile = profile;

      if (profile) {
        localStorage.setItem('profile', JSON.stringify(profile));
      } else {
        localStorage.removeItem('profile');
      }
    },
    logout: (state) => {
      state.user = null;
      state.profile = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.tokenType = null;
      state.tokenExpiresAt = null;

      localStorage.removeItem('user');
      localStorage.removeItem('profile');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenType');
      localStorage.removeItem('tokenExpiresAt');
    },
  },
});

export const { login, refreshTokens, setProfile, logout } = authSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
