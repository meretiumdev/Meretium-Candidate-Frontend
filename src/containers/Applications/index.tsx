import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import StatCards from './components/StatCards';
import StatusTabs from './components/StatusTabs';
import ApplicationsList from './components/ApplicationsList';
import {
  getCandidateApplications,
  type CandidateApplicationItem,
  type CandidateApplicationStatus,
  type CandidateApplicationsSortBy,
} from '../../services/applicationsApi';
import type { RootState } from '../../redux/store';
import type { ApplicationListItem, ApplicationsUiStats, ApplicationStatusFilter } from './types';

const PAGE_LIMIT = 10;

const DEFAULT_STATS: ApplicationsUiStats = {
  total: 0,
  applied: 0,
  inReview: 0,
  interview: 0,
  offered: 0,
  hired: 0,
  rejected: 0,
};

const STATUS_META: Record<CandidateApplicationStatus, {
  label: string;
  stage: number;
  showProgress: boolean;
  statusColor: string;
}> = {
  APPLIED: {
    label: 'Applied',
    stage: 1,
    showProgress: true,
    statusColor: 'bg-gray-50 text-gray-600 border border-gray-100',
  },
  IN_REVIEW: {
    label: 'In Review',
    stage: 2,
    showProgress: true,
    statusColor: 'bg-blue-50 text-blue-600',
  },
  INTERVIEW: {
    label: 'Interview',
    stage: 3,
    showProgress: true,
    statusColor: 'bg-purple-50 text-purple-600',
  },
  OFFERED: {
    label: 'Offered',
    stage: 4,
    showProgress: true,
    statusColor: 'bg-green-100 text-green-700',
  },
  HIRED: {
    label: 'Hired',
    stage: 4,
    showProgress: true,
    statusColor: 'bg-green-50 text-green-700',
  },
  REJECTED: {
    label: 'Rejected',
    stage: 0,
    showProgress: false,
    statusColor: 'bg-red-50 text-red-600',
  },
};

function isCandidateApplicationStatus(value: string): value is CandidateApplicationStatus {
  return value === 'APPLIED'
    || value === 'IN_REVIEW'
    || value === 'INTERVIEW'
    || value === 'OFFERED'
    || value === 'HIRED'
    || value === 'REJECTED';
}

function toTitleCase(input: string): string {
  if (!input) return 'Unknown';

  return input
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatAppliedDate(appliedAt: string): string {
  if (!appliedAt) return 'Applied recently';

  const appliedDate = new Date(appliedAt);
  if (Number.isNaN(appliedDate.getTime())) return 'Applied recently';

  const now = Date.now();
  const diffMs = Math.max(0, now - appliedDate.getTime());
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / dayMs);

  if (days <= 0) return 'Applied today';
  if (days === 1) return 'Applied 1 day ago';
  if (days < 7) return `Applied ${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'Applied 1 week ago';
  if (weeks < 5) return `Applied ${weeks} weeks ago`;

  const months = Math.floor(days / 30);
  if (months <= 1) return 'Applied 1 month ago';
  return `Applied ${months} months ago`;
}

function mapApplicationItem(item: CandidateApplicationItem): ApplicationListItem {
  const rawStatus = item.status.trim().toUpperCase();

  const statusMeta = isCandidateApplicationStatus(rawStatus)
    ? STATUS_META[rawStatus]
    : {
      label: toTitleCase(rawStatus),
      stage: 1,
      showProgress: true,
      statusColor: 'bg-gray-50 text-gray-600 border border-gray-100',
    };

  return {
    id: item.id,
    title: item.job_title_snapshot || 'Untitled role',
    company: item.company_name_snapshot || 'Unknown company',
    location: item.location_snapshot || 'Location not specified',
    appliedAtLabel: formatAppliedDate(item.applied_at),
    appliedAtRaw: item.applied_at,
    stage: statusMeta.stage,
    status: statusMeta.label,
    statusCode: rawStatus,
    statusColor: statusMeta.statusColor,
    showProgress: statusMeta.showProgress,
    coverLetter: item.cover_letter,
    screeningAnswers: item.screening_answers.map((answer) => ({
      questionText: answer.question_text,
      answer: answer.answer === null ? '' : String(answer.answer),
    })),
    statusHistory: item.status_history.map((entry) => ({
      status: entry.status,
      changedAt: entry.changed_at,
    })),
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to load applications. Please try again.';
}

function getNotificationOpenApplicationId(state: unknown): string | null {
  if (typeof state !== 'object' || state === null) return null;

  const value = (state as { openApplicationId?: unknown }).openApplicationId;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function Applications() {
  const location = useLocation();
  const navigate = useNavigate();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [activeStatus, setActiveStatus] = useState<ApplicationStatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<CandidateApplicationsSortBy>('recently_applied');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<ApplicationsUiStats>(DEFAULT_STATS);
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [externalOpenApplicationId, setExternalOpenApplicationId] = useState<string | null>(
    () => getNotificationOpenApplicationId(location.state)
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(Math.max(0, totalApplications) / PAGE_LIMIT)),
    [totalApplications]
  );

  const loadApplications = useCallback(async () => {
    if (!accessToken?.trim()) {
      setErrorMessage('You are not authenticated. Please log in again.');
      setApplications([]);
      setStats(DEFAULT_STATS);
      setTotalApplications(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const skip = (currentPage - 1) * PAGE_LIMIT;
      const response = await getCandidateApplications(accessToken, {
        skip,
        limit: PAGE_LIMIT,
        application_status: activeStatus === 'ALL' ? null : activeStatus,
        sort_by: sortBy,
      });

      setApplications(response.applications.map(mapApplicationItem));
      setStats({
        total: response.stats.total,
        applied: response.stats.applied,
        inReview: response.stats.in_review,
        interview: response.stats.interview,
        offered: response.stats.offered,
        hired: response.stats.hired,
        rejected: response.stats.rejected,
      });
      setTotalApplications(response.total);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
      setApplications([]);
      setTotalApplications(0);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeStatus, currentPage, sortBy]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setExternalOpenApplicationId(getNotificationOpenApplicationId(location.state));
  }, [location.state]);

  const handleStatusChange = (status: ApplicationStatusFilter) => {
    setActiveStatus(status);
    setCurrentPage(1);
  };

  const handleSortChange = (value: CandidateApplicationsSortBy) => {
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
    void loadApplications();
  };

  const handleExternalOpenHandled = () => {
    setExternalOpenApplicationId(null);
    navigate(location.pathname, { replace: true, state: null });
  };

  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">
      <Header sortBy={sortBy} onSortChange={handleSortChange} disabled={isLoading} />
      <StatCards stats={stats} />
      <StatusTabs activeStatus={activeStatus} stats={stats} onChange={handleStatusChange} />
      <ApplicationsList
        applications={applications}
        accessToken={accessToken}
        isLoading={isLoading}
        errorMessage={errorMessage}
        currentPage={currentPage}
        totalPages={totalPages}
        externalOpenApplicationId={externalOpenApplicationId}
        onExternalOpenHandled={handleExternalOpenHandled}
        onRetry={handleRetry}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
