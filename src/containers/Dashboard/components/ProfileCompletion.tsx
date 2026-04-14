import { useEffect, useState } from 'react';
import { Sparkles, ChevronDown, CheckCircle2, Circle, Check } from 'lucide-react';

interface ProfileCompletionProps {
  profileStrength?: number;
  isCvUploaded?: boolean;
  isSkillsAdded?: boolean;
  isExperienceAdded?: boolean;
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTopBand(strength: number): string {
  if (strength >= 80) return 'Top 25%';
  if (strength >= 60) return 'Top 40%';
  if (strength >= 40) return 'Top 60%';
  return 'Top 80%';
}

function StepItem({ done, label }: { done: boolean; label: string }) {
  if (done) {
    return (
      <div className="flex items-center gap-3 bg-[#D1FADF] p-4 rounded-[10px] shadow-sm">
        <CheckCircle2 className="text-[#12B76A] size-6" />
        <span className="text-sm font-semibold text-[#027A48]">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-[#F9FAFB] p-4 rounded-[10px] hover:bg-white hover:border-gray-200 transition-all cursor-pointer shadow-sm group">
      <Circle className="text-gray-300 group-hover:text-[#FF6934] transition-colors size-6" />
      <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>
    </div>
  );
}

export default function ProfileCompletion({
  profileStrength = 0,
  isCvUploaded = false,
  isSkillsAdded = false,
  isExperienceAdded = false,
}: ProfileCompletionProps) {
  const strength = clampPercentage(profileStrength);
  const isProfileComplete = strength === 100;
  const [isExpanded, setIsExpanded] = useState(!isProfileComplete);
  const isCollapsedCompleteState = isProfileComplete && !isExpanded;
  const topBand = getTopBand(strength);
  const completionDetailsId = 'dashboard-profile-completion-details';

  useEffect(() => {
    if (isProfileComplete) {
      setIsExpanded(false);
    }
  }, [isProfileComplete]);

  return (
    <div className={`rounded-xl p-4 md:p-6 shadow-sm font-manrope transition-all duration-300 ${
      isCollapsedCompleteState
        ? 'bg-[#B7E7C7] border border-[#6ED39A]'
        : 'bg-white border border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start md:items-center gap-4">
          {isProfileComplete ? (
            <>
              <div className="size-12 bg-[#E8F5ED] rounded-full flex items-center justify-center shadow-sm">
                <Check className="text-[#027A48] size-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#027A48]">Profile complete!</h2>
                <p className="text-sm text-[#027A48] mt-1">You&apos;re all set to discover AI-powered matches</p>
              </div>
            </>
          ) : (
            <>
              <div className="size-12 bg-orange-50 rounded-full flex items-center justify-center shadow-sm">
                <Sparkles className="text-[#FF6934] size-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#101828]">Profile completion</h2>
                <p className="text-sm text-[#475467] mt-1">Updated from dashboard stats</p>
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls={completionDetailsId}
          aria-label={isExpanded ? 'Collapse profile completion' : 'Expand profile completion'}
          className={`transition-colors cursor-pointer p-1 ${
            isProfileComplete ? 'text-[#027A48] hover:text-[#0A6E45]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ChevronDown size={20} className={`transition-transform duration-200 ${isExpanded ? '' : 'rotate-180'}`} />
        </button>
      </div>

      <div
        id={completionDetailsId}
        className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-2 gap-2 sm:gap-0">
            <div>
              <h3 className="font-semibold text-lg text-[#101828]">Your Profile Strength</h3>
              <p className="text-sm text-[#475467] mt-1">You are in the <span className="font-bold text-[#101828]">{topBand}</span> for roles</p>
            </div>
            <div className="text-3xl font-bold text-[#FF6934]">{strength}%</div>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-4 shadow-inner">
            <div className="h-full bg-[#FF6934] rounded-full shadow-sm" style={{ width: `${strength}%` }}></div>
          </div>
        </div>

        <div className="space-y-2">
          <StepItem done={isCvUploaded} label="Upload CV" />
          <StepItem done={isSkillsAdded} label="Add skills" />
          <StepItem done={isExperienceAdded} label="Add experience" />
        </div>
      </div>
    </div>
  );
}
