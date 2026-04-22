import React from 'react';
import { useSelector } from 'react-redux';
import { Sparkles } from 'lucide-react';
import type { RootState } from '../../../redux/store';
import type { CandidateSettingsAiPreferences } from '../../../services/settingsApi';
import { updateCandidateAiPreferences } from '../../../services/settingsApi';

interface ToggleProps {
  label: string;
  subtextText: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Toggle = ({ label, subtextText, checked, onChange, disabled = false }: ToggleProps) => {
  return (
    <div className="flex items-center justify-between py-6 border-b border-gray-200 last:border-0 last:pb-0 font-manrope">
      <div className="max-w-[70%]">
        <h4 className="text-[14px] font-medium text-[#101828] mb-0.5">{label}</h4>
        <p className="text-[12px] text-[#667085] leading-relaxed">{subtextText}</p>
      </div>
      <button 
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative duration-200 shrink-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-[#FF6934]' : 'bg-[#FDF7E9]'}`}
      >
        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-200 ${checked ? 'translate-x-5 bg-white' : 'translate-x-0 bg-[#FF6934]'}`} />
      </button>
    </div>
  );
};

interface AiPreferencesContentProps {
  settings: CandidateSettingsAiPreferences;
  onSettingsPatched?: (patch: Partial<CandidateSettingsAiPreferences>) => void;
}

interface AiPreferencesUiState {
  improveProfile: boolean;
  autoCoverLetter: boolean;
  showMatch: boolean;
  cvAnalysis: boolean;
}

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const UI_KEY_TO_API_FIELD: Record<keyof AiPreferencesUiState, keyof CandidateSettingsAiPreferences> = {
  improveProfile: 'use_ai_to_improve_profile',
  autoCoverLetter: 'auto_generate_cover_letters',
  showMatch: 'show_ai_match_to_recruiters',
  cvAnalysis: 'allow_ai_cv_analysis',
};

function mapSettingsToUiState(settings: CandidateSettingsAiPreferences): AiPreferencesUiState {
  return {
    improveProfile: settings.use_ai_to_improve_profile,
    autoCoverLetter: settings.auto_generate_cover_letters,
    showMatch: settings.show_ai_match_to_recruiters,
    cvAnalysis: settings.allow_ai_cv_analysis,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to update AI preferences. Please try again.';
}

export default function AiPreferencesContent({ settings, onSettingsPatched }: AiPreferencesContentProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [preferences, setPreferences] = React.useState<AiPreferencesUiState>(() => mapSettingsToUiState(settings));
  const [pendingToggles, setPendingToggles] = React.useState<Partial<Record<keyof AiPreferencesUiState, boolean>>>({});
  const [toast, setToast] = React.useState<ToastState | null>(null);

  React.useEffect(() => {
    setPreferences(mapSettingsToUiState(settings));
  }, [settings]);

  React.useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const toggleSetting = async (key: keyof AiPreferencesUiState) => {
    if (pendingToggles[key]) return;

    if (!accessToken?.trim()) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.', type: 'error' });
      return;
    }

    const previousValue = preferences[key];
    const nextValue = !previousValue;
    const apiField = UI_KEY_TO_API_FIELD[key];

    setPreferences((prev) => ({ ...prev, [key]: nextValue }));
    setPendingToggles((prev) => ({ ...prev, [key]: true }));

    try {
      const patch = { [apiField]: nextValue } as Partial<CandidateSettingsAiPreferences>;
      const successMessage = await updateCandidateAiPreferences(accessToken, patch);
      if (onSettingsPatched) onSettingsPatched(patch);
      if (successMessage) {
        setToast({ id: Date.now(), message: successMessage, type: 'success' });
      }
    } catch (error: unknown) {
      setPreferences((prev) => ({ ...prev, [key]: previousValue }));
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
        <h1 className="text-xl md:text-[32px] font-semibold text-[#101828] mb-1">AI Preferences</h1>
        <p className="text-[#475467] text-[14px]">Control how AI enhances your job search experience</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 space-y-6 shadow-sm transition-all duration-300">
        {/* AI Features Info Banner */}
        <div className="rounded-xl p-4 flex items-center gap-4 border border-orange-100 bg-[#FFF9F6] shadow-sm">
          <Sparkles className="text-[#FF6934] shrink-0" size={20} />
          <p className="text-[14px] text-[#475467] font-medium leading-relaxed">
            AI features help improve your profile quality and increase your match accuracy with relevant jobs.
          </p>
        </div>

        <div className="pt-2">
          <Toggle 
            label="Use AI to improve profile"
            subtextText="Get AI suggestions to enhance your profile content"
            checked={preferences.improveProfile}
            onChange={() => toggleSetting('improveProfile')}
            disabled={pendingToggles.improveProfile === true}
          />
          <Toggle 
            label="Auto-generate cover letters"
            subtextText="AI creates personalized cover letters for applications"
            checked={preferences.autoCoverLetter}
            onChange={() => toggleSetting('autoCoverLetter')}
            disabled={pendingToggles.autoCoverLetter === true}
          />
          <Toggle 
            label="Show AI match to recruiters"
            subtextText="Display your AI match score on your profile"
            checked={preferences.showMatch}
            onChange={() => toggleSetting('showMatch')}
            disabled={pendingToggles.showMatch === true}
          />
          <Toggle 
            label="Allow AI CV analysis"
            subtextText="Let AI analyze your CV to provide better job matches"
            checked={preferences.cvAnalysis}
            onChange={() => toggleSetting('cvAnalysis')}
            disabled={pendingToggles.cvAnalysis === true}
          />
        </div>
      </div>
    </div>
  );
}
