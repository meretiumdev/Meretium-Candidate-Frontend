import { useState } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import FiltersSidebar from './components/FiltersSidebar';
import JobList from './components/JobList';
import CreateJobAlertModal from '../../components/CreateJobAlertModal';

export default function JobsPage() {
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">
      <Header onCreateAlert={() => setIsAlertModalOpen(true)} />
      <Tabs />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Filters (Hidden on small screens by default but we can leave it blocks for now, or just hide it) */}
        <div className="hidden lg:block lg:col-span-1">
          <FiltersSidebar />
        </div>

        {/* Right Column: Jobs */}
        <div className="lg:col-span-3">
          <JobList />
        </div>
      </div>

      <CreateJobAlertModal 
        isOpen={isAlertModalOpen} 
        onClose={() => setIsAlertModalOpen(false)} 
      />
    </div>
  );
}
