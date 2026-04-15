import type { CSSProperties } from 'react';
import { Check, X } from 'lucide-react';
import {
  DATE_POSTED_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  JOB_TYPE_OPTIONS,
  SALARY_MAX_BOUND,
  SALARY_MIN_BOUND,
  SALARY_STEP,
  WORK_MODE_OPTIONS,
  type JobsFilters,
} from '../types';

interface FiltersSidebarProps {
  filters: JobsFilters;
  onChange: (nextFilters: JobsFilters) => void;
  mode?: 'card' | 'drawer';
  onClose?: () => void;
}

function FilterCheck({ checked }: { checked: boolean }) {
  return (
    <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors ${checked ? 'bg-[#FF6934] border-[#FF6934]' : 'bg-white border-[#D0D5DD]'}`}>
      {checked && <Check size={14} className="text-white" strokeWidth={3.2} />}
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1000) {
    const rounded = Math.round(value / 1000);
    return `${rounded}k`;
  }

  return `${value}`;
}

function getSliderTrackStyle(value: number): CSSProperties {
  const clampedValue = Math.max(SALARY_MIN_BOUND, Math.min(value, SALARY_MAX_BOUND));
  const percent = ((clampedValue - SALARY_MIN_BOUND) / (SALARY_MAX_BOUND - SALARY_MIN_BOUND)) * 100;

  return {
    background: `linear-gradient(to right, #FF6934 0%, #FF6934 ${percent}%, #D0D5DD ${percent}%, #D0D5DD 100%)`,
  };
}

export default function FiltersSidebar({
  filters,
  onChange,
  mode = 'card',
  onClose,
}: FiltersSidebarProps) {
  const isDrawer = mode === 'drawer';
  const hasSalaryFilters = filters.minSalary !== null || filters.maxSalary !== null;
  const minValue = filters.minSalary ?? SALARY_MIN_BOUND;
  const maxValue = filters.maxSalary ?? SALARY_MAX_BOUND;
  const normalizedMax = Math.max(minValue, maxValue);

  const setFilters = (updates: Partial<JobsFilters>) => {
    onChange({
      ...filters,
      ...updates,
    });
  };

  const handleMinSalaryChange = (value: number) => {
    const maxConstraint = filters.maxSalary === null ? SALARY_MAX_BOUND : normalizedMax;
    const nextMin = Math.max(SALARY_MIN_BOUND, Math.min(value, maxConstraint));
    if (filters.maxSalary !== null && filters.maxSalary < nextMin) {
      setFilters({ minSalary: nextMin, maxSalary: nextMin });
      return;
    }
    setFilters({ minSalary: nextMin });
  };

  const handleMaxSalaryChange = (value: number) => {
    const minConstraint = filters.minSalary === null ? SALARY_MIN_BOUND : minValue;
    const nextMax = Math.min(SALARY_MAX_BOUND, Math.max(value, minConstraint));
    if (filters.minSalary !== null && filters.minSalary > nextMax) {
      setFilters({ minSalary: nextMax, maxSalary: nextMax });
      return;
    }
    setFilters({ maxSalary: nextMax });
  };

  const resetFilters = () => {
    onChange({
      datePosted: null,
      jobType: null,
      experienceLevel: null,
      workMode: null,
      minSalary: null,
      maxSalary: null,
    });
  };

  const resetSalaryFilters = () => {
    setFilters({
      minSalary: null,
      maxSalary: null,
    });
  };

  return (
    <div className={isDrawer ? 'bg-white h-full w-full overflow-y-auto' : 'bg-white border border-gray-200 rounded-xl p-6 shadow-sm'}>
      <div className={isDrawer ? 'p-5 flex flex-col gap-7 min-h-full' : 'flex flex-col gap-8'}>
        {isDrawer ? (
          <div className="flex items-center justify-between pb-4 border-b border-[#EAECF0]">
            <h2 className="text-[20px] font-semibold text-[#101828]">Filters</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-[#475467] hover:text-[#101828] transition-colors cursor-pointer"
              aria-label="Close filters"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-[#101828]">Filters</h2>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[12px] font-semibold text-[#FF6934] hover:opacity-80 transition-opacity cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-[#101828] mb-4">Date posted</h3>
          <div className="space-y-3">
            {DATE_POSTED_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                <FilterCheck checked={filters.datePosted === option.value} />
                <span className="text-sm text-[#475467] font-regular group-hover:text-gray-900 transition-colors">{option.label}</span>
                <input
                  type="radio"
                  className="sr-only"
                  readOnly
                  checked={filters.datePosted === option.value}
                  onClick={() => setFilters({ datePosted: filters.datePosted === option.value ? null : option.value })}
                />
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[#101828] mb-4">Job type</h3>
          <div className="space-y-3">
            {JOB_TYPE_OPTIONS.map((option) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer group">
                <FilterCheck checked={filters.jobType === option} />
                <span className="text-sm text-[#475467] font-regular group-hover:text-gray-900 transition-colors">{option}</span>
                <input
                  type="radio"
                  className="sr-only"
                  readOnly
                  checked={filters.jobType === option}
                  onClick={() => setFilters({ jobType: filters.jobType === option ? null : option })}
                />
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[#101828] mb-4">Experience level</h3>
          <div className="space-y-3">
            {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer group">
                <FilterCheck checked={filters.experienceLevel === option} />
                <span className="text-sm text-[#475467] font-regular group-hover:text-gray-900 transition-colors">{option}</span>
                <input
                  type="radio"
                  className="sr-only"
                  readOnly
                  checked={filters.experienceLevel === option}
                  onClick={() => setFilters({ experienceLevel: filters.experienceLevel === option ? null : option })}
                />
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#101828]">Salary range</h3>
            <button
              type="button"
              onClick={resetSalaryFilters}
              disabled={!hasSalaryFilters}
              className="text-[12px] font-semibold text-[#FF6934] hover:opacity-80 transition-opacity cursor-pointer disabled:text-[#98A2B3] disabled:cursor-not-allowed disabled:hover:opacity-100"
            >
              Reset
            </button>
          </div>
          <div className="flex items-center justify-between text-[14px] text-gray-500 font-regular mb-3">
            <span>Min: {filters.minSalary === null ? 'Any' : formatCurrency(minValue)}</span>
            <span>Max: {filters.maxSalary === null ? 'Any' : formatCurrency(normalizedMax)}</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[12px] text-[#667085] mb-1">Min salary</label>
              <input
                type="range"
                min={SALARY_MIN_BOUND}
                max={SALARY_MAX_BOUND}
                step={SALARY_STEP}
                value={minValue}
                onChange={(event) => handleMinSalaryChange(Number(event.target.value))}
                className="w-full h-2 rounded-full appearance-none accent-[#FF6934] cursor-pointer"
                style={getSliderTrackStyle(minValue)}
              />
            </div>

            <div>
              <label className="block text-[12px] text-[#667085] mb-1">Max salary</label>
              <input
                type="range"
                min={SALARY_MIN_BOUND}
                max={SALARY_MAX_BOUND}
                step={SALARY_STEP}
                value={normalizedMax}
                onChange={(event) => handleMaxSalaryChange(Number(event.target.value))}
                className="w-full h-2 rounded-full appearance-none accent-[#FF6934] cursor-pointer"
                style={getSliderTrackStyle(normalizedMax)}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[#101828] mb-4">Work mode</h3>
          <div className="space-y-3">
            {WORK_MODE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                <FilterCheck checked={filters.workMode === option.value} />
                <span className="text-sm text-[#475467] font-regular group-hover:text-gray-900 transition-colors">{option.label}</span>
                <input
                  type="radio"
                  className="sr-only"
                  readOnly
                  checked={filters.workMode === option.value}
                  onClick={() => setFilters({ workMode: filters.workMode === option.value ? null : option.value })}
                />
              </label>
            ))}
          </div>
        </div>

        {isDrawer && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-1 text-[13px] font-semibold text-[#FF6934] hover:opacity-80 transition-opacity cursor-pointer text-left"
          >
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}
