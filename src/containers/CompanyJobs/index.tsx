import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import CompanyHero from '../CompanyProfile/components/CompanyHero';
import CompanyJobsView from './components/CompanyJobsView';

export default function CompanyJobs() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen font-manrope">

      {/* Back Navigation */}
      <button
        type="button"
        onClick={() => navigate(`/company/${id || ''}`)}
        className="flex items-center gap-2 text-[14px] font-medium text-[#475467] hover:text-[#101828] transition-colors cursor-pointer group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Back to company overview
      </button>

      {/* Hero */}
      <CompanyHero onViewJobs={() => {}} activeTab="jobs" />

      {/* Jobs View (Search Bar + Grid) */}
      <div className="animate-in slide-in-from-bottom-4 duration-500">
        <CompanyJobsView />
      </div>
    </div>
  );
}
