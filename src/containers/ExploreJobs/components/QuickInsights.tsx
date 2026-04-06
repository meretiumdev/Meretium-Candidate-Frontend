import { TrendingUp, Target, BarChart2 } from 'lucide-react';

export default function QuickInsights() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm font-manrope transition-all duration-300">
      <h2 className="text-[16px] font-semibold text-[#101828] mb-5">Quick Insights</h2>
      
      <div className="grid grid-cols-3 sm:flex sm:flex-row sm:justify-between items-start px-0.5 sm:px-2 gap-1 sm:gap-0">
        {/* Metric 1 */}
        <div className="flex flex-col items-center text-center">
          <div className="size-10 bg-[#CC370014] rounded-full flex items-center justify-center mb-3">
            <TrendingUp className="text-[#FF6934] size-5" />
          </div>
          <span className="text-xl font-bold text-gray-900 leading-none">5</span>
          <span className="text-[12px] font-regular text-gray-400 mt-1 max-w-[60px] leading-tight">
            Applications this week
          </span>
        </div>

        {/* Metric 2 */}
        <div className="flex flex-col items-center text-center">
          <div className="size-10 bg-[#12B76A14] rounded-full flex items-center justify-center mb-3">
            <Target className="text-green-500 size-5" />
          </div>
          <span className="text-xl font-bold text-gray-900 leading-none">40%</span>
          <span className="text-[12px] font-regular text-gray-400 mt-1 max-w-[60px] leading-tight">
            Response rate
          </span>
        </div>

        {/* Metric 3 */}
        <div className="flex flex-col items-center text-center">
          <div className="size-10 bg-[#F7900914] rounded-full flex items-center justify-center mb-3">
            <BarChart2 className="text-yellow-500 size-5" />
          </div>
          <span className="text-xl font-bold text-gray-900 leading-none">78%</span>
          <span className="text-[12px] font-regular text-gray-400 mt-1 max-w-[60px] leading-tight">
            Average match score
          </span>
        </div>
      </div>
    </div>
  );
}
