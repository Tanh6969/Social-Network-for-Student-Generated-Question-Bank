import { useRef, useState } from 'react';
import { authApi } from '../../api/auth';
import { tokenStore } from '../../api/token';
import { mockCurrentUserStudent } from '../../mocks/mockData';
import type { Role, User } from '../demo/types';
import { mapAuthUser } from './mapAuthUser';
import { authenticateMockAccount } from './mockAuthentication';

type Notify = (
  message: string,
  type?: 'success' | 'info' | 'warning' | 'error',
) => void;

/** Authenticates demo credentials locally and all other accounts through the API. */
export function useAuthSession(notify: Notify) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionKind, setSessionKind] = useState<'demo' | 'api' | null>(null);
  const accessToken = useRef<string | null>(null);
  const [role, setRole] = useState<Role>('STUDENT');
  const [currentUser, setCurrentUser] = useState<User>(mockCurrentUserStudent);

  const loginWithCredentials = async (email: string, password: string) => {
    const mockUser = authenticateMockAccount(email, password);
    if (mockUser) {
      accessToken.current = null;
      tokenStore.set(null);
      setCurrentUser(mockUser);
      setRole(mockUser.role);
      setSessionKind('demo');
      setIsAuthenticated(true);
      notify('Đăng nhập tài khoản demo thành công.', 'success');
      return;
    }

    const account = await authApi.login(email, password);
    let user: User;
    try {
      user = mapAuthUser(account);
    } catch (error) {
      if (account.access_token)
        await authApi.logout(account.access_token).catch(() => undefined);
      throw error;
    }
    accessToken.current = account.access_token!;
    tokenStore.set(account.access_token!);
    setCurrentUser(user);
    setRole(user.role);
    setSessionKind('api');
    setIsAuthenticated(true);
    notify('Đăng nhập thành công.', 'success');
  };

  const logout = async () => {
    const token = sessionKind === 'api' ? accessToken.current : null;
    accessToken.current = null;
    tokenStore.set(null);
    setSessionKind(null);
    setIsAuthenticated(false);
    if (!token) {
      notify('Đã thoát chế độ demo.', 'info');
      return;
    }
    try {
      await authApi.logout(token);
      notify('Đã đăng xuất khỏi hệ thống.', 'info');
    } catch {
      notify(
        'Đã thoát trên trình duyệt, nhưng máy chủ chưa xác nhận đăng xuất.',
        'warning',
      );
    }
  };

  const switchRole = (newRole: Role) => {
    if (sessionKind !== 'demo') {
      notify('Vai trò được xác định bởi tài khoản đã đăng nhập.', 'warning');
      return;
    }
    setRole(newRole);
    setCurrentUser(
      newRole === 'LECTURER' ? mockCurrentUserLecturer : mockCurrentUserStudent,
    );
    notify(
      `Đã chuyển sang vai trò ${newRole === 'LECTURER' ? 'Giảng viên' : 'Sinh viên'} (demo).`,
      'info',
    );
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    setCurrentUser((previous) => ({ ...previous, ...updates }));
    notify('Đã cập nhật hồ sơ trên giao diện demo.', 'info');
  };

  return {
    isAuthenticated,
    sessionKind,
    currentUser,
    setCurrentUser,
    role,
    loginWithCredentials,
    logout,
    switchRole,
    updateCurrentUser,
  };
}
