export const DATE_POSTED_OPTIONS = [
  { label: 'Last 24 hours', value: 'last_24hours' },
  { label: 'Last 3 days', value: 'last_3days' },
  { label: 'Last 5 days', value: 'last_5days' },
  { label: 'Last 7 days', value: 'last_7days' },
  { label: 'Last 30 days', value: 'last_30days' },
] as const;

export const JOB_TYPE_OPTIONS = [
  { label: 'Full-time', value: 'FULL_TIME' },
  { label: 'Part-time', value: 'PART_TIME' },
  { label: 'Contract', value: 'CONTRACT' },
  { label: 'Internship', value: 'INTERNSHIP' },
  { label: 'Graduate Scheme', value: 'GRADUATE_SCHEME' },
  { label: 'Apprenticeship', value: 'APPRENTICESHIP' },
] as const;

export const EXPERIENCE_LEVEL_OPTIONS = [
  { label: 'Entry Level', value: 'ENTRY' },
  { label: 'Mid-Level', value: 'MID' },
  { label: 'Senior Level', value: 'SENIOR' },
  { label: 'Lead / Principal', value: 'LEAD' },
] as const;

export const WORK_MODE_OPTIONS = [
  { label: 'Remote', value: 'REMOTE' },
  { label: 'Hybrid', value: 'HYBRID' },
  { label: 'On-site', value: 'ON_SITE' },
  { label: 'Any', value: 'ANY' },
] as const;

export const SALARY_CURRENCY_OPTIONS = [
  { label: 'USD-US Dollar', value: 'USD' },
  { label: 'GBP-UK Pound', value: 'GBP' },
  { label: 'EUR-Euro', value: 'EUR' },
  { label: 'AED-UAE Dirham', value: 'AED' },
  { label: 'SAR-Saudi Riyal', value: 'SAR' },
  { label: 'PKR-Pakistani Rupee', value: 'PKR' },
] as const;

export type DatePostedFilter = (typeof DATE_POSTED_OPTIONS)[number]['value'];
export type JobTypeFilter = (typeof JOB_TYPE_OPTIONS)[number]['value'];
export type ExperienceLevelFilter = (typeof EXPERIENCE_LEVEL_OPTIONS)[number]['value'];
export type WorkModeFilter = (typeof WORK_MODE_OPTIONS)[number]['value'];
export type SalaryCurrencyFilter = (typeof SALARY_CURRENCY_OPTIONS)[number]['value'];

export interface JobsFilters {
  datePosted: DatePostedFilter | null;
  jobType: JobTypeFilter | null;
  experienceLevel: ExperienceLevelFilter | null;
  workMode: WorkModeFilter | null;
  salaryCurrency: SalaryCurrencyFilter | null;
  minSalary: number | null;
  maxSalary: number | null;
}

export const SALARY_MIN_BOUND = 0;
export const SALARY_MAX_BOUND = 300000;
export const SALARY_STEP = 1000;

export const DEFAULT_JOBS_FILTERS: JobsFilters = {
  datePosted: null,
  jobType: null,
  experienceLevel: null,
  workMode: null,
  salaryCurrency: null,
  minSalary: null,
  maxSalary: null,
};
