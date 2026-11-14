import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

export type NotificationDto = components['schemas']['NotificationDto'];

export const notificationsApi = {
  async list(after?: number) {
    const data = expectEnvelope(await api.GET('/notifications', {
      params: { query: { after, limit: 50 } },
    })).data;
    return {
      items: data?.items ?? [],
      after: data?.pagination?.after,
      hasNext: data?.pagination?.has_next ?? false,
      unreadCount: data?.unread_count ?? 0,
    };
  },
  async markRead(id: number): Promise<void> {
    expectEnvelope(await api.POST('/notifications/{id}/read', {
      params: { path: { id } },
    }));
  },
  async markAllRead(): Promise<void> {
    expectEnvelope(await api.POST('/notifications/read-all'));
  },
};
