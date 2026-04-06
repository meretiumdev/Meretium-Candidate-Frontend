import { X } from 'lucide-react';
import { useState } from 'react';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillName?: string;
}

export default function AddSkillModal({ isOpen, onClose, skillName: initialSkillName = "" }: AddSkillModalProps) {
  const [skillName, setSkillName] = useState(initialSkillName);
  const [category, setCategory] = useState("Core");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-[540px] rounded-[16px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[22px] font-semibold text-[#101828]">Add skill</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-50 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Skill Name Input */}
          <div className="space-y-3">
            <label className="block text-[14px] font-[500] text-[#344054]">Skill name</label>
            <input 
              type="text" 
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g. React, Product Design, Leadership"
              className="w-full px-4 py-3.5 rounded-[12px] border border-[#EAECF0] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/10 focus:border-[#FF6934] text-[15px] placeholder:text-[#98A2B3] transition-all"
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-4">
            <label className="block text-[14px] font-[500] text-[#344054]">Category</label>
            <div className="flex flex-wrap gap-3">
              {["Core", "Tools", "Soft Skills"].map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-5 py-2.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer ${
                    category === cat 
                    ? 'bg-[#FF6934] text-white' 
                    : 'bg-[#F9FAFB] text-[#344054] hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-white border-t border-gray-100 flex items-center justify-end gap-6 font-medium">
          <button 
            onClick={onClose}
            className="text-[15px] text-[#475467] hover:text-[#101828] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={onClose}
            className={`px-8 py-3 rounded-[12px] text-[15px] text-white transition-all cursor-pointer shadow-md ${
              skillName.trim() 
              ? 'bg-[#FF6934] hover:opacity-90' 
              : 'bg-[#FF693460] cursor-not-allowed shadow-none'
            }`}
          >
            Add skill
          </button>
        </div>

      </div>
    </div>
  );
}
