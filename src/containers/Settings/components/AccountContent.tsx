import { Pencil, Upload, Check } from 'lucide-react';

export default function AccountContent() {
  return (
    <div className="flex-1 font-manrope animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 px-1">
        <h1 className="text-xl md:text-[32px] font-semibold text-[#101828] mb-1">Account Settings</h1>
        <p className="text-[#475467] text-[14px]">Manage your personal information and contact details</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 space-y-10 shadow-sm transition-all duration-300 font-manrope">
        {/* Profile Photo Section */}
        <div className="space-y-4">
          <h3 className="text-[14px] font-semibold text-[#101828]">Profile photo</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-18 h-18 rounded-full bg-[#FF6934] flex items-center justify-center text-white text-[32px] font-medium shadow-sm">
              S
            </div>
            <div className="space-y-2">
              <button className="flex items-center gap-2 px-4 py-2.5 border border-[#E4E7EC] shadow-sm rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors cursor-pointer">
                <Upload size={16} />
                Upload new photo
              </button>
              <p className="text-[#667085] text-[12px]">JPG or PNG. Max 5MB.</p>
            </div>
          </div>
        </div>

        {/* Full Name Section */}
        <div className="space-y-3">
          <label className="text-[14px] font-semibold text-[#101828]">Full name</label>
          <input 
            type="text" 
            defaultValue="Sarah Johnson"
            className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 transition-all font-manrope"
          />
        </div>

        {/* Email Address Section */}
        <div className="space-y-3">
          <label className="text-[14px] font-semibold text-[#101828]">Email address</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              defaultValue="sarah@mail.com"
              className="flex-1 px-4 py-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope"
            />
            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-[#E4E7EC] shadow-sm rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 whitespace-nowrap cursor-pointer transition-colors">
              <Pencil size={16} />
              Change email
            </button>
          </div>
        </div>

        {/* Phone Number Section */}
        <div className="space-y-3 pb-4">
          <label className="text-[14px] font-semibold text-[#101828]">Phone number</label>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative flex items-center">
              <input 
                type="tel" 
                defaultValue="+44 7700 900000"
                className="w-full pl-4 pr-24 py-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope"
              />
              <div className="absolute right-3 px-3 py-1 bg-[#D1FADF] rounded-lg flex items-center gap-1.5">
                <Check size={14} className="text-[#039855]" />
                <span className="text-[#039855] text-[12px] font-medium">Verified</span>
              </div>
            </div>
            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-[#E4E7EC] shadow-sm rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 whitespace-nowrap cursor-pointer transition-colors">
              <Pencil size={16} />
              Change number
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
