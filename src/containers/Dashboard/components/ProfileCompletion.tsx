import { Sparkles, ChevronDown, CheckCircle2, Circle } from 'lucide-react';

export default function ProfileCompletion() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm font-manrope transition-all duration-300">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start md:items-center gap-4">
          <div className="size-12 bg-orange-50 rounded-full flex items-center justify-center shadow-sm">
            <Sparkles className="text-[#FF6934] size-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#101828]">Profile completion</h2>
            <p className="text-sm text-[#475467] mt-1">1 of 3 completed</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1">
          <ChevronDown size={20} />
        </button>
      </div>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-2 gap-2 sm:gap-0">
          <div>
            <h3 className="font-semibold text-lg text-[#101828]">Your Profile Strength</h3>
            <p className="text-sm text-[#475467] mt-1">You are in the <span className="font-bold text-[#101828]">Top 25%</span> for roles</p>
          </div>
          <div className="text-3xl font-bold text-[#FF6934]">82%</div>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-4 shadow-inner">
          <div className="h-full bg-[#FF6934] w-[82%] rounded-full shadow-sm"></div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3 bg-[#ECFDF3] border border-[#ABEFC6] p-4 rounded-[10px] shadow-sm">
          <CheckCircle2 className="text-[#12B76A] size-6" />
          <span className="text-sm font-semibold text-[#027A48]">Upload CV</span>
        </div>
        <div className="flex items-center gap-3 bg-[#F9FAFB] border border-gray-100 p-4 rounded-[10px] hover:bg-white hover:border-gray-200 transition-all cursor-pointer shadow-sm group">
          <Circle className="text-gray-300 group-hover:text-[#FF6934] transition-colors size-6" />
          <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">Add skills</span>
        </div>
        <div className="flex items-center gap-3 bg-[#F9FAFB] border border-gray-100 p-4 rounded-[10px] hover:bg-white hover:border-gray-200 transition-all cursor-pointer shadow-sm group">
          <Circle className="text-gray-300 group-hover:text-[#FF6934] transition-colors size-6" />
          <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">Add experience</span>
        </div>
      </div>
    </div>
  );
}
