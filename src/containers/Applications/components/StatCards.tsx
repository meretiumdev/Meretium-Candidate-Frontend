import { FileText, Clock, Calendar, Gift } from 'lucide-react';
import type { ApplicationsUiStats } from '../types';

interface StatCardsProps {
  stats: ApplicationsUiStats;
}

export default function StatCards({ stats }: StatCardsProps) {
  const cards = [
    {
      icon: <FileText size={20} className="text-gray-500" />,
      bg: 'bg-gray-100',
      value: String(stats.total),
      label: 'Total applications',
      valueColor: 'text-gray-900'
    },
    {
      icon: <Clock size={20} className="text-blue-500" />,
      bg: 'bg-blue-50',
      value: String(stats.inReview),
      label: 'In review',
      valueColor: 'text-blue-500'
    },
    {
      icon: <Calendar size={20} className="text-purple-500" />,
      bg: 'bg-purple-50',
      value: String(stats.interview),
      label: 'Interviews',
      valueColor: 'text-purple-500'
    },
    {
      icon: <Gift size={20} className="text-green-500" />,
      bg: 'bg-green-50',
      value: String(stats.offered),
      label: 'Offers',
      valueColor: 'text-green-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((stat, idx) => (
        <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 flex flex-col justify-between shadow-sm">
          <div className={`size-10 ${stat.bg} rounded-[10px] flex items-center justify-center mb-4`}>
            {stat.icon}
          </div>
          <div>
            <div className={`text-[24px] sm:text-[30px] font-black ${stat.valueColor} mb-1 sm:mb-0.5`}>{stat.value}</div>
            <div className="text-[13px] sm:text-[14px] font-medium sm:font-regular text-gray-500">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
