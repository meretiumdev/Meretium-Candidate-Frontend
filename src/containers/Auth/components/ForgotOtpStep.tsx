import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface ForgotOtpStepProps {
  email: string;
  onSuccess: (otp: string) => void;
  onResend: () => Promise<boolean>;
  resendAvailableAt: number | null;
  onResendAvailableAtChange: (nextTimestamp: number | null) => void;
  resendCooldownSeconds?: number;
  loading?: boolean;
}

const OTP_LENGTH = 6;

function getMaskedEmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes('@')) return trimmed;

  const [name, domain] = trimmed.split('@');
  if (!name || !domain) return trimmed;
  if (name.length <= 2) return `${name[0] ?? ''}***@${domain}`;

  return `${name.slice(0, 2)}***@${domain}`;
}

const ForgotOtpStep: React.FC<ForgotOtpStepProps> = ({
  email,
  onSuccess,
  onResend,
  resendAvailableAt,
  onResendAvailableAtChange,
  resendCooldownSeconds = 30,
  loading = false,
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(0);
  const maskedEmail = getMaskedEmail(email);

  useEffect(() => {
    if (!resendAvailableAt) {
      setSecondsLeft(0);
      return undefined;
    }

    const getNextSecondsLeft = () => Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000));
    const initialSecondsLeft = getNextSecondsLeft();
    setSecondsLeft(initialSecondsLeft);

    if (initialSecondsLeft <= 0) {
      onResendAvailableAtChange(null);
      return undefined;
    }

    const interval = window.setInterval(() => {
      const nextSecondsLeft = getNextSecondsLeft();
      setSecondsLeft(nextSecondsLeft);
      if (nextSecondsLeft <= 0) {
        onResendAvailableAtChange(null);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [onResendAvailableAtChange, resendAvailableAt]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);

    if (value && index < OTP_LENGTH - 1) {
      document.getElementById(`forgot-otp-${index + 1}`)?.focus();
    }
  };

  const isFormValid = otp.every((digit) => digit !== '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    onSuccess(otp.join(''));
  };

  const handleResend = async () => {
    if (loading || secondsLeft > 0) return;
    const sent = await onResend();
    if (sent) {
      onResendAvailableAtChange(Date.now() + resendCooldownSeconds * 1000);
      setOtp(new Array(OTP_LENGTH).fill(''));
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm w-full max-w-[480px] lg:w-[480px] flex flex-col gap-8 font-manrope transition-all duration-300">
      <div>
        <h2
          className="text-[24px] font-semibold text-[#0A1124] leading-[32px] tracking-normal"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Enter Verification Code
        </h2>
        <p className="text-[#475467] text-[14px] mt-3 font-[400] font-body">Enter the 6-digit code sent to {maskedEmail}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-between gap-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`forgot-otp-${idx}`}
              type="text"
              maxLength={1}
              value={digit}
              disabled={loading}
              onChange={(e) => handleOtpChange(idx, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !digit && idx > 0) {
                  document.getElementById(`forgot-otp-${idx - 1}`)?.focus();
                }
              }}
              className="w-12 h-12 text-center text-[20px] font-medium rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none transition-all font-body"
            />
          ))}
        </div>

        <div className="text-center">
          {secondsLeft > 0 ? (
            <p className="text-[#475467] text-[14px] font-body">
              Resend code in <span className="font-medium">{secondsLeft}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-[14px] font-semibold text-[#FF6934] hover:text-[#E5552B] cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Please wait...' : 'Resend code'}
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid || loading}
          className={`w-full text-white font-[600] py-3 rounded-[8px] transition-all text-[14px] font-body active:scale-[0.98] cursor-pointer ${isFormValid && !loading ? 'bg-[#FF6934] hover:bg-[#E5552B]' : 'bg-[#FFBD9D]'}`}
        >
          {loading ? 'Please wait...' : 'Verify code'}
        </button>
      </form>

      <div className="pt-2">
        <Link to="/auth" className="text-[14px] font-semibold text-[#FF6934] hover:text-[#E5552B]">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ForgotOtpStep;
