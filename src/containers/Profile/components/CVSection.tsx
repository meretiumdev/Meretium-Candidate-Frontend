import { useEffect, useMemo, useState } from 'react';
import { FileText, Trash2, Edit3, UploadCloud, Star } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import { deleteCandidateCv, updateCandidateCv } from '../../../services/cvApi';
import RenameCVModal from './RenameCVModal';
import DeleteCVModal from './DeleteCVModal';
import UploadCVModal from '../../../components/UploadCVModal';

interface CVSectionProps {
  cvs?: Array<Record<string, unknown>>;
  onCvUploaded?: () => Promise<void> | void;
}

interface CVItem {
  id: string;
  cvId: string | null;
  name: string;
  dateLabel: string;
  isDefault: boolean;
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

function readCvId(record: Record<string, unknown>): string | null {
  const idRaw = record.id ?? record.cv_id;
  if (typeof idRaw === 'string' && idRaw.trim().length > 0) return idRaw.trim();
  if (typeof idRaw === 'number' && Number.isFinite(idRaw)) return String(idRaw);
  return null;
}

function formatDateLabel(rawDate: string): string {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return 'Uploaded recently';
  return `Uploaded ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)}`;
}

function normalizeCvs(cvs: Array<Record<string, unknown>>): CVItem[] {
  return cvs.reduce<CVItem[]>((acc, cv, index) => {
    const cvId = readCvId(cv);
    const id = cvId || `row-${index + 1}`;

    const name = readString(cv, ['name', 'file_name', 'filename', 'title']) || `CV ${index + 1}`;
    const uploadedAt = readString(cv, ['uploaded_at', 'created_at', 'date']);
    const dateLabel = uploadedAt ? formatDateLabel(uploadedAt) : 'Uploaded recently';
    const isDefault = readBoolean(cv, ['is_primary', 'isPrimary', 'is_default', 'default', 'primary']);

    acc.push({ id, cvId, name, dateLabel, isDefault });
    return acc;
  }, []);
}

function buildRenamedFileName(inputName: string, originalName: string): string {
  const trimmed = inputName.trim();
  if (!trimmed) return originalName;

  if (/\.[a-z0-9]+$/i.test(trimmed)) {
    return trimmed;
  }

  const extension = originalName.match(/(\.[a-z0-9]+)$/i)?.[1] || '.pdf';
  return `${trimmed}${extension}`;
}

export default function CVSection({ cvs, onCvUploaded }: CVSectionProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [renameTarget, setRenameTarget] = useState<CVItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CVItem | null>(null);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [updatingPrimaryCvId, setUpdatingPrimaryCvId] = useState<string | null>(null);
  const [renamingCvId, setRenamingCvId] = useState<string | null>(null);
  const [deletingCvId, setDeletingCvId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const normalizedCvs = useMemo(() => normalizeCvs(cvs || []), [cvs]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const refreshCvs = async () => {
    if (onCvUploaded) {
      await onCvUploaded();
    }
  };

  const getAccessToken = (): string | null => {
    if (!accessToken) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.' });
      return null;
    }
    return accessToken;
  };

  const validateCvAction = (cv: CVItem | null): cv is CVItem & { cvId: string } => {
    if (!cv || !cv.cvId) {
      setToast({ id: Date.now(), message: 'CV id is missing. Please refresh and try again.' });
      return false;
    }

    return true;
  };

  const handleTogglePrimary = async (cv: CVItem) => {
    const token = getAccessToken();
    if (!token) return;
    if (!validateCvAction(cv)) return;

    setUpdatingPrimaryCvId(cv.cvId);
    setToast(null);

    try {
      await updateCandidateCv(token, cv.cvId, {
        is_primary: !cv.isDefault,
      });
      await refreshCvs();
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Failed to update primary CV.';
      setToast({ id: Date.now(), message });
    } finally {
      setUpdatingPrimaryCvId(null);
    }
  };

  const handleRenameCv = async (nextName: string) => {
    const token = getAccessToken();
    if (!token) return;
    if (!validateCvAction(renameTarget)) return;

    setRenamingCvId(renameTarget.cvId);
    setToast(null);

    try {
      await updateCandidateCv(token, renameTarget.cvId, {
        file_name: buildRenamedFileName(nextName, renameTarget.name),
      });
      setRenameTarget(null);
      await refreshCvs();
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Failed to rename CV.';
      setToast({ id: Date.now(), message });
    } finally {
      setRenamingCvId(null);
    }
  };

  const handleDeleteCv = async () => {
    const token = getAccessToken();
    if (!token) return;
    if (!validateCvAction(deleteTarget)) return;

    setDeletingCvId(deleteTarget.cvId);
    setToast(null);

    try {
      await deleteCandidateCv(token, deleteTarget.cvId);
      setDeleteTarget(null);
      await refreshCvs();
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Failed to delete CV.';
      setToast({ id: Date.now(), message });
    } finally {
      setDeletingCvId(null);
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-[18px] md:text-[20px] font-bold text-[#101828] w-full sm:w-auto">My CVs</h2>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="w-full md:w-auto flex justify-center items-center gap-2 border border-[#E4E7EC] px-4 py-2.5 rounded-[10px] text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors bg-white cursor-pointer"
          >
            <UploadCloud size={18} /> Upload CV
          </button>
        </div>

        {normalizedCvs.length === 0 ? (
          <div className="bg-[#F9FAFB] border border-[#EAECF0] rounded-xl px-4 py-5">
            <p className="text-[14px] text-[#667085] font-medium">No CVs found for this profile.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {normalizedCvs.map((cv) => (
              <div key={cv.id} className="p-4 bg-white border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-gray-50/50 hover:shadow-md cursor-pointer group">
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                  <div className="size-11 bg-[#FFF4EC] rounded-[8px] flex items-center justify-center text-[#FF6934] shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] md:text-[15px] font-medium text-[#101828] flex flex-wrap items-center gap-2">
                      <span className="truncate max-w-[90%] sm:max-w-[70%]">{cv.name}</span>
                      {cv.isDefault && <span className="shrink-0 bg-[#D1FADF]/50 text-[#039855] text-[12px] font-medium px-2.5 py-0.5 rounded-full">Default</span>}
                    </h3>
                    <p className="text-[13px] font-medium text-[#98A2B3] mt-0.5">{cv.dateLabel}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-5 sm:gap-4 shrink-0 sm:ml-4">
                  <button
                    onClick={() => { void handleTogglePrimary(cv); }}
                    disabled={!cv.cvId || updatingPrimaryCvId === cv.cvId}
                    className={`transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      cv.isDefault
                        ? 'text-[#FFCA28]'
                        : 'text-[#98A2B3] hover:text-gray-600'
                    }`}
                    aria-label={cv.isDefault ? `Unset ${cv.name} as primary` : `Set ${cv.name} as primary`}
                  >
                    <Star size={18} fill={cv.isDefault ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => setRenameTarget(cv)}
                    disabled={!cv.cvId}
                    className="text-[#98A2B3] hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Rename ${cv.name}`}
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cv)}
                    disabled={!cv.cvId}
                    className="text-[#FF5B5B] hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Delete ${cv.name}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RenameCVModal
        isOpen={!!renameTarget}
        onClose={() => {
          if (!renamingCvId) setRenameTarget(null);
        }}
        cvName={renameTarget?.name || ''}
        onConfirm={handleRenameCv}
        saving={!!renamingCvId}
      />

      <DeleteCVModal
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!deletingCvId) setDeleteTarget(null);
        }}
        cvName={deleteTarget?.name || ''}
        onConfirm={handleDeleteCv}
        deleting={!!deletingCvId}
      />

      <UploadCVModal
        isOpen={isUploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={onCvUploaded}
      />
    </>
  );
}
