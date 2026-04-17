import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  X,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  getCandidateApplicationDetail,
  type CandidateApplicationDetail,
} from '../../../services/applicationsApi';
import { getCandidateCvDownloadUrl } from '../../../services/cvApi';
import type { ApplicationListItem } from '../types';

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: ApplicationListItem | null;
  accessToken: string | null;
}

interface TimelineStep {
  title: string;
  date: string;
  desc: string;
}

interface ToastState {
  id: number;
  message: string;
}

function toTitleCase(input: string): string {
  if (!input.trim()) return 'Unknown';

  return input
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatTimelineDate(value: string): string {
  if (!value) return 'Date not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Date not available';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function formatDateValue(value: string): string {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function defaultStatusDescription(status: string): string {
  if (status === 'APPLIED') return 'Your application has been submitted.';
  if (status === 'IN_REVIEW') return 'Hiring team is reviewing your application.';
  if (status === 'INTERVIEW') return 'Interview phase in progress.';
  if (status === 'OFFERED') return 'Offer has been shared with you.';
  if (status === 'HIRED') return 'Hiring process completed successfully.';
  if (status === 'REJECTED') return 'We moved forward with other candidates.';
  return 'Application status updated.';
}

function sanitizeFileName(value: string): string {
  const safe = value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '-');

  return safe || 'application';
}

function downloadFromPublicUrl(fileUrl: string, fileName: string): void {
  const anchor = document.createElement('a');
  // Pre-signed S3 URLs are signature-bound; do not mutate query params.
  anchor.href = fileUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function downloadCoverLetterAsPdf(coverLetter: string, jobTitle: string): void {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  const lineHeight = 16;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;
  const title = 'Cover Letter';
  const content = coverLetter.trim() || 'No cover letter provided.';

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(title, margin, margin);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);

  const lines = pdf.splitTextToSize(content, usableWidth) as string[];
  let cursorY = margin + 26;

  for (const line of lines) {
    if (cursorY > pageHeight - margin) {
      pdf.addPage();
      cursorY = margin;
    }
    pdf.text(line, margin, cursorY);
    cursorY += lineHeight;
  }

  pdf.save(`${sanitizeFileName(jobTitle)}-cover-letter.pdf`);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to load application details.';
}

export default function ApplicationDetailModal({ isOpen, onClose, app, accessToken }: ApplicationDetailModalProps) {
  const [detail, setDetail] = useState<CandidateApplicationDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isCvDownloading, setIsCvDownloading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const loadRequestIdRef = useRef(0);

  const appId = app?.id ?? '';
  const shouldLoadDynamicDetail = isOpen && !!app;

  const showToast = useCallback((message: string) => {
    setToast({
      id: Date.now(),
      message,
    });
  }, []);

  const loadDetail = useCallback(async () => {
    if (!shouldLoadDynamicDetail || !appId) return;
    if (!accessToken?.trim()) {
      setDetail(null);
      setDetailError('You are not authenticated. Please log in again.');
      return;
    }

    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;

    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const response = await getCandidateApplicationDetail(accessToken, appId);
      if (requestId !== loadRequestIdRef.current) return;
      setDetail(response);
    } catch (error: unknown) {
      if (requestId !== loadRequestIdRef.current) return;
      setDetail(null);
      setDetailError(getErrorMessage(error));
    } finally {
      if (requestId !== loadRequestIdRef.current) return;
      setIsDetailLoading(false);
    }
  }, [accessToken, appId, shouldLoadDynamicDetail]);

  useEffect(() => {
    if (!shouldLoadDynamicDetail) {
      loadRequestIdRef.current += 1;
      setDetail(null);
      setDetailError(null);
      setIsDetailLoading(false);
      return;
    }

    void loadDetail();
  }, [loadDetail, shouldLoadDynamicDetail]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toast]);

  const dynamicTimelineSteps = useMemo<TimelineStep[]>(() => {
    if (!detail) return [];

    const sortedHistory = [...detail.status_history].sort((a, b) => {
      const aTime = new Date(a.changed_at).getTime();
      const bTime = new Date(b.changed_at).getTime();

      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;
      return aTime - bTime;
    });

    return sortedHistory.map((item) => ({
      title: toTitleCase(item.status),
      date: formatTimelineDate(item.changed_at),
      desc: item.note?.trim() || defaultStatusDescription(item.status),
    }));
  }, [detail]);

  const resolvedStatusCode = useMemo(() => {
    const fromDetail = detail?.status?.trim().toUpperCase();
    if (fromDetail) return fromDetail;

    const fromList = typeof app?.statusCode === 'string' ? app.statusCode.trim().toUpperCase() : '';
    return fromList;
  }, [app?.statusCode, detail?.status]);

  const hasDynamicContent = shouldLoadDynamicDetail && !isDetailLoading && !detailError && !!detail;
  const showInterviewNotice = hasDynamicContent && resolvedStatusCode === 'INTERVIEW';
  const showOfferNotice = hasDynamicContent && resolvedStatusCode === 'OFFERED';
  const showHiredNotice = hasDynamicContent && resolvedStatusCode === 'HIRED';

  const handleCvDownload = async () => {
    if (isCvDownloading) return;
    if (!accessToken?.trim()) {
      showToast('You are not authenticated. Please log in again.');
      return;
    }

    const cvId = detail?.cv_id?.trim() || detail?.cv?.id?.trim() || '';
    if (!cvId) {
      showToast('CV is not available yet.');
      return;
    }

    setIsCvDownloading(true);
    try {
      const cvUrl = await getCandidateCvDownloadUrl(accessToken, cvId);
      const cvName = detail?.cv?.file_name?.trim() || 'cv.pdf';
      downloadFromPublicUrl(cvUrl, cvName);
    } catch {
      showToast('Unable to download CV right now.');
    } finally {
      setIsCvDownloading(false);
    }
  };

  const handleCoverLetterDownload = () => {
    if (!detail?.cover_letter?.trim()) {
      showToast('Cover letter is not available yet.');
      return;
    }

    try {
      downloadCoverLetterAsPdf(detail.cover_letter, app?.title || 'application');
    } catch {
      showToast('Unable to download cover letter right now.');
    }
  };

  const handlePendingAction = (actionLabel: string) => {
    showToast(`${actionLabel} will be available soon.`);
  };

  if (!isOpen || !app) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-transparent animate-in fade-in duration-300" onClick={onClose} />

      <div className="fixed top-0 right-0 z-[110] h-full flex items-start justify-end pointer-events-none pt-19 p-4 sm:p-6">
        <div
          className="pointer-events-auto w-[410px] md:w-[420px] bg-white mt-12.5 -mr-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between p-6 pb-2 shrink-0">
            <h2 className="text-[20px] md:text-[22px] font-semibold text-[#111827] leading-tight pr-6">{app.title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 bg-gray-50 hover:bg-gray-100 rounded-full cursor-pointer shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto p-6 pt-2 scrollbar-hide"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            <div className="flex flex-col gap-3.5 mb-8">
              <div className="flex items-center gap-2.5 text-[14px] text-[#4B5563] font-medium">
                <Building2 size={16} className="text-[#6B7280]" /> {app.company}
              </div>
              <div className="flex items-center gap-2.5 text-[14px] text-[#4B5563] font-medium">
                <MapPin size={16} className="text-[#6B7280]" /> {app.location}
              </div>
              <div className="mt-1">
                <span className={`px-4 py-1.5 rounded-full text-[12px] font-medium ${app.statusColor}`}>
                  {app.status}
                </span>
              </div>
            </div>

            {shouldLoadDynamicDetail && isDetailLoading && (
              <div className="bg-[#F9FAFB] border border-gray-200 rounded-xl p-8 mb-6 flex flex-col items-center justify-center gap-3">
                <Loader2 size={20} className="animate-spin text-[#FF6934]" />
                <p className="text-[13px] text-[#475467] font-medium">Loading application details...</p>
              </div>
            )}

            {shouldLoadDynamicDetail && !isDetailLoading && detailError && (
              <div className="bg-[#FEF3F2] border border-[#FDA29B] rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2.5 mb-3">
                  <AlertCircle size={16} className="text-[#B42318] mt-0.5 shrink-0" />
                  <p className="text-[13px] text-[#B42318] font-medium">
                    Details are temporarily unavailable. Please retry.
                  </p>
                </div>
                <p className="text-[12px] text-[#B42318] mb-3">{detailError}</p>
                <button
                  type="button"
                  onClick={() => void loadDetail()}
                  className="bg-white text-[#B42318] border border-[#FDA29B] px-3 py-1.5 rounded-[8px] text-[12px] font-medium hover:bg-[#FFF6F5] transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {showInterviewNotice && (
              <div className="bg-[#F0F9FF] border border-[#E0F2FE] rounded-xl p-5 mb-8 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <div className="size-10 bg-[#0EA5E9] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Calendar size={18} />
                  </div>
                  <div className="pt-0.5">
                    <div className="text-[16px] font-bold text-[#0369A1] leading-tight">Interview scheduled</div>
                    <div className="text-[13px] font-medium text-[#0284C7] mt-1">
                      {detail?.interview_details?.status?.trim() ? toTitleCase(detail.interview_details.status) : 'Your interview details are ready'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 text-[13px] text-[#0369A1] font-medium mb-5 ml-0">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={16} className="opacity-70" />
                    {formatDateValue(detail?.interview_details?.date || '')}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock size={16} className="opacity-70" />
                    {detail?.interview_details?.time?.trim() || 'Time to be confirmed'}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin size={16} className="opacity-70" />
                    {detail?.interview_details?.location?.trim() || 'Location to be confirmed'}
                  </div>
                  {detail?.interview_details?.link?.trim() && (
                    <a
                      href={detail.interview_details.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#0C4A6E] hover:text-[#075985] hover:underline"
                    >
                      Join link <ExternalLink size={14} />
                    </a>
                  )}
                  {detail?.interview_details?.candidate_response?.trim() && (
                    <div className="text-[12px] text-[#0C4A6E]">
                      Response: {toTitleCase(detail.interview_details.candidate_response)}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => handlePendingAction('Interview acceptance')}
                    className="w-full bg-white px-4 py-2.5 rounded-xl text-[14px] font-bold text-gray-900 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Accept interview
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePendingAction('Interview reschedule')}
                    className="w-full text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer text-center"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            )}

            {showOfferNotice && (
              <div className="bg-[#ECFDF3] border border-[#D1FADF] rounded-xl p-5 mb-8 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <div className="size-10 bg-[#10B981] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                    <CheckCircle size={20} />
                  </div>
                  <div className="pt-0.5">
                    <div className="text-[16px] font-bold text-[#027A48] leading-tight">Offer received</div>
                    <div className="text-[13px] font-medium text-[#039855] mt-1">Review your offer details</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 mb-5 border border-gray-200 shadow-sm space-y-4">
                  <div>
                    <div className="text-[12px] font-bold text-[#039855] mb-0.5">Salary</div>
                    <div className="text-[15px] font-bold text-[#111820]">
                      {detail?.offer_details?.salary?.trim() || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#039855] mb-0.5">Start date</div>
                    <div className="text-[13px] text-[#05603A] font-medium">
                      {formatDateValue(detail?.offer_details?.start_date || '')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#039855] mb-0.5">Offer expires</div>
                    <div className="text-[13px] text-[#05603A] font-medium">
                      {formatDateValue(detail?.offer_details?.offer_expires_at || '')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#039855] mb-0.5">Benefits</div>
                    <div className="space-y-1.5 mt-2">
                      {(detail?.offer_details?.benefits || []).length === 0 ? (
                        <div className="text-[13px] text-[#05603A] font-medium">No benefits listed</div>
                      ) : (
                        detail?.offer_details?.benefits.map((benefit) => (
                          <div key={benefit} className="flex items-center gap-2 text-[13px] text-[#05603A] font-medium">
                            <Check size={14} className="text-[#10B981] shrink-0" strokeWidth={3} /> {benefit}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  {detail?.offer_details?.candidate_response?.trim() && (
                    <div>
                      <div className="text-[12px] font-bold text-[#039855] mb-0.5">Your response</div>
                      <div className="text-[13px] text-[#05603A] font-medium">
                        {toTitleCase(detail.offer_details.candidate_response)}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handlePendingAction('Offer acceptance')}
                  className="w-full bg-[#FF6934] px-6 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity cursor-pointer mb-3"
                >
                  Accept offer
                </button>
                <button
                  type="button"
                  onClick={() => handlePendingAction('Offer rejection')}
                  className="w-full text-[13px] font-bold text-[#667085] hover:text-gray-900 transition-colors cursor-pointer text-center"
                >
                  Decline
                </button>
              </div>
            )}

            {showHiredNotice && (
              <div className="bg-[#ECFDF3] border border-[#ABEFC6] rounded-xl p-5 mb-8 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="size-10 bg-[#039855] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                    <CheckCircle size={20} />
                  </div>
                  <div className="pt-0.5">
                    <div className="text-[16px] font-bold text-[#05603A] leading-tight">You are hired</div>
                    <div className="text-[13px] font-medium text-[#067647] mt-1">
                      Hiring process is complete for this role.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hasDynamicContent && (
              <>
                <h3 className="text-[16px] font-semibold text-gray-900 mb-4">Documents submitted</h3>
                <div className="flex flex-col gap-2.5 mb-8">
                  <div className="flex items-center justify-between bg-[#F9FAFB] p-3.5 rounded-xl border border-gray-100 group">
                    <div className="flex items-center gap-3 text-[13px] font-medium text-gray-700">
                      <FileText size={16} className="text-gray-400 group-hover:text-[#FF6934]" />
                      {detail.cv?.file_name?.trim() || 'CV'}
                    </div>
                    <button
                      type="button"
                      onClick={() => { void handleCvDownload(); }}
                      disabled={isCvDownloading}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      aria-label="Download CV"
                    >
                      {isCvDownloading
                        ? <Loader2 size={16} className="animate-spin" />
                        : <Download size={16} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-[#F9FAFB] p-3.5 rounded-xl border border-gray-100 group">
                    <div className="flex items-center gap-3 text-[13px] font-medium text-gray-700">
                      <FileText size={16} className="text-gray-400 group-hover:text-[#FF6934]" />
                      Cover Letter
                    </div>
                    <button
                      type="button"
                      onClick={handleCoverLetterDownload}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      aria-label="Download cover letter PDF"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-[16px] font-semibold text-gray-900 mb-4">Screening answers</h3>
                <div className="space-y-3 mb-8">
                  {detail.screening_answers.length === 0 ? (
                    <div className="bg-[#F9FAFB] p-4 rounded-xl border border-gray-100 text-[13px] text-[#4B5563] font-medium leading-relaxed">
                      No screening answers were provided.
                    </div>
                  ) : (
                    detail.screening_answers.map((answer, index) => (
                      <div key={`${answer.question_id}-${index}`} className="bg-[#F9FAFB] p-4 rounded-xl border border-gray-100">
                        <p className="text-[13px] text-[#101828] font-semibold mb-1.5">
                          {answer.question_text || `Question ${index + 1}`}
                        </p>
                        <p className="text-[13px] text-[#4B5563] font-medium leading-relaxed">
                          {answer.answer === null || answer.answer === '' ? 'No response provided.' : String(answer.answer)}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <h3 className="text-[16px] font-semibold text-gray-900 mb-5">Timeline</h3>
                <div className="flex flex-col relative pl-1 mb-8">
                  {dynamicTimelineSteps.length === 0 ? (
                    <div className="text-[13px] text-[#475467] bg-[#F9FAFB] border border-gray-100 rounded-xl p-4">
                      Timeline details are not available yet.
                    </div>
                  ) : (
                    dynamicTimelineSteps.map((step, idx) => (
                      <div key={`${step.title}-${idx}`} className={`flex gap-3.5 relative ${idx < dynamicTimelineSteps.length - 1 ? 'pb-7' : ''}`}>
                        {idx < dynamicTimelineSteps.length - 1 && (
                          <div className="absolute top-7 bottom-0 left-[13px] w-[1px] bg-[#E5E7EB]"></div>
                        )}
                        <div className="size-7 rounded-full bg-[#FF6934] text-white flex items-center justify-center text-[12px] font-bold z-10 shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex flex-col mt-0.5">
                          <span className="text-[14px] font-semibold text-gray-900 leading-none">{step.title}</span>
                          <span className="text-[12px] text-gray-500 font-medium mt-1">{step.date}</span>
                          <span className="text-[13px] text-[#475467] mt-1 line-clamp-2">{step.desc}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-24 right-6 z-[130] bg-[#101828] text-white text-[13px] font-medium px-4 py-2.5 rounded-lg shadow-lg">
          {toast.message}
        </div>
      )}
    </>
  );
}
