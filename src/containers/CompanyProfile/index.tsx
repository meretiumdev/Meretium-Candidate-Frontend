import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CompanyHero from './components/CompanyHero';
import AboutSection from './components/AboutSection';
import CompanyOverview from './components/CompanyOverview';
import OpenPositions from './components/OpenPositions';
import CompanySidebar from './components/CompanySidebar';

import { useState } from 'react';
import CompanyJobsView from './components/CompanyJobsView';

export default function CompanyProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs'>('overview');

  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen font-manrope">

      {/* Back Navigation */}
      <button
        type="button"
        onClick={() => {
          if (activeTab === 'jobs') {
            setActiveTab('overview');
          } else {
            navigate(-1);
          }
        }}
        className="flex items-center gap-2 text-[14px] font-medium text-[#475467] hover:text-[#101828] transition-colors cursor-pointer group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        {activeTab === 'jobs' ? 'Back to company overview' : 'Back to job details'}
      </button>

      {/* Hero - pass function to switch to jobs view */}
      <CompanyHero onViewJobs={() => setActiveTab('jobs')} activeTab={activeTab} />

      {activeTab === 'overview' ? (
        /* Overview View (Stats, About, Sideber) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-500">
          {/* Left Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <AboutSection />
            <CompanyOverview />
            <OpenPositions onViewAll={() => setActiveTab('jobs')} />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4">
            <CompanySidebar onViewJobs={() => setActiveTab('jobs')} />
          </div>
        </div>
      ) : (
        /* Jobs View (Search Bar + Grid) */
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <CompanyJobsView />
        </div>
      )}
    </div>
  );
}
