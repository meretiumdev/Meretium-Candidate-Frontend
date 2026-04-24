import { Sparkles, Target, MapPin, DollarSign, Clock, CheckCircle, Bookmark, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import type { QuickApplyModalJob } from '../../../components/QuickApplyModal';
import {
  getCandidateRecommendations,
  type CandidateDashboardRecommendationJob,
} from '../../../services/dashboardApi';
import { deleteCandidateSavedJob, saveCandidateJob } from '../../../services/jobsApi';
import { formatJobTypeLabel } from '../../../utils/formatJobTypeLabel';

interface RecommendedJobsProps {
  onQuickApply?: (job: QuickApplyModalJob) => void;
}

interface RecommendedJobCardItem {
  id: string;
  jobId: string;
  initial: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  verified: boolean;
  tags: string[];
  match: number;
  posted: string;
  whyMatch: string;
  isSaved: boolean;
}

const PAGE_SIZE = 10;
const FALLBACK_MATCHES = [92, 88, 85, 90, 83, 80];
const FALLBACK_TAGS = ['React', 'TypeScript', 'Problem solving'];
const FALLBACK_REASON = 'Your profile signals strong alignment with the role requirements.';

function formatCurrencyAmount(value: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value}`;
  }
}

function formatSalary(minSalary: number | null, maxSalary: number | null, currencyCode: string): string {
  if (minSalary !== null && maxSalary !== null) {
    return `${formatCurrencyAmount(minSalary, currencyCode)} - ${formatCurrencyAmount(maxSalary, currencyCode)}`;
  }
  if (minSalary !== null) {
    return `${formatCurrencyAmount(minSalary, currencyCode)}+`;
  }
  if (maxSalary !== null) {
    return `Up to ${formatCurrencyAmount(maxSalary, currencyCode)}`;
  }
  return 'Competitive salary';
}

function formatPostedLabel(postedAt: string): string {
  if (!postedAt) return 'Recently posted';

  const postedDate = new Date(postedAt);
  if (Number.isNaN(postedDate.getTime())) return 'Recently posted';

  const diffMs = Math.max(0, Date.now() - postedDate.getTime());
  const dayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.floor(diffMs / dayMs);

  if (totalDays <= 0) return 'Posted today';
  if (totalDays === 1) return 'Posted 1 day ago';
  if (totalDays < 7) return `Posted ${totalDays} days ago`;

  const weeks = Math.floor(totalDays / 7);
  if (weeks === 1) return 'Posted 1 week ago';
  if (weeks < 5) return `Posted ${weeks} weeks ago`;

  const months = Math.floor(totalDays / 30);
  if (months <= 1) return 'Posted 1 month ago';
  return `Posted ${months} months ago`;
}

function mapMatchPercentage(matchPercentage: number | null, absoluteIndex: number): number {
  if (typeof matchPercentage === 'number' && Number.isFinite(matchPercentage)) {
    return Math.max(0, Math.min(100, Math.round(matchPercentage)));
  }
  return FALLBACK_MATCHES[absoluteIndex % FALLBACK_MATCHES.length];
}

function toRecommendedJobCardItem(job: CandidateDashboardRecommendationJob, absoluteIndex: number): RecommendedJobCardItem {
  const jobId = job.id.trim();
  const company = job.company.name || 'Company';
  const title = job.title || 'Untitled role';
  const tags = job.required_skills.length > 0 ? job.required_skills : FALLBACK_TAGS;
  const match = mapMatchPercentage(job.match_percentage, absoluteIndex);

  return {
    id: jobId || `recommended-${absoluteIndex + 1}`,
    jobId,
    initial: company.charAt(0).toUpperCase() || 'J',
    title,
    company,
    location: job.location || 'Remote',
    salary: formatSalary(job.min_salary, job.max_salary, job.currency),
    type: formatJobTypeLabel(job.job_type, 'Full-time'),
    verified: job.company.is_verified,
    tags,
    match,
    posted: formatPostedLabel(job.posted_at),
    whyMatch: job.recommendation_reason || FALLBACK_REASON,
    isSaved: job.is_saved,
  };
}

export default function RecommendedJobs({ onQuickApply }: RecommendedJobsProps) {
  const navigate = useNavigate();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [savedJobsMap, setSavedJobsMap] = useState<Record<string, boolean>>({});
  const [savingJobsMap, setSavingJobsMap] = useState<Record<string, boolean>>({});
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [jobs, setJobs] = useState<RecommendedJobCardItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [actionToast, setActionToast] = useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null);

  const requestedTopNRef = useRef(PAGE_SIZE);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);
  const requestVersionRef = useRef(0);
  const jobsRef = useRef<RecommendedJobCardItem[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message.trim()) return error.message;
    return 'Unable to update saved job right now.';
  };

  const handleSaveJob = async (jobId: string) => {
    if (!accessToken?.trim()) {
      setActionToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.', type: 'error' });
      return;
    }

    const normalizedJobId = jobId.trim();
    if (!normalizedJobId) {
      setActionToast({ id: Date.now(), message: 'Job id is missing for this item.', type: 'error' });
      return;
    }

    setSavingJobsMap((prev) => ({ ...prev, [normalizedJobId]: true }));

    try {
      const isCurrentlySaved = !!savedJobsMap[normalizedJobId];
      if (isCurrentlySaved) {
        await deleteCandidateSavedJob(accessToken, normalizedJobId);
        setSavedJobsMap((prev) => ({ ...prev, [normalizedJobId]: false }));
        setActionToast({ id: Date.now(), message: 'Job removed from saved.', type: 'success' });
      } else {
        await saveCandidateJob(accessToken, normalizedJobId);
        setSavedJobsMap((prev) => ({ ...prev, [normalizedJobId]: true }));
        setActionToast({ id: Date.now(), message: 'Job saved successfully.', type: 'success' });
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.toLowerCase().includes('already')) {
        setSavedJobsMap((prev) => ({ ...prev, [normalizedJobId]: true }));
        setActionToast({ id: Date.now(), message: 'Job already saved.', type: 'success' });
      } else {
        setActionToast({ id: Date.now(), message, type: 'error' });
      }
    } finally {
      setSavingJobsMap((prev) => ({ ...prev, [normalizedJobId]: false }));
    }
  };

  const toggleExpanded = (jobId: string) => {
    setExpandedMap((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const handleApplyClick = (job: RecommendedJobCardItem) => {
    if (!onQuickApply) return;

    onQuickApply({
      id: job.jobId || job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
    });
  };

  const loadRecommendations = useCallback(async (reset: boolean, requestVersion = requestVersionRef.current) => {
    if (isFetchingRef.current && !reset) return;

    if (!accessToken?.trim()) {
      if (requestVersion !== requestVersionRef.current) return;
      setErrorMessage('You are not authenticated. Please log in again.');
      setIsInitialLoading(false);
      setIsLoadingMore(false);
      setHasMore(false);
      hasMoreRef.current = false;
      return;
    }

    if (!reset && !hasMoreRef.current) return;

    isFetchingRef.current = true;
    setErrorMessage(null);

    if (reset) setIsInitialLoading(true);
    else setIsLoadingMore(true);

    const previousCount = reset ? 0 : jobsRef.current.length;
    const requestedTopN = reset ? PAGE_SIZE : requestedTopNRef.current + PAGE_SIZE;

    try {
      const response = await getCandidateRecommendations(accessToken, {
        top_n: requestedTopN,
      });
      if (requestVersion !== requestVersionRef.current) return;

      const mapped = response.items.map((job, index) => toRecommendedJobCardItem(job, index));
      const apiSavedFlags: Record<string, boolean> = {};
      mapped.forEach((item) => {
        apiSavedFlags[item.id] = item.isSaved;
      });

      const nextJobs = mapped;
      jobsRef.current = nextJobs;
      setJobs(nextJobs);
      requestedTopNRef.current = requestedTopN;

      setSavedJobsMap((prev) => {
        const next = reset ? {} : { ...prev };
        Object.keys(apiSavedFlags).forEach((jobId) => {
          next[jobId] = next[jobId] === true ? true : apiSavedFlags[jobId];
        });
        return next;
      });

      if (reset) {
        setExpandedMap({});
      }

      let nextHasMore = true;
      if (typeof response.total === 'number') {
        nextHasMore = mapped.length < response.total;
      } else {
        if (mapped.length <= previousCount) {
          nextHasMore = false;
        } else {
          nextHasMore = mapped.length >= requestedTopN;
        }
      }

      hasMoreRef.current = nextHasMore;
      setHasMore(nextHasMore);
    } catch (error: unknown) {
      if (requestVersion !== requestVersionRef.current) return;
      const nextError =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Failed to load recommended jobs. Please try again.';
      setErrorMessage(nextError);
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      if (requestVersion !== requestVersionRef.current) return;
      if (reset) setIsInitialLoading(false);
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [accessToken]);

  useEffect(() => {
    requestVersionRef.current += 1;
    isFetchingRef.current = false;
    requestedTopNRef.current = PAGE_SIZE;
    hasMoreRef.current = true;
    jobsRef.current = [];
    setJobs([]);
    setSavedJobsMap({});
    setExpandedMap({});
    setHasMore(true);
    setErrorMessage(null);
    void loadRecommendations(true, requestVersionRef.current);
  }, [loadRecommendations]);

  useEffect(() => {
    if (!actionToast) return undefined;
    const timer = window.setTimeout(() => {
      setActionToast(null);
    }, 3000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [actionToast]);

  useEffect(() => {
    const sentinelNode = sentinelRef.current;
    const scrollRoot = scrollContainerRef.current;
    if (!sentinelNode || !scrollRoot || isInitialLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadRecommendations(false, requestVersionRef.current);
        }
      },
      {
        root: scrollRoot,
        rootMargin: '280px 0px 280px 0px',
      }
    );

    observer.observe(sentinelNode);
    return () => {
      observer.disconnect();
    };
  }, [isInitialLoading, loadRecommendations, jobs.length]);

  const handleRetry = () => {
    requestVersionRef.current += 1;
    isFetchingRef.current = false;
    requestedTopNRef.current = PAGE_SIZE;
    hasMoreRef.current = true;
    jobsRef.current = [];
    setJobs([]);
    setHasMore(true);
    setErrorMessage(null);
    void loadRecommendations(true, requestVersionRef.current);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        {actionToast && (
          <div className={`fixed top-4 right-4 z-[140] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
            actionToast.type === 'error'
              ? 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
              : 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
          }`}>
            {actionToast.message}
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-[#FF6934] size-5" />
          <h2 className="text-[18px] font-semibold text-[#101828]">AI Recommended Jobs</h2>
        </div>

        {isInitialLoading ? (
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <div key={item} className="border border-gray-200 rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-5 w-48 bg-gray-200 rounded-md mb-4"></div>
                <div className="h-4 w-full bg-gray-100 rounded-md mb-2"></div>
                <div className="h-4 w-[90%] bg-gray-100 rounded-md mb-2"></div>
                <div className="h-4 w-[65%] bg-gray-100 rounded-md"></div>
              </div>
            ))}
          </div>
        ) : errorMessage && jobs.length === 0 ? (
          <div className="border border-[#FDA29B] rounded-xl p-5">
            <p className="text-[#B42318] text-[14px] font-medium mb-3">{errorMessage}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="bg-[#FF6934] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="border border-gray-200 rounded-xl p-5 text-[14px] text-[#475467]">
            No recommendations available right now.
          </div>
        ) : (
          <div ref={scrollContainerRef} className="space-y-6 max-h-[860px] overflow-y-auto pr-1 scrollbar-hide">
            {jobs.map((job) => (
              <div key={job.id} className="bg-[#FFFFFF] border border-gray-200 rounded-xl overflow-hidden pb-4 shadow-sm">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
                    <div className="flex items-start gap-4">
                      <div className="size-12 bg-[#F2F4F7] border border-gray-200 rounded-[10px] flex items-center justify-center font-semibold text-[16px] text-[#344054] shrink-0">
                        {job.initial}
                      </div>
                      <div>
                        <h3 className="text-[18px] font-semibold text-[#101828]">{job.title}</h3>
                        <p className="text-[14px] text-[#475467]">{job.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#F7900915] px-3 py-2 rounded-[10px] text-[#FF6934] text-[14px] font-semibold self-start sm:self-auto shadow-sm">
                      <Target size={14} /> {job.match}% Match
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-[14px] text-[#475467]">
                    <div className="flex items-center gap-1.5"><MapPin size={16} /> {job.location}</div>
                    <div className="flex items-center gap-1.5"><DollarSign size={16} /> {job.salary}</div>
                    <div className="flex items-center gap-1.5"><Clock size={16} /> {job.type}</div>
                  </div>

                  {job.verified && (
                    <div className="flex items-center gap-1.5 mt-4 text-sm font-medium text-[#039855]">
                      <CheckCircle size={16} className="text-[#12B76A]" /> Verified company
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    {job.tags.map((tag, index) => (
                      <span key={`${job.id}-tag-${index}`} className="bg-[#F2F4F7] border border-gray-200 text-[#344054] text-xs font-medium px-3 py-1.5 rounded-[8px] shadow-sm">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mt-6">
                    <span className="text-[14px] text-[#667085]">{job.posted}</span>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => { void handleSaveJob(job.jobId || job.id); }}
                        disabled={!!savingJobsMap[job.jobId || job.id]}
                        className={`transition-colors cursor-pointer p-1 disabled:opacity-60 disabled:cursor-not-allowed ${savedJobsMap[job.id] ? 'text-[#FF6934]' : 'text-[#667085] hover:text-[#344054]'}`}
                        aria-label={savedJobsMap[job.id] ? 'Remove saved job' : 'Save job'}
                      >
                        {savingJobsMap[job.jobId || job.id]
                          ? <Loader2 size={20} className="animate-spin" />
                          : <Bookmark size={20} className={savedJobsMap[job.id] ? 'fill-[#FF6934]' : ''} />}
                      </button>
                      <button
                        onClick={() => navigate(job.jobId ? `/jobs/${job.jobId}` : '/jobs')}
                        className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 bg-white rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
                      >
                        View Job
                      </button>
                      <button
                        onClick={() => handleApplyClick(job)}
                        disabled={!onQuickApply}
                        className="flex-1 sm:flex-none px-4 py-2 bg-[#FF6934] text-white rounded-[10px] text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Quick Apply
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-6">
                  <div className="h-[1px] w-full bg-gray-200"></div>
                  <div className="py-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleExpanded(job.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          toggleExpanded(job.id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#FFF4ED] text-[#FF6934] text-[12px] font-semibold h-8 w-8 rounded-full border border-[#FFE1CC] flex items-center justify-center">{job.match}%</div>
                        <span className="text-sm font-medium text-[#344054]">Why this matches you</span>
                      </div>
                      {expandedMap[job.id] ? <ChevronUp size={18} className="text-[#FF6934]" /> : <ChevronDown size={18} className="text-[#FF6934]" />}
                    </div>

                    {expandedMap[job.id] && (
                      <div className="bg-[#F9FAFB] rounded-[10px] p-4 text-[14px] text-[#475467] mt-3 leading-relaxed shadow-sm border border-gray-100">
                        {job.whyMatch}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {errorMessage && jobs.length > 0 && (
              <div className="text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-[10px] px-4 py-3">
                {errorMessage}
              </div>
            )}

            {isLoadingMore && (
              <div className="flex items-center justify-center gap-2 text-sm text-[#475467] py-2">
                <Loader2 size={16} className="animate-spin text-[#FF6934]" />
                Loading more recommendations...
              </div>
            )}

            {!hasMore && jobs.length > 0 && (
              <p className="text-center text-[13px] text-[#98A2B3] py-2">No more recommendations</p>
            )}

            <div ref={sentinelRef} className="h-1" aria-hidden="true"></div>
          </div>
        )}
      </div>
    </div>
  );
}
