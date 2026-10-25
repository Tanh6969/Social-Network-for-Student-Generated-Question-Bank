export const FEED_PAGE_SIZE = 5;

export interface FeedPage {
  postIds: string[];
  nextCursor: number | null;
}

export function getMockFeedPage(
  orderedPostIds: readonly string[],
  cursor: number,
  pageSize = FEED_PAGE_SIZE,
): FeedPage {
  const postIds = orderedPostIds.slice(cursor, cursor + pageSize);
  const nextCursor = cursor + postIds.length;
  return {
    postIds,
    nextCursor: nextCursor < orderedPostIds.length ? nextCursor : null,
  };
}
