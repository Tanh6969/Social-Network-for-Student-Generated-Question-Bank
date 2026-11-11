import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStore } from '../src/api/token';

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

let respond: (method: string, url: URL) => Response;
const requests: { method: string; path: string; body: unknown }[] = [];

async function load() {
  const api = await import('../src/api/relationships');
  const rel = await import('../src/features/friends/apiRelationships');
  return { relationshipsApi: api.relationshipsApi, rel };
}

beforeEach(() => {
  requests.length = 0;
  respond = () => envelope(null);
  tokenStore.set('token');
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost/api/v1');
  vi.resetModules();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request) => {
      const url = new URL(input.url);
      const text = await input.text();
      requests.push({
        method: input.method,
        path: url.pathname + url.search,
        body: text ? JSON.parse(text) : null,
      });
      return respond(input.method, url);
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  tokenStore.set(null);
});

describe('quan hệ — phiên thật', () => {
  it('tải bạn bè, lời mời, theo dõi, chặn và đọc hết các trang', async () => {
    respond = (_m, url) => {
      const after = url.searchParams.get('after');
      switch (url.pathname.replace('/api/v1', '')) {
        case '/friendships':
          return after
            ? envelope({
                items: [{ user_id: 2, full_name: 'B' }],
                pagination: { has_next: false },
              })
            : envelope({
                items: [
                  { user_id: 1, full_name: 'A', mutual_friends_count: 3 },
                ],
                pagination: { has_next: true, after: 1 },
              });
        case '/friendships/requests/received':
          return envelope({
            items: [
              {
                requester: { user_id: 3, full_name: 'C' },
                status: 'PENDING',
                mutual_friends_count: 1,
              },
              {
                requester: { user_id: 9, full_name: 'Cũ' },
                status: 'DECLINED',
              },
            ],
          });
        case '/friendships/requests/sent':
          return envelope({
            items: [
              { receiver: { user_id: 4, full_name: 'D' }, status: 'PENDING' },
            ],
          });
        case '/follows/following':
          return envelope({
            items: [{ user_id: 5, full_name: 'E', role: 'LECTURER' }],
          });
        case '/blocks':
          return envelope({
            items: [
              {
                user_id: 6,
                full_name: 'F',
                blocked_at: '2026-11-09T01:00:00Z',
              },
            ],
          });
      }
      return envelope(null, 404, '1012', 'not found');
    };
    const { rel } = await load();
    const snapshot = await rel.loadApiRelationships();
    expect(snapshot.statuses).toEqual({
      '1': 'FRIEND',
      '2': 'FRIEND',
      '3': 'REQUEST_RECEIVED',
      '4': 'REQUEST_SENT',
    });
    expect(snapshot.following).toEqual(['5']);
    expect(snapshot.blocked.map((b) => b.userId)).toEqual(['6']);
    expect(snapshot.mutual).toMatchObject({ '1': 3, '3': 1 });
    expect(snapshot.users.map((u) => u.id).sort()).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
    expect(snapshot.users.find((u) => u.id === '5')?.role).toBe('LECTURER');
    expect(
      requests.filter((r) => r.path.startsWith('/api/v1/friendships?')),
    ).toHaveLength(2);
  });

  it('hồ sơ: trạng thái kết bạn; PENDING không rõ chiều thì giữ trạng thái đã biết', async () => {
    const { rel } = await load();
    const profile = (relationships: object) =>
      ({
        user_id: 25,
        full_name: 'Hiếu',
        role: 'STUDENT',
        relationships,
      }) as never;
    expect(rel.friendStatusFromProfile(profile({ is_friend: true }))).toBe(
      'FRIEND',
    );
    expect(
      rel.friendStatusFromProfile(profile({ friend_request_status: 'NONE' })),
    ).toBe('NONE');
    expect(
      rel.friendStatusFromProfile(
        profile({ friend_request_status: 'PENDING' }),
      ),
    ).toBeNull();
    const user = rel.userFromProfile({
      user_id: 25,
      full_name: 'Đồng Văn Hiếu',
      role: 'STUDENT',
      class_name: 'KHMT 03-K67',
      friends_count: 1,
      gamification_points: 11.5,
    });
    expect(user).toMatchObject({
      id: '25',
      name: 'Đồng Văn Hiếu',
      classOrTitle: 'KHMT 03-K67',
      friendsCount: 1,
      points: 11.5,
    });
  });

  it('các thao tác gửi đúng endpoint và body theo Swagger; lỗi máy chủ được ném ra', async () => {
    const { relationshipsApi } = await load();
    await relationshipsApi.sendFriendRequest(25);
    await relationshipsApi.cancelFriendRequest(25);
    await relationshipsApi.acceptFriendRequest(3);
    await relationshipsApi.declineFriendRequest(3);
    await relationshipsApi.unfriend(1);
    await relationshipsApi.follow(5);
    await relationshipsApi.unfollow(5);
    await relationshipsApi.block(6);
    await relationshipsApi.unblock(6);
    expect(requests.map((r) => `${r.method} ${r.path}`)).toEqual([
      'POST /api/v1/friendships/request',
      'DELETE /api/v1/friendships/requests/sent/25',
      'POST /api/v1/friendships/accept',
      'POST /api/v1/friendships/decline',
      'DELETE /api/v1/friendships/1',
      'POST /api/v1/follows/5',
      'DELETE /api/v1/follows/5',
      'POST /api/v1/blocks/6',
      'DELETE /api/v1/blocks/6',
    ]);
    expect(requests[0].body).toEqual({ addressee_id: 25 });
    expect(requests[2].body).toEqual({ requester_id: 3 });
    expect(requests[3].body).toEqual({ requester_id: 3 });

    respond = () => envelope(null, 400, '1002', 'Đã gửi lời mời trước đó');
    await expect(relationshipsApi.sendFriendRequest(25)).rejects.toThrow(
      'Đã gửi lời mời trước đó',
    );
  });

  it('tìm người dùng: chỉ lấy kết quả USER có id', async () => {
    respond = () =>
      envelope({
        items: [
          {
            type: 'USER',
            user: {
              user_id: 163,
              full_name: 'Nguyễn Mạnh Tiếp',
              major: 'KHMT',
            },
          },
          { type: 'USER', user: {} },
          { type: 'POST', post: { post_id: 1 } },
        ],
      });
    const { relationshipsApi, rel } = await load();
    const users = (await relationshipsApi.searchUsers('Tiếp')).map(
      rel.userFromSearch,
    );
    expect(users).toEqual([
      expect.objectContaining({
        id: '163',
        name: 'Nguyễn Mạnh Tiếp',
        classOrTitle: 'KHMT',
      }),
    ]);
    expect(requests[0].path).toBe(
      '/api/v1/search?query=Ti%E1%BA%BFp&type=USER&limit=20',
    );
  });
});
