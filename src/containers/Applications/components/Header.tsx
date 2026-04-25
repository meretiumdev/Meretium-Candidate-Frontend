import { ChevronDown } from 'lucide-react';
import type { ApplicationSortOption } from '../types';

interface HeaderProps {
  sortBy: ApplicationSortOption;
  onSortChange: (value: ApplicationSortOption) => void;
  disabled?: boolean;
}

export default function Header({ sortBy, onSortChange, disabled = false }: HeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="">
        <h1 className="text-[32px] font-semibold text-[#101828]">Applications</h1>
        <p className="text-[#475467] mt-1">Track and manage all your job applications</p>
      </div>
      <div className="relative flex items-center w-full md:w-auto">
        <select
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value as ApplicationSortOption)}
          disabled={disabled}
          className="border border-[#E4E7EC] rounded-[10px] px-4 pr-10 py-2.5 text-[14px] font-medium text-[#475467] bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 appearance-none min-w-[170px] w-full md:w-auto disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          <option value="recently_applied">Recently applied</option>
          <option value="oldest">Oldest</option>
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#667085]" />
      </div>
    </div>
  );
}
