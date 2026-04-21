import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import type { CandidateSettingsNotificationSettings } from '../../../services/settingsApi';
import { updateCandidateNotificationSettings } from '../../../services/settingsApi';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const SmallToggle = ({ checked, onChange, disabled = false }: ToggleProps) => {
  return (
    <button 
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full transition-colors relative duration-200 shrink-0 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${checked ? 'bg-[#FF6934]' : 'bg-[#EAECF0]'}`}
    >
      <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
};

interface NotificationRowProps {
  label: string;
  subtext: string;
  inApp: boolean;
  email: boolean;
  onInAppChange: (val: boolean) => void;
  onEmailChange: (val: boolean) => void;
  inAppDisabled?: boolean;
  emailDisabled?: boolean;
}

const NotificationRow = ({
  label,
  subtext,
  inApp,
  email,
  onInAppChange,
  onEmailChange,
  inAppDisabled = false,
  emailDisabled = false,
}: NotificationRowProps) => {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0 font-manrope">
      <div className="max-w-[60%]">
        <h4 className="text-[14px] font-medium text-[#101828] mb-0.5">{label}</h4>
        <p className="text-[12px] text-[#667085] leading-normal">{subtext}</p>
      </div>
      <div className="flex items-center gap-12 sm:gap-24">
        <div className="w-10 flex justify-center">
          <SmallToggle checked={inApp} onChange={onInAppChange} disabled={inAppDisabled} />
        </div>
        <div className="w-10 flex justify-center">
          <SmallToggle checked={email} onChange={onEmailChange} disabled={emailDisabled} />
        </div>
      </div>
    </div>
  );
};

interface NotificationsContentProps {
  settings: CandidateSettingsNotificationSettings;
  onSettingsPatched?: (patch: Partial<CandidateSettingsNotificationSettings>) => void;
}

interface NotificationUiState {
  appUpdatesInApp: boolean;
  appUpdatesEmail: boolean;
  interviewInApp: boolean;
  interviewEmail: boolean;
  offerInApp: boolean;
  offerEmail: boolean;
  messagesInApp: boolean;
  messagesEmail: boolean;
  profileViewedInApp: boolean;
  profileViewedEmail: boolean;
  recommendationsInApp: boolean;
  recommendationsEmail: boolean;
  productUpdatesInApp: boolean;
  productUpdatesEmail: boolean;
}

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const UI_KEY_TO_API_FIELD: Record<keyof NotificationUiState, keyof CandidateSettingsNotificationSettings> = {
  appUpdatesInApp: 'application_updates_inapp',
  appUpdatesEmail: 'application_updates_email',
  interviewInApp: 'interview_invites_inapp',
  interviewEmail: 'interview_invites_email',
  offerInApp: 'offer_updates_inapp',
  offerEmail: 'offer_updates_email',
  messagesInApp: 'new_messages_inapp',
  messagesEmail: 'new_messages_email',
  profileViewedInApp: 'profile_viewed_inapp',
  profileViewedEmail: 'profile_viewed_email',
  recommendationsInApp: 'job_recommendations_inapp',
  recommendationsEmail: 'job_recommendations_email',
  productUpdatesInApp: 'product_updates_inapp',
  productUpdatesEmail: 'product_updates_email',
};

function mapSettingsToUiState(settings: CandidateSettingsNotificationSettings): NotificationUiState {
  return {
    appUpdatesInApp: settings.application_updates_inapp,
    appUpdatesEmail: settings.application_updates_email,
    interviewInApp: settings.interview_invites_inapp,
    interviewEmail: settings.interview_invites_email,
    offerInApp: settings.offer_updates_inapp,
    offerEmail: settings.offer_updates_email,
    messagesInApp: settings.new_messages_inapp,
    messagesEmail: settings.new_messages_email,
    profileViewedInApp: settings.profile_viewed_inapp,
    profileViewedEmail: settings.profile_viewed_email,
    recommendationsInApp: settings.job_recommendations_inapp,
    recommendationsEmail: settings.job_recommendations_email,
    productUpdatesInApp: settings.product_updates_inapp,
    productUpdatesEmail: settings.product_updates_email,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to update notification settings. Please try again.';
}

export default function NotificationsContent({ settings, onSettingsPatched }: NotificationsContentProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [notificationSettings, setNotificationSettings] = React.useState<NotificationUiState>(() => mapSettingsToUiState(settings));
  const [pendingToggles, setPendingToggles] = React.useState<Partial<Record<keyof NotificationUiState, boolean>>>({});
  const [toast, setToast] = React.useState<ToastState | null>(null);

  React.useEffect(() => {
    setNotificationSettings(mapSettingsToUiState(settings));
  }, [settings]);

  React.useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const toggleSetting = async (key: keyof NotificationUiState) => {
    if (pendingToggles[key]) return;

    if (!accessToken?.trim()) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.', type: 'error' });
      return;
    }

    const previousValue = notificationSettings[key];
    const nextValue = !previousValue;
    const apiField = UI_KEY_TO_API_FIELD[key];

    setNotificationSettings((prev) => ({ ...prev, [key]: nextValue }));
    setPendingToggles((prev) => ({ ...prev, [key]: true }));

    try {
      const patch = { [apiField]: nextValue } as Partial<CandidateSettingsNotificationSettings>;
      const successMessage = await updateCandidateNotificationSettings(accessToken, patch);
      if (onSettingsPatched) onSettingsPatched(patch);
      if (successMessage) {
        setToast({ id: Date.now(), message: successMessage, type: 'success' });
      }
    } catch (error: unknown) {
      setNotificationSettings((prev) => ({ ...prev, [key]: previousValue }));
      setToast({ id: Date.now(), message: getErrorMessage(error), type: 'error' });
    } finally {
      setPendingToggles((prev) => ({ ...prev, [key]: false }));
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
        <h1 className="text-xl md:text-[32px] font-semibold text-[#101828] mb-1">Notification Settings</h1>
        <p className="text-[#475467] text-[14px]">Manage how you receive notifications</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 shadow-sm transition-all duration-300 overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="flex justify-end gap-12 sm:gap-24 mb-6 px-4">
            <span className="w-10 text-center text-[12px] font-medium text-[#475467]">In-app</span>
            <span className="w-10 text-center text-[12px] font-medium text-[#475467]">Email</span>
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="text-[14px] font-semibold text-[#101828] mb-4">Job Activity</h3>
              <NotificationRow 
                label="Application updates"
                subtext="Status changes on your applications"
                inApp={notificationSettings.appUpdatesInApp}
                email={notificationSettings.appUpdatesEmail}
                onInAppChange={() => toggleSetting('appUpdatesInApp')}
                onEmailChange={() => toggleSetting('appUpdatesEmail')}
                inAppDisabled={pendingToggles.appUpdatesInApp === true}
                emailDisabled={pendingToggles.appUpdatesEmail === true}
              />
              <NotificationRow 
                label="Interview invites"
                subtext="New interview requests from recruiters"
                inApp={notificationSettings.interviewInApp}
                email={notificationSettings.interviewEmail}
                onInAppChange={() => toggleSetting('interviewInApp')}
                onEmailChange={() => toggleSetting('interviewEmail')}
                inAppDisabled={pendingToggles.interviewInApp === true}
                emailDisabled={pendingToggles.interviewEmail === true}
              />
              <NotificationRow 
                label="Offer updates"
                subtext="Job offers and updates"
                inApp={notificationSettings.offerInApp}
                email={notificationSettings.offerEmail}
                onInAppChange={() => toggleSetting('offerInApp')}
                onEmailChange={() => toggleSetting('offerEmail')}
                inAppDisabled={pendingToggles.offerInApp === true}
                emailDisabled={pendingToggles.offerEmail === true}
              />
            </section>

            <section>
              <h3 className="text-[14px] font-semibold text-[#101828] mb-4 border-t border-gray-200 pt-8">Recruiter Activity</h3>
              <NotificationRow 
                label="New messages"
                subtext="Messages from recruiters"
                inApp={notificationSettings.messagesInApp}
                email={notificationSettings.messagesEmail}
                onInAppChange={() => toggleSetting('messagesInApp')}
                onEmailChange={() => toggleSetting('messagesEmail')}
                inAppDisabled={pendingToggles.messagesInApp === true}
                emailDisabled={pendingToggles.messagesEmail === true}
              />
              <NotificationRow 
                label="Profile viewed"
                subtext="When recruiters view your profile"
                inApp={notificationSettings.profileViewedInApp}
                email={notificationSettings.profileViewedEmail}
                onInAppChange={() => toggleSetting('profileViewedInApp')}
                onEmailChange={() => toggleSetting('profileViewedEmail')}
                inAppDisabled={pendingToggles.profileViewedInApp === true}
                emailDisabled={pendingToggles.profileViewedEmail === true}
              />
            </section>

            <section>
              <h3 className="text-[14px] font-semibold text-[#101828] mb-4 border-t border-gray-200 pt-8">Platform</h3>
              <NotificationRow 
                label="Job recommendations"
                subtext="AI-powered job suggestions"
                inApp={notificationSettings.recommendationsInApp}
                email={notificationSettings.recommendationsEmail}
                onInAppChange={() => toggleSetting('recommendationsInApp')}
                onEmailChange={() => toggleSetting('recommendationsEmail')}
                inAppDisabled={pendingToggles.recommendationsInApp === true}
                emailDisabled={pendingToggles.recommendationsEmail === true}
              />
              <NotificationRow 
                label="Product updates"
                subtext="New features and improvements"
                inApp={notificationSettings.productUpdatesInApp}
                email={notificationSettings.productUpdatesEmail}
                onInAppChange={() => toggleSetting('productUpdatesInApp')}
                onEmailChange={() => toggleSetting('productUpdatesEmail')}
                inAppDisabled={pendingToggles.productUpdatesInApp === true}
                emailDisabled={pendingToggles.productUpdatesEmail === true}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
