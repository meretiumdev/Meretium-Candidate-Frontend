export default function ApplicationPipeline({ counts }: { counts?: { applied?: number, underReview?: number, interview?: number, offered?: number, rejected?: number } }) {
  const stats = [
    { label: 'Applied', count: counts?.applied ?? 0, color: 'text-[#5925DC]', border: 'bg-[#444CE7]' },
    { label: 'Under review', count: counts?.underReview ?? 0, color: 'text-[#F79009]', border: 'bg-[#F79009]' },
    { label: 'Interview', count: counts?.interview ?? 0, color: 'text-[#EF6820]', border: 'bg-[#F04438]' },
    { label: 'Offered', count: counts?.offered ?? 0, color: 'text-[#12B76A]', border: 'bg-[#12B76A]' },
    { label: 'Rejected', count: counts?.rejected ?? 0, color: 'text-[#D92D20]', border: 'bg-[#F04438]' },
  ];

  const maxCount = Math.max(...stats.map(s => s.count), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
      <h2 className="text-[18px] font-semibold text-[#101828] mb-6 font-manrope">Application Pipeline</h2>
      <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex-1 bg-[#F9FAFB] p-3 md:p-4 rounded-[10px] min-w-[140px] flex flex-col items-center justify-center relative shadow-sm transition-all hover:bg-white hover:border-gray-200">
            <span className={`text-[24px] font-bold ${stat.color}`}>{stat.count}</span>
            <span className="text-[12px] font-[500] text-gray-500 mt-1 whitespace-nowrap font-manrope">{stat.label}</span>
            <div className="w-full h-1 bg-[#EAECF0] rounded-full mt-4 overflow-hidden">
              <div 
                className={`h-full rounded-full ${stat.border} transition-all duration-500`}
                style={{ width: `${(stat.count / maxCount) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
