import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import Header from './components/Header';
import AboutCompany from './components/AboutCompany';
import JobDescription from './components/JobDescription';
import Responsibilities from './components/Responsibilities';
import Requirements from './components/Requirements';
import Benefits from './components/Benefits';
import SidebarActions from './components/SidebarActions';
import HowYouMatch from './components/HowYouMatch';
import { getCandidateJobDetail, type CandidateJobDetailResponse } from '../../services/jobsApi';
import type { RootState } from '../../redux/store';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to load job details.';
}

function DetailSkeletonCard({ heightClass }: { heightClass: string }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm animate-pulse ${heightClass}`}>
      <div className="h-6 w-56 bg-gray-200 rounded mb-5"></div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-100 rounded"></div>
        <div className="h-4 w-[92%] bg-gray-100 rounded"></div>
        <div className="h-4 w-[84%] bg-gray-100 rounded"></div>
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [job, setJob] = useState<CandidateJobDetailResponse | null>(null);
  const [liveMatchPercentage, setLiveMatchPercentage] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLiveMatchUpdated = useCallback((nextMatch: number | null) => {
    setLiveMatchPercentage((previousMatch) => {
      if (typeof nextMatch !== 'number') return nextMatch;
      const normalizedNextMatch = Math.max(0, Math.min(100, Math.round(nextMatch)));
      if (previousMatch === normalizedNextMatch) return previousMatch;
      return normalizedNextMatch;
    });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [id]);

  useEffect(() => {
    if (!id || !accessToken?.trim()) {
      setJob(null);
      setLiveMatchPercentage(null);
      setErrorMessage(null);
      setLoading(false);
      return;
    }

    let isActive = true;

    const loadJobDetail = async () => {
      setLoading(true);
      setJob(null);
      setLiveMatchPercentage(null);
      try {
        setErrorMessage(null);
        const response = await getCandidateJobDetail(accessToken, id);
        if (!isActive) return;
        setJob(response);
        if (typeof response.match_percentage === 'number') {
          setLiveMatchPercentage(Math.max(0, Math.min(100, Math.round(response.match_percentage))));
        }
      } catch (error: unknown) {
        if (!isActive) return;
        setErrorMessage(getErrorMessage(error));
      } finally {
        if (!isActive) return;
        setLoading(false);
      }
    };

    void loadJobDetail();

    return () => {
      isActive = false;
    };
  }, [accessToken, id]);

  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">
      {errorMessage && (
        <div className="bg-white border border-[#FDA29B] rounded-xl p-6">
          <p className="text-[#B42318] text-[14px] font-medium">{errorMessage}</p>
        </div>
      )}

      {loading ? (
        <div className="grid sm:mt-3 grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <DetailSkeletonCard heightClass="min-h-[210px]" />
            <DetailSkeletonCard heightClass="min-h-[220px]" />
            <DetailSkeletonCard heightClass="min-h-[220px]" />
            <DetailSkeletonCard heightClass="min-h-[240px]" />
            <DetailSkeletonCard heightClass="min-h-[260px]" />
            <DetailSkeletonCard heightClass="min-h-[220px]" />
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <DetailSkeletonCard heightClass="min-h-[320px]" />
            <DetailSkeletonCard heightClass="min-h-[360px]" />
          </div>
        </div>
      ) : (
        <div className="grid sm:mt-3 grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Header job={job} />
            <AboutCompany job={job} />
            <JobDescription job={job} />
            <Responsibilities job={job} />
            <Requirements job={job} />
            <Benefits job={job} />
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <SidebarActions job={job} matchPercentageOverride={liveMatchPercentage} />
            <HowYouMatch
              job={job}
              onMatchUpdated={handleLiveMatchUpdated}
            />
          </div>
        </div>
      )}
    </div>
  );
}
