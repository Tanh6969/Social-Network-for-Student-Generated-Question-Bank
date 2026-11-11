import type { AuthResponse } from '../../api/auth';
import type { ProfileResponse } from '../../api/profile';
import type { User } from '../demo/types';

export function mapAuthUser(account: AuthResponse): User {
  if (account.role !== 'STUDENT' && account.role !== 'LECTURER') {
    throw new Error('Giao diện này chỉ dành cho sinh viên và giảng viên.');
  }
  if (!account.user_id || !account.username) {
    throw new Error('Phản hồi đăng nhập thiếu thông tin người dùng.');
  }

  return {
    id: String(account.user_id),
    name: account.username.split('@')[0],
    role: account.role,
    email: account.username,
    avatar: account.avatar_url || '/default-avatar.svg',
    coverImage: account.cover_url || '/default-cover.svg',
    bio: '',
    faculty: '',
    classOrTitle: account.role === 'LECTURER' ? 'Giảng viên' : 'Sinh viên',
    points: 0,
    approvedQuestionsCount: 0,
    friendsCount: 0,
    followersCount: 0,
    isOnline: true,
    verifiedLecturer: account.role === 'LECTURER' && account.verified === true,
  };
}

export function mapProfileUser(
  account: AuthResponse,
  profile: ProfileResponse,
): User {
  const user = mapAuthUser(account);
  if (profile.user_id !== account.user_id) {
    throw new Error('Hồ sơ trả về không khớp tài khoản đăng nhập.');
  }
  return {
    ...user,
    name: profile.full_name || user.name,
    email: profile.email || user.email,
    avatar: profile.avatar_url || user.avatar,
    coverImage: profile.cover_url || user.coverImage,
    bio: profile.bio || '',
    faculty: profile.school_faculty || '',
    classOrTitle:
      profile.class_name ||
      profile.major ||
      (user.role === 'LECTURER' ? 'Giảng viên' : 'Sinh viên'),
    points: profile.gamification_points || 0,
    approvedQuestionsCount: profile.total_proposed_questions || 0,
    friendsCount: profile.friends_count || 0,
    followersCount: profile.followers_count || 0,
    verifiedLecturer: user.role === 'LECTURER' && profile.verified === true,
  };
}
