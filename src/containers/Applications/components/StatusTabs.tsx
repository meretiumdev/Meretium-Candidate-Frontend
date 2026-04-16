import type { ApplicationStatusFilter, ApplicationsUiStats } from '../types';

interface StatusTabsProps {
  activeStatus: ApplicationStatusFilter;
  stats: ApplicationsUiStats;
  onChange: (status: ApplicationStatusFilter) => void;
}

export default function StatusTabs({ activeStatus, stats, onChange }: StatusTabsProps) {
  const tabs: Array<{ label: string; value: ApplicationStatusFilter; count: number }> = [
    { label: 'All', value: 'ALL', count: stats.total },
    { label: 'Applied', value: 'APPLIED', count: stats.applied },
    { label: 'In Review', value: 'IN_REVIEW', count: stats.inReview },
    { label: 'Interview', value: 'INTERVIEW', count: stats.interview },
    { label: 'Offered', value: 'OFFERED', count: stats.offered },
    { label: 'Hired', value: 'HIRED', count: stats.hired },
    { label: 'Rejected', value: 'REJECTED', count: stats.rejected },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex items-center overflow-x-auto gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-medium whitespace-nowrap transition-colors cursor-pointer ${tab.value === activeStatus ? 'bg-orange-50 text-[#FF6934]' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          {tab.label}
          <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${tab.value === activeStatus ? 'bg-[#FF6934]/10 text-[#FF6934]' : 'bg-gray-100 text-gray-500'}`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
