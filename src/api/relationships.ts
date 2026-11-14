import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';
import type { CursorPage, PostResponseDto, ProfileResponse } from './posts';
import { searchApi, type SearchResultItemDto } from './search';

type Schemas = components['schemas'];
export type FriendDto = Schemas['FriendDto'];
export type FriendRequestReceivedDto = Schemas['FriendRequestReceivedDto'];
export type FriendRequestSentDto = Schemas['FriendRequestSentDto'];
export type FriendshipResponseDto = Schemas['FriendshipResponseDto'];
export type FollowingUserDto = Schemas['FollowingUserDto'];
export type FollowerUserDto = Schemas['FollowerUserDto'];
export type FollowResponseDto = Schemas['FollowResponseDto'];
export type UnfollowResponseDto = Schemas['UnfollowResponseDto'];
export type RelationshipStatsResponseDto =
  Schemas['RelationshipStatsResponseDto'];
export type BlockedUserDto = Schemas['BlockedUserDto'];
export type BlockResponseDto = Schemas['BlockResponseDto'];
export type UnblockResponseDto = Schemas['UnblockResponseDto'];
export type UserSearchResultDto = NonNullable<SearchResultItemDto['user']>;

const PAGE_SIZE = 50;
const MAX_PAGES = 5;

interface CursorEnvelope<T> {
  items?: T[];
  pagination?: { has_next?: boolean; after?: number | null };
}

async function collectPages<T>(
  fetchPage: (after?: number) => Promise<CursorEnvelope<T> | undefined>,
): Promise<T[]> {
  const all: T[] = [];
  let after: number | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await fetchPage(after);
    all.push(...(data?.items ?? []));
    const next = data?.pagination?.after ?? undefined;
    if (!data?.pagination?.has_next || next == null) break;
    after = next;
  }
  return all;
}

export const relationshipsApi = {
  /** GET /users/{userId} — hồ sơ công khai kèm quan hệ với tôi. */
  async getUser(userId: number): Promise<ProfileResponse | undefined> {
    const result = await api.GET('/users/{userId}', {
      params: { path: { userId } },
    });
    return expectEnvelope(result).data;
  },

  /** GET /users/{userId}/relationship-stats — thống kê bạn bè, người theo dõi, đang theo dõi và trạng thái quan hệ với tôi. */
  async getRelationshipStats(
    userId: number,
  ): Promise<RelationshipStatsResponseDto | undefined> {
    const result = await api.GET('/users/{userId}/relationship-stats', {
      params: { path: { userId } },
    });
    return expectEnvelope(result).data;
  },

  /** GET /users/{userId}/posts — bài viết trên trang cá nhân người khác. */
  async getUserPosts(
    userId: number,
    after?: number,
    limit = 20,
  ): Promise<CursorPage<PostResponseDto>> {
    const result = await api.GET('/users/{userId}/posts', {
      params: { path: { userId }, query: { after, limit } },
    });
    const data = expectEnvelope(result).data;
    return {
      items: data?.items ?? [],
      hasNext: data?.pagination?.has_next ?? false,
      after: data?.pagination?.after ?? undefined,
    };
  },

  /** GET /friendships — danh sách bạn bè của tôi. */
  getFriends(): Promise<FriendDto[]> {
    return collectPages(async (after) => {
      const res = await api.GET('/friendships', {
        params: { query: { after, limit: PAGE_SIZE } },
      });
      return expectEnvelope(res).data;
    });
  },

  /** GET /friendships/requests/received — lời mời kết bạn đã nhận. */
  getReceivedRequests(): Promise<FriendRequestReceivedDto[]> {
    return collectPages(async (after) => {
      const res = await api.GET('/friendships/requests/received', {
        params: { query: { after, limit: PAGE_SIZE } },
      });
      return expectEnvelope(res).data;
    });
  },

  /** GET /friendships/requests/sent — lời mời kết bạn đã gửi. */
  getSentRequests(): Promise<FriendRequestSentDto[]> {
    return collectPages(async (after) => {
      const res = await api.GET('/friendships/requests/sent', {
        params: { query: { after, limit: PAGE_SIZE } },
      });
      return expectEnvelope(res).data;
    });
  },

  /** GET /follows/following — người tôi đang theo dõi. */
  getFollowing(): Promise<FollowingUserDto[]> {
    return collectPages(async (after) => {
      const res = await api.GET('/follows/following', {
        params: { query: { after, limit: PAGE_SIZE } },
      });
      return expectEnvelope(res).data;
    });
  },

  /** GET /follows/followers — người đang theo dõi tôi (Followers). */
  getFollowers(params?: {
    after?: number;
    limit?: number;
  }): Promise<FollowerUserDto[]> {
    const limit = params?.limit ?? PAGE_SIZE;
    return collectPages(async (after) => {
      const res = await api.GET('/follows/followers', {
        params: { query: { after: after ?? params?.after, limit } },
      });
      return expectEnvelope(res).data;
    });
  },

  /** GET /blocks — danh sách người tôi đang chặn. */
  getBlocked(): Promise<BlockedUserDto[]> {
    return collectPages(async (after) => {
      const res = await api.GET('/blocks', {
        params: { query: { after, limit: PAGE_SIZE } },
      });
      return expectEnvelope(res).data;
    });
  },

  /** GET /search?type=USER — tìm người dùng theo tên/lớp/khoa (để trống = lấy danh sách người dùng công khai). */
  async searchUsers(query?: string, limit = 20): Promise<UserSearchResultDto[]> {
    const page = await searchApi.search({ query, type: 'USER', limit });
    return page.items
      .map((item) => item.user)
      .filter(
        (user): user is UserSearchResultDto =>
          Boolean(user && user.user_id != null),
      );
  },

  /** POST /friendships/request — gửi lời mời kết bạn (tự động chấp nhận nếu đối phương đã gửi lời mời trước đó). */
  async sendFriendRequest(
    addresseeId: number,
  ): Promise<FriendshipResponseDto | undefined> {
    const res = await api.POST('/friendships/request', {
      body: { addressee_id: addresseeId },
    });
    return expectEnvelope(res).data;
  },

  /** DELETE /friendships/requests/sent/{receiverId} — rút lời mời đã gửi. */
  async cancelFriendRequest(receiverId: number): Promise<void> {
    const res = await api.DELETE('/friendships/requests/sent/{receiverId}', {
      params: { path: { receiverId } },
    });
    expectEnvelope(res);
  },

  /** POST /friendships/accept — chấp nhận lời mời kết bạn. */
  async acceptFriendRequest(
    requesterId: number,
  ): Promise<FriendshipResponseDto | undefined> {
    const res = await api.POST('/friendships/accept', {
      body: { requester_id: requesterId },
    });
    return expectEnvelope(res).data;
  },

  /** POST /friendships/decline — từ chối lời mời kết bạn. */
  async declineFriendRequest(requesterId: number): Promise<void> {
    const res = await api.POST('/friendships/decline', {
      body: { requester_id: requesterId },
    });
    expectEnvelope(res);
  },

  /** DELETE /friendships/{friendId} — huỷ kết bạn. */
  async unfriend(friendId: number): Promise<void> {
    const res = await api.DELETE('/friendships/{friendId}', {
      params: { path: { friendId } },
    });
    expectEnvelope(res);
  },

  /** POST /follows/{targetUserId} — theo dõi người dùng. */
  async follow(targetUserId: number): Promise<FollowResponseDto | undefined> {
    const res = await api.POST('/follows/{targetUserId}', {
      params: { path: { targetUserId } },
    });
    return expectEnvelope(res).data;
  },

  /** DELETE /follows/{targetUserId} — bỏ theo dõi. */
  async unfollow(
    targetUserId: number,
  ): Promise<UnfollowResponseDto | undefined> {
    const res = await api.DELETE('/follows/{targetUserId}', {
      params: { path: { targetUserId } },
    });
    return expectEnvelope(res).data;
  },

  /** POST /blocks/{targetUserId} — chặn người dùng. */
  async block(targetUserId: number): Promise<BlockResponseDto | undefined> {
    const res = await api.POST('/blocks/{targetUserId}', {
      params: { path: { targetUserId } },
    });
    return expectEnvelope(res).data;
  },

  /** DELETE /blocks/{targetUserId} — bỏ chặn người dùng. */
  async unblock(targetUserId: number): Promise<UnblockResponseDto | undefined> {
    const res = await api.DELETE('/blocks/{targetUserId}', {
      params: { path: { targetUserId } },
    });
    return expectEnvelope(res).data;
  },
};
