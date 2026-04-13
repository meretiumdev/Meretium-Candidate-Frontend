import { useEffect, useMemo, useState } from 'react';
import { Building2, Edit3, GripVertical, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import { deleteProfileExperience } from '../../../services/profileApi';
import AddExperienceModal from './AddExperienceModal';
import DeleteExperienceModal from './DeleteExperienceModal';

interface ExperienceSectionProps {
  experiences: Array<Record<string, unknown>>;
  onExperienceAdded?: () => Promise<void> | void;
}

interface ExperienceItem {
  id: string;
  experienceId: string | null;
  role: string;
  company: string;
  duration: string;
  bullets: string[];
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

interface ToastState {
  id: number;
  message: string;
}

function readString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
}

function readBoolean(record: Record<string, unknown>, keys: string[]): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
  }
  return false;
}

function readExperienceId(record: Record<string, unknown>): string | null {
  const idValue = record.id ?? record.experience_id;
  if (typeof idValue === 'string' && idValue.trim().length > 0) return idValue.trim();
  if (typeof idValue === 'number' && Number.isFinite(idValue)) return String(idValue);
  return null;
}

function toMonthYear(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
}

function toInputDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const firstTen = trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(firstTen)) return firstTen;

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDuration(record: Record<string, unknown>): string {
  const explicitDuration = readString(record, ['duration']);
  if (explicitDuration) return explicitDuration;

  const start = readString(record, ['start_date', 'startDate', 'from']);
  const end = readString(record, ['end_date', 'endDate', 'to']);
  const current = readBoolean(record, ['is_current', 'isCurrent', 'currently_working']);

  if (!start && !end) return 'Duration not provided';
  if (start && !end && current) return `${toMonthYear(start)} - Present`;
  if (start && end) return `${toMonthYear(start)} - ${toMonthYear(end)}`;
  if (start) return toMonthYear(start);
  return toMonthYear(end);
}

function getBullets(record: Record<string, unknown>): string[] {
  const possibleArrays = [
    record.achievements,
    record.bullets,
    record.responsibilities,
    record.highlights,
  ];

  for (const possible of possibleArrays) {
    if (!Array.isArray(possible)) continue;

    const strings = possible.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());
    if (strings.length > 0) return strings;
  }

  const description = readString(record, ['description', 'summary']);
  return description ? [description] : [];
}

function normalizeExperiences(experiences: Array<Record<string, unknown>>): ExperienceItem[] {
  return experiences.reduce<ExperienceItem[]>((acc, exp, index) => {
    const experienceId = readExperienceId(exp);
    const id = experienceId || `${index + 1}`;
    const role = readString(exp, ['role', 'role_title', 'title', 'position']) || 'Untitled role';
    const company = readString(exp, ['company', 'company_name', 'organization']) || 'Unknown company';
    const duration = getDuration(exp);
    const bullets = getBullets(exp);
    const startDate = toInputDate(readString(exp, ['start_date', 'startDate', 'from']));
    const endDate = toInputDate(readString(exp, ['end_date', 'endDate', 'to']));
    const isCurrent = readBoolean(exp, ['is_current', 'isCurrent', 'currently_working']);
    const description = readString(exp, ['description', 'summary']);

    acc.push({
      id,
      experienceId,
      role,
      company,
      duration,
      bullets,
      startDate,
      endDate,
      isCurrent,
      description,
    });
    return acc;
  }, []);
}

export default function ExperienceSection({ experiences, onExperienceAdded }: ExperienceSectionProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [isExperienceModalOpen, setExperienceModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<ExperienceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExperienceItem | null>(null);
  const [activeAIId, setActiveAIId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const normalizedExperiences = useMemo(() => normalizeExperiences(experiences), [experiences]);

  useEffect(() => {
    if (!toast) return undefined;

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const openAddModal = () => {
    setEditingExperience(null);
    setExperienceModalOpen(true);
  };

  const openEditModal = (experience: ExperienceItem) => {
    setEditingExperience(experience);
    setExperienceModalOpen(true);
  };

  const closeExperienceModal = () => {
    setExperienceModalOpen(false);
    setEditingExperience(null);
  };

  const handleDeleteExperience = async () => {
    if (!deleteTarget) return;

    if (!accessToken) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.' });
      return;
    }

    if (!deleteTarget.experienceId) {
      setToast({ id: Date.now(), message: 'Experience id is missing. Please refresh and try again.' });
      return;
    }

    setDeleting(true);
    setToast(null);

    try {
      await deleteProfileExperience(accessToken, deleteTarget.experienceId);
      setDeleteTarget(null);
      if (onExperienceAdded) {
        await onExperienceAdded();
      }
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Failed to delete experience.';
      setToast({ id: Date.now(), message });
    } finally {
      setDeleting(false);
    }
  };

  const handleAiImprove = () => {
    setToast({ id: Date.now(), message: 'AI improvement is not available yet.' });
  };

  return (
    <>
      {toast && (
        <div
          key={toast.id}
          className="fixed top-4 right-4 z-[140] max-w-[360px] bg-[#FEF3F2] border border-[#FDA29B] text-[#B42318] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium"
        >
          {toast.message}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 font-manrope transition-all duration-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[18px] md:text-[20px] font-bold text-[#101828]">Experience</h2>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 text-[14px] font-medium text-[#475467] hover:text-gray-900 transition-colors cursor-pointer"
          >
            <Plus size={18} className="text-[#475467]" /> Add experience
          </button>
        </div>

        {normalizedExperiences.length === 0 ? (
          <div className="bg-[#F9FAFB] border border-[#EAECF0] rounded-xl px-4 py-5">
            <p className="text-[14px] text-[#667085] font-medium">No experience added yet.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {normalizedExperiences.map((exp, index) => (
              <div key={exp.id} className={`flex gap-4 md:gap-5 ${index !== normalizedExperiences.length - 1 ? 'border-b border-gray-200 pb-8 mb-8' : ''}`}>
                <div className="flex flex-col items-center shrink-0">
                  <div className="size-11 bg-[#FFF4EC] rounded-full flex items-center justify-center">
                    <Building2 size={20} className="text-[#FF6934]" />
                  </div>
                  {index !== normalizedExperiences.length - 1 && <div className="w-[1px] h-[40px] bg-[#E4E7EC] mt-2"></div>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[16px] font-semibold text-[#101828] mb-1">{exp.role}</h3>
                      <p className="text-[15px] font-medium text-[#475467] mb-1">{exp.company}</p>
                      <p className="text-[14px] font-medium text-[#98A2B3]">{exp.duration}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <button
                        className="text-[#98A2B3] hover:text-gray-600 transition-colors cursor-pointer"
                        aria-label={`Reorder ${exp.role}`}
                      >
                        <GripVertical size={18} />
                      </button>
                      <button
                        onClick={() => openEditModal(exp)}
                        className="text-[#475467] hover:text-gray-900 transition-colors cursor-pointer"
                        aria-label={`Edit ${exp.role}`}
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => setActiveAIId(activeAIId === exp.id ? null : exp.id)}
                        className={`transition-colors cursor-pointer ${activeAIId === exp.id ? 'text-[#FF6934]' : 'text-[#98A2B3] hover:text-[#FF6934]'}`}
                        aria-label={`AI improve ${exp.role}`}
                      >
                        <Sparkles size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(exp)}
                        className="text-[#FF5B5B] hover:opacity-80 transition-opacity cursor-pointer"
                        aria-label={`Delete ${exp.role}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {exp.bullets.length > 0 && (
                    <div className="mt-5 space-y-3">
                      {exp.bullets.map((b, i) => (
                        <div key={`${exp.id}-${i}`} className="flex flex-row items-start gap-2">
                          <div className="size-[5px] rounded-full bg-[#FF6934] shrink-0 mt-[8px]"></div>
                          <p className="text-[14px] text-[#475467] font-medium leading-relaxed">{b}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeAIId === exp.id && (
                    <div className="mt-6 bg-[#FFF8F5] border border-[#FF693415] rounded-xl p-5 shadow-sm animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 mb-3 text-[#FF6934] font-medium text-[15px]">
                        <Sparkles size={18} className="text-[#FF6934]" /> AI Improvement
                      </div>
                      <p className="text-[14px] font-medium text-[#475467] mb-5 leading-relaxed">
                        AI will analyze this role and suggest impactful achievements to highlight.
                      </p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
                        <button
                          onClick={handleAiImprove}
                          className="flex-1 sm:flex-none justify-center px-5 py-2 bg-[#FF6934] text-white rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-sm flex items-center gap-2"
                        >
                          <Sparkles size={16} /> Improve now
                        </button>
                        <button
                          onClick={() => setActiveAIId(null)}
                          className="flex-1 sm:flex-none justify-center px-4 py-2 text-[#475467] rounded-[8px] text-[14px] font-medium hover:bg-gray-50 transition-colors cursor-pointer text-center"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddExperienceModal
        isOpen={isExperienceModalOpen}
        onClose={closeExperienceModal}
        onExperienceAdded={onExperienceAdded}
        experience={editingExperience}
      />

      <DeleteExperienceModal
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteExperience}
        experienceLabel={deleteTarget ? `${deleteTarget.role} at ${deleteTarget.company}` : undefined}
        deleting={deleting}
      />
    </>
  );
}
