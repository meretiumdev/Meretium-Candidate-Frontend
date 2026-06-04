import React from 'react';
import { useSelector } from 'react-redux';
import { Pencil, Upload, Check, Loader2 } from 'lucide-react';
import type { RootState } from '../../../redux/store';
import { uploadCandidateAvatar, type CandidateSettingsAccount } from '../../../services/settingsApi';
import ChangeEmailModal from './ChangeEmailModal';
import ChangePhoneModal from './ChangePhoneModal';
import { isTwoFactorEnabled } from '../../../utils/twoFactor';

const MAX_AVATAR_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

interface AccountContentProps {
  settings: CandidateSettingsAccount;
  onPhoneChanged?: (nextPhone: string) => Promise<void> | void;
  onSettingsRefresh?: () => Promise<void> | void;
}

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function isAcceptedAvatarFile(file: File): boolean {
  if (ACCEPTED_AVATAR_MIME_TYPES.has(file.type)) return true;

  const normalizedName = file.name.trim().toLowerCase();
  return normalizedName.endsWith('.jpg') || normalizedName.endsWith('.jpeg') || normalizedName.endsWith('.png');
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

export default function AccountContent({ settings, onPhoneChanged, onSettingsRefresh }: AccountContentProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [fullName, setFullName] = React.useState(settings.full_name);
  const [email, setEmail] = React.useState(settings.email);
  const [phoneNumber, setPhoneNumber] = React.useState(settings.phone_number);
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = React.useState(false);
  const [isChangePhoneModalOpen, setIsChangePhoneModalOpen] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const requiresTwoFactorVerification = isTwoFactorEnabled(authUser);

  React.useEffect(() => {
    setFullName(settings.full_name);
    setEmail(settings.email);
    setPhoneNumber(settings.phone_number);
  }, [settings.email, settings.full_name, settings.phone_number]);

  React.useEffect(() => {
    if (!toast) return undefined;

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const avatarUrl = settings.avatar?.trim() || null;
  const initials = getInitials(fullName || settings.full_name);
  const signMethodLabel = getSignMethodLabel(settings.sign_method);

  const handlePhoneChanged = async (nextPhone: string) => {
    setPhoneNumber(nextPhone);
    if (onPhoneChanged) {
      await onPhoneChanged(nextPhone);
    }
  };

  const handleAvatarButtonClick = () => {
    if (isUploadingAvatar) return;
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';

    if (!file) return;

    if (!accessToken?.trim()) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.', type: 'error' });
      return;
    }

    if (!isAcceptedAvatarFile(file)) {
      setToast({ id: Date.now(), message: 'Please upload a JPG or PNG image.', type: 'error' });
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
      setToast({ id: Date.now(), message: 'Avatar image must be 5MB or smaller.', type: 'error' });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const successMessage = await uploadCandidateAvatar({ accessToken, file });
      if (onSettingsRefresh) {
        await onSettingsRefresh();
      }
      setToast({
        id: Date.now(),
        message: successMessage || 'Profile photo updated successfully.',
        type: 'success',
      });
    } catch (error: unknown) {
      setToast({
        id: Date.now(),
        message: getErrorMessage(error, 'Failed to upload profile photo. Please try again.'),
        type: 'error',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="flex-1 font-manrope animate-in fade-in slide-in-from-bottom-4 duration-500">
      {toast && (
        <div
          key={toast.id}
          className={`fixed top-4 right-4 z-[160] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
            toast.type === 'success'
              ? 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
              : 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
          }`}
        >
          {toast.message}
        </div>
      )}

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
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className="hidden"
                onChange={(event) => { void handleAvatarFileChange(event); }}
              />
              <button
                type="button"
                onClick={handleAvatarButtonClick}
                disabled={isUploadingAvatar}
                className="flex items-center gap-2 px-4 py-2.5 border border-[#E4E7EC] shadow-sm rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isUploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {isUploadingAvatar ? 'Uploading photo...' : 'Upload new photo'}
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
            disabled={true}
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
              readOnly
              className="flex-1 px-4 py-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope"
            />
            <button
              type="button"
              onClick={() => setIsChangeEmailModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-[#E4E7EC] shadow-sm rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 whitespace-nowrap cursor-pointer transition-colors"
            >
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
                readOnly
                className="w-full pl-4 pr-24 py-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded-[10px] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 font-manrope"
              />
              <div className={`absolute right-3 px-3 py-1 rounded-lg flex items-center gap-1.5 ${settings.phone_verified ? 'bg-[#D1FADF]' : 'bg-[#FEF0C7]'}`}>
                <Check size={14} className={settings.phone_verified ? 'text-[#039855]' : 'text-[#B54708]'} />
                <span className={`text-[12px] font-medium ${settings.phone_verified ? 'text-[#039855]' : 'text-[#B54708]'}`}>
                  {settings.phone_verified ? 'Verified' : 'Not verified'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsChangePhoneModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-[#E4E7EC] shadow-sm rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 whitespace-nowrap cursor-pointer transition-colors"
            >
              <Pencil size={16} />
              Change number
            </button>
          </div>
        </div>
      </div>

      <ChangeEmailModal
        isOpen={isChangeEmailModalOpen}
        currentEmail={email}
        accessToken={accessToken}
        requireTwoFactor={requiresTwoFactorVerification}
        onClose={() => setIsChangeEmailModalOpen(false)}
      />

      <ChangePhoneModal
        isOpen={isChangePhoneModalOpen}
        currentPhone={phoneNumber}
        accessToken={accessToken}
        requireTwoFactor={requiresTwoFactorVerification}
        twoFactorEmail={email}
        onClose={() => setIsChangePhoneModalOpen(false)}
        onPhoneChanged={handlePhoneChanged}
      />
    </div>
  );
}
