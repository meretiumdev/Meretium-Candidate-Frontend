import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import {
  getCandidateConversations,
  getCandidateConversationMessages,
  sendCandidateConversationMessage,
  type CandidateConversationMessage,
  type CandidateConversationSummary,
} from '../../services/messagingApi';
import {
  getCandidateApplicationDetail,
  respondToCandidateInterview,
  respondToCandidateOffer,
  type CandidateApplicationDetail,
} from '../../services/applicationsApi';
import {
  sendCandidateSocketMarkRead,
  sendCandidateSocketMessage,
  subscribeCandidateSocketMessages,
} from '../../utils/candidateSocketConnection';

const UNREAD_COUNTS_REFRESH_EVENT = 'candidate:refresh-unread-counts';
const MESSAGES_PAGE_SIZE = 30;

function getUserId(input: unknown): string | null {
  if (typeof input !== 'object' || input === null) return null;

  const rawValue = (input as { user_id?: unknown }).user_id ?? (input as { id?: unknown }).id;
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return String(rawValue);
  }

  return null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Something went wrong. Please try again.';
}

function getRecordValue(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function getStringValue(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim();
}

function sortConversationsByUpdated(conversations: CandidateConversationSummary[]): CandidateConversationSummary[] {
  return [...conversations].sort((a, b) => {
    const aTime = Date.parse(a.updated_at);
    const bTime = Date.parse(b.updated_at);

    if (Number.isFinite(aTime) && Number.isFinite(bTime)) return bTime - aTime;
    if (Number.isFinite(aTime)) return -1;
    if (Number.isFinite(bTime)) return 1;
    return a.id.localeCompare(b.id);
  });
}

function getConversationById(
  conversations: CandidateConversationSummary[],
  selectedConversationId: string | null
): CandidateConversationSummary | null {
  if (!selectedConversationId) return null;
  return conversations.find((item) => item.id === selectedConversationId) || null;
}

function normalizeIncomingSocketMessage(payload: unknown): CandidateConversationMessage | null {
  const payloadRecord = getRecordValue(payload);
  if (!payloadRecord) return null;

  const socketType = getStringValue(payloadRecord.type).toLowerCase();
  if (socketType && socketType !== 'message' && socketType !== 'message_created' && socketType !== 'new_message') {
    return null;
  }

  const dataRecord = getRecordValue(payloadRecord.data);
  const source = dataRecord || payloadRecord;
  const nestedMessageRecord = getRecordValue(source.message) || getRecordValue(payloadRecord.message);
  const messageSource = nestedMessageRecord || source;

  const conversationId = (
    getStringValue(source.conversation_id)
    || getStringValue(payloadRecord.conversation_id)
    || getStringValue(messageSource.conversation_id)
  );
  const content = getStringValue(messageSource.content);
  if (!conversationId || !content) return null;

  const createdAt = getStringValue(messageSource.created_at) || new Date().toISOString();

  return {
    id: getStringValue(messageSource.id) || `socket-${conversationId}-${Date.now()}`,
    conversation_id: conversationId,
    sender_id: getStringValue(messageSource.sender_id),
    sender_role: getStringValue(messageSource.sender_role) || 'recruiter',
    message_type: getStringValue(messageSource.message_type) || 'chat',
    content,
    event_metadata: getRecordValue(messageSource.event_metadata) || getRecordValue(source.event_metadata),
    is_read: typeof messageSource.is_read === 'boolean' ? messageSource.is_read : false,
    created_at: createdAt,
  };
}

function hasMessageId(messages: CandidateConversationMessage[], id: string): boolean {
  return messages.some((item) => item.id === id);
}

function isMessagesDescending(messages: CandidateConversationMessage[]): boolean {
  if (messages.length < 2) return true;

  const firstTimestamp = Date.parse(messages[0].created_at);
  const lastTimestamp = Date.parse(messages[messages.length - 1].created_at);

  if (!Number.isFinite(firstTimestamp) || !Number.isFinite(lastTimestamp)) return true;
  return firstTimestamp >= lastTimestamp;
}

function appendOlderMessages(
  current: CandidateConversationMessage[],
  olderBatch: CandidateConversationMessage[]
): CandidateConversationMessage[] {
  if (olderBatch.length === 0) return current;

  const existingIds = new Set(current.map((item) => item.id));
  const uniqueOlder = olderBatch.filter((item) => item.id && !existingIds.has(item.id));
  if (uniqueOlder.length === 0) return current;

  if (isMessagesDescending(current)) {
    return [...current, ...uniqueOlder];
  }

  return [...uniqueOlder, ...current];
}

function mergeLatestMessages(
  current: CandidateConversationMessage[],
  latestBatch: CandidateConversationMessage[]
): CandidateConversationMessage[] {
  if (latestBatch.length === 0) return current;
  if (current.length === 0) return latestBatch;

  const latestIds = new Set(latestBatch.map((item) => item.id));
  const remainder = current.filter((item) => !latestIds.has(item.id));

  if (isMessagesDescending(current)) {
    return [...latestBatch, ...remainder];
  }

  return [...remainder, ...latestBatch];
}

function buildConversationFromSocketPayload(
  payload: unknown,
  incomingMessage: CandidateConversationMessage,
  unreadCount: number
): CandidateConversationSummary {
  const payloadRecord = getRecordValue(payload);
  const dataRecord = getRecordValue(payloadRecord?.data);
  const source = dataRecord || payloadRecord || {};
  const conversationRecord = getRecordValue(source.conversation) || getRecordValue(payloadRecord?.conversation) || {};

  const createdAt = incomingMessage.created_at || new Date().toISOString();

  return {
    id: incomingMessage.conversation_id,
    job_id: getStringValue(conversationRecord.job_id),
    job_title_snapshot: getStringValue(conversationRecord.job_title_snapshot) || 'New conversation',
    company_name_snapshot: getStringValue(conversationRecord.company_name_snapshot),
    application_id: getStringValue(conversationRecord.application_id),
    application_status: getStringValue(conversationRecord.application_status),
    recruiter_user_id: getStringValue(conversationRecord.recruiter_user_id) || incomingMessage.sender_id,
    recruiter_name_snapshot: getStringValue(conversationRecord.recruiter_name_snapshot) || 'Recruiter',
    created_at: getStringValue(conversationRecord.created_at) || createdAt,
    updated_at: createdAt,
    last_message: incomingMessage.content,
    unread_count: unreadCount,
  };
}

function notifyUnreadCountsRefreshRequested(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(UNREAD_COUNTS_REFRESH_EVENT));
}

function applyConversationDetailUpdate(
  conversations: CandidateConversationSummary[],
  conversationId: string,
  conversationDetail: CandidateConversationSummary | null,
  latestMessage: CandidateConversationMessage | null
): CandidateConversationSummary[] {
  const hasConversation = conversations.some((conversation) => conversation.id === conversationId);
  if (!hasConversation) return conversations;

  const updatedConversations = conversations.map((conversation) => {
    if (conversation.id !== conversationId) return conversation;

    return {
      ...conversation,
      application_status: conversationDetail?.application_status || conversation.application_status,
      updated_at: conversationDetail?.updated_at || latestMessage?.created_at || conversation.updated_at,
      last_message: latestMessage?.content || conversation.last_message,
    };
  });

  return sortConversationsByUpdated(updatedConversations);
}

export default function Messages() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const user = useSelector((state: RootState) => state.auth.user);
  const profileUserId = useSelector((state: RootState) => state.auth.profile?.user_id || null);

  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<'list' | 'chat'>('list');
  const [searchValue, setSearchValue] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

  const [conversations, setConversations] = React.useState<CandidateConversationSummary[]>([]);
  const [conversationsLoading, setConversationsLoading] = React.useState(false);
  const [conversationsError, setConversationsError] = React.useState<string | null>(null);

  const [messages, setMessages] = React.useState<CandidateConversationMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = React.useState(false);
  const [messagesError, setMessagesError] = React.useState<string | null>(null);
  const [messagesTotal, setMessagesTotal] = React.useState(0);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = React.useState(false);
  const [isSendingMessage, setIsSendingMessage] = React.useState(false);
  const [isChatAtLatestPosition, setIsChatAtLatestPosition] = React.useState(true);
  const [unseenNewMessagesCount, setUnseenNewMessagesCount] = React.useState(0);
  const [pendingMarkReadConversationId, setPendingMarkReadConversationId] = React.useState<string | null>(null);
  const [selectedApplicationDetail, setSelectedApplicationDetail] = React.useState<CandidateApplicationDetail | null>(null);
  const [isSelectedApplicationDetailLoading, setIsSelectedApplicationDetailLoading] = React.useState(false);
  const [isStatusActionSubmitting, setIsStatusActionSubmitting] = React.useState(false);
  const [statusActionError, setStatusActionError] = React.useState<string | null>(null);
  const backgroundRefreshInFlightRef = React.useRef(false);
  const selectedConversationIdRef = React.useRef<string | null>(null);

  const trimmedAccessToken = accessToken?.trim() || '';
  const candidateUserId = getUserId(user) || (profileUserId?.trim() || null);
  const selectedConversation = getConversationById(conversations, selectedConversationId);
  const selectedConversationStatusCode = selectedConversation?.application_status?.trim().toUpperCase() || '';
  const shouldShowStatusActionCard = selectedConversationStatusCode === 'OFFERED' || selectedConversationStatusCode === 'INTERVIEW';
  const selectedApplicationId = selectedConversation?.application_id?.trim() || '';
  const hasMoreOlderMessages = messagesTotal > 0 && messages.length < messagesTotal;

  React.useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchValue.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchValue]);

  React.useEffect(() => {
    if (!trimmedAccessToken) {
      setConversations([]);
      setSelectedConversationId(null);
      setConversationsError(null);
      setConversationsLoading(false);
      return;
    }

    let isCancelled = false;
    setConversationsLoading(true);
    setConversationsError(null);

    void (async () => {
      try {
        const response = await getCandidateConversations(trimmedAccessToken, {
          q: searchQuery || undefined,
        });

        if (isCancelled) return;

        const sortedConversations = sortConversationsByUpdated(response);
        setConversations(sortedConversations);
        setSelectedConversationId((currentSelectedId) => {
          if (currentSelectedId && sortedConversations.some((item) => item.id === currentSelectedId)) {
            return currentSelectedId;
          }

          return sortedConversations[0]?.id || null;
        });
      } catch (error) {
        if (isCancelled) return;
        setConversations([]);
        setSelectedConversationId(null);
        setConversationsError(getErrorMessage(error));
      } finally {
        if (!isCancelled) {
          setConversationsLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, trimmedAccessToken]);

  React.useEffect(() => {
    if (!trimmedAccessToken || !selectedConversationId) {
      setMessages([]);
      setMessagesError(null);
      setMessagesLoading(false);
      setMessagesTotal(0);
      setIsLoadingOlderMessages(false);
      setUnseenNewMessagesCount(0);
      setPendingMarkReadConversationId(null);
      return;
    }

    let isCancelled = false;
    setMessagesLoading(true);
    setMessagesError(null);
    setMessages([]);
    setMessagesTotal(0);
    setIsLoadingOlderMessages(false);
    setUnseenNewMessagesCount(0);
    setPendingMarkReadConversationId(null);

    void (async () => {
      try {
        const response = await getCandidateConversationMessages(trimmedAccessToken, selectedConversationId, {
          skip: 0,
          limit: MESSAGES_PAGE_SIZE,
        });

        if (isCancelled) return;
        setMessages(response.messages);
        setMessagesTotal(Math.max(response.total, response.messages.length));
      } catch (error) {
        if (isCancelled) return;
        setMessages([]);
        setMessagesError(getErrorMessage(error));
        setMessagesTotal(0);
      } finally {
        if (!isCancelled) {
          setMessagesLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [selectedConversationId, trimmedAccessToken]);

  React.useEffect(() => {
    if (isChatAtLatestPosition) {
      setUnseenNewMessagesCount(0);
    }
  }, [isChatAtLatestPosition, selectedConversationId]);

  React.useEffect(() => {
    if (!trimmedAccessToken || !selectedApplicationId || !shouldShowStatusActionCard) {
      setSelectedApplicationDetail(null);
      setIsSelectedApplicationDetailLoading(false);
      return;
    }

    let isCancelled = false;
    setIsSelectedApplicationDetailLoading(true);

    void (async () => {
      try {
        const detail = await getCandidateApplicationDetail(trimmedAccessToken, selectedApplicationId);
        if (isCancelled) return;
        setSelectedApplicationDetail(detail);
      } catch {
        if (isCancelled) return;
        setSelectedApplicationDetail(null);
      } finally {
        if (!isCancelled) {
          setIsSelectedApplicationDetailLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [selectedApplicationId, shouldShowStatusActionCard, trimmedAccessToken]);

  const handleOfferAction = React.useCallback(async (action: 'accept' | 'decline') => {
    if (!trimmedAccessToken || !selectedApplicationId || isStatusActionSubmitting) return;

    setIsStatusActionSubmitting(true);
    setStatusActionError(null);
    try {
      const updatedDetail = await respondToCandidateOffer(trimmedAccessToken, selectedApplicationId, action);
      if (updatedDetail) {
        setSelectedApplicationDetail(updatedDetail);
      } else {
        const detail = await getCandidateApplicationDetail(trimmedAccessToken, selectedApplicationId);
        setSelectedApplicationDetail(detail);
      }
    } catch (error: unknown) {
      setStatusActionError(getErrorMessage(error));
    } finally {
      setIsStatusActionSubmitting(false);
    }
  }, [isStatusActionSubmitting, selectedApplicationId, trimmedAccessToken]);

  const handleInterviewAccept = React.useCallback(async () => {
    if (!trimmedAccessToken || !selectedApplicationId || isStatusActionSubmitting) return;

    setIsStatusActionSubmitting(true);
    setStatusActionError(null);
    try {
      const updatedDetail = await respondToCandidateInterview(trimmedAccessToken, selectedApplicationId, { action: 'accept' });
      if (updatedDetail) {
        setSelectedApplicationDetail(updatedDetail);
      } else {
        const detail = await getCandidateApplicationDetail(trimmedAccessToken, selectedApplicationId);
        setSelectedApplicationDetail(detail);
      }
    } catch (error: unknown) {
      setStatusActionError(getErrorMessage(error));
    } finally {
      setIsStatusActionSubmitting(false);
    }
  }, [isStatusActionSubmitting, selectedApplicationId, trimmedAccessToken]);

  const refreshSelectedConversationInBackground = React.useCallback(async () => {
    if (!trimmedAccessToken || !selectedConversationId) return;
    if (backgroundRefreshInFlightRef.current) return;

    backgroundRefreshInFlightRef.current = true;

    try {
      const response = await getCandidateConversationMessages(trimmedAccessToken, selectedConversationId, {
        skip: 0,
        limit: MESSAGES_PAGE_SIZE,
      });

      setMessages((prev) => mergeLatestMessages(prev, response.messages));
      setMessagesTotal(Math.max(response.total, response.messages.length));

      const latestMessage = response.messages.length > 0 ? response.messages[0] : null;
      setConversations((prev) => applyConversationDetailUpdate(
        prev,
        selectedConversationId,
        response.conversation,
        latestMessage
      ));
    } catch {
      // Silent background refresh should not interrupt the user.
    } finally {
      backgroundRefreshInFlightRef.current = false;
    }
  }, [selectedConversationId, trimmedAccessToken]);

  const handleLoadOlderMessages = React.useCallback(async () => {
    if (!trimmedAccessToken || !selectedConversationId) return;
    if (messagesLoading || isLoadingOlderMessages) return;
    if (messagesTotal > 0 && messages.length >= messagesTotal) return;

    const requestConversationId = selectedConversationId;
    const skip = messages.length;

    setIsLoadingOlderMessages(true);

    try {
      const response = await getCandidateConversationMessages(trimmedAccessToken, requestConversationId, {
        skip,
        limit: MESSAGES_PAGE_SIZE,
      });

      if (selectedConversationIdRef.current !== requestConversationId) return;

      setMessages((prev) => appendOlderMessages(prev, response.messages));
      setMessagesTotal((prev) => Math.max(prev, response.total, skip + response.messages.length));
    } catch (error) {
      if (selectedConversationIdRef.current !== requestConversationId) return;
      setMessagesError(getErrorMessage(error));
    } finally {
      if (selectedConversationIdRef.current === requestConversationId) {
        setIsLoadingOlderMessages(false);
      }
    }
  }, [
    isLoadingOlderMessages,
    messages.length,
    messagesLoading,
    messagesTotal,
    selectedConversationId,
    trimmedAccessToken,
  ]);

  React.useEffect(() => {
    if (!selectedConversationId) return;

    setConversations((prev) => prev.map((conversation) => (
      conversation.id === selectedConversationId
        ? { ...conversation, unread_count: 0 }
        : conversation
    )));

    try {
      sendCandidateSocketMarkRead({
        type: 'mark_read',
        conversation_id: selectedConversationId,
      });
      notifyUnreadCountsRefreshRequested();
      setPendingMarkReadConversationId(null);
    } catch {
      // Ignore if socket is not connected yet.
    }
  }, [selectedConversationId]);

  React.useEffect(() => {
    if (!pendingMarkReadConversationId) return;
    if (!selectedConversationId) return;
    if (pendingMarkReadConversationId !== selectedConversationId) return;

    const isConversationVisible = typeof window !== 'undefined'
      ? (window.innerWidth >= 768 || view === 'chat')
      : true;
    if (!isConversationVisible || !isChatAtLatestPosition) return;

    try {
      sendCandidateSocketMarkRead({
        type: 'mark_read',
        conversation_id: selectedConversationId,
      });
      notifyUnreadCountsRefreshRequested();
      setPendingMarkReadConversationId(null);
      setConversations((prev) => prev.map((conversation) => (
        conversation.id === selectedConversationId
          ? { ...conversation, unread_count: 0 }
          : conversation
      )));
    } catch {
      // Ignore if socket is not connected.
    }
  }, [isChatAtLatestPosition, pendingMarkReadConversationId, selectedConversationId, view]);

  React.useEffect(() => {
    const unsubscribe = subscribeCandidateSocketMessages((payload) => {
      const incomingMessage = normalizeIncomingSocketMessage(payload);
      if (!incomingMessage) return;

      const isFromCandidate = (
        candidateUserId
          ? incomingMessage.sender_id === candidateUserId
          : incomingMessage.sender_role.trim().toLowerCase() === 'candidate'
      );
      const isSelectedConversation = selectedConversationId === incomingMessage.conversation_id;

      setConversations((prev) => {
        const existingConversationIndex = prev.findIndex((conversation) => conversation.id === incomingMessage.conversation_id);
        const shouldIncrementUnread = !isFromCandidate;

        if (existingConversationIndex >= 0) {
          const nextConversations = prev.map((conversation, index) => {
            if (index !== existingConversationIndex) return conversation;

            return {
              ...conversation,
              last_message: incomingMessage.content,
              updated_at: incomingMessage.created_at,
              unread_count: conversation.unread_count + (shouldIncrementUnread ? 1 : 0),
            };
          });

          return sortConversationsByUpdated(nextConversations);
        }

        const appendedConversation = buildConversationFromSocketPayload(
          payload,
          incomingMessage,
          isSelectedConversation ? 0 : (shouldIncrementUnread ? 1 : 0)
        );

        return sortConversationsByUpdated([...prev, appendedConversation]);
      });

      if (!isSelectedConversation) return;

      let didInsertIncomingMessage = false;
      setMessages((prev) => {
        if (hasMessageId(prev, incomingMessage.id)) return prev;
        didInsertIncomingMessage = true;
        if (isMessagesDescending(prev)) {
          return [incomingMessage, ...prev];
        }
        return [...prev, incomingMessage];
      });
      if (didInsertIncomingMessage) {
        setMessagesTotal((prev) => (prev > 0 ? prev + 1 : prev));
        if (!isFromCandidate && !isChatAtLatestPosition) {
          setUnseenNewMessagesCount((prev) => prev + 1);
        }
      }

      if (!isFromCandidate) {
        setPendingMarkReadConversationId(incomingMessage.conversation_id);
      }

      const isStatusEvent = incomingMessage.message_type.trim().toLowerCase() === 'status_event';
      if (isStatusEvent && isSelectedConversation) {
        void refreshSelectedConversationInBackground();
      }
    });

    return unsubscribe;
  }, [candidateUserId, isChatAtLatestPosition, refreshSelectedConversationInBackground, selectedConversationId]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setMessagesError(null);
    setUnseenNewMessagesCount(0);
    setIsChatAtLatestPosition(true);
    setView('chat');
    setPendingMarkReadConversationId(null);
    setConversations((prev) => prev.map((conversation) => (
      conversation.id === conversationId
        ? { ...conversation, unread_count: 0 }
        : conversation
    )));
  };

  const handleBack = () => {
    setView('list');
  };

  const handleSendMessage = async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedAccessToken || !selectedConversationId || !trimmedContent) return;

    setIsSendingMessage(true);
    setMessagesError(null);

    const updateConversationPreview = (updatedAt: string) => {
      setConversations((prev) => {
        const nextConversations = prev.map((conversation) => (
          conversation.id === selectedConversationId
            ? {
              ...conversation,
              last_message: trimmedContent,
              updated_at: updatedAt,
            }
            : conversation
        ));

        return sortConversationsByUpdated(nextConversations);
      });
    };

    try {
      sendCandidateSocketMessage({
        type: 'message',
        conversation_id: selectedConversationId,
        content: trimmedContent,
      });
      updateConversationPreview(new Date().toISOString());
    } catch {
      try {
        const sentMessage = await sendCandidateConversationMessage(trimmedAccessToken, selectedConversationId, {
          content: trimmedContent,
        });

        updateConversationPreview(sentMessage.created_at || new Date().toISOString());
        let didInsertSentMessage = false;
        setMessages((prev) => {
          if (hasMessageId(prev, sentMessage.id)) return prev;
          didInsertSentMessage = true;
          if (isMessagesDescending(prev)) {
            return [sentMessage, ...prev];
          }
          return [...prev, sentMessage];
        });
        if (didInsertSentMessage) {
          setMessagesTotal((prev) => (prev > 0 ? prev + 1 : prev));
        }
      } catch (apiError) {
        setMessagesError(getErrorMessage(apiError));
        throw apiError;
      }
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="max-w-full mx-auto px-2 sm:px-12 py-6 bg-[#F9FAFB] h-[calc(100vh-76px)] overflow-hidden">
      <div className="flex gap-0 md:gap-6 h-full min-h-0 relative">
        <div className={`w-full md:w-96 shrink-0 ${view === 'chat' ? 'hidden md:block' : 'block'}`}>
          <Sidebar
            selectedConversationId={selectedConversationId}
            conversations={conversations}
            searchValue={searchValue}
            isLoading={conversationsLoading}
            error={conversationsError}
            onSearchChange={setSearchValue}
            onSelect={handleSelectConversation}
          />
        </div>

        <div className={`flex-1 min-h-0 ${view === 'list' ? 'hidden md:block' : 'block'}`}>
          <ChatArea
            conversation={selectedConversation}
            messages={messages}
            applicationDetail={selectedApplicationDetail}
            isLoadingApplicationDetail={isSelectedApplicationDetailLoading}
            isStatusActionSubmitting={isStatusActionSubmitting}
            statusActionError={statusActionError}
            onOfferAccept={() => { void handleOfferAction('accept'); }}
            onOfferDecline={() => { void handleOfferAction('decline'); }}
            onInterviewAccept={() => { void handleInterviewAccept(); }}
            candidateUserId={candidateUserId}
            isLoadingMessages={messagesLoading}
            isSendingMessage={isSendingMessage}
            error={messagesError}
            onSendMessage={handleSendMessage}
            onBottomStateChange={setIsChatAtLatestPosition}
            onLoadOlderMessages={handleLoadOlderMessages}
            hasMoreOlderMessages={hasMoreOlderMessages}
            isLoadingOlderMessages={isLoadingOlderMessages}
            unseenNewMessagesCount={unseenNewMessagesCount}
            onBack={handleBack}
          />
        </div>
      </div>
    </div>
  );
}
