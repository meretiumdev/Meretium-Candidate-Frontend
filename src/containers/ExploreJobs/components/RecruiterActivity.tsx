import { Eye, MessageCircle } from 'lucide-react';

export default function RecruiterActivity() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm font-manrope transition-all duration-300">
      <h2 className="text-[16px] font-semibold text-[#101828] mb-5">Recruiter Activity</h2>
      
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-4 p-4 rounded-[10px] bg-[#F9FAFB] border border-gray-100 shadow-sm transition-all hover:bg-white hover:border-gray-200 cursor-pointer">
          <div className="size-10 bg-[#FFF1EC] rounded-full flex items-center justify-center shrink-0 shadow-sm">
            <Eye className="text-[#FF6934] size-5" />
          </div>
          <p className="text-[13px] text-gray-500 font-medium leading-[18px]">
            Your profile was viewed by<br />
            <span className="font-bold text-gray-900">4 recruiters</span>
          </p>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-[10px] bg-[#F9FAFB] border border-gray-100 shadow-sm transition-all hover:bg-white hover:border-gray-200 cursor-pointer">
          <div className="size-10 bg-[#FFF1EC] rounded-full flex items-center justify-center shrink-0 shadow-sm">
            <MessageCircle className="text-[#FF6934] size-5" />
          </div>
          <p className="text-[13px] text-gray-500 font-medium leading-[18px]">
            You have<br />
            <span className="font-bold text-gray-900">1 new message</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button className="w-full sm:flex-1 justify-center bg-white border border-gray-200 text-[#101828] py-2.5 rounded-[10px] text-[14px] font-semibold hover:bg-gray-50 transition-all cursor-pointer whitespace-nowrap px-2 shadow-sm">
          View messages
        </button>
        <button className="w-full sm:flex-1 justify-center bg-white border border-gray-200 text-[#101828] py-2.5 rounded-[10px] text-[14px] font-semibold hover:bg-gray-50 transition-all cursor-pointer whitespace-nowrap px-2 shadow-sm">
          Profile insights
        </button>
      </div>
    </div>
  );
}
