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

async function load(token: string | null) {
  vi.resetModules();
  const { tokenStore } = await import('../src/api/token');
  tokenStore.set(token);
  const { gamesGateway } = await import('../src/features/games/gamesGateway');
  const { proposalGateway } =
    await import('../src/features/proposals/proposalGateway');
  const { practiceGateway } =
    await import('../src/features/proposals/practiceGateway');
  return {
    games: gamesGateway,
    proposals: proposalGateway,
    practice: practiceGateway,
  };
}

describe('trò chơi — phiên demo', () => {
  it('điểm danh mỗi ngày một lần và tăng chuỗi ngày', async () => {
    const { games } = await load(null);
    const before = await games.getCheckInStatus();
    expect(before.has_checked_in_today).toBe(false);
    const res = await games.checkIn();
    expect(res.current_streak).toBe((before.current_streak ?? 0) + 1);
    expect((await games.getCheckInStatus()).has_checked_in_today).toBe(true);
    await expect(games.checkIn()).rejects.toThrow(/đã điểm danh/);
  });

  it('Game 1: dự đoán theo lớp, mỗi lớp mỗi ngày một lần', async () => {
    const { games } = await load(null);
    const [cls] = await games.getGame1Classes();
    await games.predictParticipants(cls.course_class_id!, 5);
    const after = await games.getGame1Classes();
    expect(after[0]).toMatchObject({
      already_predicted: true,
      predicted_count: 5,
    });
    await expect(
      games.predictParticipants(cls.course_class_id!, 6),
    ).rejects.toThrow(/hôm nay/);
    await expect(games.predictParticipants(999, 3)).rejects.toThrow(
      /không thuộc lớp/,
    );
  });

  it('Game 2: chỉ cho bộ của mình chưa xem xét xong, không vượt số câu AI / tự làm', async () => {
    const { games, proposals } = await load(null);
    await proposals.proposeSession({
      title: 'Bộ Game 2',
      subject_id: 10,
      questions: [true, false, false].map((llm, i) => ({
        content: `Câu ${i}`,
        options: [
          { key: 'A', text: 'a', is_correct: true },
          { key: 'B', text: 'b', is_correct: false },
        ],
        llm_generated: llm,
      })),
    });
    const [mine] = await proposals.getMySubmissions({ status: 'PENDING' });
    await expect(
      games.predictApprovedQuestions(mine.session_id!, 2, 0),
    ).rejects.toThrow(/vượt quá/);
    const p = await games.predictApprovedQuestions(mine.session_id!, 1, 2);
    expect(p).toMatchObject({
      game_type: 'GAME_2_APPROVED_QUESTIONS',
      target_id: mine.session_id,
      status: 'PENDING',
    });
    await expect(
      games.predictApprovedQuestions(mine.session_id!, 0, 1),
    ).rejects.toThrow(/đã dự đoán/);

    const [resolved] = await proposals.getMySubmissions({ status: 'RESOLVED' });
    await expect(
      games.predictApprovedQuestions(resolved.session_id!, 0, 0),
    ).rejects.toThrow(/xem xét xong/);
  });

  it('Game 4: mỗi môn đã tham gia chỉ một lần; Game 6: 7 câu, nộp một lần, không lộ đáp án AI', async () => {
    const { games } = await load(null);
    await games.predictBankSize(10, 300);
    await expect(games.predictBankSize(10, 320)).rejects.toThrow(/một lần/);
    await expect(games.predictBankSize(19, 100)).rejects.toThrow(
      /chưa tham gia/,
    );

    const session = (await games.getGame6ActiveSession())!;
    expect(session.questions).toHaveLength(7);
    expect(session.questions!.every((q) => !('ai' in q))).toBe(true);
    await games.submitGame6(session.session_id!, [
      session.questions![1].question_id!,
    ]);
    await expect(games.submitGame6(session.session_id!, [])).rejects.toThrow(
      /một lần/,
    );
    const history = await games.getMyPredictions();
    expect(history[0].game_type).toBe('GAME_6_LLM_IDENTIFICATION');
  });

  it('Game 5: sinh viên báo lỗi khi luyện tập → giảng viên thấy và thẩm định một lần', async () => {
    const { games, proposals, practice } = await load(null);
    const [resolved] = await proposals.getMySubmissions({ status: 'RESOLVED' });
    const set = await practice.getSessionQuestions(resolved.session_id!);
    const qid = set.questions![0].question_id!;
    await practice.rate(qid, {
      rating: 0,
      is_error: true,
      comment: 'Đáp án sai',
    });

    const reports = await games.getErrorReports();
    const mine = reports.find((r) => r.question_id === qid)!;
    expect(mine).toMatchObject({ comment: 'Đáp án sai' });
    await games.reviewError(qid, mine.rating_user_id, true, 'Đúng là sai');
    const after = (await games.getErrorReports(qid))[0];
    expect(after.review).toMatchObject({ is_confirmed: true });
    await expect(
      games.reviewError(qid, mine.rating_user_id, false),
    ).rejects.toThrow(/đã được thẩm định/);
  });
});

describe('trò chơi — phiên thật gọi đúng Swagger', () => {
  const requests: {
    method: string;
    path: string;
    query: string;
    body?: unknown;
  }[] = [];
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
          path: url.pathname.replace('/api/v1', ''),
          query: url.search,
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

  it('gửi đúng endpoint và body cho từng trò chơi', async () => {
    respond = () => envelope({});
    const { games } = await load('token');
    await games.checkIn();
    await games.getLeaderboard({
      period: 'SUBJECT',
      subject_id: 10,
      limit: 50,
    });
    await games.predictParticipants(101, 5);
    await games.predictApprovedQuestions(12, 3, 5);
    await games.predictBankSize(10, 250);
    await games.submitGame6(3, [105, 107]);
    await games.reviewError(7, 55, true, ' Thiếu dữ kiện ');

    expect(requests.map((r) => `${r.method} ${r.path}`)).toEqual([
      'POST /games/check-in',
      'GET /games/leaderboard',
      'POST /games/prediction/participants',
      'POST /games/prediction/approved-questions',
      'POST /games/prediction/bank-size',
      'POST /games/prediction/submit',
      'POST /questions/7/ratings/55/review-error',
    ]);
    const q = new URLSearchParams(requests[1].query);
    expect([q.get('period'), q.get('subject_id')]).toEqual(['SUBJECT', '10']);
    expect(requests[2].body).toEqual({
      course_class_id: 101,
      predicted_count: 5,
    });
    expect(requests[3].body).toEqual({
      session_id: 12,
      predicted_llm_count: 3,
      predicted_human_count: 5,
    });
    expect(requests[4].body).toEqual({
      subject_id: 10,
      predicted_bank_size: 250,
    });
    expect(requests[5].body).toEqual({
      minigame_session_id: 3,
      selected_llm_question_ids: [105, 107],
    });
    // Swagger đặt tên trường sai chính tả "is_comfirmed" — FE phải gửi đúng như vậy.
    expect(requests[6].body).toEqual({
      is_comfirmed: true,
      notes: 'Thiếu dữ kiện',
    });
  });

  it('Game 6 ngoài giờ (404) → không có phiên; lỗi khác vẫn báo', async () => {
    respond = () => envelope(null, 404, '4004', 'Không có phiên');
    const { games } = await load('token');
    expect(await games.getGame6ActiveSession()).toBeNull();
    respond = () => envelope(null, 500, '9999', 'Lỗi máy chủ');
    await expect(games.getGame6ActiveSession()).rejects.toThrow('Lỗi máy chủ');
  });

  it('lịch sử dự đoán đọc hết các trang; báo lỗi lọc is_error và lấy tên người báo', async () => {
    respond = (_m, url) => {
      if (url.pathname.endsWith('/games/my-predictions')) {
        return url.searchParams.get('after')
          ? envelope({
              contents: [{ prediction_id: 2 }],
              pagination: { has_next: false },
            })
          : envelope({
              contents: [{ prediction_id: 1 }],
              pagination: { has_next: true, after: 1 },
            });
      }
      if (url.pathname.endsWith('/questions/7/ratings')) {
        return envelope({
          items: [
            { user_id: 55, rating: 0, is_error: true, comment: 'Sai đáp án' },
            { user_id: 56, rating: 4, is_error: false },
          ],
          pagination: { has_next: false },
        });
      }
      if (url.pathname.endsWith('/users/55'))
        return envelope({ full_name: 'Nguyễn Văn A' });
      return envelope({});
    };
    const { games } = await load('token');
    expect(
      (await games.getMyPredictions()).map((p) => p.prediction_id),
    ).toEqual([1, 2]);
    expect(await games.getErrorReports()).toEqual([]); // phiên thật phải tra theo ID câu hỏi
    const reports = await games.getErrorReports(7);
    expect(reports).toEqual([
      expect.objectContaining({
        rating_user_id: 55,
        reporter_name: 'Nguyễn Văn A',
        comment: 'Sai đáp án',
      }),
    ]);
  });
});
