import { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  generateCandidateProfileAutoSummary,
  getCandidateProfileInsights,
  getCandidateProfile,
  type CandidateProfileInsights,
  type CandidateProfileResponse,
} from '../../services/profileApi';
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

interface ProfileAiSnapshot {
  summary: string;
  insights: CandidateProfileInsights;
}

const EMPTY_PROFILE_INSIGHTS: CandidateProfileInsights = {
  top_role_matches: [],
  strengths: [],
  areas_to_improve: [],
};

const profileAiCache = new Map<string, ProfileAiSnapshot>();
const profileAiRequests = new Map<string, Promise<ProfileAiSnapshot>>();
const profileAiVersions = new Map<string, number>();
const profileDataCache = new Map<string, CandidateProfileResponse>();
const profileDataRequests = new Map<string, Promise<CandidateProfileResponse>>();

function getProfileCacheKey(accessToken: string): string {
  return accessToken.trim();
}

function getProfileAiCacheKey(accessToken: string): string {
  const cacheKey = getProfileCacheKey(accessToken);
  const version = profileAiVersions.get(cacheKey) || 0;
  return `${cacheKey}:${version}`;
}

function invalidateProfileAiSnapshot(accessToken: string): void {
  const cacheKey = getProfileCacheKey(accessToken);
  profileAiVersions.set(cacheKey, (profileAiVersions.get(cacheKey) || 0) + 1);
}

async function loadProfileAiSnapshot(accessToken: string): Promise<ProfileAiSnapshot> {
  const cacheKey = getProfileAiCacheKey(accessToken);
  const cached = profileAiCache.get(cacheKey);
  if (cached) return cached;

  const inFlight = profileAiRequests.get(cacheKey);
  if (inFlight) return inFlight;

  const request = Promise.all([
    generateCandidateProfileAutoSummary(accessToken).catch(() => ''),
    getCandidateProfileInsights(accessToken).catch(() => EMPTY_PROFILE_INSIGHTS),
  ]).then(([summary, insights]) => {
    const snapshot = { summary, insights };
    profileAiCache.set(cacheKey, snapshot);
    return snapshot;
  }).finally(() => {
    profileAiRequests.delete(cacheKey);
  });

  profileAiRequests.set(cacheKey, request);
  return request;
}

async function loadProfileDataSnapshot(accessToken: string, useCache: boolean): Promise<CandidateProfileResponse> {
  const cacheKey = getProfileCacheKey(accessToken);
  const cached = useCache ? profileDataCache.get(cacheKey) : null;
  if (cached) return cached;

  const inFlight = useCache ? profileDataRequests.get(cacheKey) : null;
  if (inFlight) return inFlight;

  const request = getCandidateProfile(accessToken)
    .then((response) => {
      profileDataCache.set(cacheKey, response);
      return response;
    })
    .finally(() => {
      profileDataRequests.delete(cacheKey);
    });

  profileDataRequests.set(cacheKey, request);
  return request;
}

export default function Profile() {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [profileData, setProfileData] = useState<CandidateProfileResponse | null>(null);
  const [profileSummary, setProfileSummary] = useState('');
  const [profileInsights, setProfileInsights] = useState<CandidateProfileInsights>({
    top_role_matches: [],
    strengths: [],
    areas_to_improve: [],
  });
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestSeqRef = useRef(0);

  const loadProfile = useCallback(async ({
    showPageLoading = true,
    includeAiData = true,
    useProfileCache = true,
    refreshAiData = false,
  }: {
    showPageLoading?: boolean;
    includeAiData?: boolean;
    useProfileCache?: boolean;
    refreshAiData?: boolean;
  } = {}) => {
    if (!accessToken) {
      setErrorMessage('You are not authenticated. Please log in again.');
      setProfileSummary('');
      setIsPageLoading(false);
      return;
    }

    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;

    if (showPageLoading) {
      setIsPageLoading(true);
      setErrorMessage(null);
    }

    try {
      if (includeAiData && refreshAiData) {
        invalidateProfileAiSnapshot(accessToken);
      }

      const [response, aiSnapshot] = await Promise.all([
        loadProfileDataSnapshot(accessToken, useProfileCache),
        includeAiData ? loadProfileAiSnapshot(accessToken) : Promise.resolve(null),
      ]);

      if (requestSeqRef.current !== requestSeq) return;
      setProfileData(response);
      if (aiSnapshot) {
        setProfileSummary(aiSnapshot.summary);
        setProfileInsights(aiSnapshot.insights);
      }
      dispatch(setProfile(response.profile));
      if (showPageLoading) {
        setErrorMessage(null);
      }
    } catch (error: unknown) {
      if (requestSeqRef.current !== requestSeq) return;
      if (showPageLoading) {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (requestSeqRef.current !== requestSeq) return;
      if (showPageLoading) {
        setIsPageLoading(false);
      }
    }
  }, [accessToken, dispatch]);

  useEffect(() => {
    void loadProfile({ showPageLoading: true });
  }, [loadProfile]);

  const refreshProfileSilently = async () => {
    await loadProfile({
      showPageLoading: false,
      includeAiData: true,
      useProfileCache: false,
      refreshAiData: true,
    });
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
          <SidebarStats
            aiSummary={profileSummary}
            strengths={profileInsights.strengths}
            areasToImprove={profileInsights.areas_to_improve}
            topRoleMatches={profileInsights.top_role_matches}
          />
        </div>
      </div>
    </div>
  );
}
