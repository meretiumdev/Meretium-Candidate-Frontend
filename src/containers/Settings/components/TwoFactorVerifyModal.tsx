import React from 'react';
import { Shield, X } from 'lucide-react';
import { verifyTwoFactorAuth } from '../../../services/authApi';

interface TwoFactorVerifyModalProps {
  isOpen: boolean;
  accessToken: string | null;
  email: string;
  onClose: () => void;
  onVerified: () => Promise<void> | void;
}

const OTP_LENGTH = 6;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Unable to verify 2FA code. Please try again.';
}

export default function TwoFactorVerifyModal({
  isOpen,
  accessToken,
  email,
  onClose,
  onVerified,
}: TwoFactorVerifyModalProps) {
  const [otp, setOtp] = React.useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setOtp(new Array(OTP_LENGTH).fill(''));
      setIsSubmitting(false);
      setErrorMessage(null);
      return;
    }

    setOtp(new Array(OTP_LENGTH).fill(''));
    setIsSubmitting(false);
    setErrorMessage(null);
  }, [isOpen]);

  const isOtpComplete = otp.every((digit) => digit !== '');
  const canSubmit = !isSubmitting && isOtpComplete;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);

    if (value && index < OTP_LENGTH - 1) {
      document.getElementById(`settings-2fa-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    event.preventDefault();
    const nextOtp = new Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i += 1) {
      nextOtp[i] = pasted[i];
    }
    setOtp(nextOtp);

    const nextFocusIndex = Math.min(Math.max(pasted.length - 1, 0), OTP_LENGTH - 1);
    document.getElementById(`settings-2fa-otp-${nextFocusIndex}`)?.focus();
  };

  const handleVerify = async () => {
    if (!canSubmit) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Email is missing. Please refresh and try again.');
      return;
    }

    if (!accessToken?.trim()) {
      setErrorMessage('You are not authenticated. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await verifyTwoFactorAuth(accessToken, {
        email: trimmedEmail,
        otp: otp.join(''),
      });

      await onVerified();
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[165] bg-black/45 flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="w-full max-w-[460px] rounded-2xl bg-white border border-[#EAECF0] shadow-xl overflow-hidden font-manrope"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[#EAECF0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFF1EC] flex items-center justify-center">
              <Shield size={16} className="text-[#FF6934]" />
            </div>
            <h3 className="text-[22px] md:text-[24px] font-semibold text-[#101828]">Verify 2FA Code</h3>
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
          <p className="text-center text-[13px] text-[#667085] mb-5">
            Enter the 6-digit code from your authenticator app for
            <br />
            <span className="font-semibold text-[#101828]">{email || 'your account'}</span>
          </p>

          <div className="flex items-center justify-center gap-2 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`settings-2fa-otp-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                disabled={isSubmitting}
                onPaste={handleOtpPaste}
                onChange={(event) => handleOtpChange(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' && !digit && index > 0) {
                    document.getElementById(`settings-2fa-otp-${index - 1}`)?.focus();
                  }
                }}
                className="w-10 h-10 text-center text-[18px] font-medium rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none transition-all"
              />
            ))}
          </div>

          {errorMessage && (
            <p className="text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-[10px] px-3 py-2">
              {errorMessage}
            </p>
          )}
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
            onClick={() => { void handleVerify(); }}
            disabled={!canSubmit}
            className="px-5 py-2.5 text-[14px] font-medium text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
}
