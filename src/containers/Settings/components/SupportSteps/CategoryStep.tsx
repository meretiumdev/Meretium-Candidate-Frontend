import { ChevronDown } from 'lucide-react';
import type { ContactSupportCategory } from '../../../../services/contactSupportApi';

interface CategoryStepProps {
  category: ContactSupportCategory | '';
  categories: readonly ContactSupportCategory[];
  onCategoryChange: (category: ContactSupportCategory | '') => void;
  errorMessage?: string | null;
  onContinue: () => void;
  continueDisabled?: boolean;
}

export default function CategoryStep({
  category,
  categories,
  onCategoryChange,
  errorMessage,
  onContinue,
  continueDisabled = false,
}: CategoryStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-[14px] font-semibold text-[#101828] mb-2 block">
          Select a category *
        </label>
        <div className="relative">
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value as ContactSupportCategory | '')}
            className={`w-full h-[52px] px-4 py-3 bg-white border rounded-xl text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 appearance-none transition-all cursor-pointer ${
              errorMessage ? 'border-[#FDA29B]' : 'border-[#EAECF0]'
            }`}
          >
            <option value="">Select category</option>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#667085] pointer-events-none" />
        </div>
        {errorMessage && (
          <p className="mt-2 text-[12px] text-[#B42318]">{errorMessage}</p>
        )}
      </div>
      <div className="flex justify-end pt-4">
        <button
          onClick={onContinue}
          disabled={continueDisabled}
          className="px-8 py-3 bg-[#FF6934] text-white rounded-xl text-[14px] font-semibold hover:bg-[#FF6934]/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
