import {
  MapPin,
  Calendar,
  CheckCircle2,
  Download,
  Mail,
  Phone,
  Building2,
  Flame,
} from 'lucide-react';

// Imports from new files
import { SectionCard } from './components/SectionCard';
import { ContactInfoItem } from './components/ContactInfoItem';
import { MOCK_PROFILE, MOCK_EXPERIENCES, MOCK_SKILL_GROUPS } from './constants';

export default function PublicView() {
  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 space-y-5 bg-[#F9FAFB] min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">

     

      {/* ── Header Card ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm font-manrope">
        <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6 relative">

          {/* Avatar */}
          <div className="size-13 rounded-full flex items-center justify-center text-white text-[24px] font-semibold shrink-0 bg-[#FF6934]">
            {MOCK_PROFILE.initial}
          </div>

          {/* Info */}
          <div className="flex flex-col flex-1 w-full">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-[24px] md:text-[32px] font-semibold text-[#101828] mb-1 leading-tight">
                  {MOCK_PROFILE.fullName}
                </h1>
                <p className="text-[15px] md:text-[17px] text-[#475467] leading-relaxed font-body max-w-2xl">
                  {MOCK_PROFILE.headline}
                </p>
              </div>

              {/* Download Resume */}
              <button
                id="public-view-download-resume"
                className="flex items-center gap-2 border border-[#E4E7EC] px-4 py-2 rounded-[10px] text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors bg-white cursor-pointer shadow-sm shrink-0"
              >
                <Download size={16} />
                Download Resume
              </button>
            </div>

            {/* Location & Experience */}
            <div className="flex flex-wrap items-center gap-4 text-[14px] font-medium text-[#475467] font-body mt-4">
              <div className="flex items-center gap-1.5">
                <MapPin size={16} className="text-[#475467]" />
                {MOCK_PROFILE.location}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={16} className="text-[#475467]" />
                {MOCK_PROFILE.experienceLabel}
              </div>
            </div>

            {/* Open to work badge */}
            {MOCK_PROFILE.isOpenToWork && (
              <div className="mt-4">
                <span className="text-[14px] px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit font-medium bg-[#D1FADF]/50 text-[#039855]">
                  <CheckCircle2 size={16} />
                  Open to work
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── About ── */}
      <SectionCard title="About">
        <p className="text-[14px] text-[#475467] font-medium leading-relaxed font-body">
          {MOCK_PROFILE.about}
        </p>
      </SectionCard>

      {/* ── Contact Info ── */}
      <SectionCard title="Contact Info">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ContactInfoItem
            icon={<Mail size={18} className="text-[#FF6934]" />}
            label="Email"
            value={MOCK_PROFILE.email}
          />
          <ContactInfoItem
            icon={<Phone size={18} className="text-[#FF6934]" />}
            label="Contact Info"
            value={MOCK_PROFILE.phone}
          />
        </div>
      </SectionCard>

      {/* ── Experience ── */}
      <SectionCard title="Experience">
        <div className="flex flex-col">
          {MOCK_EXPERIENCES.map((exp, index) => (
            <div
              key={exp.id}
              className={`flex gap-4 md:gap-5 ${
                index !== MOCK_EXPERIENCES.length - 1
                  ? 'border-b border-gray-200 pb-8 mb-8'
                  : ''
              }`}
            >
              {/* Icon column */}
              <div className="flex flex-col items-center self-stretch shrink-0">
                <div className="size-11 bg-[#FFF4EC] rounded-full flex items-center justify-center">
                  <Building2 size={20} className="text-[#FF6934]" />
                </div>
                {index !== MOCK_EXPERIENCES.length - 1 && (
                  <div className="w-[1px] flex-1 bg-[#E4E7EC] mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-semibold text-[#101828] mb-1">{exp.role}</h3>
                <p className="text-[15px] font-medium text-[#475467] mb-1">{exp.company}</p>
                <p className="text-[14px] font-medium text-[#98A2B3]">{exp.duration}</p>

                {exp.bullets.length > 0 && (
                  <div className="mt-5 space-y-3">
                    {exp.bullets.map((bullet, bi) => (
                      <div key={bi} className="flex flex-row items-start gap-2">
                        <div className="size-[5px] rounded-full bg-[#FF6934] shrink-0 mt-[8px]" />
                        <p className="text-[14px] text-[#475467] font-medium leading-relaxed">
                          {bullet}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Skills ── */}
      <SectionCard title="Skills">
        <div className="space-y-8">
          {MOCK_SKILL_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-[13px] font-bold text-[#667085] uppercase tracking-wider mb-4">
                {group.title}
              </h4>
              <div className="flex flex-wrap gap-3">
                {group.skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="bg-[#F9FAFB] border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm"
                  >
                    <span className="text-[14px] font-medium text-[#101828]">{skill.name}</span>
                    {skill.hot && (
                      <Flame size={16} strokeWidth={2.5} className="text-[#FF6934] shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

    </div>
  );
}
