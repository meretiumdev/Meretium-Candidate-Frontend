import { useState } from 'react';
import { ChevronDown, CheckCircle2, Circle } from 'lucide-react';

interface StrengthCardProps {
  profileStrength: number;
  hasCvUploaded: boolean;
  hasSkills: boolean;
  hasExperience: boolean;
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

export default function StrengthCard({
  profileStrength,
  hasCvUploaded,
  hasSkills,
  hasExperience,
}: StrengthCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const strength = clampPercentage(profileStrength);
  const strengthDetailsId = 'profile-strength-details';

  const steps = [
    { title: 'Upload CV', completed: hasCvUploaded },
    { title: 'Add Skills', completed: hasSkills },
    { title: 'Add Experience', completed: hasExperience },
  ];
  const completedCount = steps.filter((step) => step.completed).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm font-manrope transition-all duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] md:text-[20px] font-semibold text-[#101828] flex items-center gap-3">
          Profile strength <span className="text-[#FF6934] text-[20px] font-semibold">{strength}%</span>
        </h2>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls={strengthDetailsId}
          aria-label={isExpanded ? 'Collapse profile strength details' : 'Expand profile strength details'}
          className="text-[#475467] hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ChevronDown size={20} className={`transition-transform duration-200 ${isExpanded ? '' : 'rotate-180'}`} />
        </button>
      </div>

      <div
        id={strengthDetailsId}
        className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[300px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
      >
        <div className="relative h-2 w-full bg-[#f2f4f7] rounded-full overflow-hidden mb-5">
          <div
            className="absolute left-0 top-0 h-full bg-[#FF6934] rounded-full transition-all duration-500"
            style={{ width: `${strength}%` }}
          />
        </div>

        <div className="text-[14px] text-[#475467] font-medium mb-4">
          {completedCount} of {steps.length} completed
        </div>

        <div className="flex flex-col gap-4">
          {steps.map((step) => (
            <div key={step.title} className="flex items-center gap-3">
              {step.completed ? (
                <CheckCircle2 size={20} className="text-[#039855] shrink-0" />
              ) : (
                <Circle size={20} className="text-[#D0D5DD] shrink-0" />
              )}
              <span className={`text-[14px] ${step.completed ? 'text-[#475467] line-through decoration-gray-300' : 'text-[#101828]'} font-medium`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
