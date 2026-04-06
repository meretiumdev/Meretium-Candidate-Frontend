import { useState } from 'react';
import { X } from 'lucide-react';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddSkillModal({ isOpen, onClose }: AddSkillModalProps) {
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState('Core');

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset state closely following standard modal behavior
    setSkillName('');
    setCategory('Core');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-all"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-[16px] shadow-2xl overflow-hidden border border-gray-100" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-[20px] md:text-[24px] font-semibold text-[#101828]">Add skill</h3>
          <button 
            onClick={handleClose}
            className="text-[#667085] hover:text-gray-900 transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-[#101828] text-[14px] font-medium mb-2">Skill name</label>
            <input 
              type="text" 
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g. React, Product Design, Leadership"
              className="w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3]"
            />
          </div>

          <div>
            <label className="block text-[#101828] text-[14px] font-medium mb-3">Category</label>
            <div className="flex flex-wrap gap-2">
              {['Core', 'Tools', 'Soft Skills'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-[8px] text-[14px] font-medium transition-colors cursor-pointer ${
                    category === cat 
                      ? 'bg-[#FF6934] text-white' 
                      : 'bg-[#F9FAFB] text-[#475467] hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-100">
          <button 
            onClick={handleClose}
            className="text-[#475467] text-[14px] font-medium px-4 py-2 hover:bg-gray-50 rounded-[8px] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            disabled={!skillName.trim()}
            className="bg-[#FF6934] text-white rounded-[8px] px-5 py-2 text-[14px] font-medium transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add skill
          </button>
        </div>
      </div>
    </div>
  );
}
