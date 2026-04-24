import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CandidateCompanyJobItem } from '../../../services/companyApi';
import { formatJobTypeLabel } from '../../../utils/formatJobTypeLabel';

interface OpenPositionsProps {
  jobs: CandidateCompanyJobItem[];
  companyName: string;
  onViewAll: () => void;
}

function formatCurrencyAmount(value: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value}`;
  }
}

function formatSalary(job: CandidateCompanyJobItem): string {
  if (job.min_salary !== null && job.max_salary !== null) {
    return `${formatCurrencyAmount(job.min_salary, job.currency)} - ${formatCurrencyAmount(job.max_salary, job.currency)}`;
  }

  if (job.min_salary !== null) {
    return `${formatCurrencyAmount(job.min_salary, job.currency)}+`;
  }

  if (job.max_salary !== null) {
    return `Up to ${formatCurrencyAmount(job.max_salary, job.currency)}`;
  }

  return 'Competitive salary';
}

export default function OpenPositions({ jobs, companyName, onViewAll }: OpenPositionsProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-[18px] md:text-[20px] font-bold text-[#101828]">
          Open positions at {companyName || 'this company'}
        </h2>
        {jobs.length > 0 && (
          <span className="inline-flex items-center w-fit gap-1.5 text-[12px] font-medium text-[#12B76A] bg-[#ECFDF3] px-4 py-1.5 rounded-full">
            Actively hiring
          </span>
        )}
      </div>

      {jobs.length === 0 ? (
        <p className="text-[14px] text-[#475467]">No open positions available right now.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="border border-[#E4E7EC] rounded-[10px] p-4 cursor-pointer hover:border-[#FF6934] transition-all group"
            >
              <h3 className="text-[18px] md:text-[18px] font-semibold text-[#101828] mb-3">
                {job.title || 'Untitled role'}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-[#475467]">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-[#475467]" />
                  {job.location || 'Location not specified'}
                </div>
                <span>|</span>
                <div>{formatJobTypeLabel(job.job_type, 'Full-time')}</div>
                <span>|</span>
                <div className="text-[#12B76A] font-medium">{formatSalary(job)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onViewAll}
        className="w-full mt-6 border border-[#E4E7EC] rounded-[10px] py-4 text-center text-[16px] md:text-[18px] font-medium text-[#344054] hover:bg-gray-50 transition-all cursor-pointer"
      >
        View all jobs
      </button>
    </div>
  );
}
