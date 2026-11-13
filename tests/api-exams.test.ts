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

let respond: (method: string, url: URL) => Response | Promise<Response>;
const requests: { method: string; path: string }[] = [];

let token: string | null = null;

// resetModules tạo token store mới, nên gán token sau khi import lại.
async function load() {
  (await import('../src/api/token')).tokenStore.set(token);
  return (await import('../src/api/exams')).examsApi;
}

beforeEach(() => {
  requests.length = 0;
  respond = () => envelope(null);
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost/api/v1');
  vi.resetModules();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request) => {
      const url = new URL(input.url);
      requests.push({
        method: input.method,
        path: url.pathname.replace('/api/v1', '') + url.search,
      });
      return respond(input.method, url);
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  token = null;
});

describe('đề thi — phiên thật không bao giờ dùng mock', () => {
  beforeEach(() => {
    token = 'token';
  });

  it('danh sách rỗng trả về rỗng, không chèn đề mock', async () => {
    respond = () =>
      envelope({ items: [], pagination: { has_next: false, has_prev: false } });
    const examsApi = await load();
    const res = await examsApi.getMyExams({ limit: 10, subject_id: 3 });
    expect(res.items).toEqual([]);
    expect(requests[0].path).toBe('/exams/my-exams?limit=10&subject_id=3');
  });

  it('môn học / lớp rỗng trả về mảng rỗng', async () => {
    respond = () => envelope([]);
    const examsApi = await load();
    expect(await examsApi.getAllSubjects()).toEqual([]);
    expect(await examsApi.getMyCourseClasses()).toEqual([]);
  });

  it('lỗi backend được ném ra với thông điệp của server', async () => {
    respond = () =>
      envelope(null, 400, '4001', 'Ngân hàng câu hỏi không đủ câu APPROVED');
    const examsApi = await load();
    await expect(
      examsApi.generateExam({
        subject_id: 1,
        class_ids: [1],
        title: 'Đề',
        question_count: 40,
      }),
    ).rejects.toThrow('Ngân hàng câu hỏi không đủ câu APPROVED');
  });

  it('lỗi mạng được ném ra, không quay về mock', async () => {
    respond = () => Promise.reject(new TypeError('Failed to fetch'));
    const examsApi = await load();
    await expect(examsApi.getMyExams()).rejects.toThrow();
    await expect(examsApi.getExamDetail(7)).rejects.toThrow();
    await expect(examsApi.exportQuestions({ subject_id: 1 })).rejects.toThrow();
    await expect(
      examsApi.getClassStudents({ course_class_id: 5, class_code: 'L01' }),
    ).rejects.toThrow();
  });

  it('envelope thành công nhưng thiếu data cho chi tiết / export là lỗi', async () => {
    respond = () => envelope(null);
    const examsApi = await load();
    await expect(examsApi.getExamDetail(7)).rejects.toThrow(
      'chi tiết đề thi #7',
    );
    await expect(examsApi.exportExam(7, { format: 'pdf' })).rejects.toThrow(
      'link tải',
    );
  });

  it('trả đúng dữ liệu thật từ server', async () => {
    respond = (_m, url) =>
      url.pathname.endsWith('/exams/9')
        ? envelope({ exam_id: 9, title: 'Giữa kỳ', questions: [] })
        : envelope({ download_url: 'https://files/x.pdf' });
    const examsApi = await load();
    expect((await examsApi.getExamDetail(9)).title).toBe('Giữa kỳ');
    expect((await examsApi.exportExam(9, { format: 'pdf' })).download_url).toBe(
      'https://files/x.pdf',
    );
  });
});

describe('đề thi — phiên demo', () => {
  it('không gọi mạng, dùng dữ liệu demo', async () => {
    const examsApi = await load();
    expect((await examsApi.getAllSubjects()).length).toBeGreaterThan(0);
    expect(requests).toHaveLength(0);
  });
});
