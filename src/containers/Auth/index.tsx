import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../redux/store';
import type { AppDispatch, RootState } from '../../redux/store';
import {
  googleAuthUser,
  getApiErrorPhoneNumber,
  getApiErrorStatus,
  getApiErrorUserId,
  isApiError,
  loginUser,
  registerUser,
  sendPhoneOtp,
  verifyPhoneOtp,
} from '../../services/authApi';

import VerifyPhoneStep from './components/VerifyPhoneStep';
import OtpStep from './components/OtpStep';
import VerifiedStep from './components/VerifiedStep';
import TwoFactorStep from './components/TwoFactorStep';
import AuthLayout from './components/AuthLayout';

type AuthStep = 'auth' | 'verify-phone' | 'otp' | 'verified' | 'two-factor';
type PostVerificationAuthSource = 'credentials' | 'google';
interface ToastState {
  id: number;
  message: string;
}

interface GoogleTokenResponse {
  access_token?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
    error_callback?: () => void;
  }) => GoogleTokenClient;
}

type GoogleWindow = Window & {
  google?: {
    accounts?: {
      oauth2?: GoogleOAuth2;
    };
  };
};

interface PasswordVisibilityIconProps {
  isVisible: boolean;
}

function PasswordVisibilityIcon({ isVisible }: PasswordVisibilityIconProps) {
  if (isVisible) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.83L19.56 16.75C21.07 15.49 22.27 13.86 23 12C21.27 7.61 17 4.5 12 4.5C10.6 4.5 9.26 4.75 8.02 5.2L10.18 7.36C10.74 7.13 11.35 7 12 7ZM2 4.27L4.28 6.55L4.74 7.01C3.08 8.3 1.78 10 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.03 19.2 16.38 18.66L16.8 19.08L20 22.3L21.27 21.03L3.27 3L2 4.27ZM7.53 10.8L9.08 12.35C9.03 12.56 9 12.78 9 13C9 14.66 10.34 16 12 16C12.22 16 12.44 15.97 12.65 15.92L14.2 17.47C13.53 17.8 12.78 18 12 18C9.24 18 7 15.76 7 13C7 12.22 7.2 11.47 7.53 10.8ZM11.84 10.02L14.99 13.17L15.01 13.01C15.01 11.35 13.67 10.01 12.01 10.01L11.84 10.02Z" />
    </svg>
  );
}

const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GOOGLE_OAUTH_SCOPE = 'openid email profile';
const AUTH_FLOW_STORAGE_KEY = 'meretium.auth.flow.v1';
const DEFAULT_COUNTRY_CODE = '+1';
const OTP_RESEND_COOLDOWN_SECONDS = 30;

interface PersistedAuthFlowState {
  isLogin: boolean;
  step: AuthStep;
  fullName: string;
  email: string;
  password: string;
  registeredUserId: string;
  phoneNumber: string;
  verifyPhoneInput: string;
  verifyCountryCode: string;
  postVerificationAuthSource: PostVerificationAuthSource;
  pendingGoogleToken: string | null;
  otpResendAvailableAt: number | null;
}

function isAuthStep(input: unknown): input is AuthStep {
  return input === 'auth' || input === 'verify-phone' || input === 'otp' || input === 'verified' || input === 'two-factor';
}

function getStringStateValue(input: unknown): string {
  return typeof input === 'string' ? input : '';
}

function getNullableStringStateValue(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getNullableNumberStateValue(input: unknown): number | null {
  if (typeof input !== 'number' || !Number.isFinite(input)) return null;
  return input;
}

function normalizePersistedAuthFlowState(state: PersistedAuthFlowState): PersistedAuthFlowState {
  const normalizedState = { ...state };

  if (normalizedState.otpResendAvailableAt !== null && normalizedState.otpResendAvailableAt <= Date.now()) {
    normalizedState.otpResendAvailableAt = null;
  }

  if (normalizedState.step === 'verified') {
    normalizedState.step = 'auth';
  }

  if (
    normalizedState.step === 'two-factor'
    && (
      !normalizedState.isLogin
      || (
        normalizedState.postVerificationAuthSource === 'google'
          ? !normalizedState.pendingGoogleToken
          : !normalizedState.email.trim() || !normalizedState.password.trim()
      )
    )
  ) {
    normalizedState.step = 'auth';
  }

  if (normalizedState.step === 'verify-phone' && !normalizedState.registeredUserId) {
    normalizedState.step = 'auth';
  }

  if (normalizedState.step === 'otp' && (!normalizedState.registeredUserId || !normalizedState.phoneNumber)) {
    normalizedState.step = normalizedState.registeredUserId ? 'verify-phone' : 'auth';
  }

  if (normalizedState.verifyCountryCode.trim() === '') {
    normalizedState.verifyCountryCode = DEFAULT_COUNTRY_CODE;
  }

  return normalizedState;
}

function readPersistedAuthFlowState(): PersistedAuthFlowState | null {
  if (typeof window === 'undefined') return null;

  const raw = sessionStorage.getItem(AUTH_FLOW_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const state: PersistedAuthFlowState = {
      isLogin: parsed.isLogin === true,
      step: isAuthStep(parsed.step) ? parsed.step : 'auth',
      fullName: getStringStateValue(parsed.fullName),
      email: getStringStateValue(parsed.email),
      password: getStringStateValue(parsed.password),
      registeredUserId: getStringStateValue(parsed.registeredUserId),
      phoneNumber: getStringStateValue(parsed.phoneNumber),
      verifyPhoneInput: getStringStateValue(parsed.verifyPhoneInput),
      verifyCountryCode: getStringStateValue(parsed.verifyCountryCode) || DEFAULT_COUNTRY_CODE,
      postVerificationAuthSource: parsed.postVerificationAuthSource === 'google' ? 'google' : 'credentials',
      pendingGoogleToken: getNullableStringStateValue(parsed.pendingGoogleToken),
      otpResendAvailableAt: getNullableNumberStateValue(parsed.otpResendAvailableAt),
    };

    return normalizePersistedAuthFlowState(state);
  } catch {
    sessionStorage.removeItem(AUTH_FLOW_STORAGE_KEY);
    return null;
  }
}

function persistAuthFlowState(state: PersistedAuthFlowState): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AUTH_FLOW_STORAGE_KEY, JSON.stringify(state));
}

function clearPersistedAuthFlowState(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AUTH_FLOW_STORAGE_KEY);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Something went wrong. Please try again.';
}

function getRecordValue(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function getLandingRouteByIsOnboarded(input: unknown): string {
  return input === true ? '/dashboard' : '/';
}

function getLandingRouteFromAuthResponse(payload: unknown): string {
  const payloadObj = getRecordValue(payload);
  const dataObj = getRecordValue(payloadObj?.data);
  const isOnboarded = dataObj?.is_onboarded;
  return getLandingRouteByIsOnboarded(isOnboarded);
}

function getLandingRouteFromUser(user: unknown): string {
  const userObj = getRecordValue(user);
  return getLandingRouteByIsOnboarded(userObj?.is_onboarded);
}

function getRedirectPathFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  const redirect = params.get('redirect');
  if (!redirect) return null;

  const trimmed = redirect.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;

  return trimmed;
}

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const redirectAfterAuth = getRedirectPathFromSearch(location.search);
  const [persistedFlow] = useState<PersistedAuthFlowState | null>(() => readPersistedAuthFlowState());

  const [isLogin, setIsLogin] = useState(persistedFlow?.isLogin ?? false);
  const [step, setStep] = useState<AuthStep>(persistedFlow?.step ?? 'auth');
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState(persistedFlow?.fullName ?? '');
  const [email, setEmail] = useState(persistedFlow?.email ?? '');
  const [password, setPassword] = useState(persistedFlow?.password ?? '');
  const [registeredUserId, setRegisteredUserId] = useState(persistedFlow?.registeredUserId ?? '');
  const [phoneNumber, setPhoneNumber] = useState(persistedFlow?.phoneNumber ?? '');
  const [verifyPhoneInput, setVerifyPhoneInput] = useState(persistedFlow?.verifyPhoneInput ?? '');
  const [verifyCountryCode, setVerifyCountryCode] = useState(persistedFlow?.verifyCountryCode ?? DEFAULT_COUNTRY_CODE);
  const [postVerificationAuthSource, setPostVerificationAuthSource] = useState<PostVerificationAuthSource>(
    persistedFlow?.postVerificationAuthSource ?? 'credentials'
  );
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(persistedFlow?.pendingGoogleToken ?? null);
  const [otpResendAvailableAt, setOtpResendAvailableAt] = useState<number | null>(persistedFlow?.otpResendAvailableAt ?? null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const [authInfoMessage, setAuthInfoMessage] = useState<string | null>(null);
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const googleTokenClientRef = useRef<GoogleTokenClient | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isSignupValid = emailRegex.test(email) && password.trim() !== '' && fullName.trim() !== '';
  const isLoginValid = emailRegex.test(email) && password.trim() !== '';

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const showErrorToast = (message: string) => {
    setToast({
      id: Date.now(),
      message,
    });
  };

  useEffect(() => {
    if (!accessToken) return;
    clearPersistedAuthFlowState();
    navigate(redirectAfterAuth || getLandingRouteFromUser(user), { replace: true });
  }, [accessToken, navigate, redirectAfterAuth, user]);

  useEffect(() => {
    const state: PersistedAuthFlowState = {
      isLogin,
      step,
      fullName,
      email,
      password,
      registeredUserId,
      phoneNumber,
      verifyPhoneInput,
      verifyCountryCode,
      postVerificationAuthSource,
      pendingGoogleToken,
      otpResendAvailableAt,
    };

    persistAuthFlowState(normalizePersistedAuthFlowState(state));
  }, [
    isLogin,
    step,
    fullName,
    email,
    password,
    registeredUserId,
    phoneNumber,
    verifyPhoneInput,
    verifyCountryCode,
    postVerificationAuthSource,
    pendingGoogleToken,
    otpResendAvailableAt,
  ]);

  const startOtpCooldown = () => {
    setOtpResendAvailableAt(Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
  };

  const clearPhoneVerificationContext = () => {
    setRegisteredUserId('');
    setPhoneNumber('');
    setVerifyPhoneInput('');
    setVerifyCountryCode(DEFAULT_COUNTRY_CODE);
    setPostVerificationAuthSource('credentials');
    setPendingGoogleToken(null);
    setOtpResendAvailableAt(null);
  };

  const switchToSignup = () => {
    setIsLogin(false);
    setAuthInfoMessage(null);
    clearPhoneVerificationContext();
  };

  const switchToLogin = () => {
    setIsLogin(true);
    clearPhoneVerificationContext();
  };

  const handlePhoneGateRedirect = (
    error: unknown,
    options?: { allowStatusPhoneGate?: boolean; authSource?: PostVerificationAuthSource; googleToken?: string }
  ): boolean => {
    if (!isApiError(error)) return false;

    const allowStatusPhoneGate = options?.allowStatusPhoneGate === true;
    if (!allowStatusPhoneGate && error.status !== 403) return false;

    const phoneGateStatus = allowStatusPhoneGate ? getApiErrorStatus(error.payload) : null;
    const isPhoneRequired = error.code === 'PHONE_403_REQUIRED' || phoneGateStatus === 'PHONE_REQUIRED';
    const isPhoneNotVerified = error.code === 'PHONE_403_NOT_VERIFIED' || phoneGateStatus === 'PHONE_NOT_VERIFIED';

    if (!isPhoneRequired && !isPhoneNotVerified) return false;

    const userId = getApiErrorUserId(error.payload);
    if (!userId) return false;
    const authSource = options?.authSource || 'credentials';

    setPostVerificationAuthSource(authSource);
    setPendingGoogleToken(authSource === 'google' ? options?.googleToken?.trim() || null : null);

    if (isPhoneRequired) {
      showErrorToast(getErrorMessage(error));
      setRegisteredUserId(userId);
      setPhoneNumber('');
      setOtpResendAvailableAt(null);
      setStep('verify-phone');
      setIsLogin(false);
      return true;
    }

    if (isPhoneNotVerified) {
      const apiPhoneNumber = getApiErrorPhoneNumber(error.payload);

      showErrorToast(getErrorMessage(error));
      setRegisteredUserId(userId);
      setIsLogin(false);

      if (apiPhoneNumber) {
        setPhoneNumber(apiPhoneNumber);
        setStep('otp');
        startOtpCooldown();
        return true;
      }

      setPhoneNumber('');
      setOtpResendAvailableAt(null);
      setStep('verify-phone');
      return true;
    }

    return false;
  };

  const handleTwoFactorRequired = (
    error: unknown,
    options?: { authSource?: PostVerificationAuthSource; googleToken?: string | null }
  ): boolean => {
    if (!isApiError(error)) return false;

    const apiCode = (error.code || '').trim().toUpperCase();
    if (error.status !== 401 || apiCode !== 'AUTH_202_2FA') return false;

    const authSource = options?.authSource || 'credentials';
    setPostVerificationAuthSource(authSource);
    setPendingGoogleToken(authSource === 'google' ? options?.googleToken?.trim() || null : null);
    setIsLogin(true);
    setStep('two-factor');
    return true;
  };

  const loginWithCredentials = async (totpCode = ''): Promise<string> => {
    const trimmedTotpCode = totpCode.trim();
    const response = await loginUser({
      email: email.trim(),
      password,
      ...(trimmedTotpCode ? { totp_code: trimmedTotpCode } : {}),
    });

    dispatch(login(response));
    clearPersistedAuthFlowState();
    return getLandingRouteFromAuthResponse(response);
  };

  const loginWithGoogleToken = async (token: string, totpCode = ''): Promise<string> => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      throw new Error('Google session expired. Please continue with Google again.');
    }

    const trimmedTotpCode = totpCode.trim();
    const response = await googleAuthUser({
      token: trimmedToken,
      ...(trimmedTotpCode ? { totp_code: trimmedTotpCode } : {}),
    });
    dispatch(login(response));
    clearPersistedAuthFlowState();
    return getLandingRouteFromAuthResponse(response);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthInfoMessage(null);

    try {
      if (isLogin) {
        setPostVerificationAuthSource('credentials');
        setPendingGoogleToken(null);
        const nextRoute = await loginWithCredentials();
        clearPhoneVerificationContext();
        navigate(redirectAfterAuth || nextRoute);
        return;
      }

      const response = await registerUser({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role: 'candidate',
      });

      const userId = response.data?.user_id;
      if (!userId) {
        throw new Error('Registration succeeded but user_id is missing in response.');
      }

      setRegisteredUserId(userId);
      setPhoneNumber('');
      setVerifyPhoneInput('');
      setVerifyCountryCode(DEFAULT_COUNTRY_CODE);
      setPostVerificationAuthSource('credentials');
      setPendingGoogleToken(null);
      setOtpResendAvailableAt(null);
      setStep('verify-phone');
    } catch (error: unknown) {
      if (isLogin && handleTwoFactorRequired(error, { authSource: 'credentials' })) {
        return;
      }

      if (isLogin && handlePhoneGateRedirect(error, { allowStatusPhoneGate: false, authSource: 'credentials' })) {
        return;
      }

      showErrorToast(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorVerify = async (totpCode: string) => {
    setLoading(true);

    try {
      const completeTwoFactorAuth = async (): Promise<string> => {
        if (postVerificationAuthSource === 'google') {
          const googleToken = pendingGoogleToken;
          if (!googleToken) {
            throw new Error('Google session expired. Please continue with Google again.');
          }
          return loginWithGoogleToken(googleToken, totpCode);
        }

        return loginWithCredentials(totpCode);
      };

      const nextRoute = await completeTwoFactorAuth();
      setPendingGoogleToken(null);
      setPostVerificationAuthSource('credentials');
      clearPhoneVerificationContext();
      navigate(redirectAfterAuth || nextRoute);
    } catch (error: unknown) {
      showErrorToast(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (token: string) => {
    try {
      const nextRoute = await loginWithGoogleToken(token);
      setPendingGoogleToken(null);
      setPostVerificationAuthSource('credentials');
      clearPhoneVerificationContext();
      navigate(redirectAfterAuth || nextRoute);
    } catch (error: unknown) {
      if (handleTwoFactorRequired(error, { authSource: 'google', googleToken: token })) {
        return;
      }

      if (handlePhoneGateRedirect(error, { allowStatusPhoneGate: true, authSource: 'google', googleToken: token })) {
        return;
      }

      showErrorToast(getErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleContinue = () => {
    if (loading || googleLoading) return;

    if (!googleClientId) {
      showErrorToast('Missing VITE_GOOGLE_CLIENT_ID. Please configure Google sign-in.');
      return;
    }

    if (!googleReady || !googleTokenClientRef.current) {
      showErrorToast('Google sign-in is still loading. Please try again.');
      return;
    }

    setGoogleLoading(true);

    try {
      googleTokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
    } catch {
      setGoogleLoading(false);
      showErrorToast('Unable to open Google sign-in popup.');
    }
  };

  useEffect(() => {
    if (!googleClientId) return undefined;

    const initializeGoogleClient = (): boolean => {
      const google = (window as GoogleWindow).google;
      const oauth2 = google?.accounts?.oauth2;
      if (!oauth2) return false;

      googleTokenClientRef.current = oauth2.initTokenClient({
        client_id: googleClientId,
        scope: GOOGLE_OAUTH_SCOPE,
        callback: (tokenResponse: GoogleTokenResponse) => {
          const accessToken = tokenResponse.access_token?.trim();
          if (!accessToken) {
            setGoogleLoading(false);
            showErrorToast('Google sign-in failed. Please try again.');
            return;
          }

          void handleGoogleAuth(accessToken);
        },
        error_callback: () => {
          setGoogleLoading(false);
          showErrorToast('Google sign-in was cancelled or failed.');
        },
      });

      setGoogleReady(true);
      return true;
    };

    if (initializeGoogleClient()) {
      return undefined;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`);
    const script = existingScript ?? document.createElement('script');

    const onLoad = () => {
      if (!initializeGoogleClient()) {
        showErrorToast('Google sign-in could not be initialized.');
      }
    };

    const onError = () => {
      showErrorToast('Failed to load Google sign-in.');
    };

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);

    if (!existingScript) {
      script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
    };
  }, [googleClientId]);

  const handlePhoneSuccess = async (fullPhoneNumber: string) => {
    if (!registeredUserId) {
      showErrorToast('User ID is missing. Please sign up again.');
      return;
    }

    setLoading(true);

    try {
      await sendPhoneOtp({
        user_id: registeredUserId,
        phone_number: fullPhoneNumber,
      });

      setPhoneNumber(fullPhoneNumber);
      setStep('otp');
      startOtpCooldown();
    } catch (error: unknown) {
      showErrorToast(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSuccess = async (otp: string) => {
    if (!registeredUserId || !phoneNumber) {
      showErrorToast('User ID or phone number is missing. Please retry signup.');
      return;
    }

    setLoading(true);
    let isPhoneVerified = false;

    try {
      await verifyPhoneOtp({
        user_id: registeredUserId,
        phone_number: phoneNumber,
        otp,
      });

      isPhoneVerified = true;
      setStep('verified');
      const completePostVerificationAuth = async (): Promise<string> => {
        if (postVerificationAuthSource === 'google') {
          const googleToken = pendingGoogleToken;
          if (!googleToken) {
            throw new Error('Google session expired. Please continue with Google again.');
          }

          const googleNextRoute = await loginWithGoogleToken(googleToken);
          setPendingGoogleToken(null);
          setPostVerificationAuthSource('credentials');
          return googleNextRoute;
        }

        return loginWithCredentials();
      };

      const nextRoute = await completePostVerificationAuth();
      clearPhoneVerificationContext();
      navigate(redirectAfterAuth || nextRoute);
    } catch (error: unknown) {
      if (isPhoneVerified && handleTwoFactorRequired(error, {
        authSource: postVerificationAuthSource,
        googleToken: pendingGoogleToken,
      })) {
        clearPhoneVerificationContext();
        return;
      }

      if (isPhoneVerified) {
        clearPhoneVerificationContext();
        setIsLogin(true);
        setStep('auth');
        setAuthInfoMessage('Phone verified. Please sign in to continue.');
      }
      showErrorToast(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (): Promise<boolean> => {
    if (!registeredUserId || !phoneNumber) {
      showErrorToast('User ID or phone number is missing. Please retry signup.');
      return false;
    }

    setLoading(true);

    try {
      await sendPhoneOtp({
        user_id: registeredUserId,
        phone_number: phoneNumber,
      });
      return true;
    } catch (error: unknown) {
      showErrorToast(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {toast && (
        <div
          key={toast.id}
          className="fixed top-4 right-4 z-50 max-w-[360px] bg-[#FEF3F2] border border-[#FDA29B] text-[#B42318] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium"
        >
          {toast.message}
        </div>
      )}

      {step === 'auth' && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm w-full max-w-[480px] lg:w-[480px] lg:h-[682px] flex flex-col justify-between overflow-hidden font-manrope transition-all duration-300">
          <div>
            <div className="text-center mb-6">
              <h2 className="text-[28px] sm:text-[32px] font-semibold text-[#0A1124] tracking-tight leading-tight font-heading">
                Get Started With Meretium
              </h2>
              <p className="text-[#667085] text-[14px] mt-2 font-[400] font-body">Find roles that match your potential</p>
            </div>

            <div className="flex bg-[#F9FAFB] p-1.5 rounded-[10px] mb-6 border border-gray-100">
              <button
                type="button"
                onClick={switchToSignup}
                className={`flex-1 py-1.5 text-[14px] font-semibold rounded-[8px] transition-all font-body cursor-pointer ${!isLogin ? 'bg-[#FF6934] text-white shadow-sm' : 'text-[#344054] hover:text-[#101828]'}`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={switchToLogin}
                className={`flex-1 py-1.5 text-[14px] font-semibold rounded-[8px] transition-all font-body cursor-pointer ${isLogin ? 'bg-[#FF6934] text-white shadow-sm' : 'text-[#344054] hover:text-[#101828]'}`}
              >
                Sign In
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoogleContinue}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 border border-[#D1D5DB] rounded-[8px] py-3 text-[14px] font-[600] text-[#344054] hover:bg-gray-50 transition-colors mb-6 cursor-pointer font-body disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
              {googleLoading ? 'Please wait...' : 'Continue with Google'}
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-[#D1D5DB]"></div>
              <span className="text-[#667085] text-[14px] font-medium font-body">or</span>
              <div className="flex-1 h-px bg-[#D1D5DB]"></div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-[14px] font-regular text-[#344054] mb-1 font-body">
                    Full name<span className="text-[#FF6934] ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none text-[16px] sm:text-[14px] transition-all placeholder:text-gray-400 text-gray-900 font-body"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-[14px] font-regular text-[#344054] mb-1 font-body">
                  Email address<span className="text-[#FF6934] ml-0.5">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none text-[16px] sm:text-[14px] transition-all placeholder:text-gray-400 text-gray-900 font-body"
                  required
                />
              </div>
              <div>
                <label className="block text-[14px] font-regular text-[#344054] mb-1 font-body">
                  Password<span className="text-[#FF6934] ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showAuthPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-11 rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none text-[16px] sm:text-[14px] transition-all placeholder:text-gray-400 text-gray-900 font-body"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#667085] cursor-pointer"
                    aria-label={showAuthPassword ? 'Hide password' : 'Show password'}
                  >
                    <PasswordVisibilityIcon isVisible={showAuthPassword} />
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between pt-0.5">
                  <label className="inline-flex items-center gap-2 text-[12px] text-[#475467] font-body cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border border-[#FF6934] bg-white peer-checked:bg-[#FF6934]">
                      {rememberMe && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M1 3.5L3.2 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    Remember Me
                  </label>
                  <Link to="/auth/forget-password" className="text-[12px] font-medium text-[#FF6934] hover:text-[#E5552B]">
                    Forgot Password?
                  </Link>
                </div>
              )}

              {authInfoMessage && (
                <p className="text-[13px] text-green-700 font-medium">{authInfoMessage}</p>
              )}
              <button
                type="submit"
                disabled={loading || (isLogin ? !isLoginValid : !isSignupValid)}
                className="w-full bg-[#FF6934] hover:bg-[#E5552B] cursor-pointer text-white py-3 rounded-[8px] transition-all mt-2 text-[14px] font-[600] active:scale-[0.98] font-body disabled:opacity-70"
              >
                {loading ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}
              </button>
            </form>
          </div>

          <div className="text-center border-t border-gray-100 pt-6">
            <p className="text-[12px] text-[#475467] font-body leading-tight">
              By continuing you agree to Meretium Terms &amp; Privacy
            </p>
          </div>
        </div>
      )}

      {step === 'verify-phone' && (
        <VerifyPhoneStep
          onSuccess={handlePhoneSuccess}
          countryCode={verifyCountryCode}
          phone={verifyPhoneInput}
          onCountryCodeChange={setVerifyCountryCode}
          onPhoneChange={setVerifyPhoneInput}
          loading={loading}
        />
      )}

      {step === 'otp' && (
        <OtpStep
          onSuccess={handleOtpSuccess}
          onResend={handleResendOtp}
          phoneNumber={phoneNumber}
          resendAvailableAt={otpResendAvailableAt}
          onResendAvailableAtChange={setOtpResendAvailableAt}
          resendCooldownSeconds={OTP_RESEND_COOLDOWN_SECONDS}
          loading={loading}
        />
      )}

      {step === 'verified' && <VerifiedStep />}

      {step === 'two-factor' && (
        <TwoFactorStep
          email={email.trim()}
          loading={loading}
          onBack={() => {
            setPendingGoogleToken(null);
            setPostVerificationAuthSource('credentials');
            setStep('auth');
          }}
          onVerify={handleTwoFactorVerify}
        />
      )}
    </AuthLayout>
  );
};

export default Auth;
