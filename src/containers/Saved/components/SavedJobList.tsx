import { Building2, Calendar, ChevronLeft, ChevronRight, DollarSign, Loader2, MapPin, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickApplyModal from '../../../components/QuickApplyModal';
import RemoveSavedModal from '../../../components/RemoveSavedModal';
import type { SavedJobListItem } from '../types';

interface SavedJobListProps {
  jobs: SavedJobListItem[];
  isLoading: boolean;
  errorMessage: string | null;
  currentPage: number;
  totalPages: number;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  removingIds: Record<string, boolean>;
  onRemoveSaved: (job: SavedJobListItem) => Promise<void>;
}

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function SavedJobList({
  jobs,
  isLoading,
  errorMessage,
  currentPage,
  totalPages,
  onRetry,
  onPageChange,
  removingIds,
  onRemoveSaved,
}: SavedJobListProps) {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<SavedJobListItem | null>(null);
  const [jobToRemove, setJobToRemove] = useState<SavedJobListItem | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  const getActionErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message.trim()) return error.message;
    return 'Unable to remove saved job right now.';
  };

  const handleRemoveSaved = async (job: SavedJobListItem) => {
    if (removingIds[job.id]) return;

    try {
      await onRemoveSaved(job);
      setToast({ id: Date.now(), message: 'Saved job removed.', type: 'success' });
    } catch (error: unknown) {
      setToast({ id: Date.now(), message: getActionErrorMessage(error), type: 'error' });
    }
  };

  if (isLoading && jobs.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-5 w-48 bg-gray-200 rounded-md mb-3"></div>
            <div className="h-4 w-24 bg-gray-100 rounded-md mb-4"></div>
            <div className="h-4 w-64 bg-gray-100 rounded-md mb-2"></div>
            <div className="h-4 w-40 bg-gray-100 rounded-md"></div>
          </div>
        ))}
      </div>
    );
  }

  if (errorMessage && jobs.length === 0) {
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

  if (!isLoading && jobs.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-[#475467]">
        No saved jobs found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-manrope transition-all duration-300">
      {toast && (
        <div className={`fixed top-4 right-4 z-[140] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
          toast.type === 'error'
            ? 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
            : toast.type === 'success'
              ? 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
              : 'bg-[#F2F4F7] border-[#D0D5DD] text-[#344054]'
        }`}>
          {toast.message}
        </div>
      )}

      {errorMessage && jobs.length > 0 && (
        <div className="text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-[10px] px-4 py-3">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between gap-6 transition-all hover:shadow-md pt-6 group ${
              job.isClosed ? 'opacity-85' : ''
            }`}
          >
            <div className="absolute top-6 right-6 flex items-center gap-2">
              <button
                type="button"
                onClick={() => { void handleRemoveSaved(job); }}
                disabled={!!removingIds[job.id]}
                className="text-[#FF6934] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Remove saved job"
              >
                {removingIds[job.id]
                  ? <Loader2 size={18} className="animate-spin" />
                  : <Star size={18} className={job.isClosed ? '' : 'fill-[#FF6934]'} />}
              </button>
            </div>

            <div className="flex items-start gap-4">
              <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                job.isClosed ? 'bg-gray-100 border-gray-200' : 'bg-[#FFF1EC] border-[#FF693415]'
              }`}>
                <Building2 className={`size-6 ${job.isClosed ? 'text-gray-400' : 'text-[#FF6934]'}`} />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <h3 className="text-[18px] font-semibold text-gray-900 leading-tight pr-24">{job.title}</h3>
                </div>

                <p className="text-[14px] text-gray-500 font-regular mt-1">{job.company}</p>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-[12px] text-[#475467] font-regular">
                  <div className="flex items-center gap-1.5"><MapPin size={13} /> {job.location}</div>
                  <div className="flex items-center gap-1.5"><DollarSign size={13} /> {job.salary}</div>
                  <div className="flex items-center gap-1.5"><Calendar size={13} /> {job.savedAtLabel}</div>
                </div>

                {job.isClosed && (
                  <p className="text-[12px] text-gray-500 font-medium mt-2 italic">
                    This job is no longer accepting applications.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/job/${job.jobId}`)}
                    className="flex-1 sm:flex-none px-4 py-2 text-[14px] font-bold text-[#344054] border border-gray-200 rounded-[10px] hover:bg-gray-50 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    View job
                  </button>
                  {job.isApplied ? (
                    <button
                      type="button"
                      onClick={() => navigate('/applications')}
                      className="flex-1 sm:flex-none px-4 py-2 text-[14px] font-bold text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    >
                      View application
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={job.isClosed}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedJob(job);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 text-[14px] font-bold text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-all cursor-pointer whitespace-nowrap shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Quick apply
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setJobToRemove(job);
                    }}
                    disabled={!!removingIds[job.id]}
                    className="w-full sm:w-auto px-4 py-1.5 text-[14px] font-medium text-gray-500 border border-[#E4E7EC] rounded-[10px] hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Remove saved
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isLoading && jobs.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-[#475467] py-2">
          <Loader2 size={16} className="animate-spin text-[#FF6934]" />
          Loading saved jobs...
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

      <QuickApplyModal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        job={selectedJob ? {
          id: selectedJob.jobId,
          title: selectedJob.title,
          company: selectedJob.company,
          location: selectedJob.location,
        } : null}
        onApplySuccess={() => setToast({ id: Date.now(), message: 'Applied successfully.', type: 'success' })}
        onApplyError={(message) => setToast({ id: Date.now(), message, type: 'error' })}
      />

      <RemoveSavedModal
        isOpen={!!jobToRemove}
        onClose={() => setJobToRemove(null)}
        onConfirm={() => {
          if (!jobToRemove) return;
          void handleRemoveSaved(jobToRemove);
          setJobToRemove(null);
        }}
      />
    </div>
  );
}
