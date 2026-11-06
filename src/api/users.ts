import { api, expectEnvelope, type OpBody, type OpQuery } from './client';
import type { components } from './generated/openapi';

export type ProfileResponse = components['schemas']['ProfileResponse'];
export type UpdateProfileRequest = components['schemas']['UpdateProfileRequest'];
export type BlockResponseDto = components['schemas']['BlockResponseDto'];
export type UnblockResponseDto = components['schemas']['UnblockResponseDto'];

export const usersApi = {
  // ==========================================================================
  // 03. Hồ sơ người dùng (User Profile)
  // ==========================================================================

  /**
   * GET /users/me
   */
  async getMyProfile() {
    const result = await api.GET('/users/me');
    return expectEnvelope(result).data;
  },

  /**
   * PUT /users/me
   */
  async updateMyProfile(body: OpBody<'updateMyProfile'>) {
    const result = await api.PUT('/users/me', { body });
    return expectEnvelope(result).data;
  },

  /**
   * DELETE /users/me
   */
  async deleteMyProfile() {
    const result = await api.DELETE('/users/me');
    return expectEnvelope(result).data;
  },

  /**
   * GET /users/{userId}
   */
  async getUserProfile(userId: number) {
    const result = await api.GET('/users/{userId}', {
      params: { path: { userId } },
    });
    return expectEnvelope(result).data;
  },

  // ==========================================================================
  // 07. Quan hệ - Kết bạn (Friendships)
  // ==========================================================================

  /**
   * GET /friendships
   */
  async getMyFriends(query?: OpQuery<'getMyFriends'>) {
    const result = await api.GET('/friendships', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /friendships/requests/sent
   */
  async getSentFriendRequests(query?: OpQuery<'getSentFriendRequests'>) {
    const result = await api.GET('/friendships/requests/sent', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /friendships/requests/received
   */
  async getReceivedFriendRequests(query?: OpQuery<'getReceivedFriendRequests'>) {
    const result = await api.GET('/friendships/requests/received', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /friendships/request
   */
  async sendFriendRequest(body: OpBody<'sendFriendRequest'>) {
    const result = await api.POST('/friendships/request', { body });
    return expectEnvelope(result).data;
  },

  /**
   * POST /friendships/accept
   */
  async acceptFriendRequest(body: OpBody<'acceptFriendRequest'>) {
    const result = await api.POST('/friendships/accept', { body });
    return expectEnvelope(result).data;
  },

  /**
   * POST /friendships/decline
   */
  async declineFriendRequest(body: OpBody<'declineFriendRequest'>) {
    const result = await api.POST('/friendships/decline', { body });
    return expectEnvelope(result).data;
  },

  /**
   * DELETE /friendships/{friendId}
   */
  async unfriend(friendId: number) {
    const result = await api.DELETE('/friendships/{friendId}', {
      params: { path: { friendId } },
    });
    return expectEnvelope(result).data;
  },

  // ==========================================================================
  // 08. Quan hệ - Theo dõi (Follows)
  // ==========================================================================

  /**
   * POST /follows/{targetUserId}
   */
  async followUser(targetUserId: number) {
    const result = await api.POST('/follows/{targetUserId}', {
      params: { path: { targetUserId } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * DELETE /follows/{targetUserId}
   */
  async unfollowUser(targetUserId: number) {
    const result = await api.DELETE('/follows/{targetUserId}', {
      params: { path: { targetUserId } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /follows/following
   */
  async getFollowing(query?: OpQuery<'getFollowing'>) {
    const result = await api.GET('/follows/following', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /follows/followers
   */
  async getFollowers(query?: OpQuery<'getFollowers'>) {
    const result = await api.GET('/follows/followers', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /users/{userId}/relationship-stats
   */
  async getRelationshipStats(userId: number) {
    const result = await api.GET('/users/{userId}/relationship-stats', {
      params: { path: { userId } },
    });
    return expectEnvelope(result).data;
  },

  // ==========================================================================
  // 09. Quan hệ - Chặn (Blocks)
  // ==========================================================================

  /**
   * GET /blocks
   */
  async getBlockedUsers(query?: OpQuery<'getBlockedUsers'>) {
    const result = await api.GET('/blocks', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /blocks/{targetUserId}
   */
  async blockUser(targetUserId: number) {
    const result = await api.POST('/blocks/{targetUserId}', {
      params: { path: { targetUserId } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * DELETE /blocks/{targetUserId}
   */
  async unblockUser(targetUserId: number) {
    const result = await api.DELETE('/blocks/{targetUserId}', {
      params: { path: { targetUserId } },
    });
    return expectEnvelope(result).data;
  },
};
