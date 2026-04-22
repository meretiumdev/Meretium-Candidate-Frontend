import { CheckCircle, MapPin, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import companyBanner from '../../../assets/company-profile/Company banner.png';

export default function CompanyHero({ onViewJobs, activeTab }: { onViewJobs: () => void; activeTab: string }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-[10px] overflow-hidden shadow-sm font-manrope">
      {/* Banner */}
      <div className="relative h-[180px] md:h-[220px] overflow-hidden bg-gray-100">
        <img 
          src={companyBanner} 
          alt="Company banner" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay for better text readability and style */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Company Info Row */}
      <div className="px-6 md:px-8 pb-6">
        {/* Logo */}
        <div className="relative -mt-10 mb-4">
          <div className="w-[207px] h-[96px] bg-white border-1 border-gray-200 rounded-[19px] flex items-center justify-center shadow-sm">
            <div className="  flex items-center justify-center shadow-sm shrink-0">
            {/* Visual placeholder for Notion logo style in image */}
            <span className="text-[33px]">📝</span>
          </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[26px] md:text-[30px] font-bold text-[#101828]">Notion</h1>
              <div className="flex items-center gap-1 text-[#12B76A] mt-1 bg-[#ECFDF3] px-3 py-1.5 rounded-[20px] text-[13px] font-medium">
                <CheckCircle size={15} className="text-[#12B76A]" />
                Verified
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[14px] text-[#475467] font-regular">
              <div className="flex items-center gap-1">
                <MapPin size={14} className="text-[#475467]" />
                London (Remote)
              </div>
              <span className="text-gray-900">•</span>
              <span>Software Development</span>
              <span className="text-gray-900">•</span>
              <span>201–500 employees</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onViewJobs}
              className={`${activeTab === 'jobs' ? 'bg-[#e55a2b]' : 'bg-[#FF6934]'} hover:bg-[#e55a2b] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-semibold transition-colors cursor-pointer shadow-sm shadow-orange-100 min-w-[140px]`}
            >
              View Open Jobs
            </button>
            <a
              href="https://notion.so"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-[#344054] px-5 py-2.5 rounded-[10px] text-[14px] font-semibold transition-colors cursor-pointer"
            >
              <Globe size={15} />
              Visit Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
