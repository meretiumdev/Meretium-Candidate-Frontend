import type { SavedSortOption } from '../types';

interface HeaderProps {
  sortBy: SavedSortOption;
  onSortChange: (value: SavedSortOption) => void;
  disabled?: boolean;
}

export default function Header({ sortBy, onSortChange, disabled = false }: HeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h1 className="text-[32px] font-semibold text-[#101828]">Saved jobs</h1>
        <p className="text-[#475467] mt-1">Jobs you've bookmarked to review later</p>
      </div>
      <div className="flex items-center w-full md:w-auto">
        <select
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value as SavedSortOption)}
          disabled={disabled}
          className="border border-[#E4E7EC] rounded-[10px] px-4 py-2.5 text-[14px] font-medium text-[#475467] bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 appearance-none min-w-[160px] w-full md:w-auto disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          <option value="recently_saved">Recently saved</option>
          <option value="oldest_first">Oldest first</option>
          <option value="expiring_soon">Expiring soon</option>
        </select>
      </div>
    </div>
  );
}
