import React from 'react';

const VerifiedStep: React.FC = () => {
  return (
    <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm w-[480px] text-center flex flex-col items-center justify-center py-16 font-manrope transition-all duration-300">
      <div className="w-[84px] h-[84px] bg-[#DCFCE7] rounded-full flex items-center justify-center mb-8">
        <svg width="34" height="26" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.66663 12L10.6666 20L29.3333 4" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      <h2 className="text-[24px] font-semibold text-[#0A111F] leading-[32px] capitalize tracking-normal mb-3 font-sans" style={{ fontFamily: "'Manrope', sans-serif" }}>
        Phone Number Verified
      </h2>
      
      <p className="text-[#475467] text-[15px] font-[400] font-body">
        Redirecting to sign in...
      </p>
    </div>
  );
};

export default VerifiedStep;
