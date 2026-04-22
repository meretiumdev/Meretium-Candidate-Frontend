import { Calendar, MapPin, Users, Building2, Globe, Mail } from 'lucide-react';

const OVERVIEW_ITEMS = [
  {
    icon: Calendar,
    label: 'Founded',
    value: '2016',
  },
  {
    icon: MapPin,
    label: 'Headquarters',
    value: 'San Francisco, USA',
  },
  {
    icon: Users,
    label: 'Company Size',
    value: '201–500 employees',
  },
  {
    icon: Building2,
    label: 'Industry',
    value: 'Software Development',
  },
  {
    icon: Globe,
    label: 'Website',
    value: 'https://notion.so',
    isLink: true,
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'contact@notion.so',
    isLink: true,
    isEmail: true,
  },
];

export default function CompanyOverview() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope">
      <h2 className="text-[20px] font-bold text-[#101828] mb-6">Company Overview</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {OVERVIEW_ITEMS.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <div className="size-9  flex items-center justify-center shrink-0">
              <item.icon size={20} className="text-[#475467] -mt-2" />
            </div>
            <div>
              <p className="text-[14px] text-[#98A2B3] mb-0.5">{item.label}</p>
              {item.isEmail ? (
                <a
                  href={`mailto:${item.value}`}
                  className="text-[16px] font-medium text-[#FF6934] hover:underline"
                >
                  {item.value}
                </a>
              ) : item.isLink ? (
                <a
                  href={item.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[16px] font-medium text-[#FF6934] hover:underline"
                >
                  {item.value}
                </a>
              ) : (
                <p className="text-[16px] font-medium text-[#101828]">{item.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
