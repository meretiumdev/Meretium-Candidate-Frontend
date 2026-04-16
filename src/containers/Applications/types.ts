import type { CandidateApplicationStatus } from '../../services/applicationsApi';

export type ApplicationStatusFilter = 'ALL' | CandidateApplicationStatus;

export interface ApplicationsUiStats {
  total: number;
  applied: number;
  inReview: number;
  interview: number;
  offered: number;
  hired: number;
  rejected: number;
}

export interface ApplicationListItem {
  id: string;
  title: string;
  company: string;
  location: string;
  appliedAtLabel: string;
  appliedAtRaw: string;
  stage: number;
  status: string;
  statusCode: CandidateApplicationStatus | string;
  statusColor: string;
  showProgress: boolean;
  coverLetter: string;
  screeningAnswers: Array<{
    questionText: string;
    answer: string;
  }>;
  statusHistory: Array<{
    status: string;
    changedAt: string;
  }>;
}
