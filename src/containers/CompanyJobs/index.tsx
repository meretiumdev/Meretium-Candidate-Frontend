import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import type { RootState } from '../../redux/store';
import { getCandidateCompanyDetail, type CandidateCompanyDetail } from '../../services/companyApi';
import CompanyHero from '../CompanyProfile/components/CompanyHero';
import CompanyJobsView from './components/CompanyJobsView';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to load company details. Please try again.';
}

export default function CompanyJobs() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [company, setCompany] = useState<CandidateCompanyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestVersionRef = useRef(0);

  const loadCompany = useCallback(async () => {
    const companyId = id.trim();
    const requestVersion = ++requestVersionRef.current;

    if (!companyId) {
      setCompany(null);
      setErrorMessage('Invalid company id.');
      setIsLoading(false);
      return;
    }

    if (!accessToken?.trim()) {
      setCompany(null);
      setErrorMessage('You are not authenticated. Please log in again.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getCandidateCompanyDetail(accessToken, companyId);
      if (requestVersion !== requestVersionRef.current) return;
      setCompany(response);
    } catch (error: unknown) {
      if (requestVersion !== requestVersionRef.current) return;
      setCompany(null);
      setErrorMessage(getErrorMessage(error));
    } finally {
      if (requestVersion !== requestVersionRef.current) return;
      setIsLoading(false);
    }
  }, [accessToken, id]);

  useEffect(() => {
    void loadCompany();
  }, [loadCompany]);

  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen font-manrope">
      <button
        type="button"
        onClick={() => navigate(`/company/${id || ''}`)}
        className="flex items-center gap-2 text-[14px] font-medium text-[#475467] hover:text-[#101828] transition-colors cursor-pointer group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Back to company overview
      </button>

      {isLoading && !company ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-center gap-3 text-[14px] text-[#475467]">
          <Loader2 size={18} className="animate-spin text-[#FF6934]" />
          Loading company jobs...
        </div>
      ) : errorMessage && !company ? (
        <div className="bg-white border border-[#FDA29B] rounded-xl p-6">
          <p className="text-[#B42318] text-[14px] font-medium mb-4">{errorMessage}</p>
          <button
            type="button"
            onClick={() => { void loadCompany(); }}
            className="bg-[#FF6934] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <CompanyHero onViewJobs={() => {}} activeTab="jobs" company={company} />

          {errorMessage && (
            <div className="text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-[10px] px-4 py-3">
              {errorMessage}
            </div>
          )}

          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <CompanyJobsView companyId={id} companyName={company?.name || 'this company'} />
          </div>
        </>
      )}
    </div>
  );
}
