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

  it('chốt phiên: câu chưa chọn bị tính là không chọn; ngân hàng GV chỉ có câu được chọn, luyện tập SV có đủ', async () => {
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
    // Ngân hàng đề của giảng viên: chỉ câu được chọn
    const lecturerBank = g
      .listBankQuestions(10)!
      .filter((q) => q.session_id === created.session_id);
    expect(lecturerBank.map((q) => q.question_id)).toEqual([first]);
    // Luyện tập của sinh viên: đủ cả 2 câu, cùng một trạng thái → không lộ câu nào được chọn
    const practice = bank
      .buildDemoBank()
      .questions.filter((q) => q.sessionId === `dsess_${created.session_id}`);
    expect(practice.map((q) => q.id).sort()).toEqual(
      [`dq_${first}`, `dq_${second}`].sort(),
    );
    expect(new Set(practice.map((q) => q.status)).size).toBe(1);
  });

  it('giỏ câu hỏi: chọn câu từ nhiều bộ khác nhau trong một lần', async () => {
    const { proposalGateway: g } = await load(null);
    await g.proposeSession(proposal());
    await g.proposeSession({ ...proposal(11), title: 'Bộ thứ hai' });
    const mine = await g.getMySubmissions({ status: 'PENDING' });
    const [a, b] = await Promise.all(
      mine.slice(0, 2).map((s) => g.getSessionDetailForReview(s.session_id!)),
    );
    const picked = [a.items![0].question_id!, b.items![1].question_id!];

    await g.approveQuestions(picked);

    const bankIds = g.listBankQuestions()!.map((q) => q.question_id);
    expect(bankIds).toEqual(expect.arrayContaining(picked));
    expect(bankIds).not.toContain(a.items![1].question_id);
  });

  it('luyện tập: chỉ bộ đã xem xét xong, ẩn đáp án tới khi trả lời, không lộ trạng thái/nguồn gốc', async () => {
    vi.resetModules();
    const { tokenStore } = await import('../src/api/token');
    tokenStore.set(null);
    const { practiceGateway: p } =
      await import('../src/features/proposals/practiceGateway');
    const { proposalGateway: g } =
      await import('../src/features/proposals/proposalGateway');

    // Bộ của người khác chưa xem xét xong → không luyện được, không hiện trên hồ sơ
    const pendingOther = (await g.getPendingSessions()).find(
      (s) => s.author?.full_name === 'Lê Thị Thuỳ Dung',
    )!;
    await expect(
      p.getSessionQuestions(pendingOther.session_id!),
    ).rejects.toThrow(/xem xét xong/);
    const dungSets = await p.getUserSessions(
      { id: 'user_sv_02', name: 'Lê Thị Thuỳ Dung' },
      false,
    );
    expect(dungSets!.map((s) => s.session_id)).not.toContain(
      pendingOther.session_id,
    );

    // Bộ đã xem xét xong của chính mình: luyện được
    const resolved = (await g.getMySubmissions({ status: 'RESOLVED' }))[0];
    const set = await p.getSessionQuestions(resolved.session_id!);
    const q = set.questions![0];
    expect(q.options!.every((o) => o.is_correct === undefined)).toBe(true);
    expect(q.hidden_fields).toBeUndefined();
    expect(Object.keys(q)).not.toContain('status');
    expect(Object.keys(q)).not.toContain('source');

    const result = await p.answer(q.question_id!, 'B');
    expect(result).toMatchObject({ is_correct: false, correct_answer: 'A' });
    await expect(p.answer(q.question_id!, 'A')).rejects.toThrow(/đã trả lời/);
    const reopened = await p.getSessionQuestions(resolved.session_id!);
    expect(reopened.questions![0].hidden_fields?.correct_answer).toBe('A');

    // Báo lỗi (Game 5): is_error ⇒ điểm 0
    const rated = await p.rate(q.question_id!, {
      rating: 4,
      is_error: true,
      comment: 'Sai đáp án',
    });
    expect(rated.new_avg_rating).toBe(0);
  });

  it('AI tinh chỉnh: áp dụng thì ghi đè câu hỏi, loại bỏ thì giữ nguyên', async () => {
    const { proposalGateway: g } = await load(null);
    const [session] = await g.getPendingSessions();
    const detail = await g.getSessionDetailForReview(session.session_id!);
    const qid = detail.items![0].question_id!;
    const original = detail.items![0].explanation;

    const discarded = await g.aiRefine(qid, 'Viết lại lời giải chi tiết');
    expect(discarded.suggested_question?.explanation).not.toBe(original);
    await g.aiApply(qid, discarded.edit_log_id!, false);
    const unchanged = await g.getSessionDetailForReview(session.session_id!);
    expect(unchanged.items![0].explanation).toBe(original);

    const applied = await g.aiRefine(qid, 'Viết lại lời giải chi tiết');
    const res = await g.aiApply(qid, applied.edit_log_id!, true);
    expect(res.status).toBe('APPLIED');
    const changed = await g.getSessionDetailForReview(session.session_id!);
    expect(changed.items![0].explanation).toBe(
      applied.suggested_question!.explanation,
    );
    await expect(g.aiApply(qid, applied.edit_log_id!, true)).rejects.toThrow();
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

  it('luyện tập & AI tinh chỉnh gửi đúng endpoint và body theo Swagger', async () => {
    respond = (_m, url) => {
      if (url.pathname.endsWith('/users/42/sessions')) {
        return envelope({
          contents: [{ session_id: 9 }],
          pagination: { has_next: false },
        });
      }
      if (url.pathname.endsWith('/ai-refine')) {
        return envelope({ edit_log_id: 77, suggested_question: {} });
      }
      return envelope({});
    };
    vi.resetModules();
    const { tokenStore } = await import('../src/api/token');
    tokenStore.set('token');
    const { practiceGateway: p } =
      await import('../src/features/proposals/practiceGateway');
    const { proposalGateway: g } =
      await import('../src/features/proposals/proposalGateway');

    // Người dùng mẫu (id chữ) không có trên hệ thống thật → không gọi API
    expect(
      await p.getUserSessions({ id: 'user_sv_02', name: 'X' }, false),
    ).toBeNull();
    expect(requests).toHaveLength(0);

    expect(
      (await p.getUserSessions({ id: '42', name: 'Y' }, false))!.map(
        (s) => s.session_id,
      ),
    ).toEqual([9]);
    await p.getSessionQuestions(9);
    await p.answer(5, 'C', '2026-11-01T00:00:00Z');
    await p.rate(5, { rating: 0, is_error: true, comment: 'Sai' });
    await g.aiRefine(5, 'Làm rõ đề');
    await g.aiApply(5, 77, true);
    expect(g.listBankQuestions(10)).toBeNull();

    expect(
      requests.map(
        (r) => `${r.method} ${new URL(r.path, 'http://x').pathname}`,
      ),
    ).toEqual([
      'GET /api/v1/users/42/sessions',
      'GET /api/v1/sessions/9/questions',
      'POST /api/v1/questions/5/answer',
      'POST /api/v1/questions/5/rate',
      'POST /api/v1/questions/5/ai-refine',
      'POST /api/v1/questions/5/ai-apply',
    ]);
    expect(requests[2].body).toEqual({
      selected_options: ['C'],
      question_updated_at: '2026-11-01T00:00:00Z',
    });
    expect(requests[3].body).toEqual({
      rating: 0,
      is_error: true,
      comment: 'Sai',
    });
    expect(requests[4].body).toEqual({ prompt: 'Làm rõ đề' });
    expect(requests[5].body).toEqual({ edit_log_id: 77, approve: true });
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
