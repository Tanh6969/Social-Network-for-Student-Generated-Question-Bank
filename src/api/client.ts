import createClient from 'openapi-fetch';
import type { paths } from './generated/openapi';
import { tokenExpiresAt, tokenStore } from './token';

const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(
  /\/$/,
  '',
);

export const api = createClient<paths>({ baseUrl });

// ============================================================================
// Làm mới access token
// Access token chỉ sống 15 phút. Với nền tảng WEB, backend gửi refresh token
// (7 ngày) qua cookie HttpOnly `refreshToken` (Path=/api/v1/auth), nên
// JavaScript không đọc được: chỉ cần gọi POST /auth/refresh KHÔNG có body,
// trình duyệt tự gửi cookie (đã kiểm tra trên backend thật 2026-11-13).
// ============================================================================

let refreshing: Promise<string | null> | null = null;

/**
 * Xin access token mới. Nhiều yêu cầu cùng lúc dùng chung một lần gọi.
 * Trả null nếu không làm mới được (cookie hết hạn, đã đăng xuất…).
 */
export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= (async () => {
    const before = tokenStore.get();
    try {
      const response = await globalThis.fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      const body = (await response.json().catch(() => null)) as Envelope<{
        access_token?: string;
      }> | null;
      const token =
        response.ok && SUCCESS_CODES.has(body?.code ?? '')
          ? (body?.data?.access_token ?? null)
          : null;
      if (!token) return null;
      // Trong lúc chờ mà người dùng đã đăng xuất / đăng nhập lại thì không
      // ghi đè: không đăng nhập ngầm sau khi đã đăng xuất.
      if (tokenStore.get() !== before) return tokenStore.get();
      tokenStore.set(token);
      return token;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

// Làm mới chủ động ~1 phút trước khi hết hạn, để phiên dài (làm bài thi, đọc
// bảng tin…) không bị gián đoạn.
const REFRESH_AHEAD_MS = 60_000;
let refreshTimer: ReturnType<typeof setTimeout> | undefined;

tokenStore.subscribe((token) => {
  clearTimeout(refreshTimer);
  refreshTimer = undefined;
  const expiresAt = token ? tokenExpiresAt(token) : null;
  if (!expiresAt) return;
  const delay = Math.max(5_000, expiresAt - Date.now() - REFRESH_AHEAD_MS);
  refreshTimer = setTimeout(() => void refreshAccessToken(), delay);
});

/** 401, hoặc mã 9998 "Full authentication is required" của backend. */
async function isAuthFailure(response: Response): Promise<boolean> {
  if (response.status === 401) return true;
  if (response.status !== 403) return false;
  const body = (await response
    .clone()
    .json()
    .catch(() => null)) as Envelope<unknown> | null;
  return body?.code === AUTH_REQUIRED_CODE;
}

// Bản sao request (trước khi body bị đọc) để gửi lại sau khi làm mới token.
const retryCopies = new WeakMap<Request, Request>();

api.use({
  onRequest({ request, schemaPath }) {
    const token = tokenStore.get();
    if (
      token &&
      !schemaPath.startsWith('/auth/') &&
      !request.headers.has('Authorization')
    ) {
      request.headers.set('Authorization', `Bearer ${token}`);
      retryCopies.set(request, request.clone());
    }
    return request;
  },
  async onResponse({ request, response }) {
    const retry = retryCopies.get(request);
    retryCopies.delete(request);
    if (!retry || !(await isAuthFailure(response))) return response;

    // Yêu cầu khác đã làm mới xong thì dùng luôn token mới.
    const sent = retry.headers.get('Authorization')?.replace(/^Bearer /, '');
    const current = tokenStore.get();
    const token =
      current && current !== sent ? current : await refreshAccessToken();
    if (!token) return response;

    retry.headers.set('Authorization', `Bearer ${token}`);
    return globalThis.fetch(retry);
  },
  onError() {
    return new ApiError('Không kết nối được máy chủ. Vui lòng thử lại.', 0);
  },
});

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Envelope<T> = { code?: string; message?: string; data?: T };

/**
 * Swagger ghi mã thành công là "0000", nhưng máy chủ thật trả "1000"
 * (message "SUCCESS"). Chấp nhận cả hai để không coi phản hồi đúng là lỗi.
 */
const SUCCESS_CODES = new Set(['0000', '1000']);

export function expectEnvelope<T>(result: {
  data?: Envelope<T>;
  error?: Envelope<unknown>;
  response: Response;
}): Envelope<T> {
  const envelope = result.data ?? result.error;
  if (!result.response.ok || !SUCCESS_CODES.has(envelope?.code ?? '')) {
    throw new ApiError(
      failureMessage(result.response.status, envelope),
      result.response.status,
      envelope?.code,
    );
  }
  return envelope as Envelope<T>;
}

// Mã 9998 là lỗi "Full authentication is required" của backend.
const AUTH_REQUIRED_CODE = '9998';

function failureMessage(status: number, envelope?: Envelope<unknown>): string {
  if (status === 401 || envelope?.code === AUTH_REQUIRED_CODE) {
    return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
  }
  if (status === 403) {
    return envelope?.message || 'Bạn không có quyền thực hiện thao tác này.';
  }
  return envelope?.message || `Yêu cầu thất bại (${status}).`;
}
