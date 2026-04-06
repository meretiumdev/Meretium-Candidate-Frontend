import { X, AlertCircle } from 'lucide-react';

interface RemoveSavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RemoveSavedModal({ isOpen, onClose, onConfirm }: RemoveSavedModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-gray-200 rounded-xl w-full max-w-[400px] p-8 shadow-2xl relative flex flex-col items-center text-center animate-in fade-in zoom-in duration-200 font-manrope"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-50 rounded-full cursor-pointer">
          <X size={20} />
        </button>

        {/* Warning Icon */}
        <div className="size-16 bg-[#FFF4F2] rounded-full flex items-center justify-center mb-3">
          <div className="size-8 bg-[#FF6934] rounded-full flex items-center justify-center text-white shadow-sm ring-8 ring-[#FFF4F2]">
             <AlertCircle size={24} />
          </div>
        </div>

        {/* Title & Desc */}
        <h2 className="text-[24px] font-semibold text-[#111827] font-heading mb-1">Remove Saved</h2>
        <p className="text-[14px] font-regular text-[#4B5563] font-body mb-8 leading-relaxed px-4">
          Are you sure you want to remove the saved job?
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button 
            onClick={onConfirm}
            className="w-full bg-[#FF6934] text-white py-3.5 rounded-[10px] font-medium text-[14px] cursor-pointer font-body"
          >
            Remove Saved
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3.5 text-[14px] font-medium text-[#364153] hover:text-[#111827] transition-colors cursor-pointer font-body"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
