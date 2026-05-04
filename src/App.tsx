import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './redux/store';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Onboarding from './containers/Onboarding';
import Dashboard from './containers/Dashboard';
import ExploreJobs from './containers/ExploreJobs';
import JobsPage from './containers/Jobs';
import Profile from './containers/Profile';
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
}

interface CvUploadGateState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  accessToken: string;
  path: string;
  shouldBlock: boolean;
  message: string | null;
}

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

function AuthGuard({ children }: AuthGuardProps) {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  if (!accessToken) return <Navigate to="/auth" replace />;
  return <Layout><CvUploadAccessGuard>{children}</CvUploadAccessGuard></Layout>;
}

function OnboardingAccessGuard({ children }: AuthGuardProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const isOnboarded = getIsOnboarded(user);

  if (isOnboarded === true) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function getErrorMessage(error: unknown, fallback = 'Failed to check onboarding status. Please try again.'): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function CvUploadAccessGuard({ children }: AuthGuardProps) {
  const location = useLocation();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const user = useSelector((state: RootState) => state.auth.user);
  const isOnboarded = getIsOnboarded(user);
  const [retryKey, setRetryKey] = React.useState(0);
  const [gateState, setGateState] = React.useState<CvUploadGateState>({
    status: 'idle',
    accessToken: '',
    path: '',
    shouldBlock: false,
    message: null,
  });

  const trimmedAccessToken = accessToken?.trim() || '';
  const currentPath = location.pathname;
  const shouldCheckCvUpload = Boolean(trimmedAccessToken) && isOnboarded !== true && currentPath !== '/';

  React.useEffect(() => {
    if (!shouldCheckCvUpload) {
      setGateState({
        status: 'ready',
        accessToken: trimmedAccessToken,
        path: currentPath,
        shouldBlock: false,
        message: null,
      });
      return;
    }

    let isCancelled = false;
    setGateState({
      status: 'loading',
      accessToken: trimmedAccessToken,
      path: currentPath,
      shouldBlock: false,
      message: null,
    });

    void (async () => {
      try {
        const response = await getCandidateDashboard(trimmedAccessToken);
        if (isCancelled) return;

        setGateState({
          status: 'ready',
          accessToken: trimmedAccessToken,
          path: currentPath,
          shouldBlock: !response.onboarding.is_onboarding_complete && !response.onboarding.is_cv_uploaded,
          message: null,
        });
      } catch (error: unknown) {
        if (isCancelled) return;
        setGateState({
          status: 'error',
          accessToken: trimmedAccessToken,
          path: currentPath,
          shouldBlock: true,
          message: getErrorMessage(error),
        });
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [currentPath, retryKey, shouldCheckCvUpload, trimmedAccessToken]);

  if (!shouldCheckCvUpload) return <>{children}</>;

  const hasCurrentGateState = gateState.accessToken === trimmedAccessToken && gateState.path === currentPath;
  if (!hasCurrentGateState || gateState.status === 'idle' || gateState.status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-76px)] bg-[#F9FAFB]" />
    );
  }

  if (gateState.status === 'error') {
    return (
      <div className="min-h-[calc(100vh-76px)] flex items-center justify-center bg-[#F9FAFB] px-4">
        <div className="w-full max-w-md bg-white border border-[#FDA29B] rounded-xl p-6 text-center">
          <p className="text-[#B42318] text-[14px] font-medium mb-4">{gateState.message}</p>
          <button
            onClick={() => setRetryKey((value) => value + 1)}
            className="bg-[#FF6934] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (gateState.shouldBlock) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.auth.profile);

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

  console.log("App Version: 1.0.1 - Deployment Triggered at " + new Date().toLocaleTimeString());
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/forget-password" element={<ForgotPassword />} />
        <Route path="/verify-email-change" element={<VerifyEmailChange />} />
        <Route path="/" element={<AuthGuard><OnboardingAccessGuard><Onboarding /></OnboardingAccessGuard></AuthGuard>} />
        <Route path="/onboarding" element={<AuthGuard><OnboardingAccessGuard><Onboarding /></OnboardingAccessGuard></AuthGuard>} />
        <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
        <Route path="/explore-jobs" element={<AuthGuard><ExploreJobs /></AuthGuard>} />
        <Route path="/jobs" element={<AuthGuard><JobsPage /></AuthGuard>} />
        <Route path="/jobs/:id" element={<AuthGuard><JobDetail /></AuthGuard>} />
        <Route path="/job/:id" element={<AuthGuard><JobDetail /></AuthGuard>} />
        <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
        <Route path="/job-detail" element={<AuthGuard><Navigate to="/jobs" replace /></AuthGuard>} />
        <Route path="/applications" element={<AuthGuard><Applications /></AuthGuard>} />
        <Route path="/saved" element={<AuthGuard><Saved /></AuthGuard>} />
        <Route path="/messages" element={<AuthGuard><Messages /></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
        <Route path="/company/:id/jobs" element={<AuthGuard><CompanyJobs /></AuthGuard>} />
        <Route path="/company/:id" element={<AuthGuard><CompanyProfile /></AuthGuard>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
