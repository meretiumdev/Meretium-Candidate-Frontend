import { X, Bell, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { createCandidateJobAlert, type CandidateJobAlertFrequency } from '../services/jobAlertsApi';

interface CreateJobAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (jobRole: string) => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Unable to create job alert. Please try again.';
}

const WORK_MODE_OPTIONS = [
  { label: 'Remote', value: 'REMOTE' },
  { label: 'On-site', value: 'ON_SITE' },
  { label: 'Hybrid', value: 'HYBRID' },
] as const;

export default function CreateJobAlertModal({ isOpen, onClose, onCreated }: CreateJobAlertModalProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [jobRole, setJobRole] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [frequency, setFrequency] = useState<CandidateJobAlertFrequency>('weekly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setJobRole('');
    setLocation('');
    setWorkMode('');
    setFrequency('weekly');
    setIsSubmitting(false);
    setErrorMessage(null);
  }, [isOpen]);

  const isCreateDisabled = useMemo(
    () => isSubmitting || jobRole.trim().length === 0,
    [isSubmitting, jobRole]
  );

  const handleCreate = async () => {
    const trimmedJobRole = jobRole.trim();

    if (!accessToken?.trim()) {
      setErrorMessage('You are not authenticated. Please log in again.');
      return;
    }

    if (!trimmedJobRole) {
      setErrorMessage('Job role is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createCandidateJobAlert(accessToken, {
        job_role: trimmedJobRole,
        location: location.trim() || null,
        work_mode: workMode || null,
        frequency,
      });
      onCreated?.(trimmedJobRole);
      onClose();
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[16px] w-full max-w-[400px] shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-orange-50 rounded-full flex items-center justify-center text-[#FF6934]">
              <Bell size={20} />
            </div>
            <h2 className="text-[20px] font-semibold text-[#101828]">Create Job Alert</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {/* Job Role */}
          <div>
            <label className="block text-sm font-medium text-[#344054] mb-2">Job role *</label>
            <input 
              type="text" 
              placeholder="e.g. Product Designer"
              value={jobRole}
              onChange={(event) => setJobRole(event.target.value)}
              className="w-full px-4 py-3 rounded-[12px] border border-[#D0D5DD] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 focus:border-[#FF6934] transition-all placeholder:text-[#98A2B3] text-sm"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-[#344054] mb-2">Location</label>
            <input 
              type="text" 
              placeholder="e.g. London, UK"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="w-full px-4 py-3 rounded-[12px] border border-[#D0D5DD] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 focus:border-[#FF6934] transition-all placeholder:text-[#98A2B3] text-sm"
            />
          </div>

          {/* Work Mode */}
          <div>
            <label className="block text-sm font-medium text-[#344054] mb-2">Work mode</label>
            <select 
              value={workMode}
              onChange={(event) => setWorkMode(event.target.value)}
              className="w-full px-4 py-3 rounded-[12px] border border-[#D0D5DD] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 focus:border-[#FF6934] transition-all bg-white text-sm appearance-none"
            >
              <option value="">Select work mode</option>
              {WORK_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-[#344054] mb-4">Frequency *</label>
            <div className="flex bg-[#F9FAFB] p-1 rounded-[12px] gap-1">
              <button 
                type="button"
                onClick={() => setFrequency('daily')}
                className={`flex-1 py-2.5 rounded-[10px] text-sm font-medium transition-all cursor-pointer ${frequency === 'daily' ? 'bg-[#FF6934] text-white shadow-sm' : 'text-[#667085] hover:text-[#101828]'}`}
              >
                Daily
              </button>
              <button 
                type="button"
                onClick={() => setFrequency('weekly')}
                className={`flex-1 py-2.5 rounded-[10px] text-sm font-medium transition-all cursor-pointer ${frequency === 'weekly' ? 'bg-[#FF6934] text-white shadow-sm' : 'text-[#667085] hover:text-[#101828]'}`}
              >
                Weekly
              </button>
            </div>
          </div>

          {errorMessage && (
            <p className="text-[13px] text-[#B42318]">{errorMessage}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-2 border-t border-gray-100 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-[#475467] hover:bg-gray-50 rounded-[10px] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={() => { void handleCreate(); }}
            disabled={isCreateDisabled}
            className="px-6 py-2.5 bg-[#FF6934] text-white font-medium text-sm rounded-[10px] shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Creating...
              </span>
            ) : (
              'Create alert'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
