import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const envelope = (data: unknown, status = 200, code = '1000') =>
  new Response(JSON.stringify({ code, message: 'SUCCESS', data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
  };
}

function jwt(claims: object): string {
  const b64 = (v: object) =>
    btoa(JSON.stringify(v))
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${b64({ alg: 'HS256' })}.${b64(claims)}.sig`;
}

const TOKEN = jwt({ userId: 144, role: 'STUDENT', sub: 'a@sis.hust.edu.vn' });
let respond: (path: string) => Response;
const paths: string[] = [];

beforeEach(() => {
  paths.length = 0;
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost/api/v1');
  vi.stubGlobal('localStorage', memoryStorage());
  vi.resetModules();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request | string, init?: RequestInit) => {
      const request =
        typeof input === 'string' ? new Request(input, init) : input;
      const path = new URL(request.url).pathname.replace('/api/v1', '');
      paths.push(path);
      return respond(path);
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function load() {
  const restore = await import('../src/features/auth/restoreSession');
  const { tokenStore } = await import('../src/api/token');
  return { ...restore, tokenStore };
}

describe('giữ đăng nhập khi tải lại trang', () => {
  it('cờ phiên chỉ ghi có/không, không chứa token', async () => {
    const { hasSessionHint, setSessionHint } = await load();
    expect(hasSessionHint()).toBe(false);
    setSessionHint(true);
    expect(hasSessionHint()).toBe(true);
    expect(localStorage.getItem('sqb_api_session')).toBe('1');
    setSessionHint(false);
    expect(hasSessionHint()).toBe(false);
  });

  it('cookie còn hạn: lấy token mới rồi dựng người dùng từ /users/me', async () => {
    respond = (path) =>
      path === '/auth/refresh'
        ? envelope({ access_token: TOKEN, refresh_token: null })
        : envelope({
            user_id: 144,
            email: 'a@sis.hust.edu.vn',
            full_name: 'Nguyễn Tuấn Anh',
            role: 'STUDENT',
            gamification_points: 12,
          });
    const { restoreApiSession, tokenStore } = await load();
    const restored = await restoreApiSession();

    expect(paths).toEqual(['/auth/refresh', '/users/me']);
    expect(tokenStore.get()).toBe(TOKEN);
    expect(restored?.accessToken).toBe(TOKEN);
    expect(restored?.user).toMatchObject({
      id: '144',
      name: 'Nguyễn Tuấn Anh',
      role: 'STUDENT',
      email: 'a@sis.hust.edu.vn',
      points: 12,
    });
  });

  it('không lấy được hồ sơ thì dùng thông tin trong token', async () => {
    respond = (path) =>
      path === '/auth/refresh'
        ? envelope({ access_token: TOKEN })
        : envelope(null, 500, '5000');
    const { restoreApiSession } = await load();
    const restored = await restoreApiSession();
    expect(restored?.user).toMatchObject({
      id: '144',
      role: 'STUDENT',
      email: 'a@sis.hust.edu.vn',
    });
  });

  it('cookie hết hạn / đã đăng xuất: không có phiên, không gọi gì thêm', async () => {
    respond = () => envelope({ 0: { field: 'refreshToken' } }, 400, '1002');
    const { restoreApiSession, tokenStore } = await load();
    expect(await restoreApiSession()).toBeNull();
    expect(tokenStore.get()).toBeNull();
    expect(paths).toEqual(['/auth/refresh']);
  });

  it('tài khoản Admin không dùng giao diện này: huỷ token vừa lấy', async () => {
    const adminToken = jwt({ userId: 1, role: 'ROLE_ADMIN', sub: 'admin' });
    respond = (path) =>
      path === '/auth/refresh'
        ? envelope({ access_token: adminToken })
        : envelope({ user_id: 1, email: 'admin@x', role: 'ADMIN' });
    const { restoreApiSession, tokenStore } = await load();
    expect(await restoreApiSession()).toBeNull();
    expect(tokenStore.get()).toBeNull();
  });
});
