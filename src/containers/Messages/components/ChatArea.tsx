import React from 'react';
import { MessageSquare, ExternalLink, Paperclip, Send, ChevronLeft, CheckCircle, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatMenu from './ChatMenu';
import type { CandidateConversationMessage, CandidateConversationSummary } from '../../../services/messagingApi';
import type { CandidateApplicationDetail } from '../../../services/applicationsApi';

interface ChatAreaProps {
  conversation: CandidateConversationSummary | null;
  messages: CandidateConversationMessage[];
  applicationDetail: CandidateApplicationDetail | null;
  isLoadingApplicationDetail: boolean;
  isStatusActionSubmitting: boolean;
  statusActionError: string | null;
  onOfferAccept: () => void;
  onOfferDecline: () => void;
  onInterviewAccept: () => void;
  candidateUserId: string | null;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  error: string | null;
  onSendMessage: (content: string) => Promise<void>;
  onBottomStateChange?: (isAtBottom: boolean) => void;
  onBack?: () => void;
}

function formatMessageTime(timestamp: string): string {
  const parsedTime = Date.parse(timestamp);
  if (!Number.isFinite(parsedTime)) return '';

  const diffMs = Date.now() - parsedTime;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;

  const diffYears = Math.floor(diffDays / 365);
  return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
}

function formatConversationStatus(status: string): string {
  const trimmed = status.trim();
  if (!trimmed) return 'In Review';
  return trimmed
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function isCandidateMessage(message: CandidateConversationMessage, candidateUserId: string | null): boolean {
  if (candidateUserId && message.sender_id.trim() === candidateUserId.trim()) return true;
  return message.sender_role.trim().toLowerCase() === 'candidate';
}

function isAtLatestPosition(element: HTMLElement): boolean {
  const distanceFromBottom = element.scrollHeight - (element.scrollTop + element.clientHeight);
  return distanceFromBottom <= 24;
}

function formatStatusCode(status: string): string {
  return status.trim().toUpperCase();
}

function formatDisplayDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'To be confirmed';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

export default function ChatArea({
  conversation,
  messages,
  applicationDetail,
  isLoadingApplicationDetail,
  isStatusActionSubmitting,
  statusActionError,
  onOfferAccept,
  onOfferDecline,
  onInterviewAccept,
  candidateUserId,
  isLoadingMessages,
  isSendingMessage,
  error,
  onSendMessage,
  onBottomStateChange,
  onBack,
}: ChatAreaProps) {
  const navigate = useNavigate();
  const [draftMessage, setDraftMessage] = React.useState('');
  const messagesContainerRef = React.useRef<HTMLDivElement | null>(null);
  const pendingInitialAnchorConversationRef = React.useRef<string | null>(null);

  const displayMessages = React.useMemo(() => {
    if (messages.length < 2) return messages;

    const firstTimestamp = Date.parse(messages[0].created_at);
    const lastTimestamp = Date.parse(messages[messages.length - 1].created_at);

    if (!Number.isFinite(firstTimestamp) || !Number.isFinite(lastTimestamp)) return messages;
    if (firstTimestamp >= lastTimestamp) return messages;
    return [...messages].reverse();
  }, [messages]);

  const reportBottomState = React.useCallback(() => {
    if (!onBottomStateChange) return;
    const container = messagesContainerRef.current;
    if (!container) {
      onBottomStateChange(true);
      return;
    }
    onBottomStateChange(isAtLatestPosition(container));
  }, [onBottomStateChange]);

  const anchorToLatestMessage = React.useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
    if (onBottomStateChange) onBottomStateChange(true);
  }, [onBottomStateChange]);

  React.useEffect(() => {
    pendingInitialAnchorConversationRef.current = conversation?.id || null;
  }, [conversation?.id]);

  React.useEffect(() => {
    if (!conversation?.id) return;
    if (isLoadingMessages) return;
    if (pendingInitialAnchorConversationRef.current !== conversation.id) return;

    const statusCode = conversation.application_status.trim().toUpperCase();
    const hasStatusActionCard = statusCode === 'OFFERED' || statusCode === 'INTERVIEW';
    if (hasStatusActionCard && isLoadingApplicationDetail) return;

    anchorToLatestMessage();
    const rafId = window.requestAnimationFrame(() => {
      anchorToLatestMessage();
    });
    const timeoutId = window.setTimeout(() => {
      anchorToLatestMessage();
    }, 120);

    pendingInitialAnchorConversationRef.current = null;

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [
    anchorToLatestMessage,
    conversation?.id,
    conversation?.application_status,
    isLoadingMessages,
    isLoadingApplicationDetail,
  ]);

  React.useEffect(() => {
    reportBottomState();
  }, [conversation?.id, displayMessages.length, isLoadingMessages, reportBottomState]);

  if (!conversation) {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden hidden md:flex flex-col items-center justify-center h-full shadow-sm font-manrope">
        <div className="flex flex-col items-center text-center p-8 max-w-[400px]">
          <div className="size-20 bg-[#F9FAFB] rounded-full flex items-center justify-center text-gray-400 mb-8 shadow-inner border border-gray-50 ring-8 ring-[#F9FAFB]/50">
            <MessageSquare size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-[24px] font-bold text-[#111827] font-heading mb-3 leading-tight">Select a conversation to start messaging</h2>
          <p className="text-[15px] font-medium text-[#6B7280] font-body leading-relaxed">
            Choose a conversation from the list to view messages
          </p>
        </div>
      </div>
    );
  }

  const recruiterName = conversation.recruiter_name_snapshot || 'Recruiter';
  const companyName = conversation.company_name_snapshot || 'Company';
  const jobTitle = conversation.job_title_snapshot || 'Opportunity';
  const statusLabel = formatConversationStatus(conversation.application_status);
  const statusCode = formatStatusCode(conversation.application_status);
  const showOfferCard = statusCode === 'OFFERED';
  const showInterviewCard = statusCode === 'INTERVIEW';
  const showStatusActionCard = showOfferCard || showInterviewCard;
  const offerCandidateResponse = applicationDetail?.offer_details?.candidate_response?.trim().toLowerCase() || '';
  const interviewCandidateResponse = applicationDetail?.interview_details?.candidate_response?.trim().toLowerCase() || '';
  const showOfferActionButtons = !offerCandidateResponse
    || (offerCandidateResponse !== 'accept' && offerCandidateResponse !== 'decline' && offerCandidateResponse !== 'accepted' && offerCandidateResponse !== 'declined');
  const showInterviewActionButtons = !interviewCandidateResponse
    || (interviewCandidateResponse !== 'accept' && interviewCandidateResponse !== 'accepted' && interviewCandidateResponse !== 'reschedule_requested');
  const interviewDate = formatDisplayDate(applicationDetail?.interview_details?.date || '');
  const interviewTime = applicationDetail?.interview_details?.time?.trim() || 'To be confirmed';
  const interviewMode = applicationDetail?.interview_details?.location?.trim()
    || (applicationDetail?.interview_details?.link?.trim() ? 'Video call' : 'To be confirmed');
  const offerCardDescription = (
    `We're excited to offer you the ${jobTitle} position at ${companyName}. `
    + 'Review the full offer details including compensation, equity, and benefits.'
  );

  const openApplicationDetails = () => {
    const applicationId = conversation.application_id?.trim() || '';
    if (!applicationId) {
      navigate('/applications');
      return;
    }

    navigate('/applications', { state: { openApplicationId: applicationId } });
  };

  const handleSubmit = async () => {
    const trimmedDraft = draftMessage.trim();
    if (!trimmedDraft || isSendingMessage) return;

    try {
      await onSendMessage(trimmedDraft);
      setDraftMessage('');
    } catch {
      // Error is surfaced through parent state.
    }
  };

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full shadow-sm relative font-manrope">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="md:hidden p-1.5 bg-gray-50 border border-gray-100 rounded-lg text-gray-500 active:scale-95 transition-all mr-1 cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="size-10 md:size-12 rounded-full bg-[#FF6934] flex items-center justify-center text-white text-lg shrink-0 shadow-sm border border-black/5">
            {recruiterName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-[18px] font-semibold text-gray-900 font-heading truncate pr-2 leading-none mb-1">{recruiterName}</h3>
            <p className="text-[12px] font-medium text-gray-400 font-body truncate leading-none">{companyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button 
            onClick={openApplicationDetails}
            className="px-3 md:px-4 py-1.5 border border-[#E4E7EC] rounded-lg text-[14px] md:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors DM_Sans cursor-pointer flex items-center gap-2"
          >
            <span className="hidden sm:inline">View application</span>
            <ExternalLink size={16} className="sm:hidden text-[#E4E7EC]" />
          </button>
          <ChatMenu />
        </div>
      </div>

      <div className="mx-4 md:mx-6 mt-4 p-4 bg-[#F9FAFB] rounded-[12px] flex items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div className="text-[14px] md:text-[15px] text-[#475467] font-medium font-body break-words">
            You applied for <span className="text-[#FF6934]">{jobTitle}</span> at {companyName}
          </div>
          <div className="shrink-0">
            <span className="bg-[#EFF8FF] text-[#175CD3] text-[13px] font-medium px-2.5 py-1 rounded-[10px]">{statusLabel}</span>
          </div>
        </div>
        <ExternalLink
          size={20}
          onClick={openApplicationDetails}
          className="text-[#475467] cursor-pointer hover:text-gray-900 transition-colors self-start shrink-0 mt-1 sm:mt-0"
        />
      </div>

      {error && (
        <div className="mx-4 md:mx-6 mt-3 px-4 py-3 rounded-[10px] bg-[#FEF3F2] border border-[#FDA29B] text-[#B42318] text-sm">
          {error}
        </div>
      )}

      <div
        key={conversation.id}
        ref={messagesContainerRef}
        onScroll={reportBottomState}
        className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-3 md:px-8 md:pt-8 md:pb-4 scrollbar-hide bg-white/50"
      >
        <div className="min-h-full flex flex-col-reverse">
          {isLoadingMessages && (
            <p className="text-sm text-gray-500">Loading messages...</p>
          )}

          {!isLoadingMessages && displayMessages.length === 0 && (
            <p className="text-sm text-gray-500">No messages yet. Start the conversation.</p>
          )}

          {!isLoadingMessages && displayMessages.map((message, index) => {
          const normalizedMessageType = message.message_type.trim().toLowerCase();
          const systemMessage = normalizedMessageType === 'system' || normalizedMessageType === 'status_event';
          const candidateMessage = isCandidateMessage(message, candidateUserId);
          const isNewestMessage = index === 0;

            if (systemMessage) {
              return (
                <div key={message.id} className={`flex justify-center ${isNewestMessage ? 'mb-1' : 'mb-6'}`}>
                  <span className="bg-gray-50 text-[#475467] text-[12px] px-4 py-1.5 rounded-full border border-gray-100 uppercase tracking-wider">
                    {message.content || 'System update'}
                  </span>
                </div>
              );
            }

            return (
              <div key={message.id} className={`flex items-start gap-3 ${candidateMessage ? 'flex-row-reverse' : ''} ${isNewestMessage ? 'mb-1' : 'mb-8'}`}>
                <div className="size-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 bg-[#FF6934]">
                  {candidateMessage ? 'Y' : recruiterName.charAt(0).toUpperCase()}
                </div>
                <div className="max-w-[85%] md:max-w-[75%]">
                  <div className={`p-4 rounded-2xl text-[14px] leading-relaxed font-medium font-body shadow-sm ${
                    candidateMessage
                      ? 'bg-orange-50 text-gray-800 rounded-tr-none border border-orange-100/50'
                      : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
                  }`}
                  >
                    {message.content}
                  </div>
                  <span className={`block text-[11px] mt-1.5 text-gray-400 font-medium ${candidateMessage ? 'text-right mr-1' : 'ml-1'}`}>
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showStatusActionCard && (
        <div className="shrink-0 px-4 md:px-6 pb-3 md:pb-4 bg-white border-t border-gray-100">
          <div className="rounded-[12px] border border-gray-200 bg-[#F8FAFC] p-4">
            {isLoadingApplicationDetail ? (
              <div className="h-20 animate-pulse rounded-lg bg-white/70 border border-gray-100" />
            ) : (
              <>
                {showOfferCard && (
                  <>
                    <div className="flex items-center gap-2 mb-3 text-[#101828]">
                      <CheckCircle size={17} className="text-[#12B76A]" />
                      <span className="text-[18px] font-semibold">Job Offer</span>
                    </div>
                    <p className="text-[14px] text-[#475467] leading-relaxed mb-4">
                      {offerCardDescription}
                    </p>
                    {showOfferActionButtons && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={openApplicationDetails}
                          className="h-11 rounded-[10px] bg-[#FF6934] text-white text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          View offer
                        </button>
                        <button
                          type="button"
                          onClick={onOfferAccept}
                          disabled={isStatusActionSubmitting}
                          className="h-11 rounded-[10px] border border-[#FDB08F] bg-white text-[#FF6934] text-[14px] font-semibold hover:bg-[#FFF6F2] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                          {isStatusActionSubmitting && <Loader2 size={14} className="animate-spin" />}
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={onOfferDecline}
                          disabled={isStatusActionSubmitting}
                          className="h-11 rounded-[10px] border border-gray-200 bg-white text-[#344054] text-[14px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    {!showOfferActionButtons && (
                      <div className="text-[13px] text-[#667085] font-medium">
                        Offer response recorded: {applicationDetail?.offer_details?.candidate_response || 'updated'}
                      </div>
                    )}
                  </>
                )}

                {showInterviewCard && (
                  <>
                    <div className="flex items-center gap-2 mb-3 text-[#101828]">
                      <Calendar size={17} className="text-[#7A5AF8]" />
                      <span className="text-[18px] font-semibold">Interview Invitation</span>
                    </div>
                    <div className="grid grid-cols-[92px_1fr] gap-y-1 text-[14px] mb-4">
                      <span className="text-[#667085]">Date:</span>
                      <span className="text-[#344054] text-right">{interviewDate}</span>
                      <span className="text-[#667085]">Time:</span>
                      <span className="text-[#344054] text-right">{interviewTime}</span>
                      <span className="text-[#667085]">Mode:</span>
                      <span className="text-[#344054] text-right">{interviewMode}</span>
                    </div>
                    {showInterviewActionButtons && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={onInterviewAccept}
                          disabled={isStatusActionSubmitting}
                          className="h-11 rounded-[10px] bg-[#FF6934] text-white text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                          {isStatusActionSubmitting && <Loader2 size={14} className="animate-spin" />}
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={openApplicationDetails}
                          disabled={isStatusActionSubmitting}
                          className="h-11 rounded-[10px] border border-gray-200 bg-white text-[#344054] text-[14px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Reschedule
                        </button>
                      </div>
                    )}
                    {!showInterviewActionButtons && (
                      <div className="text-[13px] text-[#667085] font-medium">
                        Interview response recorded: {applicationDetail?.interview_details?.candidate_response || 'updated'}
                      </div>
                    )}
                  </>
                )}
                {statusActionError && (
                  <p className="mt-3 text-[12px] text-[#B42318] font-medium">{statusActionError}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="shrink-0 p-4 md:p-6 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3 md:gap-4 bg-[#F9FAFB] border border-gray-100 rounded-[12px] md:rounded-[14px] px-4 md:px-6 py-2.5 md:py-3 shadow-inner focus-within:ring-2 focus-within:ring-[#FF6934]/20 transition-all">
          <Paperclip size={20} className="text-gray-400" />
          <input
            type="text"
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder={isSendingMessage ? 'Sending...' : 'Write a message...'}
            disabled={isSendingMessage}
            className="flex-1 border-none focus:outline-none text-[15px] placeholder:text-gray-400 bg-transparent disabled:opacity-60"
          />
          <button
            onClick={() => { void handleSubmit(); }}
            disabled={isSendingMessage || !draftMessage.trim()}
            className="size-10 bg-[#FF6934]/10 text-[#FF6934] rounded-xl flex items-center justify-center hover:bg-[#FF6934] hover:text-white transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send size={18} fill="currentColor" strokeWidth={0} />
          </button>
        </div>
      </div>
    </div>
  );
}
