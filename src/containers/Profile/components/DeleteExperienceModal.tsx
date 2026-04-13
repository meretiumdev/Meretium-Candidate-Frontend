import { AlertTriangle } from 'lucide-react';

interface DeleteExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  experienceLabel?: string;
  deleting?: boolean;
}

export default function DeleteExperienceModal({
  isOpen,
  onClose,
  onConfirm,
  experienceLabel,
  deleting = false,
}: DeleteExperienceModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-all"
      onClick={() => {
        if (!deleting) onClose();
      }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-[16px] shadow-2xl p-6 text-center border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="size-12 bg-[#FEE4E2] rounded-full flex items-center justify-center mx-auto mb-5 shrink-0">
           <AlertTriangle size={24} className="text-[#F04438]" />
        </div>

        <h3 className="text-[18px] md:text-[20px] font-semibold text-[#101828] mb-2">Delete experience?</h3>

        <p className="text-[#475467] text-[14px] leading-relaxed mb-8">
          {experienceLabel
            ? `Are you sure you want to delete "${experienceLabel}"? This action cannot be undone.`
            : 'Are you sure you want to delete this experience? This action cannot be undone.'}
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-6 py-2 border border-gray-300 text-[#344054] text-[14px] font-medium rounded-[8px] hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={() => { void onConfirm(); }}
            disabled={deleting}
            className="px-6 py-2 bg-[#FF6934] text-white text-[14px] font-medium rounded-[8px] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
