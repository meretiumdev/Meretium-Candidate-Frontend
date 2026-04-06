import { ChevronDown } from 'lucide-react';

interface CategoryStepProps {
  onContinue: () => void;
}

export default function CategoryStep({ onContinue }: CategoryStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-[14px] font-semibold text-[#101828] mb-2 block">
          Select a category *
        </label>
        <div className="relative">
          <select className="w-full h-[52px] px-4 py-3 bg-white border border-[#EAECF0] rounded-xl text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 appearance-none transition-all cursor-pointer">
            <option disabled selected>Select category</option>
            <option>Account Access</option>
            <option>Technical Issue</option>
            <option>Billing</option>
            <option>Other</option>
          </select>
          <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#667085] pointer-events-none" />
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <button 
          onClick={onContinue}
          className="px-8 py-3 bg-[#FF6934] text-white rounded-xl text-[14px] font-semibold hover:bg-[#FF6934]/90 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
