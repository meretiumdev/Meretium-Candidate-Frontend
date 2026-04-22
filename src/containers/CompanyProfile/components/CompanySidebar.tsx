import { CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const COMPANY_STATS = [
  { label: 'Jobs posted', value: '24', highlight: false },
  { label: 'Applicants', value: '1,240', highlight: false },
  { label: 'Response rate', value: '85%', highlight: true },
  { label: 'Last active', value: '2 days ago', highlight: false },
];

const VERIFICATION_ITEMS = [
  'Business registration verified',
  'Company email verified',
  'Address verified',
];

export default function CompanySidebar({ onViewJobs }: { onViewJobs: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-[10px] p-6 shadow-sm font-manrope">
      {/* Company Info Section */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="size-14 bg-[#F9FAFB] border border-gray-100 rounded-[10px] flex items-center justify-center shadow-sm shrink-0">
            {/* Visual placeholder for Notion logo style in image */}
            <span className="text-[24px]">📝</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] font-bold text-[#101828]">Notion</h2>
              <div className="size-5  flex items-center justify-center">
                <CheckCircle size={18} className="text-[#12B76A]" />
              </div>
            </div>
            <p className="text-[14px] text-[#475467] font-regular">All-in-one workspace for teams</p>
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

      {/* Company Stats Section */}
      <div className="mb-6">
        <h3 className="text-[16px] font-bold text-[#101828] mb-6">Company Stats</h3>
        <div className="space-y-5">
          {COMPANY_STATS.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="text-[14px] text-[#98A2B3] font-regular">{stat.label}</span>
              <span className={`text-[14px] font-semibold ${stat.highlight ? 'text-[#12B76A]' : 'text-[#101828]'}`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[1px] bg-gray-100 w-full mb-6" />

      {/* Social Links Section */}
      <div className="mb-6">
        <h3 className="text-[16px] font-bold text-[#101828] mb-6">Social Links</h3>
        <div className="flex items-center gap-3">
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="size-12 bg-white hover:bg-gray-50 text-[#475467] border border-[#E4E7EC] rounded-[12px] flex items-center justify-center transition-all cursor-pointer"
            aria-label="LinkedIn"
          >
            <LinkedinIcon />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="size-12 bg-white hover:bg-gray-50 text-[#475467] border border-[#E4E7EC] rounded-[12px] flex items-center justify-center transition-all cursor-pointer"
            aria-label="Twitter"
          >
            <TwitterIcon />
          </a>
          <a
            href="https://notion.so"
            target="_blank"
            rel="noopener noreferrer"
            className="size-12 bg-white hover:bg-gray-50 text-[#475467] border border-[#E4E7EC] rounded-[12px] flex items-center justify-center transition-all cursor-pointer"
            aria-label="Website"
          >
            <ExternalLink size={20} />
          </a>
        </div>
      </div>

      <div className="h-[1px] bg-gray-100 w-full mb-6" />

      {/* Verification Section */}
      <div>
        <h3 className="text-[16px] font-bold text-[#101828] mb-6">Verification</h3>
        <div className="space-y-4">
          {VERIFICATION_ITEMS.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <CheckCircle size={18} className="text-[#12B76A] shrink-0" />
              <span className="text-[14px] text-[#475467] font-semibold">{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#98A2B3] mt-4 leading-relaxed font-regular">
          Verified companies are trusted by candidates on Meretium
        </p>
      </div>
    </div>
  );
}
