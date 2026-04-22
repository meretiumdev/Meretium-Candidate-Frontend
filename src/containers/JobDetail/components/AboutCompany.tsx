import { Building2, Users, ChevronRight } from 'lucide-react';
import type { CandidateJobDetailResponse } from '../../../services/jobsApi';
import { useNavigate } from 'react-router-dom';

interface AboutCompanyProps {
  job?: CandidateJobDetailResponse | null;
}

export default function AboutCompany({ job }: AboutCompanyProps) {
  const navigate = useNavigate();
  const description = job?.company_description || '';
  const industry = job?.company_industry || '';
  const size = job?.company_size_range || '';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope transition-all duration-300">
      <h2 className="text-[24px] font-bold sm:-mt-2 text-[#101828] mb-3">About the company</h2>
      <p className="text-[14px] text-[#475467] leading-relaxed font-regular mb-4">
        {description}
      </p>
      <div className="flex flex-wrap items-center gap-8 mb-4">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-[#475467]" />
          <span className="text-sm text-gray-500 font-regular">Industry: <span className="text-[#101828] font-medium ml-1">{industry}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gray-400" />
          <span className="text-sm text-gray-500 font-regular">Size: <span className="text-[#101828] font-medium ml-1">{size}</span></span>
        </div>
      </div>
      <button 
        onClick={() => navigate('/company')}
        className="flex items-center gap-1 text-[#FF6934] text-[14px] font-medium hover:underline cursor-pointer group"
      >
        View company profile
        <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
