import { Search, Briefcase, FileText, Bookmark, MessageSquare, Bell, User, Settings, LogOut, Building2, Loader2, MapPin, Sparkles, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import logo from '../assets/logo_primary.png';
import NotificationsModal from './NotificationsModal';

import { logout } from '../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { logoutUser } from '../services/authApi';
import { subscribeCandidateSocketMessages } from '../utils/candidateSocketConnection';
import { getCandidateUnreadCounts } from '../services/notificationsApi';
import {
  searchCandidateDirectory,
  type CandidateSearchCompany,
  type CandidateSearchJob,
  type CandidateSearchResponse,
  type CandidateSearchSkill,
} from '../services/candidateSearchApi';
import { formatJobTypeLabel } from '../utils/formatJobTypeLabel';

const UNREAD_COUNTS_REFRESH_EVENT = 'candidate:refresh-unread-counts';
const MIN_SEARCH_LENGTH = 1;
const SEARCH_DEBOUNCE_MS = 250;

const EMPTY_SEARCH_RESULTS: CandidateSearchResponse = {
  jobs: [],
  companies: [],
  skills: [],
};

function getRecordValue(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function getNumberValue(input: unknown): number | null {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function getBadgeUpdateCounts(payload: unknown): { unreadMessages: number; unreadNotifications: number } | null {
  const payloadRecord = getRecordValue(payload);
  if (!payloadRecord) return null;

  const typeValue = (typeof payloadRecord.type === 'string' ? payloadRecord.type : '').trim().toLowerCase();
  if (typeValue !== 'badge_update') return null;

  const dataRecord = getRecordValue(payloadRecord.data);
  const source = dataRecord || payloadRecord;

  const unreadMessages = getNumberValue(source.unread_messages);
  const unreadNotifications = getNumberValue(source.unread_notifications);

  return {
    unreadMessages: Math.max(0, unreadMessages ?? 0),
    unreadNotifications: Math.max(0, unreadNotifications ?? 0),
  };
}

function formatBadgeCount(count: number): string {
  return count > 99 ? '99+' : String(count);
}

function getUserEmail(user: unknown): string {
  if (typeof user !== 'object' || user === null) return 'Email not available';
  const email = (user as { email?: unknown }).email;
  if (typeof email !== 'string' || !email.trim()) return 'Email not available';
  return email.trim();
}

function getUserName(user: unknown): string {
  if (typeof user !== 'object' || user === null) return 'User';

  const fullName = (user as { full_name?: unknown }).full_name;
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();

  const email = (user as { email?: unknown }).email;
  if (typeof email === 'string' && email.trim()) {
    const [prefix] = email.trim().split('@');
    if (prefix) return prefix;
  }

  return 'User';
}

function getUserInitial(name: string): string {
  const trimmedName = name.trim();
  if (!trimmedName) return 'U';
  return trimmedName.charAt(0).toUpperCase();
}

function hasSearchResults(results: CandidateSearchResponse | null): boolean {
  if (!results) return false;
  return results.jobs.length > 0 || results.companies.length > 0 || results.skills.length > 0;
}

function getSearchResultsCount(results: CandidateSearchResponse | null): number {
  if (!results) return 0;
  return results.jobs.length + results.companies.length + results.skills.length;
}

function getInitial(value: string, fallback: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) return fallback;
  return trimmedValue.charAt(0).toUpperCase();
}

interface SearchResultsPanelProps {
  query: string;
  results: CandidateSearchResponse | null;
  isSearching: boolean;
  errorMessage: string | null;
  onSelectJob: (job: CandidateSearchJob) => void;
  onSelectCompany: (company: CandidateSearchCompany) => void;
  onSelectSkill: (skill: CandidateSearchSkill) => void;
}

function SearchResultsPanel({
  query,
  results,
  isSearching,
  errorMessage,
  onSelectJob,
  onSelectCompany,
  onSelectSkill,
}: SearchResultsPanelProps) {
  const trimmedQuery = query.trim();
  const showPrompt = trimmedQuery.length < MIN_SEARCH_LENGTH;
  const resultsCount = getSearchResultsCount(results);
  const emptyResults = !isSearching && !errorMessage && trimmedQuery.length >= MIN_SEARCH_LENGTH && !hasSearchResults(results);

  return (
    <div className="absolute left-0 right-0 top-full mt-2 rounded-[8px] border border-[#E5E7EB] bg-white shadow-xl overflow-hidden z-[70]">
      {showPrompt && (
        <div className="px-4 py-5">
          <div className="flex items-center gap-3 text-[#667085]">
            <div className="size-9 rounded-[8px] bg-[#F9FAFB] border border-[#EAECF0] flex items-center justify-center">
              <Search size={17} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#344054]">Search jobs, companies, and skills</p>
              <p className="text-[12px] text-[#667085] mt-1">Start typing to see results.</p>
            </div>
          </div>
        </div>
      )}

      {isSearching && (
        <div className="px-4 py-5 flex items-center gap-3 text-[#667085]">
          <Loader2 size={18} className="animate-spin text-[#FF6934]" />
          <span className="text-[14px] font-medium">Searching...</span>
        </div>
      )}

      {errorMessage && !isSearching && (
        <div className="px-4 py-5">
          <p className="text-[13px] font-semibold text-[#B42318]">{errorMessage}</p>
        </div>
      )}

      {emptyResults && (
        <div className="px-4 py-5">
          <p className="text-[14px] font-semibold text-[#344054]">No results found</p>
          <p className="text-[12px] text-[#667085] mt-1">Try another job title, company, or skill.</p>
        </div>
      )}

      {!showPrompt && !isSearching && !errorMessage && hasSearchResults(results) && (
        <div className="max-h-[min(70vh,520px)] overflow-y-auto py-2">
          <div className="px-4 pb-2 pt-1 border-b border-[#F2F4F7] mb-1">
            <p className="text-[13px] font-semibold text-[#344054]">
              {resultsCount} result{resultsCount === 1 ? '' : 's'} for "{trimmedQuery}"
            </p>
          </div>

          {results?.jobs.length ? (
            <div className="py-1">
              <div className="px-4 py-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#98A2B3]">
                <Briefcase size={13} />
                Jobs
              </div>
              {results.jobs.map((job) => (
                <button
                  key={`job-${job.id}`}
                  type="button"
                  onClick={() => onSelectJob(job)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-[#FFF4ED] transition-colors cursor-pointer"
                >
                  <div className="size-10 rounded-[8px] border border-[#EAECF0] bg-[#F9FAFB] shrink-0 overflow-hidden flex items-center justify-center text-[13px] font-bold text-[#475467]">
                    {job.company_logo_url ? (
                      <img src={job.company_logo_url} alt="" className="size-full object-cover" />
                    ) : (
                      getInitial(job.company_name || job.title, 'J')
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-[#101828] truncate">{job.title || 'Untitled role'}</p>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-[#667085] min-w-0">
                      <span className="truncate">{job.company_name || 'Company'}</span>
                      {job.location && (
                        <>
                          <span className="text-[#D0D5DD]">-</span>
                          <span className="truncate">{job.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {job.job_type && (
                    <span className="hidden sm:inline-flex shrink-0 rounded-full bg-[#F2F4F7] px-2.5 py-1 text-[11px] font-semibold text-[#475467]">
                      {formatJobTypeLabel(job.job_type)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : null}

          {results?.companies.length ? (
            <div className="py-1 border-t border-[#F2F4F7]">
              <div className="px-4 py-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#98A2B3]">
                <Building2 size={13} />
                Companies
              </div>
              {results.companies.map((company) => (
                <button
                  key={`company-${company.id}`}
                  type="button"
                  onClick={() => onSelectCompany(company)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-[#FFF4ED] transition-colors cursor-pointer"
                >
                  <div className="size-10 rounded-[8px] border border-[#EAECF0] bg-[#F9FAFB] shrink-0 overflow-hidden flex items-center justify-center text-[13px] font-bold text-[#475467]">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt="" className="size-full object-cover" />
                    ) : (
                      getInitial(company.name, 'C')
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#101828] truncate">{company.name || 'Company'}</p>
                    {company.location && (
                      <p className="mt-1 text-[12px] text-[#667085] flex items-center gap-1 truncate">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{company.location}</span>
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {results?.skills.length ? (
            <div className="py-1 border-t border-[#F2F4F7]">
              <div className="px-4 py-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#98A2B3]">
                <Sparkles size={13} />
                Skills
              </div>
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {results.skills.map((skill) => (
                  <button
                    key={`skill-${skill.name}`}
                    type="button"
                    onClick={() => onSelectSkill(skill)}
                    className="rounded-full border border-[#FEDF89] bg-[#FFFAEB] px-3 py-1.5 text-[12px] font-semibold text-[#B54708] hover:bg-[#FEF0C7] transition-colors cursor-pointer"
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const refreshToken = useSelector((state: RootState) => state.auth.refreshToken);
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CandidateSearchResponse | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const hasSocketBadgeUpdateRef = useRef(false);
  const searchRequestVersionRef = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const notificationsAnchorRef = useRef<HTMLDivElement>(null);
  const userEmail = getUserEmail(user);
  const userName = getUserName(user);
  const userInitial = getUserInitial(userName);

  const refreshUnreadCounts = useRef(async (force = false) => {
    const trimmedAccessToken = accessToken?.trim() || '';
    if (!trimmedAccessToken) {
      setUnreadMessagesCount(0);
      setUnreadNotificationsCount(0);
      return;
    }

    try {
      const counts = await getCandidateUnreadCounts(trimmedAccessToken);
      if (!force && hasSocketBadgeUpdateRef.current) return;

      setUnreadMessagesCount(Math.max(0, counts.unread_messages_count));
      setUnreadNotificationsCount(Math.max(0, counts.unread_notifications_count));
    } catch {
      // Keep current values if this fetch fails.
    }
  });

  useEffect(() => {
    refreshUnreadCounts.current = async (force = false) => {
      const trimmedAccessToken = accessToken?.trim() || '';
      if (!trimmedAccessToken) {
        setUnreadMessagesCount(0);
        setUnreadNotificationsCount(0);
        return;
      }

      try {
        const counts = await getCandidateUnreadCounts(trimmedAccessToken);
        if (!force && hasSocketBadgeUpdateRef.current) return;

        setUnreadMessagesCount(Math.max(0, counts.unread_messages_count));
        setUnreadNotificationsCount(Math.max(0, counts.unread_notifications_count));
      } catch {
        // Keep current values if this fetch fails.
      }
    };
  }, [accessToken]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setLogoutError(null);
    setIsLoggingOut(true);

    const finishLocalLogout = () => {
      setIsProfileMenuOpen(false);
      dispatch(logout());
      navigate('/auth', { replace: true });
    };

    try {
      const trimmedAccessToken = accessToken?.trim() || '';
      const trimmedRefreshToken = refreshToken?.trim() || '';
      if (trimmedAccessToken && trimmedRefreshToken) {
        await logoutUser(trimmedAccessToken, { refresh_token: trimmedRefreshToken });
      }
    } catch {
      // Logout must not be blocked by an expired, invalid, or otherwise rejected token.
    } finally {
      finishLocalLogout();
    }
  };

  const jobsActive = location.pathname.startsWith('/jobs') || location.pathname === '/explore-jobs';
  const appsActive = location.pathname === '/applications';
  const savedActive = location.pathname === '/saved';
  const profileActive = location.pathname === '/profile';
  const settingsActive = location.pathname.startsWith('/settings');

  const closeSearch = () => {
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSearchResults(null);
    setSearchError(null);
    setIsSearching(false);
  };

  const handleSearchInputFocus = () => {
    setIsSearchOpen(true);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    setIsSearchOpen(true);
  };

  const handleSelectJob = (job: CandidateSearchJob) => {
    closeSearch();
    clearSearch();
    navigate(`/jobs/${job.id}`);
  };

  const handleSelectCompany = (company: CandidateSearchCompany) => {
    closeSearch();
    clearSearch();
    navigate(`/company/${company.id}`);
  };

  const handleSelectSkill = (skill: CandidateSearchSkill) => {
    setSearchQuery(skill.name);
    setDebouncedSearchQuery(skill.name);
    setIsSearchOpen(true);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      closeSearch();
      return;
    }

    if (event.key !== 'Enter') return;

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < MIN_SEARCH_LENGTH) return;

    const firstJob = searchResults?.jobs[0];
    const firstCompany = searchResults?.companies[0];
    const firstSkill = searchResults?.skills[0];

    if (firstJob) {
      handleSelectJob(firstJob);
    } else if (firstCompany) {
      handleSelectCompany(firstCompany);
    } else if (firstSkill) {
      handleSelectSkill(firstSkill);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      const targetNode = event.target as Node;
      const clickedDesktopSearch = searchRef.current?.contains(targetNode) ?? false;
      const clickedMobileSearch = mobileSearchRef.current?.contains(targetNode) ?? false;
      if (!clickedDesktopSearch && !clickedMobileSearch) {
        setIsSearchOpen(false);
        setIsMobileSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
      setDebouncedSearchQuery('');
      setSearchResults(null);
      setSearchError(null);
      setIsSearching(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(trimmedQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    const query = debouncedSearchQuery.trim();

    if (query.length < MIN_SEARCH_LENGTH) {
      setSearchResults(null);
      setSearchError(null);
      setIsSearching(false);
      return undefined;
    }

    if (!accessToken?.trim()) {
      setSearchResults(EMPTY_SEARCH_RESULTS);
      setSearchError('You are not authenticated. Please log in again.');
      setIsSearching(false);
      return undefined;
    }

    searchRequestVersionRef.current += 1;
    const requestVersion = searchRequestVersionRef.current;
    let isCancelled = false;

    setIsSearching(true);
    setSearchError(null);

    void (async () => {
      try {
        const response = await searchCandidateDirectory(accessToken, query);
        if (isCancelled || requestVersion !== searchRequestVersionRef.current) return;
        setSearchResults(response);
      } catch (error: unknown) {
        if (isCancelled || requestVersion !== searchRequestVersionRef.current) return;
        setSearchResults(EMPTY_SEARCH_RESULTS);
        setSearchError(
          error instanceof Error && error.message.trim()
            ? error.message
            : 'Search is unavailable right now.'
        );
      } finally {
        if (!isCancelled && requestVersion === searchRequestVersionRef.current) {
          setIsSearching(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, debouncedSearchQuery]);

  useEffect(() => {
    const unsubscribe = subscribeCandidateSocketMessages((payload) => {
      const badgeCounts = getBadgeUpdateCounts(payload);
      if (!badgeCounts) return;
      hasSocketBadgeUpdateRef.current = true;

      setUnreadMessagesCount(badgeCounts.unreadMessages);
      setUnreadNotificationsCount(badgeCounts.unreadNotifications);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const trimmedAccessToken = accessToken?.trim() || '';
    if (!trimmedAccessToken) {
      setUnreadMessagesCount(0);
      setUnreadNotificationsCount(0);
      hasSocketBadgeUpdateRef.current = false;
      return;
    }

    hasSocketBadgeUpdateRef.current = false;
    void refreshUnreadCounts.current(false);
  }, [accessToken]);

  useEffect(() => {
    const handleRefresh = () => {
      void refreshUnreadCounts.current(true);
    };

    window.addEventListener(UNREAD_COUNTS_REFRESH_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(UNREAD_COUNTS_REFRESH_EVENT, handleRefresh);
    };
  }, []);

  return (
    <nav className="w-full bg-[#FDF7E9] h-[76px] sticky top-0 z-50 px-4 md:px-10">
      <div className="flex items-center justify-between w-full h-full md:gap-8">
        
        {/* 1. Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer order-1 shrink-0 min-w-fit"
          onClick={() => navigate('/dashboard')}
        >
          <img src={logo} alt="meretium" className="h-6 md:h-7 w-auto object-contain" />
        </div>

        {/* 2. Actions (Links, Notifications, Avatar) */}
        <div className="flex items-center gap-4 md:gap-7 bg-transparent order-2 md:order-3 ml-auto z-50 shrink-0 min-w-fit">
          
          {/* Desktop Only Mid-Links */}
          <div className="hidden lg:flex items-center gap-4 font-semibold text-[15px]">
            <span 
              onClick={() => navigate('/jobs')} 
              className={`flex items-center gap-1 cursor-pointer transition-colors border-b-2 pb-1 ${jobsActive ? 'text-[#FF6934] border-[#FF6934]' : 'text-gray-500 hover:text-[#FF6934] border-transparent'}`}
            >
              <Briefcase size={20}/> Jobs
            </span>
            <span 
              onClick={() => navigate('/applications')}
              className={`flex items-center gap-1 cursor-pointer transition-colors border-b-2 pb-1 ${appsActive ? 'text-[#FF6934] border-[#FF6934]' : 'text-gray-500 hover:text-[#FF6934] border-transparent'}`}
            >
              <FileText size={20}/> Applications
            </span>
            <span 
              onClick={() => navigate('/saved')}
              className={`flex items-center gap-1 cursor-pointer transition-colors border-b-2 pb-1 ${savedActive ? 'text-[#FF6934] border-[#FF6934]' : 'text-gray-500 hover:text-[#FF6934] border-transparent'}`}
            >
              <Bookmark size={20}/> Saved
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-4 md:border-l md:border-gray-200 md:pl-6 h-10">
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(true);
                setIsSearchOpen(true);
              }}
              className="md:hidden relative text-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Open search"
            >
              <Search size={20} />
            </button>

            {/* Notifications */}
            <div 
              onClick={() => navigate('/messages')}
              className="relative cursor-pointer text-gray-500 hover:text-gray-800 transition-colors"
            >
              <MessageSquare size={20} className="md:w-[22px] md:h-[22px]" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#FF6934] text-white text-[9px] md:text-[10px] font-bold min-w-4 h-4 px-1 flex items-center justify-center rounded-full border-2 border-[#FCF8F1]">
                  {formatBadgeCount(unreadMessagesCount)}
                </span>
              )}
            </div>
            <div 
              ref={notificationsAnchorRef}
              onClick={() => setIsNotificationsOpen(true)}
              className="relative cursor-pointer text-gray-500 hover:text-gray-800 transition-colors"
            >
              <Bell size={20} className="md:w-[22px] md:h-[22px]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#FF6934] text-white text-[9px] md:text-[10px] font-bold min-w-4 h-4 px-1 flex items-center justify-center rounded-full border-2 border-[#FCF8F1]">
                  {formatBadgeCount(unreadNotificationsCount)}
                </span>
              )}
            </div>
            
            <NotificationsModal 
              isOpen={isNotificationsOpen} 
              onClose={() => setIsNotificationsOpen(false)}
              onUnreadCountChange={setUnreadNotificationsCount}
              anchorRef={notificationsAnchorRef}
            />
            
            {/* Profile Avatar & Dropdown */}
            <div className="relative ml-1 md:ml-2" ref={menuRef}>
              <div 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="size-8 md:size-9 bg-[#FF6934] rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-90 shadow-sm border-2 border-[#FF6934] hover:shadow-md transition-all ring-2 ring-transparent hover:ring-orange-100"
              >
                {userInitial}
              </div>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-white cursor-pointer border border-gray-200 rounded-xl shadow-lg py-2 z-50 overflow-hidden transform origin-top-right transition-all font-manrope">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-sm font-bold text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500">{userEmail}</p>
                  </div>

                  {/* Mobile-only menu items */}
                  <div className="block lg:hidden">
                    <button 
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate('/jobs');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium cursor-pointer border-l-2 ${jobsActive ? 'text-[#FF6934] bg-orange-50 border-[#FF6934]' : 'text-gray-600 hover:bg-orange-50 hover:text-[#FF6934] border-transparent'}`}
                    >
                      <Briefcase size={16} /> Jobs
                    </button>
                    <button 
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate('/applications');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium cursor-pointer border-l-2 ${appsActive ? 'text-[#FF6934] bg-orange-50 border-[#FF6934]' : 'text-gray-600 hover:bg-orange-50 hover:text-[#FF6934] border-transparent'}`}
                    >
                      <FileText size={16} /> Applications
                    </button>
                    <button 
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate('/saved');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium cursor-pointer border-b border-gray-50 border-l-2 ${savedActive ? 'text-[#FF6934] bg-orange-50 border-[#FF6934]' : 'text-gray-600 hover:bg-orange-50 hover:text-[#FF6934] border-transparent'}`}
                    >
                      <Bookmark size={16} /> Saved
                    </button>
                  </div>

                  <button 
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/profile');
                    }}
                    className={`w-full flex items-center cursor-pointer gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left border-l-2 ${profileActive ? 'text-[#FF6934] bg-orange-50 border-[#FF6934]' : 'text-gray-600 hover:bg-gray-50 border-transparent'}`}
                  >
                    <User size={16} /> My Profile
                  </button>
                  <button 
                    onClick={() =>{ setIsProfileMenuOpen(false);
                      navigate('/settings');
                    }}
                    className={`w-full flex items-center cursor-pointer gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left border-l-2 ${settingsActive ? 'text-[#FF6934] bg-orange-50 border-[#FF6934]' : 'text-gray-600 hover:bg-gray-50 border-transparent'}`}
                  >
                    <Settings size={16} /> Settings
                  </button>
                  <button 
                    onClick={() => { void handleLogout(); }}
                    disabled={isLoggingOut}
                    className="w-full flex items-center cursor-pointer gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium mt-1 border-t border-gray-50 pt-3 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LogOut size={16} /> {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                  {logoutError && (
                    <p className="px-4 pb-2 text-[12px] text-[#B42318]">{logoutError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Search Bar - hidden on mobile, visible on desktop */}
        <div ref={searchRef} className="hidden md:flex flex-1 w-full max-w-xl relative order-2 z-10 md:w-auto min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 md:size-5 text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(event) => handleSearchInputChange(event.target.value)}
            onFocus={handleSearchInputFocus}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search jobs, companies, skills..."
            className="w-full bg-[#F5F1E9]/80 md:bg-[#F5F1E9]/50 font-[400] border border-gray-200/80 md:border-gray-200/50 rounded-[10px] py-2.5 md:py-2 pl-10 md:pl-12 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6934]/20 transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-6 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white/70 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
          {isSearchOpen && !isMobileSearchOpen && (
            <SearchResultsPanel
              query={searchQuery}
              results={searchResults}
              isSearching={isSearching}
              errorMessage={searchError}
              onSelectJob={handleSelectJob}
              onSelectCompany={handleSelectCompany}
              onSelectSkill={handleSelectSkill}
            />
          )}
        </div>

      </div>

      {isMobileSearchOpen && (
        <div className="md:hidden fixed inset-x-0 top-[76px] z-[65] px-4 pb-4 bg-[#FDF7E9] border-t border-[#E5E7EB] shadow-lg" ref={mobileSearchRef}>
          <div className="relative mt-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => handleSearchInputChange(event.target.value)}
              onFocus={handleSearchInputFocus}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search jobs, companies, skills..."
              className="w-full bg-white font-[400] border border-gray-200 rounded-[10px] py-3 pl-11 pr-11 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6934]/20 transition-all placeholder:text-gray-400"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                clearSearch();
                closeSearch();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close search"
            >
              <X size={16} />
            </button>
            {isSearchOpen && (
              <SearchResultsPanel
                query={searchQuery}
                results={searchResults}
                isSearching={isSearching}
                errorMessage={searchError}
                onSelectJob={handleSelectJob}
                onSelectCompany={handleSelectCompany}
                onSelectSkill={handleSelectSkill}
              />
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
