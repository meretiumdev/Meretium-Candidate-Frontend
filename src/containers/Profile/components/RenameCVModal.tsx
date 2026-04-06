import { useState, useEffect } from 'react';
import { FileText, X } from 'lucide-react';

interface RenameCVModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvName: string;
}

export default function RenameCVModal({ isOpen, onClose, cvName }: RenameCVModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    // Strip the .pdf extension to edit the raw name string
    setName(cvName.replace(/\.pdf$/i, ''));
  }, [cvName, isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-all"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-[16px] shadow-2xl overflow-hidden border border-gray-100" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
           <div className="flex items-center gap-3">
              <div className="size-10 bg-[#FFF4EC] rounded-full flex items-center justify-center text-[#FF6934] shrink-0">
                 <FileText size={18} />
              </div>
              <h3 className="text-[18px] md:text-[20px] font-semibold text-[#101828]">Rename CV</h3>
           </div>
           <button onClick={onClose} className="text-[#667085] hover:text-gray-900 transition-colors cursor-pointer">
              <X size={24} />
           </button>
        </div>

        <div className="p-6">
           <label className="block text-[#101828] text-[14px] font-medium mb-2">CV name</label>
           <div className="flex items-center gap-3">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors"
                autoFocus
              />
              <span className="text-[#98A2B3] text-[15px] font-medium shrink-0">.pdf</span>
           </div>
           <p className="text-[#667085] text-[13px] mt-2">Choose a descriptive name to easily identify this CV</p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="text-[#475467] text-[14px] font-medium px-4 py-2 hover:bg-gray-50 rounded-[8px] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            disabled={!name.trim()}
            className="bg-[#FF6934] text-white rounded-[8px] px-5 py-2 text-[14px] font-medium transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
}
