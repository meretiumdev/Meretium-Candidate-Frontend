import React from 'react';
import { Check, Smartphone, X } from 'lucide-react';
import { confirmPhoneChange, requestPhoneChange } from '../../../services/authApi';
import TwoFactorVerifyModal from './TwoFactorVerifyModal';

interface ChangePhoneModalProps {
  isOpen: boolean;
  currentPhone: string;
  accessToken: string | null;
  requireTwoFactor?: boolean;
  twoFactorEmail?: string;
  onClose: () => void;
  onPhoneChanged: (nextPhone: string) => Promise<void> | void;
}

type ChangePhoneStep = 'form' | 'otp' | 'verified';

const OTP_LENGTH = 6;
const OTP_RESEND_COOLDOWN_SECONDS = 30;
const DEFAULT_COUNTRY_CODE = '+1';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to update phone number. Please try again.';
}

function isValidPhoneNumber(phoneNumber: string): boolean {
  const normalized = phoneNumber.replace(/\D/g, '');
  return normalized.length >= 7;
}

function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[\s()-]/g, '');
}

function getMaskedPhoneNumber(phoneNumber: string): string {
  const normalized = phoneNumber.trim();
  if (normalized.length <= 4) return normalized;
  return `${normalized.slice(0, 4)}******${normalized.slice(-2)}`;
}

export default function ChangePhoneModal({
  isOpen,
  currentPhone,
  accessToken,
  requireTwoFactor = false,
  twoFactorEmail = '',
  onClose,
  onPhoneChanged,
}: ChangePhoneModalProps) {
  const [step, setStep] = React.useState<ChangePhoneStep>('form');
  const [countryCode, setCountryCode] = React.useState(DEFAULT_COUNTRY_CODE);
  const [phoneNumberInput, setPhoneNumberInput] = React.useState('');
  const [pendingPhoneNumber, setPendingPhoneNumber] = React.useState('');
  const [otp, setOtp] = React.useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = React.useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = React.useState(0);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = React.useState(false);
  const [pendingTwoFactorPhone, setPendingTwoFactorPhone] = React.useState('');
  const closeTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setCountryCode(DEFAULT_COUNTRY_CODE);
      setPhoneNumberInput('');
      setPendingPhoneNumber('');
      setOtp(new Array(OTP_LENGTH).fill(''));
      setIsSubmitting(false);
      setErrorMessage(null);
      setResendAvailableAt(null);
      setSecondsLeft(0);
      setIsTwoFactorModalOpen(false);
      setPendingTwoFactorPhone('');
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      return;
    }

    setStep('form');
    setCountryCode(DEFAULT_COUNTRY_CODE);
    setPhoneNumberInput('');
    setPendingPhoneNumber('');
    setOtp(new Array(OTP_LENGTH).fill(''));
    setIsSubmitting(false);
    setErrorMessage(null);
    setResendAvailableAt(null);
    setSecondsLeft(0);
    setIsTwoFactorModalOpen(false);
    setPendingTwoFactorPhone('');
  }, [isOpen]);

  React.useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!resendAvailableAt) {
      setSecondsLeft(0);
      return undefined;
    }

    const getNextSecondsLeft = () => Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000));
    const initialSecondsLeft = getNextSecondsLeft();
    setSecondsLeft(initialSecondsLeft);

    if (initialSecondsLeft <= 0) {
      setResendAvailableAt(null);
      return undefined;
    }

    const timer = window.setInterval(() => {
      const nextSeconds = getNextSecondsLeft();
      setSecondsLeft(nextSeconds);
      if (nextSeconds <= 0) {
        setResendAvailableAt(null);
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendAvailableAt]);

  const trimmedCurrentPhone = currentPhone.trim();
  const combinedPhoneNumber = `${countryCode}${phoneNumberInput.trim()}`;
  const trimmedNewPhone = combinedPhoneNumber.trim();
  const isBusy = isSubmitting || step === 'verified';
  const isOtpComplete = otp.every((digit) => digit !== '');
  const canSubmitRequest = (
    !isSubmitting
    && isValidPhoneNumber(phoneNumberInput)
    && normalizePhoneNumber(trimmedNewPhone) !== normalizePhoneNumber(trimmedCurrentPhone)
  );

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const handleRequestSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmitRequest) return;

    if (!accessToken?.trim()) {
      setErrorMessage('You are not authenticated. Please log in again.');
      return;
    }

    if (requireTwoFactor) {
      const trimmedEmail = twoFactorEmail.trim();
      if (!trimmedEmail) {
        setErrorMessage('Email is missing. Please refresh and try again.');
        return;
      }
      setPendingTwoFactorPhone(trimmedNewPhone);
      setIsTwoFactorModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await requestPhoneChange(accessToken, { new_phone_number: trimmedNewPhone });
      setPendingPhoneNumber(trimmedNewPhone);
      setStep('otp');
      setOtp(new Array(OTP_LENGTH).fill(''));
      setResendAvailableAt(Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);

    if (value && index < OTP_LENGTH - 1) {
      document.getElementById(`change-phone-otp-${index + 1}`)?.focus();
    }
  };

  const handleConfirmOtp = async () => {
    if (!isOtpComplete || isSubmitting) return;

    if (!accessToken?.trim()) {
      setErrorMessage('You are not authenticated. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await confirmPhoneChange(accessToken, { otp: otp.join('') });
      setStep('verified');

      closeTimerRef.current = window.setTimeout(() => {
        void (async () => {
          await onPhoneChanged(pendingPhoneNumber || trimmedNewPhone);
          onClose();
        })();
      }, 1300);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (isSubmitting || secondsLeft > 0) return;

    if (!accessToken?.trim()) {
      setErrorMessage('You are not authenticated. Please log in again.');
      return;
    }

    const requestPhoneNumber = pendingPhoneNumber || trimmedNewPhone;
    if (!requestPhoneNumber) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await requestPhoneChange(accessToken, { new_phone_number: requestPhoneNumber });
      setOtp(new Array(OTP_LENGTH).fill(''));
      setResendAvailableAt(Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/45 flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="w-full max-w-[420px] rounded-2xl bg-white border border-[#EAECF0] shadow-xl overflow-hidden font-manrope"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[#EAECF0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFF1EC] flex items-center justify-center">
              <Smartphone size={16} className="text-[#FF6934]" />
            </div>
            <h3 className="text-[22px] md:text-[24px] font-semibold text-[#101828]">
              {step === 'otp' ? 'Verify OTP' : 'Change Phone Number'}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isBusy}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#667085] hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {step === 'form' && (
          <form onSubmit={handleRequestSubmit}>
            <div className="px-5 py-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#101828]">New phone number</label>
                <div className="flex gap-3">
                  <div className="w-[100px]">
                    <div className="relative">
                      <select
                        value={countryCode}
                        onChange={(event) => setCountryCode(event.target.value)}
                        className="w-full px-3 py-3 rounded-[10px] border border-[#D0D5DD] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 text-[14px] appearance-none bg-white cursor-pointer font-manrope"
                      >
                        <option value="+1">+1</option>
                        <option value="+92">+92</option>
                        <option value="+44">+44</option>
                        <option value="+91">+91</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 1L5 5L9 1" stroke="#475467" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumberInput}
                    onChange={(event) => setPhoneNumberInput(event.target.value.replace(/\D/g, ''))}
                    placeholder="7700900000"
                    className="flex-1 px-4 py-3 bg-white border border-[#D0D5DD] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope"
                  />
                </div>
              </div>

              <div className="rounded-[10px] border border-[#EAECF0] bg-[#F9FAFB] px-4 py-3">
                <p className="text-[12px] text-[#667085]">
                  We&apos;ll send a verification code via SMS to this number.
                </p>
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
                type="submit"
                disabled={!canSubmitRequest}
                className="px-5 py-2.5 text-[14px] font-medium text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <div className="px-5 py-6">
            <p className="text-center text-[13px] text-[#667085] mb-5">
              Enter the 6-digit code sent to
              <br />
              <span className="font-semibold text-[#101828]">{getMaskedPhoneNumber(trimmedNewPhone)}</span>
            </p>

            <div className="flex items-center justify-center gap-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`change-phone-otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  disabled={isSubmitting}
                  onChange={(event) => handleOtpChange(index, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Backspace' && !digit && index > 0) {
                      document.getElementById(`change-phone-otp-${index - 1}`)?.focus();
                    }
                  }}
                  className="w-10 h-10 text-center text-[18px] font-medium rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none transition-all"
                />
              ))}
            </div>

            <div className="text-center mb-4">
              {secondsLeft > 0 ? (
                <p className="text-[13px] text-[#667085]">
                  Resend code in <span className="font-semibold">{secondsLeft}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isSubmitting}
                  className="text-[13px] font-semibold text-[#FF6934] hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Sending...' : 'Resend code'}
                </button>
              )}
            </div>

            {errorMessage && (
              <p className="text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-[10px] px-3 py-2 mb-4">
                {errorMessage}
              </p>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isSubmitting) return;
                  setErrorMessage(null);
                  setStep('form');
                  setOtp(new Array(OTP_LENGTH).fill(''));
                  setResendAvailableAt(null);
                }}
                className="px-4 py-2.5 text-[14px] font-medium text-[#344054] rounded-[10px] hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmOtp}
                disabled={!isOtpComplete || isSubmitting}
                className="px-5 py-2.5 text-[14px] font-medium text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        )}

        {step === 'verified' && (
          <div className="px-5 py-14 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#DCFCE7] flex items-center justify-center mb-5">
              <Check size={28} className="text-[#12B76A]" />
            </div>
            <h4 className="text-[20px] font-semibold text-[#101828] mb-2">Phone Number Verified</h4>
            <p className="text-[14px] text-[#667085]">Your phone number has been updated successfully.</p>
          </div>
        )}
      </div>

      <TwoFactorVerifyModal
        isOpen={isTwoFactorModalOpen}
        accessToken={accessToken}
        email={twoFactorEmail.trim()}
        onClose={() => {
          if (isSubmitting) return;
          setIsTwoFactorModalOpen(false);
          setPendingTwoFactorPhone('');
        }}
        onVerified={async () => {
          const requestPhoneNumber = pendingTwoFactorPhone.trim();
          if (!requestPhoneNumber) return;
          if (!accessToken?.trim()) {
            setErrorMessage('You are not authenticated. Please log in again.');
            return;
          }

          setIsTwoFactorModalOpen(false);
          setPendingTwoFactorPhone('');
          setIsSubmitting(true);
          setErrorMessage(null);

          try {
            await requestPhoneChange(accessToken, { new_phone_number: requestPhoneNumber });
            setPendingPhoneNumber(requestPhoneNumber);
            setStep('otp');
            setOtp(new Array(OTP_LENGTH).fill(''));
            setResendAvailableAt(Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
          } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    </div>
  );
}
