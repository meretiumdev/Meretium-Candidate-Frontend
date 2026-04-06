import { useState } from 'react';
import { MapPin, Share2, ChevronDown, Edit3, Calendar, CheckCircle2 } from 'lucide-react';
import ShareProfileModal from './ShareProfileModal';

export default function Header() {
  const [isShareOpen, setShareOpen] = useState(false);

  return (
    <>
      <div className="bg-white sm:mt-3 border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope transition-all duration-300">
        <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 relative">
          <div className="size-10 md:size-13 rounded-full bg-[#FF6934] flex items-center justify-center text-white text-[20px] md:text-[24px] shrink-0">
            S
          </div>

          <div className="flex flex-col flex-1 w-full">
            <h1 className="text-[24px] md:text-[32px] font-semibold text-[#101828] mb-1">
              Sarah Johnson
            </h1>
            <div className="flex justify-between items-start gap-4">
              <p className="text-[16px] md:text-[18px] text-[#475467] leading-relaxed font-body">
                Senior Product Designer specializing in design systems and user-centered experiences
              </p>
              <Edit3 size={18} className="text-[#475467] shrink-0 cursor-pointer hover:text-gray-900 transition-colors mt-1" />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[14px] font-medium text-[#475467] font-body mt-4">
              <div className="flex items-center gap-1.5"><MapPin size={16} className="text-[#475467]" /> London, UK</div>
              <div className="flex items-center gap-1.5"><Calendar size={16} className="text-[#475467]" /> 8 years experience</div>
            </div>

            <div className="mt-5">
              <span className="bg-[#D1FADF]/50 text-[#039855] text-[14px] px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit font-medium">
                <CheckCircle2 size={16} /> Open to work
              </span>
            </div>

            {/* Buttons — stack on mobile, row on sm+ */}
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <button className="flex items-center justify-center gap-2 border border-[#E4E7EC] px-4 py-2.5 rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors bg-white cursor-pointer shadow-sm">
                <Edit3 size={16} /> Edit profile
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center justify-center gap-2 border border-[#E4E7EC] px-4 py-2.5 rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors bg-white cursor-pointer shadow-sm"
              >
                <Share2 size={16} /> Share
              </button>
              <button className="flex items-center justify-center gap-2 border border-[#E4E7EC] px-4 py-2.5 rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors bg-white cursor-pointer shadow-sm">
                Open to opportunities <ChevronDown size={18} className="text-[#475467]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ShareProfileModal isOpen={isShareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}
