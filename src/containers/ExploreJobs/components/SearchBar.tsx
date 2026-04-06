import { Search, MapPin, Briefcase, ChevronDown } from 'lucide-react';

export default function SearchBar() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm font-manrope transition-all duration-300">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Keyword */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#98A2B3]" />
          <input
            type="text"
            placeholder="Job title, skills, or company..."
            defaultValue="Product Designer"
            className="w-full bg-[#F9FAFB] border border-gray-200 rounded-[10px] py-3 pl-12 pr-4 text-sm font-semibold text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 transition-all placeholder:text-[#98A2B3] shadow-sm"
          />
        </div>
        {/* Location */}
        <div className="flex-1 relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#98A2B3]" />
          <input
            type="text"
            placeholder="Location or Remote"
            defaultValue="London, UK"
            className="w-full bg-[#F9FAFB] border border-gray-200 rounded-[10px] py-3 pl-12 pr-4 text-sm font-semibold text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 transition-all placeholder:text-[#98A2B3] shadow-sm"
          />
        </div>
        {/* Job Type */}
        <div className="relative min-w-[160px]">
          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#98A2B3]" />
          <select className="w-full appearance-none bg-[#F9FAFB] border border-gray-200 rounded-[10px] py-3 pl-12 pr-10 text-sm font-bold text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 transition-all cursor-pointer shadow-sm">
            <option>All Types</option>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Contract</option>
            <option>Remote</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#667085] pointer-events-none" />
        </div>
        {/* Search btn */}
        <button className="bg-[#FF6934] text-white px-8 py-3 rounded-[10px] font-bold text-sm hover:opacity-90 transition-opacity shadow-sm cursor-pointer whitespace-nowrap">
          Search Jobs
        </button>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
        {['AI Matched', 'Remote', 'Full-time', '£80k+', 'Senior', 'Startup', 'Tech'].map((tag, i) => (
          <button
            key={tag}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm ${
              i === 0
                ? 'bg-[#FF6934] text-white shadow-md shadow-orange-100'
                : 'bg-[#F2F4F7]/50 border border-gray-200 text-[#475467] hover:bg-white hover:border-[#FF6934] hover:text-[#FF6934]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
