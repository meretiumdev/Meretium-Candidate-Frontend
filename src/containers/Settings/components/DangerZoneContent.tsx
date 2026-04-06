import { Pause, Trash2 } from 'lucide-react';

export default function DangerZoneContent() {
  return (
        <div className="flex-1 font-manrope animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="mb-8 px-1">
        <h1 className="text-xl md:text-[32px] font-semibold text-[#101828] mb-1">Danger Zone</h1>
        <p className="text-[#475467] text-[14px]">Irreversible and destructive actions</p>
      </div>

      <div className="space-y-6">
        {/* Deactivate Account */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-10 flex items-start gap-6 transition-all hover:bg-red-50/10 group shadow-sm">
          <div className="size-14 rounded-[10px] bg-red-50 border border-red-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
            <Pause className="text-[#FF6934]" size={28} />
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-[18px] font-semibold text-[#FF4D4F] mb-1">Deactivate account</h3>
              <p className="text-[14px] text-[#667085] leading-relaxed">Temporarily hide your profile from recruiters. You can reactivate anytime.</p>
            </div>
            <button className="px-6 h-[44px] border border-gray-200 text-[#344054] rounded-[10px] text-[14px] font-medium hover:border-red-200 hover:text-red-600 transition-all cursor-pointer shadow-sm">
              Deactivate account
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-10 flex items-start gap-6 transition-all hover:bg-red-50/10 group shadow-sm">
          <div className="size-14 rounded-[10px] bg-red-50 border border-red-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
            <Trash2 className="text-[#FF4D4F]" size={28} />
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-[18px] font-semibold text-[#FF4D4F] mb-1">Delete account</h3>
              <p className="text-[14px] text-[#667085] leading-relaxed">Permanently delete your account and all associated data. This action cannot be undone.</p>
            </div>
            <button className="px-6 h-[44px] border border-gray-200 text-[#344054] rounded-[10px] text-[14px] font-medium hover:bg-red-600 hover:text-white hover:border-red-600 transition-all flex items-center gap-2 cursor-pointer shadow-sm">
              <Trash2 size={18} />
              Delete account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
