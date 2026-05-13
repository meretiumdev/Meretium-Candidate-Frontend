interface TabsProps {
  allJobsCount?: number | null;
  activeTab: 'all' | 'recommended';
  onTabChange: (tab: 'all' | 'recommended') => void;
}

export default function Tabs({ allJobsCount = 0, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex items-center gap-2">
      <button
        type="button"
        onClick={() => onTabChange('all')}
        className={`px-4 py-2 rounded-[10px] text-[14px] font-[500] flex items-center gap-2 cursor-pointer transition-colors ${
          activeTab === 'all'
            ? 'bg-orange-50 text-[#FF6934]'
            : 'text-gray-500 hover:bg-gray-50'
        }`}
      >
        All Jobs
        <span className="bg-[#FF6934]/10 text-[#FF6934] text-[11px] px-1.5 py-0.5 rounded-[10px]">{allJobsCount}</span>
      </button>
      <button
        type="button"
        onClick={() => onTabChange('recommended')}
        className={`px-4 py-2 rounded-[10px] text-[14px] font-medium flex items-center gap-2 cursor-pointer transition-colors ${
          activeTab === 'recommended'
            ? 'bg-orange-50 text-[#FF6934]'
            : 'text-gray-500 hover:bg-gray-50'
        }`}
      >
        Recommended for you
        <span className="bg-gray-100 text-gray-500 text-[11px] px-1.5 py-0.5 rounded-[10px]">10</span>
      </button>
    </div>
  );
}
