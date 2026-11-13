import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const envelope = (
  data: unknown,
  status = 200,
  code = '1000',
  message = 'SUCCESS',
) =>
  new Response(JSON.stringify({ code, message, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

let respond: (url: URL) => Response;
const requests: string[] = [];

const session = (id: number, extra: Record<string, unknown> = {}) => ({
  type: 'SESSION',
  relevance_score: 1,
  session: {
    session_id: id,
    title: `Bộ ${id}`,
    subject_id: 2,
    subject_name: 'Công nghệ Web',
    status: 'RESOLVED',
    question_count: 4,
    react_count: 1,
    comment_count: 2,
    created_at: '2026-10-30T09:01:22Z',
    ...extra,
  },
});

async function load() {
  (await import('../src/api/token')).tokenStore.set('token');
  return import('../src/features/bank/bankGateway');
}

beforeEach(() => {
  requests.length = 0;
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost/api/v1');
  vi.resetModules();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request) => {
      const url = new URL(input.url);
      requests.push(url.pathname.replace('/api/v1', '') + url.search);
      return respond(url);
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('/bank — kho bộ câu hỏi từ GET /search', () => {
  it('đọc hết các trang theo offset, bỏ trùng, gọi với từ khoá trống', async () => {
    respond = (url) => {
      const after = url.searchParams.get('after');
      if (!after)
        return envelope({
          items: [session(1), session(2)],
          pagination: { after: 2, has_next: true },
          total_hits: 3,
        });
      return envelope({
        items: [session(2), session(3)],
        pagination: { after: null, has_next: false },
        total_hits: 3,
      });
    };
    const { bankGateway } = await load();
    const sets = await bankGateway.loadSets();

    expect(sets.map((s) => s.sessionId)).toEqual([1, 2, 3]);
    expect(requests).toEqual([
      '/search?type=SESSION&limit=50',
      '/search?type=SESSION&after=2&limit=50',
    ]);
  });

  it('không đưa trạng thái duyệt ra giao diện', async () => {
    const { bankSetFromSearch } = await load();
    const set = bankSetFromSearch(session(9).session);
    expect(set).not.toBeNull();
    expect(set).not.toHaveProperty('status');
    expect(JSON.stringify(set)).not.toContain('RESOLVED');
    expect(set).toMatchObject({
      sessionId: 9,
      subjectName: 'Công nghệ Web',
      indexedQuestionCount: 4,
    });
    // Số đếm của chỉ mục tìm kiếm không đáng tin → không mang sang
    expect(set).not.toHaveProperty('commentCount');
    expect(set).not.toHaveProperty('reactCount');
  });

  it('điền giá trị mặc định khi thiếu tiêu đề / môn, bỏ mục không có id', async () => {
    const { bankSetFromSearch } = await load();
    expect(bankSetFromSearch({ title: 'x' })).toBeNull();
    expect(bankSetFromSearch({ session_id: 5, title: '  ' })).toMatchObject({
      title: 'Bộ câu hỏi #5',
      subjectName: 'Chưa rõ môn học',
      indexedQuestionCount: 0,
    });
  });

  it('lỗi backend được ném ra, không có dữ liệu mẫu', async () => {
    respond = () => envelope(null, 401, '9998', 'Full authentication');
    const { bankGateway } = await load();
    await expect(bankGateway.loadSets()).rejects.toThrow(
      'Phiên đăng nhập đã hết hạn',
    );
  });
});

describe('/bank — thống kê sống từ GET /sessions/{id}/questions', () => {
  const q = (id: number, extra: Record<string, unknown>) => ({
    question_id: id,
    rating_count: 0,
    comment_count: 0,
    my_interaction: { answered: false, rated: false },
    ...extra,
  });

  it('cộng đánh giá, bình luận và tiến độ của mình', async () => {
    const { statsFromSession, progressOf } = await load();
    const stats = statsFromSession({
      questions: [
        q(1, {
          rating_count: 1,
          comment_count: 1,
          my_interaction: { answered: true, rated: true },
        }),
        q(2, {
          comment_count: 3,
          my_interaction: { answered: true, rated: false },
        }),
        q(3, {}),
      ],
    });
    expect(stats).toEqual({
      questionCount: 3,
      ratingCount: 1,
      commentCount: 4,
      answeredCount: 2,
      ratedCount: 1,
    });
    expect(progressOf(stats)).toBe('IN_PROGRESS');
    expect(progressOf({ ...stats, answeredCount: 0 })).toBe('NOT_STARTED');
    expect(progressOf({ ...stats, answeredCount: 3 })).toBe('DONE');
  });

  it('tải thống kê từng bộ, bộ lỗi không làm hỏng bộ khác', async () => {
    respond = (url) =>
      url.pathname.endsWith('/sessions/2/questions')
        ? envelope(null, 500, '5000', 'lỗi')
        : envelope({ questions: [q(1, { comment_count: 2 })] });
    const { bankGateway } = await load();
    const ok: Record<number, number> = {};
    const failed: number[] = [];
    await bankGateway.loadAllStats(
      [1, 2, 3],
      (id, s) => (ok[id] = s.commentCount),
      (id) => failed.push(id),
    );
    expect(ok).toEqual({ 1: 2, 3: 2 });
    expect(failed).toEqual([2]);
  });
});
