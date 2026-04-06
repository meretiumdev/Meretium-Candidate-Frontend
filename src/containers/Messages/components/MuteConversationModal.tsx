import { X } from 'lucide-react';
import { useState } from 'react';

interface MuteConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (duration: string) => void;
}

export default function MuteConversationModal({ isOpen, onClose, onConfirm }: MuteConversationModalProps) {
  const [selected, setSelected] = useState('24 hours');
  const options = ['8 hours', '24 hours', '7 days', 'Until I unmute'];

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-[70] flex items-start justify-center p-4 pt-24 animate-in fade-in duration-200 overflow-y-auto scrollbar-hide"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl border border-gray-200 w-full max-w-[440px] overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300 mb-10 shadow-2xl font-manrope"
      >
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-[24px] font-bold text-[#111827] font-heading">Mute conversation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={22} />
          </button>
        </div>

        <div className="p-8">
          <p className="text-[14px] font-medium text-[#6B7280] font-body leading-relaxed mb-8 pr-4">
             You will stop receiving notifications for this conversation. You can unmute it anytime from the conversation settings.
          </p>

          <h4 className="text-[14px] font-medium text-gray-900 font-heading mb-4">Mute duration</h4>
          
          <div className="space-y-3">
             {options.map((opt) => (
                <label 
                  key={opt}
                  className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all hover:bg-gray-50 group ${selected === opt ? 'border-[#FF6934] bg-orange-50/30 shadow-sm' : 'border-gray-200'}`}
                  onClick={() => setSelected(opt)}
                >
                   <div className={`size-5 border-1 rounded-md transition-all flex items-center justify-center ${selected === opt ? 'border-[#FF6934] bg-[#FF6934]' : 'border-[#FF6934]'}`}>
                      {selected === opt && (
                         <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                         </svg>
                      )}
                   </div>
                   <span className={`text-[14px] font-medium font-body ${selected === opt ? 'text-gray-900' : 'text-gray-700'}`}>{opt}</span>
                </label>
             ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-end gap-6 border-t border-gray-200 font-manrope shadow-sm rounded-xl">
          <button onClick={onClose} className="text-[14px] font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer font-body">Cancel</button>
          <button 
            onClick={() => onConfirm(selected)}
            className="px-6 py-3 bg-[#FF6934] text-white rounded-[10px] text-[14px] font-medium hover:opacity-90 transition-all shadow-md shadow-orange-100 font-body"
          >
            Mute conversation
          </button>
        </div>
      </div>
    </div>
  );
}
