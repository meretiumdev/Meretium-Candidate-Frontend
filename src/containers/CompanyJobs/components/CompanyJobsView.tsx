import { ChevronRight, Loader2, MapPin } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import QuickApplyModal, { type QuickApplyModalJob } from '../../../components/QuickApplyModal';
import type { RootState } from '../../../redux/store';
import {
  getCandidateCompanyJobs,
  type CandidateCompanyJobItem,
} from '../../../services/companyApi';
import { formatJobTypeLabel } from '../../../utils/formatJobTypeLabel';
import JobFilters, { type CompanyJobsFiltersState } from './JobFilters';

const PAGE_LIMIT = 10;

interface CompanyJobsViewProps {
  companyId: string;
  companyName: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to load jobs. Please try again.';
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

function formatSalary(job: CandidateCompanyJobItem): string {
  if (job.min_salary !== null && job.max_salary !== null) {
    return `${formatCurrencyAmount(job.min_salary, job.currency)} - ${formatCurrencyAmount(job.max_salary, job.currency)}`;
  }

  if (job.min_salary !== null) {
    return `${formatCurrencyAmount(job.min_salary, job.currency)}+`;
  }

  if (job.max_salary !== null) {
    return `Up to ${formatCurrencyAmount(job.max_salary, job.currency)}`;
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

function statusBadgeClass(status: CandidateCompanyJobItem['status']): string {
  if (status === 'ACTIVE') return 'bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]';
  if (status === 'CLOSED') return 'bg-[#FEF3F2] text-[#B42318] border-[#FDA29B]';
  return 'bg-[#F2F4F7] text-[#475467] border-[#D0D5DD]';
}

export default function CompanyJobsView({ companyId, companyName }: CompanyJobsViewProps) {
  const navigate = useNavigate();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [filters, setFilters] = useState<CompanyJobsFiltersState>({
    search: '',
    status: 'ALL',
    sortBy: 'most_relevant',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [jobs, setJobs] = useState<CandidateCompanyJobItem[]>([]);
  const [selectedJob, setSelectedJob] = useState<QuickApplyModalJob | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [applyToast, setApplyToast] = useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null);

  const nextSkipRef = useRef(0);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);
  const requestVersionRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filters.search]);

  const querySignature = useMemo(() => {
    return JSON.stringify({
      companyId,
      search: debouncedSearch,
      status: filters.status,
      sortBy: filters.sortBy,
    });
  }, [companyId, debouncedSearch, filters.sortBy, filters.status]);

  const loadJobs = useCallback(async (reset: boolean, requestVersion = requestVersionRef.current) => {
    if (isFetchingRef.current && !reset) return;

    const trimmedCompanyId = companyId.trim();
    if (!trimmedCompanyId) {
      if (requestVersion !== requestVersionRef.current) return;
      setErrorMessage('Invalid company id.');
      setJobs([]);
      setTotalJobs(0);
      setIsInitialLoading(false);
      setIsLoadingMore(false);
      setHasMore(false);
      hasMoreRef.current = false;
      return;
    }

    if (!accessToken?.trim()) {
      if (requestVersion !== requestVersionRef.current) return;
      setErrorMessage('You are not authenticated. Please log in again.');
      setJobs([]);
      setTotalJobs(0);
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

    const requestSkip = reset ? 0 : nextSkipRef.current;

    try {
      const response = await getCandidateCompanyJobs(accessToken, trimmedCompanyId, {
        skip: requestSkip,
        limit: PAGE_LIMIT,
        search: debouncedSearch || null,
        status: filters.status === 'ALL' ? null : filters.status,
        sort_by: filters.sortBy,
      });

      if (requestVersion !== requestVersionRef.current) return;

      const nextItems = response.items;
      setJobs((prev) => (reset ? nextItems : [...prev, ...nextItems]));

      if (typeof response.total === 'number') {
        setTotalJobs(response.total);
      } else {
        setTotalJobs((prev) => Math.max(prev ?? 0, requestSkip + nextItems.length));
      }

      const nextSkip = requestSkip + nextItems.length;
      const nextHasMore = typeof response.total === 'number'
        ? nextSkip < response.total
        : nextItems.length === PAGE_LIMIT;

      nextSkipRef.current = nextSkip;
      hasMoreRef.current = nextHasMore;
      setHasMore(nextHasMore);
    } catch (error: unknown) {
      if (requestVersion !== requestVersionRef.current) return;
      setErrorMessage(getErrorMessage(error));
      hasMoreRef.current = false;
      setHasMore(false);
      if (reset) {
        setJobs([]);
        setTotalJobs(0);
      }
    } finally {
      if (requestVersion !== requestVersionRef.current) return;
      if (reset) setIsInitialLoading(false);
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [accessToken, companyId, debouncedSearch, filters.sortBy, filters.status]);

  useEffect(() => {
    requestVersionRef.current += 1;
    isFetchingRef.current = false;
    nextSkipRef.current = 0;
    hasMoreRef.current = true;
    setJobs([]);
    setTotalJobs(null);
    setHasMore(true);
    setErrorMessage(null);
    void loadJobs(true, requestVersionRef.current);
  }, [querySignature, loadJobs]);

  useEffect(() => {
    if (!applyToast) return undefined;

    const timer = window.setTimeout(() => {
      setApplyToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [applyToast]);

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

  const handleRetry = () => {
    requestVersionRef.current += 1;
    isFetchingRef.current = false;
    nextSkipRef.current = 0;
    hasMoreRef.current = true;
    setJobs([]);
    setTotalJobs(null);
    setHasMore(true);
    setErrorMessage(null);
    void loadJobs(true, requestVersionRef.current);
  };

  const displayedJobsCount = totalJobs ?? jobs.length;

  if (isInitialLoading && jobs.length === 0) {
    return (
      <div className="flex flex-col gap-6 mt-14 font-manrope">
        <JobFilters value={filters} onChange={setFilters} disabled />
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
      </div>
    );
  }

  if (errorMessage && jobs.length === 0) {
    return (
      <div className="flex flex-col gap-6 mt-14 font-manrope">
        <JobFilters value={filters} onChange={setFilters} />
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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mt-14 font-manrope">
      {applyToast && (
        <div className={`fixed top-4 right-4 z-[140] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
          applyToast.type === 'error'
            ? 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
            : 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
        }`}>
          {applyToast.message}
        </div>
      )}

      <JobFilters value={filters} onChange={setFilters} />

      <div className="bg-white border border-gray-200 rounded-[10px] p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h2 className="text-[20px] font-bold text-[#101828]">
            Open positions at {companyName || 'this company'}
          </h2>
          <span className="inline-flex items-center w-fit gap-1.5 text-[12px] font-medium text-[#475467] bg-[#F2F4F7] px-4 py-1.5 rounded-full">
            {displayedJobsCount} jobs
          </span>
        </div>

        {errorMessage && jobs.length > 0 && (
          <div className="text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-[10px] px-4 py-3 mb-6">
            {errorMessage}
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-[#475467]">
            No jobs found for the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => {
              const isClosed = job.status === 'CLOSED';

              return (
                <div
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="bg-white border border-[#E4E7EC] rounded-[10px] p-5 hover:border-[#FF6934] transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-[18px] font-semibold text-[#101828] group-hover:text-[#FF6934] transition-colors line-clamp-2">
                      {job.title || 'Untitled role'}
                    </h3>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusBadgeClass(job.status)}`}>
                      {job.status || 'OPEN'}
                    </span>
                  </div>

                  <div className="flex items-center gap-x-3 gap-y-1 text-[13px] md:text-[14px] text-[#475467] flex-wrap mb-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-[#475467]" />
                      {job.location || 'Location not specified'}
                    </div>
                    <span>|</span>
                    <span>{formatJobTypeLabel(job.job_type, 'Full-time')}</span>
                    <span>|</span>
                    <span className="text-[#12B76A] font-medium">{formatSalary(job)}</span>
                  </div>

                  {job.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.required_skills.slice(0, 3).map((skill) => (
                        <span key={`${job.id}-${skill}`} className="bg-[#F2F4F7] border border-gray-200 text-[#344054] text-xs font-medium px-3 py-1.5 rounded-[8px] shadow-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className="text-[12px] text-[#98A2B3]">{formatPostedLabel(job.posted_at)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/jobs/${job.id}`);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 text-[13px] font-medium text-[#344054] border border-gray-200 rounded-[10px] hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        View Job
                        <ChevronRight size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedJob({
                            id: job.id,
                            title: job.title,
                            company: job.company_name || companyName,
                            location: job.location,
                            job_type: job.job_type,
                          });
                        }}
                        disabled={isClosed}
                        className="px-3 py-2 text-[13px] font-medium text-white bg-[#FF6934] rounded-[10px] hover:opacity-90 transition-opacity cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Quick Apply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isLoadingMore && (
          <div className="flex items-center justify-center gap-2 text-sm text-[#475467] py-4">
            <Loader2 size={16} className="animate-spin text-[#FF6934]" />
            Fetching next jobs...
          </div>
        )}

        {!hasMore && jobs.length > 0 && (
          <p className="text-center text-[13px] text-[#98A2B3] pt-4">No more jobs</p>
        )}

        <div ref={sentinelRef} className="h-1" aria-hidden="true"></div>
      </div>

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
