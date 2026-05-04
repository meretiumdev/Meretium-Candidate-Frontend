import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import { createProfileEducation, updateProfileEducation } from '../../../services/profileApi';
import ModalPortal from '../../../components/ModalPortal';

export interface EducationItem {
  id: string;
  educationId: string | null;
  institute: string;
  program: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

interface AddEducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEducationUpdated?: () => Promise<void> | void;
  education?: EducationItem | null;
}

interface ToastState {
  id: number;
  message: string;
  type: 'error' | 'success';
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export default function AddEducationModal({
  isOpen,
  onClose,
  onEducationUpdated,
  education,
}: AddEducationModalProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const isEditMode = !!education;
  const [institute, setInstitute] = useState('');
  const [program, setProgram] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (isEditMode && education) {
      setInstitute(education.institute);
      setProgram(education.program);
      setStartDate(education.startDate);
      setEndDate(education.endDate);
      setIsCurrent(education.isCurrent);
      setDescription(education.description);
      return;
    }

    setInstitute('');
    setProgram('');
    setStartDate('');
    setEndDate('');
    setIsCurrent(false);
    setDescription('');
  }, [education, isEditMode, isOpen]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  if (!isOpen && !toast) return null;

  const closeModal = (force = false) => {
    if (saving && !force) return;
    onClose();
  };

  const validate = (): boolean => {
    if (!institute.trim() || !program.trim()) return false;
    if (!DATE_REGEX.test(startDate.trim())) {
      setToast({ id: Date.now(), message: 'Start date must be in YYYY-MM-DD format.', type: 'error' });
      return false;
    }
    if (!isCurrent && !DATE_REGEX.test(endDate.trim())) {
      setToast({ id: Date.now(), message: 'End date must be in YYYY-MM-DD format.', type: 'error' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!accessToken) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.', type: 'error' });
      return;
    }

    const payload = {
      institute: institute.trim(),
      program: program.trim(),
      start_date: startDate.trim(),
      end_date: isCurrent ? null : endDate.trim(),
      is_current: isCurrent,
      description: description.trim(),
    };

    setSaving(true);
    setToast(null);

    try {
      if (isEditMode) {
        const educationId = education?.educationId?.trim() || '';
        if (!educationId) throw new Error('Education id is missing. Please refresh and try again.');
        await updateProfileEducation(accessToken, educationId, payload);
      } else {
        await createProfileEducation(accessToken, payload);
      }

      await onEducationUpdated?.();
      setToast({
        id: Date.now(),
        message: isEditMode ? 'Education updated successfully.' : 'Education added successfully.',
        type: 'success',
      });
      closeModal(true);
    } catch (error: unknown) {
      setToast({
        id: Date.now(),
        message: getErrorMessage(error, isEditMode ? 'Failed to update education.' : 'Failed to add education.'),
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {toast && (
        <div
          key={toast.id}
          className={`fixed top-4 right-4 z-[140] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
            toast.type === 'error'
              ? 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
              : 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
          }`}
        >
          {toast.message}
        </div>
      )}

      {isOpen && (
        <ModalPortal>
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-all"
          onClick={() => closeModal()}
        >
          <div
            className="w-full max-w-[520px] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col font-manrope"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h3 className="text-[20px] md:text-[22px] font-semibold text-[#101828]">
                {isEditMode ? 'Edit Education' : 'Add Education'}
              </h3>
              <button
                onClick={() => closeModal()}
                disabled={saving}
                className="text-[#667085] hover:text-gray-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[#101828] text-[13px] font-medium mb-2">Institute</label>
                <input
                  value={institute}
                  onChange={(event) => setInstitute(event.target.value)}
                  placeholder="e.g. Rhode Island School of Design"
                  disabled={saving}
                  className="w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3]"
                />
              </div>
              <div>
                <label className="block text-[#101828] text-[13px] font-medium mb-2">Program</label>
                <input
                  value={program}
                  onChange={(event) => setProgram(event.target.value)}
                  placeholder="e.g. BFA in Graphic Design"
                  disabled={saving}
                  className="w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#101828] text-[13px] font-medium mb-2">Start date</label>
                  <input
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    placeholder="YYYY-MM-DD"
                    disabled={saving}
                    className="w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3]"
                  />
                </div>
                <div>
                  <label className="block text-[#101828] text-[13px] font-medium mb-2">End date</label>
                  <input
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    placeholder="YYYY-MM-DD"
                    disabled={saving || isCurrent}
                    className="w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3] disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-[13px] text-[#475467] font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={(event) => setIsCurrent(event.target.checked)}
                  disabled={saving}
                  className="size-4 rounded border border-[#D0D5DD] accent-[#FF6934]"
                />
                I currently study here
              </label>
              <div>
                <label className="block text-[#101828] text-[13px] font-medium mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe your key achievements and responsibilities..."
                  disabled={saving}
                  className="w-full min-h-[110px] border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3] resize-y"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-100 shrink-0">
              <button
                onClick={() => closeModal()}
                disabled={saving}
                className="text-[#475467] text-[14px] font-medium px-4 py-2 hover:bg-gray-50 rounded-[8px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => { void handleSubmit(); }}
                disabled={!institute.trim() || !program.trim() || saving}
                className="bg-[#FF6934] text-white rounded-[8px] px-5 py-2 text-[14px] font-medium transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Education'}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </>
  );
}
