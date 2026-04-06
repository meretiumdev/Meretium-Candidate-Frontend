import { TrendingUp, Bell, Award } from 'lucide-react';

const trendingRoles = [
  'AI Product Designer',
  'Design Systems Lead',
  'UX Researcher',
  'Product Designer',
  'Motion Designer',
];

export default function Sidebar() {
  return (
    <div className="flex flex-col gap-6 sticky top-24 font-manrope">

      {/* AI Insights */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2 mb-5">
          <div className="size-8 bg-orange-50 rounded-full flex items-center justify-center shadow-sm">
            <TrendingUp className="text-[#FF6934] size-4" />
          </div>
          <h2 className="text-[15px] font-bold text-[#101828]">Market Insights</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-orange-50/60 rounded-[10px] p-4 border border-[#FF693420] shadow-sm">
            <p className="text-[10px] font-bold text-[#FF6934] uppercase tracking-wider mb-1">Demand Trend</p>
            <p className="text-sm font-bold text-[#101828]">Product Designers</p>
            <p className="text-[11px] text-[#475467] mt-0.5 font-medium">+18% more openings vs last month</p>
          </div>
          <div className="bg-green-50/60 rounded-[10px] p-4 border border-green-200/50 shadow-sm">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Avg Salary</p>
            <p className="text-sm font-bold text-[#101828]">£95k – £135k</p>
            <p className="text-[11px] text-[#475467] mt-0.5 font-medium">London & Remote roles</p>
          </div>
        </div>
      </div>

      {/* Trending Roles */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2 mb-4">
          <Award className="text-[#FF6934] size-5" />
          <h2 className="text-[15px] font-bold text-[#101828]">Trending Roles</h2>
        </div>
        <div className="space-y-1">
          {trendingRoles.map((role, i) => (
            <button
              key={role}
              className="w-full flex items-center justify-between text-sm font-semibold text-[#475467] hover:text-[#FF6934] hover:bg-[#FFF1EC] px-3 py-2.5 rounded-[10px] transition-all group cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#98A2B3] w-4">#{i + 1}</span>
                {role}
              </span>
              <span className="text-xs text-[#98A2B3] group-hover:text-[#FF6934]">→</span>
            </button>
          ))}
        </div>
      </div>

      {/* Job Alert */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm transition-all duration-300">
        <div className="flex items-start gap-4 mb-5">
          <div className="size-10 shrink-0 bg-red-50 rounded-full flex items-center justify-center border border-red-100 shadow-sm">
            <Bell className="text-[#FF6934] size-5" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#101828]">Job Alerts</h2>
            <p className="text-[13px] text-[#475467] font-medium leading-[19px] mt-0.5">
              <span className="font-bold text-[#101828]">12 new jobs</span> match your Product Designer alert
            </p>
          </div>
        </div>
        <button className="w-full bg-[#FF6934] text-white py-2.5 rounded-[10px] text-[14px] font-bold hover:opacity-90 transition-opacity shadow-sm cursor-pointer">
          View all alerts
        </button>
      </div>

    </div>
  );
}
