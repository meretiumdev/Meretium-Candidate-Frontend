import React from 'react';
import { useSelector } from 'react-redux';
import { Shield, Smartphone, LogOut, Loader2 } from 'lucide-react';
import type { RootState } from '../../../redux/store';
import type { CandidateSettingsActiveSession } from '../../../services/settingsApi';
import { deleteAuthSession } from '../../../services/sessionApi';
import ChangePasswordModal from './ChangePasswordModal';
import EnableTwoFactorModal from './EnableTwoFactorModal';
import { isTwoFactorEnabled } from '../../../utils/twoFactor';

interface SessionItemProps {
  sessionId: string;
  device: string;
  location: string;
  time: string;
  isCurrent?: boolean;
  isLoggingOut?: boolean;
  onLogout?: (sessionId: string) => void;
}

const SessionItem = ({
  sessionId,
  device,
  location,
  time,
  isCurrent,
  isLoggingOut = false,
  onLogout,
}: SessionItemProps) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[10px] border border-[#EAECF0] bg-[#FCFCFD] px-4 py-3 font-manrope">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-[14px] font-medium text-[#101828]">{device}</h4>
          {isCurrent && (
            <span className="inline-flex items-center rounded-full bg-[#FFF1EC] px-2 py-0.5 text-[11px] leading-[14px] font-medium text-[#FF6934]">
              Current
            </span>
          )}
        </div>
        <p className="text-[12px] text-[#667085]">
          {location} · {time}
        </p>
      </div>
      {!isCurrent && (
        <button
          type="button"
          disabled={isLoggingOut}
          onClick={() => {
            if (onLogout) onLogout(sessionId);
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-[14px] font-medium text-[#475467] hover:text-red-600 transition-colors cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoggingOut
            ? <Loader2 size={16} className="animate-spin" />
            : <LogOut size={16} className="group-hover:text-red-600" />}
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      )}
    </div>
  );
};

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface SecurityContentProps {
  accountEmail?: string;
  activeSessions?: CandidateSettingsActiveSession[];
  onSessionsRefresh?: () => Promise<void> | void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to update sessions. Please try again.';
}

function getSessionTimestampMs(lastUsedAt: string): number {
  const parsed = Date.parse(lastUsedAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortSessions(sessions: CandidateSettingsActiveSession[]): CandidateSettingsActiveSession[] {
  return [...sessions].sort((a, b) => {
    if (a.is_current && !b.is_current) return -1;
    if (!a.is_current && b.is_current) return 1;
    return getSessionTimestampMs(b.last_used_at) - getSessionTimestampMs(a.last_used_at);
  });
}

function formatSessionLocation(session: CandidateSettingsActiveSession): string {
  const city = session.city?.trim() || '';
  const country = session.country?.trim() || '';

  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;
  return 'Unknown location';
}

function formatRelativeTime(isoValue: string): string {
  const timestamp = Date.parse(isoValue);
  if (Number.isNaN(timestamp)) return 'Recently active';

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return 'Just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
}

export default function SecurityContent({
  accountEmail = '',
  activeSessions = [],
  onSessionsRefresh,
}: SecurityContentProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  const [isEnableTwoFactorOpen, setIsEnableTwoFactorOpen] = React.useState(false);
  const [isTwoFactorActive, setIsTwoFactorActive] = React.useState(isTwoFactorEnabled(authUser));
  const [sessions, setSessions] = React.useState<CandidateSettingsActiveSession[]>(() => sortSessions(activeSessions));
  const [pendingSessionIds, setPendingSessionIds] = React.useState<Record<string, boolean>>({});
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const requiresTwoFactorVerification = isTwoFactorEnabled(authUser) || isTwoFactorActive;

  React.useEffect(() => {
    setIsTwoFactorActive(isTwoFactorEnabled(authUser));
  }, [authUser]);

  React.useEffect(() => {
    setSessions(sortSessions(activeSessions));
  }, [activeSessions]);

  const showSuccessToast = React.useCallback((message: string) => {
    setToast({ id: Date.now(), message, type: 'success' });
  }, []);

  const showErrorToast = React.useCallback((message: string) => {
    setToast({ id: Date.now(), message, type: 'error' });
  }, []);

  React.useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const handleSessionLogout = async (sessionId: string) => {
    if (pendingSessionIds[sessionId]) return;

    if (!accessToken?.trim()) {
      showErrorToast('You are not authenticated. Please log in again.');
      return;
    }

    setPendingSessionIds((prev) => ({ ...prev, [sessionId]: true }));

    try {
      const successMessage = await deleteAuthSession(accessToken, sessionId);
      setSessions((prev) => sortSessions(prev.filter((session) => session.id !== sessionId)));
      if (onSessionsRefresh) {
        await onSessionsRefresh();
      }
      showSuccessToast(successMessage || 'Session logged out successfully.');
    } catch (error: unknown) {
      showErrorToast(getErrorMessage(error));
    } finally {
      setPendingSessionIds((prev) => {
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });
    }
  };

  return (
    <>
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[160] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
            toast.type === 'success'
              ? 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
              : 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex-1 font-manrope animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 px-1">
          <h1 className="text-xl md:text-[32px] font-semibold text-[#101828] mb-1">Security</h1>
          <p className="text-[#475467] text-[14px]">Manage your account security settings</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 flex items-center justify-between gap-4 shadow-sm transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FFF1EC] flex items-center justify-center shadow-sm">
                <Shield className="text-[#FF6934]" size={24} />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#101828]">Password</h3>
                <p className="text-[14px] text-[#667085]">Keep your account password secure and up to date</p>
              </div>
            </div>
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="px-4 py-2.5 border border-gray-200 shadow-sm rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 whitespace-nowrap cursor-pointer transition-colors"
            >
              Change password
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 flex items-center justify-between gap-4 shadow-sm transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FFF1EC] flex items-center justify-center shadow-sm">
                <Smartphone className="text-[#FF6934]" size={24} />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#101828]">Two-factor authentication</h3>
                <p className="text-[14px] text-[#667085]">
                  {isTwoFactorActive ? 'Authenticator app protection is enabled' : 'Add extra security to your account'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (!accountEmail.trim()) {
                  showErrorToast('Account email is missing. Please refresh settings and try again.');
                  return;
                }
                setIsEnableTwoFactorOpen(true);
              }}
              className={`px-6 py-2.5 rounded-[10px] text-[14px] font-medium whitespace-nowrap cursor-pointer transition-opacity shadow-sm ${
                isTwoFactorActive
                  ? 'bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6] hover:opacity-90'
                  : 'bg-[#FF6934] text-white hover:opacity-90'
              }`}
            >
              {isTwoFactorActive ? '2FA Enabled' : 'Enable 2FA'}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm transition-all duration-300">
            <h3 className="text-[16px] font-semibold text-[#101828] mb-6">Active sessions</h3>
            {sessions.length === 0 ? (
              <p className="text-[14px] text-[#667085]">No active sessions found.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    sessionId={session.id}
                    device={session.device_name || 'Unknown device'}
                    location={formatSessionLocation(session)}
                    time={session.is_current ? 'Current device' : formatRelativeTime(session.last_used_at)}
                    isCurrent={session.is_current}
                    isLoggingOut={pendingSessionIds[session.id] === true}
                    onLogout={handleSessionLogout}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        accessToken={accessToken}
        requireTwoFactor={requiresTwoFactorVerification}
        twoFactorEmail={accountEmail}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccess={showSuccessToast}
        onError={showErrorToast}
      />

      <EnableTwoFactorModal
        isOpen={isEnableTwoFactorOpen}
        accessToken={accessToken}
        email={accountEmail}
        onClose={() => setIsEnableTwoFactorOpen(false)}
        onSuccess={(message) => {
          setIsTwoFactorActive(true);
          showSuccessToast(message);
        }}
        onError={showErrorToast}
      />
    </>
  );
}
