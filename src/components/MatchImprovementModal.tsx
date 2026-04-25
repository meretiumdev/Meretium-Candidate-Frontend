import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { X, Sparkles, AlertCircle, Plus, ArrowRight, Loader2 } from 'lucide-react';
import ModalPortal from './ModalPortal';
import {
  autoImproveCandidateJob,
  getCandidateJobMatchImprovement,
  type CandidateJobMatchImprovement,
  type CandidateJobMatchImprovementExperience,
  type CandidateJobMatchImprovementSkill,
} from '../services/jobsApi';
import {
  autoImproveProfileExperience,
  createProfileSkill,
  getCandidateProfileMatchImprovement,
  updateProfileExperience,
} from '../services/profileApi';
import type { RootState } from '../redux/store';

interface MatchImprovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
  currentMatch: number | null;
  jobId?: string;
  source?: 'job' | 'profile';
  onMatchUpdated?: (matchPercentage: number | null) => void;
  onProfileUpdated?: () => Promise<void> | void;
}

export default function MatchImprovementModal({
  isOpen,
  onClose,
  role,
  currentMatch,
  jobId = '',
  source = 'job',
  onMatchUpdated,
  onProfileUpdated,
}: MatchImprovementModalProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const normalizedJobId = jobId.trim();
  const isProfileMode = source === 'profile';
  const shouldFetchImprovement = isProfileMode || normalizedJobId.length > 0;
  const canAutoImproveJob = !isProfileMode && normalizedJobId.length > 0;
  const canAddSkill = canAutoImproveJob || isProfileMode;
  const canImproveExperience = canAutoImproveJob || isProfileMode;

  const [isLoading, setIsLoading] = useState(false);
  const [improvement, setImprovement] = useState<CandidateJobMatchImprovement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionState, setActionState] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const onMatchUpdatedRef = useRef(onMatchUpdated);
  const onProfileUpdatedRef = useRef(onProfileUpdated);

  useEffect(() => {
    onMatchUpdatedRef.current = onMatchUpdated;
  }, [onMatchUpdated]);

  useEffect(() => {
    onProfileUpdatedRef.current = onProfileUpdated;
  }, [onProfileUpdated]);

  const loadMatchImprovement = useCallback(async (silent = false) => {
    if (!shouldFetchImprovement) {
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

    if (!silent) {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const response = isProfileMode
        ? await getCandidateProfileMatchImprovement(accessToken)
        : await getCandidateJobMatchImprovement(accessToken, normalizedJobId);
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
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [accessToken, isProfileMode, normalizedJobId, shouldFetchImprovement]);

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
    if (!isProfileMode && typeof currentMatch === 'number') {
      return Math.max(0, Math.min(100, Math.round(currentMatch)));
    }
    return null;
  }, [currentMatch, improvement?.current_match, isProfileMode]);

  const potential = useMemo(() => {
    if (typeof improvement?.potential_match === 'number') {
      return Math.max(0, Math.min(100, Math.round(improvement.potential_match)));
    }
    return null;
  }, [improvement?.potential_match]);

  const progressWidth = safeMatch === null ? 0 : safeMatch;
  const potentialGap = safeMatch === null || potential === null ? 0 : Math.max(0, potential - safeMatch);
  const displayedGap = typeof improvement?.gap_pct === 'number' ? improvement.gap_pct : potentialGap;
  const summaryText = improvement?.summary?.trim() || '';
  const summaryIncludesGap = displayedGap > 0 && summaryText.includes(`${displayedGap}%`);

  const missingSkills = useMemo(() => {
    return improvement?.missing_skills || [];
  }, [improvement?.missing_skills]);

  const experienceSuggestions = useMemo(() => {
    return improvement?.experience_suggestions || [];
  }, [improvement?.experience_suggestions]);

  const suggestedAdditions = useMemo(() => {
    return improvement?.suggested_additions || [];
  }, [improvement?.suggested_additions]);

  const handleAddSkill = async (skill: CandidateJobMatchImprovementSkill) => {
    if (!canAddSkill) return;

    if (!accessToken?.trim()) {
      setActionState({ type: 'error', message: 'You are not authenticated. Please log in again.' });
      return;
    }

    const loadingKey = `skill-${skill.id || skill.name}`;
    setActionLoadingKey(loadingKey);

    try {
      if (isProfileMode) {
        await createProfileSkill(accessToken, {
          name: skill.name,
          category: 'CORE',
          proficiency_level: 3,
        });

        setActionState({
          type: 'success',
          message: 'Skill added successfully.',
        });
        await onProfileUpdatedRef.current?.();
      } else {
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
      }
      await loadMatchImprovement(true);
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Unable to improve this skill right now.';
      setActionState({ type: 'error', message });
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleImproveExperience = async (
    experience: CandidateJobMatchImprovementExperience,
    loadingKeyOverride?: string
  ) => {
    if (!canImproveExperience) return;

    if (!accessToken?.trim()) {
      setActionState({ type: 'error', message: 'You are not authenticated. Please log in again.' });
      return;
    }

    const experienceId = experience.id.trim();
    if (isProfileMode) {
      if (!experienceId) {
        setActionState({ type: 'error', message: 'Experience id is missing for this suggestion.' });
        return;
      }

      const loadingKey = loadingKeyOverride || `experience-${experienceId || experience.title}`;
      setActionLoadingKey(loadingKey);

      try {
        const refined = await autoImproveProfileExperience(accessToken, experienceId);
        await updateProfileExperience(accessToken, experienceId, {
          description: refined.description,
          achievements: refined.achievements,
        });

        if (typeof refined.match_percentage === 'number') {
          onMatchUpdatedRef.current?.(refined.match_percentage);
        }

        setActionState({
          type: 'success',
          message: 'Experience improved successfully.',
        });
        await onProfileUpdatedRef.current?.();
        await loadMatchImprovement(true);
      } catch (error: unknown) {
        const message = error instanceof Error && error.message.trim()
          ? error.message
          : 'Unable to improve this experience right now.';
        setActionState({ type: 'error', message });
      } finally {
        setActionLoadingKey(null);
      }
      return;
    }

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
      await loadMatchImprovement(true);
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
                {!isProfileMode && role && <p className="text-[12px] text-[#98A2B3]">for {role}</p>}
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
                    {((safeMatch !== null && potential !== null) || typeof improvement?.gap_pct === 'number') && !summaryIncludesGap ? (
                      <p className="text-[13px] text-[#475467]">
                        You&apos;re <span className="font-semibold text-[#101828]">{displayedGap}%</span> away from your potential.
                      </p>
                    ) : null}
                    {summaryText && (
                      <p className="text-[13px] text-[#475467] leading-relaxed mt-1">{summaryText}</p>
                    )}
                    {typeof improvement?.jobs_evaluated === 'number' && (
                      <p className="text-[12px] text-[#98A2B3] mt-2">Jobs evaluated: {improvement.jobs_evaluated}</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[15px] font-semibold text-[#101828]">Missing Skills</p>
                    <span className="text-[12px] font-medium text-[#FF6934]">High impact</span>
                  </div>
                  <div className="space-y-3">
                    {missingSkills.length === 0 ? (
                      <p className="text-[13px] text-[#667085]">No missing skills found.</p>
                    ) : missingSkills.map((skill, index) => {
                      const key = `skill-${skill.id || skill.name || index}`;
                      const isActionLoading = actionLoadingKey === key;

                      return (
                        <div key={key} className="border border-gray-100 rounded-[10px] p-3.5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[14px] font-medium text-[#101828]">{skill.name}</span>
                            {skill.impact && <span className="text-[13px] font-semibold text-[#039855]">{skill.impact}</span>}
                          </div>
                          {typeof skill.appears_in_jobs === 'number' && (
                            <p className="text-[12px] text-[#667085] mb-2">Appears in {skill.appears_in_jobs} jobs</p>
                          )}
                          {canAddSkill && (
                            <button
                              type="button"
                              onClick={() => { void handleAddSkill(skill); }}
                              disabled={isActionLoading}
                              className="flex items-center gap-1.5 text-[13px] font-medium text-[#475467] hover:text-gray-900 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                              Add this skill <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[16px] font-semibold text-[#101828]">Improve Experience</p>
                    <span className="text-[12px] font-medium text-[#667085]">Needs enhancement</span>
                  </div>
                  <div className="space-y-3">
                    {experienceSuggestions.length === 0 ? (
                      <p className="text-[13px] text-[#667085]">No experience improvements found.</p>
                    ) : experienceSuggestions.map((item, index) => {
                      const key = `experience-${item.id || index}`;
                      const isActionLoading = actionLoadingKey === key;

                      return (
                        <div key={key} className="border border-gray-100 rounded-[10px] p-4">
                          <p className="text-[14px] font-medium text-[#101828] mb-1">{item.title}</p>
                          {item.issue && <p className="text-[12px] text-[#F04438] mb-1">{item.issue}</p>}
                          {item.description && <p className="text-[12px] text-[#667085] leading-relaxed mb-2">{item.description}</p>}
                          {item.impact && <p className="text-[13px] font-semibold text-[#039855] mb-3">{item.impact}</p>}
                          {canImproveExperience && (
                            <button
                              type="button"
                              onClick={() => { void handleImproveExperience(item, key); }}
                              disabled={isActionLoading}
                              className="flex items-center gap-1.5 text-[13px] font-medium text-[#475467] hover:text-gray-900 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                              Improve with AI <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pb-4">
                  <p className="text-[16px] font-semibold text-[#101828] mb-3">Suggested additions</p>
                  <div className="space-y-3">
                    {suggestedAdditions.length === 0 ? (
                      <p className="text-[13px] text-[#667085]">No suggested additions found.</p>
                    ) : suggestedAdditions.map((addition, index) => (
                      <div key={`${addition.id || addition.title}-${index}`} className="border border-gray-100 rounded-[10px] p-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[14px] font-medium text-[#101828]">{addition.title}</p>
                          {addition.impact && <span className="text-[13px] font-semibold text-[#039855]">{addition.impact}</span>}
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

              </div>
            </div>
          )}
        </div>
      </div>
    </>
    </ModalPortal>
  );
}
