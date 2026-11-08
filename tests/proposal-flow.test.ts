import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const envelope = (
  data: unknown,
  status = 200,
  code = '0000',
  message?: string,
) =>
  new Response(JSON.stringify({ code, message, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Nạp lại module để mỗi test có kho demo / token / client mới. */
async function load(token: string | null) {
  vi.resetModules();
  const { tokenStore } = await import('../src/api/token');
  tokenStore.set(token);
  const { proposalGateway } =
    await import('../src/features/proposals/proposalGateway');
  const store = await import('../src/features/proposals/demoStore');
  const bank = await import('../src/features/proposals/demoBank');
  return { proposalGateway, store, bank };
}

const proposal = (subjectId = 10) => ({
  title: 'Phiên kiểm thử',
  content: 'Mô tả',
  subject_id: subjectId,
  questions: [1, 2].map((n) => ({
    content: `Câu ${n}`,
    media_urls: [],
    options: ['A', 'B', 'C', 'D'].map((key) => ({
      key,
      text: key,
      is_correct: key === 'A',
    })),
    explanation: 'Giải thích',
    llm_generated: n === 2,
    confidence: 4,
  })),
});

describe('phiên demo: sinh viên nộp → giảng viên duyệt → ngân hàng', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('dùng chung một kho cho cả hai vai trò', async () => {
    const { proposalGateway: g, bank } = await load(null);

    await g.proposeSession(proposal());
    const mine = await g.getMySubmissions({ status: 'PENDING' });
    const created = mine.find((s) => s.title === 'Phiên kiểm thử')!;
    expect(created).toMatchObject({ status: 'PENDING', question_counts: 2 });

    // Giảng viên thấy đúng phiên đó trong hàng chờ
    const pending = await g.getPendingSessions();
    expect(pending.some((s) => s.session_id === created.session_id)).toBe(true);

    // Mở phiên để duyệt → REVIEWING; sinh viên không được sửa/xoá nữa
    const detail = await g.getSessionDetailForReview(created.session_id!);
    expect(detail.items).toHaveLength(2);
    expect(detail.items![0].correct_answer).toBe('A');
    expect(
      (await g.getMySubmissions({ status: 'REVIEWING' })).map(
        (s) => s.session_id,
      ),
    ).toContain(created.session_id);
    await expect(g.deleteMySubmission(created.session_id!)).rejects.toThrow(
      /chờ duyệt/,
    );

    // Duyệt hết → phiên tự hoàn tất (theo mô tả Swagger) và câu hỏi vào ngân hàng
    const ids = detail.items!.map((q) => q.question_id!);
    const res = await g.approveQuestions(ids);
    expect(res.points_earned).toBeGreaterThan(0);
    expect(
      (await g.getMySubmissions({ status: 'RESOLVED' })).map(
        (s) => s.session_id,
      ),
    ).toContain(created.session_id);
    const { questions, sessions } = bank.buildDemoBank();
    expect(sessions.some((s) => s.id === `dsess_${created.session_id}`)).toBe(
      true,
    );
    expect(
      questions.filter((q) => q.sessionId === `dsess_${created.session_id}`),
    ).toHaveLength(2);
  });

  it('chốt phiên tự từ chối các câu còn chờ, câu bị từ chối không vào ngân hàng', async () => {
    const { proposalGateway: g, bank } = await load(null);
    await g.proposeSession(proposal());
    const [created] = await g.getMySubmissions({ status: 'PENDING' });
    const detail = await g.getSessionDetailForReview(created.session_id!);
    const [first, second] = detail.items!.map((q) => q.question_id!);

    await g.approveQuestions([first]);
    await g.completeSessionReview(created.session_id!);

    const after = await g.getSessionDetailForReview(created.session_id!);
    expect(after.items!.find((q) => q.question_id === second)!.status).toBe(
      'REJECTED',
    );
    const inBank = bank
      .buildDemoBank()
      .questions.filter((q) => q.sessionId === `dsess_${created.session_id}`);
    expect(inBank.map((q) => q.id)).toEqual([`dq_${first}`]);
  });

  it('từ chối môn chưa tham gia và câu hỏi thiếu đáp án đúng', async () => {
    const { proposalGateway: g } = await load(null);
    await expect(g.proposeSession(proposal(19))).rejects.toThrow(
      /chưa tham gia/,
    );
    const bad = proposal();
    bad.questions[0].options.forEach((o) => (o.is_correct = false));
    await expect(g.proposeSession(bad)).rejects.toThrow(/đáp án đúng/);
  });
});

describe('phiên thật: chỉ gọi API, lỗi được báo đúng', () => {
  const requests: { method: string; path: string; body?: unknown }[] = [];
  let respond: (method: string, url: URL) => Response;

  beforeEach(() => {
    requests.length = 0;
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost/api/v1');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Request) => {
        const url = new URL(input.url);
        const text = await input.text();
        requests.push({
          method: input.method,
          path: `${url.pathname}${url.search}`,
          body: text ? JSON.parse(text) : undefined,
        });
        return respond(input.method, url);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('lấy phiên của tôi theo từng trạng thái, đọc hết các trang và gắn trạng thái', async () => {
    respond = (_m, url) => {
      const status = url.searchParams.get('status');
      const after = url.searchParams.get('after');
      if (status === 'PENDING' && !after) {
        return envelope({
          contents: [{ session_id: 3, created_at: '2026-11-03T00:00:00Z' }],
          pagination: { has_next: true, after: 3 },
        });
      }
      if (status === 'PENDING' && after === '3') {
        return envelope({
          contents: [{ session_id: 1, created_at: '2026-11-01T00:00:00Z' }],
          pagination: { has_next: false },
        });
      }
      if (status === 'RESOLVED') {
        return envelope({
          contents: [{ session_id: 2, created_at: '2026-11-02T00:00:00Z' }],
          pagination: { has_next: false },
        });
      }
      return envelope({ contents: [], pagination: { has_next: false } });
    };
    const { proposalGateway: g } = await load('token');

    const list = await g.getMySubmissions({});
    expect(list.map((s) => [s.session_id, s.status])).toEqual([
      [3, 'PENDING'],
      [2, 'RESOLVED'],
      [1, 'PENDING'],
    ]);
    const queries = requests.map((r) => {
      const url = new URL(r.path, 'http://localhost');
      return `${url.pathname} ${url.searchParams.get('status')} after=${url.searchParams.get('after')} limit=${url.searchParams.get('limit')}`;
    });
    expect(queries.sort()).toEqual([
      '/api/v1/sessions/my-submissions PENDING after=3 limit=50',
      '/api/v1/sessions/my-submissions PENDING after=null limit=50',
      '/api/v1/sessions/my-submissions RESOLVED after=null limit=50',
      '/api/v1/sessions/my-submissions REVIEWING after=null limit=50',
    ]);
  });

  it('nộp phiên lỗi 400: báo nguyên văn lỗi backend, không ghi vào kho demo', async () => {
    respond = () => envelope(null, 400, '1001', 'Tiêu đề quá ngắn');
    const { proposalGateway: g, store } = await load('token');
    const before = store.loadDemoSessions().length;

    await expect(g.proposeSession(proposal())).rejects.toThrow(
      'Tiêu đề quá ngắn',
    );
    expect(requests[0]).toMatchObject({
      method: 'POST',
      path: '/api/v1/sessions/propose',
    });
    expect(requests[0].body).toMatchObject({
      title: 'Phiên kiểm thử',
      subject_id: 10,
    });
    expect(store.loadDemoSessions()).toHaveLength(before);
  });

  it('xoá phiên bị backend từ chối thì ném lỗi (không báo thành công)', async () => {
    respond = () => envelope(null, 400, '1002', 'Phiên đang được duyệt');
    const { proposalGateway: g } = await load('token');
    await expect(g.deleteMySubmission(7)).rejects.toThrow(
      'Phiên đang được duyệt',
    );
    expect(requests[0]).toMatchObject({
      method: 'DELETE',
      path: '/api/v1/sessions/my-submissions/7',
    });
  });

  it('hàng chờ rỗng trả về rỗng — không còn chèn phiên giả', async () => {
    respond = () => envelope({ items: [], pagination: { has_next: false } });
    const { proposalGateway: g } = await load('token');
    expect(await g.getPendingSessions()).toEqual([]);
    expect(await g.getReviewHistory()).toEqual([]);
    expect(requests[0].path).toBe('/api/v1/sessions/pending?limit=50');
  });

  it('duyệt / từ chối / chốt gửi đúng endpoint và lỗi được ném ra', async () => {
    respond = (method, url) =>
      url.pathname.endsWith('/sessions/approve')
        ? envelope(null, 500, '9999', 'Lỗi máy chủ')
        : envelope(null);
    const { proposalGateway: g } = await load('token');

    await expect(g.approveQuestions([11, 12])).rejects.toThrow('Lỗi máy chủ');
    await g.rejectQuestions([13], '  trùng lặp  ');
    await g.completeSessionReview(5);

    expect(requests.map((r) => `${r.method} ${r.path}`)).toEqual([
      'POST /api/v1/sessions/approve',
      'POST /api/v1/sessions/reject',
      'POST /api/v1/sessions/5/complete-review',
    ]);
    expect(requests[0].body).toEqual({ question_ids: [11, 12] });
    expect(requests[1].body).toEqual({
      question_ids: [13],
      reason: 'trùng lặp',
    });
  });

  it('giảng viên lấy môn học từ GET /subjects; 401 báo hết phiên đăng nhập', async () => {
    respond = () =>
      envelope(null, 401, '9998', 'Full authentication is required');
    const { proposalGateway: g } = await load('token');
    await expect(g.getAllSubjects()).rejects.toThrow(/hết hạn/);
    expect(requests[0].path).toBe('/api/v1/subjects');
  });
});
