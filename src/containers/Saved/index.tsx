import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import StatCards from './components/StatCards';
import StatusTabs from './components/StatusTabs';
import SavedJobList from './components/SavedJobList';
import { deleteCandidateSavedJob, getCandidateSavedJobs, type CandidateSavedJobItem } from '../../services/jobsApi';
import type { RootState } from '../../redux/store';
import type { SavedJobListItem, SavedSortOption, SavedStatusFilter, SavedUiStats } from './types';

const PAGE_SIZE = 10;

const DEFAULT_STATS: SavedUiStats = {
  total: 0,
  active: 0,
  applied: 0,
  closed: 0,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to load saved jobs. Please try again.';
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

function formatSavedAtLabel(savedAt: string): string {
  if (!savedAt) return 'Saved recently';

  const savedDate = new Date(savedAt);
  if (Number.isNaN(savedDate.getTime())) return 'Saved recently';

  const now = Date.now();
  const diffMs = Math.max(0, now - savedDate.getTime());
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / dayMs);

  if (days <= 0) return 'Saved today';
  if (days === 1) return 'Saved 1 day ago';
  if (days < 7) return `Saved ${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'Saved 1 week ago';
  if (weeks < 5) return `Saved ${weeks} weeks ago`;

  const months = Math.floor(days / 30);
  if (months <= 1) return 'Saved 1 month ago';
  return `Saved ${months} months ago`;
}

function normalizeSavedStatus(item: CandidateSavedJobItem): SavedStatusFilter | string {
  if (item.is_applied) return 'APPLIED';

  const status = item.job_status_snapshot.trim().toUpperCase();
  if (status === 'ACTIVE' || status === 'APPLIED' || status === 'CLOSED') {
    return status;
  }
  return status || 'ACTIVE';
}

function toStatusLabel(statusCode: string): string {
  if (statusCode === 'ACTIVE') return 'Active';
  if (statusCode === 'APPLIED') return 'Applied';
  if (statusCode === 'CLOSED') return 'Closed';
  return statusCode
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function mapSavedJob(item: CandidateSavedJobItem): SavedJobListItem {
  const statusCode = normalizeSavedStatus(item);

  return {
    id: item.id,
    jobId: item.job_id,
    title: item.job_title_snapshot || 'Untitled role',
    company: item.company_name_snapshot || 'Unknown company',
    location: item.location_snapshot || 'Location not specified',
    salary: formatSalary(item.salary_min_snapshot, item.salary_max_snapshot, item.currency_snapshot),
    savedAtLabel: formatSavedAtLabel(item.saved_at),
    savedAtRaw: item.saved_at,
    statusCode,
    statusLabel: toStatusLabel(statusCode),
    isApplied: item.is_applied,
    isClosed: statusCode === 'CLOSED',
  };
}

export default function Saved() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [activeStatus, setActiveStatus] = useState<SavedStatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<SavedSortOption>('recently_saved');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<SavedUiStats>(DEFAULT_STATS);
  const [jobs, setJobs] = useState<SavedJobListItem[]>([]);
  const [removingIds, setRemovingIds] = useState<Record<string, boolean>>({});
  const [totalSavedJobs, setTotalSavedJobs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(Math.max(0, totalSavedJobs) / PAGE_SIZE)),
    [totalSavedJobs]
  );

  const loadSavedJobs = useCallback(async () => {
    if (!accessToken?.trim()) {
      setErrorMessage('You are not authenticated. Please log in again.');
      setJobs([]);
      setStats(DEFAULT_STATS);
      setTotalSavedJobs(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getCandidateSavedJobs(accessToken, {
        page: currentPage,
        page_size: PAGE_SIZE,
        sort_by: sortBy,
        status: activeStatus === 'ALL' ? null : activeStatus,
      });

      setJobs(response.jobs.map(mapSavedJob));
      setStats({
        total: response.stats.total,
        active: response.stats.active,
        applied: response.stats.applied,
        closed: response.stats.closed,
      });
      setTotalSavedJobs(response.total);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
      setJobs([]);
      setTotalSavedJobs(0);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeStatus, currentPage, sortBy]);

  useEffect(() => {
    void loadSavedJobs();
  }, [loadSavedJobs]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleStatusChange = (status: SavedStatusFilter) => {
    setActiveStatus(status);
    setCurrentPage(1);
  };

  const handleSortChange = (value: SavedSortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    if (clamped !== currentPage) {
      setCurrentPage(clamped);
    }
  };

  const handleRetry = () => {
    void loadSavedJobs();
  };

  const handleRemoveSaved = useCallback(async (job: SavedJobListItem) => {
    if (!accessToken?.trim()) {
      throw new Error('You are not authenticated. Please log in again.');
    }

    setRemovingIds((prev) => ({ ...prev, [job.id]: true }));
    try {
      await deleteCandidateSavedJob(accessToken, job.jobId);
      await loadSavedJobs();
    } finally {
      setRemovingIds((prev) => ({ ...prev, [job.id]: false }));
    }
  }, [accessToken, loadSavedJobs]);

  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">
      <Header sortBy={sortBy} onSortChange={handleSortChange} disabled={isLoading} />
      <StatCards stats={stats} />
      <StatusTabs activeStatus={activeStatus} stats={stats} onChange={handleStatusChange} disabled={isLoading} />
      <SavedJobList
        jobs={jobs}
        isLoading={isLoading}
        errorMessage={errorMessage}
        currentPage={currentPage}
        totalPages={totalPages}
        onRetry={handleRetry}
        onPageChange={handlePageChange}
        removingIds={removingIds}
        onRemoveSaved={handleRemoveSaved}
      />
    </div>
  );
}
