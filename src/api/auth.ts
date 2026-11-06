import { api, expectEnvelope, type OpBody } from './client';
import type { components } from './generated/openapi';

export type AuthResponse = components['schemas']['AuthResponse'];
type LoginRequest = components['schemas']['LoginRequest'];

const deviceIdKey = 'sqb_web_device_id';

function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(deviceIdKey);
    if (existing) return existing;
  } catch {
    // Storage can be unavailable in private browsing.
  }
  const id = `web-${crypto.randomUUID()}`;
  try {
    localStorage.setItem(deviceIdKey, id);
  } catch {
    // The current login can still proceed.
  }
  return id;
}

export const authApi = {
  /**
   * POST /auth/login
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const body: LoginRequest = {
      email: email.trim(),
      password,
      device_id: getDeviceId(),
      platform: 'WEB',
    };
    const result = await api.POST('/auth/login', { body });
    const account = expectEnvelope(result).data;
    if (!account?.access_token || !account.user_id || !account.role) {
      throw new Error('Phản hồi đăng nhập thiếu thông tin bắt buộc.');
    }
    return account;
  },

  /**
   * POST /auth/logout
   */
  async logout(accessToken?: string): Promise<void> {
    const result = await api.POST(
      '/auth/logout',
      accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {},
    );
    expectEnvelope(result);
  },

  /**
   * POST /auth/refresh
   */
  async refreshToken(body: OpBody<'refreshToken'>): Promise<AuthResponse | undefined> {
    const result = await api.POST('/auth/refresh', { body });
    return expectEnvelope(result).data;
  },

  /**
   * POST /auth/change-password
   */
  async changePassword(body: OpBody<'changePassword'>): Promise<void> {
    const result = await api.POST('/auth/change-password', { body });
    expectEnvelope(result);
  },

  /**
   * POST /auth/admin/verify
   */
  async adminVerify(body: OpBody<'verify'>) {
    const result = await api.POST('/auth/admin/verify', { body });
    return expectEnvelope(result).data;
  },

  /**
   * POST /auth/admin/reset-password
   */
  async adminResetPassword(body: OpBody<'adminResetPassword'>) {
    const result = await api.POST('/auth/admin/reset-password', { body });
    return expectEnvelope(result).data;
  },

  /**
   * POST /auth/admin/resend-verify
   */
  async adminResendVerify(body: OpBody<'resendVerify'>) {
    const result = await api.POST('/auth/admin/resend-verify', { body });
    return expectEnvelope(result).data;
  },

  /**
   * POST /auth/admin/register
   */
  async adminRegister(body: OpBody<'register'>) {
    const result = await api.POST('/auth/admin/register', { body });
    return expectEnvelope(result).data;
  },

  /**
   * POST /auth/admin/bulk-import
   */
  async adminBulkImportUsers(body: OpBody<'bulkImportUsers'>) {
    const result = await api.POST('/auth/admin/bulk-import', { body });
    return expectEnvelope(result).data;
  },

  /**
   * GET /devices
   */
  async getMyDevices() {
    const result = await api.GET('/devices');
    return expectEnvelope(result).data ?? [];
  },

  /**
   * POST /devices/fid
   */
  async syncFid(body: OpBody<'syncFid'>) {
    const result = await api.POST('/devices/fid', { body });
    return expectEnvelope(result).data;
  },

  /**
   * POST /devices/fid/unregister
   */
  async unregisterFid(body: OpBody<'unregisterFid'>) {
    const result = await api.POST('/devices/fid/unregister', { body });
    return expectEnvelope(result).data;
  },

  /**
   * POST /devices/{deviceId}/logout
   */
  async revokeDevice(deviceId: string) {
    const result = await api.POST('/devices/{deviceId}/logout', {
      params: { path: { deviceId } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * DELETE /devices/{deviceId}
   */
  async deleteDevice(deviceId: string) {
    const result = await api.DELETE('/devices/{deviceId}', {
      params: { path: { deviceId } },
    });
    return expectEnvelope(result).data;
  },
};
