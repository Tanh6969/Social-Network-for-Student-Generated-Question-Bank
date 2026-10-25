import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import type { Post } from '../demo/types';
import { FEED_PAGE_SIZE, getMockFeedPage } from './feedPagination';

const MOCK_PAGE_DELAY_MS = 450;

export function useFeedPages(
  orderedPosts: Post[],
  sentinelRef: RefObject<HTMLDivElement | null>,
) {
  const [pageCount, setPageCount] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const fetchRequested = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleCount = pageCount * FEED_PAGE_SIZE;
  const visiblePosts = orderedPosts.slice(0, visibleCount);
  const hasMore = visibleCount < orderedPosts.length;

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  const loadMore = useCallback(() => {
    if (fetchRequested.current || !hasMore) return;
    fetchRequested.current = true;
    setIsLoadingMore(true);
    timerRef.current = setTimeout(() => {
      const nextPage = getMockFeedPage(
        orderedPosts.map((post) => post.id),
        visibleCount,
      );
      if (nextPage.postIds.length) setPageCount((count) => count + 1);
      setIsLoadingMore(false);
      fetchRequested.current = false;
      timerRef.current = null;
    }, MOCK_PAGE_DELAY_MS);
  }, [hasMore, orderedPosts, visibleCount]);

  useEffect(() => {
    if (!hasMore) return;
    const onScroll = () => {
      if (window.scrollY <= 0) return;
      const sentinel = sentinelRef.current;
      if (
        sentinel &&
        sentinel.getBoundingClientRect().top <= window.innerHeight + 100
      )
        loadMore();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasMore, loadMore, sentinelRef]);

  return { visiblePosts, hasMore, isLoadingMore, loadMore };
}
