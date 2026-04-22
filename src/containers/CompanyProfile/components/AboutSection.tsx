import {ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AboutSection() {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope">
      <h2 className="text-[20px] font-bold text-[#101828] mb-3">About the company</h2>
      <p className="text-[14px] text-[#475467] leading-relaxed mb-6">
        Notion is an all-in-one workspace where you can write, plan, collaborate and get organized. We're
        on a mission to make toolmaking ubiquitous. Our vision is a world where everyone can tailor
        software to their exact needs.
      </p>

      <div className="grid grid-cols-2 gap-6 mb-5">
        <div>
          <p className="text-[12px] text-[#98A2B3] font-medium tracking-wide mb-1">Industry</p>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-[#101828]">Software Development</span>
          </div>
        </div>
        <div>
          <p className="text-[12px] text-[#98A2B3] font-medium tracking-wide mb-1">Size</p>
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-medium text-[#101828]">201–500 employees</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/jobs')}
        className="flex items-center gap-1 text-[#FF6934] text-[14px] font-medium hover:underline cursor-pointer group"
      >
        View company jobs
        <ChevronRight size={14} className="transition-transform group-hover:translate-x-1 -ml-1 mt-1" />
      </button>
    </div>
  );
}
