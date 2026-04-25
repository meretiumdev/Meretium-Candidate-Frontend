import { executeAuthorizedRequest, forceReauthIfNeeded } from './authSession';

const RAW_CANDIDATE_API_BASE_URL = import.meta.env.VITE_CANDIDATE_API_BASE_URL?.trim() || '';

function isNgrokHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized.endsWith('.ngrok-free.app') || normalized.endsWith('.ngrok.app');
}

function getCandidateApiBaseUrl(): string {
  if (!RAW_CANDIDATE_API_BASE_URL) return '';
  return RAW_CANDIDATE_API_BASE_URL.replace(/\/$/, '');
}

const CANDIDATE_API_BASE_URL = getCandidateApiBaseUrl();

export interface CandidateJobsApiCompany {
  id: string;
  name: string;
  logo_url: string;
  is_verified: boolean;
}

export interface CandidateJobsApiJob {
  id: string;
  company_id: string;
  title: string;
  company: CandidateJobsApiCompany;
  location: string;
  job_type: string;
  min_salary: number | null;
  max_salary: number | null;
  currency: string;
  required_skills: string[];
  posted_at: string;
  description: string;
  key_responsibilities: string[];
  match_percentage: number | null;
  is_saved: boolean;
}

export interface CandidateJobsListResponse {
  items: CandidateJobsApiJob[];
  total: number | null;
}

export type CandidateJobsSortBy = 'most_relevant' | 'most_recent' | 'highest_salary';
export type CandidateSavedJobStatus = 'ACTIVE' | 'APPLIED' | 'CLOSED';
export type CandidateSavedJobsSortBy = 'recently_saved' | 'oldest';

export interface CandidateSavedJobItem {
  id: string;
  job_id: string;
  job_title_snapshot: string;
  company_name_snapshot: string;
  location_snapshot: string;
  salary_min_snapshot: number | null;
  salary_max_snapshot: number | null;
  currency_snapshot: string;
  job_status_snapshot: string;
  saved_at: string;
  is_applied: boolean;
}

export interface CandidateSavedJobsStats {
  total: number;
  active: number;
  applied: number;
  closed: number;
}

export interface CandidateSavedJobsResponse {
  stats: CandidateSavedJobsStats;
  jobs: CandidateSavedJobItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface CandidateJobDetailResponse extends CandidateJobsApiJob {
  department: string;
  work_mode: string;
  experience_level: string;
  company_description: string;
  company_industry: string;
  company_size_range: string;
  job_description_full: string;
  key_responsibilities: string[];
  benefits: string[];
  preferred_skills: string[];
  must_have_requirements: string[];
  nice_to_have_requirements: string[];
  applicant_count: number;
  questions: CandidateJobScreeningQuestion[];
}

export interface CandidateJobScreeningQuestion {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options: string[] | null;
}

export interface CandidateJobMatchAnalysis {
  match_percentage: number | null;
  matching_skills: string[];
  missing_skills: string[];
  summary: string;
}

export interface CandidateJobMatchImprovementSkill {
  id: string;
  name: string;
  impact: string;
  appears_in_jobs: number | null;
}

export interface CandidateJobMatchImprovementExperience {
  id: string;
  title: string;
  issue: string;
  description: string;
  impact: string;
}

export interface CandidateJobMatchImprovementSuggestion {
  id: string;
  title: string;
  description: string;
  impact: string;
}

export interface CandidateJobMatchImprovement {
  current_match: number | null;
  potential_match: number | null;
  gap_pct: number | null;
  jobs_evaluated: number | null;
  missing_skills: CandidateJobMatchImprovementSkill[];
  experience_suggestions: CandidateJobMatchImprovementExperience[];
  suggested_additions: CandidateJobMatchImprovementSuggestion[];
  summary: string;
}

export interface AutoImproveCandidateJobPayload {
  skill_id?: string;
  skill_name?: string;
  experience_ids?: string[];
}

export interface CandidateJobAutoImproveResponse {
  updated_match_percentage: number | null;
  message: string;
  changes: string[];
}

export interface GetCandidateJobsParams {
  skip?: number;
  limit?: number;
  sort_by?: CandidateJobsSortBy | null;
  date_posted?: string | null;
  job_type?: string | null;
  experience_level?: string | null;
  work_mode?: string | null;
  salary_currency?: string | null;
  min_salary?: number | null;
  max_salary?: number | null;
}

export interface GetCandidateSavedJobsParams {
  page?: number;
  page_size?: number;
  sort_by?: CandidateSavedJobsSortBy | null;
  status?: CandidateSavedJobStatus | null;
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function asString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim();
}

function asBoolean(input: unknown): boolean {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    const normalized = input.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  if (typeof input === 'number') {
    if (input === 1) return true;
    if (input === 0) return false;
  }
  return false;
}

function asNullableNumber(input: unknown): number | null {
  if (input === null || input === undefined || input === '') return null;
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function asNonNegativeInt(input: unknown, fallback = 0): number {
  const numeric = asNullableNumber(input);
  if (numeric === null) return fallback;
  return Math.max(0, Math.trunc(numeric));
}

function asStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function asOptionsArray(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;

  const options = input
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'number' && Number.isFinite(item)) return String(item);
      return '';
    })
    .filter((item) => item.length > 0);

  return options.length > 0 ? options : null;
}

function asTextArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (typeof item !== 'object' || item === null) return '';

      const text = (item as { text?: unknown }).text;
      if (typeof text !== 'string') return '';
      return text.trim();
    })
    .filter((item) => item.length > 0);
}

function getFirstTextArrayField(
  sources: Record<string, unknown>[],
  fieldNames: string[]
): string[] {
  for (const source of sources) {
    for (const fieldName of fieldNames) {
      const value = source[fieldName];
      if (Array.isArray(value)) return asTextArray(value);
    }
  }

  return [];
}

function normalizeScreeningQuestion(raw: unknown): CandidateJobScreeningQuestion | null {
  const root = asRecord(raw);
  if (!root) return null;

  const id = asString(root.id);
  const text = asString(root.text);

  if (!id || !text) return null;

  return {
    id,
    text,
    type: asString(root.type) || 'short_text',
    required: asBoolean(root.required),
    options: asOptionsArray(root.options),
  };
}

function asScreeningQuestionsArray(input: unknown): CandidateJobScreeningQuestion[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => normalizeScreeningQuestion(item))
    .filter((item): item is CandidateJobScreeningQuestion => item !== null);
}

function getApiMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const message = (payload as { message?: unknown }).message;
  if (typeof message !== 'string') return null;
  const trimmed = message.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getApiDetailMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === 'string') {
    const trimmed = detail.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (!Array.isArray(detail) || detail.length === 0) return null;
  const firstDetail = detail[0];

  if (typeof firstDetail === 'string') {
    const trimmed = firstDetail.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof firstDetail !== 'object' || firstDetail === null) return null;
  const msg = (firstDetail as { msg?: unknown }).msg;
  if (typeof msg !== 'string') return null;
  const trimmedMsg = msg.trim();
  return trimmedMsg.length > 0 ? trimmedMsg : null;
}

function getCandidateRequestHeaders(accessToken: string): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    if (/^https?:\/\//i.test(RAW_CANDIDATE_API_BASE_URL)) {
      const parsed = new URL(RAW_CANDIDATE_API_BASE_URL);
      if (isNgrokHost(parsed.hostname)) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }
    }
  } catch {
    // Ignore malformed URL
  }

  return headers;
}

function normalizeJob(raw: unknown): CandidateJobsApiJob | null {
  const root = asRecord(raw);
  if (!root) return null;

  const companyRaw = asRecord(root.company) || {};

  return {
    id: asString(root.id),
    company_id: asString(root.company_id) || asString(companyRaw.id),
    title: asString(root.title),
    company: {
      id: asString(companyRaw.id) || asString(root.company_id),
      name: asString(companyRaw.name),
      logo_url: asString(companyRaw.logo_url),
      is_verified: asBoolean(companyRaw.is_verified),
    },
    location: asString(root.location),
    job_type: asString(root.job_type),
    min_salary: asNullableNumber(root.min_salary),
    max_salary: asNullableNumber(root.max_salary),
    currency: asString(root.currency),
    required_skills: asStringArray(root.required_skills),
    posted_at: asString(root.posted_at),
    description: asString(root.description),
    key_responsibilities: asStringArray(root.key_responsibilities),
    match_percentage: asNullableNumber(root.match_percentage),
    is_saved: asBoolean(root.is_saved),
  };
}

function normalizeJobsResponse(payload: unknown): CandidateJobsListResponse {
  let jobsRaw: unknown[] = [];
  let total: number | null = null;

  if (Array.isArray(payload)) {
    jobsRaw = payload;
  } else {
    const root = asRecord(payload) || {};
    if (Array.isArray(root.items)) jobsRaw = root.items;
    else if (Array.isArray(root.data)) jobsRaw = root.data;
    else if (Array.isArray(root.results)) jobsRaw = root.results;
    total = asNullableNumber(root.total);
  }

  const items = jobsRaw
    .map((item) => normalizeJob(item))
    .filter((item): item is CandidateJobsApiJob => item !== null);

  return {
    items,
    total: total === null ? null : Math.max(0, Math.trunc(total)),
  };
}

function asNumber(input: unknown): number {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeJobDetailResponse(payload: unknown): CandidateJobDetailResponse {
  const base = normalizeJob(payload);
  const root = asRecord(payload) || {};

  return {
    id: base?.id || '',
    title: base?.title || '',
    company: base?.company || {
      id: '',
      name: '',
      logo_url: '',
      is_verified: false,
    },
    company_id: base?.company_id || '',
    location: base?.location || '',
    job_type: base?.job_type || '',
    min_salary: base?.min_salary ?? null,
    max_salary: base?.max_salary ?? null,
    currency: base?.currency || '',
    required_skills: base?.required_skills || [],
    posted_at: base?.posted_at || '',
    description: base?.description || '',
    match_percentage: base?.match_percentage ?? null,
    is_saved: base?.is_saved ?? false,
    department: asString(root.department),
    work_mode: asString(root.work_mode),
    experience_level: asString(root.experience_level),
    company_description: asString(root.company_description),
    company_industry: asString(root.company_industry),
    company_size_range: asString(root.company_size_range),
    job_description_full: asString(root.job_description_full),
    key_responsibilities: asStringArray(root.key_responsibilities),
    benefits: asStringArray(root.benefits),
    preferred_skills: asStringArray(root.preferred_skills),
    must_have_requirements: asStringArray(root.must_have_requirements),
    nice_to_have_requirements: asStringArray(root.nice_to_have_requirements),
    applicant_count: asNumber(root.applicant_count),
    questions: asScreeningQuestionsArray(root.screening_questions ?? root.questions),
  };
}

function normalizeJobMatchAnalysis(payload: unknown): CandidateJobMatchAnalysis {
  const root = asRecord(payload) || {};
  const data = asRecord(root.data) || {};

  const matchingSkills = getFirstTextArrayField(
    [root, data],
    ['matching_skills', 'matched_skills']
  );
  const missingSkills = getFirstTextArrayField(
    [root, data],
    ['missing_skills', 'gap_skills']
  );

  const matchPercentageRaw = asNullableNumber(root.match_percentage) ?? asNullableNumber(data.match_percentage);
  const matchPercentage = typeof matchPercentageRaw === 'number'
    ? Math.max(0, Math.min(100, Math.round(matchPercentageRaw)))
    : null;

  return {
    match_percentage: matchPercentage,
    matching_skills: matchingSkills,
    missing_skills: missingSkills,
    summary: asString(root.summary) || asString(data.summary) || asString(root.analysis) || asString(data.analysis),
  };
}

function formatImpact(value: unknown): string {
  const stringValue = asString(value);
  if (stringValue) return stringValue;

  const numeric = asNullableNumber(value);
  if (numeric === null) return '';
  const rounded = Math.round(numeric);
  if (rounded === 0) return '0%';
  return rounded > 0 ? `+${rounded}%` : `${rounded}%`;
}

function normalizeImprovementSkill(raw: unknown, index: number): CandidateJobMatchImprovementSkill | null {
  if (typeof raw === 'string') {
    const name = raw.trim();
    if (!name) return null;
    return {
      id: `skill-${index + 1}`,
      name,
      impact: '',
      appears_in_jobs: null,
    };
  }

  const root = asRecord(raw);
  if (!root) return null;

  const name = asString(root.name) || asString(root.skill) || asString(root.title) || asString(root.text);
  if (!name) return null;

  const id = asString(root.id) || asString(root.skill_id) || name;

  return {
    id,
    name,
    impact: formatImpact(root.impact)
      || formatImpact(root.match_impact)
      || formatImpact(root.match_boost)
      || formatImpact(root.impact_pct),
    appears_in_jobs: asNullableNumber(root.appears_in_jobs),
  };
}

function normalizeImprovementExperience(raw: unknown): CandidateJobMatchImprovementExperience | null {
  const root = asRecord(raw);
  if (!root) return null;

  const roleTitle = asString(root.role_title);
  const company = asString(root.company);
  const combinedRoleTitle = roleTitle && company ? `${roleTitle} at ${company}` : '';
  const title = asString(root.title)
    || asString(root.label)
    || asString(root.role)
    || asString(root.experience_title)
    || combinedRoleTitle
    || roleTitle;
  if (!title) return null;

  return {
    id: asString(root.id) || asString(root.experience_id),
    title,
    issue: asString(root.issue) || asString(root.gap) || asString(root.reason) || asString(root.weakness_label),
    description: asString(root.description),
    impact: formatImpact(root.impact)
      || formatImpact(root.match_impact)
      || formatImpact(root.match_boost)
      || formatImpact(root.impact_pct),
  };
}

function normalizeImprovementSuggestion(raw: unknown, index: number): CandidateJobMatchImprovementSuggestion | null {
  const root = asRecord(raw);
  if (!root) return null;

  const title = asString(root.title) || asString(root.name) || asString(root.suggestion) || asString(root.label);
  if (!title) return null;

  return {
    id: asString(root.id) || `suggestion-${index + 1}`,
    title,
    description: asString(root.description) || asString(root.reason),
    impact: formatImpact(root.impact)
      || formatImpact(root.match_impact)
      || formatImpact(root.match_boost)
      || formatImpact(root.impact_pct),
  };
}

function normalizeJobMatchImprovement(payload: unknown): CandidateJobMatchImprovement {
  const root = asRecord(payload) || {};
  const data = asRecord(root.data) || {};

  const currentMatchRaw = asNullableNumber(root.current_match)
    ?? asNullableNumber(data.current_match)
    ?? asNullableNumber(root.current_match_pct)
    ?? asNullableNumber(data.current_match_pct)
    ?? asNullableNumber(root.match_percentage)
    ?? asNullableNumber(data.match_percentage);

  const potentialMatchRaw = asNullableNumber(root.potential_match)
    ?? asNullableNumber(data.potential_match)
    ?? asNullableNumber(root.potential_match_pct)
    ?? asNullableNumber(data.potential_match_pct)
    ?? asNullableNumber(root.potential_match_percentage)
    ?? asNullableNumber(data.potential_match_percentage);

  const gapPctRaw = asNullableNumber(root.gap_pct) ?? asNullableNumber(data.gap_pct);
  const jobsEvaluatedRaw = asNullableNumber(root.jobs_evaluated) ?? asNullableNumber(data.jobs_evaluated);

  const currentMatch = typeof currentMatchRaw === 'number'
    ? Math.max(0, Math.min(100, Math.round(currentMatchRaw)))
    : null;

  const potentialMatch = typeof potentialMatchRaw === 'number'
    ? Math.max(0, Math.min(100, Math.round(potentialMatchRaw)))
    : null;

  const skillsRaw = Array.isArray(root.missing_skills) ? root.missing_skills
    : Array.isArray(data.missing_skills) ? data.missing_skills
      : Array.isArray(root.skills_to_add) ? root.skills_to_add
        : Array.isArray(data.skills_to_add) ? data.skills_to_add
          : Array.isArray(root.recommended_skills) ? root.recommended_skills
            : Array.isArray(data.recommended_skills) ? data.recommended_skills
              : [];

  const experiencesRaw = Array.isArray(root.experience_suggestions) ? root.experience_suggestions
    : Array.isArray(data.experience_suggestions) ? data.experience_suggestions
      : Array.isArray(root.experience_gaps) ? root.experience_gaps
        : Array.isArray(data.experience_gaps) ? data.experience_gaps
      : Array.isArray(root.experiences) ? root.experiences
        : Array.isArray(data.experiences) ? data.experiences
          : Array.isArray(root.experience_improvements) ? root.experience_improvements
            : Array.isArray(data.experience_improvements) ? data.experience_improvements
              : [];

  const suggestionsRaw = Array.isArray(root.suggested_additions) ? root.suggested_additions
    : Array.isArray(data.suggested_additions) ? data.suggested_additions
      : Array.isArray(root.additions) ? root.additions
        : Array.isArray(data.additions) ? data.additions
          : Array.isArray(root.suggestions) ? root.suggestions
            : Array.isArray(data.suggestions) ? data.suggestions
              : [];

  return {
    current_match: currentMatch,
    potential_match: potentialMatch,
    gap_pct: typeof gapPctRaw === 'number' ? Math.max(0, Math.round(gapPctRaw)) : null,
    jobs_evaluated: typeof jobsEvaluatedRaw === 'number' ? Math.max(0, Math.round(jobsEvaluatedRaw)) : null,
    missing_skills: skillsRaw
      .map((item, index) => normalizeImprovementSkill(item, index))
      .filter((item): item is CandidateJobMatchImprovementSkill => item !== null),
    experience_suggestions: experiencesRaw
      .map((item) => normalizeImprovementExperience(item))
      .filter((item): item is CandidateJobMatchImprovementExperience => item !== null),
    suggested_additions: suggestionsRaw
      .map((item, index) => normalizeImprovementSuggestion(item, index))
      .filter((item): item is CandidateJobMatchImprovementSuggestion => item !== null),
    summary: asString(root.summary)
      || asString(data.summary)
      || asString(root.live_preview)
      || asString(data.live_preview)
      || asString(root.gap_breakdown_summary)
      || asString(data.gap_breakdown_summary),
  };
}

function normalizeAutoImproveJobResponse(payload: unknown): CandidateJobAutoImproveResponse {
  const root = asRecord(payload) || {};
  const data = asRecord(root.data) || {};

  const updatedMatchRaw = asNullableNumber(root.updated_match_percentage)
    ?? asNullableNumber(data.updated_match_percentage)
    ?? asNullableNumber(root.match_percentage)
    ?? asNullableNumber(data.match_percentage);

  return {
    updated_match_percentage: typeof updatedMatchRaw === 'number'
      ? Math.max(0, Math.min(100, Math.round(updatedMatchRaw)))
      : null,
    message: asString(root.message) || asString(data.message) || 'Profile improvement applied.',
    changes: asTextArray(root.changes).length > 0 ? asTextArray(root.changes) : asTextArray(data.changes),
  };
}

function normalizeSavedJob(raw: unknown): CandidateSavedJobItem | null {
  const root = asRecord(raw);
  if (!root) return null;

  const id = asString(root.id);
  const jobId = asString(root.job_id);
  if (!id && !jobId) return null;

  return {
    id,
    job_id: jobId || id,
    job_title_snapshot: asString(root.job_title_snapshot),
    company_name_snapshot: asString(root.company_name_snapshot),
    location_snapshot: asString(root.location_snapshot),
    salary_min_snapshot: asNullableNumber(root.salary_min_snapshot),
    salary_max_snapshot: asNullableNumber(root.salary_max_snapshot),
    currency_snapshot: asString(root.currency_snapshot),
    job_status_snapshot: asString(root.job_status_snapshot),
    saved_at: asString(root.saved_at),
    is_applied: asBoolean(root.is_applied),
  };
}

function normalizeSavedJobsResponse(payload: unknown, fallbackPageSize: number): CandidateSavedJobsResponse {
  const root = asRecord(payload) || {};
  const statsRaw = asRecord(root.stats) || {};
  const jobsRaw = Array.isArray(root.jobs) ? root.jobs : [];

  const jobs = jobsRaw
    .map((item) => normalizeSavedJob(item))
    .filter((item): item is CandidateSavedJobItem => item !== null);

  return {
    stats: {
      total: asNonNegativeInt(statsRaw.total, jobs.length),
      active: asNonNegativeInt(statsRaw.active),
      applied: asNonNegativeInt(statsRaw.applied),
      closed: asNonNegativeInt(statsRaw.closed),
    },
    jobs,
    total: asNonNegativeInt(root.total, jobs.length),
    page: asNonNegativeInt(root.page, 1),
    page_size: asNonNegativeInt(root.page_size, fallbackPageSize),
  };
}

export async function getCandidateJobs(
  accessToken: string,
  params: GetCandidateJobsParams = {}
): Promise<CandidateJobsListResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const rawSkip = Number(params.skip);
  const rawLimit = Number(params.limit);
  const skip = Number.isFinite(rawSkip) ? Math.max(0, Math.trunc(rawSkip)) : 0;
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.trunc(rawLimit)) : 10;
  const minSalary = asNullableNumber(params.min_salary);
  const maxSalary = asNullableNumber(params.max_salary);

  const queryParams = new URLSearchParams();
  queryParams.set('skip', String(skip));
  queryParams.set('limit', String(limit));

  if (typeof params.sort_by === 'string' && params.sort_by.trim()) {
    queryParams.set('sort_by', params.sort_by.trim());
  }

  if (typeof params.date_posted === 'string' && params.date_posted.trim()) {
    queryParams.set('date_posted', params.date_posted.trim());
  }

  if (typeof params.job_type === 'string' && params.job_type.trim()) {
    queryParams.set('job_type', params.job_type.trim());
  }

  if (typeof params.experience_level === 'string' && params.experience_level.trim()) {
    queryParams.set('experience_level', params.experience_level.trim());
  }

  if (typeof params.work_mode === 'string' && params.work_mode.trim()) {
    queryParams.set('work_mode', params.work_mode.trim());
  }

  if (typeof params.salary_currency === 'string' && params.salary_currency.trim()) {
    queryParams.set('salary_currency', params.salary_currency.trim());
  }

  if (minSalary !== null) {
    queryParams.set('min_salary', String(Math.max(0, Math.trunc(minSalary))));
  }

  if (maxSalary !== null) {
    queryParams.set('max_salary', String(Math.max(0, Math.trunc(maxSalary))));
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/jobs?${queryParams.toString()}`, {
      method: 'GET',
      headers: getCandidateRequestHeaders(nextAccessToken),
    })
  );

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    forceReauthIfNeeded(response.status, payload);
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `Jobs fetch failed with status ${response.status}`);
  }

  return normalizeJobsResponse(payload);
}

export async function saveCandidateJob(accessToken: string, jobId: string): Promise<unknown> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedJobId = jobId.trim();
  if (!trimmedJobId) {
    throw new Error('Job id is required.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/jobs/saved-jobs`, {
      method: 'POST',
      headers: {
        ...getCandidateRequestHeaders(nextAccessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ job_id: trimmedJobId }),
    })
  );

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    forceReauthIfNeeded(response.status, payload);
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `Save job failed with status ${response.status}`);
  }

  return payload;
}

export async function getCandidateSavedJobs(
  accessToken: string,
  params: GetCandidateSavedJobsParams = {}
): Promise<CandidateSavedJobsResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const page = asNonNegativeInt(params.page, 1) || 1;
  const pageSize = Math.max(1, asNonNegativeInt(params.page_size, 10));
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('page_size', String(pageSize));

  if (typeof params.sort_by === 'string' && params.sort_by.trim()) {
    queryParams.set('sort_by', params.sort_by.trim());
  }

  if (typeof params.status === 'string' && params.status.trim()) {
    queryParams.set('status', params.status.trim().toLowerCase());
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/jobs/saved-jobs?${queryParams.toString()}`, {
      method: 'GET',
      headers: getCandidateRequestHeaders(nextAccessToken),
    })
  );

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    forceReauthIfNeeded(response.status, payload);
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `Saved jobs fetch failed with status ${response.status}`);
  }

  return normalizeSavedJobsResponse(payload, pageSize);
}

export async function deleteCandidateSavedJob(accessToken: string, jobId: string): Promise<void> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedJobId = jobId.trim();
  if (!trimmedJobId) {
    throw new Error('Job id is required.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/jobs/saved-jobs/${encodeURIComponent(trimmedJobId)}`, {
      method: 'DELETE',
      headers: getCandidateRequestHeaders(nextAccessToken),
    })
  );

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    forceReauthIfNeeded(response.status, payload);
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `Remove saved job failed with status ${response.status}`);
  }
}

export async function getCandidateJobDetail(
  accessToken: string,
  jobId: string
): Promise<CandidateJobDetailResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedJobId = jobId.trim();
  if (!trimmedJobId) {
    throw new Error('Job id is required.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/jobs/${encodeURIComponent(trimmedJobId)}`, {
      method: 'GET',
      headers: getCandidateRequestHeaders(nextAccessToken),
    })
  );

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    forceReauthIfNeeded(response.status, payload);
    throw new Error(getApiDetailMessage(payload) || getApiMessage(payload) || `Job detail fetch failed with status ${response.status}`);
  }

  return normalizeJobDetailResponse(payload);
}

export async function getCandidateJobMatchAnalysis(
  accessToken: string,
  jobId: string
): Promise<CandidateJobMatchAnalysis> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedJobId = jobId.trim();
  if (!trimmedJobId) {
    throw new Error('Job id is required.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/jobs/${encodeURIComponent(trimmedJobId)}/match-analysis`, {
      method: 'GET',
      headers: getCandidateRequestHeaders(nextAccessToken),
    })
  );

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    forceReauthIfNeeded(response.status, payload);
    throw new Error(
      getApiDetailMessage(payload)
      || getApiMessage(payload)
      || `Match analysis fetch failed with status ${response.status}`
    );
  }

  return normalizeJobMatchAnalysis(payload);
}

export async function getCandidateJobMatchImprovement(
  accessToken: string,
  jobId: string
): Promise<CandidateJobMatchImprovement> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedJobId = jobId.trim();
  if (!trimmedJobId) {
    throw new Error('Job id is required.');
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/jobs/${encodeURIComponent(trimmedJobId)}/match-improvement`, {
      method: 'GET',
      headers: getCandidateRequestHeaders(nextAccessToken),
    })
  );

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    forceReauthIfNeeded(response.status, payload);
    throw new Error(
      getApiDetailMessage(payload)
      || getApiMessage(payload)
      || `Match improvement fetch failed with status ${response.status}`
    );
  }

  return normalizeJobMatchImprovement(payload);
}

export async function autoImproveCandidateJob(
  accessToken: string,
  jobId: string,
  payload: AutoImproveCandidateJobPayload = {}
): Promise<CandidateJobAutoImproveResponse> {
  if (!CANDIDATE_API_BASE_URL) {
    throw new Error('Missing VITE_CANDIDATE_API_BASE_URL in environment variables.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  const trimmedJobId = jobId.trim();
  if (!trimmedJobId) {
    throw new Error('Job id is required.');
  }

  const body: Record<string, unknown> = {};
  if (typeof payload.skill_id === 'string' && payload.skill_id.trim()) {
    body.skill_id = payload.skill_id.trim();
  }
  if (typeof payload.skill_name === 'string' && payload.skill_name.trim()) {
    body.skill_name = payload.skill_name.trim();
  }

  if (Array.isArray(payload.experience_ids)) {
    const cleanedExperienceIds = payload.experience_ids
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);

    if (cleanedExperienceIds.length > 0) {
      body.experience_ids = cleanedExperienceIds;
    }
  }

  const response = await executeAuthorizedRequest(trimmedAccessToken, (nextAccessToken) =>
    fetch(`${CANDIDATE_API_BASE_URL}/jobs/${encodeURIComponent(trimmedJobId)}/auto-improve`, {
      method: 'POST',
      headers: {
        ...getCandidateRequestHeaders(nextAccessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  );

  const raw = await response.text();
  let responsePayload: unknown = null;
  if (raw) {
    try {
      responsePayload = JSON.parse(raw);
    } catch {
      responsePayload = raw;
    }
  }

  if (!response.ok) {
    forceReauthIfNeeded(response.status, responsePayload);
    throw new Error(
      getApiDetailMessage(responsePayload)
      || getApiMessage(responsePayload)
      || `Auto improve failed with status ${response.status}`
    );
  }

  return normalizeAutoImproveJobResponse(responsePayload);
}
