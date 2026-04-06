import React from 'react';
import { Bug, ChevronUp, ChevronDown, Upload } from 'lucide-react';

interface ReportBugSectionProps {
  expanded: boolean;
  onToggle: () => void;
}

export default function ReportBugSection({ expanded, onToggle }: ReportBugSectionProps) {
  const [severity, setSeverity] = React.useState('Medium');

  const systemInfo = [
    { label: 'Browser', value: 'Chrome' },
    { label: 'OS', value: 'Windows' },
    { label: 'Page', value: '/settings' },
    { label: 'Time', value: '2/20/2026, 1:42:19 AM' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all duration-300 font-manrope">
      <button 
        onClick={onToggle}
        className="w-full p-6 sm:p-8 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[10px] bg-[#FFF1EC] border border-[#FF693410] flex items-center justify-center shadow-sm">
            <Bug className="text-[#FF6934]" size={24} />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-[#101828]">Report a Bug</h3>
            <p className="text-[14px] text-[#667085]">Help us improve Meretium</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="text-[#667085]" /> : <ChevronDown className="text-[#667085]" />}
      </button>

      {expanded && (
        <div className="px-6 sm:px-8 pb-8 space-y-8 animate-in fade-in duration-300">
          {/* Auto-captured System Info */}
          <div className="bg-[#F9FAFB] rounded-[10px] p-6 border border-gray-200 shadow-sm">
            <p className="text-[12px] font-semibold text-[#667085] mb-4">Auto-captured system info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-12">
              {systemInfo.map((info) => (
                <div key={info.label} className="flex items-center gap-2">
                  <span className="text-[12px] text-[#98A2B3] w-16">{info.label}:</span>
                  <span className="text-[12px] font-medium text-[#475467]">{info.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Bug Title */}
            <div>
              <label className="text-[14px] font-semibold text-[#101828] mb-2 block">Bug title *</label>
              <input 
                type="text"
                placeholder="Brief summary of the issue"
                className="w-full h-[52px] px-4 py-3 bg-white border border-gray-200 rounded-[10px] shadow-sm text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope"
              />
            </div>

            {/* What happened? */}
            <div>
              <label className="text-[14px] font-semibold text-[#101828] mb-2 block">What happened? *</label>
              <textarea 
                placeholder="Describe what went wrong..."
                rows={4}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[10px] shadow-sm text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 resize-none font-manrope"
              />
            </div>

            {/* What did you expect? */}
            <div>
              <label className="text-[14px] font-semibold text-[#101828] mb-2 block">What did you expect? *</label>
              <textarea 
                placeholder="Describe the expected behavior..."
                rows={4}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[10px] shadow-sm text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 resize-none font-manrope"
              />
            </div>

            {/* Severity Selector */}
            <div>
              <label className="text-[14px] font-semibold text-[#101828] mb-3 block">Severity *</label>
              <div className="flex bg-[#F9FAFB] p-1 rounded-[10px] border border-gray-200 gap-1 shadow-sm">
                {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSeverity(level)}
                    className={`flex-1 py-2 text-[14px] font-medium rounded-[8px] transition-all cursor-pointer ${
                      severity === level 
                      ? 'bg-[#FF6934] text-white shadow-sm' 
                      : 'text-[#667085] hover:text-[#101828]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Screenshot Upload */}
            <div>
              <label className="text-[14px] font-semibold text-[#101828] mb-2 block">Screenshot (optional)</label>
              <div className="border border-gray-200 border-dashed rounded-[10px] p-8 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 transition-all cursor-pointer group shadow-sm">
                <div className="w-10 h-10 rounded-[10px] bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <Upload className="text-[#667085]" size={20} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-medium text-[#101828]">Drag and drop or click to upload</p>
                  <p className="text-[12px] text-[#98A2B3] mt-1">PNG, JPG up to 10MB</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button className="px-8 py-3 bg-[#FF6934]/40 text-white rounded-[10px] text-[14px] font-semibold hover:bg-[#FF6934]/50 transition-colors cursor-not-allowed shadow-sm">
                Report bug
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
