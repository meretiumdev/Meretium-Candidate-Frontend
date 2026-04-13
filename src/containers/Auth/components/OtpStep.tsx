import React, { useEffect, useState } from 'react';

interface OtpStepProps {
  onSuccess: (otp: string) => void;
  onResend: () => Promise<boolean>;
  phoneNumber: string;
  resendAvailableAt: number | null;
  onResendAvailableAtChange: (nextTimestamp: number | null) => void;
  resendCooldownSeconds?: number;
  loading?: boolean;
}

const OTP_LENGTH = 6;

function getMaskedPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  if (phoneNumber.length <= 4) return phoneNumber;
  return `${phoneNumber.slice(0, 3)}******${phoneNumber.slice(-2)}`;
}

const OtpStep: React.FC<OtpStepProps> = ({
  onSuccess,
  onResend,
  phoneNumber,
  resendAvailableAt,
  onResendAvailableAtChange,
  resendCooldownSeconds = 30,
  loading = false,
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(0);
  const maskedPhoneNumber = getMaskedPhoneNumber(phoneNumber);

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

    const interval = setInterval(() => {
      const nextSecondsLeft = getNextSecondsLeft();
      setSecondsLeft(nextSecondsLeft);
      if (nextSecondsLeft <= 0) {
        onResendAvailableAtChange(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onResendAvailableAtChange, resendAvailableAt]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const isFormValid = otp.every((digit) => digit !== '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSuccess(otp.join(''));
    }
  };

  const handleResend = async () => {
    if (loading || secondsLeft > 0) return;
    const success = await onResend();
    if (success) {
      onResendAvailableAtChange(Date.now() + resendCooldownSeconds * 1000);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm w-[480px] flex flex-col gap-8 font-manrope transition-all duration-300">
      <div>
        <h2
          className="text-[24px] font-semibold text-[#0A1124] leading-[32px] capitalize tracking-normal font-sans"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Enter Verification Code
        </h2>
        <p className="text-[#475467] text-[14px] mt-3 font-[400] font-body">
          Enter the 6-digit code sent to {maskedPhoneNumber}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-between gap-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-${idx}`}
              type="text"
              maxLength={1}
              value={digit}
              disabled={loading}
              onChange={(e) => handleOtpChange(idx, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !digit && idx > 0) {
                  document.getElementById(`otp-${idx - 1}`)?.focus();
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
    </div>
  );
};

export default OtpStep;
