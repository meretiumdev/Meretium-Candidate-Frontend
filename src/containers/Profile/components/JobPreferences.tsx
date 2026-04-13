import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Briefcase, Edit3 } from 'lucide-react';
import type { RootState } from '../../../redux/store';
import {
  updateJobPreferences,
  type CandidateJobPreferences,
  type UpdateJobPreferencesPayload,
} from '../../../services/profileApi';

interface JobPreferencesProps {
  preferences: CandidateJobPreferences | null;
  onUpdated?: () => Promise<void> | void;
}

type EditableField = 'roles' | 'locations' | 'work_mode' | 'job_type' | 'salary' | 'notice_period' | null;

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const WORK_MODE_OPTIONS = ['Remote', 'Hybrid', 'On-site', 'Any'] as const;
const JOB_TYPE_OPTIONS = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Graduate Scheme', 'Apprenticeship'] as const;

function normalizeWorkMode(value: string): (typeof WORK_MODE_OPTIONS)[number] {
  const normalized = value.trim().toLowerCase().replace(/_/g, '-').replace(/\s+/g, '');

  if (normalized === 'remote') return 'Remote';
  if (normalized === 'hybrid') return 'Hybrid';
  if (normalized === 'on-site' || normalized === 'onsite') return 'On-site';
  if (normalized === 'any') return 'Any';
  return 'Any';
}

function normalizeJobType(value: string): (typeof JOB_TYPE_OPTIONS)[number] {
  const normalized = value.trim().toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();

  if (normalized === 'full time' || normalized === 'fulltime') return 'Full-time';
  if (normalized === 'part time' || normalized === 'parttime') return 'Part-time';
  if (normalized === 'contract') return 'Contract';
  if (normalized === 'internship') return 'Internship';
  if (normalized === 'graduate scheme' || normalized === 'graduatescheme') return 'Graduate Scheme';
  if (normalized === 'apprenticeship') return 'Apprenticeship';
  return 'Full-time';
}

function formatSalary(preferences: CandidateJobPreferences | null): string {
  if (!preferences) return 'Not set';

  const min = preferences.salary_min;
  const max = preferences.salary_max;
  const currency = preferences.salary_currency?.trim() || '';

  if (min === null && max === null) return 'Not set';
  if (min !== null && max !== null) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`.trim();
  if (min !== null) return `${currency} ${min.toLocaleString()}+`.trim();
  return `Up to ${currency} ${max?.toLocaleString()}`.trim();
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, idx) => item === b[idx]);
}

function normalizeCommaSeparatedValues(input: string): string[] {
  const unique = new Set<string>();
  input
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .forEach((item) => unique.add(item));
  return Array.from(unique);
}

function parseNullableNumber(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export default function JobPreferences({ preferences, onUpdated }: JobPreferencesProps) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [rolesDraft, setRolesDraft] = useState('');
  const [locationsDraft, setLocationsDraft] = useState('');
  const [workModeDraft, setWorkModeDraft] = useState('');
  const [jobTypeDraft, setJobTypeDraft] = useState('');
  const [salaryMinDraft, setSalaryMinDraft] = useState('');
  const [salaryMaxDraft, setSalaryMaxDraft] = useState('');
  const [salaryCurrencyDraft, setSalaryCurrencyDraft] = useState('');
  const [noticePeriodDraft, setNoticePeriodDraft] = useState('');

  const rows = useMemo(
    () => [
      { key: 'roles' as const, label: 'Preferred roles', value: preferences?.roles || [], isPill: true },
      { key: 'locations' as const, label: 'Preferred locations', value: preferences?.locations || [], isPill: true },
      { key: 'work_mode' as const, label: 'Work mode', value: preferences ? normalizeWorkMode(preferences.work_mode) : 'Not set', isPill: false },
      { key: 'job_type' as const, label: 'Job type', value: preferences ? normalizeJobType(preferences.job_type) : 'Not set', isPill: false },
      { key: 'salary' as const, label: 'Salary expectation', value: formatSalary(preferences), isPill: false },
      { key: 'notice_period' as const, label: 'Notice period', value: preferences?.notice_period?.trim() || 'Not set', isPill: false },
    ],
    [preferences]
  );

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const showError = (message: string) => {
    setToast({ id: Date.now(), message, type: 'error' });
  };

  const showSuccess = (message: string) => {
    setToast({ id: Date.now(), message, type: 'success' });
  };

  const startEditing = (field: Exclude<EditableField, null>) => {
    setEditingField(field);
    if (field === 'roles') {
      setRolesDraft((preferences?.roles || []).join(', '));
      return;
    }
    if (field === 'locations') {
      setLocationsDraft((preferences?.locations || []).join(', '));
      return;
    }
    if (field === 'work_mode') {
      setWorkModeDraft(normalizeWorkMode(preferences?.work_mode || 'Any'));
      return;
    }
    if (field === 'job_type') {
      setJobTypeDraft(normalizeJobType(preferences?.job_type || 'Full-time'));
      return;
    }
    if (field === 'salary') {
      setSalaryMinDraft(preferences?.salary_min !== null && preferences?.salary_min !== undefined ? String(preferences.salary_min) : '');
      setSalaryMaxDraft(preferences?.salary_max !== null && preferences?.salary_max !== undefined ? String(preferences.salary_max) : '');
      setSalaryCurrencyDraft(preferences?.salary_currency || '');
      return;
    }
    if (field === 'notice_period') {
      setNoticePeriodDraft(preferences?.notice_period || '');
    }
  };

  const submitUpdate = async (updates: UpdateJobPreferencesPayload) => {
    if (!accessToken) {
      showError('You are not authenticated. Please log in again.');
      return false;
    }

    if (Object.keys(updates).length === 0) {
      setEditingField(null);
      return true;
    }

    setSaving(true);
    try {
      await updateJobPreferences(accessToken, updates);
      if (onUpdated) {
        await onUpdated();
      }
      showSuccess('Job preferences updated.');
      setEditingField(null);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : 'Failed to update job preferences.';
      showError(message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (editingField === 'roles') {
      const nextRoles = normalizeCommaSeparatedValues(rolesDraft);
      const currentRoles = preferences?.roles || [];
      if (arraysEqual(nextRoles, currentRoles)) {
        setEditingField(null);
        return;
      }
      await submitUpdate({ roles: nextRoles });
      return;
    }

    if (editingField === 'locations') {
      const nextLocations = normalizeCommaSeparatedValues(locationsDraft);
      const currentLocations = preferences?.locations || [];
      if (arraysEqual(nextLocations, currentLocations)) {
        setEditingField(null);
        return;
      }
      await submitUpdate({ locations: nextLocations });
      return;
    }

    if (editingField === 'work_mode') {
      const nextWorkMode = normalizeWorkMode(workModeDraft || 'Any');
      const currentWorkMode = normalizeWorkMode(preferences?.work_mode || 'Any');
      if (nextWorkMode === currentWorkMode) {
        setEditingField(null);
        return;
      }
      await submitUpdate({ work_mode: nextWorkMode });
      return;
    }

    if (editingField === 'job_type') {
      const nextJobType = normalizeJobType(jobTypeDraft || 'Full-time');
      const currentJobType = normalizeJobType(preferences?.job_type || 'Full-time');
      if (nextJobType === currentJobType) {
        setEditingField(null);
        return;
      }
      await submitUpdate({ job_type: nextJobType });
      return;
    }

    if (editingField === 'salary') {
      const nextMin = parseNullableNumber(salaryMinDraft);
      const nextMax = parseNullableNumber(salaryMaxDraft);
      const nextCurrency = salaryCurrencyDraft.trim() || null;

      const updates: UpdateJobPreferencesPayload = {};
      if (nextMin !== (preferences?.salary_min ?? null)) updates.salary_min = nextMin;
      if (nextMax !== (preferences?.salary_max ?? null)) updates.salary_max = nextMax;
      if (nextCurrency !== (preferences?.salary_currency ?? null)) updates.salary_currency = nextCurrency;

      await submitUpdate(updates);
      return;
    }

    if (editingField === 'notice_period') {
      const nextNoticePeriod = noticePeriodDraft.trim() || null;
      if (nextNoticePeriod === (preferences?.notice_period ?? null)) {
        setEditingField(null);
        return;
      }
      await submitUpdate({ notice_period: nextNoticePeriod });
    }
  };

  const handleRelocationToggle = async () => {
    const nextValue = !(preferences?.open_to_relocation ?? false);
    await submitUpdate({ open_to_relocation: nextValue });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6 font-manrope transition-all duration-300">
      {toast && (
        <div
          key={toast.id}
          className={`fixed top-4 right-4 z-50 max-w-[360px] px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium border ${
            toast.type === 'error'
              ? 'bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]'
              : 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <div className="size-12 bg-[#FFF4EC] rounded-full flex items-center justify-center text-[#FF6934] shrink-0">
          <Briefcase size={22} />
        </div>
        <div>
          <h2 className="text-[18px] md:text-[20px] font-semibold text-[#101828]">Job Preferences</h2>
          <p className="text-[#98A2B3] text-[13px] md:text-[14px]">Critical for AI matching</p>
        </div>
      </div>

      <div className="space-y-6">
        {rows.map((pref) => (
          <div key={pref.label} className="flex justify-between items-start gap-4 group">
            <div className="flex flex-col gap-2.5 w-full">
              <h4 className="text-[15px] font-medium text-[#475467]">{pref.label}</h4>
              <div className="flex flex-wrap gap-2">
                {pref.isPill && Array.isArray(pref.value) ? (
                  pref.value.length > 0
                    ? pref.value.map((v) => <span key={v} className="px-3.5 py-1.5 bg-[#F9FAFB] text-[#475467] rounded-full text-[13px] font-medium">{v}</span>)
                    : <span className="text-[14px] text-[#475467]">Not set</span>
                ) : (
                  <span className="text-[14px] text-[#475467]">{pref.value as string}</span>
                )}
              </div>

              {editingField === pref.key && (
                <div className="mt-2 bg-[#F9FAFB] border border-[#EAECF0] rounded-xl p-3 space-y-3">
                  {pref.key === 'roles' && (
                    <input
                      value={rolesDraft}
                      onChange={(e) => setRolesDraft(e.target.value)}
                      placeholder="Comma separated roles"
                      className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[14px] outline-none focus:border-[#FF6934]"
                    />
                  )}
                  {pref.key === 'locations' && (
                    <input
                      value={locationsDraft}
                      onChange={(e) => setLocationsDraft(e.target.value)}
                      placeholder="Comma separated locations"
                      className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[14px] outline-none focus:border-[#FF6934]"
                    />
                  )}
                  {pref.key === 'work_mode' && (
                    <select
                      value={workModeDraft}
                      onChange={(e) => setWorkModeDraft(e.target.value)}
                      className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[14px] outline-none focus:border-[#FF6934]"
                    >
                      {WORK_MODE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                  {pref.key === 'job_type' && (
                    <select
                      value={jobTypeDraft}
                      onChange={(e) => setJobTypeDraft(e.target.value)}
                      className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[14px] outline-none focus:border-[#FF6934]"
                    >
                      {JOB_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                  {pref.key === 'salary' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        value={salaryMinDraft}
                        onChange={(e) => setSalaryMinDraft(e.target.value)}
                        placeholder="Min salary"
                        className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[14px] outline-none focus:border-[#FF6934]"
                      />
                      <input
                        value={salaryMaxDraft}
                        onChange={(e) => setSalaryMaxDraft(e.target.value)}
                        placeholder="Max salary"
                        className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[14px] outline-none focus:border-[#FF6934]"
                      />
                      <input
                        value={salaryCurrencyDraft}
                        onChange={(e) => setSalaryCurrencyDraft(e.target.value)}
                        placeholder="Currency (e.g. GBP)"
                        className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[14px] outline-none focus:border-[#FF6934]"
                      />
                    </div>
                  )}
                  {pref.key === 'notice_period' && (
                    <input
                      value={noticePeriodDraft}
                      onChange={(e) => setNoticePeriodDraft(e.target.value)}
                      placeholder="e.g. 1 month"
                      className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[14px] outline-none focus:border-[#FF6934]"
                    />
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingField(null)}
                      disabled={saving}
                      className="px-3 py-1.5 text-[13px] font-medium text-[#475467] hover:text-[#101828] disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => { void handleSave(); }}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-[8px] text-[13px] font-medium bg-[#FF6934] text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => startEditing(pref.key)}
              disabled={saving}
              className="text-[#98A2B3] hover:text-gray-900 transition-colors cursor-pointer mt-1 shrink-0 disabled:opacity-60"
            >
              <Edit3 size={18} />
            </button>
          </div>
        ))}

        <div className="flex items-center justify-between group pt-2">
          <span className="text-[15px] font-medium text-[#475467]">Open to relocation</span>
          <button
            type="button"
            onClick={() => { void handleRelocationToggle(); }}
            disabled={saving}
            className={`w-11 h-6 rounded-full relative transition-all ${preferences?.open_to_relocation ? 'bg-[#FF6934]' : 'bg-[#D0D5DD]'} disabled:opacity-60`}
          >
            <div className={`absolute top-0.5 size-5 bg-white rounded-full shadow-sm transition-all ${preferences?.open_to_relocation ? 'right-0.5' : 'left-0.5'}`}></div>
          </button>
        </div>
      </div>
    </div>
  );
}
