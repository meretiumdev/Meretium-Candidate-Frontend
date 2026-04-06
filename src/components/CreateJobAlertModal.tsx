import { X, Bell } from 'lucide-react';
import { useState } from 'react';

interface CreateJobAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateJobAlertModal({ isOpen, onClose }: CreateJobAlertModalProps) {
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('weekly');

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[16px] w-full max-w-[400px] shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-orange-50 rounded-full flex items-center justify-center text-[#FF6934]">
              <Bell size={20} />
            </div>
            <h2 className="text-[20px] font-semibold text-[#101828]">Create Job Alert</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {/* Job Role */}
          <div>
            <label className="block text-sm font-medium text-[#344054] mb-2">Job role *</label>
            <input 
              type="text" 
              placeholder="e.g. Product Designer"
              className="w-full px-4 py-3 rounded-[12px] border border-[#D0D5DD] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 focus:border-[#FF6934] transition-all placeholder:text-[#98A2B3] text-sm"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-[#344054] mb-2">Location</label>
            <input 
              type="text" 
              placeholder="e.g. London, UK"
              className="w-full px-4 py-3 rounded-[12px] border border-[#D0D5DD] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 focus:border-[#FF6934] transition-all placeholder:text-[#98A2B3] text-sm"
            />
          </div>

          {/* Work Mode */}
          <div>
            <label className="block text-sm font-medium text-[#344054] mb-2">Work mode</label>
            <select 
              className="w-full px-4 py-3 rounded-[12px] border border-[#D0D5DD] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 focus:border-[#FF6934] transition-all bg-white text-sm appearance-none"
            >
              <option value="">Select work mode</option>
              <option value="remote">Remote</option>
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-[#344054] mb-4">Frequency *</label>
            <div className="flex bg-[#F9FAFB] p-1 rounded-[12px] gap-1">
              <button 
                onClick={() => setFrequency('daily')}
                className={`flex-1 py-2.5 rounded-[10px] text-sm font-medium transition-all cursor-pointer ${frequency === 'daily' ? 'bg-[#FF6934] text-white shadow-sm' : 'text-[#667085] hover:text-[#101828]'}`}
              >
                Daily
              </button>
              <button 
                onClick={() => setFrequency('weekly')}
                className={`flex-1 py-2.5 rounded-[10px] text-sm font-medium transition-all cursor-pointer ${frequency === 'weekly' ? 'bg-[#FF6934] text-white shadow-sm' : 'text-[#667085] hover:text-[#101828]'}`}
              >
                Weekly
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-2 border-t border-gray-100 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-[#475467] hover:bg-gray-50 rounded-[10px] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            className="px-6 py-2.5 bg-[#FF6934] opacity-50 hover:opacity-100 text-white font-medium text-sm rounded-[10px] shadow-sm transition-all cursor-pointer"
          >
            Create alert
          </button>
        </div>
      </div>
    </div>
  );
}
