import { mockDemoAccounts } from '../../mocks/mockData';
import type { User } from '../demo/types';

export function authenticateMockAccount(
  email: string,
  password: string,
): User | null {
  const normalizedEmail = email.trim().toLowerCase();
  const account = mockDemoAccounts.find(
    ({ user }) => user.email.toLowerCase() === normalizedEmail,
  );

  if (!account) return null;
  if (account.password !== password) {
    throw new Error('Tên đăng nhập hoặc mật khẩu không đúng.');
  }
  return account.user;
}
