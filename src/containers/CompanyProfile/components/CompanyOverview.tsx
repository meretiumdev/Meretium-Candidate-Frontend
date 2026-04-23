import { Building2, Calendar, Globe, Mail, MapPin, Users } from 'lucide-react';
import type { CandidateCompanyDetail } from '../../../services/companyApi';

interface CompanyOverviewProps {
  company: CandidateCompanyDetail | null;
}

interface OverviewItem {
  icon: typeof Calendar;
  label: string;
  value: string;
  isLink?: boolean;
  isEmail?: boolean;
}

function getOverviewItems(company: CandidateCompanyDetail | null): OverviewItem[] {
  return [
    {
      icon: Calendar,
      label: 'Founded',
      value: company?.founded_year || 'Not specified',
    },
    {
      icon: MapPin,
      label: 'Headquarters',
      value: company?.location || 'Not specified',
    },
    {
      icon: Users,
      label: 'Company Size',
      value: company?.size_range || 'Not specified',
    },
    {
      icon: Building2,
      label: 'Industry',
      value: company?.industry || 'Not specified',
    },
    {
      icon: Globe,
      label: 'Website',
      value: company?.website || 'Not specified',
      isLink: !!company?.website,
    },
    {
      icon: Mail,
      label: 'Email',
      value: company?.email || 'Not specified',
      isLink: !!company?.email,
      isEmail: true,
    },
  ];
}

export default function CompanyOverview({ company }: CompanyOverviewProps) {
  const overviewItems = getOverviewItems(company);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope">
      <h2 className="text-[20px] font-bold text-[#101828] mb-6">Company Overview</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {overviewItems.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <div className="size-9 flex items-center justify-center shrink-0">
              <item.icon size={20} className="text-[#475467] -mt-2" />
            </div>
            <div>
              <p className="text-[14px] text-[#98A2B3] mb-0.5">{item.label}</p>
              {item.isEmail && item.value !== 'Not specified' ? (
                <a
                  href={`mailto:${item.value}`}
                  className="text-[16px] font-medium text-[#FF6934] hover:underline break-all"
                >
                  {item.value}
                </a>
              ) : item.isLink && item.value !== 'Not specified' ? (
                <a
                  href={item.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[16px] font-medium text-[#FF6934] hover:underline break-all"
                >
                  {item.value}
                </a>
              ) : (
                <p className="text-[16px] font-medium text-[#101828] break-all">{item.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
