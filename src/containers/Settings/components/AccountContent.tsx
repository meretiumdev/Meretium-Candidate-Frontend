import React from 'react';
import { Pencil, Upload, Check } from 'lucide-react';
import type { CandidateSettingsAccount } from '../../../services/settingsApi';

interface AccountContentProps {
  settings: CandidateSettingsAccount;
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'U';

  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function getSignMethodLabel(signMethod: string): string {
  if (!signMethod) return 'Local';

  const normalized = signMethod.trim().toLowerCase();
  if (normalized === 'google') return 'Google';
  if (normalized === 'local') return 'Local';

  return signMethod
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function AccountContent({ settings }: AccountContentProps) {
  const [fullName, setFullName] = React.useState(settings.full_name);
  const [email, setEmail] = React.useState(settings.email);
  const [phoneNumber, setPhoneNumber] = React.useState(settings.phone_number);

  React.useEffect(() => {
    setFullName(settings.full_name);
    setEmail(settings.email);
    setPhoneNumber(settings.phone_number);
  }, [settings.email, settings.full_name, settings.phone_number]);

  const avatarUrl = settings.avatar?.trim() || null;
  const initials = getInitials(fullName || settings.full_name);
  const signMethodLabel = getSignMethodLabel(settings.sign_method);

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
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-18 h-18 rounded-full object-cover shadow-sm"
              />
            ) : (
              <div className="w-18 h-18 rounded-full bg-[#FF6934] flex items-center justify-center text-white text-[32px] font-medium shadow-sm">
                {initials}
              </div>
            )}
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
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 transition-all font-manrope"
          />
        </div>

        {/* Email Address Section */}
        <div className="space-y-3">
          <label className="text-[14px] font-semibold text-[#101828]">Email address</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="flex-1 px-4 py-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope"
            />
            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-[#E4E7EC] shadow-sm rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 whitespace-nowrap cursor-pointer transition-colors">
              <Pencil size={16} />
              Change email
            </button>
          </div>
          <p className="text-[#667085] text-[12px]">Sign-in method: {signMethodLabel}</p>
        </div>

        {/* Phone Number Section */}
        <div className="space-y-3 pb-4">
          <label className="text-[14px] font-semibold text-[#101828]">Phone number</label>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative flex items-center">
              <input 
                type="tel" 
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                className="w-full pl-4 pr-24 py-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope"
              />
              <div className={`absolute right-3 px-3 py-1 rounded-lg flex items-center gap-1.5 ${settings.phone_verified ? 'bg-[#D1FADF]' : 'bg-[#FEF0C7]'}`}>
                <Check size={14} className={settings.phone_verified ? 'text-[#039855]' : 'text-[#B54708]'} />
                <span className={`text-[12px] font-medium ${settings.phone_verified ? 'text-[#039855]' : 'text-[#B54708]'}`}>
                  {settings.phone_verified ? 'Verified' : 'Not verified'}
                </span>
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
