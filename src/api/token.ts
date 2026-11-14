let accessToken: string | null = null;
const listeners = new Set<(token: string | null) => void>();

export const tokenStore = {
  get: () => accessToken,
  set: (value: string | null) => {
    accessToken = value;
    listeners.forEach((listener) => listener(value));
  },
  /** Theo dõi mỗi lần token đổi (đăng nhập, làm mới, đăng xuất). */
  subscribe: (listener: (token: string | null) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/**
 * Đọc phần claims của JWT (không kiểm chữ ký — chỉ để hiển thị/lập lịch;
 * máy chủ vẫn là bên xác thực). Null nếu không phải JWT.
 */
export function tokenClaims(token: string): Record<string, unknown> | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json: unknown = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')),
    );
    return json && typeof json === 'object'
      ? (json as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Thời điểm hết hạn (ms) đọc từ claim `exp` của JWT; null nếu không đọc được. */
export function tokenExpiresAt(token: string): number | null {
  const exp = tokenClaims(token)?.exp;
  return typeof exp === 'number' ? exp * 1000 : null;
}
