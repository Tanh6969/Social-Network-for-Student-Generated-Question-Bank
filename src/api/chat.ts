import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

type Schemas = components['schemas'];
export type ConversationDto = Schemas['ConversationDto'];
export type ConversationDetailDto = Schemas['ConversationDetailDto'];
export type ConversationMemberDto = Schemas['ConversationMemberDto'];
export type MessageDto = Schemas['MessageDto'];

export const chatApi = {
  async list(cursor?: string) {
    const data = expectEnvelope(await api.GET('/conversations', {
      params: { query: { cursor, limit: 20 } },
    })).data;
    return {
      items: data?.items ?? [],
      nextCursor: data?.next_cursor,
      hasNext: data?.pagination?.has_next ?? false,
    };
  },
  async members(id: number): Promise<ConversationMemberDto[]> {
    return expectEnvelope(await api.GET('/conversations/{id}/members', {
      params: { path: { id } },
    })).data ?? [];
  },
  async messages(id: number, after?: number) {
    const data = expectEnvelope(await api.GET('/conversations/{id}/messages', {
      params: { path: { id }, query: { after, limit: 50 } },
    })).data;
    return {
      items: data?.messages ?? [],
      after: data?.pagination?.after,
      hasNext: data?.pagination?.has_next ?? false,
    };
  },
  async createDirect(targetUserId: number): Promise<ConversationDetailDto | null> {
    return expectEnvelope(await api.POST('/conversations/direct', {
      body: { target_user_id: targetUserId },
    })).data ?? null;
  },
  async revoke(messageId: number): Promise<void> {
    expectEnvelope(await api.DELETE('/messages/{id}', {
      params: { path: { id: messageId } },
      body: { scope: 'EVERYONE' },
    }));
  },
};
