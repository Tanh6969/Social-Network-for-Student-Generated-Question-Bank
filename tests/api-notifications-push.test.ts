import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStore } from '../src/api/token';

const envelope = (data: unknown) =>
  new Response(JSON.stringify({ code: '1000', message: 'SUCCESS', data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

let respond: (method: string, url: URL) => Response;
const requests: { method: string; path: string; body: unknown }[] = [];

async function load() {
  const notifications = await import('../src/api/notifications');
  const pushSettings = await import('../src/api/pushSettings');
  return {
    notificationsApi: notifications.notificationsApi,
    pushSettingsApi: pushSettings.pushSettingsApi,
  };
}

beforeEach(() => {
  requests.length = 0;
  respond = () => envelope({});
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

describe('notification and push settings APIs', () => {
  it('uses the cursor endpoint and returns the server unread count when marking read', async () => {
    respond = (method) => {
      if (method === 'GET') {
        return envelope({
          items: [{ notification_id: 8, type: 'FRIEND_REQUEST' }],
          pagination: { after: 8, has_next: true },
          unread_count: 3,
        });
      }
      return envelope({
        notification_id: 8,
        read_at: '2026-11-15T09:45:20.684Z',
        unread_count: 2,
        read: true,
      });
    };

    const { notificationsApi } = await load();
    const page = await notificationsApi.list(4);
    const result = await notificationsApi.markRead(8);

    expect(page).toMatchObject({
      items: [{ notification_id: 8 }],
      after: 8,
      hasNext: true,
      unreadCount: 3,
    });
    expect(result).toMatchObject({ unreadCount: 2, read: true });
    expect(requests[0]).toMatchObject({
      method: 'GET',
      path: '/api/v1/notifications?after=4&limit=50',
    });
    expect(requests[1]).toMatchObject({
      method: 'POST',
      path: '/api/v1/notifications/8/read',
    });
  });

  it('gets and updates server-side push settings with the documented fields', async () => {
    let updated: unknown;
    respond = (method) => {
      if (method === 'PUT') {
        updated = requests.at(-1)?.body;
        return envelope({
          push_enabled: true,
          categories: {
            SOCIAL: { enabled: false, description: 'Mạng xã hội' },
          },
          quiet_hours: {
            enabled: true,
            start_time: '22:00',
            end_time: '07:00',
          },
          sound_enabled: false,
          vibration_enabled: true,
        });
      }
      return envelope({
        push_enabled: true,
        categories: {
          SOCIAL: { enabled: true, description: 'Mạng xã hội' },
        },
        quiet_hours: {
          enabled: false,
          start_time: '22:00',
          end_time: '07:00',
        },
        sound_enabled: true,
        vibration_enabled: true,
      });
    };

    const { pushSettingsApi } = await load();
    const current = await pushSettingsApi.get();
    const saved = await pushSettingsApi.update({
      ...current,
      categories: { SOCIAL: { enabled: false, description: 'Mạng xã hội' } },
      sound_enabled: false,
    });

    expect(current.push_enabled).toBe(true);
    expect(saved.sound_enabled).toBe(false);
    expect(updated).toMatchObject({
      push_enabled: true,
      categories: { SOCIAL: { enabled: false } },
      quiet_hours: { start_time: '22:00', end_time: '07:00' },
      sound_enabled: false,
      vibration_enabled: true,
    });
    expect(requests.map(({ method, path }) => [method, path])).toEqual([
      ['GET', '/api/v1/settings/push'],
      ['PUT', '/api/v1/settings/push'],
    ]);
  });
});
