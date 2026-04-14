import { Star, Users, Target } from 'lucide-react';
import { useState } from 'react';
import type { CandidateJobDetailResponse } from '../../../services/jobsApi';

interface SidebarActionsProps {
  job?: CandidateJobDetailResponse | null;
}

function formatPostedLabel(postedAt: string): string {
  if (!postedAt) return '';

  const postedDate = new Date(postedAt);
  if (Number.isNaN(postedDate.getTime())) return '';

  const now = Date.now();
  const diffMs = Math.max(0, now - postedDate.getTime());
  const dayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.floor(diffMs / dayMs);

  if (totalDays <= 0) return 'Today';
  if (totalDays === 1) return '1 day ago';
  if (totalDays < 7) return `${totalDays} days ago`;

  const weeks = Math.floor(totalDays / 7);
  if (weeks === 1) return '1 week ago';
  return `${weeks} weeks ago`;
}

export default function SidebarActions({ job }: SidebarActionsProps) {
  const [isSaved, setIsSaved] = useState(false);
  const posted = formatPostedLabel(job?.posted_at || '');
  const applicants = typeof job?.applicant_count === 'number' ? String(job.applicant_count) : '';
  const jobType = job?.job_type || '';
  const workMode = job?.work_mode || '';
  const match = '80%';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-6 font-manrope transition-all duration-300">
      <div className="space-y-3">
        <button className="w-full bg-[#FF6934] text-white py-3 rounded-[10px] text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm shadow-orange-100">
          Apply now
        </button>
        <button
          onClick={() => setIsSaved(!isSaved)}
          className={`w-full border py-3 rounded-[10px] text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isSaved
              ? 'bg-[#FEF9EE] border-[#FF6934] text-[#344054]'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Star size={18} className={isSaved ? 'fill-[#FF6934] text-[#FF6934]' : ''} />
          {isSaved ? 'Job Saved' : 'Save job'}
        </button>
      </div>

      <div className="space-y-4 pt-6 border-t border-[#E4E7EC] text-[13px]">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-regular">Posted</span>
          <span className="text-gray-900 font-medium">{posted}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-regular">Applicants</span>
          <span className="text-gray-900 font-medium flex items-center gap-1.5"><Users size={16} className="text-gray-900" /> {applicants}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-regular">Job type</span>
          <span className="text-gray-900 font-medium">{jobType}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-regular">Work mode</span>
          <span className="text-gray-900 font-medium">{workMode}</span>
        </div>
      </div>
      <div className="border-t border-[#E4E7EC]"></div>

      <div className="bg-orange-50 rounded-[10px] p-4 flex items-center gap-4">
        <div className="bg-white size-12 rounded-full flex items-center justify-center shrink-0 shadow-sm">
          <Target className="text-[#FF6934] size-6" />
        </div>
        <div>
          <div className="text-[24px] font-black text-[#FF6934] leading-none mb-1">{match}</div>
          <div className="text-[12px] text-gray-600">match</div>
        </div>
      </div>
    </div>
  );
}
