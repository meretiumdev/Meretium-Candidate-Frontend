import { useState, useEffect } from 'react';
import { X, Sparkles, Plus } from 'lucide-react';

interface Experience {
  id: number;
  role: string;
  company: string;
  duration: string;
  bullets: string[];
}

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience?: Experience | null; // if provided → Edit mode, if null/undefined → Add mode
}

export default function AddExperienceModal({ isOpen, onClose, experience }: ExperienceModalProps) {
  const isEditMode = !!experience;

  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [current, setCurrent] = useState(false);
  const [bullets, setBullets] = useState<string[]>(['']);

  // Pre-fill form when editing, reset when adding
  useEffect(() => {
    if (isEditMode && experience) {
      setRole(experience.role);
      setCompany(experience.company);
      // Parse duration like "2021 - Present · 3 years" or "2018 - 2021 · 3 years"
      const parts = experience.duration.split(' - ');
      setStartDate(parts[0]?.trim() || '');
      const endPart = parts[1]?.split(' ·')[0]?.trim() || '';
      if (endPart === 'Present') {
        setCurrent(true);
        setEndDate('');
      } else {
        setCurrent(false);
        setEndDate(endPart);
      }
      setBullets(experience.bullets.length > 0 ? [...experience.bullets, ''] : ['']);
    } else {
      setRole('');
      setCompany('');
      setStartDate('');
      setEndDate('');
      setCurrent(false);
      setBullets(['']);
    }
  }, [experience, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const handleBulletChange = (index: number, value: string) => {
    const updated = [...bullets];
    updated[index] = value;
    setBullets(updated);
  };

  const addBullet = () => {
    setBullets([...bullets, '']);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-all"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[520px] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col font-manrope transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
          <h3 className="text-[20px] md:text-[22px] font-bold text-[#101828]">
            {isEditMode ? 'Edit experience' : 'Add experience'}
          </h3>
          <button onClick={handleClose} className="text-[#667085] hover:text-gray-900 transition-colors cursor-pointer">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-[#101828] text-[14px] font-medium mb-2">Role title</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Product Designer"
              className="w-full border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3] focus:ring-1 focus:ring-[#FF6934]"
            />
          </div>

          <div>
            <label className="block text-[#101828] text-[14px] font-medium mb-2">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Stripe"
              className="w-full border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3] focus:ring-1 focus:ring-[#FF6934]"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[#101828] text-[14px] font-medium mb-2">Start date</label>
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="e.g. Jan 2021"
                className="w-full border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3] focus:ring-1 focus:ring-[#FF6934]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[#101828] text-[14px] font-medium mb-2">End date</label>
              <input
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={current}
                placeholder="e.g. Dec 2023"
                className="w-full border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3] disabled:bg-gray-50 disabled:text-gray-400 focus:ring-1 focus:ring-[#FF6934]"
              />
            </div>
          </div>

          {!isEditMode && (
            <label className="flex items-center gap-2 cursor-pointer group w-fit">
              <input
                type="checkbox"
                checked={current}
                onChange={(e) => setCurrent(e.target.checked)}
                className="w-4 h-4 rounded-[4px] border-gray-300 cursor-pointer accent-[#FF6934]"
              />
              <span className="text-[14px] font-medium text-[#101828]">I currently work here</span>
            </label>
          )}

          {/* Description — bullet list in Edit mode, textarea in Add mode */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[#101828] text-[14px] font-medium">Description</label>
              {isEditMode && (
                <button className="flex items-center gap-1.5 text-[13px] font-medium text-[#FF6934] hover:opacity-80 transition-opacity cursor-pointer">
                  <Sparkles size={14} /> Improve with AI
                </button>
              )}
            </div>

            {isEditMode ? (
              <div className="space-y-2">
                {bullets.map((bullet, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="size-[7px] rounded-full bg-[#FF6934] shrink-0" />
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => handleBulletChange(index, e.target.value)}
                      placeholder="Add skill here"
                      className="flex-1 border border-gray-200 rounded-[10px] px-3.5 py-2 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3] focus:ring-1 focus:ring-[#FF6934]"
                    />
                  </div>
                ))}
                <button
                  onClick={addBullet}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-[#475467] hover:text-gray-900 transition-colors cursor-pointer mt-1 pl-1"
                >
                  <Plus size={14} /> Add achievement
                </button>
              </div>
            ) : (
              <textarea
                placeholder="Describe your key achievements and responsibilities..."
                className="w-full border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#FF6934] transition-colors placeholder:text-[#98A2B3] min-h-[120px] resize-y focus:ring-1 focus:ring-[#FF6934]"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-200 shrink-0">
          <button
            onClick={handleClose}
            className="text-[#475467] text-[14px] font-medium px-4 py-2 hover:bg-gray-50 rounded-[8px] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={!role.trim() || !company.trim()}
            className="bg-[#FF6934] text-white rounded-[8px] px-5 py-2 text-[14px] font-medium transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditMode ? 'Save Changes' : 'Add experience'}
          </button>
        </div>
      </div>
    </div>
  );
}
