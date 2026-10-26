import { describe, expect, it } from 'vitest';
import { mockDemoAccounts, mockDemoPassword } from '../src/mocks/mockData';
import { authenticateMockAccount } from '../src/features/auth/mockAuthentication';

describe('mock account authentication', () => {
  it('provides five student and two lecturer accounts', () => {
    expect(
      mockDemoAccounts.filter(({ user }) => user.role === 'STUDENT'),
    ).toHaveLength(5);
    expect(
      mockDemoAccounts.filter(({ user }) => user.role === 'LECTURER'),
    ).toHaveLength(2);
  });

  it('authenticates the account and derives its role from its profile', () => {
    const lecturer = mockDemoAccounts.find(
      ({ user }) => user.role === 'LECTURER',
    )!;
    expect(authenticateMockAccount(lecturer.user.email, mockDemoPassword)).toBe(
      lecturer.user,
    );
  });

  it('rejects a wrong password for a known demo account', () => {
    const account = mockDemoAccounts[0];
    expect(() =>
      authenticateMockAccount(account.user.email, 'wrong-password'),
    ).toThrow('Tên đăng nhập hoặc mật khẩu không đúng.');
  });

  it('leaves non-demo accounts for API authentication', () => {
    expect(
      authenticateMockAccount('unknown@truong.edu.vn', mockDemoPassword),
    ).toBeNull();
  });
});
