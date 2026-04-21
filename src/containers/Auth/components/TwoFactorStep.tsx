import React, { useState } from 'react';

interface TwoFactorStepProps {
  email: string;
  loading?: boolean;
  onBack: () => void;
  onVerify: (totpCode: string) => void;
}

const OTP_LENGTH = 6;

const TwoFactorStep: React.FC<TwoFactorStepProps> = ({
  email,
  loading = false,
  onBack,
  onVerify,
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const isFormValid = otp.every((digit) => digit !== '');

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);

    if (value && index < OTP_LENGTH - 1) {
      document.getElementById(`totp-${index + 1}`)?.focus();
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

    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    document.getElementById(`totp-${focusIndex}`)?.focus();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFormValid || loading) return;
    onVerify(otp.join(''));
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm w-[480px] flex flex-col gap-8 font-manrope transition-all duration-300">
      <div>
        <h2
          className="text-[24px] font-semibold text-[#0A1124] leading-[32px] capitalize tracking-normal font-sans"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Two-Factor Authentication
        </h2>
        <p className="text-[#475467] text-[14px] mt-3 font-[400] font-body">
          Enter the 6-digit code from your authenticator app for {email || 'your account'}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-between gap-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`totp-${idx}`}
              type="text"
              maxLength={1}
              value={digit}
              disabled={loading}
              onPaste={handleOtpPaste}
              onChange={(event) => handleOtpChange(idx, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Backspace' && !digit && idx > 0) {
                  document.getElementById(`totp-${idx - 1}`)?.focus();
                }
              }}
              className="w-12 h-12 text-center text-[20px] font-medium rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none transition-all font-body"
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="px-4 py-2.5 rounded-[8px] border border-[#D1D5DB] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`min-w-[170px] text-white font-[600] py-3 rounded-[8px] transition-all text-[14px] font-body active:scale-[0.98] cursor-pointer ${
              isFormValid && !loading ? 'bg-[#FF6934] hover:bg-[#E5552B]' : 'bg-[#FFBD9D]'
            }`}
          >
            {loading ? 'Please wait...' : 'Verify code'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TwoFactorStep;
