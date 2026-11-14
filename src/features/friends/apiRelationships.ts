/**
 * Chuyển dữ liệu người dùng / quan hệ của backend sang mô hình giao diện
 * (User, FriendStatus, BlockedUserEntry) cho phiên đăng nhập thật.
 */
import type { ProfileResponse } from '../../api/posts';
import {
  relationshipsApi,
  type RelationshipStatsResponseDto,
  type UserSearchResultDto,
} from '../../api/relationships';
import type {
  BlockedUserEntry,
  FriendStatus,
  Role,
  User,
} from '../demo/types';

const DEFAULT_AVATAR = '/default-avatar.svg';
const DEFAULT_COVER = '/default-cover.svg';

const toRole = (role: string | undefined): Role =>
  role === 'LECTURER' ? 'LECTURER' : 'STUDENT';

/** Người dùng chỉ biết id/tên/ảnh (tác giả bài viết, danh sách bạn bè…). */
export function basicUser(info: {
  user_id?: number;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  school_faculty?: string;
  code?: string;
}): User {
  const role = toRole(info.role);
  return {
    id: String(info.user_id),
    name: info.full_name || `Người dùng #${info.user_id ?? '?'}`,
    role,
    email: '',
    avatar: info.avatar_url || DEFAULT_AVATAR,
    coverImage: DEFAULT_COVER,
    bio: '',
    faculty: info.school_faculty || '',
    classOrTitle: info.code || (info.role === 'LECTURER' ? 'Giảng viên' : ''),
    points: 0,
    approvedQuestionsCount: 0,
    friendsCount: 0,
    followersCount: 0,
    isOnline: false,
    verifiedLecturer: role === 'LECTURER' ? true : undefined,
  };
}

/** Hồ sơ đầy đủ (GET /users/{id}). */
export function userFromProfile(profile: ProfileResponse): User {
  const role = toRole(profile.role);
  return {
    ...basicUser(profile),
    email: profile.email || '',
    coverImage: profile.cover_url || DEFAULT_COVER,
    bio: profile.bio || '',
    faculty: profile.school_faculty || '',
    classOrTitle:
      profile.class_name ||
      profile.major ||
      profile.student_lecturer_code ||
      (role === 'LECTURER' ? 'Giảng viên' : 'Sinh viên'),
    points: profile.gamification_points ?? 0,
    approvedQuestionsCount: profile.total_proposed_questions ?? 0,
    friendsCount: profile.friends_count ?? 0,
    followersCount: profile.followers_count ?? 0,
    verifiedLecturer: role === 'LECTURER' && profile.verified !== false,
  };
}

export function userFromSearch(result: UserSearchResultDto): User {
  const role = toRole(result.role);
  return {
    ...basicUser(result),
    email: result.email || '',
    bio: result.bio || '',
    faculty: result.school_faculty || '',
    classOrTitle:
      result.major ||
      result.student_lecturer_code ||
      (role === 'LECTURER' ? 'Giảng viên' : 'Sinh viên'),
    approvedQuestionsCount: result.total_proposed_questions ?? 0,
    followersCount: result.followers_count ?? 0,
    verifiedLecturer: role === 'LECTURER' ? true : undefined,
  };
}

/**
 * Trạng thái kết bạn từ hồ sơ. Backend chỉ báo PENDING mà không nói ai gửi,
 * nên trả null để giữ hướng đã biết từ danh sách lời mời.
 */
export function friendStatusFromProfile(
  profile: ProfileResponse,
): FriendStatus | null {
  const rel = profile.relationships;
  if (!rel) return null;
  if (rel.is_friend || rel.friend_request_status === 'ACCEPTED')
    return 'FRIEND';
  if (rel.friend_request_status === 'PENDING') return null;
  return 'NONE';
}

/**
 * Trạng thái kết bạn từ GET /users/{userId}/relationship-stats.
 */
export function friendStatusFromRelationshipStats(
  stats:
    | (RelationshipStatsResponseDto & {
        friend?: boolean;
        friend_request_status?: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED';
      })
    | undefined,
): FriendStatus | null {
  if (!stats) return null;
  const rel = stats.relationship_with_me ?? stats;
  if (rel.friend === undefined && rel.friend_request_status === undefined) {
    return null;
  }
  if (rel.friend || rel.friend_request_status === 'ACCEPTED') return 'FRIEND';
  if (rel.friend_request_status === 'PENDING') return null;
  return 'NONE';
}

export interface ApiRelationshipSnapshot {
  users: User[];
  statuses: Record<string, FriendStatus>;
  following: string[];
  followers: string[];
  blocked: BlockedUserEntry[];
  mutual: Record<string, number>;
}

const formatTime = (value?: string) => {
  const time = value ? Date.parse(value) : NaN;
  return Number.isNaN(time)
    ? ''
    : new Date(time).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
};

/** Tải bạn bè, lời mời, người đang theo dõi, người theo dõi tôi và danh sách chặn của tôi. */
export async function loadApiRelationships(): Promise<ApiRelationshipSnapshot> {
  const [friends, received, sent, following, followers, blocked] =
    await Promise.all([
      relationshipsApi.getFriends(),
      relationshipsApi.getReceivedRequests(),
      relationshipsApi.getSentRequests(),
      relationshipsApi.getFollowing(),
      relationshipsApi.getFollowers().catch(() => []),
      relationshipsApi.getBlocked(),
    ]);
  const users = new Map<string, User>();
  const statuses: Record<string, FriendStatus> = {};
  const mutual: Record<string, number> = {};
  const remember = (user: User) => {
    if (!user.id || user.id === 'undefined') return;
    const existing = users.get(user.id);
    if (!existing) {
      users.set(user.id, user);
      return;
    }
    users.set(user.id, {
      ...existing,
      name: user.name || existing.name,
      avatar:
        user.avatar && user.avatar !== DEFAULT_AVATAR
          ? user.avatar
          : existing.avatar,
      role: user.role === 'LECTURER' ? 'LECTURER' : existing.role,
      faculty: user.faculty || existing.faculty,
      classOrTitle: user.classOrTitle || existing.classOrTitle,
    });
  };

  for (const f of following) {
    if (f.user_id == null) continue;
    const user = basicUser(f);
    remember(user);
    if (f.friend) {
      statuses[user.id] = 'FRIEND';
    }
  }
  for (const fl of followers) {
    if (fl.user_id == null) continue;
    const user = basicUser(fl);
    remember(user);
    if (fl.friend && !statuses[user.id]) {
      statuses[user.id] = 'FRIEND';
    }
  }
  for (const r of received) {
    if (r.requester?.user_id == null || r.status !== 'PENDING') continue;
    const user = basicUser(r.requester);
    remember(user);
    statuses[user.id] = 'REQUEST_RECEIVED';
    mutual[user.id] = r.mutual_friends_count ?? 0;
  }
  for (const s of sent) {
    if (s.receiver?.user_id == null || s.status !== 'PENDING') continue;
    const user = basicUser(s.receiver);
    remember(user);
    statuses[user.id] = 'REQUEST_SENT';
    mutual[user.id] = s.mutual_friends_count ?? 0;
  }
  for (const f of friends) {
    if (f.user_id == null) continue;
    const user = basicUser(f);
    remember(user);
    statuses[user.id] = 'FRIEND';
    mutual[user.id] = f.mutual_friends_count ?? 0;
  }
  const blockedEntries: BlockedUserEntry[] = [];
  for (const b of blocked) {
    if (b.user_id == null) continue;
    remember(basicUser(b));
    blockedEntries.push({
      userId: String(b.user_id),
      blockedAt: formatTime(b.blocked_at),
    });
  }
  return {
    users: [...users.values()],
    statuses,
    following: following
      .filter((f) => f.user_id != null)
      .map((f) => String(f.user_id)),
    followers: followers
      .filter((fl) => fl.user_id != null)
      .map((fl) => String(fl.user_id)),
    blocked: blockedEntries,
    mutual,
  };
}
