import type { CandidateSavedJobStatus } from '../../services/jobsApi';

export type SavedStatusFilter = 'ALL' | CandidateSavedJobStatus;
export type SavedSortOption = 'recently_saved' | 'oldest_first' | 'expiring_soon';

export interface SavedUiStats {
  total: number;
  active: number;
  applied: number;
  closed: number;
}

export interface SavedJobListItem {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  savedAtLabel: string;
  savedAtRaw: string;
  statusCode: SavedStatusFilter | string;
  statusLabel: string;
  isApplied: boolean;
  isClosed: boolean;
}
