import { useEffect, useState } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import FiltersSidebar from './components/FiltersSidebar';
import JobList from './components/JobList';
import RecommendedJobs from '../Dashboard/components/RecommendedJobs';
import QuickApplyModal from '../../components/QuickApplyModal';
import type { QuickApplyModalJob } from '../../components/QuickApplyModal';
import CreateJobAlertModal from '../../components/CreateJobAlertModal';
import { DEFAULT_JOBS_FILTERS, type JobsFilters } from './types';

export default function JobsPage() {
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'recommended'>('all');
  const [filters, setFilters] = useState<JobsFilters>(DEFAULT_JOBS_FILTERS);
  const [allJobsCount, setAllJobsCount] = useState(0);
  const [selectedJob, setSelectedJob] = useState<QuickApplyModalJob | null>(null);
  const [isQuickApplyOpen, setIsQuickApplyOpen] = useState(false);
  const [applyToast, setApplyToast] = useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null);
  const [alertToast, setAlertToast] = useState<{ id: number; message: string } | null>(null);

  const handleQuickApply = (job: QuickApplyModalJob) => {
    setSelectedJob(job);
    setIsQuickApplyOpen(true);
  };

  useEffect(() => {
    if (!isMobileFiltersOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileFiltersOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMobileFiltersOpen(false);
      }
    };

    if (mediaQuery.matches) {
      setIsMobileFiltersOpen(false);
    }

    mediaQuery.addEventListener('change', handleDesktop);
    return () => {
      mediaQuery.removeEventListener('change', handleDesktop);
    };
  }, []);

  useEffect(() => {
    if (!alertToast) return undefined;

    const timer = window.setTimeout(() => {
      setAlertToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [alertToast]);

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
    if (activeTab !== 'recommended') return;
    setIsMobileFiltersOpen(false);
  }, [activeTab]);

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

      {alertToast && (
        <div className="fixed top-4 right-4 z-[140] max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]">
          {alertToast.message}
        </div>
      )}

      <Header onCreateAlert={() => setIsAlertModalOpen(true)} />
      <Tabs
        allJobsCount={allJobsCount}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'all' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Column: Filters (Hidden on small screens by default but we can leave it blocks for now, or just hide it) */}
          <div className="hidden lg:block lg:col-span-1">
            <FiltersSidebar filters={filters} onChange={setFilters} />
          </div>

          {/* Right Column: Jobs */}
          <div className="lg:col-span-3">
            <JobList
              filters={filters}
              onOpenFilters={() => setIsMobileFiltersOpen(true)}
              onJobsCountChange={setAllJobsCount}
            />
          </div>
        </div>
      ) : (
        <RecommendedJobs onQuickApply={handleQuickApply} />
      )}

      {isMobileFiltersOpen && activeTab === 'all' && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileFiltersOpen(false)}
            aria-label="Close filters"
          />
          <aside className="absolute inset-y-0 left-0 w-[84vw] max-w-[340px] bg-white shadow-2xl">
            <FiltersSidebar
              filters={filters}
              onChange={setFilters}
              mode="drawer"
              onClose={() => setIsMobileFiltersOpen(false)}
            />
          </aside>
        </div>
      )}

      <CreateJobAlertModal 
        isOpen={isAlertModalOpen} 
        onClose={() => setIsAlertModalOpen(false)}
        onCreated={(jobRole) => setAlertToast({ id: Date.now(), message: `Job alert created for ${jobRole}.` })}
      />

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
