import { Check, ChevronUp } from 'lucide-react';

export default function ProfileCompleteBanner() {
  return (
    <div 
      className="border border-[#12B76A25] rounded-xl p-4 sm:p-6 shadow-sm flex items-center justify-between cursor-pointer transition-all relative overflow-hidden group font-manrope"
      style={{ background: 'linear-gradient(180deg, #D1FADF 0%, #A6F4C5 100%)' }}
    >
      <div className="flex items-center gap-4 relative z-10">
        <div className="size-10 bg-white rounded-full flex items-center justify-center shadow-sm">
          <Check className="text-[#12B76A] size-5" strokeWidth={3} />
        </div>
        <div>
          <h2 className="text-[18px] font-semibold text-[#027A48]">Profile complete!</h2>
          <p className="text-[14px] text-[#027A48] font-medium mt-0.5">
            You're all set to discover AI-powered matches
          </p>
        </div>
      </div>
      <button className="text-[#027A48] opacity-70 hover:opacity-100 transition-opacity relative z-10 cursor-pointer p-2">
        <ChevronUp size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
