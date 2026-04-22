import { Search, ChevronDown, MapPin } from 'lucide-react';

const JOBS = [
  { id: 1, title: 'Product Designer', location: 'Remote', type: 'Full-time', salary: '$90,000 – $120,000' },
  { id: 2, title: 'Senior UX Designer', location: 'Remote', type: 'Full-time', salary: '$100,000 – $130,000' },
  { id: 3, title: 'Product Designer', location: 'Remote', type: 'Full-time', salary: '$90,000 – $120,000' },
  { id: 4, title: 'Senior UX Designer', location: 'Remote', type: 'Full-time', salary: '$100,000 – $130,000' },
  { id: 5, title: 'Product Designer', location: 'Remote', type: 'Full-time', salary: '$90,000 – $120,000' },
  { id: 6, title: 'Senior UX Designer', location: 'Remote', type: 'Full-time', salary: '$100,000 – $130,000' },
];

export default function CompanyJobsView() {
  return (
    <div className="flex flex-col gap-6 mt-14 font-manrope">
      {/* Search & Filters Bar */}
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

      {/* Jobs Section Card */}
      <div className="bg-white border border-gray-200 rounded-[10px] p-6 md:p-8 shadow-sm">
        {/* Grid Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h2 className="text-[20px] font-bold text-[#101828]">Open positions at Notion</h2>
          <span className="inline-flex items-center w-fit gap-1.5 text-[12px] font-medium text-[#12B76A] bg-[#ECFDF3] px-4 py-1.5 rounded-full">
            Actively hiring
          </span>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {JOBS.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-[#E4E7EC] rounded-[10px] p-5 hover:border-[#FF6934] transition-all cursor-pointer group"
            >
              <h3 className="text-[18px] font-semibold text-[#101828] mb-3 group-hover:text-[#FF6934] transition-colors line-clamp-1">
                {job.title}
              </h3>
              <div className="flex items-center gap-x-3 gap-y-1 text-[13px] md:text-[14px] text-[#475467] flex-wrap font-regular">
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-[#475467]" />
                  {job.location}
                </div>
                <span className="text-gray-900">•</span>
                <span>{job.type}</span>
                <span className="text-gray-900">•</span>
                <span className="text-[#12B76A] font-medium">{job.salary}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
