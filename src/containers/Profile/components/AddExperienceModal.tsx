import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import { createProfileExperience, updateProfileExperience } from '../../../services/profileApi';

interface Experience {
  id: string | number;
  experienceId?: string | null;
  role: string;
  company: string;
  duration?: string;
  bullets: string[];
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExperienceAdded?: () => Promise<void> | void;
  experience?: Experience | null;
}

interface ToastState {
  id: number;
  message: string;
  type: 'error' | 'success';
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export default function AddExperienceModal({
  isOpen,
  onClose,
  onExperienceAdded,
  experience,
}: ExperienceModalProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const isEditMode = !!experience;

  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [current, setCurrent] = useState(false);
  const [description, setDescription] = useState('');
  const [achievements, setAchievements] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (isEditMode && experience) {
      setRole(experience.role);
      setCompany(experience.company);
      setStartDate(experience.startDate || '');
      setEndDate(experience.endDate || '');
      setCurrent(!!experience.isCurrent);
      setDescription(experience.description || '');
      setAchievements(experience.bullets.length > 0 ? experience.bullets : []);
    } else {
      setRole('');
      setCompany('');
      setStartDate('');
      setEndDate('');
      setCurrent(false);
      setDescription('');
      setAchievements([]);
    }
  }, [experience, isOpen, isEditMode]);

  useEffect(() => {
    if (!toast) return undefined;

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  if (!isOpen && !toast) return null;

  const closeModal = (force = false) => {
    if (saving && !force) return;
    onClose();
  };

  const handleAchievementChange = (index: number, value: string) => {
    setAchievements((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const handleAddAchievement = () => {
    setAchievements((prev) => [...prev, '']);
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements((prev) => {
      if (prev.length <= 1) return [];
      return prev.filter((_, i) => i !== index);
    });
  };

  const isDateValid = (value: string): boolean => DATE_REGEX.test(value.trim());

  const handleSubmit = async () => {
    if (!role.trim() || !company.trim()) return;

    if (!startDate.trim()) {
      setToast({ id: Date.now(), message: 'Start date is required.', type: 'error' });
      return;
    }

    if (!isDateValid(startDate)) {
      setToast({ id: Date.now(), message: 'Start date must be in YYYY-MM-DD format.', type: 'error' });
      return;
    }

    if (!current && !endDate.trim()) {
      setToast({ id: Date.now(), message: 'End date is required when current role is unchecked.', type: 'error' });
      return;
    }

    if (!current && !isDateValid(endDate)) {
      setToast({ id: Date.now(), message: 'End date must be in YYYY-MM-DD format.', type: 'error' });
      return;
    }

    if (!accessToken) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.', type: 'error' });
      return;
    }

    setSaving(true);
    setToast(null);

    try {
      const payload = {
        role_title: role.trim(),
        company: company.trim(),
        start_date: startDate.trim(),
        end_date: current ? null : endDate.trim(),
        is_current: current,
        description: description.trim(),
        achievements: achievements.map((item) => item.trim()).filter((item) => item.length > 0),
      };

      if (isEditMode) {
        const resolvedExperienceId = (experience?.experienceId || `${experience?.id || ''}`).trim();
        if (!resolvedExperienceId) {
          throw new Error('Experience id is missing. Please refresh and try again.');
        }
        await updateProfileExperience(accessToken, resolvedExperienceId, payload);
      } else {
        await createProfileExperience(accessToken, payload);
      }

      if (onExperienceAdded) {
        await onExperienceAdded();
      }

      setToast({
        id: Date.now(),
        message: isEditMode ? 'Experience updated successfully.' : 'Experience added successfully.',
        type: 'success',
      });
      closeModal(true);
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : (isEditMode ? 'Failed to update experience.' : 'Failed to add experience.');
      setToast({ id: Date.now(), message, type: 'error' });
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-all"
          onClick={() => closeModal()}
        >
          <div
            className="w-full max-w-[520px] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col font-manrope transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
              <h3 className="text-[20px] md:text-[22px] font-bold text-[#101828]">
                {isEditMode ? 'Edit experience' : 'Add experience'}
              </h3>
              <button
                onClick={() => closeModal()}
                disabled={saving}
                className="text-[#667085] hover:text-gray-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-[#101828] text-[14px] font-medium mb-2">Role title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Product Designer"
                  disabled={saving}
                  className="w-full border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3] focus:ring-1 focus:ring-[#FF6934]"
                />
              </div>

              <div>
                <label className="block text-[#101828] text-[14px] font-medium mb-2">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe"
                  disabled={saving}
                  className="w-full border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3] focus:ring-1 focus:ring-[#FF6934]"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[#101828] text-[14px] font-medium mb-2">Start date</label>
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    disabled={saving}
                    className="w-full border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3] focus:ring-1 focus:ring-[#FF6934]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[#101828] text-[14px] font-medium mb-2">End date</label>
                  <input
                    type="text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={current || saving}
                    placeholder="YYYY-MM-DD"
                    className="w-full border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3] disabled:bg-gray-50 disabled:text-gray-400 focus:ring-1 focus:ring-[#FF6934]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer group w-fit">
                <input
                  type="checkbox"
                  checked={current}
                  onChange={(e) => setCurrent(e.target.checked)}
                  disabled={saving}
                  className="w-4 h-4 appearance-none rounded-[4px] border border-[#FF6934] bg-white cursor-pointer transition-colors checked:border-[#FF6934] checked:bg-[#FF6934] checked:bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2016%2016%22%20fill=%22none%22%3E%3Cpath%20d=%22M3.5%208.5L6.5%2011.5L12.5%205.5%22%20stroke=%22white%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3C/svg%3E')] checked:bg-center checked:bg-no-repeat checked:bg-[length:12px_12px] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/30 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <span className="text-[14px] font-medium text-[#101828]">I currently work here</span>
              </label>

              <div>
                <label className="block text-[#101828] text-[14px] font-medium mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your key achievements and responsibilities..."
                  disabled={saving}
                  className="w-full border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3] min-h-[110px] resize-y focus:ring-1 focus:ring-[#FF6934]"
                />
              </div>

              <div>
                <div className="space-y-2.5">
                  {achievements.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="size-[7px] rounded-full bg-[#FF6934] shrink-0" />
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleAchievementChange(index, e.target.value)}
                        placeholder="Add achievement"
                        disabled={saving}
                        className="flex-1 border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3] focus:ring-1 focus:ring-[#FF6934]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAchievement(index)}
                        disabled={saving}
                        className="h-[38px] min-w-[38px] px-2 border border-gray-200 rounded-[10px] text-[#667085] hover:text-[#101828] hover:border-gray-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Remove achievement ${index + 1}`}
                      >
                        -
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddAchievement}
                    disabled={saving}
                    className="text-[13px] font-medium text-[#475467] hover:text-[#101828] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Add achievement
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-200 shrink-0">
              <button
                onClick={() => closeModal()}
                disabled={saving}
                className="text-[#475467] text-[14px] font-medium px-4 py-2 hover:bg-gray-50 rounded-[8px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => { void handleSubmit(); }}
                disabled={!role.trim() || !company.trim() || saving}
                className="bg-[#FF6934] text-white rounded-[8px] px-5 py-2 text-[14px] font-medium transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add experience')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
