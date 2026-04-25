import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { X, Sparkles, AlertCircle, Plus, ArrowRight, TrendingUp, Loader2 } from 'lucide-react';
import ModalPortal from './ModalPortal';
import {
  autoImproveCandidateJob,
  getCandidateJobMatchImprovement,
  type CandidateJobMatchImprovement,
  type CandidateJobMatchImprovementExperience,
  type CandidateJobMatchImprovementSkill,
  type CandidateJobMatchImprovementSuggestion,
} from '../services/jobsApi';
import type { RootState } from '../redux/store';

interface MatchImprovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
  currentMatch: number | null;
  jobId?: string;
  onMatchUpdated?: (matchPercentage: number | null) => void;
}

const STATIC_MISSING_SKILLS: CandidateJobMatchImprovementSkill[] = [
  { id: 'static-skill-1', name: 'React Testing Library', impact: '+5%' },
  { id: 'static-skill-2', name: 'System Design', impact: '+4%' },
  { id: 'static-skill-3', name: 'Performance Optimization', impact: '+3%' },
];

const STATIC_EXPERIENCES: CandidateJobMatchImprovementExperience[] = [
  { id: 'static-exp-1', title: 'Senior Product Designer at Stripe', issue: 'Lacks measurable impact', impact: '+6%' },
  { id: 'static-exp-2', title: 'Product Designer at Airbnb', issue: 'Missing technical skills', impact: '+4%' },
];

const STATIC_ADDITIONS: CandidateJobMatchImprovementSuggestion[] = [
  {
    id: 'static-add-1',
    title: 'Add a portfolio project',
    description: 'Showcase your best work',
    impact: '+3%',
  },
];

export default function MatchImprovementModal({
  isOpen,
  onClose,
  role,
  currentMatch,
  jobId = '',
  onMatchUpdated,
}: MatchImprovementModalProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const normalizedJobId = jobId.trim();
  const isDynamicMode = normalizedJobId.length > 0;

  const [isLoading, setIsLoading] = useState(false);
  const [improvement, setImprovement] = useState<CandidateJobMatchImprovement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionState, setActionState] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const onMatchUpdatedRef = useRef(onMatchUpdated);

  useEffect(() => {
    onMatchUpdatedRef.current = onMatchUpdated;
  }, [onMatchUpdated]);

  const loadMatchImprovement = useCallback(async () => {
    if (!isDynamicMode) {
      setImprovement(null);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    if (!accessToken?.trim()) {
      setImprovement(null);
      setIsLoading(false);
      setErrorMessage('You are not authenticated. Please log in again.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getCandidateJobMatchImprovement(accessToken, normalizedJobId);
      setImprovement(response);
      if (typeof response.current_match === 'number') {
        onMatchUpdatedRef.current?.(response.current_match);
      }
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Unable to load match improvement data right now.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isDynamicMode, normalizedJobId]);

  useEffect(() => {
    if (!isOpen) return;

    setActionLoadingKey(null);
    setActionState(null);
    void loadMatchImprovement();
  }, [isOpen, loadMatchImprovement]);

  useEffect(() => {
    if (!actionState) return undefined;

    const timer = window.setTimeout(() => {
      setActionState(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [actionState]);

  const safeMatch = useMemo(() => {
    if (typeof improvement?.current_match === 'number') {
      return Math.max(0, Math.min(100, Math.round(improvement.current_match)));
    }
    if (typeof currentMatch === 'number') {
      return Math.max(0, Math.min(100, Math.round(currentMatch)));
    }
    return null;
  }, [currentMatch, improvement?.current_match]);

  const potential = useMemo(() => {
    if (typeof improvement?.potential_match === 'number') {
      return Math.max(0, Math.min(100, Math.round(improvement.potential_match)));
    }
    if (typeof safeMatch === 'number') {
      return Math.min(safeMatch + 14, 99);
    }
    return null;
  }, [improvement?.potential_match, safeMatch]);

  const progressWidth = safeMatch === null ? 0 : safeMatch;
  const potentialGap = safeMatch === null || potential === null ? 0 : Math.max(0, potential - safeMatch);

  const missingSkills = useMemo(() => {
    if (isDynamicMode) {
      return improvement?.missing_skills || [];
    }

    if (improvement?.missing_skills?.length) {
      return improvement.missing_skills;
    }

    return STATIC_MISSING_SKILLS;
  }, [improvement?.missing_skills, isDynamicMode]);

  const experienceSuggestions = useMemo(() => {
    if (improvement?.experience_suggestions && improvement.experience_suggestions.length > 0) {
      return improvement.experience_suggestions;
    }
    return STATIC_EXPERIENCES;
  }, [improvement?.experience_suggestions]);

  const suggestedAdditions = useMemo(() => {
    if (improvement?.suggested_additions && improvement.suggested_additions.length > 0) {
      return improvement.suggested_additions;
    }
    return STATIC_ADDITIONS;
  }, [improvement?.suggested_additions]);

  // Keep this data wired even if UI block is temporarily commented out.
  void suggestedAdditions;

  const handleAddSkill = async (skill: CandidateJobMatchImprovementSkill) => {
    if (!isDynamicMode) return;

    if (!accessToken?.trim()) {
      setActionState({ type: 'error', message: 'You are not authenticated. Please log in again.' });
      return;
    }

    const loadingKey = `skill-${skill.id || skill.name}`;
    setActionLoadingKey(loadingKey);

    try {
      const response = await autoImproveCandidateJob(accessToken, normalizedJobId, {
        skill_id: skill.id || undefined,
        skill_name: skill.name || undefined,
      });

      if (typeof response.updated_match_percentage === 'number') {
        onMatchUpdatedRef.current?.(response.updated_match_percentage);
      }

      setActionState({
        type: 'success',
        message: response.message || 'Skill improvement applied successfully.',
      });
      await loadMatchImprovement();
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Unable to improve this skill right now.';
      setActionState({ type: 'error', message });
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleImproveExperience = async (experience: CandidateJobMatchImprovementExperience) => {
    if (!isDynamicMode) return;

    if (!accessToken?.trim()) {
      setActionState({ type: 'error', message: 'You are not authenticated. Please log in again.' });
      return;
    }

    const experienceId = experience.id.trim();
    if (!experienceId) {
      setActionState({ type: 'error', message: 'Experience id is missing for this suggestion.' });
      return;
    }

    const loadingKey = `experience-${experienceId}`;
    setActionLoadingKey(loadingKey);

    try {
      const response = await autoImproveCandidateJob(accessToken, normalizedJobId, {
        experience_ids: [experienceId],
      });

      if (typeof response.updated_match_percentage === 'number') {
        onMatchUpdatedRef.current?.(response.updated_match_percentage);
      }

      setActionState({
        type: 'success',
        message: response.message || 'Experience improvement applied successfully.',
      });
      await loadMatchImprovement();
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Unable to improve this experience right now.';
      setActionState({ type: 'error', message });
    } finally {
      setActionLoadingKey(null);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
    <>
      <button
        type="button"
        aria-label="Close match improvement modal"
        className="fixed inset-0 z-[190] min-h-dvh bg-black/50"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 z-[200] flex min-h-dvh items-stretch justify-end pointer-events-none">
      <div
        className="pointer-events-auto h-dvh max-h-dvh w-[min(100vw,440px)] shrink-0 bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
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

          <div className="px-5 pb-4 shrink-0">
            <div className="bg-[#FFF8F5] border border-[#FFE0CC] rounded-[12px] p-4">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-[12px] text-[#98A2B3] mb-0.5">Current match</p>
                  <p className="text-[28px] font-bold text-[#101828]">{safeMatch === null ? '--' : `${safeMatch}%`}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-[#98A2B3] mb-0.5">Potential</p>
                  <p className="text-[28px] font-bold text-[#FF6934]">{potential === null ? '--' : `${potential}%`}</p>
                </div>
              </div>
              <div className="h-[6px] w-full bg-[#E4E7EC] rounded-full overflow-hidden flex">
                <div className="h-full bg-[#EA580C] rounded-l-full transition-all duration-700" style={{ width: `${progressWidth}%` }} />
                <div className="h-full bg-[#FFDCCB] transition-all duration-700" style={{ width: `${potentialGap}%` }} />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 shrink-0" />

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3">
              <Loader2 size={24} className="animate-spin text-[#FF6934]" />
              <p className="text-[14px] font-medium text-[#475467]">Running AI gap analysis...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-5">
                {actionState && (
                  <div className={`rounded-[10px] border px-4 py-3 text-[13px] font-medium ${
                    actionState.type === 'error'
                      ? 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
                      : 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
                  }`}>
                    {actionState.message}
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-[10px] border border-[#FDA29B] bg-[#FEF3F2] px-4 py-3 text-[13px] font-medium text-[#B42318]">
                    {errorMessage}
                  </div>
                )}

                <div className="bg-[#FFF8F5] border border-[#FFE0CC] rounded-[12px] p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-[#FF6934] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[14px] font-semibold text-[#101828] mb-1">Gap Breakdown</p>
                    <p className="text-[13px] text-[#475467]">
                      You&apos;re <span className="font-semibold text-[#101828]">{safeMatch === null || potential === null ? '--' : `${potentialGap}%`}</span> away from your potential.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[15px] font-semibold text-[#101828]">Missing Skills</p>
                    <span className="text-[12px] font-medium text-[#FF6934]">High impact</span>
                  </div>
                  {missingSkills.length === 0 ? (
                    <p className="text-[13px] text-[#667085]">No skill improvements suggested right now.</p>
                  ) : (
                    <div className="space-y-3">
                      {missingSkills.map((skill, index) => {
                        const key = `skill-${skill.id || skill.name || index}`;
                        const isActionLoading = actionLoadingKey === key;

                        return (
                          <div key={key} className="border border-gray-100 rounded-[10px] p-3.5">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[14px] font-medium text-[#101828]">{skill.name}</span>
                              <span className="text-[13px] font-semibold text-[#039855]">{skill.impact || '+0%'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => { void handleAddSkill(skill); }}
                              disabled={!isDynamicMode || isActionLoading}
                              className="flex items-center gap-1.5 text-[13px] font-medium text-[#475467] hover:text-gray-900 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                              Add this skill <ArrowRight size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[16px] font-semibold text-[#101828]">Improve Experience</p>
                    <span className="text-[12px] font-medium text-[#667085]">Needs enhancement</span>
                  </div>
                  {experienceSuggestions.length === 0 ? (
                    <p className="text-[13px] text-[#667085]">No experience improvements suggested right now.</p>
                  ) : (
                    <div className="space-y-3">
                      {experienceSuggestions.map((item, index) => {
                        const key = `experience-${item.id || index}`;
                        const isActionLoading = actionLoadingKey === key;

                        return (
                          <div key={key} className="border border-gray-100 rounded-[10px] p-4">
                            <p className="text-[14px] font-medium text-[#101828] mb-1">{item.title}</p>
                            <p className="text-[12px] text-[#F04438] mb-1">{item.issue || 'Needs improvement'}</p>
                            <p className="text-[13px] font-semibold text-[#039855] mb-3">{item.impact || '+0%'}</p>
                            <button
                              type="button"
                              onClick={() => { void handleImproveExperience(item); }}
                              disabled={!isDynamicMode || isActionLoading || !item.id}
                              className="flex items-center gap-1.5 text-[13px] font-medium text-[#475467] hover:text-gray-900 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                              Improve with AI <ArrowRight size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pb-4">
                  <p className="text-[16px] font-semibold text-[#101828] mb-3">Suggested additions</p>
                  <div className="space-y-3">
                    {suggestedAdditions.map((addition, index) => (
                      <div key={`${addition.id || addition.title}-${index}`} className="border border-gray-100 rounded-[10px] p-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[14px] font-medium text-[#101828]">{addition.title}</p>
                          <span className="text-[13px] font-semibold text-[#039855]">{addition.impact || '+0%'}</span>
                        </div>
                        {addition.description && <p className="text-[12px] text-[#667085] mb-3">{addition.description}</p>}
                        {/* <button
                          type="button"
                          className="flex items-center gap-1.5 text-[13px] font-medium text-[#475467] hover:text-gray-900 transition-colors cursor-pointer"
                        >
                          <Plus size={14} /> Add project <ArrowRight size={13} />
                        </button> */}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#FFF8F5] border border-[#FFE0CC] rounded-[12px] p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[#FF6934]">
                    <TrendingUp size={16} />
                    <span className="text-[14px] font-semibold">Live Match Preview</span>
                  </div>
                  <p className="text-[13px] text-[#475467] leading-relaxed">
                    Apply fixes to see your match score improve in real-time.
                  </p>
                </div> 
              </div>
            </div>
          )}
        </div>
      </div>
    </>
    </ModalPortal>
  );
}
