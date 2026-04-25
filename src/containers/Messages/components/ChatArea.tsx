import React from 'react';
import { MessageSquare, ExternalLink, Paperclip, Send, ChevronLeft, CheckCircle, Calendar, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
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
  isLoadingOlderMessages?: boolean;
  hasMoreOlderMessages?: boolean;
  unseenNewMessagesCount?: number;
  isSendingMessage: boolean;
  error: string | null;
  onSendMessage: (content: string) => Promise<void>;
  onBottomStateChange?: (isAtBottom: boolean) => void;
  onLoadOlderMessages?: () => Promise<void> | void;
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

function getLatestScrollTop(element: HTMLElement): number {
  return Math.max(0, element.scrollHeight - element.clientHeight);
}

function isAtLatestPosition(element: HTMLElement): boolean {
  return getLatestScrollTop(element) - element.scrollTop <= 24;
}

function isNearOlderMessagesEdge(element: HTMLElement): boolean {
  return element.scrollTop <= 80;
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
  isLoadingOlderMessages = false,
  hasMoreOlderMessages = false,
  unseenNewMessagesCount = 0,
  isSendingMessage,
  error,
  onSendMessage,
  onBottomStateChange,
  onLoadOlderMessages,
  onBack,
}: ChatAreaProps) {
  const navigate = useNavigate();
  const [draftMessage, setDraftMessage] = React.useState('');
  const [isStatusCardExpanded, setIsStatusCardExpanded] = React.useState(false);
  const messagesContainerRef = React.useRef<HTMLDivElement | null>(null);
  const statusActionCardRef = React.useRef<HTMLDivElement | null>(null);
  const conversationId = conversation?.id || '';
  const pendingOlderMessagesRestoreRef = React.useRef<{
    conversationId: string;
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);
  const isAtLatestRef = React.useRef(true);
  const latestAnchorStateRef = React.useRef<{
    conversationId: string | null;
    latestMessageId: string | null;
  }>({
    conversationId: null,
    latestMessageId: null,
  });
  const shouldAnchorToSentMessageRef = React.useRef(false);

  const displayMessages = React.useMemo(() => {
    if (messages.length < 2) return messages;

    const firstTimestamp = Date.parse(messages[0].created_at);
    const lastTimestamp = Date.parse(messages[messages.length - 1].created_at);
    const isDescending = Number.isFinite(firstTimestamp)
      && Number.isFinite(lastTimestamp)
      && firstTimestamp >= lastTimestamp;

    return isDescending ? [...messages].reverse() : messages;
  }, [messages]);
  const conversationStatusCode = conversation ? formatStatusCode(conversation.application_status) : '';
  const hasStatusActionCard = conversationStatusCode === 'OFFERED' || conversationStatusCode === 'INTERVIEW';

  const reportBottomState = React.useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      isAtLatestRef.current = true;
      if (onBottomStateChange) onBottomStateChange(true);
      return;
    }

    const isAtLatest = isAtLatestPosition(container);
    isAtLatestRef.current = isAtLatest;
    if (onBottomStateChange) onBottomStateChange(isAtLatest);
  }, [onBottomStateChange]);

  const anchorToLatestMessage = React.useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    pendingOlderMessagesRestoreRef.current = null;
    container.scrollTop = getLatestScrollTop(container);
    isAtLatestRef.current = true;
    if (onBottomStateChange) onBottomStateChange(true);
  }, [onBottomStateChange]);

  const triggerLoadOlderMessages = React.useCallback(() => {
    if (!conversationId) return;
    if (!onLoadOlderMessages) return;
    if (isLoadingMessages || isLoadingOlderMessages || !hasMoreOlderMessages) return;

    const container = messagesContainerRef.current;
    if (!container || !isNearOlderMessagesEdge(container)) return;

    pendingOlderMessagesRestoreRef.current = {
      conversationId,
      scrollHeight: container.scrollHeight,
      scrollTop: container.scrollTop,
    };

    void onLoadOlderMessages();
  }, [
    conversationId,
    hasMoreOlderMessages,
    isLoadingMessages,
    isLoadingOlderMessages,
    onLoadOlderMessages,
  ]);

  const handleMessagesScroll = React.useCallback(() => {
    reportBottomState();
    triggerLoadOlderMessages();
  }, [reportBottomState, triggerLoadOlderMessages]);

  React.useEffect(() => {
    pendingOlderMessagesRestoreRef.current = null;
    isAtLatestRef.current = true;
    setIsStatusCardExpanded(false);
  }, [conversationId]);

  React.useEffect(() => {
    reportBottomState();
  }, [conversationId, displayMessages.length, isLoadingMessages, reportBottomState]);

  React.useLayoutEffect(() => {
    const pendingRestore = pendingOlderMessagesRestoreRef.current;
    if (!pendingRestore) return;

    if (!conversationId || pendingRestore.conversationId !== conversationId) {
      pendingOlderMessagesRestoreRef.current = null;
      return;
    }

    if (isLoadingOlderMessages) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const heightDelta = container.scrollHeight - pendingRestore.scrollHeight;
    container.scrollTop = pendingRestore.scrollTop + heightDelta;
    pendingOlderMessagesRestoreRef.current = null;
    reportBottomState();
  }, [conversationId, displayMessages.length, isLoadingOlderMessages, reportBottomState]);

  React.useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (pendingOlderMessagesRestoreRef.current) return;

    const activeConversationId = conversationId || null;
    const latestMessageId = displayMessages.length > 0
      ? displayMessages[displayMessages.length - 1].id
      : null;
    const previousAnchorState = latestAnchorStateRef.current;
    const conversationChanged = previousAnchorState.conversationId !== activeConversationId;
    const latestMessageChanged = previousAnchorState.latestMessageId !== latestMessageId;

    if (conversationChanged || (latestMessageChanged && isAtLatestRef.current)) {
      anchorToLatestMessage();
    } else if (latestMessageChanged && shouldAnchorToSentMessageRef.current) {
      const latestMessage = displayMessages[displayMessages.length - 1];
      if (latestMessage && isCandidateMessage(latestMessage, candidateUserId)) {
        anchorToLatestMessage();
      }
    }

    if (latestMessageChanged) {
      shouldAnchorToSentMessageRef.current = false;
    }

    latestAnchorStateRef.current = {
      conversationId: activeConversationId,
      latestMessageId,
    };
  }, [anchorToLatestMessage, candidateUserId, conversationId, displayMessages]);

  React.useLayoutEffect(() => {
    if (!hasStatusActionCard || !isAtLatestRef.current) return;

    const frameId = window.requestAnimationFrame(() => {
      if (isAtLatestRef.current) anchorToLatestMessage();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    anchorToLatestMessage,
    applicationDetail,
    hasStatusActionCard,
    isLoadingApplicationDetail,
    statusActionError,
  ]);

  React.useLayoutEffect(() => {
    if (!hasStatusActionCard) return undefined;
    const statusActionCard = statusActionCardRef.current;
    if (!statusActionCard || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(() => {
      if (isAtLatestRef.current) anchorToLatestMessage();
    });
    observer.observe(statusActionCard);

    return () => {
      observer.disconnect();
    };
  }, [anchorToLatestMessage, hasStatusActionCard]);

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
  const statusCode = conversationStatusCode;
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
  const statusActionCardTitle = showOfferCard ? 'Job Offer' : 'Interview Invitation';
  const statusActionCardSummary = showOfferCard
    ? 'Review your offer and respond'
    : `${interviewDate} - ${interviewTime}`;
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
      shouldAnchorToSentMessageRef.current = true;
      await onSendMessage(trimmedDraft);
      setDraftMessage('');
    } catch {
      shouldAnchorToSentMessageRef.current = false;
      // Error is surfaced through parent state.
    }
  };

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full shadow-sm relative font-manrope">
      <div className="px-4 py-3.5 lg:px-5 xl:px-8 xl:py-4 border-b border-gray-50 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-3 xl:gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="md:hidden p-1.5 bg-gray-50 border border-gray-100 rounded-lg text-gray-500 active:scale-95 transition-all mr-1 cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="size-10 xl:size-12 rounded-full bg-[#FF6934] flex items-center justify-center text-white text-base xl:text-lg shrink-0 shadow-sm border border-black/5">
            {recruiterName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-[17px] xl:text-[18px] font-semibold text-gray-900 font-heading truncate pr-2 leading-none mb-1">{recruiterName}</h3>
            <p className="text-[12px] font-medium text-gray-400 font-body truncate leading-none">{companyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 xl:gap-3 shrink-0">
          <button 
            onClick={openApplicationDetails}
            className="px-3 xl:px-4 py-1.5 border border-[#E4E7EC] rounded-lg text-[13px] xl:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors DM_Sans cursor-pointer flex items-center gap-2"
          >
            <span className="hidden sm:inline">View application</span>
            <ExternalLink size={16} className="sm:hidden text-[#E4E7EC]" />
          </button>
          <ChatMenu />
        </div>
      </div>

      <div className="mx-4 mt-2.5 p-2.5 lg:mx-5 2xl:mx-8 2xl:mt-4 2xl:p-5 bg-[#F9FAFB] rounded-[12px] flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 2xl:flex-col 2xl:items-start 2xl:gap-3 flex-1 min-w-0">
          <div className="text-[13px] xl:text-[14px] 2xl:text-[15px] text-[#475467] font-medium font-body break-words">
            You applied for <span className="text-[#FF6934]">{jobTitle}</span> at {companyName}
          </div>
          <div className="shrink-0">
            <span className="bg-[#EFF8FF] text-[#175CD3] text-[12px] 2xl:text-[13px] font-medium px-2.5 py-0.5 2xl:py-1 rounded-[10px]">{statusLabel}</span>
          </div>
        </div>
        <ExternalLink
          size={18}
          onClick={openApplicationDetails}
          className="text-[#475467] cursor-pointer hover:text-gray-900 transition-colors shrink-0 2xl:size-5"
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
        onScroll={handleMessagesScroll}
        className="flex-1 min-h-[96px] overflow-y-auto px-4 pt-3 pb-2 lg:px-6 lg:pt-4 xl:px-10 xl:pt-8 xl:pb-4 2xl:px-12 scrollbar-hide bg-white/50"
      >
        {isLoadingOlderMessages && (
          <div className="sticky top-0 z-10 flex justify-center pb-2">
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[12px] text-gray-600 shadow-sm">
              Loading older messages...
            </span>
          </div>
        )}

        <div className="min-h-full flex flex-col">
          <div className="mt-auto" aria-hidden="true" />

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
          const isNewestMessage = index === displayMessages.length - 1;

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
              <div key={message.id} className={`flex items-start gap-3 ${candidateMessage ? 'flex-row-reverse' : ''} ${isNewestMessage ? 'mb-1' : 'mb-6 xl:mb-8'}`}>
                <div className="size-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 bg-[#FF6934]">
                  {candidateMessage ? 'Y' : recruiterName.charAt(0).toUpperCase()}
                </div>
                <div className="max-w-[85%] md:max-w-[70%] xl:max-w-[46rem]">
                  <div className={`p-3.5 xl:p-4 rounded-2xl text-[14px] leading-relaxed font-medium font-body shadow-sm ${
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
          <div className={`${showStatusActionCard ? 'h-5 xl:h-6' : 'h-1'} shrink-0`} aria-hidden="true" />
        </div>
      </div>

      {unseenNewMessagesCount > 0 && (
        <div className="pointer-events-none absolute bottom-24 right-4 md:right-6 z-20">
          <button
            type="button"
            onClick={anchorToLatestMessage}
            className="pointer-events-auto rounded-full border border-[#FDB08F] bg-white px-4 py-2 text-[12px] font-semibold text-[#FF6934] shadow-md hover:bg-[#FFF6F2] transition-colors"
          >
            {unseenNewMessagesCount} new {unseenNewMessagesCount === 1 ? 'message' : 'messages'} - Jump to latest
          </button>
        </div>
      )}

      {showStatusActionCard && (
        <div ref={statusActionCardRef} className="relative shrink-0 px-4 lg:px-5 2xl:px-8 pb-2.5 2xl:pb-4 bg-white border-t border-gray-100">
          <button
            type="button"
            onClick={() => setIsStatusCardExpanded((current) => !current)}
            className="2xl:hidden w-full rounded-[12px] border border-gray-200 bg-[#F8FAFC] px-3 py-2.5 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F3F6FA] transition-colors"
            aria-expanded={isStatusCardExpanded}
          >
            <span className="flex items-center gap-2 min-w-0">
              {showOfferCard ? (
                <CheckCircle size={16} className="text-[#12B76A] shrink-0" />
              ) : (
                <Calendar size={16} className="text-[#7A5AF8] shrink-0" />
              )}
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-[#101828] truncate">{statusActionCardTitle}</span>
                <span className="block text-[12px] font-medium text-[#667085] truncate">{statusActionCardSummary}</span>
              </span>
            </span>
            {isStatusCardExpanded ? (
              <ChevronUp size={16} className="text-[#667085] shrink-0" />
            ) : (
              <ChevronDown size={16} className="text-[#667085] shrink-0" />
            )}
          </button>

          <div className={`${isStatusCardExpanded ? 'block absolute left-4 right-4 bottom-full z-30 mb-2 max-h-[min(360px,calc(100vh-260px))] overflow-y-auto scrollbar-hide shadow-xl' : 'hidden'} 2xl:block 2xl:static 2xl:mb-0 2xl:max-h-none 2xl:overflow-visible 2xl:shadow-none rounded-[12px] border border-gray-200 bg-[#F8FAFC] p-3 2xl:p-5`}>
            {isLoadingApplicationDetail ? (
              <div className="h-20 animate-pulse rounded-lg bg-white/70 border border-gray-100" />
            ) : (
              <>
                {showOfferCard && (
                  <>
                    <div className="flex items-center gap-2 mb-2 2xl:mb-3 text-[#101828]">
                      <CheckCircle size={17} className="text-[#12B76A]" />
                      <span className="text-[17px] 2xl:text-[18px] font-semibold">Job Offer</span>
                    </div>
                    <p className="text-[13px] 2xl:text-[14px] text-[#475467] leading-relaxed mb-2.5 2xl:mb-4">
                      {offerCardDescription}
                    </p>
                    {showOfferActionButtons && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={openApplicationDetails}
                          className="h-9 2xl:h-11 rounded-[10px] bg-[#FF6934] text-white text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          View offer
                        </button>
                        <button
                          type="button"
                          onClick={onOfferAccept}
                          disabled={isStatusActionSubmitting}
                          className="h-9 2xl:h-11 rounded-[10px] border border-[#FDB08F] bg-white text-[#FF6934] text-[14px] font-semibold hover:bg-[#FFF6F2] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                          {isStatusActionSubmitting && <Loader2 size={14} className="animate-spin" />}
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={onOfferDecline}
                          disabled={isStatusActionSubmitting}
                          className="h-9 2xl:h-11 rounded-[10px] border border-gray-200 bg-white text-[#344054] text-[14px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
                    <div className="flex items-center gap-2 mb-2 2xl:mb-3 text-[#101828]">
                      <Calendar size={17} className="text-[#7A5AF8]" />
                      <span className="text-[17px] 2xl:text-[18px] font-semibold">Interview Invitation</span>
                    </div>
                    <div className="grid grid-cols-[92px_1fr] gap-y-0.5 2xl:gap-y-1 text-[13px] 2xl:text-[14px] mb-2.5 2xl:mb-4">
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
                          className="h-9 2xl:h-11 rounded-[10px] bg-[#FF6934] text-white text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                          {isStatusActionSubmitting && <Loader2 size={14} className="animate-spin" />}
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={openApplicationDetails}
                          disabled={isStatusActionSubmitting}
                          className="h-9 2xl:h-11 rounded-[10px] border border-gray-200 bg-white text-[#344054] text-[14px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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

      <div className="shrink-0 p-3.5 lg:px-5 lg:py-3.5 xl:px-8 xl:py-6 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3 xl:gap-4 bg-[#F9FAFB] border border-gray-100 rounded-[12px] xl:rounded-[14px] px-4 xl:px-6 py-2 xl:py-3 shadow-inner focus-within:ring-2 focus-within:ring-[#FF6934]/20 transition-all">
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
            className="size-9 xl:size-10 bg-[#FF6934]/10 text-[#FF6934] rounded-xl flex items-center justify-center hover:bg-[#FF6934] hover:text-white transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send size={18} fill="currentColor" strokeWidth={0} />
          </button>
        </div>
      </div>
    </div>
  );
}
