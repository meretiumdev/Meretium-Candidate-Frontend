import React from 'react';
import { ChevronDown, Download, Trash2 } from 'lucide-react';

interface ToggleProps {
  label: string;
  subtextText: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Toggle = ({ label, subtextText, checked, onChange }: ToggleProps) => {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <h4 className="text-[14px] font-medium text-[#101828] mb-0.5">{label}</h4>
        <p className="text-[12px] text-[#667085]">{subtextText}</p>
      </div>
      <button 
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative duration-200 shrink-0 ${checked ? 'bg-[#FF6934]' : 'bg-[#EAECF0]'}`}
      >
        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
};

export default function CvDataContent() {
  const [useDefaultQuickApply, setUseDefaultQuickApply] = React.useState(true);

  return (
    <div className="flex-1 font-manrope animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 px-1">
        <h1 className="text-xl md:text-[32px] font-semibold text-[#101828] mb-1">CV & Data Management</h1>
        <p className="text-[#475467] text-[14px]">Manage your CVs and data export preferences</p>
      </div>

      <div className="space-y-6">
        {/* Default CV Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 shadow-sm transition-all duration-300">
          <div className="space-y-4">
            <h3 className="text-[14px] font-semibold text-[#101828]">Default CV</h3>
            <div className="relative">
              <select className="w-full h-[52px] px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 appearance-none transition-all cursor-pointer font-manrope">
                <option>Frontend_Designer_CV.pdf</option>
                <option>Backend_Developer_CV.pdf</option>
                <option>Fullstack_CV.pdf</option>
              </select>
              <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#667085] pointer-events-none" />
            </div>
            <p className="text-[12px] text-[#667085] border-b border-gray-200 pb-6">This CV will be used by default when applying to jobs</p>
            
            <Toggle 
              label="Use default CV for Quick Apply"
              subtextText="Automatically select your default CV when quick applying"
              checked={useDefaultQuickApply}
              onChange={setUseDefaultQuickApply}
            />
          </div>
        </div>

        {/* Data Export Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 shadow-sm transition-all duration-300">
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-semibold text-[#101828] mb-1">Data export</h3>
              <p className="text-[14px] text-[#667085]">Download all your data including profile, applications, and messages</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-3 border border-gray-200 shadow-sm rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors cursor-pointer">
              <Download size={18} />
              Download my data
            </button>
          </div>
        </div>

        {/* Delete CVs Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 shadow-sm transition-all duration-300">
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-semibold text-[#FF4D4F] mb-1">Delete all CVs</h3>
              <p className="text-[14px] text-[#667085]">Permanently remove all uploaded CVs from your account</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-3 border border-gray-200 shadow-sm rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer group">
              <Trash2 size={18} className="text-[#667085] group-hover:text-[#FF4D4F] transition-colors" />
              Delete all CVs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
