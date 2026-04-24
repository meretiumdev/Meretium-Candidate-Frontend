import { CheckCircle, ExternalLink } from 'lucide-react';
import type { CandidateCompanyDetail } from '../../../services/companyApi';

interface CompanySidebarProps {
  company: CandidateCompanyDetail | null;
  onViewJobs: () => void;
}

function LinkedinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function formatNumber(value: number | null): string {
  if (value === null) return 'N/A';
  return value.toLocaleString();
}

function formatLastActive(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'N/A';

  const parsedDate = new Date(trimmed);
  if (Number.isNaN(parsedDate.getTime())) return trimmed;

  const diffMs = Date.now() - parsedDate.getTime();
  if (diffMs <= 0) return 'just now';

  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;
  const monthMs = 30 * dayMs;

  if (diffMs < minuteMs) return 'just now';
  if (diffMs < hourMs) {
    const minutes = Math.floor(diffMs / minuteMs);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (diffMs < dayMs) {
    const hours = Math.floor(diffMs / hourMs);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (diffMs < monthMs) {
    const days = Math.floor(diffMs / dayMs);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  const months = Math.floor(diffMs / monthMs);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

export default function CompanySidebar({ company, onViewJobs }: CompanySidebarProps) {
  const companyName = company?.name || 'Company';
  const tagline = company?.tagline || 'No company tagline available';
  const logoUrl = company?.logo_url || '';

  const socialLinks = [
    {
      key: 'linkedin',
      href: company?.social_links.linkedin || '',
      label: 'LinkedIn',
      icon: <LinkedinIcon />,
    },
    {
      key: 'twitter',
      href: company?.social_links.twitter || '',
      label: 'Twitter',
      icon: <TwitterIcon />,
    },
    {
      key: 'website',
      href: company?.social_links.website || company?.website || '',
      label: 'Website',
      icon: <ExternalLink size={20} />,
    },
  ].filter((item) => item.href);

  return (
    <div className="bg-white border border-gray-200 rounded-[10px] p-6 shadow-sm font-manrope">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="size-14 bg-[#F9FAFB] border border-gray-100 rounded-[10px] flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={`${companyName} logo`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[24px] font-bold text-[#FF6934]">
                {companyName.charAt(0).toUpperCase() || 'C'}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] font-bold text-[#101828]">{companyName}</h2>
              {company?.is_verified && (
                <div className="size-5 flex items-center justify-center">
                  <CheckCircle size={18} className="text-[#12B76A]" />
                </div>
              )}
            </div>
            <p className="text-[14px] text-[#475467]">{tagline}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewJobs}
          className="w-full bg-[#FF6934] text-white py-3.5 rounded-[12px] text-[14px] font-semibold transition-all cursor-pointer shadow-sm hover:opacity-90"
        >
          View Open Jobs
        </button>
      </div>

      <div className="h-[1px] bg-gray-100 w-full mb-6" />

      <div className="mb-6">
        <h3 className="text-[16px] font-bold text-[#101828] mb-6">Company Stats</h3>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#98A2B3]">Jobs posted</span>
            <span className="text-[14px] font-semibold text-[#101828]">
              {formatNumber(company?.stats.jobs_posted ?? null)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#98A2B3]">Applicants</span>
            <span className="text-[14px] font-semibold text-[#101828]">
              {formatNumber(company?.stats.applicants_count ?? null)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#98A2B3]">Response rate</span>
            <span className="text-[14px] font-semibold text-[#12B76A]">
              {company?.stats.response_rate || 'N/A'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#98A2B3]">Last active</span>
            <span className="text-[14px] font-semibold text-[#101828]">
              {formatLastActive(company?.stats.last_active || '')}
            </span>
          </div>
        </div>
      </div>

      {socialLinks.length > 0 && (
        <>
          <div className="h-[1px] bg-gray-100 w-full mb-6" />

          <div className="mb-6">
            <h3 className="text-[16px] font-bold text-[#101828] mb-6">Social Links</h3>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.key}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-12 bg-white hover:bg-gray-50 text-[#475467] border border-[#E4E7EC] rounded-[12px] flex items-center justify-center transition-all cursor-pointer"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="h-[1px] bg-gray-100 w-full mb-6" />

      <div>
        <h3 className="text-[16px] font-bold text-[#101828] mb-6">Verification</h3>
        {company?.is_verified ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-[#12B76A] shrink-0" />
              <span className="text-[14px] text-[#475467] font-semibold">Business registration verified</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-[#12B76A] shrink-0" />
              <span className="text-[14px] text-[#475467] font-semibold">Company profile verified</span>
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-[#475467]">Verification details are not available.</p>
        )}
        <p className="text-[11px] text-[#98A2B3] mt-4 leading-relaxed">
          Verified companies are trusted by candidates on Meretium.
        </p>
      </div>
    </div>
  );
}
