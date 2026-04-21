import React from 'react';
import { useSelector } from 'react-redux';
import { Shield, Smartphone, LogOut } from 'lucide-react';
import type { RootState } from '../../../redux/store';
import ChangePasswordModal from './ChangePasswordModal';
import EnableTwoFactorModal from './EnableTwoFactorModal';
import { isTwoFactorEnabled } from '../../../utils/twoFactor';

interface SessionItemProps {
  device: string;
  location: string;
  time: string;
  isCurrent?: boolean;
}

const SessionItem = ({ device, location, time, isCurrent }: SessionItemProps) => {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0 last:pb-0 font-manrope">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-[14px] font-medium text-[#101828]">{device}</h4>
          {isCurrent && (
            <span className="px-2 py-0.5 bg-[#ECFDF3] text-[#027A48] text-[12px] font-medium rounded-full border border-[#ABEFC6]">
              Current session
            </span>
          )}
        </div>
        <p className="text-[12px] text-[#667085]">
          {location} • {time}
        </p>
      </div>
      {!isCurrent && (
        <button className="flex items-center gap-2 px-3 py-1.5 text-[14px] font-medium text-[#475467] hover:text-red-600 transition-colors cursor-pointer group">
          <LogOut size={16} className="group-hover:text-red-600" />
          <span>Logout</span>
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
}

export default function SecurityContent({ accountEmail = '' }: SecurityContentProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  const [isEnableTwoFactorOpen, setIsEnableTwoFactorOpen] = React.useState(false);
  const [isTwoFactorActive, setIsTwoFactorActive] = React.useState(isTwoFactorEnabled(authUser));
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const requiresTwoFactorVerification = isTwoFactorEnabled(authUser) || isTwoFactorActive;

  React.useEffect(() => {
    setIsTwoFactorActive(isTwoFactorEnabled(authUser));
  }, [authUser]);

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
          {/* Password Card */}
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

          {/* 2FA Card */}
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

          {/* Active Sessions Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm transition-all duration-300">
            <h3 className="text-[16px] font-semibold text-[#101828] mb-6">Active sessions</h3>
            <div className="space-y-2">
              <SessionItem
                device="MacBook Pro"
                location="London, UK"
                time="Current device"
                isCurrent
              />
              <SessionItem
                device="iPhone 14"
                location="London, UK"
                time="2 days ago"
              />
              <SessionItem
                device="Chrome on Windows"
                location="Manchester, UK"
                time="1 week ago"
              />
            </div>
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
