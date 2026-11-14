import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

type Schemas = components['schemas'];
export type ShopItemDto = Schemas['ShopItemDto'];
export type InventoryItemDto = Schemas['InventoryItemDto'];
export type MyInventoryResponseDto = Schemas['MyInventoryResponseDto'];

export const cosmeticsApi = {
  async getShop(after?: number) {
    return expectEnvelope(await api.GET('/cosmetics/shop', {
      params: { query: { after, limit: 30 } },
    })).data;
  },
  async getInventory(after?: number) {
    return expectEnvelope(await api.GET('/cosmetics/my-inventory', {
      params: { query: { after, limit: 30 } },
    })).data;
  },
  async buy(id: number): Promise<void> {
    expectEnvelope(await api.POST('/cosmetics/{id}/buy', {
      params: { path: { id } },
    }));
  },
  async equip(cosmeticId: number): Promise<void> {
    expectEnvelope(await api.PUT('/cosmetics/equip', { body: { cosmetic_id: cosmeticId } }));
  },
  async unequip(cosmeticId: number): Promise<void> {
    expectEnvelope(await api.PUT('/cosmetics/unequip', { body: { cosmetic_id: cosmeticId } }));
  },
};
