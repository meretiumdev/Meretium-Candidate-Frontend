import { useEffect, useState } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import FiltersSidebar from './components/FiltersSidebar';
import JobList from './components/JobList';
import CreateJobAlertModal from '../../components/CreateJobAlertModal';
import { DEFAULT_JOBS_FILTERS, type JobsFilters } from './types';

export default function JobsPage() {
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<JobsFilters>(DEFAULT_JOBS_FILTERS);
  const [allJobsCount, setAllJobsCount] = useState(0);

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

  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">
      <Header onCreateAlert={() => setIsAlertModalOpen(true)} />
      <Tabs allJobsCount={allJobsCount} />

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

      {isMobileFiltersOpen && (
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
      />
    </div>
  );
}
