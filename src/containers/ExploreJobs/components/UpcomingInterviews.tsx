import { Calendar, Video, MapPin } from 'lucide-react';

export default function UpcomingInterviews() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm font-manrope transition-all duration-300">
      <h2 className="text-[16px] font-semibold text-[#101828] mb-5">Upcoming Interviews</h2>

      <div className="space-y-4">
        {/* Interview 1 */}
        <div className="rounded-xl p-4 bg-[#F9FAFB]/50 border border-gray-200 shadow-sm transition-all hover:bg-white hover:border-[#FF6934] group cursor-pointer font-manrope">
          <div className="flex gap-3 mb-3">
            <div className="size-10 bg-[#FF6934] text-white rounded-xl flex items-center justify-center font-bold text-lg shrink-0 shadow-sm group-hover:rotate-6 transition-transform">
              G
            </div>
            <div>
              <h3 className="font-bold text-[#101828] text-sm group-hover:text-[#FF6934] transition-colors">Senior Product Designer</h3>
              <p className="text-[#475467] text-xs mt-0.5">Google</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
              <Calendar size={14} className="text-gray-400" /> Tomorrow at 2:00 PM
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
              <Video size={14} className="text-gray-400" /> Remote
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button className="w-full sm:flex-1 bg-white border border-gray-200 text-[#101828] py-2 rounded-[8px] text-[12px] font-semibold hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
              View details
            </button>
            <button className="w-full sm:flex-1 bg-[#FF6934] text-white py-2 rounded-[8px] text-[12px] font-semibold hover:opacity-90 transition-all shadow-sm cursor-pointer">
              Join
            </button>
          </div>
        </div>

        {/* Interview 2 */}
        <div className="rounded-xl p-4 bg-[#F9FAFB]/50 border border-gray-200 shadow-sm transition-all hover:bg-white hover:border-[#FF6934] group cursor-pointer font-manrope">
          <div className="flex gap-3 mb-3">
            <div className="size-10 bg-[#FF6934] text-white rounded-xl flex items-center justify-center font-bold text-lg shrink-0 shadow-sm group-hover:rotate-6 transition-transform">
              S
            </div>
            <div>
              <h3 className="font-bold text-[#101828] text-sm group-hover:text-[#FF6934] transition-colors">Design Lead</h3>
              <p className="text-[#475467] text-xs mt-0.5">Stripe</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
              <Calendar size={14} className="text-gray-400" /> Friday at 10:00 AM
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
              <MapPin size={14} className="text-gray-400" /> Onsite • San Francisco, CA
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button className="w-full sm:flex-1 bg-white border border-gray-200 text-[#101828] py-2 rounded-[8px] text-[12px] font-semibold hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
              View details
            </button>
            <button className="w-full sm:flex-1 bg-[#FF6934] text-white py-2 rounded-[8px] text-[12px] font-semibold hover:opacity-90 transition-all shadow-sm cursor-pointer">
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
