import { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Plus, ArrowRight, TrendingUp } from 'lucide-react';

interface MatchImprovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
  currentMatch: number | null;
}

const missingSkills = [
  { name: 'React Testing Library', impact: '+5%' },
  { name: 'System Design', impact: '+4%' },
  { name: 'Performance Optimization', impact: '+3%' },
];

export default function MatchImprovementModal({ isOpen, onClose, role, currentMatch }: MatchImprovementModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Every time modal opens, reset to loading state for 2s
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const t = setTimeout(() => setIsLoading(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const safeMatch = typeof currentMatch === 'number' ? currentMatch : null;
  const potential = safeMatch === null ? null : Math.min(safeMatch + 14, 99);
  const progressWidth = safeMatch === null ? 0 : (safeMatch / 100) * 100;
  const potentialGap = safeMatch === null || potential === null ? 0 : potential - safeMatch;

  return (
    <>
      {/* Backdrop — closes modal */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel — anchored to right side, not centered */}
      <div className="fixed top-0 right-0 z-50 h-full flex items-start justify-end pointer-events-none pt-19 -mr-2.5 sm:-mr-0">
        <div
          className="pointer-events-auto w-[410px] md:w-[420px] bg-white  shadow-2xl border border-gray-100 overflow-hidden max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-9 bg-[#FFF4EC] rounded-full flex items-center justify-center text-[#FF6934] shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold text-[#101828]">Match Improvement</h3>
                <p className="text-[12px] text-[#98A2B3]">for {role}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-[#667085] hover:text-gray-900 transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {/* Score card — always visible */}
          <div className="px-5 pb-4 shrink-0">
            <div className="bg-[#FFF8F5] border border-[#FFE0CC] rounded-[12px] p-4">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-[12px] text-[#98A2B3] mb-0.5">Current match</p>
                  <p className="text-[28px] font-bold text-[#101828]">{safeMatch === null ? '' : `${safeMatch}%`}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-[#98A2B3] mb-0.5">Potential</p>
                  <p className="text-[28px] font-bold text-[#FF6934]">{potential === null ? '' : `${potential}%`}</p>
                </div>
              </div>
              {/* Progress bar split: current vs potential */}
              <div className="h-[6px] w-full bg-[#E4E7EC] rounded-full overflow-hidden flex">
                <div className="h-full bg-[#EA580C] rounded-l-full transition-all duration-700" style={{ width: `${progressWidth}%` }} />
                <div className="h-full bg-[#FFDCCB] transition-all duration-700" style={{ width: `${potentialGap}%` }} />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 shrink-0" />

          {/* Loading state */}
          {isLoading ? (
            <div className="flex-1 flex flex-col items-stretch p-5 gap-8">
              {/* Skeleton row */}
              <div className="w-full flex items-center gap-3 opacity-30">
                <div className="size-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded-full animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 rounded-full animate-pulse w-1/2" />
                </div>
              </div>
              {/* AI spinner icon — centered specifically */}
              <div className="flex flex-col items-center gap-3 mt-10">
                <Sparkles size={36} className="text-[#FF6934] animate-pulse" />
                <p className="text-[14px] font-medium text-[#475467]">Running AI gap analysis...</p>
              </div>
            </div>
          ) : (
            /* Full results */
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-5">
                {/* Gap Breakdown */}
                <div className="bg-[#FFF8F5] border border-[#FFE0CC] rounded-[12px] p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-[#FF6934] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[14px] font-semibold text-[#101828] mb-1">Gap Breakdown</p>
                    <p className="text-[13px] text-[#475467]">
                      You&apos;re <span className="font-semibold text-[#101828]">{safeMatch === null || potential === null ? '' : `${potentialGap}%`}</span> away from your potential. Here&apos;s what&apos;s missing:
                    </p>
                  </div>
                </div>

                {/* Missing Skills */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[15px] font-semibold text-[#101828]">Missing Skills</p>
                    <span className="text-[12px] font-medium text-[#FF6934]">High impact</span>
                  </div>
                  <div className="space-y-3">
                    {missingSkills.map((skill) => (
                      <div key={skill.name} className="border border-gray-100 rounded-[10px] p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[14px] font-medium text-[#101828]">{skill.name}</span>
                          <span className="text-[13px] font-semibold text-[#039855]">{skill.impact}</span>
                        </div>
                        <button className="flex items-center gap-1.5 text-[13px] font-medium text-[#475467] hover:text-gray-900 transition-colors cursor-pointer">
                          <Plus size={14} /> Add this skill <ArrowRight size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improve Experience */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[16px] font-semibold text-[#101828]">Improve Experience</p>
                    <span className="text-[12px] font-medium text-[#667085]">Needs enhancement</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { role: "Senior Product Designer at Stripe", issue: "Lacks measurable impact", bonus: "+6%" },
                      { role: "Product Designer at Airbnb", issue: "Missing technical skills", bonus: "+4%" }
                    ].map((item, i) => (
                      <div key={i} className="border border-gray-100 rounded-[10px] p-4">
                        <p className="text-[14px] font-medium text-[#101828] mb-1">{item.role}</p>
                        <p className="text-[12px] text-[#F04438] mb-1">{item.issue}</p>
                        <p className="text-[13px] font-semibold text-[#039855] mb-3">{item.bonus}</p>
                        <button className="flex items-center gap-1.5 text-[13px] font-medium text-[#475467] hover:text-gray-900 transition-colors cursor-pointer">
                          <Sparkles size={14} /> Improve with AI <ArrowRight size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Aditions */}
                <div className="pb-4">
                  <p className="text-[16px] font-semibold text-[#101828] mb-3">Suggested additions</p>
                  <div className="border border-gray-100 rounded-[10px] p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[14px] font-medium text-[#101828]">Add a portfolio project</p>
                      <span className="text-[13px] font-semibold text-[#039855]">+3%</span>
                    </div>
                    <p className="text-[12px] text-[#667085] mb-3">Showcase your best work</p>
                    <button className="flex items-center gap-1.5 text-[13px] font-medium text-[#475467] hover:text-gray-900 transition-colors cursor-pointer">
                      <Plus size={14} /> Add project <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Live Match Preview */}
                <div className="bg-[#FFF8F5] border border-[#FFE0CC] rounded-[12px] p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[#FF6934]">
                    <TrendingUp size={16} />
                    <span className="text-[14px] font-semibold">Live Match Preview</span>
                  </div>
                  <p className="text-[13px] text-[#475467] leading-relaxed">
                    Apply fixes to see your match score improve in real-time
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
