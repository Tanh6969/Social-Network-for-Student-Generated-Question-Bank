import type { Post } from '../demo/types';

export type SharedFeedMessage =
  { type: 'REQUEST_SNAPSHOT' } | { type: 'UPDATE_SNAPSHOT'; posts: Post[] };

export function isSharedFeedMessage(
  value: unknown,
): value is SharedFeedMessage {
  if (typeof value !== 'object' || value === null || !('type' in value))
    return false;
  const message = value as { type?: unknown; posts?: unknown };
  if (message.type === 'REQUEST_SNAPSHOT') return true;
  return message.type === 'UPDATE_SNAPSHOT' && isPostSnapshot(message.posts);
}

export function isPostSnapshot(value: unknown): value is Post[] {
  return (
    Array.isArray(value) &&
    value.every(
      (post) =>
        typeof post === 'object' &&
        post !== null &&
        'id' in post &&
        typeof post.id === 'string' &&
        'author' in post &&
        typeof post.author === 'object' &&
        post.author !== null &&
        'id' in post.author &&
        typeof post.author.id === 'string' &&
        'content' in post &&
        typeof post.content === 'string' &&
        'privacy' in post &&
        (post.privacy === 'PUBLIC' ||
          post.privacy === 'FRIENDS' ||
          post.privacy === 'ONLY_ME'),
    )
  );
}

export function arePostSnapshotsEqual(first: Post[], second: Post[]): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}
