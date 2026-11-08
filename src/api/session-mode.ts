import { tokenStore } from './token';

/**
 * Phiên thật (đăng nhập bằng tài khoản backend) luôn có access token;
 * phiên demo cố ý xoá token (xem useAuthSession). Đây là điểm duy nhất
 * quyết định một thao tác đi qua API hay qua dữ liệu demo.
 */
export function isApiSession(): boolean {
  return tokenStore.get() !== null;
}

/** Lấy thông báo hiển thị được từ một lỗi bất kỳ. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
