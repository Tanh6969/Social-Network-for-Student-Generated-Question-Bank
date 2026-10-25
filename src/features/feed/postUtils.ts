import type { CommentItem, Post } from '../demo/types';

export const MAX_POST_WORDS = 500;
export const MAX_POST_CHARACTERS = 5_000;
export const MAX_POST_WORD_CHARACTERS = 64;

export type PostContentIssue = 'words' | 'characters' | 'wordLength';

export function countCharacters(value: string): number {
  return Array.from(value).length;
}

export function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

export function getPostContentIssue(value: string): PostContentIssue | null {
  if (countWords(value) > MAX_POST_WORDS) return 'words';
  if (
    [...value.matchAll(/\S+/gu)].some(
      ([word]) => countCharacters(word) > MAX_POST_WORD_CHARACTERS,
    )
  )
    return 'wordLength';
  if (countCharacters(value) > MAX_POST_CHARACTERS) return 'characters';
  return null;
}

export function limitPostContent(value: string): {
  content: string;
  issue: PostContentIssue | null;
} {
  const tokenLimited = value.replace(/\S+/gu, (word) =>
    Array.from(word).slice(0, MAX_POST_WORD_CHARACTERS).join(''),
  );
  return {
    content: Array.from(tokenLimited).slice(0, MAX_POST_CHARACTERS).join(''),
    issue: getPostContentIssue(value),
  };
}

export function formatPostTime(value: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - time) / 60_000));
  if (elapsedMinutes < 1) return 'Vừa xong';
  if (elapsedMinutes < 60) return `${elapsedMinutes} phút trước`;
  if (elapsedMinutes < 1_440)
    return `${Math.floor(elapsedMinutes / 60)} giờ trước`;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(time);
}

export function sortFeedPosts(
  posts: Post[],
  currentUserId: string,
  friendIds: ReadonlySet<string>,
): Post[] {
  return [...posts].sort((a, b) => {
    const aPriority =
      a.author.id === currentUserId || friendIds.has(a.author.id) ? 0 : 1;
    const bPriority =
      b.author.id === currentUserId || friendIds.has(b.author.id) ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    const timeDifference = Date.parse(b.createdAt) - Date.parse(a.createdAt);
    return timeDifference || a.id.localeCompare(b.id);
  });
}

export function appendComment(
  posts: Post[],
  postId: string,
  comment: CommentItem,
  parentCommentId?: string,
): Post[] {
  return posts.map((post) => {
    if (post.id !== postId) return post;
    const comments = post.comments ?? [];
    if (
      parentCommentId &&
      !comments.some((item) => item.id === parentCommentId)
    ) {
      return post;
    }
    const nextComments = parentCommentId
      ? comments.map((item) =>
          item.id === parentCommentId
            ? { ...item, replies: [...(item.replies ?? []), comment] }
            : item,
        )
      : [...comments, comment];
    return {
      ...post,
      comments: nextComments,
      commentsCount: post.commentsCount + 1,
    };
  });
}

export function findPostComment(
  post: Post,
  commentId: string,
): CommentItem | undefined {
  for (const comment of post.comments ?? []) {
    if (comment.id === commentId) return comment;
    const reply = comment.replies?.find((item) => item.id === commentId);
    if (reply) return reply;
  }
  return undefined;
}

export function updateOwnedComment(
  posts: Post[],
  postId: string,
  commentId: string,
  ownerId: string,
  content: string,
): Post[] {
  const trimmed = content.trim();
  if (!trimmed) return posts;
  return posts.map((post) => {
    if (post.id !== postId || !findPostComment(post, commentId)) return post;
    let changed = false;
    const comments = (post.comments ?? []).map((comment) => {
      if (comment.id === commentId && comment.author.id === ownerId) {
        changed = true;
        return { ...comment, content: trimmed };
      }
      let replyChanged = false;
      const replies = comment.replies?.map((reply) => {
        if (reply.id !== commentId || reply.author.id !== ownerId) return reply;
        changed = true;
        replyChanged = true;
        return { ...reply, content: trimmed };
      });
      return replyChanged ? { ...comment, replies } : comment;
    });
    return changed ? { ...post, comments } : post;
  });
}

export function removeOwnedComment(
  posts: Post[],
  postId: string,
  commentId: string,
  ownerId: string,
): Post[] {
  return posts.map((post) => {
    if (post.id !== postId || !post.comments?.length) return post;
    const root = post.comments.find((comment) => comment.id === commentId);
    if (root) {
      if (root.author.id !== ownerId) return post;
      return {
        ...post,
        comments: post.comments.filter((comment) => comment.id !== commentId),
        commentsCount: Math.max(
          0,
          post.commentsCount - 1 - (root.replies?.length ?? 0),
        ),
      };
    }
    const parent = post.comments.find((comment) =>
      comment.replies?.some(
        (reply) => reply.id === commentId && reply.author.id === ownerId,
      ),
    );
    if (!parent) return post;
    return {
      ...post,
      comments: post.comments.map((comment) =>
        comment.id === parent.id
          ? {
              ...comment,
              replies: comment.replies?.filter(
                (reply) => reply.id !== commentId,
              ),
            }
          : comment,
      ),
      commentsCount: Math.max(0, post.commentsCount - 1),
    };
  });
}

export function updateOwnedPost(
  posts: Post[],
  postId: string,
  ownerId: string,
  updates: Pick<
    Post,
    'content' | 'privacy' | 'mediaUrls' | 'documents' | 'type'
  >,
): Post[] {
  return posts.map((post) =>
    post.id === postId && post.author.id === ownerId
      ? { ...post, ...updates }
      : post,
  );
}

export function removeOwnedPost(
  posts: Post[],
  postId: string,
  ownerId: string,
): Post[] {
  return posts.filter(
    (post) => post.id !== postId || post.author.id !== ownerId,
  );
}
