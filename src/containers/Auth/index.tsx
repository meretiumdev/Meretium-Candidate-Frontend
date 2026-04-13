import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../redux/store';
import type { AppDispatch, RootState } from '../../redux/store';
import logo from '../../assets/logo_primary.png';
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

type AuthStep = 'auth' | 'verify-phone' | 'otp' | 'verified';
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
  return input === 'auth' || input === 'verify-phone' || input === 'otp' || input === 'verified';
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

const Auth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken, tokenExpiresAt, user } = useSelector((state: RootState) => state.auth);
  const isTokenExpired = Boolean(accessToken && tokenExpiresAt && Date.now() >= tokenExpiresAt);
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
    if (!accessToken || isTokenExpired) return;
    clearPersistedAuthFlowState();
    navigate(getLandingRouteFromUser(user), { replace: true });
  }, [accessToken, isTokenExpired, navigate, user]);

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

  const loginWithCredentials = async (): Promise<string> => {
    const response = await loginUser({
      email: email.trim(),
      password,
    });

    dispatch(login(response));
    clearPersistedAuthFlowState();
    return getLandingRouteFromAuthResponse(response);
  };

  const loginWithGoogleToken = async (token: string): Promise<string> => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      throw new Error('Google session expired. Please continue with Google again.');
    }

    const response = await googleAuthUser({ token: trimmedToken });
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
        navigate(nextRoute);
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
      if (isLogin && handlePhoneGateRedirect(error, { allowStatusPhoneGate: false, authSource: 'credentials' })) {
        return;
      }

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
      navigate(nextRoute);
    } catch (error: unknown) {
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
      navigate(nextRoute);
    } catch (error: unknown) {
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
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">
      {toast && (
        <div
          key={toast.id}
          className="fixed top-4 right-4 z-50 max-w-[360px] bg-[#FEF3F2] border border-[#FDA29B] text-[#B42318] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium"
        >
          {toast.message}
        </div>
      )}

      <aside className="w-full lg:w-1/2 bg-[#FDF5E6] flex flex-col justify-center px-8 py-10 lg:py-0 lg:px-12 xl:px-24">
        <div className="max-w-[540px] mx-auto lg:mx-0">
          <div className="mb-4 lg:mb-1">
            <Link to="/">
              <img src={logo} alt="Meretium" className="h-[60px] lg:h-[100px] w-auto object-contain mx-auto lg:mx-0" />
            </Link>
          </div>
          <div className="text-center lg:text-left">
            <h1
              className="text-[28px] lg:text-[36px] font-medium text-[#FF6934] leading-[36px] lg:leading-[48px] mb-3 capitalize tracking-normal"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Manage Your Platform With Control &amp; Clarity
            </h1>
            <p className="text-[14px] lg:text-[15px] xl:text-[16px] text-[#1D2939] font-medium leading-relaxed max-w-[440px] font-body mx-auto lg:mx-0">
              Manage users, approvals, and platform health from one intelligent workspace.
            </p>
          </div>
        </div>
      </aside>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 bg-[#FFFFFF]">
        <div className="w-full flex justify-center py-4 sm:py-8 text-left">
          {step === 'auth' && (
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm w-full max-w-[480px] lg:w-[480px] lg:h-[682px] flex flex-col justify-between overflow-hidden font-manrope transition-all duration-300">
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-[28px] sm:text-[32px] font-semibold text-[#0A1124] tracking-tight leading-tight font-heading">
                    Get Started With Meritium
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
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none text-[16px] sm:text-[14px] transition-all placeholder:text-gray-400 text-gray-900 font-body"
                      required
                    />
                  </div>

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
                  By continuing you agree to Meritium Terms &amp; Privacy
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
        </div>
      </div>
    </div>
  );
};

export default Auth;
