import type { SavedStatusFilter, SavedUiStats } from '../types';

interface StatusTabsProps {
  activeStatus: SavedStatusFilter;
  stats: SavedUiStats;
  onChange: (status: SavedStatusFilter) => void;
  disabled?: boolean;
}

export default function StatusTabs({ activeStatus, stats, onChange, disabled = false }: StatusTabsProps) {
  const tabs = [
    { status: 'ALL' as const, label: 'All', count: stats.total },
    { status: 'ACTIVE' as const, label: 'Active', count: stats.active },
    { status: 'APPLIED' as const, label: 'Applied', count: stats.applied },
    { status: 'CLOSED' as const, label: 'Closed', count: stats.closed },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex items-center overflow-x-auto gap-1 transition-all duration-300">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          type="button"
          onClick={() => onChange(tab.status)}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-medium whitespace-nowrap transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
            tab.status === activeStatus
              ? 'bg-orange-50 text-[#FF6934]'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          {tab.label}
          <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${
            tab.status === activeStatus ? 'bg-[#FF6934]/10 text-[#FF6934]' : 'bg-gray-100 text-gray-500'
          }`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
