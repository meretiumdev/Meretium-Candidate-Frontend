import { Target, Check, AlertTriangle, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import MatchImprovementModal from '../../../components/MatchImprovementModal';
import type { CandidateJobDetailResponse } from '../../../services/jobsApi';

interface HowYouMatchProps {
  job?: CandidateJobDetailResponse | null;
}

export default function HowYouMatch({ job }: HowYouMatchProps) {
  const matchingSkills = job?.required_skills || [];
  const missingSkills = job?.preferred_skills || [];
  const [isImproveMatchOpen, setIsImproveMatchOpen] = useState(false);
  const role = job?.title || '';
  const currentMatch = typeof job?.match_percentage === 'number' ? Math.round(job.match_percentage) : null;

  return (
    <div className="bg-[#FDF7E9] border border-[#FF6934] rounded-[14px] p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Target className="text-[#FF6934] size-6" />
        <h2 className="text-[24px] font-semibold text-gray-900">How you match</h2>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-4 text-[14px] font-semibold text-[#12B76A]">
          <Check size={14} strokeWidth={3} /> Matching skills
        </div>
        <div className="flex flex-wrap gap-2.5">
          {matchingSkills.map((skill, idx) => (
            <span key={`${skill}-${idx}`} className="bg-white border border-gray-100 text-gray-700 text-[14px] px-4 py-2 rounded-[10px]">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-4 text-[14px] font-semibold text-yellow-500">
          <AlertTriangle size={14} strokeWidth={3} className="text-[#F59E0B]" /> <span className="text-[#F59E0B]">Missing skills</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {missingSkills.map((skill, idx) => (
            <span key={`${skill}-${idx}`} className="bg-white border border-gray-100 text-gray-700 text-[14px] px-4 py-2 rounded-[10px]">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={() => setIsImproveMatchOpen(true)}
        className="flex items-center gap-1 text-[#FF6934] text-[14px] font-medium hover:underline cursor-pointer group mt-2"
      >
        Improve your match
        <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
      </button>

      <MatchImprovementModal
        isOpen={isImproveMatchOpen}
        onClose={() => setIsImproveMatchOpen(false)}
        role={role}
        currentMatch={currentMatch}
      />
    </div>
  );
}
