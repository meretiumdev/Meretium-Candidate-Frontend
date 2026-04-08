import React from 'react';
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

export default function Settings() {
  const [activeTab, setActiveTab] = React.useState('Account');

  const renderContent = () => {
    switch (activeTab) {
      case 'Account':
        return <AccountContent />;
      case 'Profile & Visibility':
        return <ProfileVisibilityContent />;
      case 'CV & Data':
        return <CvDataContent />;
      case 'Notifications':
        return <NotificationsContent />;
      case 'AI Preferences':
        return <AiPreferencesContent />;
      case 'Security':
        return <SecurityContent />;
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
