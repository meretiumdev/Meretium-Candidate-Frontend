interface TabsProps {
  allJobsCount?: number | null;
}

export default function Tabs({ allJobsCount = 0 }: TabsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex items-center gap-2">
      <button className="bg-orange-50 text-[#FF6934] px-4 py-2 rounded-[10px] text-[14px] font-[500] flex items-center gap-2 cursor-pointer transition-colors">
        All Jobs
        <span className="bg-[#FF6934]/10 text-[#FF6934] text-[11px] px-1.5 py-0.5 rounded-[10px]">{allJobsCount}</span>
      </button>
      <button className="text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-[10px] text-[14px] font-medium flex items-center gap-2 cursor-pointer transition-colors">
        Recommended for you
        <span className="bg-gray-100 text-gray-500 text-[11px] px-1.5 py-0.5 rounded-[10px]">1</span>
      </button>
    </div>
  );
}
