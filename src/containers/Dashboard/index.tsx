import { useState } from 'react';
import Header from './components/Header';
import ProfileCompletion from './components/ProfileCompletion';
import ApplicationPipeline from './components/ApplicationPipeline';
import RecommendedJobs from './components/RecommendedJobs';
import JobAlerts from './components/JobAlerts';
import QuickApplyModal from '../../components/QuickApplyModal';

export default function MainDashboard() {
  const [isQuickApplyOpen, setIsQuickApplyOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const handleQuickApply = (job: any) => {
    setSelectedJob(job);
    setIsQuickApplyOpen(true);
  };

  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">

      {/* Header */}
      <Header />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <ProfileCompletion />
          <ApplicationPipeline />
          <RecommendedJobs onQuickApply={handleQuickApply} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4">
          <JobAlerts />
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
