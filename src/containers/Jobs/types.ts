export const DATE_POSTED_OPTIONS = [
  { label: 'Last 24 hours', value: 'last_24hours' },
  { label: 'Last 3 days', value: 'last_3days' },
  { label: 'Last 5 days', value: 'last_5days' },
  { label: 'Last 7 days', value: 'last_7days' },
  { label: 'Last 30 days', value: 'last_30days' },
] as const;

export const JOB_TYPE_OPTIONS = [
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Graduate Scheme',
  'Apprenticeship',
] as const;

export const EXPERIENCE_LEVEL_OPTIONS = [
  'Entry Level',
  'Mid-Level',
  'Senior Level',
  'Lead / Principal',
] as const;

export const WORK_MODE_OPTIONS = [
  'Remote',
  'Hybrid',
  'On-site',
] as const;

export type DatePostedFilter = (typeof DATE_POSTED_OPTIONS)[number]['value'];
export type JobTypeFilter = (typeof JOB_TYPE_OPTIONS)[number];
export type ExperienceLevelFilter = (typeof EXPERIENCE_LEVEL_OPTIONS)[number];
export type WorkModeFilter = (typeof WORK_MODE_OPTIONS)[number];

export interface JobsFilters {
  datePosted: DatePostedFilter | null;
  jobType: JobTypeFilter | null;
  experienceLevel: ExperienceLevelFilter | null;
  workMode: WorkModeFilter | null;
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
  minSalary: null,
  maxSalary: null,
};
