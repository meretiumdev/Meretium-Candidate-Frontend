import type { CandidateJobDetailResponse } from '../../../services/jobsApi';

interface BenefitsProps {
  job?: CandidateJobDetailResponse | null;
}

export default function Benefits({ job }: BenefitsProps) {
  const points = job?.benefits || [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope transition-all duration-300">
      <h2 className="text-[24px] font-bold sm:-mt-2 text-[#101828] mb-3">Benefits</h2>
      <ul className="space-y-3">
        {points.map((point, idx) => (
          <li key={`${point}-${idx}`} className="flex items-start gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6934] shrink-0 mt-2"></span>
            <span className="text-[14px] text-[#475467] font-regular leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
