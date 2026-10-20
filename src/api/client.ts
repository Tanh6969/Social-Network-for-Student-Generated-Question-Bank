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
      envelope?.message || `Yêu cầu thất bại (${result.response.status}).`,
      result.response.status,
      envelope?.code,
    );
  }
  return envelope as Envelope<T>;
}
