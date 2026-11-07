import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStore } from '../src/api/token';
import {
  COMMENT_PAGE_SIZE,
  countQuestionComments,
  getApiQuestionId,
} from '../src/features/bank/questionComments';
import type { Question } from '../src/features/demo/types';

const question = (id: string, extra: Partial<Question> = {}) =>
  ({
    id,
    content: 'Nội dung',
    options: [],
    ratingCount: 7,
    ...extra,
  }) as unknown as Question;

const envelope = (data: unknown) =>
  new Response(JSON.stringify({ code: '0000', data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

describe('question comments source', () => {
  afterEach(() => tokenStore.set(null));

  it('uses the API only for numeric question ids in a signed-in session', () => {
    expect(getApiQuestionId(question('105'))).toBeNull();
    tokenStore.set('token');
    expect(getApiQuestionId(question('105'))).toBe(105);
    expect(getApiQuestionId(question('q_01'))).toBeNull();
  });

  it('counts API questions by ratingCount and demo questions by mock data', () => {
    tokenStore.set('token');
    expect(countQuestionComments(question('105'), 0)).toBe(7);
    expect(countQuestionComments(question('q_01'), 0)).toBe(2);
  });
});

describe('fetchQuestionCommentsPage', () => {
  const requests: string[] = [];

  beforeEach(() => {
    requests.length = 0;
    tokenStore.set('token');
    // Node không có origin của trang: dùng base URL tuyệt đối và nạp lại client.
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost/api/v1');
    vi.resetModules();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Request) => {
        const url = new URL(input.url, 'http://localhost');
        requests.push(`${url.pathname}${url.search}`);
        if (url.pathname.endsWith('/questions/105/ratings')) {
          return envelope({
            items: [
              {
                user_id: 55,
                rating: 4,
                comment: ' Câu hay ',
                created_at: '2026-10-06T11:20:00Z',
              },
              { user_id: 56, rating: 2, comment: '', is_error: true },
              { user_id: 55, rating: 3, comment: 'Lần hai' },
            ],
            pagination: { has_next: true, after: 56 },
          });
        }
        if (url.pathname.endsWith('/users/55')) {
          return envelope({
            user_id: 55,
            full_name: 'Nguyễn Văn A',
            avatar_url: 'a.png',
          });
        }
        return new Response('{}', { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    tokenStore.set(null);
  });

  it('requests one page with cursor, maps ratings and resolves reviewer profiles once', async () => {
    const { fetchQuestionCommentsPage } =
      await import('../src/features/bank/questionComments');
    const page = await fetchQuestionCommentsPage(105, 30);

    expect(requests[0]).toBe(
      `/api/v1/questions/105/ratings?after=30&limit=${COMMENT_PAGE_SIZE}`,
    );
    expect(requests.filter((r) => r === '/api/v1/users/55')).toHaveLength(1);

    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBe(56);
    expect(page.comments.map((c) => c.userName)).toEqual([
      'Nguyễn Văn A',
      'Người dùng #56',
      'Nguyễn Văn A',
    ]);
    expect(page.comments[0]).toMatchObject({
      comment: 'Câu hay',
      rating: 4,
      userAvatar: 'a.png',
    });
    expect(page.comments[0].createdAt).not.toBe('');
    expect(page.comments[1]).toMatchObject({ comment: '', isError: true });
  });
});
