import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';
import type { CursorPage, PostResponseDto, ProfileResponse } from './posts';

type Schemas = components['schemas'];
export type FriendDto = Schemas['FriendDto'];
export type FriendRequestReceivedDto = Schemas['FriendRequestReceivedDto'];
export type FriendRequestSentDto = Schemas['FriendRequestSentDto'];
export type FollowingUserDto = Schemas['FollowingUserDto'];
export type BlockedUserDto = Schemas['BlockedUserDto'];
export type UserSearchResultDto = Schemas['UserSearchResultDto'];

const PAGE_LIMIT = 50;
/** Số trang tối đa khi đọc hết một danh sách (50 × 10 = 500 mục). */
const MAX_PAGES = 10;

type Page<T> = {
  items?: T[];
  pagination?: { has_next?: boolean; after?: number };
};

async function readAll<T>(
  fetchPage: (after?: number) => Promise<Page<T> | undefined>,
): Promise<T[]> {
  const all: T[] = [];
  let after: number | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await fetchPage(after);
    all.push(...(data?.items ?? []));
    if (!data?.pagination?.has_next || data.pagination.after == null) break;
    after = data.pagination.after;
  }
  return all;
}

const query = (after?: number) => ({
  params: { query: { after, limit: PAGE_LIMIT } },
});

/** Hồ sơ người khác, bạn bè, theo dõi, chặn, tìm người (chỉ dùng cho phiên thật). */
export const relationshipsApi = {
  /** GET /users/{userId} — hồ sơ công khai kèm quan hệ với tôi. */
  async getUser(userId: number): Promise<ProfileResponse | null> {
    const result = await api.GET('/users/{userId}', {
      params: { path: { userId } },
    });
    return expectEnvelope(result).data ?? null;
  },

  /** GET /users/{userId}/posts */
  async getUserPosts(
    userId: number,
    after?: number,
  ): Promise<CursorPage<PostResponseDto>> {
    const result = await api.GET('/users/{userId}/posts', {
      params: { path: { userId }, query: { after, limit: 20 } },
    });
    const data = expectEnvelope(result).data;
    return {
      items: data?.items ?? [],
      hasNext: data?.pagination?.has_next ?? false,
      after: data?.pagination?.after,
    };
  },

  async getFriends(): Promise<FriendDto[]> {
    return readAll(
      async (after) =>
        expectEnvelope(await api.GET('/friendships', query(after))).data,
    );
  },

  async getReceivedRequests(): Promise<FriendRequestReceivedDto[]> {
    return readAll(
      async (after) =>
        expectEnvelope(
          await api.GET('/friendships/requests/received', query(after)),
        ).data,
    );
  },

  async getSentRequests(): Promise<FriendRequestSentDto[]> {
    return readAll(
      async (after) =>
        expectEnvelope(
          await api.GET('/friendships/requests/sent', query(after)),
        ).data,
    );
  },

  async getFollowing(): Promise<FollowingUserDto[]> {
    return readAll(
      async (after) =>
        expectEnvelope(await api.GET('/follows/following', query(after))).data,
    );
  },

  async getBlocked(): Promise<BlockedUserDto[]> {
    return readAll(
      async (after) =>
        expectEnvelope(await api.GET('/blocks', query(after))).data,
    );
  },

  /** GET /search?type=USER */
  async searchUsers(text: string): Promise<UserSearchResultDto[]> {
    const result = await api.GET('/search', {
      params: { query: { query: text, type: 'USER', limit: 20 } },
    });
    return (expectEnvelope(result).data?.items ?? [])
      .map((item) => item.user)
      .filter((user): user is UserSearchResultDto => Boolean(user?.user_id));
  },

  async sendFriendRequest(userId: number): Promise<void> {
    expectEnvelope(
      await api.POST('/friendships/request', {
        body: { addressee_id: userId },
      }),
    );
  },

  async cancelFriendRequest(userId: number): Promise<void> {
    expectEnvelope(
      await api.DELETE('/friendships/requests/sent/{receiverId}', {
        params: { path: { receiverId: userId } },
      }),
    );
  },

  async acceptFriendRequest(userId: number): Promise<void> {
    expectEnvelope(
      await api.POST('/friendships/accept', {
        body: { requester_id: userId },
      }),
    );
  },

  async declineFriendRequest(userId: number): Promise<void> {
    expectEnvelope(
      await api.POST('/friendships/decline', {
        body: { requester_id: userId },
      }),
    );
  },

  async unfriend(userId: number): Promise<void> {
    expectEnvelope(
      await api.DELETE('/friendships/{friendId}', {
        params: { path: { friendId: userId } },
      }),
    );
  },

  async follow(userId: number): Promise<void> {
    expectEnvelope(
      await api.POST('/follows/{targetUserId}', {
        params: { path: { targetUserId: userId } },
      }),
    );
  },

  async unfollow(userId: number): Promise<void> {
    expectEnvelope(
      await api.DELETE('/follows/{targetUserId}', {
        params: { path: { targetUserId: userId } },
      }),
    );
  },

  async block(userId: number): Promise<void> {
    expectEnvelope(
      await api.POST('/blocks/{targetUserId}', {
        params: { path: { targetUserId: userId } },
      }),
    );
  },

  async unblock(userId: number): Promise<void> {
    expectEnvelope(
      await api.DELETE('/blocks/{targetUserId}', {
        params: { path: { targetUserId: userId } },
      }),
    );
  },
};
