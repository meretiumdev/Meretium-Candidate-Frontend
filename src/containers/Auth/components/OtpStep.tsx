import React, { useState, useEffect } from 'react';

interface OtpStepProps {
  onSuccess: () => void;
}

const OtpStep: React.FC<OtpStepProps> = ({ onSuccess }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(29);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const isFormValid = otp.every(digit => digit !== '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSuccess();
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm w-[480px] flex flex-col gap-8 font-manrope transition-all duration-300">
      <div>
        <h2 className="text-[24px] font-semibold text-[#0A1124] leading-[32px] capitalize tracking-normal font-sans" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Enter Verification Code
        </h2>
        <p className="text-[#475467] text-[14px] mt-3 font-[400] font-body">
          Enter the 6-digit code sent to +92 • • • • • 93
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
          <p className="text-[#475467] text-[14px] font-body">
            Resend code in <span className="font-medium">{timer}s</span>
          </p>
        </div>

        <button 
          type="submit" 
          disabled={!isFormValid}
          className={`w-full text-white font-[600] py-3 rounded-[8px] transition-all text-[14px] font-body active:scale-[0.98] cursor-pointer ${isFormValid ? 'bg-[#FF6934] hover:bg-[#E5552B]' : 'bg-[#FFBD9D]'}`}
        >
          Verify code
        </button>
      </form>
    </div>
  );
};

export default OtpStep;
