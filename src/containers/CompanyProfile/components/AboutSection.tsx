import { ChevronRight } from 'lucide-react';
import type { CandidateCompanyDetail } from '../../../services/companyApi';

interface AboutSectionProps {
  company: CandidateCompanyDetail | null;
  onViewJobs: () => void;
}

export default function AboutSection({ company, onViewJobs }: AboutSectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope">
      <h2 className="text-[20px] font-bold text-[#101828] mb-3">About the company</h2>
      <p className="text-[14px] text-[#475467] leading-relaxed mb-6 whitespace-pre-wrap">
        {company?.description || 'No company description provided.'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
        <div>
          <p className="text-[12px] text-[#98A2B3] font-medium tracking-wide mb-1">Industry</p>
          <span className="text-[14px] font-medium text-[#101828]">
            {company?.industry || 'Not specified'}
          </span>
        </div>
        <div>
          <p className="text-[12px] text-[#98A2B3] font-medium tracking-wide mb-1">Size</p>
          <span className="text-[14px] font-medium text-[#101828]">
            {company?.size_range || 'Not specified'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onViewJobs}
        className="flex items-center gap-1 text-[#FF6934] text-[14px] font-medium hover:underline cursor-pointer group"
      >
        View company jobs
        <ChevronRight size={14} className="transition-transform group-hover:translate-x-1 -ml-1 mt-1" />
      </button>
    </div>
  );
}
