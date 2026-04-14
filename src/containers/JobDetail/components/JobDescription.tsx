import type { CandidateJobDetailResponse } from '../../../services/jobsApi';

interface JobDescriptionProps {
  job?: CandidateJobDetailResponse | null;
}

export default function JobDescription({ job }: JobDescriptionProps) {
  const text = job?.job_description_full
    || job?.description
    || '';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope transition-all duration-300">
      <h2 className="text-[24px] font-bold sm:-mt-2 text-[#101828] mb-3">Job description</h2>
      <p className="text-[14px] text-[#475467] leading-relaxed font-regular mb-4">
        {text}
      </p>
    </div>
  );
}
