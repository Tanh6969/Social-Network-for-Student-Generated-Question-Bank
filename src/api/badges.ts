import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

export type BadgeResponseDto = components['schemas']['BadgeResponseDto'];
export type UserBadgeResponseDto = components['schemas']['UserBadgeResponseDto'];

export const badgesApi = {
  async getCatalog(): Promise<BadgeResponseDto[]> {
    return expectEnvelope(await api.GET('/badges')).data ?? [];
  },
  async getUserBadges(userId: number): Promise<UserBadgeResponseDto[]> {
    return expectEnvelope(await api.GET('/badges/users/{userId}', {
      params: { path: { userId } },
    })).data ?? [];
  },
};
