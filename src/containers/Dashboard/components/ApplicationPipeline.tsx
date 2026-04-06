export default function ApplicationPipeline({ counts }: { counts?: { applied?: number, underReview?: number, interview?: number, offered?: number, rejected?: number } }) {
  const stats = [
    { label: 'Applied', count: counts?.applied ?? 0, color: 'text-[#5925DC]', border: 'bg-[#444CE7]' },
    { label: 'Under review', count: counts?.underReview ?? 0, color: 'text-[#F79009]', border: 'bg-[#F79009]' },
    { label: 'Interview', count: counts?.interview ?? 0, color: 'text-[#EF6820]', border: 'bg-[#F04438]' },
    { label: 'Offered', count: counts?.offered ?? 0, color: 'text-[#12B76A]', border: 'bg-[#12B76A]' },
    { label: 'Rejected', count: counts?.rejected ?? 0, color: 'text-[#D92D20]', border: 'bg-[#F04438]' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
      <h2 className="text-[18px] font-semibold text-[#101828] mb-6 font-manrope">Application Pipeline</h2>
      <div className="flex flex-nowrap gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex-1 bg-[#F9FAFB] border border-gray-100 p-3 md:p-4 rounded-[10px] min-w-[140px] flex flex-col items-center justify-center relative overflow-hidden shadow-sm transition-all hover:bg-white hover:border-gray-200">
            <span className={`text-[24px] font-bold ${stat.color}`}>{stat.count}</span>
            <span className="text-[12px] font-[500] text-gray-500 mt-1 whitespace-nowrap font-manrope">{stat.label}</span>
            <div className="w-full flex gap-1.5 mt-4">
              <div className={`h-1 flex-1 rounded-full ${stat.border}`}></div>
              <div className="h-1 flex-1 bg-[#EAECF0] rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
