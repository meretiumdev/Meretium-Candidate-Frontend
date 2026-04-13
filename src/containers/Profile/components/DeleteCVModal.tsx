import { AlertTriangle } from 'lucide-react';

interface DeleteCVModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvName: string;
  onConfirm: () => Promise<void> | void;
  deleting?: boolean;
}

export default function DeleteCVModal({
  isOpen,
  onClose,
  cvName,
  onConfirm,
  deleting = false,
}: DeleteCVModalProps) {
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
        
        <h3 className="text-[18px] md:text-[20px] font-semibold text-[#101828] mb-2">Delete CV?</h3>
        
        <p className="text-[#475467] text-[14px] leading-relaxed mb-8">
           Are you sure you want to delete <br className="hidden sm:block" />
           "{cvName}"? This CV is used in past applications.
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
