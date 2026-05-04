import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './redux/store';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Onboarding from './containers/Onboarding';
import Dashboard from './containers/Dashboard';
import ExploreJobs from './containers/ExploreJobs';
import JobsPage from './containers/Jobs';
import Profile from './containers/Profile';
import PublicView from './containers/Profile/PublicView';
import JobDetail from './containers/JobDetail';
import Applications from './containers/Applications';
import Saved from './containers/Saved';
import Messages from './containers/Messages';
import Auth from './containers/Auth';
import Settings from './containers/Settings';
import ForgotPassword from './containers/Auth/ForgotPassword';
import VerifyEmailChange from './containers/VerifyEmailChange';
import CompanyProfile from './containers/CompanyProfile';
import CompanyJobs from './containers/CompanyJobs';
import { getCandidateProfile } from './services/profileApi';
import { getCandidateDashboard } from './services/dashboardApi';
import { setProfile } from './redux/store';
import { attachCandidateSocket, connectCandidateSocket, detachCandidateSocket } from './utils/candidateSocketConnection';

interface AuthGuardProps {
  children: React.ReactNode;
  onboardingGate: OnboardingGateState;
  onRetryOnboardingGate: () => void;
  allowWhenCvMissing?: boolean;
}

interface OnboardingGateState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  accessToken: string;
  canAccessApp: boolean;
  message: string | null;
}

const INITIAL_ONBOARDING_GATE_STATE: OnboardingGateState = {
  status: 'idle',
  accessToken: '',
  canAccessApp: false,
  message: null,
};

function getIsOnboarded(user: unknown): boolean | null {
  if (typeof user !== 'object' || user === null) return null;
  const value = (user as { is_onboarded?: unknown }).is_onboarded;
  return typeof value === 'boolean' ? value : null;
}

function getUserId(user: unknown): string | null {
  if (typeof user !== 'object' || user === null) return null;

  const rawUserId = (user as { user_id?: unknown }).user_id ?? (user as { id?: unknown }).id;
  if (typeof rawUserId === 'string') {
    const trimmed = rawUserId.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof rawUserId === 'number' && Number.isFinite(rawUserId)) {
    return String(rawUserId);
  }

  return null;
}

function AuthGuard({
  children,
  onboardingGate,
  onRetryOnboardingGate,
  allowWhenCvMissing = false,
}: AuthGuardProps) {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const user = useSelector((state: RootState) => state.auth.user);
  const isOnboarded = getIsOnboarded(user);

  if (!accessToken) return <Navigate to="/auth" replace />;

  return (
    <Layout>
      <CvUploadAccessGuard
        onboardingGate={onboardingGate}
        isOnboarded={isOnboarded === true}
        allowWhenCvMissing={allowWhenCvMissing}
        onRetry={onRetryOnboardingGate}
      >
        {children}
      </CvUploadAccessGuard>
    </Layout>
  );
}

function OnboardingAccessGuard({
  children,
  onboardingGate,
  onRetryOnboardingGate,
}: AuthGuardProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const isOnboarded = getIsOnboarded(user);

  if (isOnboarded === true || onboardingGate.canAccessApp) return <Navigate to="/dashboard" replace />;

  if (onboardingGate.status === 'idle') {
    return <div className="min-h-[calc(100vh-76px)] bg-[#F9FAFB]" />;
  }

  if (onboardingGate.status === 'error') {
    return <OnboardingGateError message={onboardingGate.message} onRetry={onRetryOnboardingGate} />;
  }

  return <>{children}</>;
}

function getErrorMessage(error: unknown, fallback = 'Failed to load onboarding status. Please try again.'): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function OnboardingGateError({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-md bg-white border border-[#FDA29B] rounded-xl p-6 text-center">
        <p className="text-[#B42318] text-[14px] font-medium mb-4">
          {message || 'Failed to load onboarding status.'}
        </p>
        <button
          onClick={onRetry}
          className="bg-[#FF6934] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function CvUploadAccessGuard({
  children,
  onboardingGate,
  isOnboarded,
  allowWhenCvMissing,
  onRetry,
}: {
  children: React.ReactNode;
  onboardingGate: OnboardingGateState;
  isOnboarded: boolean;
  allowWhenCvMissing: boolean;
  onRetry: () => void;
}) {
  if (allowWhenCvMissing || isOnboarded || onboardingGate.canAccessApp) return <>{children}</>;

  if (onboardingGate.status === 'idle' || onboardingGate.status === 'loading') {
    return <div className="min-h-[calc(100vh-76px)] bg-[#F9FAFB]" />;
  }

  if (onboardingGate.status === 'error') {
    return <OnboardingGateError message={onboardingGate.message} onRetry={onRetry} />;
  }

  return <Navigate to="/" replace />;
}

function canAccessAppFromDashboard(response: Awaited<ReturnType<typeof getCandidateDashboard>>): boolean {
  return response.onboarding.is_onboarding_complete || response.onboarding.is_cv_uploaded;
}

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.auth.profile);
  const [onboardingGate, setOnboardingGate] = React.useState<OnboardingGateState>(INITIAL_ONBOARDING_GATE_STATE);
  const onboardingGateRequestRef = React.useRef(0);

  const refreshOnboardingGate = React.useCallback(async () => {
    const trimmedAccessToken = accessToken?.trim() || '';
    onboardingGateRequestRef.current += 1;
    const requestId = onboardingGateRequestRef.current;

    if (!trimmedAccessToken) {
      setOnboardingGate(INITIAL_ONBOARDING_GATE_STATE);
      return false;
    }

    setOnboardingGate({
      status: 'loading',
      accessToken: trimmedAccessToken,
      canAccessApp: false,
      message: null,
    });

    try {
      const response = await getCandidateDashboard(trimmedAccessToken);
      if (requestId !== onboardingGateRequestRef.current) return false;

      setOnboardingGate({
        status: 'ready',
        accessToken: trimmedAccessToken,
        canAccessApp: canAccessAppFromDashboard(response),
        message: null,
      });
      return true;
    } catch (error: unknown) {
      if (requestId !== onboardingGateRequestRef.current) return false;

      setOnboardingGate({
        status: 'error',
        accessToken: trimmedAccessToken,
        canAccessApp: false,
        message: getErrorMessage(error),
      });
      return false;
    }
  }, [accessToken]);

  React.useEffect(() => {
    if (!accessToken?.trim()) {
      dispatch(setProfile(null));
      return;
    }

    if (profile) return;

    let isCancelled = false;
    void (async () => {
      try {
        const response = await getCandidateProfile(accessToken);
        if (!isCancelled) {
          dispatch(setProfile(response.profile));
        }
      } catch {
        // Keep app usable even if profile bootstrap fails.
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, dispatch, profile]);

  React.useEffect(() => {
    const trimmedAccessToken = accessToken?.trim() || '';
    const hasCurrentGateState = onboardingGate.accessToken === trimmedAccessToken && onboardingGate.status !== 'idle';

    const timeoutId = window.setTimeout(() => {
      if (!trimmedAccessToken) {
        onboardingGateRequestRef.current += 1;
        setOnboardingGate(INITIAL_ONBOARDING_GATE_STATE);
        return;
      }

      if (!hasCurrentGateState) {
        void refreshOnboardingGate();
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [accessToken, onboardingGate.accessToken, onboardingGate.status, refreshOnboardingGate]);

  React.useEffect(() => {
    const trimmedAccessToken = accessToken?.trim() || '';
    const profileUserId = profile?.user_id?.trim() || '';
    const resolvedUserId = getUserId(user) || profileUserId;

    if (!trimmedAccessToken || !resolvedUserId) return undefined;

    let socket: WebSocket;

    try {
      socket = connectCandidateSocket({
        userId: resolvedUserId,
        accessToken: trimmedAccessToken,
        onOpen: () => {
          console.info('[candidate-socket] connected');
        },
        onError: () => {
          console.error('[candidate-socket] connection error');
        },
        onClose: (event) => {
          console.info(`[candidate-socket] closed (code ${event.code})`);
        },
      });
      attachCandidateSocket(socket);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to initialize socket connection.';
      console.error('[candidate-socket] initialization failed:', message);
      return undefined;
    }

    return () => {
      detachCandidateSocket(socket);
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close(1000, 'Socket cleanup');
      }
    };
  }, [accessToken, profile, user]);

  const handleRetryOnboardingGate = React.useCallback(() => {
    void refreshOnboardingGate();
  }, [refreshOnboardingGate]);

  const authGuardProps = {
    onboardingGate,
    onRetryOnboardingGate: handleRetryOnboardingGate,
  };
  const renderPrivateRoute = (children: React.ReactNode) => (
    <AuthGuard {...authGuardProps}>{children}</AuthGuard>
  );
  const onboardingRoute = (
    <AuthGuard {...authGuardProps} allowWhenCvMissing>
      <OnboardingAccessGuard {...authGuardProps}>
        <Onboarding onCvUploaded={refreshOnboardingGate} />
      </OnboardingAccessGuard>
    </AuthGuard>
  );

  console.log("App Version: 1.0.1 - Deployment Triggered at " + new Date().toLocaleTimeString());
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/forget-password" element={<ForgotPassword />} />
        <Route path="/verify-email-change" element={<VerifyEmailChange />} />
        <Route path="/" element={onboardingRoute} />
                <Route path="/profile/public-view" element={<PublicView/>} />

        <Route path="/onboarding" element={onboardingRoute} />
        <Route path="/dashboard" element={renderPrivateRoute(<Dashboard />)} />
        <Route path="/explore-jobs" element={renderPrivateRoute(<ExploreJobs />)} />
        <Route path="/jobs" element={renderPrivateRoute(<JobsPage />)} />
        <Route path="/jobs/:id" element={renderPrivateRoute(<JobDetail />)} />
        <Route path="/job/:id" element={renderPrivateRoute(<JobDetail />)} />
        <Route path="/profile" element={renderPrivateRoute(<Profile />)} />
        <Route path="/job-detail" element={renderPrivateRoute(<Navigate to="/jobs" replace />)} />
        <Route path="/applications" element={renderPrivateRoute(<Applications />)} />
        <Route path="/saved" element={renderPrivateRoute(<Saved />)} />
        <Route path="/messages" element={renderPrivateRoute(<Messages />)} />
        <Route path="/settings" element={renderPrivateRoute(<Settings />)} />
        <Route path="/company/:id/jobs" element={renderPrivateRoute(<CompanyJobs />)} />
        <Route path="/company/:id" element={renderPrivateRoute(<CompanyProfile />)} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
