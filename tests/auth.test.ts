import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadAuthWithResponse(status: number, payload: unknown) {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/api/v1');
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
  const requests: Request[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (request: Request) => {
      requests.push(request);
      return Response.json(payload, { status });
    }),
  );
  const { authApi } = await import('../src/api/auth');
  return { authApi, requests };
}

describe('Swagger auth requests', () => {
  it('sends the required login fields and accepts the response envelope', async () => {
    const { authApi, requests } = await loadAuthWithResponse(200, {
      code: '0000',
      message: 'Thành công',
      data: {
        user_id: 101,
        username: 'student@example.edu',
        role: 'STUDENT',
        access_token: 'jwt',
      },
    });
    const account = await authApi.login(' student@example.edu ', 'secret');

    expect(account.access_token).toBe('jwt');
    expect(requests).toHaveLength(1);
    expect(new URL(requests[0].url).pathname).toBe('/api/v1/auth/login');
    expect(requests[0].method).toBe('POST');
    expect(await requests[0].json()).toMatchObject({
      email: 'student@example.edu',
      password: 'secret',
      platform: 'WEB',
      device_id: expect.stringMatching(/^web-/),
    });
    expect(requests[0].headers.has('Authorization')).toBe(false);
  });

  it('sends logout with Bearer token and no request body', async () => {
    const { authApi, requests } = await loadAuthWithResponse(200, {
      code: '0000',
      message: 'Thành công',
      data: null,
    });
    await authApi.logout('jwt');

    expect(new URL(requests[0].url).pathname).toBe('/api/v1/auth/logout');
    expect(requests[0].headers.get('Authorization')).toBe('Bearer jwt');
    expect(await requests[0].text()).toBe('');
  });

  it('surfaces backend auth failures instead of entering the app', async () => {
    const { authApi } = await loadAuthWithResponse(400, {
      code: 'INCORRECT_IDENTIFIER',
      message: 'Sai tài khoản hoặc mật khẩu',
      data: null,
    });
    await expect(
      authApi.login('student@example.edu', 'wrong'),
    ).rejects.toMatchObject({
      status: 400,
      code: 'INCORRECT_IDENTIFIER',
    });
  });
});
