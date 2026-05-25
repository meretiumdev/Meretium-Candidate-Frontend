import React from 'react';
import { useSelector } from 'react-redux';
import { ExternalLink, Check } from 'lucide-react';
import type { RootState } from '../../../redux/store';
import type { CandidateSettingsIntegrations } from '../../../services/settingsApi';
import AddPortfolioModal from './AddPortfolioModal';

const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.87 14.13c-.22-.67-.35-1.39-.35-2.13s.13-1.46.35-2.13V7.03H2.18c-.77 1.54-1.21 3.27-1.21 5.1s.44 3.56 1.21 5.1l3.66-2.07z" fill="#FBBC05"/>
    <path d="M12 3.96c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 5.96l3.66 2.84c.86-2.59 3.28-4.51 12-4.51z" fill="#EA4335"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 0H4C1.8 0 0 1.8 0 4v16c0 2.2 1.8 4 4 4h16c2.2 0 4-1.8 4-4V4c0-2.2-1.8-4-4-4zM8 19H5V9h3v10zm-1.5-11.3c-1 0-1.7-.8-1.7-1.7s.8-1.7 1.7-1.7c1 0 1.7.8 1.7 1.7s-.7 1.7-1.7 1.7zM19 19h-3v-5.2c0-1.2 0-2.8-1.7-2.8-1.7 0-2 1.3-2 2.7V19h-3V9h2.9v1.4c.4-.7 1.4-1.4 2.7-1.4 2.9 0 3.4 1.9 3.4 4.4V19z" fill="white"/>
  </svg>
);

interface IntegrationsContentProps {
  settings: CandidateSettingsIntegrations;
  accountEmail?: string;
  onSettingsRefresh?: () => Promise<void> | void;
}

export default function IntegrationsContent({ settings, accountEmail = '', onSettingsRefresh }: IntegrationsContentProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null);
  const portfolioLink = settings.portfolio_link?.trim() || '';
  const isGoogleConnected = settings.google.connected;
  const resolvedAccountEmail = accountEmail.trim();

  React.useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  return (
    <>
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[160] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
            toast.type === 'success'
              ? 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
              : 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex-1 font-manrope animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div className="mb-8 px-1">
          <h1 className="text-xl md:text-[32px] font-semibold text-[#101828] mb-1">Integrations</h1>
          <p className="text-[#475467] text-[14px]">Connect third-party services to enhance your profile</p>
        </div>

        <div className="space-y-6">
          {/* Google Integration */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[10px] border border-gray-200 flex items-center justify-center p-2 shadow-sm">
                <GoogleIcon />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#101828]">Google</h3>
                <p className="text-[14px] text-[#667085]">
                  {isGoogleConnected
                    ? `Connected as ${resolvedAccountEmail || 'your account'}`
                    : 'Google is not connected'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${
                  isGoogleConnected
                    ? 'bg-[#D1FADF] border-[#ABEFC6]'
                    : 'bg-[#F2F4F7] border-[#EAECF0]'
                }`}
              >
                {isGoogleConnected && <Check size={14} className="text-[#027A48]" />}
                <span className={`text-[12px] font-medium ${isGoogleConnected ? 'text-[#027A48]' : 'text-[#667085]'}`}>
                  {isGoogleConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* LinkedIn Integration */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[10px] bg-[#0077B5] flex items-center justify-center p-2 overflow-hidden shadow-sm">
                <LinkedinIcon />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#101828]">LinkedIn</h3>
                <p className="text-[14px] text-[#667085]">Import your profile from LinkedIn</p>
              </div>
            </div>
            <button className="px-4 py-2.5 bg-white border border-gray-200 shadow-sm rounded-[10px] text-[14px] font-medium text-[#344054] cursor-not-allowed opacity-70">
              Connect
            </button>
          </div>

          {/* Portfolio Integration */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[10px] bg-[#FFF1EC] flex items-center justify-center border border-[#FF693410]">
                <ExternalLink className="text-[#FF6934]" size={24} />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#101828]">Portfolio</h3>
                <p className="text-[14px] text-[#667085]">
                  {portfolioLink || 'Link your portfolio or personal website'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPortfolioModalOpen(true)}
              className="px-6 py-2.5 border border-gray-200 shadow-sm rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {portfolioLink ? 'Edit link' : 'Add link'}
            </button>
          </div>
        </div>
      </div>

      <AddPortfolioModal
        isOpen={isPortfolioModalOpen}
        accessToken={accessToken}
        initialPortfolioUrl={portfolioLink}
        onClose={() => setIsPortfolioModalOpen(false)}
        onSuccess={async (message) => {
          setToast({ id: Date.now(), message, type: 'success' });
          if (onSettingsRefresh) {
            await onSettingsRefresh();
          }
        }}
        onError={(message) => {
          setToast({ id: Date.now(), message, type: 'error' });
        }}
      />
    </>
  );
}
