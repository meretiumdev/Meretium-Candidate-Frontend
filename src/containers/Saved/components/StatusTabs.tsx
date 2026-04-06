export default function StatusTabs() {
  const tabs = [
    { label: "All", count: 5, active: true },
    { label: "Active", count: 1 },
    { label: "Applied", count: 1 },
    { label: "Closed", count: 1 }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex items-center overflow-x-auto gap-1 transition-all duration-300">
      {tabs.map((tab) => (
        <button 
          key={tab.label}
          className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-medium whitespace-nowrap transition-colors cursor-pointer ${tab.active ? 'bg-orange-50 text-[#FF6934]' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${tab.active ? 'bg-[#FF6934]/10 text-[#FF6934]' : 'bg-gray-100 text-gray-500'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
