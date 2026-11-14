import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { errorMessage } from '../../../api';
import { searchApi, type SearchResultItemDto, type SearchType } from '../../../api/search';
import { useApp } from '../../demo/context/AppContext';
import { SkeletonRows } from '../../../shared/components/Skeleton';

const FILTERS: { type: SearchType; label: string }[] = [
  { type: 'ALL', label: 'Tất cả' },
  { type: 'USER', label: 'Mọi người' },
  { type: 'POST', label: 'Bài viết' },
  { type: 'QUESTION', label: 'Câu hỏi' },
  { type: 'SESSION', label: 'Bộ câu hỏi' },
  { type: 'SUBJECT', label: 'Môn học' },
];

export function ApiSearchResultsView() {
  const { searchQuery, setViewingUserId, setActiveTab, openPostById } = useApp();
  const navigate = useNavigate();
  const [type, setType] = useState<SearchType>('ALL');
  const [items, setItems] = useState<SearchResultItemDto[]>([]);
  const [after, setAfter] = useState<number | undefined>();
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const query = searchQuery.trim();

  useEffect(() => {
    if (!query) {
      setItems([]);
      setHasNext(false);
      setTotal(0);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchApi.search({ query, type, limit: 20 }).then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setAfter(page.after);
        setHasNext(page.hasNext);
        setTotal(page.totalHits);
      }).catch((cause: unknown) => {
        if (!cancelled) {
          setItems([]);
          setError(errorMessage(cause, 'Không tìm kiếm được.'));
        }
      }).finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, type]);

  const loadMore = async () => {
    if (!hasNext || moreLoading || after === undefined) return;
    setMoreLoading(true);
    try {
      const page = await searchApi.search({ query, type, after, limit: 20 });
      setItems((previous) => [...previous, ...page.items]);
      setAfter(page.after);
      setHasNext(page.hasNext);
    } catch (cause: unknown) {
      setError(errorMessage(cause, 'Không tải thêm được kết quả.'));
    } finally {
      setMoreLoading(false);
    }
  };

  const openUser = (id?: number) => {
    if (id == null) return;
    setViewingUserId(String(id));
    setActiveTab('profile');
  };
  const openSession = (id?: number) => {
    if (id != null) navigate(`/bank?session=${id}`);
  };
  const openSubject = (id?: number) => {
    if (id != null) navigate(`/bank?subject=${id}`);
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 px-3 py-5 sm:px-6">
      <h1 className="text-xl font-bold text-fb-text">Kết quả tìm kiếm</h1>
      <p className="text-sm text-fb-text-2">{query ? `“${query}” · ${total} kết quả` : 'Nhập từ khóa để tìm kiếm.'}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc kết quả">
        {FILTERS.map((filter) => (
          <button key={filter.type} type="button" onClick={() => setType(filter.type)}
            aria-pressed={type === filter.type}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${type === filter.type ? 'bg-fb-blue text-white' : 'bg-fb-card text-fb-text hover:bg-fb-hover'}`}>
            {filter.label}
          </button>
        ))}
      </div>
      {error && <div role="alert" className="rounded-lg bg-fb-card p-4 text-sm text-fb-danger">{error}</div>}
      {loading && <SkeletonRows count={3} label="Đang tìm kiếm…" />}
      {!loading && query && !error && items.length === 0 &&
        <p className="rounded-lg bg-fb-card p-8 text-center text-sm text-fb-text-2">Không tìm thấy kết quả phù hợp.</p>}
      {!loading && items.map((item, index) => {
        const key = `${item.type}-${item.user?.user_id ?? item.post?.post_id ?? item.question?.question_id ?? item.session?.session_id ?? item.subject?.subject_id ?? index}`;
        return <article key={key} className="rounded-lg bg-fb-card p-4 shadow-fb-card text-sm text-fb-text">
          {item.user && <div className="flex items-center gap-3">
            <img src={item.user.avatar_url || '/default-avatar.svg'} alt="" className="h-10 w-10 rounded-full object-cover" />
            <div className="min-w-0 flex-1"><p className="font-bold">{item.user.full_name}</p>
              <p className="text-xs text-fb-text-2">{item.user.student_lecturer_code} · {item.user.school_faculty}</p></div>
            <button type="button" onClick={() => openUser(item.user?.user_id)} className="font-semibold text-fb-blue">Xem hồ sơ</button>
          </div>}
          {item.post && <div className="space-y-2"><p className="font-bold">Bài viết · {item.post.author_name}</p>
            <p className="line-clamp-3 whitespace-pre-wrap">{item.post.content}</p>
            <button type="button" onClick={() => { if (item.post?.post_id != null) void openPostById(item.post.post_id); }} className="font-semibold text-fb-blue">Xem bài viết</button>
          </div>}
          {item.question && <div className="space-y-2"><p className="font-bold">Câu hỏi · {item.question.subject_name}</p>
            <p className="line-clamp-3">{item.question.content}</p>
            {item.question.session_id != null && <button type="button" onClick={() => openSession(item.question?.session_id)} className="font-semibold text-fb-blue">Xem trong bộ câu hỏi</button>}
          </div>}
          {item.session && <div className="space-y-2"><p className="font-bold">{item.session.title}</p>
            <p className="text-fb-text-2">{item.session.subject_name} · {item.session.question_count ?? 0} câu hỏi</p>
            <button type="button" onClick={() => openSession(item.session?.session_id)} className="font-semibold text-fb-blue">Xem bộ câu hỏi</button>
          </div>}
          {item.subject && <div className="space-y-2"><p className="font-bold">{item.subject.subject_name}</p>
            <p className="text-fb-text-2">{item.subject.subject_code}</p>
            <button type="button" onClick={() => openSubject(item.subject?.subject_id)} className="font-semibold text-fb-blue">Xem bộ câu hỏi</button>
          </div>}
        </article>;
      })}
      {hasNext && !loading && <button type="button" disabled={moreLoading} onClick={() => void loadMore()}
        className="w-full rounded-lg bg-fb-card p-3 text-sm font-semibold text-fb-blue disabled:opacity-50">
        {moreLoading ? 'Đang tải…' : 'Xem thêm kết quả'}
      </button>}
    </main>
  );
}
