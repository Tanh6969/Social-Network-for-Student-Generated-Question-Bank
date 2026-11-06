import { api, expectEnvelope, type OpBody, type OpQuery } from './client';

export const rewardsApi = {
  // ==========================================================================
  // 22. Huy hiệu & Danh hiệu (Badges)
  // ==========================================================================

  /**
   * GET /badges
   */
  async getAllBadges() {
    const result = await api.GET('/badges');
    return expectEnvelope(result).data ?? [];
  },

  /**
   * GET /badges/{badgeId}
   */
  async getBadgeById(badgeId: number) {
    const result = await api.GET('/badges/{badgeId}', {
      params: { path: { badgeId } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /badges/me
   */
  async getMyBadges() {
    const result = await api.GET('/badges/me');
    return expectEnvelope(result).data ?? [];
  },

  /**
   * GET /badges/users/{userId}
   */
  async getUserBadges(userId: number) {
    const result = await api.GET('/badges/users/{userId}', {
      params: { path: { userId } },
    });
    return expectEnvelope(result).data ?? [];
  },

  /**
   * GET /admin/badges
   */
  async adminGetAllBadges() {
    const result = await api.GET('/admin/badges');
    return expectEnvelope(result).data ?? [];
  },

  /**
   * POST /admin/badges
   */
  async adminCreateBadge(body: OpBody<'createBadge'>) {
    const result = await api.POST('/admin/badges', { body });
    return expectEnvelope(result).data;
  },

  /**
   * PUT /admin/badges/{badgeId}
   */
  async adminUpdateBadge(badgeId: number, body: OpBody<'updateBadge'>) {
    const result = await api.PUT('/admin/badges/{badgeId}', {
      params: { path: { badgeId } },
      body,
    });
    return expectEnvelope(result).data;
  },

  /**
   * DELETE /admin/badges/{badgeId}
   */
  async adminDeleteBadge(badgeId: number) {
    const result = await api.DELETE('/admin/badges/{badgeId}', {
      params: { path: { badgeId } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /admin/badges/{badgeId}/grant
   */
  async adminGrantManualBadge(badgeId: number, body: OpBody<'grantManualBadge'>) {
    const result = await api.POST('/admin/badges/{badgeId}/grant', {
      params: { path: { badgeId } },
      body,
    });
    return expectEnvelope(result).data;
  },

  // ==========================================================================
  // 23. Cửa hàng & Vật phẩm Trang trí (Cosmetics)
  // ==========================================================================

  /**
   * GET /cosmetics/shop
   */
  async getShop(query?: OpQuery<'getShop'>) {
    const result = await api.GET('/cosmetics/shop', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /cosmetics/my-inventory
   */
  async getMyInventory(query?: OpQuery<'getMyInventory'>) {
    const result = await api.GET('/cosmetics/my-inventory', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /cosmetics/{id}/buy
   */
  async buyCosmetic(id: number) {
    const result = await api.POST('/cosmetics/{id}/buy', {
      params: { path: { id } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * PUT /cosmetics/equip
   */
  async equipCosmetic(body: OpBody<'equipCosmetic'>) {
    const result = await api.PUT('/cosmetics/equip', { body });
    return expectEnvelope(result).data;
  },

  /**
   * PUT /cosmetics/unequip
   */
  async unequipCosmetic(body: OpBody<'unequipCosmetic'>) {
    const result = await api.PUT('/cosmetics/unequip', { body });
    return expectEnvelope(result).data;
  },
};
