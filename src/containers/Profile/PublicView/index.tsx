import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Building2,
  GraduationCap,
  Loader2,
} from 'lucide-react';

import {
  getPublicCandidateProfile,
  getPublicCandidateProfileResume,
  type CandidateProfileResponse,
} from '../../../services/profileApi';
import { SectionCard } from './components/SectionCard';

interface DisplayProfile {
  fullName: string;
  initial: string;
  headline: string;
  location: string;
  experienceLabel: string;
  isOpenToWork: boolean;
  about: string;
  resumeUrl: string;
}

interface DisplayExperience {
  id: string;
  role: string;
  company: string;
  duration: string;
  bullets: string[];
}

interface DisplayProject {
  id: string;
  title: string;
  description: string;
  link: string;
  skills: string[];
}

interface DisplayEducation {
  id: string;
  institute: string;
  program: string;
  year: string;
}

interface DisplaySkillGroup {
  title: string;
  skills: Array<{ id: string; name: string }>;
}

interface PublicDisplayData {
  profile: DisplayProfile;
  experiences: DisplayExperience[];
  projects: DisplayProject[];
  educations: DisplayEducation[];
  skillGroups: DisplaySkillGroup[];
}

const SKILL_GROUP_TITLES: Record<string, string> = {
  CORE: 'Core Skills',
  TOOLS: 'Tools & Technologies',
  'SOFT SKILLS': 'Soft Skills',
};

const SKILL_GROUP_ORDER = ['CORE', 'TOOLS', 'SOFT SKILLS'];

function asRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function readBoolean(record: Record<string, unknown>, keys: string[]): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') return true;
      if (normalized === 'false' || normalized === '0') return false;
    }
  }
  return false;
}

function toMonthYear(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
}

function toYear(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return String(date.getUTCFullYear());
}

function getDuration(record: Record<string, unknown>, currentKeys: string[]): string {
  const explicitDuration = readString(record, ['duration']);
  if (explicitDuration) return explicitDuration;

  const start = readString(record, ['start_date', 'startDate', 'from']);
  const end = readString(record, ['end_date', 'endDate', 'to']);
  const current = readBoolean(record, currentKeys);

  if (!start && !end) return '';
  if (start && !end && current) return `${toMonthYear(start)} - Present`;
  if (start && end) return `${toMonthYear(start)} - ${toMonthYear(end)}`;
  if (start) return toMonthYear(start);
  return toMonthYear(end);
}

function getExperienceBullets(record: Record<string, unknown>): string[] {
  const possibleArrays = [record.achievements, record.bullets, record.responsibilities, record.highlights];

  for (const possible of possibleArrays) {
    if (!Array.isArray(possible)) continue;
    const items = possible
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
    if (items.length > 0) return items;
  }

  const description = readString(record, ['description', 'summary']);
  return description ? [description] : [];
}

function normalizeCategoryLabel(raw: string): string {
  const normalized = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (normalized === 'TOOLS' || normalized === 'TOOL') return 'TOOLS';
  if (normalized === 'SOFT_SKILLS' || normalized === 'SOFTSKILLS' || normalized === 'SOFT') return 'SOFT SKILLS';
  return 'CORE';
}

function readSkillName(input: unknown): string {
  if (typeof input === 'string') return input.trim();
  const record = asRecord(input);
  if (!record) return '';
  return readString(record, ['name', 'skill', 'title']);
}

function readProjectSkills(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  const seen = new Set<string>();
  return input.reduce<string[]>((acc, item) => {
    const name = readSkillName(item);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) return acc;
    seen.add(key);
    acc.push(name);
    return acc;
  }, []);
}

function normalizePublicData(data: CandidateProfileResponse): PublicDisplayData {
  const profile = data.profile;
  const fullName = profile.full_name || 'Unnamed User';
  const totalYears = profile.total_years_experience;
  const displayProfile: DisplayProfile = {
    fullName,
    initial: fullName.trim().charAt(0).toUpperCase() || 'U',
    headline: profile.headline || 'No headline added yet.',
    location: profile.location || 'Location not added',
    experienceLabel: totalYears === 1 ? '1 year experience' : `${totalYears || 0} years experience`,
    isOpenToWork: profile.is_open_to_work,
    about: profile.about,
    resumeUrl: profile.resume_url || '',
  };

  const experiences = data.experiences.map<DisplayExperience>((experience, index) => ({
    id: readString(experience, ['id', 'experience_id']) || `experience-${index + 1}`,
    role: readString(experience, ['role', 'role_title', 'title', 'position']) || 'Untitled role',
    company: readString(experience, ['company', 'company_name', 'organization']) || 'Company not provided',
    duration: getDuration(experience, ['is_current', 'isCurrent', 'currently_working']) || 'Duration not provided',
    bullets: getExperienceBullets(experience),
  }));

  const projects = data.projects.map<DisplayProject>((project, index) => ({
    id: readString(project, ['id', 'project_id']) || `project-${index + 1}`,
    title: readString(project, ['title', 'name', 'project_title']) || `Project ${index + 1}`,
    description: readString(project, ['description', 'summary']),
    link: readString(project, ['link', 'url', 'project_url']),
    skills: readProjectSkills(project.skills),
  }));

  const educations = data.educations.map<DisplayEducation>((education, index) => {
    const duration = getDuration(education, ['is_current', 'isCurrent', 'currently_studying']);
    const end = readString(education, ['end_date', 'endDate', 'to']);
    const start = readString(education, ['start_date', 'startDate', 'from']);

    return {
      id: readString(education, ['id', 'education_id']) || `education-${index + 1}`,
      institute: readString(education, ['institute', 'school', 'school_name', 'institution']) || 'Unknown institute',
      program: readString(education, ['program', 'degree', 'course', 'field_of_study']) || 'Program not provided',
      year: duration || (end ? toYear(end) : toYear(start)),
    };
  });

  const groupedSkills = new Map<string, Array<{ id: string; name: string }>>();
  SKILL_GROUP_ORDER.forEach((category) => groupedSkills.set(category, []));

  const addSkill = (skill: unknown, fallbackCategory = 'CORE') => {
    const record = asRecord(skill);
    const name = readSkillName(skill);
    if (!name) return;

    const category = normalizeCategoryLabel(
      (record ? readString(record, ['category', 'group', 'type']) : '') || fallbackCategory
    );
    const items = groupedSkills.get(category) || [];
    if (items.some((item) => item.name.toLowerCase() === name.toLowerCase())) return;
    items.push({ id: `${category}-${name}`, name });
    groupedSkills.set(category, items);
  };

  if (Array.isArray(data.skills)) {
    data.skills.forEach((skill) => addSkill(skill));
  } else {
    const skillsRecord = asRecord(data.skills);
    if (skillsRecord) {
      Object.entries(skillsRecord).forEach(([category, items]) => {
        if (Array.isArray(items)) items.forEach((skill) => addSkill(skill, category));
      });
    }
  }

  const skillGroups = SKILL_GROUP_ORDER.map<DisplaySkillGroup>((category) => ({
    title: SKILL_GROUP_TITLES[category],
    skills: groupedSkills.get(category) || [],
  })).filter((group) => group.skills.length > 0);

  return { profile: displayProfile, experiences, projects, educations, skillGroups };
}

function getEmptyPublicData(): PublicDisplayData {
  return {
    profile: {
      fullName: 'Profile name unavailable',
      initial: 'U',
      headline: 'No headline added yet.',
      location: 'Location not added',
      experienceLabel: '0 years experience',
      isOpenToWork: false,
      about: '',
      resumeUrl: '',
    },
    experiences: [],
    projects: [],
    educations: [],
    skillGroups: [],
  };
}

function EmptySectionMessage({ children }: { children: string }) {
  return (
    <p className="text-[13px] md:text-[14px] text-[#98A2B3] leading-relaxed">
      {children}
    </p>
  );
}

export default function PublicView() {
  const { shareSlug } = useParams<{ shareSlug?: string }>();
  const [profileData, setProfileData] = useState<CandidateProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(shareSlug));
  const [isResumeLoading, setIsResumeLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resumeErrorMessage, setResumeErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!shareSlug) {
      setProfileData(null);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);
    setResumeErrorMessage(null);

    getPublicCandidateProfile(shareSlug)
      .then((response) => {
        if (!isMounted) return;
        setProfileData(response);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        const message = error instanceof Error && error.message.trim()
          ? error.message
          : 'Unable to load this public profile.';
        setErrorMessage(message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [shareSlug]);

  const displayData = useMemo(
    () => (profileData ? normalizePublicData(profileData) : getEmptyPublicData()),
    [profileData]
  );

  const handleResumeClick = async () => {
    if (!shareSlug || isResumeLoading) return;

    setIsResumeLoading(true);
    setResumeErrorMessage(null);
    try {
      const response = await getPublicCandidateProfileResume(shareSlug);
      window.open(response.download_url, '_blank', 'noopener,noreferrer');
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Resume download is not available.';
      setResumeErrorMessage(message);
    } finally {
      setIsResumeLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 font-manrope">
        <div className="mx-auto flex min-h-[420px] max-w-[1344px] items-center justify-center rounded-xl border border-[#E4E7EC] bg-white">
          <div className="flex items-center gap-3 text-[14px] font-medium text-[#475467]">
            <Loader2 size={18} className="animate-spin text-[#FF6934]" />
            Loading profile...
          </div>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 font-manrope">
        <div className="mx-auto max-w-[720px] rounded-xl border border-[#FDA29B] bg-[#FEF3F2] p-6 text-center">
          <h1 className="text-[20px] font-semibold text-[#101828]">Profile unavailable</h1>
          <p className="mt-2 text-[14px] text-[#B42318]">{errorMessage}</p>
        </div>
      </main>
    );
  }

  const { profile, experiences, projects, educations, skillGroups } = displayData;

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 font-manrope">
      <div className="mx-auto max-w-[1344px] space-y-4">
        <section className="bg-white border border-[#E4E7EC] rounded-xl p-5 md:p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="size-14 md:size-16 rounded-full flex items-center justify-center text-white text-[24px] md:text-[28px] font-semibold shrink-0 bg-[#FF6934]">
              {profile.initial}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-[26px] md:text-[34px] font-semibold text-[#101828] leading-tight">
                    {profile.fullName}
                  </h1>
                  <p className="mt-1 text-[15px] md:text-[17px] text-[#475467] leading-relaxed">
                    {profile.headline}
                  </p>
                </div>

                <button
                  id="public-view-download-resume"
                  type="button"
                  onClick={() => { void handleResumeClick(); }}
                  disabled={!shareSlug || !profile.resumeUrl || isResumeLoading}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 border border-[#E4E7EC] px-3 py-2 rounded-[8px] text-[12px] font-medium text-[#101828] hover:bg-[#F9FAFB] transition-colors bg-white disabled:text-[#98A2B3] disabled:cursor-not-allowed"
                >
                  Resume
                  {isResumeLoading ? (
                    <Loader2 size={13} className="animate-spin text-[#FF6934]" />
                  ) : (
                    <ExternalLink size={13} className={shareSlug && profile.resumeUrl ? 'text-[#FF6934]' : 'text-[#98A2B3]'} />
                  )}
                </button>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-[13px] font-medium text-[#475467]">
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#475467]" />
                  {profile.location}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#475467]" />
                  {profile.experienceLabel}
                </div>
              </div>

              {profile.isOpenToWork && (
                <div className="mt-4">
                  <span className="text-[13px] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 font-medium bg-[#D1FADF]/70 text-[#039855]">
                    <CheckCircle2 size={14} />
                    Open to work
                  </span>
                </div>
              )}

              {resumeErrorMessage && (
                <p className="mt-3 text-[12px] font-medium text-[#B42318]">{resumeErrorMessage}</p>
              )}
            </div>
          </div>
        </section>

        <SectionCard title="About">
          {profile.about ? (
            <p className="text-[13px] md:text-[14px] text-[#475467] leading-relaxed">
              {profile.about}
            </p>
          ) : (
            <EmptySectionMessage>No about information has been added yet.</EmptySectionMessage>
          )}
        </SectionCard>

        <SectionCard title="Experience">
          {experiences.length > 0 ? (
            <div>
              {experiences.map((experience, index) => {
                const isLast = index === experiences.length - 1;

                return (
                  <div
                    key={experience.id}
                    className={`flex gap-4 md:gap-5 ${isLast ? '' : 'border-b border-[#EAECF0] pb-8 mb-8'}`}
                  >
                    <div className="flex flex-col items-center self-stretch shrink-0">
                      <div className="size-8 rounded-full bg-[#FFF4EC] flex items-center justify-center">
                        <Building2 size={16} className="text-[#FF6934]" />
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-[#D0D5DD] mt-2" />}
                    </div>

                    <div className="min-w-0 flex-1 pt-1">
                      <h3 className="text-[14px] font-semibold text-[#101828]">
                        {experience.role}
                      </h3>
                      <p className="mt-1 text-[13px] font-medium text-[#344054]">{experience.company}</p>
                      <p className="mt-1 text-[12px] text-[#98A2B3]">{experience.duration}</p>

                      {experience.bullets.length > 0 && (
                        <ul className="mt-4 space-y-2">
                          {experience.bullets.map((bullet) => (
                            <li key={bullet} className="flex items-start gap-2">
                              <span className="mt-[7px] size-1.5 rounded-full bg-[#FF6934] shrink-0" />
                              <span className="text-[13px] text-[#475467] leading-relaxed">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptySectionMessage>No experience has been added yet.</EmptySectionMessage>
          )}
        </SectionCard>

        <SectionCard title="Projects & Portfolio">
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="relative rounded-[8px] border border-[#E4E7EC] bg-white p-4 pr-10"
                >
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${project.title}`}
                      className="absolute right-4 top-4 text-[#FF6934] hover:text-[#C4320A] transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <h3 className="text-[14px] font-semibold text-[#101828]">{project.title}</h3>
                  {project.description && (
                    <p className="mt-2 max-w-[620px] text-[12px] md:text-[13px] text-[#475467] leading-relaxed">
                      {project.description}
                    </p>
                  )}
                  {project.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-[4px] border border-[#E4E7EC] bg-[#F9FAFB] px-2.5 py-1 text-[11px] font-medium text-[#475467]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <EmptySectionMessage>No projects or portfolio items have been added yet.</EmptySectionMessage>
          )}
        </SectionCard>

        <SectionCard title="Education">
          {educations.length > 0 ? (
            <div className="space-y-5">
              {educations.map((education) => (
                <div key={education.id} className="flex items-start gap-4">
                  <div className="size-8 rounded-full bg-[#FFF4EC] flex items-center justify-center shrink-0">
                    <GraduationCap size={16} className="text-[#FF6934]" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-[14px] font-semibold text-[#101828]">{education.institute}</h3>
                    <p className="mt-1 text-[13px] text-[#475467]">{education.program}</p>
                    {education.year && <p className="mt-1 text-[12px] text-[#98A2B3]">{education.year}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptySectionMessage>No education has been added yet.</EmptySectionMessage>
          )}
        </SectionCard>

        <SectionCard title="Skills">
          {skillGroups.length > 0 ? (
            <div className="space-y-6">
              {skillGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-[12px] font-medium text-[#344054] mb-3">{group.title}</h3>
                  <div className="flex flex-wrap gap-3">
                    {group.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="min-w-[118px] text-center rounded-[6px] border border-[#E4E7EC] bg-[#F9FAFB] px-4 py-2 text-[12px] font-medium text-[#101828]"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptySectionMessage>No skills have been added yet.</EmptySectionMessage>
          )}
        </SectionCard>
      </div>
    </main>
  );
}
