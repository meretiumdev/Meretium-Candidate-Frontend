import React from 'react';
import { X, FileText, MessageSquare, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import {
  getCandidateNotifications,
  markAllCandidateNotificationsRead,
  markCandidateNotificationRead,
  type CandidateNotificationItem,
} from '../services/notificationsApi';
import {
  sendCandidateSocketNotificationMarkAllRead,
  sendCandidateSocketNotificationMarkRead,
} from '../utils/candidateSocketConnection';
import ModalPortal from './ModalPortal';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

interface NotificationIconMeta {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const NOTIFICATIONS_LIMIT = 30;

function getStringValue(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim();
}

function countUnreadNotifications(notifications: CandidateNotificationItem[]): number {
  return notifications.reduce((count, notification) => count + (notification.is_read ? 0 : 1), 0);
}

function getNotificationApplicationId(notification: CandidateNotificationItem): string {
  if (!notification.data) return '';
  return getStringValue(notification.data.application_id);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Unable to update notifications right now. Please try again.';
}

function formatRelativeTime(timestamp: string): string {
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

function getNotificationIconMeta(type: string): NotificationIconMeta {
  const normalizedType = type.trim().toUpperCase();

  if (normalizedType.includes('APPLICATION')) {
    return {
      icon: FileText,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    };
  }

  if (normalizedType.includes('INTERVIEW') || normalizedType.includes('MESSAGE')) {
    return {
      icon: MessageSquare,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    };
  }

  return {
    icon: Bell,
    iconBg: 'bg-gray-50',
    iconColor: 'text-gray-500',
  };
}

export default function NotificationsModal({ isOpen, onClose, onUnreadCountChange }: NotificationsModalProps) {
  const navigate = useNavigate();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [notifications, setNotifications] = React.useState<CandidateNotificationItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isMarkAllSubmitting, setIsMarkAllSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadNotifications = React.useCallback(async () => {
    if (!accessToken?.trim()) {
      setErrorMessage('You are not authenticated. Please log in again.');
      setNotifications([]);
      onUnreadCountChange?.(0);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getCandidateNotifications(accessToken, { skip: 0, limit: NOTIFICATIONS_LIMIT });
      setNotifications(response.notifications);
      onUnreadCountChange?.(response.unread_notifications_count);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, onUnreadCountChange]);

  React.useEffect(() => {
    if (!isOpen) return;
    void loadNotifications();
  }, [isOpen, loadNotifications]);

  const sendNotificationMarkRead = React.useCallback(async (notificationId: string) => {
    let socketSent = false;

    try {
      sendCandidateSocketNotificationMarkRead({
        type: 'notification_mark_read',
        notification_id: notificationId,
      });
      socketSent = true;
    } catch {
      socketSent = false;
    }

    if (!socketSent) {
      if (!accessToken?.trim()) {
        throw new Error('You are not authenticated. Please log in again.');
      }
      await markCandidateNotificationRead(accessToken, notificationId);
    }
  }, [accessToken]);

  const sendNotificationMarkAllRead = React.useCallback(async () => {
    let socketSent = false;

    try {
      sendCandidateSocketNotificationMarkAllRead({ type: 'notification_mark_all_read' });
      socketSent = true;
    } catch {
      socketSent = false;
    }

    if (!socketSent) {
      if (!accessToken?.trim()) {
        throw new Error('You are not authenticated. Please log in again.');
      }
      await markAllCandidateNotificationsRead(accessToken);
    }
  }, [accessToken]);

  const handleNotificationClick = async (notification: CandidateNotificationItem) => {
    const notificationId = notification.id.trim();
    if (!notificationId) return;

    const applicationId = getNotificationApplicationId(notification);
    const wasUnread = !notification.is_read;

    if (wasUnread) {
      setNotifications((previous) => {
        const next = previous.map((item) => (
          item.id === notificationId ? { ...item, is_read: true } : item
        ));
        onUnreadCountChange?.(countUnreadNotifications(next));
        return next;
      });
    }

    try {
      if (wasUnread) {
        await sendNotificationMarkRead(notificationId);
      }
      setErrorMessage(null);
    } catch (error: unknown) {
      if (wasUnread) {
        setNotifications((previous) => {
          const next = previous.map((item) => (
            item.id === notificationId ? { ...item, is_read: false } : item
          ));
          onUnreadCountChange?.(countUnreadNotifications(next));
          return next;
        });
      }
      setErrorMessage(getErrorMessage(error));
      return;
    }

    if (applicationId) {
      navigate('/applications', { state: { openApplicationId: applicationId } });
      onClose();
    }
  };

  const handleMarkAllRead = async () => {
    if (isMarkAllSubmitting) return;
    if (!notifications.some((notification) => !notification.is_read)) return;

    const previousNotifications = notifications;
    setIsMarkAllSubmitting(true);
    setErrorMessage(null);

    setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
    onUnreadCountChange?.(0);

    try {
      await sendNotificationMarkAllRead();
    } catch (error: unknown) {
      setNotifications(previousNotifications);
      onUnreadCountChange?.(countUnreadNotifications(previousNotifications));
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsMarkAllSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal lockScroll={false}>
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-start justify-center md:justify-end p-4 pt-16"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="bg-white rounded-[20px] w-full max-w-[340px] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-top-4 duration-200 border border-gray-100 md:mr-20 mt-2"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
          <h2 className="text-[17px] font-bold text-gray-900 font-heading">Notifications</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto scrollbar-hide py-0">
          {isLoading && (
            <p className="px-5 py-4 text-[13px] text-gray-500 font-medium">Loading notifications...</p>
          )}

          {!isLoading && notifications.length === 0 && (
            <p className="px-5 py-4 text-[13px] text-gray-500 font-medium">No notifications yet.</p>
          )}

          {!isLoading && notifications.map((notification) => {
            const iconMeta = getNotificationIconMeta(notification.type);
            const unread = !notification.is_read;

            return (
              <div
                key={notification.id}
                onClick={() => { void handleNotificationClick(notification); }}
                className={`px-5 py-3.5 flex gap-3.5 transition-all hover:bg-gray-50/50 cursor-pointer relative border-b border-gray-50 last:border-b-0 ${unread ? 'bg-orange-50/5' : ''}`}
              >
                <div className={`size-9 rounded-lg ${iconMeta.iconBg} flex items-center justify-center ${iconMeta.iconColor} shrink-0 shadow-sm border border-black/5`}>
                  <iconMeta.icon size={16} />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-[13px] font-bold text-gray-900 font-heading mb-0.5">{notification.title || 'Notification'}</h4>
                  <p className="text-[12px] font-medium text-gray-500 font-body leading-tight mb-1 line-clamp-2">
                    {notification.message || 'You have a new update.'}
                  </p>
                  <span className="text-[10px] font-bold text-gray-400 font-body uppercase tracking-wider">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </div>
                {unread && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 size-1.5 bg-[#FF6934] rounded-full shadow-sm"></div>
                )}
              </div>
            );
          })}

          {errorMessage && (
            <div className="px-5 py-3 border-t border-gray-100">
              <p className="text-[12px] font-medium text-[#B42318]">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-gray-100 bg-white flex items-center justify-center sticky bottom-0">
          <button
            onClick={() => { void handleMarkAllRead(); }}
            disabled={isMarkAllSubmitting || isLoading || !notifications.some((notification) => !notification.is_read)}
            className="text-[13px] font-bold text-[#FF6934] hover:opacity-80 transition-all font-body cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isMarkAllSubmitting ? 'Marking...' : 'Mark all as read'}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
