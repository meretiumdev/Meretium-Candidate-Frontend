import { X, Upload } from 'lucide-react';
import { useState } from 'react';

interface ReportConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ReportConversationModal({ isOpen, onClose, onConfirm }: ReportConversationModalProps) {
  const [selectedReason, setSelectedReason] = useState('Spam or misleading');
  const reasons = [
    'Spam or misleading', 
    'Inappropriate behavior', 
    'Fake job or scam', 
    'Harassment', 
    'Other'
  ];

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-[70] flex items-start justify-center p-4 pt-24 animate-in fade-in duration-200 overflow-y-auto scrollbar-hide"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl border border-gray-200 w-full max-w-[500px] overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300 max-h-[80vh] mb-10 flex flex-col shadow-2xl font-manrope"
      >
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-[24px] font-bold text-[#111827] font-heading">Report conversation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={22} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto grow scrollbar-hide">
          <p className="text-[14px] font-medium text-[#6B7280] font-body leading-relaxed mb-6">
             Tell us what's happening. Your report will be reviewed by our team.
          </p>

          <h4 className="text-[14px] font-medium text-gray-900 font-heading mb-4">Reason for report <span className="text-[#FF6934] ml-0.5">*</span></h4>
          
          <div className="space-y-3 mb-6">
             {reasons.map((reason) => (
                <label 
                  key={reason}
                  className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all hover:bg-gray-50 group ${selectedReason === reason ? 'border-[#FF6934] bg-orange-50/30 shadow-sm' : 'border-gray-200'}`}
                  onClick={() => setSelectedReason(reason)}
                >
                   <div className={`size-5 border-1 rounded-md transition-all flex items-center justify-center ${selectedReason === reason ? 'border-[#FF6934] bg-[#FF6934]' : 'border-[#FF6934]'}`}>
                      {selectedReason === reason && (
                         <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                         </svg>
                      )}
                   </div>
                   <span className={`text-[14px] font-medium font-body ${selectedReason === reason ? 'text-gray-900' : 'text-gray-700'}`}>{reason}</span>
                </label>
             ))}
          </div>

          <div className="mb-6">
             <h4 className="text-[14px] font-medium text-gray-900 font-heading mb-2">Additional details (optional)</h4>
             <textarea  
               placeholder="Add more details (optional)" 
               className="w-full bg-[#F9FAFB]/50 border border-gray-200 rounded-xl p-4 text-[14px] font-medium text-gray-700 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 transition-all font-body resize-none"
             />
          </div>

          <div className="mb-4">
             <h4 className="text-[14px] font-medium text-gray-900 font-heading mb-2">Upload screenshot (optional)</h4>
             <div className="border border-gray-100 bg-[#F9FAFB]/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors group">
                <Upload size={20} className="text-gray-400 group-hover:text-[#FF6934] transition-colors" />
                <span className="text-[14px] font-medium text-gray-500 font-body group-hover:text-gray-700">Click to upload</span>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-end gap-6 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="text-[14px] font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer font-body">Cancel</button>
          <button 
            onClick={onConfirm}
            className="px-6 py-3 bg-[#FF6934] text-white rounded-[10px] text-[14px] font-medium hover:opacity-90 transition-all shadow-md shadow-orange-100"
          >
            Submit report
          </button>
        </div>
      </div>
    </div>
  );
}
