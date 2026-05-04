import { useEffect, useMemo, useState } from 'react';
import { Building, Edit3, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import { deleteProfileEducation } from '../../../services/profileApi';
import AddEducationModal, { type EducationItem } from './AddEducationModal';
import DeleteProfileItemModal from './DeleteProfileItemModal';

interface EducationSectionProps {
  educations: Array<Record<string, unknown>>;
  onEducationUpdated?: () => Promise<void> | void;
}

interface ToastState {
  id: number;
  message: string;
  type: 'error' | 'success';
}

function readString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return '';
}

function readBoolean(record: Record<string, unknown>, keys: string[]): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }
  }
  return false;
}

function readEducationId(record: Record<string, unknown>): string | null {
  const idValue = record.id ?? record.education_id;
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
  const current = readBoolean(record, ['is_current', 'isCurrent', 'currently_studying']);

  if (!start && !end) return '';
  if (start && !end && current) return `${toMonthYear(start)} - Present`;
  if (start && end) return `${toMonthYear(start)} - ${toMonthYear(end)}`;
  if (start) return toMonthYear(start);
  return toMonthYear(end);
}

function normalizeEducations(educations: Array<Record<string, unknown>>): EducationItem[] {
  return educations.reduce<EducationItem[]>((acc, education, index) => {
    const educationId = readEducationId(education);
    const institute = readString(education, ['institute', 'school', 'school_name', 'institution']) || 'Unknown institute';
    const program = readString(education, ['program', 'degree', 'course', 'field_of_study']) || 'Program not provided';
    const startDate = toInputDate(readString(education, ['start_date', 'startDate', 'from']));
    const endDate = toInputDate(readString(education, ['end_date', 'endDate', 'to']));
    const isCurrent = readBoolean(education, ['is_current', 'isCurrent', 'currently_studying']);

    acc.push({
      id: educationId || `education-${index + 1}`,
      educationId,
      institute,
      program,
      startDate,
      endDate,
      isCurrent,
      description: readString(education, ['description', 'summary']),
    });

    return acc;
  }, []);
}

export default function EducationSection({ educations, onEducationUpdated }: EducationSectionProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [isEducationModalOpen, setEducationModalOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<EducationItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EducationItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const normalizedEducations = useMemo(() => normalizeEducations(educations), [educations]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const openAddModal = () => {
    setEditingEducation(null);
    setEducationModalOpen(true);
  };

  const openEditModal = (education: EducationItem) => {
    setEditingEducation(education);
    setEducationModalOpen(true);
  };

  const closeEducationModal = () => {
    setEducationModalOpen(false);
    setEditingEducation(null);
  };

  const handleDeleteEducation = async () => {
    if (!deleteTarget) return;

    if (!accessToken) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.', type: 'error' });
      return;
    }

    if (!deleteTarget.educationId) {
      setToast({ id: Date.now(), message: 'Education id is missing. Please refresh and try again.', type: 'error' });
      return;
    }

    setDeleting(true);
    setToast(null);

    try {
      await deleteProfileEducation(accessToken, deleteTarget.educationId);
      setDeleteTarget(null);
      await onEducationUpdated?.();
      setToast({ id: Date.now(), message: 'Education deleted successfully.', type: 'success' });
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Failed to delete education.';
      setToast({ id: Date.now(), message, type: 'error' });
    } finally {
      setDeleting(false);
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

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 font-manrope transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] md:text-[20px] font-bold text-[#101828]">Education</h2>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 text-[14px] font-medium text-[#475467] hover:text-gray-900 transition-colors cursor-pointer"
          >
            <Plus size={18} className="text-[#475467]" /> Add
          </button>
        </div>

        {normalizedEducations.length === 0 ? (
          <div className="bg-[#F9FAFB] border border-[#EAECF0] rounded-xl px-4 py-5">
            <p className="text-[14px] text-[#667085] font-medium">No education added yet.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {normalizedEducations.map((education, index) => {
              const duration = getDuration(educations[index] || {});

              return (
                <div
                  key={education.id}
                  className={`flex gap-4 md:gap-5 ${index !== normalizedEducations.length - 1 ? 'border-b border-gray-200 pb-6 mb-6' : ''}`}
                >
                  <div className="size-11 bg-[#CC370014] rounded-full flex items-center justify-center shrink-0">
                    <Building size={20} className="text-[#CC3700]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-[16px] font-semibold text-[#101828] mb-1">{education.institute}</h3>
                        <p className="text-[14px] font-medium text-[#475467]">{education.program}</p>
                        {duration && (
                          <p className="text-[13px] font-medium text-[#475467] mt-1">{duration}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <button
                          className="text-[#98A2B3] hover:text-gray-600 transition-colors cursor-pointer"
                          aria-label={`Reorder ${education.program}`}
                        >
                          <GripVertical size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(education)}
                          className="text-[#475467] hover:text-gray-900 transition-colors cursor-pointer"
                          aria-label={`Edit ${education.program}`}
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(education)}
                          className="text-[#F04438] hover:opacity-80 transition-opacity cursor-pointer"
                          aria-label={`Delete ${education.program}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {education.description && (
                      <p className="mt-3 text-[14px] text-[#475467] font-medium leading-relaxed whitespace-pre-wrap">
                        {education.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddEducationModal
        isOpen={isEducationModalOpen}
        onClose={closeEducationModal}
        onEducationUpdated={onEducationUpdated}
        education={editingEducation}
      />

      <DeleteProfileItemModal
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteEducation}
        deleting={deleting}
        title="Delete education?"
        message="This education entry will be removed from your profile."
      />
    </>
  );
}
