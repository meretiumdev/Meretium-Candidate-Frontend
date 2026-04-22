import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux/store';
import Header from './components/Header';
import StrengthCard from './components/StrengthCard';
import AboutSection from './components/AboutSection';
import ExperienceSection from './components/ExperienceSection';
import SkillsSection from './components/SkillsSection';
import CVSection from './components/CVSection';
import JobPreferences from './components/JobPreferences';
import SidebarStats from './components/SidebarStats';
import { getCandidateProfile, type CandidateProfileResponse } from '../../services/profileApi';
import { setProfile } from '../../redux/store';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to load profile. Please try again.';
}

function ProfileCardSkeleton({ heightClass }: { heightClass: string }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm p-6 animate-pulse ${heightClass}`}>
      <div className="h-5 w-48 bg-gray-200 rounded-md mb-6"></div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-100 rounded-md"></div>
        <div className="h-4 w-[92%] bg-gray-100 rounded-md"></div>
        <div className="h-4 w-[80%] bg-gray-100 rounded-md"></div>
      </div>
    </div>
  );
}

export default function Profile() {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [profileData, setProfileData] = useState<CandidateProfileResponse | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async ({ showPageLoading = true }: { showPageLoading?: boolean } = {}) => {
    if (!accessToken) {
      setErrorMessage('You are not authenticated. Please log in again.');
      setIsPageLoading(false);
      return;
    }

    if (showPageLoading) {
      setIsPageLoading(true);
      setErrorMessage(null);
    }

    try {
      const response = await getCandidateProfile(accessToken);
      setProfileData(response);
      dispatch(setProfile(response.profile));
      if (showPageLoading) {
        setErrorMessage(null);
      }
    } catch (error: unknown) {
      if (showPageLoading) {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (showPageLoading) {
        setIsPageLoading(false);
      }
    }
  }, [accessToken, dispatch]);

  useEffect(() => {
    void loadProfile({ showPageLoading: true });
  }, [loadProfile]);

  const refreshProfileSilently = async () => {
    await loadProfile({ showPageLoading: false });
  };

  if (isPageLoading && !profileData) {
    return (
      <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <ProfileCardSkeleton heightClass="min-h-[220px]" />
            <ProfileCardSkeleton heightClass="min-h-[180px]" />
            <ProfileCardSkeleton heightClass="min-h-[240px]" />
            <ProfileCardSkeleton heightClass="min-h-[320px]" />
            <ProfileCardSkeleton heightClass="min-h-[240px]" />
            <ProfileCardSkeleton heightClass="min-h-[260px]" />
            <ProfileCardSkeleton heightClass="min-h-[300px]" />
          </div>
          <div className="lg:col-span-4 space-y-8">
            <ProfileCardSkeleton heightClass="min-h-[520px]" />
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !profileData) {
    return (
      <div className="max-w-full mx-auto px-2 sm:px-12 py-6 bg-[#F9FAFB] min-h-screen">
        <div className="bg-white border border-[#FDA29B] rounded-xl p-6">
          <p className="text-[#B42318] text-[14px] font-medium mb-4">{errorMessage || 'Failed to load profile.'}</p>
          <button
            onClick={() => {
              void loadProfile({ showPageLoading: true });
            }}
            className="bg-[#FF6934] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const experiences = profileData?.experiences || [];
  const skills = profileData?.skills || [];
  const hasCvUploaded = (profileData?.cvs || []).length > 0;

  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-6 bg-[#F9FAFB] min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Header profile={profileData.profile} onProfileUpdated={refreshProfileSilently} />
          <StrengthCard
            profileStrength={profileData.profile.profile_strength}
            hasCvUploaded={hasCvUploaded}
            hasSkills={skills.length > 0}
            hasExperience={experiences.length > 0}
          />
          <AboutSection about={profileData.profile.about || ''} onProfileUpdated={refreshProfileSilently} />
          <ExperienceSection experiences={experiences} onExperienceAdded={refreshProfileSilently} />
          <SkillsSection skills={skills} onSkillAdded={refreshProfileSilently} />
          <CVSection cvs={profileData.cvs} onCvUploaded={() => { void refreshProfileSilently(); }} />
          <JobPreferences preferences={profileData.job_preferences} onUpdated={refreshProfileSilently} />
        </div>

        <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <SidebarStats />
        </div>
      </div>
    </div>
  );
}
