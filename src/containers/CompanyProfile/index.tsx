import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import CompanyHero from './components/CompanyHero';
import AboutSection from './components/AboutSection';
import CompanyOverview from './components/CompanyOverview';
import OpenPositions from './components/OpenPositions';
import CompanySidebar from './components/CompanySidebar';

export default function CompanyProfile() {
  const navigate = useNavigate();
  const { id = 'notion' } = useParams(); // Defaulting for visual consistency

  const goToJobs = () => navigate(`/company/${id}/jobs`);

  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen font-manrope">

      {/* Back Navigation */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[14px] font-medium text-[#475467] hover:text-[#101828] transition-colors cursor-pointer group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Back to job details
      </button>

      {/* Hero - pass function to navigate to jobs view */}
      <CompanyHero onViewJobs={goToJobs} activeTab="overview" />

      {/* Overview View (Stats, About, Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-500">
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <AboutSection />
          <CompanyOverview />
          <OpenPositions onViewAll={goToJobs} />
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4">
          <CompanySidebar onViewJobs={goToJobs} />
        </div>
      </div>
    </div>
  );
}
