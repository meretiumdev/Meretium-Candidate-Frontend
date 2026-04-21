import React from 'react';
import { Lock, X } from 'lucide-react';
import { changePassword } from '../../../services/authApi';
import TwoFactorVerifyModal from './TwoFactorVerifyModal';

interface ChangePasswordModalProps {
  isOpen: boolean;
  accessToken: string | null;
  requireTwoFactor?: boolean;
  twoFactorEmail?: string;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to change password. Please try again.';
}

function getValidationMessage(oldPassword: string, newPassword: string, confirmPassword: string): string | null {
  if (!oldPassword.trim()) return 'Current password is required.';
  if (!newPassword.trim()) return 'New password is required.';
  if (!confirmPassword.trim()) return 'Please confirm your new password.';
  if (newPassword !== confirmPassword) return 'New password and confirm password do not match.';
  if (newPassword === oldPassword) return 'New password must be different from current password.';

  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
  if (newPassword.length < 8 || !hasLetter || !hasNumber || !hasSymbol) {
    return 'Password must be at least 8 characters with letters, numbers and symbols.';
  }

  return null;
}

export default function ChangePasswordModal({
  isOpen,
  accessToken,
  requireTwoFactor = false,
  twoFactorEmail = '',
  onClose,
  onSuccess,
  onError,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = React.useState(false);
  const [pendingSubmission, setPendingSubmission] = React.useState<{ oldPassword: string; newPassword: string } | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsSubmitting(false);
      setIsTwoFactorModalOpen(false);
      setPendingSubmission(null);
      return;
    }

    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsSubmitting(false);
    setIsTwoFactorModalOpen(false);
    setPendingSubmission(null);
  }, [isOpen]);

  const validationMessage = getValidationMessage(oldPassword, newPassword, confirmPassword);
  const canSubmit = !isSubmitting && !validationMessage;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const submitPasswordChange = async (payload: { oldPassword: string; newPassword: string }) => {
    if (!accessToken?.trim()) {
      if (onError) onError('You are not authenticated. Please log in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await changePassword(accessToken, {
        old_password: payload.oldPassword,
        new_password: payload.newPassword,
      });

      const successMessage = (
        typeof response?.message === 'string' && response.message.trim()
          ? response.message.trim()
          : 'Password changed successfully.'
      );

      if (onSuccess) onSuccess(successMessage);
      onClose();
    } catch (error: unknown) {
      if (onError) onError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (validationMessage) {
      if (onError) onError(validationMessage);
      return;
    }

    const payload = {
      oldPassword,
      newPassword,
    };

    if (requireTwoFactor) {
      const trimmedEmail = twoFactorEmail.trim();
      if (!trimmedEmail) {
        if (onError) onError('Email is missing. Please refresh and try again.');
        return;
      }

      setPendingSubmission(payload);
      setIsTwoFactorModalOpen(true);
      return;
    }

    await submitPasswordChange(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/45 flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="w-full max-w-[640px] rounded-2xl bg-white border border-[#EAECF0] shadow-xl overflow-hidden font-manrope"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#EAECF0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF1EC] flex items-center justify-center">
              <Lock size={18} className="text-[#FF6934]" />
            </div>
            <h3 className="text-[22px] md:text-[24px] font-semibold text-[#101828]">Change Password</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#667085] hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
            disabled={isSubmitting}
            aria-label="Close modal"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 space-y-5">
            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-[#101828]">Current password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-3 bg-white border border-[#D0D5DD] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-[#101828]">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 bg-white border border-[#D0D5DD] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-[#101828]">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-3 bg-white border border-[#D0D5DD] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope"
              />
            </div>

            <div className="rounded-[10px] border border-[#EAECF0] bg-[#F9FAFB] px-4 py-3">
              <p className="text-[13px] text-[#667085]">
                Password must be at least 8 characters with a mix of letters, numbers and symbols.
              </p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#EAECF0] flex items-center justify-end gap-3 bg-white">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-[14px] font-medium text-[#344054] rounded-[10px] hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-5 py-2.5 text-[14px] font-medium text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save password'}
            </button>
          </div>
        </form>
      </div>

      <TwoFactorVerifyModal
        isOpen={isTwoFactorModalOpen}
        accessToken={accessToken}
        email={twoFactorEmail.trim()}
        onClose={() => {
          if (isSubmitting) return;
          setIsTwoFactorModalOpen(false);
          setPendingSubmission(null);
        }}
        onVerified={async () => {
          const payload = pendingSubmission;
          if (!payload) return;
          setIsTwoFactorModalOpen(false);
          setPendingSubmission(null);
          await submitPasswordChange(payload);
        }}
      />
    </div>
  );
}
