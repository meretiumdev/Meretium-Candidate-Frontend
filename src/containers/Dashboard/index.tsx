import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import ProfileCompletion from './components/ProfileCompletion';
import ApplicationPipeline from './components/ApplicationPipeline';
import RecommendedJobs from './components/RecommendedJobs';
import JobAlerts from './components/JobAlerts';
import QuickApplyModal from '../../components/QuickApplyModal';
import type { RootState } from '../../redux/store';
import { getCandidateDashboard, type CandidateDashboardResponse } from '../../services/dashboardApi';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to load dashboard. Please try again.';
}

function DashboardCardSkeleton({ heightClass }: { heightClass: string }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm p-6 animate-pulse ${heightClass}`}>
      <div className="h-5 w-48 bg-gray-200 rounded-md mb-6"></div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-100 rounded-md"></div>
        <div className="h-4 w-[92%] bg-gray-100 rounded-md"></div>
        <div className="h-4 w-[80%] bg-gray-100 rounded-md"></div>
      </div>
    </div>
  );
}

export default function MainDashboard() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [isQuickApplyOpen, setIsQuickApplyOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<unknown>(null);
  const [dashboardData, setDashboardData] = useState<CandidateDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuickApply = (job: unknown) => {
    setSelectedJob(job);
    setIsQuickApplyOpen(true);
  };

  const loadDashboard = useCallback(async () => {
    if (!accessToken) {
      setErrorMessage('You are not authenticated. Please log in again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await getCandidateDashboard(accessToken);
      setDashboardData(response);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (!loading && (errorMessage || !dashboardData)) {
    return (
      <div className="max-w-full mx-auto px-2 sm:px-12 py-6 bg-[#F9FAFB] min-h-screen">
        <div className="bg-white border border-[#FDA29B] rounded-xl p-6">
          <p className="text-[#B42318] text-[14px] font-medium mb-4">{errorMessage || 'Failed to load dashboard.'}</p>
          <button
            onClick={() => {
              void loadDashboard();
            }}
            className="bg-[#FF6934] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const pipelineCounts = {
    applied: dashboardData?.pipeline_stats.applied ?? 0,
    underReview: dashboardData?.pipeline_stats.under_review ?? 0,
    interview: dashboardData?.pipeline_stats.interview ?? 0,
    offered: dashboardData?.pipeline_stats.offered ?? 0,
    rejected: dashboardData?.pipeline_stats.rejected ?? 0,
  };

  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">
      <Header interviewCount={pipelineCounts.interview} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {loading ? (
            <DashboardCardSkeleton heightClass="min-h-[240px]" />
          ) : (
            <ProfileCompletion
              profileStrength={dashboardData?.profile_strength}
              isCvUploaded={dashboardData?.onboarding.is_cv_uploaded}
              isSkillsAdded={dashboardData?.onboarding.is_skills_added}
              isExperienceAdded={dashboardData?.onboarding.is_experience_added}
            />
          )}

          {loading ? (
            <DashboardCardSkeleton heightClass="min-h-[190px]" />
          ) : (
            <ApplicationPipeline counts={pipelineCounts} />
          )}

          {loading ? (
            <DashboardCardSkeleton heightClass="min-h-[360px]" />
          ) : (
            <RecommendedJobs onQuickApply={handleQuickApply} />
          )}
        </div>

        <div className="lg:col-span-4">
          {loading ? <DashboardCardSkeleton heightClass="min-h-[420px]" /> : <JobAlerts />}
        </div>
      </div>

      <QuickApplyModal
        isOpen={isQuickApplyOpen}
        onClose={() => setIsQuickApplyOpen(false)}
        job={selectedJob}
      />
    </div>
  );
}
