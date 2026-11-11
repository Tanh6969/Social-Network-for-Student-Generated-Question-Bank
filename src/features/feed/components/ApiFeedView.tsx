import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { feedApi, type PostResponse } from '../../../api/feed';
import { useApp } from '../../demo/context/AppContext';
import {
  MediaLightbox,
  type LightboxItem,
} from '../../../shared/components/MediaLightbox';
import { formatPostTime } from '../postUtils';
import { PostContent } from './PostContent';
import { PostDocuments } from './PostDocuments';
import { PostMediaGallery } from './PostMediaGallery';

export function ApiFeedView() {
  const { currentUser } = useApp();
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestingNextPage = useRef(false);
  const feed = useInfiniteQuery({
    queryKey: ['api-feed', currentUser.id],
    initialPageParam: undefined as number | undefined,
    queryFn: ({ pageParam }) => feedApi.getPage(pageParam),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  const detail = useQuery({
    queryKey: ['api-post', selectedPostId],
    queryFn: () => feedApi.getPost(selectedPostId!),
    enabled: selectedPostId !== null,
  });
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const onScroll = () => {
      if (window.scrollY <= 0 || requestingNextPage.current) return;
      const sentinel = sentinelRef.current;
      if (
        sentinel &&
        sentinel.getBoundingClientRect().top <= window.innerHeight + 100
      ) {
        requestingNextPage.current = true;
        void fetchNextPage().finally(() => {
          requestingNextPage.current = false;
        });
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = [
    ...new Map(
      (feed.data?.pages.flatMap((page) => page.items) ?? []).map((post) => [
        post.post_id,
        post,
      ]),
    ).values(),
  ];

  return (
    <main className="mx-auto w-full max-w-[760px] space-y-4 px-3 py-4 sm:px-4">
      <h1 className="text-xl font-bold text-fb-text">Bảng tin</h1>
      {feed.isPending && <FeedStatus>Đang tải bài viết...</FeedStatus>}
      {feed.isError && (
        <FeedStatus>
          <p>Không tải được bảng tin: {feed.error.message}</p>
          <button
            type="button"
            onClick={() => void feed.refetch()}
            className="mt-2 font-semibold text-fb-blue hover:underline"
          >
            Thử lại
          </button>
        </FeedStatus>
      )}
      {feed.isSuccess && posts.length === 0 && !feed.hasNextPage && (
        <FeedStatus>Chưa có bài viết để hiển thị.</FeedStatus>
      )}
      {posts.map((post) => (
        <ApiPostCard
          key={post.post_id}
          post={post}
          onDetail={() => setSelectedPostId(post.post_id ?? null)}
        />
      ))}
      <div ref={sentinelRef} />
      {feed.isFetchingNextPage && (
        <FeedStatus>Đang tải thêm bài viết...</FeedStatus>
      )}
      {feed.isFetchNextPageError && (
        <FeedStatus>Không tải được trang tiếp theo. Hãy thử lại.</FeedStatus>
      )}
      {feed.hasNextPage && !feed.isFetchingNextPage && (
        <button
          type="button"
          onClick={() => void feed.fetchNextPage()}
          className="w-full rounded-lg border border-fb-divider bg-fb-card py-2 text-sm font-semibold text-fb-blue hover:bg-fb-hover"
        >
          Tải thêm bài viết
        </button>
      )}
      {selectedPostId !== null && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedPostId(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết bài viết"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-fb-card p-4 shadow-xl"
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPostId(null)}
                aria-label="Đóng chi tiết bài viết"
                className="rounded-full p-2 text-fb-text-2 hover:bg-fb-hover"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {detail.isPending && (
              <p className="py-8 text-center text-sm text-fb-text-2">
                Đang tải bài viết...
              </p>
            )}
            {detail.isError && (
              <p
                role="alert"
                className="py-8 text-center text-sm text-fb-danger"
              >
                {detail.error.message}
              </p>
            )}
            {detail.data && <ApiPostCard post={detail.data} />}
          </div>
        </div>
      )}
    </main>
  );
}

function FeedStatus({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-fb-divider bg-fb-card p-6 text-center text-sm text-fb-text-2">
      {children}
    </div>
  );
}

function ApiPostCard({
  post,
  onDetail,
}: {
  post: PostResponse;
  onDetail?: () => void;
}) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const media = (post.media_urls ?? []).filter((item) => Boolean(item.url));
  const images = media.filter((item) => item.type === 'IMAGE');
  const videos = media.filter((item) => item.type === 'VIDEO');
  const lightboxItems: LightboxItem[] = [...images, ...videos].map(
    (item, index) => ({
      src: item.url!,
      kind: item.type === 'VIDEO' ? 'video' : 'image',
      alt: `Media bài viết ${index + 1}`,
    }),
  );
  const documents = media
    .filter((item) => item.type === 'DOCUMENT')
    .map((item) => ({
      name: item.name || 'Tài liệu',
      url: item.url!,
      size: item.size || 0,
      mimeType: '',
    }));

  return (
    <article className="space-y-3 rounded-lg border border-fb-divider bg-fb-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <img
          src={post.author?.avatar_url || '/default-avatar.svg'}
          alt=""
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-fb-text">
            {post.author?.full_name || 'Người dùng'}
          </p>
          <p className="text-xs text-fb-text-2">
            {post.created_at ? formatPostTime(post.created_at) : ''}
          </p>
        </div>
      </div>
      {post.content && (
        <PostContent content={post.content} compact={Boolean(onDetail)} />
      )}
      {images.length > 0 && (
        <PostMediaGallery
          urls={images.map((item) => item.url!)}
          onOpen={setPreviewIndex}
        />
      )}
      {videos.map((item, index) => (
        <PostMediaGallery
          key={item.key || item.url}
          urls={[item.url!]}
          isVideo
          onOpen={() => setPreviewIndex(images.length + index)}
        />
      ))}
      <PostDocuments documents={documents} />
      <div className="flex gap-4 border-t border-fb-divider pt-2 text-xs text-fb-text-2">
        {(post.react_count ?? 0) > 0 && (
          <span>{post.react_count} lượt thích</span>
        )}
        {(post.comment_count ?? 0) > 0 && (
          <span>{post.comment_count} bình luận</span>
        )}
        {onDetail && (
          <button
            type="button"
            onClick={onDetail}
            className="ml-auto font-semibold text-fb-blue hover:underline"
          >
            Xem chi tiết
          </button>
        )}
      </div>
      {previewIndex !== null && (
        <MediaLightbox
          items={lightboxItems}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </article>
  );
}
