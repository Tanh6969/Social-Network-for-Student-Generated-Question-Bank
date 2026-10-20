import { api, expectEnvelope } from './client';
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
};
