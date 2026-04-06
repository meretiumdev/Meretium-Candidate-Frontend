import { Building2, Users, ChevronRight } from 'lucide-react';

export default function AboutCompany() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope transition-all duration-300">
      <h2 className="text-[24px] font-bold sm:-mt-2 text-[#101828] mb-3">About the company</h2>
      <p className="text-[14px] text-[#475467] leading-relaxed font-regular mb-4">
        Notion is an all-in-one workspace where you can write, plan, collaborate and get organized. We're on a mission to make toolmaking ubiquitous. Our vision is a world where everyone can tailor software to their exact needs.
      </p>
      <div className="flex flex-wrap items-center gap-8 mb-4">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-[#475467" />
          <span className="text-sm text-gray-500 font-regular">Industry: <span className="text-[#101828] font-medium ml-1">Software Development</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gray-400" />
          <span className="text-sm text-gray-500 font-regular">Size: <span className="text-[#101828] font-medium ml-1">201-500 employees</span></span>
        </div>
      </div>
      <button className="flex items-center gap-1 text-[#FF6934] text-[14px] font-medium hover:underline cursor-pointer group">
        View company profile 
        <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
