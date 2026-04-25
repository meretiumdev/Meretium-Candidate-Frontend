const RAW_CANDIDATE_API_BASE_URL = import.meta.env.VITE_CANDIDATE_API_BASE_URL?.trim() || '';
const RAW_CANDIDATE_WS_BASE_URL = import.meta.env.VITE_CANDIDATE_WS_BASE_URL?.trim() || '';

function removeTrailingSlash(input: string): string {
  return input.replace(/\/+$/, '');
}

function toWebSocketProtocol(protocol: string): string | null {
  if (protocol === 'http:') return 'ws:';
  if (protocol === 'https:') return 'wss:';
  if (protocol === 'ws:' || protocol === 'wss:') return protocol;
  return null;
}

function normalizeWebSocketBaseUrl(rawBaseUrl: string): string {
  if (!rawBaseUrl) return '';

  try {
    const parsed = new URL(rawBaseUrl);
    const socketProtocol = toWebSocketProtocol(parsed.protocol);
    if (!socketProtocol) return '';
    return `${socketProtocol}//${parsed.host}${removeTrailingSlash(parsed.pathname)}`;
  } catch {
    return '';
  }
}

function getCandidateSocketBaseUrl(): string {
  const explicitWsBaseUrl = normalizeWebSocketBaseUrl(RAW_CANDIDATE_WS_BASE_URL);
  if (explicitWsBaseUrl) return explicitWsBaseUrl;

  return normalizeWebSocketBaseUrl(RAW_CANDIDATE_API_BASE_URL);
}

const CANDIDATE_SOCKET_BASE_URL = getCandidateSocketBaseUrl();
const candidateSocketMessageListeners = new Set<(payload: unknown) => void>();
let activeCandidateSocket: WebSocket | null = null;
let activeCandidateSocketCleanup: (() => void) | null = null;
const queuedSocketPayloads: string[] = [];

function parseSocketEventData(data: MessageEvent['data']): unknown | null {
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) return null;

    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  if (data instanceof ArrayBuffer) {
    try {
      const text = new TextDecoder().decode(data);
      if (!text.trim()) return null;
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  return null;
}

function notifySocketMessageListeners(payload: unknown): void {
  candidateSocketMessageListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch {
      // Ignore listener errors to avoid breaking other subscribers.
    }
  });
}

function flushQueuedSocketPayloads(socket: WebSocket): void {
  if (socket.readyState !== WebSocket.OPEN) return;

  while (queuedSocketPayloads.length > 0) {
    const queuedPayload = queuedSocketPayloads.shift();
    if (!queuedPayload) continue;
    socket.send(queuedPayload);
  }
}

export function subscribeCandidateSocketMessages(listener: (payload: unknown) => void): () => void {
  candidateSocketMessageListeners.add(listener);
  return () => {
    candidateSocketMessageListeners.delete(listener);
  };
}

export function attachCandidateSocket(socket: WebSocket): void {
  if (activeCandidateSocket === socket) return;

  if (activeCandidateSocketCleanup) {
    activeCandidateSocketCleanup();
    activeCandidateSocketCleanup = null;
  }

  activeCandidateSocket = socket;

  const handleOpen = () => {
    flushQueuedSocketPayloads(socket);
  };

  const handleMessage = (event: MessageEvent) => {
    const payload = parseSocketEventData(event.data);
    if (payload === null) return;
    notifySocketMessageListeners(payload);
  };

  socket.addEventListener('open', handleOpen);
  socket.addEventListener('message', handleMessage);

  activeCandidateSocketCleanup = () => {
    socket.removeEventListener('open', handleOpen);
    socket.removeEventListener('message', handleMessage);

    if (activeCandidateSocket === socket) {
      activeCandidateSocket = null;
    }
  };

  if (socket.readyState === WebSocket.OPEN) {
    flushQueuedSocketPayloads(socket);
  }
}

export function detachCandidateSocket(socket: WebSocket): void {
  if (activeCandidateSocket !== socket) return;
  if (activeCandidateSocketCleanup) {
    activeCandidateSocketCleanup();
    activeCandidateSocketCleanup = null;
  }
}

function sendSocketPayload(payload: unknown): void {
  const payloadString = JSON.stringify(payload);

  if (!activeCandidateSocket) {
    throw new Error('Socket is not connected.');
  }

  if (activeCandidateSocket.readyState === WebSocket.CONNECTING) {
    queuedSocketPayloads.push(payloadString);
    return;
  }

  if (activeCandidateSocket.readyState !== WebSocket.OPEN) {
    throw new Error('Socket is not connected.');
  }

  activeCandidateSocket.send(payloadString);
}

export interface CandidateSocketOutgoingMessagePayload {
  type: 'message';
  conversation_id: string;
  content: string;
}

export interface CandidateSocketMarkReadPayload {
  type: 'mark_read';
  conversation_id: string;
}

export interface CandidateSocketNotificationMarkReadPayload {
  type: 'notification_mark_read';
  notification_id: string;
}

export interface CandidateSocketNotificationMarkAllReadPayload {
  type: 'notification_mark_all_read';
}

export function sendCandidateSocketMessage(payload: CandidateSocketOutgoingMessagePayload): void {
  const trimmedConversationId = payload.conversation_id.trim();
  if (!trimmedConversationId) {
    throw new Error('Conversation id is required.');
  }

  const trimmedContent = payload.content.trim();
  if (!trimmedContent) {
    throw new Error('Message content is required.');
  }

  sendSocketPayload({
    type: 'message',
    conversation_id: trimmedConversationId,
    content: trimmedContent,
  });
}

export function sendCandidateSocketMarkRead(payload: CandidateSocketMarkReadPayload): void {
  const trimmedConversationId = payload.conversation_id.trim();
  if (!trimmedConversationId) {
    throw new Error('Conversation id is required.');
  }

  sendSocketPayload({
    type: 'mark_read',
    conversation_id: trimmedConversationId,
  });
}

export function sendCandidateSocketNotificationMarkRead(payload: CandidateSocketNotificationMarkReadPayload): void {
  const trimmedNotificationId = payload.notification_id.trim();
  if (!trimmedNotificationId) {
    throw new Error('Notification id is required.');
  }

  sendSocketPayload({
    type: 'notification_mark_read',
    notification_id: trimmedNotificationId,
  });
}

export function sendCandidateSocketNotificationMarkAllRead(
  _payload?: CandidateSocketNotificationMarkAllReadPayload
): void {
  sendSocketPayload({
    type: 'notification_mark_all_read',
  });
}

export function buildCandidateSocketUrl(userId: string, accessToken: string): string {
  if (!CANDIDATE_SOCKET_BASE_URL) {
    throw new Error(
      'Missing candidate socket base URL. Set VITE_CANDIDATE_WS_BASE_URL or VITE_CANDIDATE_API_BASE_URL.'
    );
  }

  const trimmedUserId = userId.trim();
  if (!trimmedUserId) {
    throw new Error('User id is required to connect the candidate socket.');
  }

  const trimmedAccessToken = accessToken.trim();
  if (!trimmedAccessToken) {
    throw new Error('Access token is required to connect the candidate socket.');
  }

  return `${CANDIDATE_SOCKET_BASE_URL}/messaging/ws/${encodeURIComponent(trimmedUserId)}?token=${encodeURIComponent(trimmedAccessToken)}`;
}

export interface CandidateSocketConnectionOptions {
  userId: string;
  accessToken: string;
  protocols?: string | string[];
  onOpen?: (event: Event, socket: WebSocket) => void;
  onMessage?: (event: MessageEvent, socket: WebSocket) => void;
  onError?: (event: Event, socket: WebSocket) => void;
  onClose?: (event: CloseEvent, socket: WebSocket) => void;
}

export function connectCandidateSocket(options: CandidateSocketConnectionOptions): WebSocket {
  const socketUrl = buildCandidateSocketUrl(options.userId, options.accessToken);
  const socket = options.protocols
    ? new WebSocket(socketUrl, options.protocols)
    : new WebSocket(socketUrl);

  if (options.onOpen) {
    socket.addEventListener('open', (event) => options.onOpen?.(event, socket));
  }

  if (options.onMessage) {
    socket.addEventListener('message', (event) => options.onMessage?.(event, socket));
  }

  if (options.onError) {
    socket.addEventListener('error', (event) => options.onError?.(event, socket));
  }

  if (options.onClose) {
    socket.addEventListener('close', (event) => options.onClose?.(event, socket));
  }

  return socket;
}
