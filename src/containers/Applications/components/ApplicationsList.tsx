import { Building2, MapPin, Calendar, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import ApplicationDetailModal from './ApplicationDetailModal';
import type { ApplicationListItem } from '../types';

interface ApplicationsListProps {
  applications: ApplicationListItem[];
  isLoading: boolean;
  errorMessage: string | null;
  currentPage: number;
  totalPages: number;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

// Reusable progress indicator component
function ApplicationProgress({
  currentStage,
  isFullyCompleted = false,
}: {
  currentStage: number;
  isFullyCompleted?: boolean;
}) {
  const totalStages = 4;

  return (
    <div className="flex items-center mt-4">
      {[...Array(totalStages)].map((_, idx) => {
        const stageNum = idx + 1;
        const isCompleted = stageNum < currentStage || (isFullyCompleted && stageNum === totalStages);
        const isActive = !isFullyCompleted && stageNum === currentStage;

        return (
          <div key={stageNum} className="flex items-center">
            <div
              className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                isCompleted
                  ? 'bg-[#10B981] text-white'
                  : isActive
                    ? 'bg-[#FF6934] text-white shadow-sm shadow-orange-200'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isCompleted ? <Check size={12} strokeWidth={3} /> : stageNum}
            </div>

            {stageNum < totalStages && (
              <div className={`h-[2px] w-6 sm:w-10 ${isCompleted ? 'bg-[#10B981]' : 'bg-gray-100'}`}></div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ApplicationsList({
  applications,
  isLoading,
  errorMessage,
  currentPage,
  totalPages,
  onRetry,
  onPageChange,
}: ApplicationsListProps) {
  const [selectedApp, setSelectedApp] = useState<ApplicationListItem | null>(null);

  if (isLoading && applications.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-5 w-40 bg-gray-200 rounded-md mb-3"></div>
            <div className="h-4 w-24 bg-gray-100 rounded-md mb-5"></div>
            <div className="h-4 w-64 bg-gray-100 rounded-md mb-2"></div>
            <div className="h-4 w-48 bg-gray-100 rounded-md"></div>
          </div>
        ))}
      </div>
    );
  }

  if (errorMessage && applications.length === 0) {
    return (
      <div className="bg-white border border-[#FDA29B] rounded-xl p-6">
        <p className="text-[#B42318] text-[14px] font-medium mb-4">{errorMessage}</p>
        <button
          type="button"
          onClick={onRetry}
          className="bg-[#FF6934] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isLoading && applications.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-[#475467]">
        No applications found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {errorMessage && applications.length > 0 && (
        <div className="text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-[10px] px-4 py-3">
          {errorMessage}
        </div>
      )}

      {applications.map((app) => (
        <div
          key={app.id}
          className="relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between gap-6 transition-all hover:shadow-md pt-6"
        >
          <div className="absolute top-6 right-6">
            <span className={`px-2.5 py-1 rounded-full text-[11px] ${app.statusColor}`}>
              {app.status}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="size-10 bg-[#FF6934] rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-orange-200/50">
              <Building2 className="text-white size-5 opacity-90" />
            </div>

            <div className="flex flex-col">
              <h3 className="text-[18px] font-semibold text-gray-900 leading-tight pr-24">{app.title}</h3>
              <p className="text-[14px] text-gray-500 font-regular mt-1">{app.company}</p>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-[12px] text-[#475467] font-regular">
                <div className="flex items-center gap-1.5"><MapPin size={13} /> {app.location}</div>
                <div className="flex items-center gap-1.5"><Calendar size={13} /> {app.appliedAtLabel}</div>
              </div>

              {app.showProgress && (
                <ApplicationProgress
                  currentStage={app.stage}
                  isFullyCompleted={app.statusCode === 'HIRED'}
                />
              )}
            </div>
          </div>

          <div className="flex items-center sm:items-end justify-center sm:justify-end mt-4 sm:mt-0 z-10 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedApp(app)}
              className="w-full sm:w-auto flex items-center justify-center gap-1 border border-[#FF6934] text-[#FF6934] bg-[#FDF7E9] px-4 py-2.5 sm:py-2 rounded-[10px] text-[14px] font-regular hover:bg-orange-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              View details <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ))}

      {isLoading && applications.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-[#475467] py-2">
          <Loader2 size={16} className="animate-spin text-[#FF6934]" />
          Loading applications...
        </div>
      )}

      {totalPages > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-gray-200 text-[13px] font-medium text-[#344054] disabled:text-[#98A2B3] disabled:bg-gray-50 disabled:cursor-not-allowed cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <p className="text-[13px] text-[#475467] font-medium">
            Page {currentPage} of {totalPages}
          </p>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-gray-200 text-[13px] font-medium text-[#344054] disabled:text-[#98A2B3] disabled:bg-gray-50 disabled:cursor-not-allowed cursor-pointer hover:bg-gray-50 transition-colors"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      <ApplicationDetailModal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        app={selectedApp}
      />
    </div>
  );
}
