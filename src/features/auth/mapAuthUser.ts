import type { AuthResponse } from '../../api/auth';
import type { ProfileResponse } from '../../api/posts';
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

/** Bổ sung thông tin hồ sơ đầy đủ (GET /users/me) vào người dùng đăng nhập. */
export function applyProfile(
  user: User,
  profile: ProfileResponse | null,
): User {
  if (!profile) return user;
  return {
    ...user,
    name: profile.full_name?.trim() || user.name,
    avatar: profile.avatar_url || user.avatar,
    coverImage: profile.cover_url || user.coverImage,
    frameUrl: profile.frame_url || undefined,
    bio: profile.bio ?? user.bio,
    faculty: profile.school_faculty || user.faculty,
    classOrTitle: profile.class_name || user.classOrTitle,
    points: profile.gamification_points ?? user.points,
    friendsCount: profile.friends_count ?? user.friendsCount,
    followersCount: profile.followers_count ?? user.followersCount,
  };
}
