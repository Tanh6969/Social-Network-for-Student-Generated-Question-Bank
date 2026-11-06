import { api, expectEnvelope, type OpBody, type OpQuery } from './client';

export const chatApi = {
  // ==========================================================================
  // 10. Trò chuyện - Cuộc hội thoại (Conversations)
  // ==========================================================================

  /**
   * GET /conversations
   */
  async getConversations(query?: OpQuery<'getConversations'>) {
    const result = await api.GET('/conversations', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /conversations/hidden
   */
  async getHiddenConversations(query?: OpQuery<'getHiddenConversations'>) {
    const result = await api.GET('/conversations/hidden', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /conversations/direct
   */
  async createDirectConversation(body: OpBody<'createDirectConversation'>) {
    const result = await api.POST('/conversations/direct', { body });
    return expectEnvelope(result).data;
  },

  /**
   * POST /conversations/group
   */
  async createGroupConversation(body: OpBody<'createGroupConversation'>) {
    const result = await api.POST('/conversations/group', { body });
    return expectEnvelope(result).data;
  },

  /**
   * PUT /conversations/{id}
   */
  async updateGroupInfo(id: number, body: OpBody<'updateGroupInfo'>) {
    const result = await api.PUT('/conversations/{id}', {
      params: { path: { id } },
      body,
    });
    return expectEnvelope(result).data;
  },

  /**
   * PATCH /conversations/{id}/hide
   */
  async hideConversation(id: number) {
    const result = await api.PATCH('/conversations/{id}/hide', {
      params: { path: { id } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * PATCH /conversations/{id}/unhide
   */
  async unhideConversation(id: number) {
    const result = await api.PATCH('/conversations/{id}/unhide', {
      params: { path: { id } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /conversations/hidden/unlock
   */
  async unlockHiddenChat(body: OpBody<'unlockHiddenChat'>) {
    const result = await api.POST('/conversations/hidden/unlock', { body });
    return expectEnvelope(result).data;
  },

  /**
   * POST /users/me/hidden-chat-pin
   */
  async setHiddenChatPin(body: OpBody<'setHiddenChatPin'>) {
    const result = await api.POST('/users/me/hidden-chat-pin', { body });
    return expectEnvelope(result).data;
  },

  /**
   * GET /conversations/{id}/members
   */
  async getGroupMembers(id: number) {
    const result = await api.GET('/conversations/{id}/members', {
      params: { path: { id } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /conversations/{id}/members
   */
  async addGroupMembers(id: number, body: OpBody<'addGroupMembers'>) {
    const result = await api.POST('/conversations/{id}/members', {
      params: { path: { id } },
      body,
    });
    return expectEnvelope(result).data;
  },

  /**
   * PUT /conversations/{id}/members/{userId}/role
   */
  async updateMemberRole(id: number, userId: number, body: OpBody<'updateMemberRole'>) {
    const result = await api.PUT('/conversations/{id}/members/{userId}/role', {
      params: { path: { id, userId } },
      body,
    });
    return expectEnvelope(result).data;
  },

  /**
   * DELETE /conversations/{id}/members/{userId}
   */
  async removeGroupMember(id: number, userId: number) {
    const result = await api.DELETE('/conversations/{id}/members/{userId}', {
      params: { path: { id, userId } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /conversations/{id}/leave
   */
  async leaveGroup(id: number, body?: OpBody<'leaveGroup'>) {
    const result = await api.POST('/conversations/{id}/leave', {
      params: { path: { id } },
      body: body as OpBody<'leaveGroup'>,
    });
    return expectEnvelope(result).data;
  },

  // ==========================================================================
  // 11. Trò chuyện - Tin nhắn (Messages)
  // ==========================================================================

  /**
   * GET /conversations/{id}/messages
   */
  async getMessages(id: number, query?: OpQuery<'getMessages'>) {
    const result = await api.GET('/conversations/{id}/messages', {
      params: { path: { id }, query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * DELETE /messages/{id}
   */
  async deleteMessage(id: number, body: OpBody<'deleteMessage'>) {
    const result = await api.DELETE('/messages/{id}', {
      params: { path: { id } },
      body,
    });
    return expectEnvelope(result).data;
  },

  // ==========================================================================
  // 12. Thông báo (Notifications)
  // ==========================================================================

  /**
   * GET /notifications
   */
  async getNotifications(query?: OpQuery<'getNotifications'>) {
    const result = await api.GET('/notifications', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /notifications/{id}/read
   */
  async markNotificationAsRead(id: number) {
    const result = await api.POST('/notifications/{id}/read', {
      params: { path: { id } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /notifications/read-all
   */
  async markAllNotificationsAsRead() {
    const result = await api.POST('/notifications/read-all');
    return expectEnvelope(result).data;
  },

  /**
   * GET /settings/push
   */
  async getPushSettings() {
    const result = await api.GET('/settings/push');
    return expectEnvelope(result).data;
  },

  /**
   * PUT /settings/push
   */
  async updatePushSettings(body: OpBody<'updatePushSettings'>) {
    const result = await api.PUT('/settings/push', { body });
    return expectEnvelope(result).data;
  },
};
