import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import type { RootState } from '../../redux/store';
import {
  getCandidateCompanyDetail,
  getCandidateCompanyJobs,
  type CandidateCompanyDetail,
  type CandidateCompanyJobItem,
} from '../../services/companyApi';
import AboutSection from './components/AboutSection';
import CompanyHero from './components/CompanyHero';
import CompanyOverview from './components/CompanyOverview';
import CompanySidebar from './components/CompanySidebar';
import OpenPositions from './components/OpenPositions';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to load company profile. Please try again.';
}

export default function CompanyProfile() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [company, setCompany] = useState<CandidateCompanyDetail | null>(null);
  const [openJobs, setOpenJobs] = useState<CandidateCompanyJobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestVersionRef = useRef(0);

  const loadCompanyProfile = useCallback(async () => {
    const companyId = id.trim();
    const requestVersion = ++requestVersionRef.current;

    if (!companyId) {
      setCompany(null);
      setOpenJobs([]);
      setErrorMessage('Invalid company id.');
      setIsLoading(false);
      return;
    }

    if (!accessToken?.trim()) {
      setCompany(null);
      setOpenJobs([]);
      setErrorMessage('You are not authenticated. Please log in again.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [companyResponse, jobsResponse] = await Promise.all([
        getCandidateCompanyDetail(accessToken, companyId),
        getCandidateCompanyJobs(accessToken, companyId, {
          skip: 0,
          limit: 3,
          status: 'ACTIVE',
          sort_by: 'most_recent',
        }),
      ]);

      if (requestVersion !== requestVersionRef.current) return;

      setCompany(companyResponse);
      setOpenJobs(jobsResponse.items);
    } catch (error: unknown) {
      if (requestVersion !== requestVersionRef.current) return;
      setCompany(null);
      setOpenJobs([]);
      setErrorMessage(getErrorMessage(error));
    } finally {
      if (requestVersion !== requestVersionRef.current) return;
      setIsLoading(false);
    }
  }, [accessToken, id]);

  useEffect(() => {
    void loadCompanyProfile();
  }, [loadCompanyProfile]);

  const goToJobs = () => {
    const companyId = (company?.id || id).trim();
    if (!companyId) return;
    navigate(`/company/${companyId}/jobs`);
  };

  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen font-manrope">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[14px] font-medium text-[#475467] hover:text-[#101828] transition-colors cursor-pointer group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Back to job details
      </button>

      {isLoading && !company ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-center gap-3 text-[14px] text-[#475467]">
          <Loader2 size={18} className="animate-spin text-[#FF6934]" />
          Loading company profile...
        </div>
      ) : errorMessage && !company ? (
        <div className="bg-white border border-[#FDA29B] rounded-xl p-6">
          <p className="text-[#B42318] text-[14px] font-medium mb-4">{errorMessage}</p>
          <button
            type="button"
            onClick={() => { void loadCompanyProfile(); }}
            className="bg-[#FF6934] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <CompanyHero onViewJobs={goToJobs} activeTab="overview" company={company} />

          {errorMessage && (
            <div className="text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-[10px] px-4 py-3">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-500">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <AboutSection company={company} onViewJobs={goToJobs} />
              <CompanyOverview company={company} />
              <OpenPositions jobs={openJobs} companyName={company?.name || 'this company'} onViewAll={goToJobs} />
            </div>

            <div className="lg:col-span-4">
              <CompanySidebar company={company} onViewJobs={goToJobs} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
