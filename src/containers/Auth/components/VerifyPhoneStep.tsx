import React from 'react';

interface VerifyPhoneStepProps {
  onSuccess: (phoneNumber: string) => void;
  countryCode: string;
  phone: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  loading?: boolean;
}

const VerifyPhoneStep: React.FC<VerifyPhoneStepProps> = ({
  onSuccess,
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
  loading = false,
}) => {
  const isFormValid = phone.trim().length >= 7;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSuccess(`${countryCode}${phone.trim()}`);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm w-[480px] flex flex-col gap-8 font-manrope transition-all duration-300">
      <div>
        <h2 className="text-[24px] font-semibold text-[#0A1124] leading-[32px] capitalize tracking-normal font-sans" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Verify Your Phone Number
        </h2>
        <p className="text-[#475467] text-[14px] mt-3 font-[400] font-body">We'll send you a code to confirm your number</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-3">
          <div className="w-[100px]">
            <label className="block text-[14px] font-regular text-[#101828] mb-1.5 font-body">Code</label>
            <div className="relative">
              <select
                value={countryCode}
                onChange={(e) => onCountryCodeChange(e.target.value)}
                className="w-full px-3 py-3 rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none text-[14px] appearance-none bg-white cursor-pointer font-body"
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
          <div className="flex-1">
            <label className="block text-[14px] font-regular text-[#101828] mb-1.5 font-body">Phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ''))}
              placeholder="3081438793"
              className="w-full px-4 py-3 rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none text-[14px] font-body"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!isFormValid || loading}
          className={`w-full text-white font-[600] py-3.5 rounded-[8px] transition-all text-[14px] font-[600] active:scale-[0.98] cursor-pointer ${isFormValid && !loading ? 'bg-[#FF6934] hover:bg-[#E5552B]' : 'bg-[#FFBD9D]'}`}
        >
          {loading ? 'Please wait...' : 'Send code'}
        </button>
      </form>
    </div>
  );
};

export default VerifyPhoneStep;
