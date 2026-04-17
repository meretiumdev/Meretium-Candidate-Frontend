import { Star, CheckCircle2, FileText, XCircle } from 'lucide-react';
import type { SavedUiStats } from '../types';

interface StatCardsProps {
  stats: SavedUiStats;
}

export default function StatCards({ stats }: StatCardsProps) {
  const cards = [
    {
      icon: <Star size={20} className="text-orange-500 fill-orange-500" />,
      bg: 'bg-orange-50',
      value: String(stats.total),
      label: 'Saved',
      valueColor: 'text-orange-600'
    },
    {
      icon: <CheckCircle2 size={20} className="text-emerald-500" />,
      bg: 'bg-emerald-50',
      value: String(stats.active),
      label: 'Active',
      valueColor: 'text-emerald-600'
    },
    {
      icon: <FileText size={20} className="text-blue-500" />,
      bg: 'bg-blue-50',
      value: String(stats.applied),
      label: 'Applied',
      valueColor: 'text-blue-600'
    },
    {
      icon: <XCircle size={20} className="text-gray-500" />,
      bg: 'bg-gray-100',
      value: String(stats.closed),
      label: 'Closed',
      valueColor: 'text-gray-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((stat, idx) => (
        <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm flex flex-col justify-between transition-all duration-300">
          <div className={`size-10 ${stat.bg} rounded-[10px] flex items-center justify-center mb-4`}>
            {stat.icon}
          </div>
          <div>
            <div className={`text-[24px] sm:text-[30px] font-bold ${stat.valueColor} mb-1 sm:mb-0.5`}>{stat.value}</div>
            <div className="text-[13px] sm:text-[14px] font-medium sm:font-regular text-gray-500">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
