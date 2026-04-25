import { MapPin, DollarSign, Clock, CheckCircle, Bookmark, Target, Loader2, ChevronDown, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useSelector } from 'react-redux';
import QuickApplyModal from '../../../components/QuickApplyModal';
import {
  deleteCandidateSavedJob,
  getCandidateJobs,
  saveCandidateJob,
  type CandidateJobsApiJob,
  type CandidateJobsSortBy,
} from '../../../services/jobsApi';
import type { RootState } from '../../../redux/store';
import type { JobsFilters } from '../types';
import { formatJobTypeLabel } from '../../../utils/formatJobTypeLabel';

interface JobListItem {
  id: string;
  initial: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  key_responsibilities: string[];
  verified: boolean;
  tags: string[];
  match: number;
  matchColor: 'green' | 'orange';
  description: string;
  posted: string;
}

const PAGE_LIMIT = 10;
const FALLBACK_MATCHES = [92, 88, 85, 90, 83, 83];
const FALLBACK_TAGS = ['TypeScript', 'React', 'Node.js', 'Figma', 'Design Systems'];
const FALLBACK_DESCRIPTION = 'Role details will be available soon. Please check back in a moment.';
const JOBS_PAGE_CACHE_KEY = 'candidate-jobs-page-cache-v1';
const JOB_SORT_OPTIONS: Array<{ label: string; value: CandidateJobsSortBy }> = [
  { label: 'Most relevant', value: 'most_relevant' },
  { label: 'Most recent', value: 'most_recent' },
  { label: 'Highest salary', value: 'highest_salary' },
];
let reloadCacheResetHandled = false;

interface JobsPageCache {
  jobs: JobListItem[];
  savedJobsMap: Record<string, boolean>;
  nextSkip: number;
  hasMore: boolean;
  totalJobs: number | null;
  scrollY: number;
  filtersSignature: string;
}

function asFiniteNumber(input: unknown, fallback = 0): number {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function isJobListItem(input: unknown): input is JobListItem {
  if (typeof input !== 'object' || input === null) return false;
  const root = input as Record<string, unknown>;

  return (
    typeof root.id === 'string'
    && typeof root.title === 'string'
    && typeof root.company === 'string'
    && typeof root.location === 'string'
    && typeof root.salary === 'string'
    && typeof root.type === 'string'
    && typeof root.description === 'string'
    && typeof root.posted === 'string'
  );
}

function readJobsPageCache(): JobsPageCache | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(JOBS_PAGE_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const jobsRaw = Array.isArray(parsed.jobs) ? parsed.jobs : [];
    const jobs = jobsRaw.filter((item): item is JobListItem => isJobListItem(item));

    const savedJobsMapRaw = typeof parsed.savedJobsMap === 'object' && parsed.savedJobsMap !== null
      ? parsed.savedJobsMap as Record<string, unknown>
      : {};

    const savedJobsMap: Record<string, boolean> = {};
    Object.keys(savedJobsMapRaw).forEach((key) => {
      if (typeof savedJobsMapRaw[key] === 'boolean') {
        savedJobsMap[key] = savedJobsMapRaw[key] as boolean;
      }
    });

    return {
      jobs,
      savedJobsMap,
      nextSkip: Math.max(0, Math.trunc(asFiniteNumber(parsed.nextSkip, jobs.length))),
      hasMore: parsed.hasMore !== false,
      totalJobs: typeof parsed.totalJobs === 'number' && Number.isFinite(parsed.totalJobs)
        ? Math.max(0, Math.trunc(parsed.totalJobs))
        : null,
      scrollY: Math.max(0, Math.trunc(asFiniteNumber(parsed.scrollY, 0))),
      filtersSignature: typeof parsed.filtersSignature === 'string' ? parsed.filtersSignature : '',
    };
  } catch {
    return null;
  }
}

function writeJobsPageCache(cache: JobsPageCache): void {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(JOBS_PAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage write errors.
  }
}

function clearJobsPageCache(): void {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(JOBS_PAGE_CACHE_KEY);
  } catch {
    // Ignore storage removal errors.
  }
}

function isReloadNavigation(): boolean {
  if (typeof window === 'undefined') return false;

  const navigationEntries = window.performance.getEntriesByType('navigation');
  const navigationEntry = navigationEntries[0] as PerformanceNavigationTiming | undefined;
  if (navigationEntry && navigationEntry.type === 'reload') {
    return true;
  }

  const legacyPerformance = window.performance as Performance & {
    navigation?: { type?: number };
  };
  return legacyPerformance.navigation?.type === 1;
}

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

  const now = Date.now();
  const diffMs = Math.max(0, now - postedDate.getTime());
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

function toJobListItem(job: CandidateJobsApiJob, absoluteIndex: number): JobListItem {
  const companyName = job.company.name || 'Company';
  const title = job.title || 'Untitled role';
  const tags = job.required_skills.length > 0 ? job.required_skills : FALLBACK_TAGS;
  const match = mapMatchPercentage(job.match_percentage, absoluteIndex);

  return {
    id: job.id || `job-${absoluteIndex + 1}`,
    initial: companyName.charAt(0).toUpperCase() || 'J',
    title,
    company: companyName,
    location: job.location || 'Remote',
    salary: formatSalary(job.min_salary, job.max_salary, job.currency),
    type: formatJobTypeLabel(job.job_type),
    key_responsibilities: job.key_responsibilities,
    verified: job.company.is_verified,
    tags,
    match,
    matchColor: match >= 90 ? 'green' : 'orange',
    description: job.description || FALLBACK_DESCRIPTION,
    posted: formatPostedLabel(job.posted_at),
  };
}

interface JobListProps {
  filters: JobsFilters;
  onOpenFilters?: () => void;
  onJobsCountChange?: (count: number) => void;
}

export default function JobList({ filters, onOpenFilters, onJobsCountChange }: JobListProps) {
  const navigate = useNavigate();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [activeFilters, setActiveFilters] = useState<JobsFilters>(filters);
  const [sortBy, setSortBy] = useState<CandidateJobsSortBy>('most_relevant');
  const [selectedJob, setSelectedJob] = useState<JobListItem | null>(null);
  const [savedJobsMap, setSavedJobsMap] = useState<Record<string, boolean>>({});
  const [savingJobsMap, setSavingJobsMap] = useState<Record<string, boolean>>({});
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState<number | null>(null);
  const [applyToast, setApplyToast] = useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null);

  const nextSkipRef = useRef(0);
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const cacheReadyRef = useRef(false);
  const scrollSaveTimeoutRef = useRef<number | null>(null);
  const requestVersionRef = useRef(0);
  const activeSortOption = useMemo(
    () => JOB_SORT_OPTIONS.find((option) => option.value === sortBy) ?? JOB_SORT_OPTIONS[0],
    [sortBy]
  );
  const filtersSignature = useMemo(() => JSON.stringify({ activeFilters, sortBy }), [activeFilters, sortBy]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveFilters(filters);
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filters]);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message.trim()) return error.message;
    return 'Unable to update saved job right now.';
  };

  const handleSaveJob = async (e: MouseEvent, id: string) => {
    e.stopPropagation();

    if (!accessToken?.trim()) {
      setApplyToast({ id: Date.now(), message: 'You are not authenticated. Please log in again.', type: 'error' });
      return;
    }

    setSavingJobsMap((prev) => ({ ...prev, [id]: true }));

    try {
      const isCurrentlySaved = !!savedJobsMap[id];
      if (isCurrentlySaved) {
        await deleteCandidateSavedJob(accessToken, id);
        setSavedJobsMap((prev) => ({ ...prev, [id]: false }));
        setApplyToast({ id: Date.now(), message: 'Job removed from saved.', type: 'success' });
      } else {
        await saveCandidateJob(accessToken, id);
        setSavedJobsMap((prev) => ({ ...prev, [id]: true }));
        setApplyToast({ id: Date.now(), message: 'Job saved successfully.', type: 'success' });
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.toLowerCase().includes('already')) {
        setSavedJobsMap((prev) => ({ ...prev, [id]: true }));
        setApplyToast({ id: Date.now(), message: 'Job already saved.', type: 'success' });
      } else {
        setApplyToast({ id: Date.now(), message, type: 'error' });
      }
    } finally {
      setSavingJobsMap((prev) => ({ ...prev, [id]: false }));
    }
  };

  const loadJobs = useCallback(async (reset: boolean, requestVersion = requestVersionRef.current) => {
    if (isFetchingRef.current && !reset) return;

    if (!accessToken?.trim()) {
      if (requestVersion !== requestVersionRef.current) return;
      setErrorMessage('You are not authenticated. Please log in again.');
      setIsInitialLoading(false);
      setIsLoadingMore(false);
      hasMoreRef.current = false;
      return;
    }

    if (!reset && !hasMoreRef.current) return;

    isFetchingRef.current = true;
    setErrorMessage(null);

    if (reset) setIsInitialLoading(true);
    else setIsLoadingMore(true);

    const requestSkip = reset ? 0 : nextSkipRef.current;

    try {
      const response = await getCandidateJobs(accessToken, {
        skip: requestSkip,
        limit: PAGE_LIMIT,
        sort_by: sortBy,
        date_posted: activeFilters.datePosted,
        job_type: activeFilters.jobType,
        experience_level: activeFilters.experienceLevel,
        work_mode: activeFilters.workMode,
        salary_currency: activeFilters.salaryCurrency,
        min_salary: activeFilters.minSalary,
        max_salary: activeFilters.maxSalary,
      });
      if (requestVersion !== requestVersionRef.current) return;

      const mappedJobs = response.items.map((job, index) => toJobListItem(job, requestSkip + index));
      const apiSavedFlags: Record<string, boolean> = {};
      mappedJobs.forEach((mappedJob, index) => {
        apiSavedFlags[mappedJob.id] = response.items[index]?.is_saved ?? false;
      });

      setJobs((prev) => (reset ? mappedJobs : [...prev, ...mappedJobs]));
      setSavedJobsMap((prev) => {
        const next = reset ? {} : { ...prev };
        Object.keys(apiSavedFlags).forEach((jobId) => {
          // Keep optimistic local "saved" state if already true.
          next[jobId] = next[jobId] === true ? true : apiSavedFlags[jobId];
        });
        return next;
      });
      if (typeof response.total === 'number') {
        setTotalJobs(response.total);
      } else {
        setTotalJobs((prev) => Math.max(prev ?? 0, requestSkip + response.items.length));
      }

      const nextSkip = requestSkip + response.items.length;
      const nextHasMore = typeof response.total === 'number'
        ? nextSkip < response.total
        : response.items.length === PAGE_LIMIT;
      nextSkipRef.current = nextSkip;
      hasMoreRef.current = nextHasMore;
    } catch (error: unknown) {
      if (requestVersion !== requestVersionRef.current) return;
      const nextError =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Failed to load jobs. Please try again.';
      setErrorMessage(nextError);
      hasMoreRef.current = false;
    } finally {
      if (requestVersion !== requestVersionRef.current) return;
      if (reset) setIsInitialLoading(false);
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [accessToken, activeFilters.datePosted, activeFilters.experienceLevel, activeFilters.jobType, activeFilters.maxSalary, activeFilters.minSalary, activeFilters.salaryCurrency, activeFilters.workMode, sortBy]);

  const persistJobsCache = useCallback((scrollY?: number) => {
    if (!cacheReadyRef.current) return;
    if (jobs.length === 0) return;

    writeJobsPageCache({
      jobs,
      savedJobsMap,
      nextSkip: nextSkipRef.current,
      hasMore: hasMoreRef.current,
      totalJobs,
      scrollY: Math.max(0, Math.trunc(scrollY ?? (typeof window !== 'undefined' ? window.scrollY : 0))),
      filtersSignature,
    });
  }, [filtersSignature, jobs, savedJobsMap, totalJobs]);

  useEffect(() => {
    if (isReloadNavigation() && !reloadCacheResetHandled) {
      reloadCacheResetHandled = true;
      clearJobsPageCache();
      requestVersionRef.current += 1;
      isFetchingRef.current = false;
      nextSkipRef.current = 0;
      hasMoreRef.current = true;
      setJobs([]);
      setSavedJobsMap({});
      setErrorMessage(null);
      setTotalJobs(null);
      cacheReadyRef.current = true;
      void loadJobs(true, requestVersionRef.current);
      return;
    }

    const cached = readJobsPageCache();

    if (cached && cached.filtersSignature === filtersSignature && cached.jobs.length > 0) {
      nextSkipRef.current = cached.nextSkip;
      hasMoreRef.current = cached.hasMore;
      setJobs(cached.jobs);
      setSavedJobsMap(cached.savedJobsMap);
      setErrorMessage(null);
      setTotalJobs(cached.totalJobs);
      setIsInitialLoading(false);
      cacheReadyRef.current = true;

      window.setTimeout(() => {
        window.scrollTo({ top: cached.scrollY, behavior: 'auto' });
      }, 0);
      return;
    }

    if (cached && (cached.filtersSignature !== filtersSignature || cached.jobs.length === 0)) {
      clearJobsPageCache();
    }

    requestVersionRef.current += 1;
    isFetchingRef.current = false;
    nextSkipRef.current = 0;
    hasMoreRef.current = true;
    setJobs([]);
    setSavedJobsMap({});
    setTotalJobs(null);
    cacheReadyRef.current = true;
    void loadJobs(true, requestVersionRef.current);
  }, [filtersSignature, loadJobs]);

  useEffect(() => {
    persistJobsCache();
  }, [jobs, savedJobsMap, persistJobsCache]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollSaveTimeoutRef.current !== null) return;

      scrollSaveTimeoutRef.current = window.setTimeout(() => {
        scrollSaveTimeoutRef.current = null;
        persistJobsCache(window.scrollY);
      }, 120);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (scrollSaveTimeoutRef.current !== null) {
        window.clearTimeout(scrollSaveTimeoutRef.current);
        scrollSaveTimeoutRef.current = null;
      }
      persistJobsCache(window.scrollY);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [persistJobsCache]);

  useEffect(() => {
    const sentinelNode = sentinelRef.current;
    if (!sentinelNode || isInitialLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadJobs(false, requestVersionRef.current);
        }
      },
      {
        root: null,
        rootMargin: '280px 0px 280px 0px',
      }
    );

    observer.observe(sentinelNode);

    return () => {
      observer.disconnect();
    };
  }, [isInitialLoading, loadJobs, jobs.length]);

  useEffect(() => {
    if (!applyToast) return undefined;

    const timer = window.setTimeout(() => {
      setApplyToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [applyToast]);

  const handleRetry = () => {
    clearJobsPageCache();
    requestVersionRef.current += 1;
    isFetchingRef.current = false;
    nextSkipRef.current = 0;
    hasMoreRef.current = true;
    setJobs([]);
    setTotalJobs(null);
    void loadJobs(true, requestVersionRef.current);
  };

  const handleOpenJobDetail = (jobId: string) => {
    persistJobsCache(window.scrollY);
    navigate(`/jobs/${jobId}`);
  };

  const displayedJobsCount = totalJobs ?? jobs.length;

  useEffect(() => {
    onJobsCountChange?.(displayedJobsCount);
  }, [displayedJobsCount, onJobsCountChange]);

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
          onClick={handleRetry}
          className="bg-[#FF6934] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {applyToast && (
        <div className={`fixed top-4 right-4 z-[140] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
          applyToast.type === 'error'
            ? 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
            : 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
        }`}>
          {applyToast.message}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h2 className="text-[24px] font-semibold text-gray-900">{displayedJobsCount} jobs found</h2>
        <div className="lg:mt-0 flex items-center justify-between lg:justify-end gap-3">
          <div className="relative w-[160px] md:w-[200px] lg:w-full lg:max-w-[220px]">
            <div className="h-[40px] md:h-[50px] lg:h-10 w-fit rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[14px] md:text-[16px] lg:text-[14px] font-medium text-[#475467] flex items-center gap-2 focus-within:outline-none focus-within:ring-2 focus-within:ring-[#FF6934]/20">
              <span className="pointer-events-none text-[#475467]">{activeSortOption.label}</span>
              <ChevronDown size={20} className="pointer-events-none text-[#475467]" />
              <select
                aria-label="Sort jobs"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as CandidateJobsSortBy)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              >
                {JOB_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenFilters?.()}
            className="lg:hidden h-[40px] md:h-[50px] w-[110px] md:w-[120px] rounded-[10px] border border-[#E5E7EB] bg-white text-[#344054] text-[14px] md:text-[16px] font-medium flex items-center justify-center gap-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <Filter size={18} className="text-[#475467]" />
            <span className="leading-none">Filters</span>
          </button>
        </div>
      </div>

      {errorMessage && jobs.length > 0 && (
        <div className="text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-[10px] px-4 py-3">
          {errorMessage}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-[#475467]">
          No jobs found right now.
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => handleOpenJobDetail(job.id)}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="size-10 bg-[#F2F4F7] border border-gray-200 rounded-[10px] flex items-center justify-center font-semibold text-[14px] text-gray-700 shrink-0">
                    {job.initial}
                  </div>
                  <div>
                    <h3 className="text-[18px] font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{job.company}</p>
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

              <div className="flex flex-wrap gap-2 mt-4">
                {job.tags.map((tag, index) => (
                  <span key={`${job.id}-tag-${index}`} className="bg-[#F2F4F7] border border-gray-200 text-[#475467] text-sm font-regular px-2.5 py-1.5 rounded-[10px]">
                    {tag}
                  </span>
                ))}
              </div>

              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-sm font-semibold mt-4 w-fit ${job.matchColor === 'green' ? 'bg-[#12B76A15] text-[#12B76A]' : 'bg-orange-50 text-[#FF6934]'}`}>
                <Target size={14} /> {job.match}% Match
              </div>

              <p className="text-[14px] text-[#475467] mt-4 leading-relaxed font-regular">
                {job.description}
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mt-6 pt-3 border-t border-gray-200">
                <span className="text-[12px] text-gray-400 font-[400] whitespace-nowrap">{job.posted}</span>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button className="flex-1 sm:flex-none justify-center border border-gray-200 bg-white px-4 py-2 rounded-[10px] text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                    View Job
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJob(job);
                    }}
                    className="flex-1 sm:flex-none justify-center bg-[#FF6934] text-white px-4 py-2 rounded-[10px] text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Quick Apply
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
          Fetching next jobs...
        </div>
      )}

      <div ref={sentinelRef} className="h-1" aria-hidden="true"></div>

      <QuickApplyModal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        job={selectedJob}
        onApplySuccess={() => setApplyToast({ id: Date.now(), message: 'Applied successfully.', type: 'success' })}
        onApplyError={(message) => setApplyToast({ id: Date.now(), message, type: 'error' })}
      />
    </div>
  );
}
