import { Check } from 'lucide-react';
import type { CandidateJobDetailResponse } from '../../../services/jobsApi';

interface RequirementsProps {
  job?: CandidateJobDetailResponse | null;
}

export default function Requirements({ job }: RequirementsProps) {
  const mustHave = job?.must_have_requirements || [];
  const niceToHave = job?.nice_to_have_requirements || [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope transition-all duration-300">
      <h2 className="text-[24px] font-bold sm:-mt-2 text-[#101828] mb-3">Requirements</h2>

      <div className="mb-8">
        <h3 className="text-[14px] font-bold text-[#101828] mb-3">Must have</h3>
        <ul className="space-y-3">
          {mustHave.map((point, idx) => (
            <li key={`${point}-${idx}`} className="flex items-start gap-3">
              <Check size={18} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span className="text-[14px] text-[#475467] leading-relaxed font-regular">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-[14px] font-[600] text-gray-900 mb-3">Nice to have</h3>
        <ul className="space-y-3">
          {niceToHave.map((point, idx) => (
            <li key={`${point}-${idx}`} className="flex items-start gap-3">
              <div className="size-[13px] rounded-full border border-[#FF6934] shrink-0 mt-[5px]"></div>
              <span className="text-[14px] text-gray-500 font-medium leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
