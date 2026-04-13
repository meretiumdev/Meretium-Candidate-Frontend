import { useState } from 'react';
import { X } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import { createProfileSkill } from '../../../services/profileApi';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkillAdded?: () => Promise<void> | void;
}

function mapCategoryToApi(category: string): string {
  if (category === 'Tools') return 'TOOLS';
  if (category === 'Soft Skills') return 'SOFT_SKILLS';
  return 'CORE';
}

export default function AddSkillModal({ isOpen, onClose, onSkillAdded }: AddSkillModalProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState('Core');
  const [proficiency, setProficiency] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const proficiencyValue = Number(proficiency);
  const isProficiencyValid = (
    proficiency.trim() !== ''
    && Number.isFinite(proficiencyValue)
    && Number.isInteger(proficiencyValue)
    && proficiencyValue >= 1
    && proficiencyValue <= 5
  );

  if (!isOpen) return null;

  const closeModal = (force = false) => {
    // Reset state closely following standard modal behavior
    if (saving && !force) return;
    setSkillName('');
    setCategory('Core');
    setProficiency('');
    onClose();
  };

  const handleAddSkill = async () => {
    if (!skillName.trim() || !isProficiencyValid) return;

    if (!accessToken) {
      setToastMessage('You are not authenticated. Please log in again.');
      return;
    }

    setSaving(true);
    setToastMessage(null);

    try {
      await createProfileSkill(accessToken, {
        name: skillName.trim(),
        category: mapCategoryToApi(category),
        proficiency_level: Math.round(proficiencyValue),
      });

      if (onSkillAdded) {
        await onSkillAdded();
      }

      closeModal(true);
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Failed to add skill.';
      setToastMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[70] max-w-[360px] bg-[#FEF3F2] border border-[#FDA29B] text-[#B42318] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium">
          {toastMessage}
        </div>
      )}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-all"
        onClick={() => closeModal()}
      >
        <div
          className="w-full max-w-md bg-white rounded-[16px] shadow-2xl overflow-hidden border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-[20px] md:text-[24px] font-semibold text-[#101828]">Add skill</h3>
          <button 
            onClick={() => closeModal()}
            className="text-[#667085] hover:text-gray-900 transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
                    <div>
            <label className="block text-[#101828] text-[14px] font-medium mb-3">Category</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'Core', label: 'CORE' },
                { value: 'Tools', label: 'TOOLS' },
                { value: 'Soft Skills', label: 'SOFT SKILLS' },
              ].map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-4 py-2 rounded-[8px] text-[14px] font-medium transition-colors cursor-pointer ${
                    category === cat.value 
                      ? 'bg-[#FF6934] text-white' 
                      : 'bg-[#F9FAFB] text-[#475467] hover:bg-gray-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
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
            <label className="block text-[#101828] text-[14px] font-medium mb-2">Proficiency level (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              step={1}
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value)}
              placeholder="e.g. 4"
              className="w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-100">
          <button 
            onClick={() => closeModal()}
            disabled={saving}
            className="text-[#475467] text-[14px] font-medium px-4 py-2 hover:bg-gray-50 rounded-[8px] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={() => { void handleAddSkill(); }}
            disabled={!skillName.trim() || !isProficiencyValid || saving}
            className="bg-[#FF6934] text-white rounded-[8px] px-5 py-2 text-[14px] font-medium transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Adding...' : 'Add skill'}
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
