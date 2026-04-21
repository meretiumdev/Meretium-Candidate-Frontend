import React from 'react';
import { Copy, Smartphone, X } from 'lucide-react';
import { enableTwoFactorAuth, setupTwoFactorAuth } from '../../../services/authApi';

interface EnableTwoFactorModalProps {
  isOpen: boolean;
  accessToken: string | null;
  email: string;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

type TwoFactorStep = 'setup' | 'verify';

const OTP_LENGTH = 6;

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export default function EnableTwoFactorModal({
  isOpen,
  accessToken,
  email,
  onClose,
  onSuccess,
  onError,
}: EnableTwoFactorModalProps) {
  const [step, setStep] = React.useState<TwoFactorStep>('setup');
  const [isLoadingSetup, setIsLoadingSetup] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [secretKey, setSecretKey] = React.useState('');
  const [qrCodeUrl, setQrCodeUrl] = React.useState('');
  const [backupCodeCount, setBackupCodeCount] = React.useState(0);
  const [otp, setOtp] = React.useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [isCopied, setIsCopied] = React.useState(false);
  const copiedTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      setStep('setup');
      setIsLoadingSetup(false);
      setIsSubmitting(false);
      setSecretKey('');
      setQrCodeUrl('');
      setBackupCodeCount(0);
      setOtp(new Array(OTP_LENGTH).fill(''));
      setIsCopied(false);
      return;
    }

    setStep('setup');
    setIsSubmitting(false);
    setOtp(new Array(OTP_LENGTH).fill(''));
    setIsCopied(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      if (onError) onError('Email is missing. Please reload settings and try again.');
      return;
    }

    if (!accessToken?.trim()) {
      if (onError) onError('You are not authenticated. Please log in again.');
      return;
    }

    let isCancelled = false;

    const setupTwoFactor = async () => {
      setIsLoadingSetup(true);
      try {
        const response = await setupTwoFactorAuth(accessToken, { email: trimmedEmail });
        if (isCancelled) return;

        const data = response?.data;
        const nextSecret = typeof data?.secret_key === 'string' ? data.secret_key.trim() : '';
        const nextQrCodeUrl = typeof data?.qr_code_url === 'string' ? data.qr_code_url.trim() : '';
        const nextBackupCodeCount = Array.isArray(data?.backup_codes) ? data.backup_codes.length : 0;

        if (!nextSecret) {
          throw new Error('2FA setup data is incomplete. Please try again.');
        }

        setSecretKey(nextSecret);
        setQrCodeUrl(nextQrCodeUrl);
        setBackupCodeCount(nextBackupCodeCount);
      } catch (error: unknown) {
        if (isCancelled) return;
        if (onError) onError(getErrorMessage(error, 'Failed to initiate 2FA setup.'));
      } finally {
        if (!isCancelled) {
          setIsLoadingSetup(false);
        }
      }
    };

    void setupTwoFactor();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, email, isOpen, onError]);

  const isBusy = isLoadingSetup || isSubmitting;
  const isOtpComplete = otp.every((digit) => digit !== '');
  const qrImageUrl = qrCodeUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrCodeUrl)}`
    : '';

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const handleCopySecret = async () => {
    if (!secretKey) return;
    try {
      await navigator.clipboard.writeText(secretKey);
      setIsCopied(true);
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = window.setTimeout(() => {
        setIsCopied(false);
      }, 1400);
    } catch {
      if (onError) onError('Unable to copy secret key to clipboard.');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);

    if (value && index < OTP_LENGTH - 1) {
      document.getElementById(`enable-2fa-otp-${index + 1}`)?.focus();
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

    const nextFocusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    document.getElementById(`enable-2fa-otp-${nextFocusIndex}`)?.focus();
  };

  const handleEnableTwoFactor = async () => {
    if (!isOtpComplete || isSubmitting) {
      if (!isOtpComplete && onError) {
        onError('Please enter the 6-digit authenticator code.');
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
      const response = await enableTwoFactorAuth(accessToken, {
        email: trimmedEmail,
        otp: otp.join(''),
      });

      const successMessage = (
        typeof response?.message === 'string' && response.message.trim()
          ? response.message.trim()
          : 'Two-factor authentication enabled successfully.'
      );

      if (onSuccess) onSuccess(successMessage);
      onClose();
    } catch (error: unknown) {
      if (onError) onError(getErrorMessage(error, 'Failed to enable two-factor authentication.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[155] bg-black/45 flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="w-full max-w-[640px] rounded-2xl bg-white border border-[#EAECF0] shadow-xl overflow-hidden font-manrope"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#EAECF0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF1EC] flex items-center justify-center">
              <Smartphone size={18} className="text-[#FF6934]" />
            </div>
            <h3 className="text-[22px] md:text-[24px] font-semibold text-[#101828]">
              {step === 'setup' ? 'Enable Two-Factor Authentication' : 'Verify Authenticator Code'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#667085] hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
            disabled={isBusy}
            aria-label="Close modal"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {step === 'setup' && (
          <div>
            <div className="px-6 py-6 space-y-5">
              <p className="text-[14px] text-[#667085] leading-relaxed">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.).
              </p>

              <div className="w-full flex justify-center">
                <div className="w-[180px] h-[180px] rounded-[12px] border border-[#E4E7EC] bg-[#F9FAFB] flex items-center justify-center overflow-hidden">
                  {isLoadingSetup ? (
                    <span className="text-[13px] text-[#98A2B3]">Loading...</span>
                  ) : qrImageUrl ? (
                    <img
                      src={qrImageUrl}
                      alt="2FA QR Code"
                      className="w-[160px] h-[160px] object-contain"
                    />
                  ) : (
                    <span className="text-[13px] text-[#98A2B3]">QR code unavailable</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-medium text-[#344054]">Or enter this code manually:</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={secretKey}
                    className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded-[10px] text-[14px] text-[#101828] font-manrope"
                  />
                  <button
                    type="button"
                    onClick={() => { void handleCopySecret(); }}
                    disabled={!secretKey || isLoadingSetup}
                    className="h-[46px] min-w-[46px] rounded-[10px] border border-[#E4E7EC] bg-white flex items-center justify-center text-[#475467] hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Copy secret key"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                {isCopied && <p className="text-[12px] text-[#027A48]">Secret key copied.</p>}
                {backupCodeCount > 0 && (
                  <p className="text-[12px] text-[#667085]">{backupCodeCount} backup codes generated for this setup.</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#EAECF0] flex items-center justify-end gap-3 bg-white">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 text-[14px] font-medium text-[#344054] rounded-[10px] hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
                disabled={isBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('verify')}
                disabled={isLoadingSetup || !secretKey}
                className="px-5 py-2.5 text-[14px] font-medium text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div>
            <div className="px-6 py-8">
              <p className="text-[14px] text-[#667085] mb-6">
                Enter the 6-digit code from your authenticator app to complete setup.
              </p>

              <div className="flex items-center justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`enable-2fa-otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    disabled={isSubmitting}
                    onPaste={handleOtpPaste}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Backspace' && !digit && index > 0) {
                        document.getElementById(`enable-2fa-otp-${index - 1}`)?.focus();
                      }
                    }}
                    className="w-11 h-11 text-center text-[18px] font-medium rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#EAECF0] flex items-center justify-end gap-3 bg-white">
              <button
                type="button"
                onClick={() => {
                  if (isSubmitting) return;
                  setOtp(new Array(OTP_LENGTH).fill(''));
                  setStep('setup');
                }}
                className="px-4 py-2.5 text-[14px] font-medium text-[#344054] rounded-[10px] hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => { void handleEnableTwoFactor(); }}
                disabled={!isOtpComplete || isSubmitting}
                className="px-5 py-2.5 text-[14px] font-medium text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? 'Verifying...' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
