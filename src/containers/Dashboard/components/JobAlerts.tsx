import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CandidateJobAlertCountItem } from '../../../services/jobAlertsApi';

interface JobAlertsProps {
  alerts: CandidateJobAlertCountItem[];
  errorMessage?: string | null;
  onRetry?: () => void;
}

function formatMatchCount(count: number): string {
  const normalized = Math.max(0, Math.trunc(count));
  return `${normalized} new job${normalized === 1 ? '' : 's'}`;
}

export default function JobAlerts({ alerts, errorMessage, onRetry }: JobAlertsProps) {
  const navigate = useNavigate();
  const hasAlerts = alerts.length > 0;
  const visibleAlerts = alerts.slice(0, 3);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm lg:sticky top-24 font-manrope transition-all duration-300">
      <h2 className="text-[16px] font-semibold text-[#101828] mb-6">Job Alerts</h2>

      {errorMessage ? (
        <div className="mb-6 rounded-lg border border-[#FDA29B] bg-[#FEF3F2] p-3">
          <p className="text-[13px] font-medium text-[#B42318]">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-[13px] font-semibold text-[#B42318] underline cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      ) : hasAlerts ? (
        <div className="space-y-4 mb-6">
          {visibleAlerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-4">
              <div className="size-10 shrink-0 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                <Bell className="text-[#FF6934] size-5" />
              </div>
              <div>
                <p className="text-[14px] text-gray-500 font-semibold leading-[19px]">
                  <span className="font-bold text-[14px] text-gray-900">{formatMatchCount(alert.new_matches_count)}</span> match your {alert.job_role} alert
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-4">
          <p className="text-[13px] text-[#475467]">
            No active alerts yet. Create a job alert from the Jobs page.
          </p>
        </div>
      )}

      <button 
        onClick={() => navigate('/jobs')}
        className="w-full bg-[#FF6934] text-white py-2.5 rounded-[10px] text-[14px] font-medium hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
      >
        View all
      </button>
    </div>
  );
}
