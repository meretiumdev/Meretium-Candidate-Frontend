import { Search, ChevronDown } from 'lucide-react';

export default function JobFilters() {
  return (
    <div className="bg-white border border-gray-200 rounded-[10px] p-2 flex flex-col md:flex-row items-center gap-3 shadow-sm">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by job title..."
          className="w-full pl-11 pr-4 py-2 text-[14px] border-none focus:ring-0 placeholder:text-gray-400"
        />
      </div>
      
      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="relative w-full md:w-[160px]">
          <select className="w-full appearance-none bg-white border border-gray-100 rounded-[8px] px-4 py-2 text-[14px] text-[#475467] font-medium outline-none cursor-pointer">
            <option>All Statuses</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative w-full md:w-[140px]">
          <select className="w-full appearance-none bg-white border border-gray-100 rounded-[8px] px-4 py-2 text-[14px] text-[#475467] font-medium outline-none cursor-pointer">
            <option>Newest</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
