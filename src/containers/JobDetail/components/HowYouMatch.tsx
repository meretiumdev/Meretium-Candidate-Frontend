import { Target, Check, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import MatchImprovementModal from '../../../components/MatchImprovementModal';
import {
  getCandidateJobMatchAnalysis,
  type CandidateJobDetailResponse,
  type CandidateJobMatchAnalysis,
} from '../../../services/jobsApi';
import type { RootState } from '../../../redux/store';

interface HowYouMatchProps {
  job?: CandidateJobDetailResponse | null;
  onMatchUpdated?: (match: number | null) => void;
}

export default function HowYouMatch({ job, onMatchUpdated }: HowYouMatchProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [analysis, setAnalysis] = useState<CandidateJobMatchAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [localMatchPercentage, setLocalMatchPercentage] = useState<number | null>(null);
  const [isImproveMatchOpen, setIsImproveMatchOpen] = useState(false);
  const onMatchUpdatedRef = useRef(onMatchUpdated);

  const jobId = (job?.id || '').trim();
  const role = job?.title || '';

  useEffect(() => {
    onMatchUpdatedRef.current = onMatchUpdated;
  }, [onMatchUpdated]);

  useEffect(() => {
    const initialMatch = typeof job?.match_percentage === 'number'
      ? Math.max(0, Math.min(100, Math.round(job.match_percentage)))
      : null;
    setLocalMatchPercentage(initialMatch);
    onMatchUpdatedRef.current?.(initialMatch);
  }, [job?.id, job?.match_percentage]);

  useEffect(() => {
    if (!jobId || !accessToken?.trim()) {
      setAnalysis(null);
      setAnalysisError(null);
      setIsAnalysisLoading(false);
      return;
    }

    let isActive = true;

    const loadMatchAnalysis = async () => {
      setIsAnalysisLoading(true);
      setAnalysisError(null);
      try {
        const response = await getCandidateJobMatchAnalysis(accessToken, jobId);
        if (!isActive) return;
        setAnalysis(response);
        if (typeof response.match_percentage === 'number') {
          const nextMatch = Math.max(0, Math.min(100, Math.round(response.match_percentage)));
          setLocalMatchPercentage(nextMatch);
          onMatchUpdatedRef.current?.(nextMatch);
        }
      } catch (error: unknown) {
        if (!isActive) return;
        const message = error instanceof Error && error.message.trim()
          ? error.message
          : 'Unable to load match analysis right now.';
        setAnalysisError(message);
      } finally {
        if (!isActive) return;
        setIsAnalysisLoading(false);
      }
    };

    void loadMatchAnalysis();

    return () => {
      isActive = false;
    };
  }, [accessToken, jobId]);

  const handleModalMatchUpdated = useCallback((nextMatch: number | null) => {
    if (typeof nextMatch !== 'number') return;
    const normalizedMatch = Math.max(0, Math.min(100, Math.round(nextMatch)));
    setLocalMatchPercentage(normalizedMatch);
    onMatchUpdatedRef.current?.(normalizedMatch);
  }, []);

  const matchingSkills = useMemo(() => {
    if (analysis?.matching_skills?.length) return analysis.matching_skills;
    return job?.required_skills || [];
  }, [analysis?.matching_skills, job?.required_skills]);

  const missingSkills = useMemo(() => {
    if (analysis?.missing_skills?.length) return analysis.missing_skills;
    return job?.preferred_skills || [];
  }, [analysis?.missing_skills, job?.preferred_skills]);

  const currentMatch = useMemo(() => {
    if (typeof localMatchPercentage === 'number') return localMatchPercentage;
    return null;
  }, [localMatchPercentage]);

  return (
    <div className="bg-[#FDF7E9] border border-[#FF6934] rounded-[14px] p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Target className="text-[#FF6934] size-6" />
        <h2 className="text-[24px] font-semibold text-gray-900">How you match</h2>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-4 text-[14px] font-semibold text-[#12B76A]">
          <Check size={14} strokeWidth={3} /> Matching skills
        </div>
        {isAnalysisLoading && matchingSkills.length === 0 ? (
          <div className="flex items-center gap-2 text-[13px] text-[#475467]">
            <Loader2 size={14} className="animate-spin text-[#FF6934]" />
            Loading match analysis...
          </div>
        ) : matchingSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {matchingSkills.map((skill, idx) => (
              <span key={`${skill}-${idx}`} className="bg-white border border-gray-100 text-gray-700 text-[14px] px-4 py-2 rounded-[10px]">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[#475467]">No matched skills available right now.</p>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-4 text-[14px] font-semibold text-yellow-500">
          <AlertTriangle size={14} strokeWidth={3} className="text-[#F59E0B]" /> <span className="text-[#F59E0B]">Missing skills</span>
        </div>
        {isAnalysisLoading && missingSkills.length === 0 ? (
          <div className="flex items-center gap-2 text-[13px] text-[#475467]">
            <Loader2 size={14} className="animate-spin text-[#FF6934]" />
            Loading match analysis...
          </div>
        ) : missingSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {missingSkills.map((skill, idx) => (
              <span key={`${skill}-${idx}`} className="bg-white border border-gray-100 text-gray-700 text-[14px] px-4 py-2 rounded-[10px]">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[#475467]">No missing skills identified.</p>
        )}
      </div>

      {analysisError && (
        <p className="text-[12px] text-[#B42318] mb-4">{analysisError}</p>
      )}

      <button
        onClick={() => setIsImproveMatchOpen(true)}
        className="flex items-center gap-1 text-[#FF6934] text-[14px] font-medium hover:underline cursor-pointer group mt-2"
      >
        Improve your match
        <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
      </button>

      <MatchImprovementModal
        isOpen={isImproveMatchOpen}
        onClose={() => setIsImproveMatchOpen(false)}
        role={role}
        currentMatch={currentMatch}
        jobId={jobId}
        onMatchUpdated={handleModalMatchUpdated}
      />
    </div>
  );
}
