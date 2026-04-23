import { CheckCircle, Globe, MapPin } from 'lucide-react';
import type { CandidateCompanyDetail } from '../../../services/companyApi';

interface CompanyHeroProps {
  onViewJobs: () => void;
  activeTab: 'overview' | 'jobs';
  company: CandidateCompanyDetail | null;
}

export default function CompanyHero({ onViewJobs, activeTab, company }: CompanyHeroProps) {
  const companyName = company?.name || 'Company';
  const location = company?.location || 'Location not specified';
  const industry = company?.industry || 'Industry not specified';
  const sizeRange = company?.size_range || 'Size not specified';
  const website = company?.website || '';
  const logoUrl = company?.logo_url || '';
  const bannerUrl = company?.banner_url || '';

  return (
    <div className="bg-white border border-gray-200 rounded-[10px] overflow-hidden shadow-sm font-manrope">
      <div className="relative h-[180px] md:h-[220px] overflow-hidden bg-[#F2F4F7]">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={`${companyName} banner`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFF1EC] to-[#FEE4E2]" />
        )}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="px-6 md:px-8 pb-6">
        <div className="relative -mt-10 mb-4">
          <div className="w-[112px] h-[112px] bg-white border border-gray-200 rounded-[18px] flex items-center justify-center shadow-sm overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${companyName} logo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[36px] font-bold text-[#FF6934]">
                {companyName.charAt(0).toUpperCase() || 'C'}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[26px] md:text-[30px] font-bold text-[#101828]">{companyName}</h1>
              {company?.is_verified && (
                <div className="flex items-center gap-1 text-[#12B76A] mt-1 bg-[#ECFDF3] px-3 py-1.5 rounded-[20px] text-[13px] font-medium">
                  <CheckCircle size={15} className="text-[#12B76A]" />
                  Verified
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[14px] text-[#475467]">
              <div className="flex items-center gap-1">
                <MapPin size={14} className="text-[#475467]" />
                {location}
              </div>
              <span>|</span>
              <span>{industry}</span>
              <span>|</span>
              <span>{sizeRange}</span>
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
            {website ? (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-[#344054] px-5 py-2.5 rounded-[10px] text-[14px] font-semibold transition-colors cursor-pointer"
              >
                <Globe size={15} />
                Visit Website
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
