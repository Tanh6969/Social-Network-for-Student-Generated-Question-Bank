import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';
import { multipartBody } from './multipart';

type Schemas = components['schemas'];
export type PostResponseDto = Schemas['PostResponseDto'];
export type ActivityFeedItemDto = Schemas['ActivityFeedItemDto'];
export type MediaItem = Schemas['MediaItem'];
export type CommentResponseDto = Schemas['CommentResponseDto'];
export type CreatePostRequest = Schemas['CreatePostRequest'];
export type UpdatePostRequest = Schemas['UpdatePostRequest'];
export type MediaUploadResponse = Schemas['MediaUploadResponse'];
export type ProfileResponse = Schemas['ProfileResponse'];
export type PostVisibility = CreatePostRequest['visibility'];
export type InteractionTargetType = Schemas['ReactRequest']['target_type'];
export type MediaUploadPurpose =
  'AVATAR' | 'COVER' | 'QUESTION' | 'POST' | 'COMMENT' | 'CHAT' | 'DOCUMENT';

export interface CursorPage<T> {
  items: T[];
  hasNext: boolean;
  after?: number;
}

/** Bài viết, bảng tin, cảm xúc, bình luận và tải media (chỉ dùng cho phiên thật). */
export const postsApi = {
  /** GET /activity-feeds — dòng hoạt động cá nhân hóa, phân trang con trỏ. */
  async getActivityFeed(
    after?: number,
    limit = 20,
  ): Promise<CursorPage<ActivityFeedItemDto>> {
    const result = await api.GET('/activity-feeds', {
      params: { query: { after, limit } },
    });
    const data = expectEnvelope(result).data;
    return {
      items: data?.items ?? [],
      hasNext: data?.pagination?.has_next ?? false,
      after: data?.pagination?.after,
    };
  },

  /** GET /posts/me — bài viết của chính mình. */
  async getMyPosts(
    after?: number,
    limit = 20,
  ): Promise<CursorPage<PostResponseDto>> {
    const result = await api.GET('/posts/me', {
      params: { query: { after, limit } },
    });
    const data = expectEnvelope(result).data;
    return {
      items: data?.items ?? [],
      hasNext: data?.pagination?.has_next ?? false,
      after: data?.pagination?.after,
    };
  },

  /** GET /posts/{id} */
  async getPost(id: number): Promise<PostResponseDto | null> {
    const result = await api.GET('/posts/{id}', {
      params: { path: { id } },
    });
    return expectEnvelope(result).data ?? null;
  },

  /** POST /posts */
  async createPost(body: CreatePostRequest): Promise<PostResponseDto | null> {
    const result = await api.POST('/posts', { body });
    return expectEnvelope(result).data ?? null;
  },

  /** PUT /posts/{id} — media_urls thay thế toàn bộ danh sách cũ. */
  async updatePost(id: number, body: UpdatePostRequest): Promise<void> {
    const result = await api.PUT('/posts/{id}', {
      params: { path: { id } },
      body,
    });
    expectEnvelope(result);
  },

  /** DELETE /posts/{id} */
  async deletePost(id: number): Promise<void> {
    const result = await api.DELETE('/posts/{id}', {
      params: { path: { id } },
    });
    expectEnvelope(result);
  },

  /** POST /react — gửi lại cùng cảm xúc sẽ gỡ cảm xúc (toggle). */
  async react(
    targetType: InteractionTargetType,
    targetId: number,
    reactionType: 'LIKE' | 'LOVE' | 'WOW' = 'LIKE',
  ) {
    const result = await api.POST('/react', {
      body: {
        target_type: targetType,
        target_id: targetId,
        reaction_type: reactionType,
      },
    });
    return expectEnvelope(result).data ?? {};
  },

  /** GET /comments — bình luận gốc (kèm replies) của một đối tượng. */
  async getComments(
    targetType: InteractionTargetType,
    targetId: number,
    after?: number,
    limit = 50,
  ): Promise<CursorPage<CommentResponseDto>> {
    const result = await api.GET('/comments', {
      params: {
        query: {
          target_type: targetType,
          target_id: targetId,
          sort: 'oldest',
          after,
          limit,
        },
      },
    });
    const data = expectEnvelope(result).data;
    return {
      items: data?.items ?? [],
      hasNext: data?.pagination?.has_next ?? false,
      after: data?.pagination?.after,
    };
  },

  /** POST /comments — bình luận mới hoặc trả lời (parent_comment_id). */
  async createComment(
    targetType: InteractionTargetType,
    targetId: number,
    content: string,
    parentCommentId?: number,
  ): Promise<CommentResponseDto | null> {
    const result = await api.POST('/comments', {
      body: {
        target_type: targetType,
        target_id: targetId,
        content,
        parent_comment_id: parentCommentId,
      },
    });
    return expectEnvelope(result).data ?? null;
  },

  /** POST /medias/upload?purpose=… — tải tệp qua backend (multipart). */
  async uploadMedia(
    file: File,
    purpose: MediaUploadPurpose,
  ): Promise<MediaUploadResponse> {
    const result = await api.POST('/medias/upload', {
      params: { query: { purpose } },
      body: { file } as unknown as { file: string },
      bodySerializer: multipartBody,
    });
    const data = expectEnvelope(result).data;
    if (!data?.url) throw new Error('Máy chủ không trả về đường dẫn tệp.');
    return data;
  },

  /** GET /users/me — hồ sơ đầy đủ của người đang đăng nhập. */
  async getMyProfile(): Promise<ProfileResponse | null> {
    return expectEnvelope(await api.GET('/users/me')).data ?? null;
  },
};
