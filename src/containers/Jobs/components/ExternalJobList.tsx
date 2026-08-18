import { MapPin, DollarSign, Clock, CheckCircle, Bookmark, Target, Loader2, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { useSelector } from 'react-redux';
import {
  deleteCandidateSavedJob,
  getCandidateExternalRecommendations,
  saveCandidateJob,
  type CandidateJobsApiJob,
} from '../../../services/jobsApi';
import type { RootState } from '../../../redux/store';
import { formatJobTypeLabel } from '../../../utils/formatJobTypeLabel';
import { formatSalaryLabel } from '../../../utils/formatSalaryLabel';

interface ExternalJobListItem {
  id: string;
  initial: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  verified: boolean;
  tags: string[];
  match: number | null;
  matchColor: 'green' | 'orange';
  description: string;
  posted: string;
  sourceName: string;
  externalUrl: string;
}

const PAGE_LIMIT = 20;
const FALLBACK_DESCRIPTION = 'Role details will be available on the original listing.';

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

function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function toExternalJobListItem(job: CandidateJobsApiJob, index: number): ExternalJobListItem {
  const companyName = job.company.name || 'Company';
  const match = typeof job.match_percentage === 'number' && Number.isFinite(job.match_percentage)
    ? Math.max(0, Math.min(100, Math.round(job.match_percentage)))
    : null;
  const tags = job.required_skills.length > 0 ? job.required_skills : job.matched_skills;

  return {
    id: job.id || `external-job-${index + 1}`,
    initial: companyName.charAt(0).toUpperCase() || 'J',
    title: job.title || 'Untitled role',
    company: companyName,
    location: job.location || 'Remote',
    salary: formatSalaryLabel(job.min_salary, job.max_salary, job.currency, { salaryPeriod: job.salary_period }),
    type: formatJobTypeLabel(job.job_type),
    verified: job.company.is_verified,
    tags,
    match,
    matchColor: match !== null && match >= 90 ? 'green' : 'orange',
    description: job.description || FALLBACK_DESCRIPTION,
    posted: formatPostedLabel(job.posted_at),
    sourceName: job.source_name,
    externalUrl: normalizeExternalUrl(job.external_url),
  };
}

interface ExternalJobListProps {
  onJobsCountChange?: (count: number | null) => void;
}

export default function ExternalJobList({ onJobsCountChange }: ExternalJobListProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [jobs, setJobs] = useState<ExternalJobListItem[]>([]);
  const [savedJobsMap, setSavedJobsMap] = useState<Record<string, boolean>>({});
  const [savingJobsMap, setSavingJobsMap] = useState<Record<string, boolean>>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState<number | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null);
  const requestVersionRef = useRef(0);
  const nextSkipRef = useRef(0);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadJobs = useCallback(async (reset: boolean) => {
    if (isFetchingRef.current && !reset) return;
    if (!reset && !hasMoreRef.current) return;

    if (reset) {
      requestVersionRef.current += 1;
      nextSkipRef.current = 0;
      hasMoreRef.current = true;
    }
    const requestVersion = requestVersionRef.current;

    if (!accessToken?.trim()) {
      setErrorMessage('You are not authenticated. Please log in again.');
      setIsInitialLoading(false);
      setIsLoadingMore(false);
      hasMoreRef.current = false;
      return;
    }

    isFetchingRef.current = true;
    setErrorMessage(null);
    if (reset) setIsInitialLoading(true);
    else setIsLoadingMore(true);

    const requestSkip = reset ? 0 : nextSkipRef.current;

    try {
      const response = await getCandidateExternalRecommendations(accessToken, {
        top_n: PAGE_LIMIT,
        skip: requestSkip,
      });
      if (requestVersion !== requestVersionRef.current) return;

      const mappedJobs = response.items.map((job, index) => toExternalJobListItem(job, requestSkip + index));
      const pageSavedMap: Record<string, boolean> = {};
      response.items.forEach((job, index) => {
        pageSavedMap[mappedJobs[index].id] = job.is_saved;
      });

      setJobs((prev) => (reset ? mappedJobs : [...prev, ...mappedJobs]));
      setSavedJobsMap((prev) => {
        const next = reset ? {} : { ...prev };
        Object.keys(pageSavedMap).forEach((jobId) => {
          next[jobId] = next[jobId] === true ? true : pageSavedMap[jobId];
        });
        return next;
      });

      const nextSkip = requestSkip + response.items.length;
      nextSkipRef.current = nextSkip;
      if (typeof response.total === 'number') {
        setTotalJobs(response.total);
        hasMoreRef.current = response.items.length > 0 && nextSkip < response.total;
      } else {
        setTotalJobs((prev) => Math.max(prev ?? 0, nextSkip));
        hasMoreRef.current = response.items.length === PAGE_LIMIT;
      }
    } catch (error: unknown) {
      if (requestVersion !== requestVersionRef.current) return;
      if (reset) setJobs([]);
      setErrorMessage(
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Failed to load more jobs. Please try again.'
      );
      hasMoreRef.current = false;
    } finally {
      if (requestVersion === requestVersionRef.current) {
        if (reset) setIsInitialLoading(false);
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    }
  }, [accessToken]);

  useEffect(() => {
    void loadJobs(true);
    return () => {
      requestVersionRef.current += 1;
      isFetchingRef.current = false;
    };
  }, [loadJobs]);

  useEffect(() => {
    const sentinelNode = sentinelRef.current;
    if (!sentinelNode || isInitialLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadJobs(false);
        }
      },
      { root: null, rootMargin: '280px 0px 280px 0px' }
    );

    observer.observe(sentinelNode);
    return () => observer.disconnect();
  }, [isInitialLoading, loadJobs, jobs.length]);

  const displayedJobsCount = totalJobs ?? jobs.length;

  useEffect(() => {
    onJobsCountChange?.(isInitialLoading && jobs.length === 0 ? null : displayedJobsCount);
  }, [isInitialLoading, jobs.length, displayedJobsCount, onJobsCountChange]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openExternalJob = (job: ExternalJobListItem) => {
    if (!job.externalUrl) {
      setToast({ id: Date.now(), message: 'The original listing link is not available for this job.', type: 'error' });
      return;
    }
    window.open(job.externalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSaveJob = async (e: MouseEvent, id: string) => {
    e.stopPropagation();

    if (!accessToken?.trim()) {
      setToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.', type: 'error' });
      return;
    }

    setSavingJobsMap((prev) => ({ ...prev, [id]: true }));

    try {
      if (savedJobsMap[id]) {
        await deleteCandidateSavedJob(accessToken, id);
        setSavedJobsMap((prev) => ({ ...prev, [id]: false }));
        setToast({ id: Date.now(), message: 'Job removed from saved.', type: 'success' });
      } else {
        await saveCandidateJob(accessToken, id);
        setSavedJobsMap((prev) => ({ ...prev, [id]: true }));
        setToast({ id: Date.now(), message: 'Job saved successfully.', type: 'success' });
      }
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Unable to update saved job right now.';
      if (message.toLowerCase().includes('already')) {
        setSavedJobsMap((prev) => ({ ...prev, [id]: true }));
        setToast({ id: Date.now(), message: 'Job already saved.', type: 'success' });
      } else {
        setToast({ id: Date.now(), message, type: 'error' });
      }
    } finally {
      setSavingJobsMap((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (isInitialLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-5 w-48 bg-gray-200 rounded-md mb-4"></div>
            <div className="h-4 w-full bg-gray-100 rounded-md mb-2"></div>
            <div className="h-4 w-[90%] bg-gray-100 rounded-md mb-2"></div>
            <div className="h-4 w-[65%] bg-gray-100 rounded-md"></div>
          </div>
        ))}
      </div>
    );
  }

  if (errorMessage && jobs.length === 0) {
    return (
      <div className="bg-white border border-[#FDA29B] rounded-xl p-6">
        <p className="text-[#B42318] text-[14px] font-medium mb-4">{errorMessage}</p>
        <button
          type="button"
          onClick={() => { void loadJobs(true); }}
          className="bg-[#FF6934] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-[140] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
          toast.type === 'error'
            ? 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
            : 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
        }`}>
          {toast.message}
        </div>
      )}

      <div>
        <h2 className="text-[24px] font-semibold text-gray-900">{displayedJobsCount} more jobs found</h2>
        <p className="text-sm text-[#475467] mt-1">
          Roles from other job boards that match your profile. You&apos;ll apply on the original site.
        </p>
      </div>

      {errorMessage && jobs.length > 0 && (
        <div className="text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-[10px] px-4 py-3">
          {errorMessage}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-[#475467]">
          No matching jobs from other boards right now. Check back soon.
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => openExternalJob(job)}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="size-10 bg-[#F2F4F7] border border-gray-200 rounded-[10px] flex items-center justify-center font-semibold text-[14px] text-gray-700 shrink-0">
                    {job.initial}
                  </div>
                  <div>
                    <h3 className="text-[18px] font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {job.company}
                      {job.sourceName && <span className="text-gray-400"> · via {job.sourceName}</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => { void handleSaveJob(e, job.id); }}
                  disabled={!!savingJobsMap[job.id]}
                  className={`transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${savedJobsMap[job.id] ? 'text-[#FF6934]' : 'text-[#475467] hover:text-gray-600'}`}
                >
                  {savingJobsMap[job.id]
                    ? <Loader2 size={20} className="animate-spin" />
                    : <Bookmark size={20} className={savedJobsMap[job.id] ? 'fill-[#FF6934]' : ''} />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-5 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-1.5"><MapPin size={16} className="text-[#475467]" /> {job.location}</div>
                <div className="flex items-center gap-1.5"><DollarSign size={16} className="text-[#475467]" /> {job.salary}</div>
                <div className="flex items-center gap-1.5"><Clock size={16} className="text-[#475467]" /> {job.type}</div>
              </div>

              {job.verified && (
                <div className="flex items-center gap-1.5 mt-3 text-[14px] font-medium text-[#12B76A]">
                  <CheckCircle size={15} /> Verified company
                </div>
              )}

              {job.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {job.tags.map((tag, index) => (
                    <span key={`${job.id}-tag-${index}`} className="bg-[#F2F4F7] border border-gray-200 text-[#475467] text-sm font-regular px-2.5 py-1.5 rounded-[10px]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {job.match !== null && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-sm font-semibold mt-4 w-fit ${job.matchColor === 'green' ? 'bg-[#12B76A15] text-[#12B76A]' : 'bg-orange-50 text-[#FF6934]'}`}>
                  <Target size={14} /> {job.match}% Match
                </div>
              )}

              <p className="text-[14px] text-[#475467] mt-4 leading-relaxed font-regular line-clamp-4">
                {job.description}
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mt-6 pt-3 border-t border-gray-200">
                <span className="text-[12px] text-gray-400 font-[400] whitespace-nowrap">{job.posted}</span>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    className="flex-1 sm:flex-none justify-center border border-gray-200 bg-white px-4 py-2 rounded-[10px] text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    View Job
                  </button>
                  <button
                    type="button"
                    className="flex-1 sm:flex-none justify-center bg-[#FF6934] text-white px-4 py-2 rounded-[10px] text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
                  >
                    {job.sourceName ? `Apply on ${job.sourceName}` : 'Apply'}
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoadingMore && (
        <div className="flex items-center justify-center gap-2 text-sm text-[#475467] py-2">
          <Loader2 size={16} className="animate-spin text-[#FF6934]" />
          Fetching more jobs...
        </div>
      )}

      <div ref={sentinelRef} className="h-1" aria-hidden="true"></div>
    </div>
  );
}
