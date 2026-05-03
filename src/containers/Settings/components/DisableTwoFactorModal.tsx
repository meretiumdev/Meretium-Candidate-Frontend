import React from 'react';
import { ShieldOff, X } from 'lucide-react';
import { disableTwoFactorAuth } from '../../../services/authApi';

interface DisableTwoFactorModalProps {
  isOpen: boolean;
  accessToken: string | null;
  email: string;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to disable two-factor authentication.';
}

export default function DisableTwoFactorModal({
  isOpen,
  accessToken,
  email,
  onClose,
  onSuccess,
  onError,
}: DisableTwoFactorModalProps) {
  const [code, setCode] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setCode('');
      setIsSubmitting(false);
      return;
    }

    setCode('');
    setIsSubmitting(false);
  }, [isOpen]);

  const trimmedCode = code.trim();
  const canSubmit = !isSubmitting && trimmedCode.length > 0;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleDisableTwoFactor = async () => {
    if (!canSubmit) {
      if (!trimmedCode && onError) {
        onError('Please enter your authenticator code or backup code.');
      }
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      if (onError) onError('Email is missing. Please reload settings and try again.');
      return;
    }

    if (!accessToken?.trim()) {
      if (onError) onError('You are not authenticated. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await disableTwoFactorAuth(accessToken, {
        email: trimmedEmail,
        otp: trimmedCode,
      });

      const successMessage = (
        typeof response?.message === 'string' && response.message.trim()
          ? response.message.trim()
          : 'Two-factor authentication disabled successfully.'
      );

      if (onSuccess) onSuccess(successMessage);
      onClose();
    } catch (error: unknown) {
      if (onError) onError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[155] bg-black/45 flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="w-full max-w-[460px] rounded-2xl bg-white border border-[#EAECF0] shadow-xl overflow-hidden font-manrope"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[#EAECF0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FEF3F2] flex items-center justify-center">
              <ShieldOff size={17} className="text-[#B42318]" />
            </div>
            <h3 className="text-[22px] md:text-[24px] font-semibold text-[#101828]">Disable 2FA</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#667085] hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-6">
          <p className="text-[14px] text-[#667085] leading-relaxed mb-6">
            Enter your current authenticator code or backup code to turn off two-factor authentication for
            <span className="font-semibold text-[#101828]"> {email || 'your account'}</span>.
          </p>

          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-[#101828]">Authenticator or backup code</label>
            <input
              type="text"
              value={code}
              disabled={isSubmitting}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter code"
              className="w-full px-4 py-3 bg-white border border-[#D0D5DD] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope"
              autoFocus
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#EAECF0] flex items-center justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-[14px] font-medium text-[#344054] rounded-[10px] hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { void handleDisableTwoFactor(); }}
            disabled={!canSubmit}
            className="px-5 py-2.5 text-[14px] font-medium text-white bg-[#D92D20] rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? 'Disabling...' : 'Disable 2FA'}
          </button>
        </div>
      </div>
    </div>
  );
}
