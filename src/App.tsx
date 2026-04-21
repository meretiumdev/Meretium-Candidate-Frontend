import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './redux/store';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

interface AuthGuardProps {
  children: React.ReactNode;
}

function getIsOnboarded(user: unknown): boolean | null {
  if (typeof user !== 'object' || user === null) return null;
  const value = (user as { is_onboarded?: unknown }).is_onboarded;
  return typeof value === 'boolean' ? value : null;
}

function AuthGuard({ children }: AuthGuardProps) {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  if (!accessToken) return <Navigate to="/auth" replace />;
  return <Layout>{children}</Layout>;
}

function OnboardingAccessGuard({ children }: AuthGuardProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const isOnboarded = getIsOnboarded(user);

  if (isOnboarded === true) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
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
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
