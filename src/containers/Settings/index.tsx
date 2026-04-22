import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import Sidebar from './components/Sidebar';
import AccountContent from './components/AccountContent';
import ProfileVisibilityContent from './components/ProfileVisibilityContent';
import CvDataContent from './components/CvDataContent';
import NotificationsContent from './components/NotificationsContent';
import AiPreferencesContent from './components/AiPreferencesContent';
import SecurityContent from './components/SecurityContent';
import IntegrationsContent from './components/IntegrationsContent';
import HelpSupportContent from './components/HelpSupportContent';
import DangerZoneContent from './components/DangerZoneContent';
import { getCandidateSettings, type CandidateSettingsResponse } from '../../services/settingsApi';

const SETTINGS_ACTIVE_TAB_STORAGE_KEY = 'settings-active-tab';
const SETTINGS_TABS = [
  'Account',
  'Profile & Visibility',
  'CV & Data',
  'Notifications',
  'AI Preferences',
  'Security',
  'Integrations',
  'Help & Support',
  'Danger Zone',
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to load settings. Please try again.';
}

export default function Settings() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [activeTab, setActiveTab] = React.useState(() => {
    if (typeof window === 'undefined') return 'Account';

    const savedTab = window.sessionStorage.getItem(SETTINGS_ACTIVE_TAB_STORAGE_KEY);
    if (savedTab && SETTINGS_TABS.includes(savedTab)) {
      return savedTab;
    }

    return 'Account';
  });
  const [settingsData, setSettingsData] = React.useState<CandidateSettingsResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadSettings = React.useCallback(async (
    options: { showLoading?: boolean; forceRefresh?: boolean } = {}
  ) => {
    const showLoading = options.showLoading !== false;
    const forceRefresh = options.forceRefresh === true;

    if (!accessToken?.trim()) {
      setErrorMessage('You are not authenticated. Please log in again.');
      setIsLoading(false);
      return;
    }

    if (showLoading) {
      setIsLoading(true);
      setErrorMessage(null);
    }

    try {
      const response = await getCandidateSettings(accessToken, { forceRefresh });
      setSettingsData(response);
      if (showLoading) {
        setErrorMessage(null);
      }
    } catch (error: unknown) {
      if (showLoading) {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [accessToken]);

  React.useEffect(() => {
    void loadSettings({ showLoading: true });
  }, [loadSettings]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(SETTINGS_ACTIVE_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  if (isLoading && !settingsData) {
    return (
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="max-w-full mx-auto px-2 sm:px-12 py-6">
          <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-6 items-start sm:mt-3 animate-pulse">
            <div className="h-[420px] rounded-xl border border-gray-200 bg-white" />
            <div className="h-[520px] rounded-xl border border-gray-200 bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading && (errorMessage || !settingsData)) {
    return (
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="max-w-full mx-auto px-2 sm:px-12 py-6">
          <div className="bg-white border border-[#FDA29B] rounded-xl p-6">
            <p className="text-[#B42318] text-[14px] font-medium mb-4">{errorMessage || 'Failed to load settings.'}</p>
            <button
              onClick={() => {
                void loadSettings({ showLoading: true, forceRefresh: true });
              }}
              className="bg-[#FF6934] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!settingsData) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'Account':
        return (
          <AccountContent
            settings={settingsData.account}
            onPhoneChanged={async () => {
              await loadSettings({ showLoading: false, forceRefresh: true });
            }}
          />
        );
      case 'Profile & Visibility':
        return (
          <ProfileVisibilityContent
            settings={settingsData.profile_and_visibility}
            onSettingsPatched={(patch) => {
              setSettingsData((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  profile_and_visibility: {
                    ...prev.profile_and_visibility,
                    ...patch,
                  },
                };
              });
            }}
          />
        );
      case 'CV & Data':
        return (
          <CvDataContent
            settings={settingsData.cv_and_data_management}
            onSettingsRefresh={async () => {
              await loadSettings({ showLoading: false, forceRefresh: true });
            }}
          />
        );
      case 'Notifications':
        return (
          <NotificationsContent
            settings={settingsData.notification_settings}
            onSettingsPatched={(patch) => {
              setSettingsData((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  notification_settings: {
                    ...prev.notification_settings,
                    ...patch,
                  },
                };
              });
            }}
          />
        );
      case 'AI Preferences':
        return (
          <AiPreferencesContent
            settings={settingsData.ai_preferences}
            onSettingsPatched={(patch) => {
              setSettingsData((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  ai_preferences: {
                    ...prev.ai_preferences,
                    ...patch,
                  },
                };
              });
            }}
          />
        );
      case 'Security':
        return (
          <SecurityContent
            accountEmail={settingsData.account.email}
            activeSessions={settingsData.active_sessions}
            onSessionsRefresh={async () => {
              await loadSettings({ showLoading: false, forceRefresh: true });
            }}
          />
        );
      case 'Integrations':
        return <IntegrationsContent />;
      case 'Help & Support':
        return <HelpSupportContent />;
      case 'Danger Zone':
        return <DangerZoneContent />;
      default:
        return <div className="flex-1 w-full bg-white rounded-3xl p-10 border border-[#EAECF0] text-center text-gray-500 font-manrope">Coming Soon</div>;
    }
  };

  return (
    <div className="bg-[#F9FAFB] min-h-screen">
      <div className="max-w-full mx-auto px-2 sm:px-12 py-6">
        <div className="flex flex-col md:flex-row gap-6 items-start sm:mt-3">
          {/* Left Sidebar */}
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Main Content Area */}
          <div className="flex-1 w-full space-y-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
