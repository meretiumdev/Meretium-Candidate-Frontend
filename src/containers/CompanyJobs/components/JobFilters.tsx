import { ChevronDown, Search } from 'lucide-react';
import type {
  CandidateCompanyJobStatus,
  CandidateCompanyJobsSortBy,
} from '../../../services/companyApi';

export interface CompanyJobsFiltersState {
  search: string;
  status: CandidateCompanyJobStatus | 'ALL';
  sortBy: CandidateCompanyJobsSortBy;
}

interface JobFiltersProps {
  value: CompanyJobsFiltersState;
  onChange: (value: CompanyJobsFiltersState) => void;
  disabled?: boolean;
}

export default function JobFilters({ value, onChange, disabled = false }: JobFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-[10px] p-2 flex flex-col md:flex-row items-center gap-3 shadow-sm">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <input
          type="text"
          value={value.search}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
          placeholder="Search by job title..."
          disabled={disabled}
          className="w-full pl-11 pr-4 py-2 text-[14px] border-none focus:ring-0 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="relative w-full md:w-[160px]">
          <select
            value={value.status}
            onChange={(event) => onChange({
              ...value,
              status: event.target.value as CandidateCompanyJobStatus | 'ALL',
            })}
            disabled={disabled}
            className="w-full appearance-none bg-white border border-gray-100 rounded-[8px] px-4 py-2 text-[14px] text-[#475467] font-medium outline-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative w-full md:w-[180px]">
          <select
            value={value.sortBy}
            onChange={(event) => onChange({
              ...value,
              sortBy: event.target.value as CandidateCompanyJobsSortBy,
            })}
            disabled={disabled}
            className="w-full appearance-none bg-white border border-gray-100 rounded-[8px] px-4 py-2 text-[14px] text-[#475467] font-medium outline-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <option value="most_relevant">Most Relevant</option>
            <option value="highest_salary">Highest Salary</option>
            <option value="most_recent">Most Recent</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
