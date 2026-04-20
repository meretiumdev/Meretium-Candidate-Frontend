import React from 'react';
import { Sparkles } from 'lucide-react';
import type { CandidateSettingsAiPreferences } from '../../../services/settingsApi';

interface ToggleProps {
  label: string;
  subtextText: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Toggle = ({ label, subtextText, checked, onChange }: ToggleProps) => {
  return (
    <div className="flex items-center justify-between py-6 border-b border-gray-200 last:border-0 last:pb-0 font-manrope">
      <div className="max-w-[70%]">
        <h4 className="text-[14px] font-medium text-[#101828] mb-0.5">{label}</h4>
        <p className="text-[12px] text-[#667085] leading-relaxed">{subtextText}</p>
      </div>
      <button 
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative duration-200 shrink-0 cursor-pointer ${checked ? 'bg-[#FF6934]' : 'bg-[#EAECF0]'}`}
      >
        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
};

interface AiPreferencesContentProps {
  settings: CandidateSettingsAiPreferences;
}

export default function AiPreferencesContent({ settings }: AiPreferencesContentProps) {
  const [improveProfile, setImproveProfile] = React.useState(settings.use_ai_to_improve_profile);
  const [autoCoverLetter, setAutoCoverLetter] = React.useState(settings.auto_generate_cover_letters);
  const [showMatch, setShowMatch] = React.useState(settings.show_ai_match_to_recruiters);
  const [cvAnalysis, setCvAnalysis] = React.useState(settings.allow_ai_cv_analysis);

  React.useEffect(() => {
    setImproveProfile(settings.use_ai_to_improve_profile);
    setAutoCoverLetter(settings.auto_generate_cover_letters);
    setShowMatch(settings.show_ai_match_to_recruiters);
    setCvAnalysis(settings.allow_ai_cv_analysis);
  }, [
    settings.allow_ai_cv_analysis,
    settings.auto_generate_cover_letters,
    settings.show_ai_match_to_recruiters,
    settings.use_ai_to_improve_profile,
  ]);

  return (
    <div className="flex-1 font-manrope animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            checked={improveProfile}
            onChange={setImproveProfile}
          />
          <Toggle 
            label="Auto-generate cover letters"
            subtextText="AI creates personalized cover letters for applications"
            checked={autoCoverLetter}
            onChange={setAutoCoverLetter}
          />
          <Toggle 
            label="Show AI match to recruiters"
            subtextText="Display your AI match score on your profile"
            checked={showMatch}
            onChange={setShowMatch}
          />
          <Toggle 
            label="Allow AI CV analysis"
            subtextText="Let AI analyze your CV to provide better job matches"
            checked={cvAnalysis}
            onChange={setCvAnalysis}
          />
        </div>
      </div>
    </div>
  );
}
