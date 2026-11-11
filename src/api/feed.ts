import { api, ApiError, expectEnvelope } from './client';
import type { components } from './generated/openapi';

export type ActivityFeedItem = components['schemas']['ActivityFeedItemDto'];
export type PostResponse = components['schemas']['PostResponseDto'];

export interface FeedPage {
  items: PostResponse[];
  nextCursor: number | null;
}

export const feedApi = {
  async getPage(after?: number): Promise<FeedPage> {
    const result = await api.GET('/activity-feeds', {
      params: {
        query: { limit: 10, ...(after === undefined ? {} : { after }) },
      },
    });
    const page = expectEnvelope(result).data;
    if (!page) throw new Error('Phản hồi bảng tin không có dữ liệu.');

    const postIds = [
      ...new Set(
        (page.items ?? [])
          .filter(
            (item) =>
              item.target_type === 'POST' &&
              (item.action_type === 'CREATED_POST' ||
                item.action_type === 'PUBLISHED_LECTURE_VIDEO'),
          )
          .map((item) => item.target_id)
          .filter((id): id is number => typeof id === 'number'),
      ),
    ];
    const posts = await Promise.all(
      postIds.map(async (id) => {
        try {
          return await feedApi.getPost(id);
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) return null;
          throw error;
        }
      }),
    );
    const nextCursor = page.pagination?.has_next
      ? (page.pagination.after ?? page.items?.at(-1)?.feed_id ?? null)
      : null;
    if (page.pagination?.has_next && nextCursor === null) {
      throw new Error('Bảng tin thiếu con trỏ để tải trang tiếp theo.');
    }
    if (nextCursor !== null && nextCursor === after) {
      throw new Error('Bảng tin trả về con trỏ trùng trang hiện tại.');
    }
    return {
      items: posts.filter((post): post is PostResponse => post !== null),
      nextCursor,
    };
  },

  async getPost(id: number): Promise<PostResponse> {
    const result = await api.GET('/posts/{id}', { params: { path: { id } } });
    const post = expectEnvelope(result).data;
    if (!post?.post_id) throw new Error('Phản hồi bài viết thiếu ID.');
    return post;
  },
};
