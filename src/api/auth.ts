import { createId } from '../shared/createId';
import { api, expectEnvelope, refreshAccessToken } from './client';
import type { components } from './generated/openapi';

export type AuthResponse = components['schemas']['AuthResponse'];
export type ChangePasswordRequest = components['schemas']['ChangePasswordRequest'];
type LoginRequest = components['schemas']['LoginRequest'];

const deviceIdKey = 'sqb_web_device_id';

export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(deviceIdKey);
    if (existing) return existing;
  } catch {
    // Storage can be unavailable in private browsing.
  }
  const id = `web-${createId()}`;
  try {
    localStorage.setItem(deviceIdKey, id);
  } catch {
    // The current login can still proceed.
  }
  return id;
}

export const authApi = {
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

  async logout(accessToken: string): Promise<void> {
    const result = await api.POST('/auth/logout', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expectEnvelope(result);
  },

  /** POST /auth/change-password — Đổi mật khẩu người dùng. */
  async changePassword(body: ChangePasswordRequest): Promise<void> {
    const result = await api.POST('/auth/change-password', { body });
    expectEnvelope(result);
  },

  /** POST /auth/refresh — Cấp mới Access Token bằng Refresh Token. */
  async refresh(): Promise<boolean> {
    return Boolean(await refreshAccessToken());
  },
};
