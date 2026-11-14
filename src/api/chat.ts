import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

type Schemas = components['schemas'];
export type ConversationDto = Schemas['ConversationDto'];
export type ConversationListResponseDto =
  Schemas['ConversationListResponseDto'];
export type ConversationDetailDto = Schemas['ConversationDetailDto'];
export type ConversationMemberDto = Schemas['ConversationMemberDto'];
export type CreateDirectConversationDto =
  Schemas['CreateDirectConversationDto'];
export type CreateGroupConversationDto = Schemas['CreateGroupConversationDto'];
export type UpdateGroupInfoDto = Schemas['UpdateGroupInfoDto'];
export type AddGroupMembersRequestDto = Schemas['AddGroupMembersRequestDto'];
export type AddGroupMembersResponseDto = Schemas['AddGroupMembersResponseDto'];
export type UpdateMemberRoleRequestDto = Schemas['UpdateMemberRoleRequestDto'];
export type LeaveGroupRequestDto = Schemas['LeaveGroupRequestDto'];
export type LeaveGroupResponseDto = Schemas['LeaveGroupResponseDto'];
export type SetHiddenChatPinDto = Schemas['SetHiddenChatPinDto'];
export type UnlockHiddenChatDto = Schemas['UnlockHiddenChatDto'];
export type MessageDto = Schemas['MessageDto'];
export type MessageListResponseDto = Schemas['MessageListResponseDto'];
export type DeleteMessageRequestDto = Schemas['DeleteMessageRequestDto'];
export type DeleteMessageResponseDto = Schemas['DeleteMessageResponseDto'];
export type LastMessageDto = Schemas['LastMessageDto'];
export type ReplyMessagePreviewDto = Schemas['ReplyMessagePreviewDto'];

export const chatApi = {
  /** 1. GET /conversations — Lấy danh sách cuộc hội thoại đang hoạt động. */
  async getConversations(params?: {
    after?: number;
    limit?: number;
  }): Promise<ConversationListResponseDto | undefined> {
    const result = await api.GET('/conversations', {
      params: { query: { after: params?.after, limit: params?.limit ?? 30 } },
    });
    return expectEnvelope(result).data;
  },

  /** 2. POST /conversations/direct — Tạo hoặc mở cuộc trò chuyện 1-1. */
  async createDirectConversation(
    targetUserId: number,
  ): Promise<ConversationDetailDto | undefined> {
    const result = await api.POST('/conversations/direct', {
      body: { target_user_id: targetUserId },
    });
    return expectEnvelope(result).data;
  },

  /** 3. POST /conversations/group — Tạo nhóm chat mới (tối thiểu 2 thành viên khác người tạo). */
  async createGroupConversation(
    body: CreateGroupConversationDto,
  ): Promise<ConversationDetailDto | undefined> {
    const result = await api.POST('/conversations/group', { body });
    return expectEnvelope(result).data;
  },

  /** 4. PUT /conversations/{id} — Cập nhật tên hoặc ảnh đại diện nhóm chat. */
  async updateGroupInfo(
    id: number,
    body: UpdateGroupInfoDto,
  ): Promise<ConversationDetailDto | undefined> {
    const result = await api.PUT('/conversations/{id}', {
      params: { path: { id } },
      body,
    });
    return expectEnvelope(result).data;
  },

  /** 5. GET /conversations/{id}/members — Lấy danh sách thành viên trong nhóm. */
  async getGroupMembers(id: number): Promise<ConversationMemberDto[]> {
    const result = await api.GET('/conversations/{id}/members', {
      params: { path: { id } },
    });
    return expectEnvelope(result).data ?? [];
  },

  /** 6. POST /conversations/{id}/members — Thêm thành viên vào nhóm chat. */
  async addGroupMembers(
    id: number,
    userIds: number[],
  ): Promise<AddGroupMembersResponseDto | undefined> {
    const result = await api.POST('/conversations/{id}/members', {
      params: { path: { id } },
      body: { user_ids: userIds },
    });
    return expectEnvelope(result).data;
  },

  /** 7. DELETE /conversations/{id}/members/{userId} — Xóa thành viên khỏi nhóm chat. */
  async removeGroupMember(id: number, userId: number): Promise<void> {
    const result = await api.DELETE('/conversations/{id}/members/{userId}', {
      params: { path: { id, userId } },
    });
    expectEnvelope(result);
  },

  /** 8. PUT /conversations/{id}/members/{userId}/role — Cập nhật vai trò thành viên nhóm. */
  async updateMemberRole(
    id: number,
    userId: number,
    role: 'CHIEF' | 'VILLAGE_ELDER' | 'VILLAGER',
  ): Promise<void> {
    const result = await api.PUT('/conversations/{id}/members/{userId}/role', {
      params: { path: { id, userId } },
      body: { role },
    });
    expectEnvelope(result);
  },

  /** 9. POST /conversations/{id}/leave — Rời khỏi nhóm chat. */
  async leaveGroup(
    id: number,
    newChiefId?: number,
  ): Promise<LeaveGroupResponseDto | undefined> {
    const result = await api.POST('/conversations/{id}/leave', {
      params: { path: { id } },
      body: newChiefId != null ? { new_chief_id: newChiefId } : {},
    });
    return expectEnvelope(result).data;
  },

  /** 10. PATCH /conversations/{id}/hide — Ẩn cuộc hội thoại vào kho bí mật. */
  async hideConversation(id: number): Promise<void> {
    const result = await api.PATCH('/conversations/{id}/hide', {
      params: { path: { id } },
    });
    expectEnvelope(result);
  },

  /** 11. PATCH /conversations/{id}/unhide — Bỏ ẩn cuộc hội thoại. */
  async unhideConversation(id: number): Promise<void> {
    const result = await api.PATCH('/conversations/{id}/unhide', {
      params: { path: { id } },
    });
    expectEnvelope(result);
  },

  /** 12. GET /conversations/hidden — Lấy danh sách cuộc hội thoại ẩn. */
  async getHiddenConversations(params?: {
    after?: number;
    limit?: number;
  }): Promise<ConversationListResponseDto | undefined> {
    const result = await api.GET('/conversations/hidden', {
      params: { query: { after: params?.after, limit: params?.limit ?? 30 } },
    });
    return expectEnvelope(result).data;
  },

  /** 13. POST /conversations/hidden/unlock — Mở khóa kho trò chuyện ẩn bằng mã PIN 6 số. */
  async unlockHiddenChat(pin: string): Promise<void> {
    const result = await api.POST('/conversations/hidden/unlock', {
      body: { pin },
    });
    expectEnvelope(result);
  },

  /** 14. POST /users/me/hidden-chat-pin — Cài đặt hoặc đổi mã PIN kho trò chuyện ẩn. */
  async setHiddenChatPin(pin: string, oldPin?: string): Promise<void> {
    const result = await api.POST('/users/me/hidden-chat-pin', {
      body: oldPin ? { pin, old_pin: oldPin } : { pin },
    });
    expectEnvelope(result);
  },

  /** 15. GET /conversations/{id}/messages — Lấy lịch sử tin nhắn trong cuộc hội thoại. */
  async getMessages(
    id: number,
    params?: { after?: number; limit?: number },
  ): Promise<MessageListResponseDto | undefined> {
    const result = await api.GET('/conversations/{id}/messages', {
      params: {
        path: { id },
        query: { after: params?.after, limit: params?.limit ?? 30 },
      },
    });
    return expectEnvelope(result).data;
  },

  /** 16. DELETE /messages/{id} — Xóa (ME) hoặc thu hồi (EVERYONE) tin nhắn. */
  async deleteMessage(
    id: number,
    scope: 'ME' | 'EVERYONE' = 'EVERYONE',
  ): Promise<DeleteMessageResponseDto | undefined> {
    const result = await api.DELETE('/messages/{id}', {
      params: { path: { id } },
      body: { scope },
    });
    return expectEnvelope(result).data;
  },
};
