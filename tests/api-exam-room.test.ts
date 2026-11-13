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

let respond: (url: URL, body: unknown) => Response;
const requests: { path: string; body: unknown }[] = [];

const question = (id: number, extra: Record<string, unknown> = {}) => ({
  question_id: id,
  content: `Câu ${id}`,
  options: [
    { key: 'A', text: 'a', is_correct: null },
    { key: 'B', text: 'b', is_correct: null },
  ],
  source: 'LLM',
  updated_at: '2026-11-05T19:00:03Z',
  rating_count: 3,
  my_interaction: { answered: false, rated: false },
  hidden_fields: {},
  ...extra,
});

const session = {
  session_id: 53,
  session_code: 'S53',
  title: 'Chương 1',
  content: 'HTTP',
  subject_name: 'Công nghệ Web',
  subject_code: 'IT4409',
  questions: [
    question(1),
    question(2, {
      my_interaction: { answered: true, rated: true, my_rating: 3 },
      hidden_fields: { correct_answer: 'B', explanation: 'vì B' },
    }),
  ],
};

async function load() {
  (await import('../src/api/token')).tokenStore.set('token');
  return import('../src/features/bank/apiExamRoom');
}

beforeEach(() => {
  requests.length = 0;
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost/api/v1');
  vi.resetModules();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request) => {
      const url = new URL(input.url);
      const text = await input.text();
      const body = text ? JSON.parse(text) : null;
      requests.push({ path: url.pathname.replace('/api/v1', ''), body });
      return respond(url, body);
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('phòng thi — dữ liệu thật', () => {
  it('chuyển bộ câu hỏi sang đề, không lộ đáp án câu chưa làm', async () => {
    const { examSetFromSession } = await load();
    const exam = examSetFromSession(session);
    expect(exam).toMatchObject({
      id: '53',
      title: 'Chương 1',
      courseCode: 'IT4409',
      subject: 'Công nghệ Web',
    });
    expect(exam.questions.map((q) => q.id)).toEqual(['1', '2']);
    expect(exam.questions[0].correctAnswer).toBe('');
    expect(exam.questions[0].options.map((o) => o.id)).toEqual(['A', 'B']);
    // Câu đã làm từ trước: máy chủ đã trả đáp án + đánh giá của mình
    expect(exam.questions[1]).toMatchObject({
      correctAnswer: 'B',
      explanation: 'vì B',
      userRatedStars: 3,
    });
    // Không mang nguồn câu hỏi (AI/người) sang giao diện
    expect(JSON.stringify(exam)).not.toContain('LLM');
  });

  it('nộp bài gửi POST /answer cho từng câu đã chọn và trả đáp án máy chủ', async () => {
    respond = (url) =>
      url.pathname.endsWith('/questions/1/answer')
        ? envelope({ is_correct: false, correct_answer: 'B', explanation: 'x' })
        : envelope(null, 500, '5000', 'lỗi');
    const { submitAnswersToApi } = await load();
    const outcome = await submitAnswersToApi(session.questions, { '1': 'A' });

    expect(requests).toEqual([
      {
        path: '/questions/1/answer',
        body: {
          selected_options: ['A'],
          question_updated_at: '2026-11-05T19:00:03Z',
        },
      },
    ]);
    expect(outcome.failed).toBe(0);
    expect(outcome.results['1']).toEqual({
      correctAnswer: 'B',
      explanation: 'x',
      isCorrect: false,
    });
    // Câu 2 không chọn lần này nhưng đã làm trước → vẫn xem được đáp án
    expect(outcome.results['2']).toMatchObject({ correctAnswer: 'B' });
  });

  it('máy chủ từ chối câu đã làm trước thì dùng đáp án đã có', async () => {
    respond = () => envelope(null, 400, '4000', 'Đã trả lời');
    const { submitAnswersToApi } = await load();
    const outcome = await submitAnswersToApi(session.questions, { '2': 'B' });
    expect(outcome.failed).toBe(0);
    expect(outcome.results['2']).toMatchObject({
      correctAnswer: 'B',
      isCorrect: true,
    });
  });

  it('không chấm được câu nào thì báo lỗi thật', async () => {
    respond = () => envelope(null, 400, '4000', 'Câu hỏi đã thay đổi');
    const { submitAnswersToApi } = await load();
    await expect(
      submitAnswersToApi(session.questions, { '1': 'A' }),
    ).rejects.toThrow('Câu hỏi đã thay đổi');
  });

  it('một phần lỗi: trả kết quả câu được chấm và đếm số câu lỗi', async () => {
    const twoNew = [question(1), question(3)];
    respond = (url) =>
      url.pathname.endsWith('/questions/1/answer')
        ? envelope({ is_correct: true, correct_answer: 'A' })
        : envelope(null, 400, '4000', 'Hỏng');
    const { submitAnswersToApi } = await load();
    const outcome = await submitAnswersToApi(twoNew, { '1': 'A', '3': 'B' });
    expect(outcome.failed).toBe(1);
    expect(outcome.firstError).toBe('Hỏng');
    expect(outcome.results['1']).toMatchObject({ isCorrect: true });
    expect(outcome.results['3']).toBeUndefined();
  });
});
