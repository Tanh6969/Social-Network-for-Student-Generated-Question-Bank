import { useEffect, useState } from 'react';
import { errorMessage } from '../../../api';
import { postsApi, type VideoPostItemDto } from '../../../api/posts';
import { useApp } from '../../demo/context/AppContext';
import { formatPostTime } from '../postUtils';
import { PostListSkeleton } from '../../../shared/components/Skeleton';

export function VideoFeedView() {
  const { sessionKind, posts, openPostById, setActivePostDetail } = useApp();
  const [items, setItems] = useState<VideoPostItemDto[]>([]);
  const [after, setAfter] = useState<number | undefined>();
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionKind !== 'api') return;
    let cancelled = false;
    setLoading(true);
    postsApi.getVideoPosts().then((page) => {
      if (cancelled) return;
      setItems(page.items);
      setAfter(page.after);
      setHasNext(page.hasNext);
    }).catch((cause: unknown) => {
      if (!cancelled) setError(errorMessage(cause, 'Không tải được video bài giảng.'));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sessionKind]);

  const loadMore = async () => {
    if (!hasNext || loading || after === undefined) return;
    setLoading(true);
    try {
      const page = await postsApi.getVideoPosts(undefined, after);
      setItems((previous) => [...previous, ...page.items.filter((item) =>
        !previous.some((old) => old.post_id === item.post_id))]);
      setAfter(page.after);
      setHasNext(page.hasNext);
      setError(null);
    } catch (cause: unknown) {
      setError(errorMessage(cause, 'Không tải thêm được video.'));
    } finally {
      setLoading(false);
    }
  };

  const demoVideos = posts.filter((post) => post.type === 'VIDEO');
  return <main className="mx-auto w-full max-w-3xl space-y-4 px-3 py-5 sm:px-6">
    <h1 className="text-xl font-bold text-fb-text">Video học tập</h1>
    {error && <p role="alert" className="rounded-lg bg-fb-card p-4 text-sm text-fb-danger">{error}</p>}
    {sessionKind === 'api' ? <>
      {items.map((item) => <article key={item.post_id} className="overflow-hidden rounded-lg bg-fb-card shadow-fb-card">
        <div className="p-4"><p className="font-bold text-fb-text">{item.author?.full_name || 'Giảng viên'}</p>
          <p className="text-xs text-fb-text-2">{item.subject_name} · {formatPostTime(item.created_at ?? '')}</p></div>
        {item.media_urls?.filter((media) => media.type === 'VIDEO' && media.url).map((media) =>
          <video key={media.url} src={media.url} controls preload="metadata" playsInline
            className="max-h-[70vh] w-full bg-black object-contain" />)}
        {item.content && <p className="whitespace-pre-wrap p-4 text-sm text-fb-text">{item.content}</p>}
        {item.post_id != null && <button type="button" onClick={() => void openPostById(item.post_id!)}
          className="px-4 pb-4 text-sm font-semibold text-fb-blue">Xem bình luận và bài viết</button>}
      </article>)}
      {!loading && !error && items.length === 0 && <p className="rounded-lg bg-fb-card p-8 text-center text-sm text-fb-text-2">Chưa có video bài giảng.</p>}
      {loading && <PostListSkeleton count={1} />}
      {hasNext && !loading && <button type="button" onClick={() => void loadMore()}
        className="w-full rounded-lg bg-fb-card p-3 text-sm font-semibold text-fb-blue">Xem thêm video</button>}
    </> : <>
      {demoVideos.map((post) => <article key={post.id} className="overflow-hidden rounded-lg bg-fb-card shadow-fb-card">
        <p className="p-4 font-bold text-fb-text">{post.author.name}</p>
        {post.mediaUrls?.map((url) => <video key={url} src={url} controls preload="metadata" playsInline className="max-h-[70vh] w-full bg-black object-contain" />)}
        <p className="p-4 text-sm text-fb-text">{post.content}</p>
        <button type="button" onClick={() => setActivePostDetail(post)} className="px-4 pb-4 text-sm font-semibold text-fb-blue">Xem bài viết</button>
      </article>)}
    </>}
  </main>;
}
