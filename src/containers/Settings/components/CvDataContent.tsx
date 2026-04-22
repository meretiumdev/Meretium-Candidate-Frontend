import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle, ChevronDown, Download, Loader2, Trash2 } from 'lucide-react';
import type { AppDispatch, RootState } from '../../../redux/store';
import { setProfile } from '../../../redux/store';
import { exportCandidateData, type CandidateSettingsCvAndDataManagement } from '../../../services/settingsApi';
import { deleteAllCandidateCvs, getCandidateCvs, updateCandidateCv, type CandidateCvItem } from '../../../services/cvApi';
import { updateCandidateProfile } from '../../../services/profileApi';

interface ToggleProps {
  label: string;
  subtextText: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Toggle = ({ label, subtextText, checked, onChange, disabled = false }: ToggleProps) => {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <h4 className="text-[14px] font-medium text-[#101828] mb-0.5">{label}</h4>
        <p className="text-[12px] text-[#667085]">{subtextText}</p>
      </div>
      <button
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative duration-200 shrink-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-[#FF6934]' : 'bg-[#FDF7E9]'}`}
      >
        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-200 ${checked ? 'translate-x-5 bg-white' : 'translate-x-0 bg-[#FF6934]'}`} />
      </button>
    </div>
  );
};

interface CvDataContentProps {
  settings: CandidateSettingsCvAndDataManagement;
  onSettingsRefresh?: () => Promise<void> | void;
}

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function getCvDisplayName(cv: CandidateSettingsCvAndDataManagement['default_cv']): string {
  if (!cv) return 'No default CV selected';
  return cv.name || cv.id || 'Default CV';
}

function triggerBrowserDownload(fileUrl: string, fileName?: string | null): void {
  const anchor = document.createElement('a');
  anchor.href = fileUrl;
  if (fileName && fileName.trim()) {
    anchor.download = fileName.trim();
  }
  anchor.rel = 'noopener noreferrer';
  anchor.target = '_blank';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export default function CvDataContent({ settings, onSettingsRefresh }: CvDataContentProps) {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [useDefaultQuickApply, setUseDefaultQuickApply] = React.useState(settings.quick_apply_default_cv);
  const [selectedDefaultCvId, setSelectedDefaultCvId] = React.useState(settings.default_cv?.id || '');
  const [cvOptions, setCvOptions] = React.useState<CandidateCvItem[]>([]);
  const [isLoadingCvs, setIsLoadingCvs] = React.useState(false);
  const [isUpdatingDefaultCv, setIsUpdatingDefaultCv] = React.useState(false);
  const [isUpdatingQuickApply, setIsUpdatingQuickApply] = React.useState(false);
  const [isExportingData, setIsExportingData] = React.useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [isDeletingAllCvs, setIsDeletingAllCvs] = React.useState(false);
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const cvsRequestRef = React.useRef(0);

  const settingsDefaultCvId = settings.default_cv?.id || '';

  React.useEffect(() => {
    setUseDefaultQuickApply(settings.quick_apply_default_cv);
  }, [settings.quick_apply_default_cv]);

  React.useEffect(() => {
    setSelectedDefaultCvId(settingsDefaultCvId);
  }, [settingsDefaultCvId]);

  React.useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const loadCvs = React.useCallback(async () => {
    const requestId = ++cvsRequestRef.current;
    if (!accessToken?.trim()) {
      setCvOptions([]);
      setIsLoadingCvs(false);
      return;
    }

    setIsLoadingCvs(true);
    try {
      const response = await getCandidateCvs(accessToken);
      if (requestId !== cvsRequestRef.current) return;
      setCvOptions(response);
    } catch (error: unknown) {
      if (requestId !== cvsRequestRef.current) return;
      setToast({
        id: Date.now(),
        message: getErrorMessage(error, 'Unable to load CV list.'),
        type: 'error',
      });
    } finally {
      if (requestId !== cvsRequestRef.current) return;
      setIsLoadingCvs(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    void loadCvs();
  }, [loadCvs]);

  const selectedCvExistsInOptions = selectedDefaultCvId
    ? cvOptions.some((cv) => cv.id === selectedDefaultCvId)
    : false;

  const selectValue = selectedCvExistsInOptions ? selectedDefaultCvId : '';
  const isDefaultCvSelectDisabled = cvOptions.length === 0 || isLoadingCvs || isUpdatingDefaultCv;

  const handleDefaultCvChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCvId = event.target.value.trim();
    if (!nextCvId || nextCvId === selectedDefaultCvId || isUpdatingDefaultCv) return;

    if (!accessToken?.trim()) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.', type: 'error' });
      return;
    }

    const previousCvId = selectedDefaultCvId;
    setSelectedDefaultCvId(nextCvId);
    setIsUpdatingDefaultCv(true);

    try {
      await updateCandidateCv(accessToken, nextCvId, { is_primary: true });
      setCvOptions((prev) => prev.map((cv) => ({ ...cv, is_primary: cv.id === nextCvId })));
      setToast({ id: Date.now(), message: 'Default CV updated successfully.', type: 'success' });
      if (onSettingsRefresh) {
        await onSettingsRefresh();
      }
    } catch (error: unknown) {
      setSelectedDefaultCvId(previousCvId);
      setToast({
        id: Date.now(),
        message: getErrorMessage(error, 'Unable to update default CV.'),
        type: 'error',
      });
    } finally {
      setIsUpdatingDefaultCv(false);
    }
  };

  const handleQuickApplyToggle = async (nextValue: boolean) => {
    if (isUpdatingQuickApply) return;

    if (!accessToken?.trim()) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.', type: 'error' });
      return;
    }

    const previousValue = useDefaultQuickApply;
    setUseDefaultQuickApply(nextValue);
    setIsUpdatingQuickApply(true);

    try {
      const response = await updateCandidateProfile(accessToken, { quick_apply_default_cv: nextValue });
      dispatch(setProfile(response.profile));
      setToast({ id: Date.now(), message: 'Quick Apply default CV preference updated.', type: 'success' });
      if (onSettingsRefresh) {
        await onSettingsRefresh();
      }
    } catch (error: unknown) {
      setUseDefaultQuickApply(previousValue);
      setToast({
        id: Date.now(),
        message: getErrorMessage(error, 'Unable to update Quick Apply preference.'),
        type: 'error',
      });
    } finally {
      setIsUpdatingQuickApply(false);
    }
  };

  const handleDataExport = async () => {
    if (isExportingData) return;

    if (!accessToken?.trim()) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.', type: 'error' });
      return;
    }

    setIsExportingData(true);
    try {
      const response = await exportCandidateData(accessToken);

      if (response.type === 'blob') {
        const blobUrl = window.URL.createObjectURL(response.blob);
        triggerBrowserDownload(blobUrl, response.fileName || 'candidate-data-export.bin');
        window.setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 1500);

        setToast({
          id: Date.now(),
          message: response.message || 'Data export download started.',
          type: 'success',
        });
        return;
      }

      if (response.type === 'url') {
        triggerBrowserDownload(response.url, response.fileName);
        setToast({
          id: Date.now(),
          message: response.message || 'Data export download started.',
          type: 'success',
        });
        return;
      }

      setToast({
        id: Date.now(),
        message: response.message,
        type: 'success',
      });
    } catch (error: unknown) {
      setToast({
        id: Date.now(),
        message: getErrorMessage(error, 'Unable to export your data right now.'),
        type: 'error',
      });
    } finally {
      setIsExportingData(false);
    }
  };

  const handleDeleteAllCvs = async () => {
    if (isDeletingAllCvs) return;

    if (!accessToken?.trim()) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.', type: 'error' });
      return;
    }

    setIsDeletingAllCvs(true);
    try {
      const successMessage = await deleteAllCandidateCvs(accessToken);
      setToast({
        id: Date.now(),
        message: successMessage || 'All CVs deleted successfully.',
        type: 'success',
      });
      setIsDeleteConfirmOpen(false);
      setSelectedDefaultCvId('');
      setCvOptions([]);
      setUseDefaultQuickApply(false);
      if (onSettingsRefresh) {
        await onSettingsRefresh();
      }
      await loadCvs();
    } catch (error: unknown) {
      setToast({
        id: Date.now(),
        message: getErrorMessage(error, 'Unable to delete all CVs. Please try again.'),
        type: 'error',
      });
    } finally {
      setIsDeletingAllCvs(false);
    }
  };

  return (
    <>
      {toast && (
        <div
          key={toast.id}
          className={`fixed top-4 right-4 z-[160] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
            toast.type === 'success'
              ? 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
              : 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex-1 font-manrope animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 px-1">
          <h1 className="text-xl md:text-[32px] font-semibold text-[#101828] mb-1">CV & Data Management</h1>
          <p className="text-[#475467] text-[14px]">Manage your CVs and data export preferences</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 shadow-sm transition-all duration-300">
            <div className="space-y-4">
              <h3 className="text-[14px] font-semibold text-[#101828]">Default CV</h3>
              <div className="relative">
                <select
                  value={selectValue}
                  onChange={handleDefaultCvChange}
                  disabled={isDefaultCvSelectDisabled}
                  className="w-full h-[52px] px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 appearance-none transition-all cursor-pointer disabled:cursor-not-allowed disabled:bg-[#F9FAFB] font-manrope"
                >
                  {selectedDefaultCvId && !selectedCvExistsInOptions && (
                    <option value={selectedDefaultCvId}>
                      {`${getCvDisplayName(settings.default_cv)} (current)`}
                    </option>
                  )}

                  {cvOptions.length === 0 ? (
                    <option value="">
                      {isLoadingCvs ? 'Loading CVs...' : 'No CVs available'}
                    </option>
                  ) : (
                    cvOptions.map((cv) => (
                      <option key={cv.id} value={cv.id}>
                        {cv.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#667085] pointer-events-none" />
              </div>
              <p className="text-[12px] text-[#667085] border-b border-gray-200 pb-6">
                {isUpdatingDefaultCv
                  ? 'Updating default CV...'
                  : 'This CV will be used by default when applying to jobs'}
              </p>

              <Toggle
                label="Use default CV for Quick Apply"
                subtextText="Automatically select your default CV when quick applying"
                checked={useDefaultQuickApply}
                onChange={handleQuickApplyToggle}
                disabled={isUpdatingQuickApply}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 shadow-sm transition-all duration-300">
            <div className="space-y-4">
              <div>
                <h3 className="text-[14px] font-semibold text-[#101828] mb-1">Data export</h3>
                <p className="text-[14px] text-[#667085]">Download all your data including profile, applications, and messages</p>
              </div>
              <button
                onClick={() => { void handleDataExport(); }}
                disabled={isExportingData}
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 shadow-sm rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExportingData ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                {isExportingData ? 'Preparing export...' : 'Download my data'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 shadow-sm transition-all duration-300">
            <div className="space-y-4">
              <div>
                <h3 className="text-[14px] font-semibold text-[#FF4D4F] mb-1">Delete all CVs</h3>
                <p className="text-[14px] text-[#667085]">Permanently remove all uploaded CVs from your account</p>
              </div>
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={isDeletingAllCvs}
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 shadow-sm rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Trash2 size={18} className="text-[#667085] group-hover:text-[#FF4D4F] transition-colors" />
                Delete all CVs
              </button>
            </div>
          </div>
        </div>
      </div>

      {isDeleteConfirmOpen && (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            if (!isDeletingAllCvs) setIsDeleteConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-[16px] border border-gray-100 bg-white p-6 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-[#FEE4E2]">
              <AlertTriangle size={24} className="text-[#F04438]" />
            </div>
            <h3 className="mb-2 text-[18px] font-semibold text-[#101828]">Delete all CVs?</h3>
            <p className="mb-8 text-[14px] leading-relaxed text-[#475467]">
              Are you sure you want to delete all your uploaded CVs? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeletingAllCvs}
                className="rounded-[8px] border border-gray-300 px-6 py-2 text-[14px] font-medium text-[#344054] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { void handleDeleteAllCvs(); }}
                disabled={isDeletingAllCvs}
                className="rounded-[8px] bg-[#FF6934] px-6 py-2 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeletingAllCvs ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
