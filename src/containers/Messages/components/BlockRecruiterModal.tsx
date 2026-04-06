import { X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface BlockRecruiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recruiterName: string;
}

export default function BlockRecruiterModal({ isOpen, onClose, onConfirm, recruiterName }: BlockRecruiterModalProps) {
  const [checked, setChecked] = useState(false);

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-[70] flex items-start justify-center p-4 pt-24 animate-in fade-in duration-200 overflow-y-auto scrollbar-hide"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl border border-gray-200 w-full max-w-[480px] overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300 mb-10 shadow-2xl font-manrope"
      >
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[24px] font-semibold text-[#111827] font-heading">Block recruiter</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={22} />
          </button>
        </div>

        <div className="p-8">
          {/* Warning Box */}
          <div className="bg-[#FFF5F5] border border-red-200 rounded-xl p-5 mb-8 shadow-sm">
             <div className="flex gap-3 mb-3">
                <AlertTriangle className="text-[#FF4D4D] shrink-0" size={20} />
                <h3 className="text-[14px] font-medium text-[#FF4D4D] font-body">Warning: This action is permanent</h3>
             </div>
             <ul className="space-y-3 pl-8 text-[14px] text-[#4B5563] font-medium font-body list-disc marker:text-gray-300">
                <li>You will no longer receive messages from {recruiterName}</li>
                <li>They will not be able to contact you again</li>
                <li>You will still see your past applications</li>
             </ul>
          </div>

          {/* Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer group">
             <div className="relative">
                <input 
                  type="checkbox" 
                  className="peer sr-only" 
                  checked={checked}
                  onChange={() => setChecked(!checked)}
                />
                <div className="size-5 border-1 border-[#FF6934] rounded-md peer-checked:bg-[#FF6934] peer-checked:border-[#FF6934] transition-all"></div>
                <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
             </div>
             <span className="text-[14px] font-medium text-gray-700 font-body select-none">I understand this action cannot be easily undone</span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-end gap-6 border-t border-gray-100">
          <button onClick={onClose} className="text-[14px] font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer font-body">Cancel</button>
          <button 
            onClick={onConfirm}
            disabled={!checked}
            className={`px-6 py-3 rounded-[10px] text-[14px] font-medium text-white transition-all shadow-md ${checked ? 'bg-[#FF6934] hover:opacity-90 shadow-orange-100' : 'bg-[#FF6934]/50 cursor-not-allowed'}`}
          >
            Block recruiter
          </button>
        </div>
      </div>
    </div>
  );
}
