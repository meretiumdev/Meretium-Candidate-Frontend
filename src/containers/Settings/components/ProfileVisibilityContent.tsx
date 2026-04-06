import React from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface ToggleProps {
  label: string;
  subtextText: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Toggle = ({ label, subtextText, checked, onChange }: ToggleProps) => {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0 last:pb-0 font-manrope">
      <div>
        <h4 className="text-[14px] font-medium text-[#101828] mb-0.5">{label}</h4>
        <p className="text-[14px] text-[#667085]">{subtextText}</p>
      </div>
      <button 
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative duration-200 cursor-pointer ${checked ? 'bg-[#FF6934]' : 'bg-[#EAECF0]'}`}
      >
        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
};

export default function ProfileVisibilityContent() {
  const [openToWork, setOpenToWork] = React.useState(true);
  const [allowCvDownload, setAllowCvDownload] = React.useState(true);
  const [showActiveStatus, setShowActiveStatus] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedVisibility, setSelectedVisibility] = React.useState('Open to all recruiters');

  const options = [
    {
      id: 'open',
      title: 'Open to all recruiters',
      description: 'Your profile is visible to all recruiters'
    },
    {
      id: 'matched',
      title: 'Only matched recruiters',
      description: 'Only recruiters you match with can see your profile'
    },
    {
      id: 'private',
      title: 'Private',
      description: 'Your profile is hidden from all recruiters'
    }
  ];

  const currentOption = options.find(o => o.title === selectedVisibility) || options[0];

  return (
    <div className="flex-1 font-manrope animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 px-1">
        <h1 className="text-xl md:text-[32px] font-semibold text-[#101828] mb-1">Profile & Visibility</h1>
        <p className="text-[#475467] text-[14px]">Control who can see your profile and what information is displayed</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 space-y-8 shadow-sm transition-all duration-300 font-manrope">
        {/* Profile Visibility custom dropdown */}
        <div className="space-y-3 relative z-20">
          <label className="text-[14px] font-semibold text-[#101828]">Profile visibility</label>
          
          {/* Dropdown Trigger */}
          <div className="relative mt-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full h-[52px] px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-[10px] text-[14px] text-[#101828] flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 transition-all font-manrope"
            >
              <span className="font-regular text-[#101828]">{selectedVisibility}</span>
              <ChevronDown size={20} className={`text-[#667085] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Selection List */}
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedVisibility(option.title);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-4 sm:p-5 flex items-center justify-between transition-all duration-200 cursor-pointer border-b border-gray-50 last:border-0 ${
                      selectedVisibility === option.title ? 'bg-[#FFF1EC]' : 'hover:bg-gray-50 bg-white'
                    }`}
                  >
                    <div>
                      <h4 className="text-[14px] font-semibold text-[#101828]">{option.title}</h4>
                      <p className="text-[13px] text-[#667085] mt-1">{option.description}</p>
                    </div>
                    {selectedVisibility === option.title && (
                      <Check size={20} className="text-[#FF6934] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <p className="text-[12px] text-[#667085] leading-relaxed">
            {currentOption.description}
          </p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <Toggle 
            label="Show 'Open to work' badge"
            subtextText="Display on your profile to attract recruiters"
            checked={openToWork}
            onChange={setOpenToWork}
          />
          <Toggle 
            label="Allow CV download"
            subtextText="Let recruiters download your CV"
            checked={allowCvDownload}
            onChange={setAllowCvDownload}
          />
          <Toggle 
            label="Show last active status"
            subtextText="Display when you were last active on the platform"
            checked={showActiveStatus}
            onChange={setShowActiveStatus}
          />
        </div>
      </div>
    </div>
  );
}
