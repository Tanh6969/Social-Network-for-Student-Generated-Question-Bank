import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

type Schemas = components['schemas'];
export type CosmeticType = NonNullable<Schemas['ShopItemDto']['type']>;
export type CosmeticRarity = NonNullable<Schemas['ShopItemDto']['rarity']>;
export type ShopSortBy = 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'RARITY';

export type ShopItemDto = Omit<Schemas['ShopItemDto'], 'available_until'> & {
  available_until?: string | null;
};
export type InventoryItemDto = Omit<
  Schemas['InventoryItemDto'],
  'available_until'
> & {
  available_until?: string | null;
};
export type MyInventoryResponseDto = Schemas['MyInventoryResponseDto'];
export type CosmeticSummaryDto = Schemas['CosmeticSummaryDto'];
export type EquipCosmeticResponseDto = Omit<
  Schemas['EquipCosmeticResponseDto'],
  'profile_updated'
> & {
  profile_updated?: Record<string, string | null>;
};
export type UnequipCosmeticResponseDto = Omit<
  Schemas['UnequipCosmeticResponseDto'],
  'profile_updated'
> & {
  profile_updated?: Record<string, string | null>;
};

export type CosmeticShopQuery = {
  type?: CosmeticType;
  sort_by?: ShopSortBy;
  after?: number;
  limit?: number;
};
export type CosmeticInventoryQuery = {
  type?: CosmeticType;
  rarity?: CosmeticRarity;
  only_unlocked?: boolean;
  after?: number;
  limit?: number;
};

export const cosmeticsApi = {
  async getShop({
    after,
    type,
    sort_by = 'NEWEST',
    limit = 20,
  }: CosmeticShopQuery = {}) {
    return expectEnvelope(await api.GET('/cosmetics/shop', {
      params: { query: { after, type, sort_by, limit } },
    })).data;
  },
  async getInventory({
    after,
    type,
    rarity,
    only_unlocked,
    limit = 20,
  }: CosmeticInventoryQuery = {}) {
    return expectEnvelope(await api.GET('/cosmetics/my-inventory', {
      params: { query: { after, type, rarity, only_unlocked, limit } },
    })).data;
  },
  async buy(id: number) {
    return expectEnvelope(await api.POST('/cosmetics/{id}/buy', {
      params: { path: { id } },
    })).data;
  },
  async equip(cosmeticId: number): Promise<EquipCosmeticResponseDto | undefined> {
    return expectEnvelope(await api.PUT('/cosmetics/equip', {
      body: { cosmetic_id: cosmeticId },
    })).data;
  },
  async unequip(cosmeticId: number): Promise<UnequipCosmeticResponseDto | undefined> {
    return expectEnvelope(await api.PUT('/cosmetics/unequip', {
      body: { cosmetic_id: cosmeticId },
    })).data;
  },
};
