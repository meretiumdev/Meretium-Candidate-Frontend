import { CheckCircle, MapPin, Briefcase, Clock, Building2 } from 'lucide-react';
import type { CandidateJobDetailResponse } from '../../../services/jobsApi';

interface HeaderProps {
  job?: CandidateJobDetailResponse | null;
}

function formatSalary(minSalary: number | null, maxSalary: number | null, currency: string): string {
  if (minSalary === null && maxSalary === null) return '';

  const formatAmount = (value: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${value}`;
    }
  };

  if (minSalary !== null && maxSalary !== null) {
    return `${formatAmount(minSalary)} - ${formatAmount(maxSalary)}`;
  }
  if (minSalary !== null) return formatAmount(minSalary);
  if (maxSalary !== null) return formatAmount(maxSalary);
  return '';
}

export default function Header({ job }: HeaderProps) {
  const title = job?.title || '';
  const companyName = job?.company.name || '';
  const isVerified = job?.company.is_verified === true;
  const location = job?.location || '';
  const jobType = job?.job_type || '';
  const workMode = job?.work_mode || '';
  const salary = formatSalary(job?.min_salary ?? null, job?.max_salary ?? null, job?.currency || '');

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope transition-all duration-300">
      <div className="flex items-start gap-4 md:gap-6">
        <div className="size-14 md:size-16 bg-[#FF6934] rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-[#FF693415]">
          <Building2 className="text-white size-7 md:size-9" />
        </div>
        <div className="mt-1">
          <h1 className="text-xl md:text-[32px] font-bold text-[#101828] leading-tight">{title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-gray-900 font-semibold text-[18px]">{companyName}</span>
            {isVerified && (
              <div className="flex items-center gap-1 text-green-500 font-medium text-xs pt-[1px]">
                <CheckCircle size={14} className="text-green-500" /> Verified
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap flex-col sm:flex-row items-center sm:items-center sm:ml-20 gap-y-4 gap-x-10 pt-4 md:pt-3 text-[13px] md:text-[14px] text-[#475467] font-medium leading-none">
        <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400" /> {location}</div>
        <div className="flex items-center gap-2"><Briefcase size={16} className="text-gray-400" /> {jobType}</div>
        <div className="flex items-center gap-2"><Clock size={16} className="text-gray-400" /> {workMode}</div>
        <div className="flex items-center gap-2 sm:ml-auto text-gray-900 font-semibold">
          {salary}
        </div>
      </div>
    </div>
  );
}
