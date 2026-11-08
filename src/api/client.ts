import createClient from 'openapi-fetch';
import type { paths } from './generated/openapi';
import { tokenStore } from './token';

const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(
  /\/$/,
  '',
);

export const api = createClient<paths>({ baseUrl });

api.use({
  onRequest({ request, schemaPath }) {
    const token = tokenStore.get();
    if (
      token &&
      schemaPath !== '/auth/login' &&
      !request.headers.has('Authorization')
    ) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
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

export function expectEnvelope<T>(result: {
  data?: Envelope<T>;
  error?: Envelope<unknown>;
  response: Response;
}): Envelope<T> {
  const envelope = result.data ?? result.error;
  if (!result.response.ok || envelope?.code !== '0000') {
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
