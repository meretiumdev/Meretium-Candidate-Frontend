export default function FiltersSidebar() {
  const sections: { title: string, options: { label: string, count?: string }[] }[] = [
    {
      title: 'Date posted',
      options: [
        { label: 'Last 24 hours', count: '1342' },
        { label: 'Last 3 days', count: '876' },
        { label: 'Last 5 days', count: '1142' },
        { label: 'Last 7 days', count: '1284' },
        { label: 'Last 30 days', count: '4521' },
      ]
    },
    {
      title: 'Job type',
      options: [
        { label: 'Full-time' },
        { label: 'Part-time' },
        { label: 'Contract' },
        { label: 'Internship' },
        { label: 'Graduate Scheme' },
        { label: 'Apprenticeship' },
      ]
    },
    {
      title: 'Experience level',
      options: [
        { label: 'Entry Level' },
        { label: 'Mid-Level' },
        { label: 'Senior Level' },
        { label: 'Lead / Principal' },
      ]
    },
    {
      title: 'Work mode',
      options: [
        { label: 'Any' },
        { label: 'Remote' },
        { label: 'Hybrid' },
        { label: 'On-site' },
      ]
    }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-8">
      <h2 className="text-[18px] font-semibold text-[#101828]">Filters</h2>

      {/* Date posted */}
      <div>
        <h3 className="text-sm font-medium text-[#101828] mb-4">{sections[0].title}</h3>
        <div className="space-y-3">
          {sections[0].options.map((opt, idx) => (
            <label key={idx} className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded border border-[#FF6934] flex items-center justify-center transition-colors group-hover:border-[#FF6934]">
                </div>
                <span className="text-sm text-[#475467] font-regular group-hover:text-gray-900 transition-colors">{opt.label}</span>
              </div>
              {opt.count && <span className="text-[12px] text-[#98A2B3]">({opt.count})</span>}
            </label>
          ))}
        </div>
      </div>

      {/* Job type */}
      <div>
        <h3 className="text-sm font-medium text-[#101828] mb-4">{sections[1].title}</h3>
        <div className="space-y-3">
          {sections[1].options.map((opt, idx) => (
            <label key={idx} className="flex items-center gap-3 cursor-pointer group">
              <div className="w-4 h-4 rounded border border-[#FF6934] flex items-center justify-center transition-colors group-hover:border-[#FF6934]">
              </div>
              <span className="text-sm text-[#475467] font-regular group-hover:text-gray-900 transition-colors">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience level */}
      <div>
        <h3 className="text-sm font-medium text-[#101828] mb-4">{sections[2].title}</h3>
        <div className="space-y-3">
          {sections[2].options.map((opt, idx) => (
            <label key={idx} className="flex items-center gap-3 cursor-pointer group">
              <div className="w-4 h-4 rounded border border-[#FF6934] flex items-center justify-center transition-colors group-hover:border-[#FF6934]">
              </div>
              <span className="text-sm text-[#475467] font-regular group-hover:text-gray-900 transition-colors">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Salary range */}
      <div>
        <h3 className="text-sm font-medium text-[#101828] mb-4">Salary range</h3>
        <div className="flex items-center justify-between text-[14px] text-gray-500 font-regular mb-2">
          <span>Min: £60k</span>
          <span>Max: £120k</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full relative mb-3">
          <div className="absolute left-0 right-[20%] h-full bg-[#E4E7EC] rounded-[10px]"></div>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full relative">
          <div className="absolute left-0 right-[20%] h-full bg-[#E4E7EC] rounded-[10px]"></div>
        </div>
      </div>

      {/* Work mode */}
      <div>
        <h3 className="text-sm font-medium text-[#101828] mb-4">{sections[3].title}</h3>
        <div className="space-y-3">
          {sections[3].options.map((opt, idx) => (
            <label key={idx} className="flex items-center gap-3 cursor-pointer group">
              <div className="w-4 h-4 rounded border border-[#FF6934] flex items-center justify-center transition-colors group-hover:border-[#FF6934]">
              </div>
              <span className="text-sm text-[#475467] font-regular group-hover:text-gray-900 transition-colors">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
}
