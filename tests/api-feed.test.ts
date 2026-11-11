import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { tokenStore } from '../src/api/token';
import { mapProfileUser } from '../src/features/auth/mapAuthUser';
import type { AuthResponse } from '../src/api/auth';
import type { ProfileResponse } from '../src/api/profile';

let feedApi: typeof import('../src/api/feed').feedApi;
let profileApi: typeof import('../src/api/profile').profileApi;
let fetchHandler: (request: Request) => Promise<Response>;

beforeAll(async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost.test/api/v1');
  vi.stubGlobal(
    'fetch',
    vi.fn((request: Request) => fetchHandler(request)),
  );
  ({ feedApi } = await import('../src/api/feed'));
  ({ profileApi } = await import('../src/api/profile'));
});

afterEach(() => {
  tokenStore.set(null);
});

afterAll(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('real API feed', () => {
  it('uses the bearer token, resolves post events and preserves the server cursor', async () => {
    tokenStore.set('test-token');
    const requested: string[] = [];
    fetchHandler = async (request: Request) => {
      requested.push(request.url);
      expect(request.headers.get('Authorization')).toBe('Bearer test-token');
      if (request.url.includes('/activity-feeds')) {
        return Response.json({
          code: '0000',
          data: {
            items: [
              {
                feed_id: 81,
                target_type: 'POST',
                target_id: 7,
                action_type: 'CREATED_POST',
              },
              {
                feed_id: 80,
                target_type: 'BADGE',
                target_id: 2,
                action_type: 'EARNED_BADGE',
              },
            ],
            pagination: { has_next: true, after: 80 },
          },
        });
      }
      return Response.json({
        code: '0000',
        data: { post_id: 7, content: 'Bài viết thật' },
      });
    };

    const page = await feedApi.getPage(90);
    expect(page.items.map((post) => post.post_id)).toEqual([7]);
    expect(page.nextCursor).toBe(80);
    expect(requested).toHaveLength(2);
    expect(requested[0]).toContain('after=90');
    expect(requested[1]).toContain('/posts/7');
  });

  it('surfaces an authentication error instead of showing demo posts', async () => {
    fetchHandler = async () =>
      Response.json(
        { code: 'TOKEN_INVALID_OR_EXPIRED', message: 'Token hết hạn' },
        { status: 401 },
      );
    await expect(feedApi.getPage()).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining('đăng nhập lại'),
    });
  });
});

describe('real profile mapping', () => {
  const account: AuthResponse = {
    user_id: 12,
    username: 'sinhvien@example.edu',
    role: 'STUDENT',
    access_token: 'test-token',
  };

  it('loads the current profile with the bearer token', async () => {
    tokenStore.set('test-token');
    fetchHandler = async (request: Request) => {
      expect(request.url).toContain('/users/me');
      expect(request.headers.get('Authorization')).toBe('Bearer test-token');
      return Response.json({
        code: '0000',
        data: { user_id: 12, full_name: 'Nguyễn Văn An' },
      });
    };

    await expect(profileApi.getMyProfile()).resolves.toMatchObject({
      user_id: 12,
      full_name: 'Nguyễn Văn An',
    });
  });

  it('uses profile values and rejects another account’s profile', () => {
    const profile: ProfileResponse = {
      user_id: 12,
      full_name: 'Nguyễn Văn An',
      friends_count: 8,
      gamification_points: 42,
    };
    expect(mapProfileUser(account, profile)).toMatchObject({
      id: '12',
      name: 'Nguyễn Văn An',
      friendsCount: 8,
      points: 42,
    });
    expect(() => mapProfileUser(account, { ...profile, user_id: 13 })).toThrow(
      'không khớp',
    );
  });
});
