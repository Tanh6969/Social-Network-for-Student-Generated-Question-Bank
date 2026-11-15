/**
 * Chuyển dữ liệu bài viết / bảng tin / bình luận của backend sang mô hình
 * giao diện (Post, CommentItem) và tải bảng tin cho phiên đăng nhập thật.
 */
import {
  postsApi,
  type ActivityFeedItemDto,
  type CommentResponseDto,
  type MediaItem,
  type PostResponseDto,
} from '../../api/posts';
import type { CommentItem, Post, PostDocument, User } from '../demo/types';
import { searchApi } from '../../api/search';

type ApiAuthor = PostResponseDto['author'];

const DEFAULT_AVATAR = '/default-avatar.svg';
const DEFAULT_COVER = '/default-cover.svg';

/** Tác giả từ backend → User tối thiểu; chính mình thì dùng currentUser. */
export function userFromAuthor(author: ApiAuthor, currentUser: User): User {
  const id = author?.user_id != null ? String(author.user_id) : 'unknown';
  if (id === currentUser.id) return currentUser;
  return {
    id,
    name: author?.full_name || `Người dùng #${author?.user_id ?? '?'}`,
    role: 'STUDENT',
    email: '',
    avatar: author?.avatar_url || DEFAULT_AVATAR,
    frameUrl: author?.frame_url || undefined,
    coverImage: DEFAULT_COVER,
    bio: '',
    faculty: '',
    classOrTitle: '',
    points: 0,
    approvedQuestionsCount: 0,
    friendsCount: 0,
    followersCount: 0,
    isOnline: false,
  };
}

function splitMedia(media: MediaItem[] | undefined) {
  const items = media ?? [];
  const visual = items.filter((m) => m.url && m.type !== 'DOCUMENT');
  const documents: PostDocument[] = items
    .filter((m) => m.url && m.type === 'DOCUMENT')
    .map((m) => ({
      name: m.name || m.url!.split('/').pop() || 'Tài liệu',
      url: m.url!,
      size: m.size ?? 0,
      mimeType: '',
    }));
  return {
    mediaUrls: visual.map((m) => m.url!),
    hasVideo: visual.some((m) => m.type === 'VIDEO'),
    documents,
  };
}

export function postFromApi(dto: PostResponseDto, currentUser: User): Post {
  const { mediaUrls, hasVideo, documents } = splitMedia(dto.media_urls);
  return {
    id: String(dto.post_id),
    author: userFromAuthor(dto.author, currentUser),
    type:
      dto.post_type === 'QUESTION_APPROVED_NOTIFICATION'
        ? 'QUESTION_APPROVED'
        : dto.post_type === 'LEARNING_VIDEO' || hasVideo
          ? 'VIDEO'
          : 'KNOWLEDGE',
    content: dto.content ?? '',
    subjectTag: dto.subject_name || undefined,
    subjectId: dto.subject_id,
    mediaUrls: mediaUrls.length ? mediaUrls : undefined,
    documents: documents.length ? documents : undefined,
    likesCount: dto.react_count ?? 0,
    isLiked: Boolean(dto.reacted_by_me ?? dto.my_reaction),
    commentsCount: dto.comment_count ?? 0,
    sharesCount: 0,
    privacy: dto.visibility ?? 'PUBLIC',
    createdAt: dto.created_at ?? new Date().toISOString(),
    lecturerNote: dto.lecturer_note
      ? {
          lecturerName: dto.noted_lecturer?.full_name || 'Giảng viên',
          avatar: dto.noted_lecturer?.avatar_url || DEFAULT_AVATAR,
          note: dto.lecturer_note,
          createdAt: dto.lecturer_note_added_at ?? '',
        }
      : undefined,
    apiTarget:
      dto.post_id != null ? { type: 'POST', id: dto.post_id } : undefined,
    apiMedia: dto.media_urls ?? [],
  };
}

/** Thẻ hoạt động không phải bài viết (huy hiệu, phiên đề xuất được duyệt…). */
export function activityToPost(
  item: ActivityFeedItemDto,
  currentUser: User,
): Post {
  const content = (item.content ?? {}) as Record<string, unknown>;
  const text = (key: string) =>
    typeof content[key] === 'string' ? (content[key] as string) : '';
  const number = (key: string) =>
    typeof content[key] === 'number' ? (content[key] as number) : 0;
  const body = [text('title'), text('description')].filter(Boolean).join('\n');
  const isSession = item.target_type === 'SESSION' && item.target_id != null;
  return {
    id: `feed-${item.feed_id}`,
    author: userFromAuthor(item.actor, currentUser),
    type:
      item.action_type === 'SESSION_RESOLVED_APPROVED'
        ? 'QUESTION_APPROVED'
        : 'KNOWLEDGE',
    content: body || 'Hoạt động mới',
    subjectTag: text('subject_name') || undefined,
    likesCount: number('react_count'),
    isLiked: Boolean(content.reacted_by_me ?? content.my_reaction),
    commentsCount: number('comment_count'),
    sharesCount: 0,
    privacy: 'PUBLIC',
    createdAt: item.created_at ?? new Date().toISOString(),
    // Huy hiệu không có id lượt nhận (BADGE_AWARD) nên chỉ tương tác cục bộ.
    apiTarget: isSession ? { type: 'SESSION', id: item.target_id! } : undefined,
    isActivity: true,
  };
}

export function commentFromApi(
  dto: CommentResponseDto,
  currentUser: User,
): CommentItem {
  return {
    id: String(dto.comment_id),
    author: userFromAuthor(dto.author, currentUser),
    content: dto.deleted ? 'Bình luận đã bị xoá.' : (dto.content ?? ''),
    deleted: Boolean(dto.deleted),
    createdAt: dto.created_at ?? '',
    likesCount: 0,
    isLiked: false,
    replies: dto.replies?.map((reply) => commentFromApi(reply, currentUser)),
  };
}

/** Số bài công khai mới nhất của mọi người gộp vào bảng tin. */
export const PUBLIC_POSTS_LIMIT = 30;

/**
 * Bài của mọi người (không chỉ bạn bè): GET /activity-feeds chỉ có bạn bè /
 * người đang theo dõi, còn GET /search?type=POST với từ khoá trống trả về bài
 * công khai của tất cả (đã kiểm tra trên backend thật 2026-11-14). Chỉ lấy id:
 * số đếm trong chỉ mục tìm kiếm không cập nhật, và GET /posts/{id} còn kiểm
 * tra quyền xem. Lỗi tìm kiếm không làm hỏng bảng tin.
 */
async function loadPublicPostIds(): Promise<number[]> {
  try {
    const page = await searchApi.search({ type: 'POST', limit: 50 });
    return page.items
      .map((item) => item.post)
      .filter((p): p is NonNullable<typeof p> => p?.post_id != null)
      .sort(
        (a, b) =>
          Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? ''),
      )
      .slice(0, PUBLIC_POSTS_LIMIT)
      .map((p) => p.post_id!);
  } catch {
    return [];
  }
}

/**
 * Bảng tin phiên thật: dòng hoạt động + bài công khai của mọi người + bài
 * của chính mình (gồm cả bài
 * "Chỉ mình tôi" không xuất hiện trong dòng hoạt động). Hoạt động đăng bài
 * được tải chi tiết qua GET /posts/{id}; bài đã xoá/không xem được bị bỏ qua.
 */
export async function loadApiFeed(currentUser: User): Promise<Post[]> {
  const [feed, mine, publicIds] = await Promise.all([
    postsApi.getActivityFeed(),
    postsApi.getMyPosts(),
    loadPublicPostIds(),
  ]);
  const posts = new Map<string, Post>();
  for (const dto of mine.items) {
    if (dto.post_id != null)
      posts.set(String(dto.post_id), postFromApi(dto, currentUser));
  }
  const postIds = [
    ...feed.items
      .filter((item) => item.target_type === 'POST' && item.target_id != null)
      .map((item) => item.target_id!),
    ...publicIds,
  ].filter((id) => !posts.has(String(id)));
  const details = await Promise.allSettled(
    [...new Set(postIds)].map((id) => postsApi.getPost(id)),
  );
  for (const result of details) {
    if (result.status === 'fulfilled' && result.value?.post_id != null)
      posts.set(
        String(result.value.post_id),
        postFromApi(result.value, currentUser),
      );
  }
  for (const item of feed.items) {
    if (item.target_type === 'POST') continue;
    const post = activityToPost(item, currentUser);
    posts.set(post.id, post);
  }
  return [...posts.values()];
}

export interface ApiFeedCursor {
  activity: { after?: number; hasNext: boolean };
  mine: { after?: number; hasNext: boolean };
  public: { after?: number; hasNext: boolean };
  videos: { after?: number; hasNext: boolean };
}

export const initialApiFeedCursor: ApiFeedCursor = {
  activity: { hasNext: true },
  mine: { hasNext: true },
  public: { hasNext: true },
  videos: { hasNext: true },
};

/** Nạp thêm bài viết và video theo cursor của backend. */
export async function loadApiFeedPage(currentUser: User, cursor: ApiFeedCursor) {
  const [activity, mine, publicPage, videos] = await Promise.all([
    cursor.activity.hasNext ? postsApi.getActivityFeed(cursor.activity.after, 10)
      : Promise.resolve({ items: [], hasNext: false, after: undefined }),
    cursor.mine.hasNext ? postsApi.getMyPosts(cursor.mine.after, 10)
      : Promise.resolve({ items: [], hasNext: false, after: undefined }),
    cursor.public.hasNext ? searchApi.search({ type: 'POST', after: cursor.public.after, limit: 10 })
      .catch(() => ({ items: [], hasNext: false, after: undefined, totalHits: 0 }))
      : Promise.resolve({ items: [], hasNext: false, after: undefined, totalHits: 0 }),
    cursor.videos.hasNext ? postsApi.getVideoPosts(undefined, cursor.videos.after)
      .catch(() => ({ items: [], hasNext: false, after: undefined }))
      : Promise.resolve({ items: [], hasNext: false, after: undefined }),
  ]);

  const result = new Map<string, Post>();
  for (const dto of mine.items) {
    if (dto.post_id != null) result.set(String(dto.post_id), postFromApi(dto, currentUser));
  }
  const ids = [
    ...activity.items.filter((item) => item.target_type === 'POST' && item.target_id != null)
      .map((item) => item.target_id!),
    ...publicPage.items.map((item) => item.post?.post_id).filter((id): id is number => id != null),
    ...videos.items.map((item) => item.post_id).filter((id): id is number => id != null),
  ].filter((id) => !result.has(String(id)));
  const details = await Promise.allSettled([...new Set(ids)].map((id) => postsApi.getPost(id)));
  for (const detail of details) {
    if (detail.status === 'fulfilled' && detail.value?.post_id != null)
      result.set(String(detail.value.post_id), postFromApi(detail.value, currentUser));
  }
  for (const item of activity.items) {
    if (item.target_type === 'POST') continue;
    const post = activityToPost(item, currentUser);
    result.set(post.id, post);
  }
  const next = (page: { hasNext: boolean; after?: number }) => ({
    after: page.after,
    hasNext: page.hasNext && page.after != null,
  });
  return {
    posts: [...result.values()],
    cursor: { activity: next(activity), mine: next(mine), public: next(publicPage), videos: next(videos) },
  };
}

/**
 * Chuẩn bị media_urls cho POST/PUT /posts: tệp mới (blob URL có File tương
 * ứng) được tải lên trước; media cũ giữ nguyên MediaItem gốc từ backend.
 */
export async function buildMediaItems(
  mediaUrls: string[],
  documents: PostDocument[],
  files: ReadonlyMap<string, File>,
  existing: MediaItem[] = [],
  isVideo = false,
): Promise<MediaItem[]> {
  const fromExisting = (url: string): MediaItem =>
    existing.find((item) => item.url === url) ?? {
      url,
      type: isVideo ? 'VIDEO' : 'IMAGE',
    };
  const upload = async (file: File, purpose: 'POST' | 'DOCUMENT') => {
    const res = await postsApi.uploadMedia(file, purpose);
    const item: MediaItem = {
      key: res.object_key,
      url: res.url,
      type: res.media_type ?? (purpose === 'DOCUMENT' ? 'DOCUMENT' : 'IMAGE'),
      size: res.file_size ?? file.size,
      width: res.width,
      height: res.height,
      name: file.name,
    };
    return item;
  };
  const visual = await Promise.all(
    mediaUrls.map((url) => {
      const file = files.get(url);
      return file ? upload(file, 'POST') : Promise.resolve(fromExisting(url));
    }),
  );
  const docs = await Promise.all(
    documents.map((doc) => {
      const file = files.get(doc.url);
      return file
        ? upload(file, 'DOCUMENT')
        : Promise.resolve<MediaItem>(
            existing.find((item) => item.url === doc.url) ?? {
              url: doc.url,
              type: 'DOCUMENT',
              name: doc.name,
              size: doc.size,
            },
          );
    }),
  );
  return [...visual, ...docs];
}
