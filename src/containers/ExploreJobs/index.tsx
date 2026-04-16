import { useEffect, useState } from 'react';
import Header from '../Dashboard/components/Header';
import ProfileCompleteBanner from './components/ProfileCompleteBanner';
import ApplicationPipeline from '../Dashboard/components/ApplicationPipeline';
import RecommendedJobs from '../Dashboard/components/RecommendedJobs';
import UpcomingInterviews from './components/UpcomingInterviews';
import RecruiterActivity from './components/RecruiterActivity';
import JobAlerts from './components/JobAlerts';
import QuickInsights from './components/QuickInsights';
import QuickApplyModal from '../../components/QuickApplyModal';
import type { QuickApplyModalJob } from '../../components/QuickApplyModal';

export default function ExploreJobs() {
  const [isQuickApplyOpen, setIsQuickApplyOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<QuickApplyModalJob | null>(null);
  const [applyToast, setApplyToast] = useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null);

  const handleQuickApply = (job: QuickApplyModalJob) => {
    setSelectedJob(job);
    setIsQuickApplyOpen(true);
  };

  useEffect(() => {
    if (!applyToast) return undefined;

    const timer = window.setTimeout(() => {
      setApplyToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [applyToast]);

  return (
       <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">
      {applyToast && (
        <div className={`fixed top-4 right-4 z-[140] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
          applyToast.type === 'error'
            ? 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
            : 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
        }`}>
          {applyToast.message}
        </div>
      )}


      {/* Full width Header entirely matching the screenshot */}
      <Header />

      {/* Main grid: 8 columns left, 4 columns right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <ProfileCompleteBanner />
          <ApplicationPipeline counts={{ applied: 12, underReview: 5, interview: 2, offered: 1, rejected: 3 }} />
          <RecommendedJobs onQuickApply={handleQuickApply} />
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <UpcomingInterviews />
          <RecruiterActivity />
          <JobAlerts />
          <QuickInsights />
        </div>

      </div>

      <QuickApplyModal 
        isOpen={isQuickApplyOpen} 
        onClose={() => setIsQuickApplyOpen(false)} 
        job={selectedJob}
        onApplySuccess={() => setApplyToast({ id: Date.now(), message: 'Applied successfully.', type: 'success' })}
        onApplyError={(message) => setApplyToast({ id: Date.now(), message, type: 'error' })}
      />
    </div>
  );
}
