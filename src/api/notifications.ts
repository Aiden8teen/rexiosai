import { apiRequest } from './client';
import type { Page } from './contracts';

export type NotificationType =
  | 'COMMUNITY_ANSWER'
  | 'ANSWER_ACCEPTED'
  | 'APPLICATION_RECEIVED'
  | 'APPLICATION_DECIDED'
  | 'PROBLEM_COMMENT';

export interface NotificationView {
  id: string;
  type: NotificationType;
  title: string;
  titleEn: string;
  href: string;
  createdAt: string;
  readAt: string | null;
}

export type NotificationPage = Page<NotificationView> & { unreadCount: number };

export const dispatchNotificationsRefresh = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('rexios:notifications-refresh'));
};

export const listNotifications = ({ page = 1, limit = 10 }: { page?: number; limit?: number } = {}) =>
  apiRequest<NotificationPage>(`/notifications?page=${page}&limit=${limit}`);

export const markNotificationRead = (id: string) =>
  apiRequest<NotificationView>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
