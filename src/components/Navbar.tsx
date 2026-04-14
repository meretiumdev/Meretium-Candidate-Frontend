import { Search, Briefcase, FileText, Bookmark, MessageSquare, Bell, User, Settings, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import logo from '../assets/logo_primary.png';
import NotificationsModal from './NotificationsModal';

import { logout } from '../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../redux/store';

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

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userEmail = getUserEmail(user);
  const userName = getUserName(user);
  const userInitial = getUserInitial(userName);

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    dispatch(logout());
    navigate('/auth');
  };

  const jobsActive = location.pathname.startsWith('/jobs') || location.pathname === '/explore-jobs';
  const appsActive = location.pathname === '/applications';
  const savedActive = location.pathname === '/saved';
  const profileActive = location.pathname === '/profile';
  const settingsActive = location.pathname.startsWith('/settings');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="w-full bg-[#FDF7E9]  h-[76px] sticky top-0 z-50  sm:px-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-4 md:px-2 w-full h-full md:gap-8">
        
        {/* 1. Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer order-1 shrink-0"
          onClick={() => navigate('/dashboard')}
        >
          <img src={logo} alt="meretium" className="h-6 md:h-7 w-auto object-contain" />
        </div>

        {/* 2. Actions (Links, Notifications, Avatar) */}
        <div className="flex items-center gap-4 md:gap-7 bg-transparent order-2 md:order-3 ml-auto z-50">
          
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
            {/* Notifications */}
            <div 
              onClick={() => navigate('/messages')}
              className="relative cursor-pointer text-gray-500 hover:text-gray-800 transition-colors"
            >
              <MessageSquare size={20} className="md:w-[22px] md:h-[22px]" />
              <span className="absolute -top-1.5 -right-1.5 bg-[#FF6934] text-white text-[9px] md:text-[10px] font-bold size-4 md:size-4.5 flex items-center justify-center rounded-full border-2 border-[#FCF8F1]">3</span>
            </div>
            <div 
              onClick={() => setIsNotificationsOpen(true)}
              className="relative cursor-pointer text-gray-500 hover:text-gray-800 transition-colors"
            >
              <Bell size={20} className="md:w-[22px] md:h-[22px]" />
              <span className="absolute -top-1.5 -right-1.5 bg-[#FF6934] text-white text-[9px] md:text-[10px] font-bold size-4 md:size-4.5 flex items-center justify-center rounded-full border-2 border-[#FCF8F1]">5</span>
            </div>
            
            <NotificationsModal 
              isOpen={isNotificationsOpen} 
              onClose={() => setIsNotificationsOpen(false)} 
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
                    onClick={handleLogout}
                    className="w-full flex items-center cursor-pointer gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium mt-1 border-t border-gray-50 pt-3"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Search Bar - hidden on mobile, visible on desktop */}
        <div className="hidden md:flex flex-1 w-full max-w-xl relative order-2 z-10 md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 md:size-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search jobs, companies, skills..."
            className="w-full bg-[#F5F1E9]/80 md:bg-[#F5F1E9]/50 font-[400] border border-gray-200/80 md:border-gray-200/50 rounded-[10px] py-2.5 md:py-2 pl-10 md:pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6934]/20 transition-all placeholder:text-gray-400"
          />
        </div>

      </div>
    </nav>
  );
}
