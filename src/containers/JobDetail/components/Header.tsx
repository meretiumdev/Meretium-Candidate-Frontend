import { CheckCircle, MapPin, Briefcase, Clock, Building2 } from 'lucide-react';

export default function Header() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope transition-all duration-300">
      <div className="flex items-start gap-4 md:gap-6">
        <div className="size-14 md:size-16 bg-[#FF6934] rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-[#FF693415]">
          <Building2 className="text-white size-7 md:size-9" />
        </div>
        <div className="mt-1">
          <h1 className="text-xl md:text-[32px] font-bold text-[#101828] leading-tight">Senior Product Designer</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-gray-900 font-semibold text-[18px]">Notion</span>
            <div className="flex items-center gap-1 text-green-500 font-medium text-xs pt-[1px]">
              <CheckCircle size={14} className="text-green-500" /> Verified
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats row */}
      <div className="flex flex-wrap flex-col sm:flex-row items-center sm:items-center sm:ml-20 gap-y-4 gap-x-10 pt-4 md:pt-3 text-[13px] md:text-[14px] text-[#475467] font-medium leading-none">
        <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400" /> London (Remote)</div>
        <div className="flex items-center gap-2"><Briefcase size={16} className="text-gray-400" /> Full-time</div>
        <div className="flex items-center gap-2"><Clock size={16} className="text-gray-400" /> Remote</div>
        <div className="flex items-center gap-2 sm:ml-auto text-gray-900 font-semibold">
          <span className="text-[#FF6934] text-[14px] font-black">$</span> £80,000 - £120,000
        </div>
      </div>
    </div>
  );
}
