import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStore } from '../src/api/token';

const envelope = (data: unknown) =>
  new Response(JSON.stringify({ code: '1000', message: 'SUCCESS', data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const requests: { method: string; path: string; body: unknown }[] = [];

beforeEach(() => {
  requests.length = 0;
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

      if (url.pathname.endsWith('/buy')) {
        return envelope({ cosmetic_id: 8, name: 'Bong Bóng Chat Thần Sấm', owned: true });
      }
      if (url.pathname.endsWith('/equip')) {
        return envelope({
          cosmetic_id: 5,
          type: 'AVATAR_FRAME',
          profile_updated: { avatar_frame_url: 'https://example.com/frame.png' },
        });
      }
      if (url.pathname.endsWith('/unequip')) {
        return envelope({
          slot: 'AVATAR_FRAME',
          profile_updated: { avatar_frame_url: null },
        });
      }
      return envelope({
        items: [],
        inventory: [],
        summary: { total_unlocked: 12, collection_completion_percent: 35.5 },
      });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  tokenStore.set(null);
});

describe('cosmetics API', () => {
  it('passes shop and inventory filters and pagination to their endpoints', async () => {
    const { cosmeticsApi } = await import('../src/api/cosmetics');

    await cosmeticsApi.getShop({
      type: 'CHAT_BUBBLE',
      sort_by: 'PRICE_ASC',
      after: 12,
    });
    await cosmeticsApi.getInventory({
      type: 'AVATAR_FRAME',
      rarity: 'EPIC',
      only_unlocked: true,
      after: 9,
      limit: 50,
    });

    expect(requests[0].method).toBe('GET');
    expect(Object.fromEntries(new URLSearchParams(requests[0].path.split('?')[1]))).toEqual({
      after: '12',
      type: 'CHAT_BUBBLE',
      sort_by: 'PRICE_ASC',
      limit: '20',
    });
    expect(requests[1].method).toBe('GET');
    expect(Object.fromEntries(new URLSearchParams(requests[1].path.split('?')[1]))).toEqual({
      after: '9',
      type: 'AVATAR_FRAME',
      rarity: 'EPIC',
      only_unlocked: 'true',
      limit: '50',
    });
  });

  it('returns action response data and sends the expected request payloads', async () => {
    const { cosmeticsApi } = await import('../src/api/cosmetics');

    const bought = await cosmeticsApi.buy(8);
    const equipped = await cosmeticsApi.equip(5);
    const unequipped = await cosmeticsApi.unequip(5);

    expect(bought).toMatchObject({ cosmetic_id: 8, owned: true });
    expect(equipped?.profile_updated).toEqual({
      avatar_frame_url: 'https://example.com/frame.png',
    });
    expect(unequipped?.profile_updated).toEqual({ avatar_frame_url: null });
    expect(requests.slice(0, 3)).toEqual([
      { method: 'POST', path: '/api/v1/cosmetics/8/buy', body: null },
      {
        method: 'PUT',
        path: '/api/v1/cosmetics/equip',
        body: { cosmetic_id: 5 },
      },
      {
        method: 'PUT',
        path: '/api/v1/cosmetics/unequip',
        body: { cosmetic_id: 5 },
      },
    ]);
  });
});
