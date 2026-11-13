/**
 * Giữ đăng nhập khi tải lại trang (F5).
 *
 * Access token chỉ nằm trong bộ nhớ nên mất khi tải lại. Refresh token (7 ngày)
 * nằm trong cookie HttpOnly do backend đặt, nên vẫn còn: gọi POST /auth/refresh
 * để lấy access token mới, rồi GET /users/me để dựng lại người dùng.
 *
 * Cờ `sqb_api_session` trong localStorage chỉ ghi "trình duyệt này từng đăng
 * nhập bằng tài khoản thật" (KHÔNG chứa token), để khách chưa đăng nhập không
 * phải chờ một yêu cầu refresh chắc chắn thất bại.
 */
import { refreshAccessToken } from '../../api/client';
import { tokenClaims, tokenStore } from '../../api/token';
import { postsApi } from '../../api/posts';
import type { AuthResponse } from '../../api/auth';
import type { User } from '../demo/types';
import { applyProfile, mapAuthUser } from './mapAuthUser';

const SESSION_HINT_KEY = 'sqb_api_session';

export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSessionHint(active: boolean) {
  try {
    if (active) localStorage.setItem(SESSION_HINT_KEY, '1');
    else localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // Storage bị chặn: chỉ mất tính năng giữ đăng nhập.
  }
}

function claimString(claims: Record<string, unknown> | null, key: string) {
  const value = claims?.[key];
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : undefined;
}

/** "ROLE_STUDENT" / "student" → "STUDENT". */
function normalizeRole(role: string | undefined) {
  return role?.replace(/^ROLE_/i, '').toUpperCase();
}

export interface RestoredSession {
  user: User;
  accessToken: string;
}

/** Khôi phục phiên từ cookie refresh. Null nếu không còn phiên hợp lệ. */
export async function restoreApiSession(): Promise<RestoredSession | null> {
  const accessToken = await refreshAccessToken();
  if (!accessToken) return null;

  const claims = tokenClaims(accessToken);
  const profile = await postsApi.getMyProfile().catch(() => null);
  const userId = profile?.user_id ?? Number(claimString(claims, 'userId'));
  const account: AuthResponse = {
    user_id: Number.isFinite(userId) ? userId : undefined,
    username: profile?.email || claimString(claims, 'sub'),
    role: normalizeRole(
      profile?.role || claimString(claims, 'role'),
    ) as AuthResponse['role'],
    verified: profile?.verified,
    avatar_url: profile?.avatar_url,
    cover_url: profile?.cover_url,
    access_token: accessToken,
  };

  try {
    return { user: applyProfile(mapAuthUser(account), profile), accessToken };
  } catch {
    // Vai trò không dùng được giao diện này (vd. Admin) hoặc thiếu thông tin.
    tokenStore.set(null);
    return null;
  }
}
