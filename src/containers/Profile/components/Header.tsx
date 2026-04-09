import { useState } from 'react';
import { MapPin, Share2, ChevronDown, Edit3, Calendar, CheckCircle2, Upload } from 'lucide-react';
import { useRef } from 'react';
import ShareProfileModal from './ShareProfileModal';

export default function Header({ isEditing, setIsEditing }: { isEditing: boolean, setIsEditing: (v: boolean) => void }) {
  const [headline, setHeadline] = useState("Senior Product Designer specializing in design systems and user-centered experiences");
  const [location, setLocation] = useState("London, UK");
  const [expYears, setExpYears] = useState("8");
  const [isShareOpen, setShareOpen] = useState(false);
  const [isOppsDropdownOpen, setOppsDropdownOpen] = useState(false);
  const [opportunityStatus, setOpportunityStatus] = useState('Open to work');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div className="bg-white sm:mt-3 border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope transition-all duration-300">
        <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 relative">
          
          {/* Avatar Area */}
          <div className="relative group shrink-0">
            <div 
              onClick={isEditing ? handleUploadClick : undefined}
              className={`size-10 md:size-13 rounded-full flex items-center justify-center text-white text-[20px] md:text-[24px] shrink-0 transition-colors duration-300 ${isEditing ? 'bg-[#7A331A] cursor-pointer' : 'bg-[#FF6934]'}`}
            >
              {isEditing ? (
                <div className="relative flex items-center justify-center w-full h-full">
                  <span className="opacity-40">S</span>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full hover:bg-black/20 transition-all">
                    <Upload size={24} className="text-white" />
                  </div>
                </div>
              ) : "S"}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={(e) => {
                // Handle file selection here if needed
                console.log(e.target.files?.[0]);
              }}
            />
          </div>

          <div className="flex flex-col flex-1 w-full">
            <h1 className="text-[24px] md:text-[32px] font-semibold text-[#101828] mb-1">
              Sarah Johnson
            </h1>

            {!isEditing ? (
              <>
                <div className="flex justify-between items-start gap-4 animate-in fade-in duration-300">
                  <p className="text-[16px] md:text-[18px] text-[#475467] leading-relaxed font-body">
                    {headline}
                  </p>
                  <Edit3 
                    size={18} 
                    onClick={() => setIsEditing(true)}
                    className="text-[#475467] shrink-0 cursor-pointer hover:text-gray-900 transition-colors mt-1" 
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[14px] font-medium text-[#475467] font-body mt-4 animate-in fade-in duration-300">
                  <div className="flex items-center gap-1.5"><MapPin size={16} className="text-[#475467]" /> {location}</div>
                  <div className="flex items-center gap-1.5"><Calendar size={16} className="text-[#475467]" /> {expYears} years experience</div>
                </div>

                <div className="mt-5 animate-in fade-in duration-300">
                  <span className="bg-[#D1FADF]/50 text-[#039855] text-[14px] px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit font-medium transition-all duration-300">
                    <CheckCircle2 size={16} /> {opportunityStatus}
                  </span>
                </div>

                {/* Buttons — stack on mobile, row on sm+ */}
                <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 animate-in fade-in duration-300">
                  <button 
                    onClick={() => setIsEditing(true)}
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
                      onClick={() => setOppsDropdownOpen(!isOppsDropdownOpen)}
                      className="w-full flex items-center justify-center gap-2 border border-[#E4E7EC] px-4 py-2.5 rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors bg-white cursor-pointer shadow-sm group"
                    >
                      Open to opportunities 
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
                              setOpportunityStatus('Private');
                              setOppsDropdownOpen(false);
                            }}
                            className="w-full text-left px-2 py-2 text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            Private
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Edit View */
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

                <div className="mt-4">
                  <span className="bg-[#D1FADF]/50 text-[#039855] text-[14px] px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit font-medium">
                    <CheckCircle2 size={16} /> Open to work
                  </span>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 text-[#475467] text-[14px] hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 bg-[#FF6934] text-white rounded-[10px] text-[14px] hover:opacity-90 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    Save changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ShareProfileModal isOpen={isShareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}
