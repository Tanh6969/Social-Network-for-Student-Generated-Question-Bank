import React from 'react';
import { User } from '../../types';
import { BadgeCheck } from 'lucide-react';

interface AvatarWithFrameProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showOnline?: boolean;
  showLecturerBadge?: boolean;
  onClick?: () => void;
  className?: string;
}

export const AvatarWithFrame: React.FC<AvatarWithFrameProps> = ({
  user,
  size = 'md',
  showOnline = true,
  showLecturerBadge = true,
  onClick,
  className = ''
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-24 h-24'
  };

  const getFrameRingClass = () => {
    if (!user.equippedFrameId) return '';
    if (user.equippedFrameId === 'frame_gold') {
      return 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-[#242526] shadow-[0_0_8px_rgba(251,191,36,0.5)]';
    }
    if (user.equippedFrameId === 'frame_dragon') {
      return 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-[#242526] shadow-[0_0_8px_rgba(99,102,241,0.5)]';
    }
    if (user.equippedFrameId === 'frame_laurel') {
      return 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-[#242526] shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    }
    if (user.equippedFrameId === 'frame_lecturer' || user.role === 'LECTURER') {
      return 'ring-2 ring-blue-600 ring-offset-2 ring-offset-white dark:ring-offset-[#242526] shadow-[0_0_8px_rgba(37,99,235,0.5)]';
    }
    return '';
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <img
        src={user.avatar}
        alt={user.name}
        className={`rounded-full object-cover ${sizeMap[size]} ${getFrameRingClass()}`}
      />

      {/* Online indicator dot */}
      {showOnline && user.isOnline && (
        <span
          className={`absolute bottom-0 right-0 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#242526] ${
            size === 'xs' || size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
          }`}
          title="Đang hoạt động"
        />
      )}

      {/* Verified lecturer badge */}
      {showLecturerBadge && user.role === 'LECTURER' && (
        <span
          className="absolute -bottom-0.5 -right-0.5 bg-blue-600 text-white rounded-full p-0.5 shadow-sm"
          title="Giảng viên đã xác thực"
        >
          <BadgeCheck className={size === 'xs' || size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
        </span>
      )}
    </div>
  );
};
