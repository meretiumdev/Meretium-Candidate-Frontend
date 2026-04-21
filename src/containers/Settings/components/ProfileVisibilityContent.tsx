import React from 'react';
import { useSelector } from 'react-redux';
import { ChevronDown, Check } from 'lucide-react';
import type { CandidateProfileVisibility, CandidateSettingsProfileAndVisibility } from '../../../services/settingsApi';
import type { RootState } from '../../../redux/store';
import { updateCandidateProfile, type OpenToWorkStatus, type UpdateProfilePayload } from '../../../services/profileApi';

interface ToggleProps {
  label: string;
  subtextText: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Toggle = ({ label, subtextText, checked, onChange, disabled = false }: ToggleProps) => {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0 last:pb-0 font-manrope">
      <div>
        <h4 className="text-[14px] font-medium text-[#101828] mb-0.5">{label}</h4>
        <p className="text-[14px] text-[#667085]">{subtextText}</p>
      </div>
      <button 
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative duration-200 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${checked ? 'bg-[#FF6934]' : 'bg-[#EAECF0]'}`}
      >
        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
};

interface ProfileVisibilityContentProps {
  settings: CandidateSettingsProfileAndVisibility;
  onSettingsPatched?: (patch: Partial<CandidateSettingsProfileAndVisibility>) => void;
}

interface ToastState {
  id: number;
  message: string;
}

type PendingKey = 'visibility' | 'openToWork' | 'allowCvDownload' | 'showActiveStatus';

function toOpenToWorkStatus(value: CandidateProfileVisibility): OpenToWorkStatus {
  if (value === 'public') return 'Open to opportunities';
  if (value === 'matched') return 'Visible to matched recruiters';
  return 'Private';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to update profile visibility settings. Please try again.';
}

function getVisibilityOptions() {
  return [
    {
      id: 'public' as CandidateProfileVisibility,
      title: 'Open to all recruiters',
      description: 'Your profile is visible to all recruiters',
    },
    {
      id: 'matched' as CandidateProfileVisibility,
      title: 'Only matched recruiters',
      description: 'Only recruiters you match with can see your profile',
    },
    {
      id: 'private' as CandidateProfileVisibility,
      title: 'Private',
      description: 'Your profile is hidden from all recruiters',
    },
  ];
}

export default function ProfileVisibilityContent({ settings, onSettingsPatched }: ProfileVisibilityContentProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [openToWork, setOpenToWork] = React.useState(settings.is_open_to_work);
  const [allowCvDownload, setAllowCvDownload] = React.useState(settings.allow_cv_download);
  const [showActiveStatus, setShowActiveStatus] = React.useState(settings.show_last_active);
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedVisibility, setSelectedVisibility] = React.useState<CandidateProfileVisibility>(settings.profile_visibility);
  const [pending, setPending] = React.useState<Record<PendingKey, boolean>>({
    visibility: false,
    openToWork: false,
    allowCvDownload: false,
    showActiveStatus: false,
  });
  const [toast, setToast] = React.useState<ToastState | null>(null);

  React.useEffect(() => {
    setOpenToWork(settings.is_open_to_work);
    setAllowCvDownload(settings.allow_cv_download);
    setShowActiveStatus(settings.show_last_active);
    setSelectedVisibility(settings.profile_visibility);
  }, [settings.allow_cv_download, settings.is_open_to_work, settings.profile_visibility, settings.show_last_active]);

  React.useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const options = getVisibilityOptions();

  const currentOption = options.find((option) => option.id === selectedVisibility) || options[2];

  const runProfileUpdate = async (
    pendingKey: PendingKey,
    updates: UpdateProfilePayload,
    optimisticUpdate: () => void,
    rollback: () => void,
    onPatched?: () => void
  ) => {
    if (pending[pendingKey]) return;

    if (!accessToken?.trim()) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.' });
      return;
    }

    optimisticUpdate();
    setPending((prev) => ({ ...prev, [pendingKey]: true }));

    try {
      await updateCandidateProfile(accessToken, updates);
      if (onPatched) onPatched();
    } catch (error: unknown) {
      rollback();
      setToast({ id: Date.now(), message: getErrorMessage(error) });
    } finally {
      setPending((prev) => ({ ...prev, [pendingKey]: false }));
    }
  };

  const handleVisibilityChange = (nextVisibility: CandidateProfileVisibility) => {
    if (nextVisibility === selectedVisibility) {
      setIsOpen(false);
      return;
    }

    const previousVisibility = selectedVisibility;
    setIsOpen(false);

    void runProfileUpdate(
      'visibility',
      { open_to_work_status: toOpenToWorkStatus(nextVisibility) },
      () => setSelectedVisibility(nextVisibility),
      () => setSelectedVisibility(previousVisibility),
      () => {
        if (onSettingsPatched) {
          onSettingsPatched({ profile_visibility: nextVisibility });
        }
      }
    );
  };

  const handleOpenToWorkChange = (nextValue: boolean) => {
    const previousValue = openToWork;
    if (nextValue === previousValue) return;

    void runProfileUpdate(
      'openToWork',
      { is_open_to_work: nextValue },
      () => setOpenToWork(nextValue),
      () => setOpenToWork(previousValue),
      () => {
        if (onSettingsPatched) {
          onSettingsPatched({ is_open_to_work: nextValue });
        }
      }
    );
  };

  const handleAllowCvDownloadChange = (nextValue: boolean) => {
    const previousValue = allowCvDownload;
    if (nextValue === previousValue) return;

    void runProfileUpdate(
      'allowCvDownload',
      { allow_cv_download: nextValue },
      () => setAllowCvDownload(nextValue),
      () => setAllowCvDownload(previousValue),
      () => {
        if (onSettingsPatched) {
          onSettingsPatched({ allow_cv_download: nextValue });
        }
      }
    );
  };

  const handleShowActiveStatusChange = (nextValue: boolean) => {
    const previousValue = showActiveStatus;
    if (nextValue === previousValue) return;

    void runProfileUpdate(
      'showActiveStatus',
      { show_last_active: nextValue },
      () => setShowActiveStatus(nextValue),
      () => setShowActiveStatus(previousValue),
      () => {
        if (onSettingsPatched) {
          onSettingsPatched({ show_last_active: nextValue });
        }
      }
    );
  };

  return (
    <div className="flex-1 font-manrope animate-in fade-in slide-in-from-bottom-4 duration-500">
      {toast && (
        <div
          key={toast.id}
          className="fixed top-4 right-4 z-[160] max-w-[360px] bg-[#FEF3F2] border border-[#FDA29B] text-[#B42318] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium"
        >
          {toast.message}
        </div>
      )}

      <div className="mb-8 px-1">
        <h1 className="text-xl md:text-[32px] font-semibold text-[#101828] mb-1">Profile & Visibility</h1>
        <p className="text-[#475467] text-[14px]">Control who can see your profile and what information is displayed</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 space-y-8 shadow-sm transition-all duration-300 font-manrope">
        {/* Profile Visibility custom dropdown */}
        <div className="space-y-3 relative z-20">
          <label className="text-[14px] font-semibold text-[#101828]">Profile visibility</label>
          
          {/* Dropdown Trigger */}
          <div className="relative mt-2">
            <button
              disabled={pending.visibility}
              onClick={() => setIsOpen(!isOpen)}
              className={`w-full h-[52px] px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-[10px] text-[14px] text-[#101828] flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 transition-all font-manrope ${pending.visibility ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <span className="font-regular text-[#101828]">{currentOption.title}</span>
              <ChevronDown size={20} className={`text-[#667085] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Selection List */}
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {options.map((option) => (
                  <button
                    disabled={pending.visibility}
                    key={option.id}
                    onClick={() => handleVisibilityChange(option.id)}
                    className={`w-full text-left p-4 sm:p-5 flex items-center justify-between transition-all duration-200 border-b border-gray-50 last:border-0 ${
                      pending.visibility ? 'cursor-not-allowed opacity-60' :
                      selectedVisibility === option.id ? 'bg-[#FFF1EC]' : 'hover:bg-gray-50 bg-white'
                    }`}
                  >
                    <div>
                      <h4 className="text-[14px] font-semibold text-[#101828]">{option.title}</h4>
                      <p className="text-[13px] text-[#667085] mt-1">{option.description}</p>
                    </div>
                    {selectedVisibility === option.id && (
                      <Check size={20} className="text-[#FF6934] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <p className="text-[12px] text-[#667085] leading-relaxed">
            {currentOption.description}
          </p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <Toggle 
            label="Show 'Open to work' badge"
            subtextText="Display on your profile to attract recruiters"
            checked={openToWork}
            onChange={handleOpenToWorkChange}
            disabled={pending.openToWork}
          />
          <Toggle 
            label="Allow CV download"
            subtextText="Let recruiters download your CV"
            checked={allowCvDownload}
            onChange={handleAllowCvDownloadChange}
            disabled={pending.allowCvDownload}
          />
          <Toggle 
            label="Show last active status"
            subtextText="Display when you were last active on the platform"
            checked={showActiveStatus}
            onChange={handleShowActiveStatusChange}
            disabled={pending.showActiveStatus}
          />
        </div>
      </div>
    </div>
  );
}
