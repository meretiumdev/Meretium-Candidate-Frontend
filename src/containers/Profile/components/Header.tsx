import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Share2, ChevronDown, Edit3, Calendar, CheckCircle2, Upload } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import { updateCandidateProfile, type CandidateProfile, type UpdateProfilePayload } from '../../../services/profileApi';
import ShareProfileModal from './ShareProfileModal';

interface HeaderProps {
  profile: CandidateProfile;
  onProfileUpdated?: () => Promise<void> | void;
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'U';
  return trimmed.charAt(0).toUpperCase();
}

function getShareUrl(shareSlug: string): string | null {
  const trimmedSlug = shareSlug.trim();
  if (!trimmedSlug) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (!origin) return null;

  return `${origin}/profile/${trimmedSlug}`;
}

function parseYearsToLabel(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 'No experience added';
  if (parsed === 1) return '1 year experience';
  return `${parsed} years experience`;
}

export default function Header({ profile, onProfileUpdated }: HeaderProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [isEditing, setIsEditing] = useState(false);
  const [isHeadlineEditing, setIsHeadlineEditing] = useState(false);
  const [isShareOpen, setShareOpen] = useState(false);
  const [isOppsDropdownOpen, setOppsDropdownOpen] = useState(false);
  const [opportunityStatus, setOpportunityStatus] = useState('Open to opportunities');

  const [headline, setHeadline] = useState('');
  const [headlineDraft, setHeadlineDraft] = useState('');
  const [location, setLocation] = useState('');
  const [expYears, setExpYears] = useState('');
  const [isOpenToWork, setIsOpenToWork] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const headlineFromProfile = profile.headline || 'No headline added yet.';
  const locationFromProfile = profile.location || 'Location not added';
  const expYearsFromProfile = String(profile.total_years_experience || 0);

  useEffect(() => {
    if (isEditing || isHeadlineEditing) return;
    setHeadline(headlineFromProfile);
    setLocation(locationFromProfile);
    setExpYears(expYearsFromProfile);
    setIsOpenToWork(profile.is_open_to_work);
  }, [profile, headlineFromProfile, locationFromProfile, expYearsFromProfile]);

  const initial = useMemo(() => getInitial(profile.full_name), [profile.full_name]);
  const shareUrl = useMemo(() => getShareUrl(profile.share_slug), [profile.share_slug]);
  const experienceLabel = useMemo(() => parseYearsToLabel(expYears), [expYears]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleStartHeadlineEdit = () => {
    setHeadlineDraft(headline === 'No headline added yet.' ? '' : headline);
    setSaveError(null);
    setIsHeadlineEditing(true);
  };

  const handleCancelHeadlineEdit = () => {
    setHeadlineDraft('');
    setSaveError(null);
    setIsHeadlineEditing(false);
  };

  const patchProfileFields = async (
    updates: UpdateProfilePayload,
    fallbackErrorMessage: string
  ): Promise<boolean> => {
    if (!accessToken) {
      setSaveError('You are not authenticated. Please log in again.');
      return false;
    }

    if (Object.keys(updates).length === 0) {
      return false;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await updateCandidateProfile(accessToken, updates);
      if (onProfileUpdated) {
        await onProfileUpdated();
      }
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : fallbackErrorMessage;
      setSaveError(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHeadline = async () => {
    const nextHeadline = headlineDraft.trim();
    const currentHeadline = (profile.headline || '').trim();
    if (nextHeadline === currentHeadline) {
      setHeadline(nextHeadline || 'No headline added yet.');
      setIsHeadlineEditing(false);
      return;
    }

    const saved = await patchProfileFields(
      { headline: nextHeadline },
      'Failed to update headline.'
    );
    if (!saved) return;

    setHeadline(nextHeadline || 'No headline added yet.');
    setSaveError(null);
    setIsHeadlineEditing(false);
  };

  const handleSaveProfileEdit = async () => {
    const updates: UpdateProfilePayload = {};

    const nextHeadline = headline.trim() === 'No headline added yet.' ? '' : headline.trim();
    const currentHeadline = (profile.headline || '').trim();
    if (nextHeadline !== currentHeadline) {
      updates.headline = nextHeadline;
    }

    const nextLocation = location.trim() === 'Location not added' ? '' : location.trim();
    const currentLocation = (profile.location || '').trim();
    if (nextLocation !== currentLocation) {
      updates.location = nextLocation;
    }

    const parsedYears = Number(expYears.trim());
    if (!Number.isFinite(parsedYears) || parsedYears < 0) {
      setSaveError('Total years experience must be a valid number.');
      return;
    }

    const nextYears = parsedYears;
    const currentYears = profile.total_years_experience;
    if (nextYears !== currentYears) {
      updates.total_years_experience = nextYears;
    }

    if (isOpenToWork !== profile.is_open_to_work) {
      updates.is_open_to_work = isOpenToWork;
    }

    if (Object.keys(updates).length === 0) {
      setSaveError(null);
      setIsEditing(false);
      return;
    }

    const saved = await patchProfileFields(
      updates,
      'Failed to update profile.'
    );
    if (!saved) return;

    setHeadline(nextHeadline || 'No headline added yet.');
    setLocation(nextLocation || 'Location not added');
    setExpYears(String(nextYears));
    setSaveError(null);
    setIsEditing(false);
  };

  return (
    <>
      <div className="bg-white sm:mt-3 border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope transition-all duration-300">
        <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 relative">
          <div className="relative group shrink-0">
            <div
              onClick={isEditing ? handleUploadClick : undefined}
              className={`size-10 md:size-13 rounded-full flex items-center justify-center text-white text-[20px] md:text-[24px] shrink-0 transition-colors duration-300 ${isEditing ? 'bg-[#7A331A] cursor-pointer' : 'bg-[#FF6934]'}`}
            >
              {isEditing ? (
                <div className="relative flex items-center justify-center w-full h-full">
                  <span className="opacity-40">{initial}</span>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full hover:bg-black/20 transition-all">
                    <Upload size={24} className="text-white" />
                  </div>
                </div>
              ) : initial}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={() => {
                // Profile image upload endpoint is not wired yet.
              }}
            />
          </div>

          <div className="flex flex-col flex-1 w-full">
            <h1 className="text-[24px] md:text-[32px] font-semibold text-[#101828] mb-1">
              {profile.full_name || 'Unnamed User'}
            </h1>

            {!isEditing ? (
              <>
                {!isHeadlineEditing ? (
                  <div className="flex justify-between items-start gap-4 animate-in fade-in duration-300">
                    <p className="text-[16px] md:text-[18px] text-[#475467] leading-relaxed font-body">
                      {headline}
                    </p>
                    <Edit3
                      size={18}
                      onClick={handleStartHeadlineEdit}
                      className="text-[#475467] shrink-0 cursor-pointer hover:text-gray-900 transition-colors mt-1"
                    />
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-300">
                    <input
                      type="text"
                      value={headlineDraft}
                      onChange={(e) => setHeadlineDraft(e.target.value)}
                      className="w-full p-3 text-[14px] md:text-[16px] text-[#475467] border border-[#EAECF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 focus:border-[#FF6934] transition-all"
                      placeholder="Your headline"
                    />
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={handleCancelHeadlineEdit}
                        disabled={isSaving}
                        className="text-[#475467] text-[13px] font-medium hover:text-gray-900 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => { void handleSaveHeadline(); }}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-[#FF6934] text-white rounded-[8px] text-[13px] font-medium hover:opacity-90 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                    {saveError && (
                      <p className="mt-2 text-[13px] font-medium text-[#B42318]">{saveError}</p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-[14px] font-medium text-[#475467] font-body mt-4 animate-in fade-in duration-300">
                  <div className="flex items-center gap-1.5"><MapPin size={16} className="text-[#475467]" /> {location}</div>
                  <div className="flex items-center gap-1.5"><Calendar size={16} className="text-[#475467]" /> {experienceLabel}</div>
                </div>
                {isOpenToWork &&(
                <div className="mt-5 animate-in fade-in duration-300">
                  <span className={`text-[14px] px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit font-medium transition-all duration-300 ${
                    isOpenToWork ? 'bg-[#D1FADF]/50 text-[#039855]' : 'bg-[#F2F4F7] text-[#475467]'
                  }`}>
                    <CheckCircle2 size={16} /> {isOpenToWork && 'Open to work'}
                  </span>
                </div>
                )}

                <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 animate-in fade-in duration-300">
                  <button
                    onClick={() => {
                      setIsHeadlineEditing(false);
                      setSaveError(null);
                      setOppsDropdownOpen(false);
                      setIsEditing(true);
                    }}
                    className="flex items-center justify-center gap-2 border border-[#E4E7EC] px-4 py-2.5 rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors bg-white cursor-pointer shadow-sm"
                  >
                    <Edit3 size={16} /> Edit profile
                  </button>
                  <button
                    onClick={() => setShareOpen(true)}
                    className="flex items-center justify-center gap-2 border border-[#E4E7EC] px-4 py-2.5 rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors bg-white cursor-pointer shadow-sm"
                  >
                    <Share2 size={16} /> Share
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setOppsDropdownOpen((prev) => !prev)}
                      className="w-full flex items-center justify-center gap-2 border border-[#E4E7EC] px-4 py-2.5 rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors bg-white cursor-pointer shadow-sm group"
                    >
                      {opportunityStatus}
                      <ChevronDown size={18} className={`text-[#475467] transition-transform duration-300 ${isOppsDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOppsDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOppsDropdownOpen(false)}
                        />
                        <div className="absolute left-0 top-[calc(100%+6px)] w-full bg-white border border-[#E4E7EC] rounded-xl shadow-[0_12px_32px_-4px_rgba(16,24,40,0.1)] py-1.5 z-20 animate-scale-in origin-top">
                          <button
                            onClick={() => {
                              setOpportunityStatus('Open to opportunities');
                              setOppsDropdownOpen(false);
                            }}
                            className="w-full text-left px-2 py-2 text-[14px] font-medium text-[#FF6934] hover:bg-[#FF6934]/5 transition-colors cursor-pointer"
                          >
                            Open to opportunities
                          </button>
                          <button
                            onClick={() => {
                              setOpportunityStatus('Visible to matched recruiters');
                              setOppsDropdownOpen(false);
                            }}
                            className="w-full text-left px-2 py-2 text-[14px] font-medium text-[#344054] text-nowrap hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            Visible to matched recruiters
                          </button>
                          <button
                            onClick={() => {
                              setOpportunityStatus('Closed to opportunities');
                              setOppsDropdownOpen(false);
                            }}
                            className="w-full text-left px-2 py-2 text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            Closed to opportunities
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full p-3 text-[14px] md:text-[16px] text-[#475467] border border-[#EAECF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 focus:border-[#FF6934] transition-all"
                  placeholder="Your headline"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[150px]">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-[14px] text-[#475467] border border-[#EAECF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 focus:border-[#FF6934] transition-all"
                      placeholder="Location"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={expYears}
                      onChange={(e) => setExpYears(e.target.value)}
                      className="w-[60px] p-2 text-[14px] text-center text-[#475467] border border-[#EAECF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 focus:border-[#FF6934] transition-all"
                    />
                    <span className="text-[14px] text-[#475467] font-medium">years experience</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 p-3 border border-[#EAECF0] rounded-xl">
                  <span className="text-[14px] text-[#344054] font-medium">Open to work</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isOpenToWork}
                    onClick={() => setIsOpenToWork((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isOpenToWork ? 'bg-[#12B76A]' : 'bg-[#D0D5DD]'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        isOpenToWork ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <button
                    onClick={() => {
                      setSaveError(null);
                      setHeadline(headlineFromProfile);
                      setLocation(locationFromProfile);
                      setExpYears(expYearsFromProfile);
                      setIsOpenToWork(profile.is_open_to_work);
                      setIsEditing(false);
                    }}
                    disabled={isSaving}
                    className="px-4 py-2.5 text-[#475467] text-[14px] hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { void handleSaveProfileEdit(); }}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#FF6934] text-white rounded-[10px] text-[14px] hover:opacity-90 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
                {saveError && (
                  <p className="text-[13px] font-medium text-[#B42318]">{saveError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ShareProfileModal isOpen={isShareOpen} onClose={() => setShareOpen(false)} profileUrl={shareUrl} />
    </>
  );
}
