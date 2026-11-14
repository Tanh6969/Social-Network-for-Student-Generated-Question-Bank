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

interface Sent {
  method: string;
  path: string;
  auth: string | null;
  body: string;
  credentials: RequestCredentials;
}

let respond: (sent: Sent) => Response | Promise<Response>;
const sent: Sent[] = [];

/** JWT giả chỉ để đọc claim exp (không cần chữ ký). */
function jwt(expSeconds: number): string {
  const b64 = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${b64({ alg: 'HS256' })}.${b64({ exp: expSeconds })}.sig`;
}

async function load(token: string | null = 'old') {
  const tokenModule = await import('../src/api/token');
  const client = await import('../src/api/client');
  tokenModule.tokenStore.set(token);
  return {
    ...client,
    tokenStore: tokenModule.tokenStore,
    tokenExpiresAt: tokenModule.tokenExpiresAt,
  };
}

beforeEach(() => {
  sent.length = 0;
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost/api/v1');
  vi.resetModules();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request | string, init?: RequestInit) => {
      const request =
        typeof input === 'string' ? new Request(input, init) : input;
      const url = new URL(request.url);
      const item: Sent = {
        method: request.method,
        path: url.pathname.replace('/api/v1', ''),
        auth: request.headers.get('Authorization'),
        body: await request.text(),
        credentials: init?.credentials ?? request.credentials,
      };
      sent.push(item);
      return respond(item);
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

/** Backend giả: token "old" hết hạn, refresh cấp "new". */
function backend(refreshOk = true) {
  return (s: Sent) => {
    if (s.path === '/auth/refresh') {
      return refreshOk
        ? envelope({ access_token: 'new', refresh_token: null })
        : envelope({ 0: { field: 'refreshToken' } }, 400, '1002', 'Thiếu');
    }
    if (s.auth !== 'Bearer new') {
      return envelope(null, 401, '9998', 'Full authentication is required');
    }
    return envelope([{ subject_id: 1, code: 'IT', name: 'Web' }]);
  };
}

describe('làm mới access token (refresh token nằm trong cookie HttpOnly)', () => {
  it('token hết hạn: gọi /auth/refresh không body, rồi gửi lại yêu cầu', async () => {
    respond = backend();
    const { api, expectEnvelope, tokenStore } = await load();
    const data = expectEnvelope(await api.GET('/subjects')).data;

    expect(data).toEqual([{ subject_id: 1, code: 'IT', name: 'Web' }]);
    expect(tokenStore.get()).toBe('new');
    expect(sent.map((s) => `${s.method} ${s.path} ${s.auth}`)).toEqual([
      'GET /subjects Bearer old',
      'POST /auth/refresh null',
      'GET /subjects Bearer new',
    ]);
    const refresh = sent[1];
    expect(refresh.body).toBe('');
    expect(refresh.credentials).toBe('include');
  });

  it('gửi lại đúng body của yêu cầu POST (vd. nộp câu trả lời)', async () => {
    respond = (s) =>
      s.path === '/auth/refresh'
        ? envelope({ access_token: 'new' })
        : s.auth === 'Bearer new'
          ? envelope({ is_correct: true })
          : envelope(null, 401, '9998', 'expired');
    const { api, expectEnvelope } = await load();
    const res = await api.POST('/questions/{questionId}/answer', {
      params: { path: { questionId: 7 } },
      body: { selected_options: ['A'] },
    });

    expect(expectEnvelope(res).data).toEqual({ is_correct: true });
    expect(sent[2].body).toBe(sent[0].body);
    expect(JSON.parse(sent[2].body)).toEqual({ selected_options: ['A'] });
  });

  it('nhiều yêu cầu hết hạn cùng lúc chỉ làm mới một lần', async () => {
    respond = backend();
    const { api } = await load();
    await Promise.all([
      api.GET('/subjects'),
      api.GET('/subjects'),
      api.GET('/subjects'),
    ]);
    expect(sent.filter((s) => s.path === '/auth/refresh')).toHaveLength(1);
  });

  it('cookie hết hạn: báo phiên hết hạn như cũ, không lặp vô hạn', async () => {
    respond = backend(false);
    const { api, expectEnvelope, tokenStore } = await load();
    const res = await api.GET('/subjects');
    expect(() => expectEnvelope(res)).toThrow('Phiên đăng nhập đã hết hạn');
    expect(tokenStore.get()).toBe('old');
    expect(sent).toHaveLength(2);
  });

  it('đã đăng xuất trong lúc chờ làm mới thì không đăng nhập ngầm', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    respond = async (s) => {
      if (s.path === '/auth/refresh') {
        await gate;
        return envelope({ access_token: 'new' });
      }
      return envelope(null, 401, '9998', 'expired');
    };
    const { refreshAccessToken, tokenStore } = await load();
    const pending = refreshAccessToken();
    tokenStore.set(null);
    release();
    expect(await pending).toBeNull();
    expect(tokenStore.get()).toBeNull();
  });

  it('không làm mới cho yêu cầu /auth/* và phiên demo (không token)', async () => {
    respond = () => envelope(null, 401, '9998', 'expired');
    const { api } = await load(null);
    await api.GET('/subjects');
    await api.POST('/auth/logout', { headers: { Authorization: 'Bearer x' } });
    expect(sent.some((s) => s.path === '/auth/refresh')).toBe(false);
  });

  it('đọc exp từ JWT', async () => {
    const { tokenExpiresAt } = await load(null);
    expect(tokenExpiresAt(jwt(1_800_000_000))).toBe(1_800_000_000_000);
    expect(tokenExpiresAt('not-a-jwt')).toBeNull();
  });

  it('làm mới chủ động 1 phút trước khi token 15 phút hết hạn', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-13T10:00:00Z'));
    respond = backend();
    const now = Math.floor(Date.now() / 1000);
    const { tokenStore } = await load(jwt(now + 15 * 60));

    await vi.advanceTimersByTimeAsync(13 * 60 * 1000);
    expect(sent.filter((s) => s.path === '/auth/refresh')).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(61 * 1000);
    expect(sent.filter((s) => s.path === '/auth/refresh')).toHaveLength(1);
    expect(tokenStore.get()).toBe('new');
  });
});
