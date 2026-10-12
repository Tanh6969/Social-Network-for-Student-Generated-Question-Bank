import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AvatarWithFrame } from '../common/AvatarWithFrame';
import { mockOtherUsers } from '../../data/mockData';
import {
  Users,
  UserPlus,
  UserCheck,
  Shield,
  Search,
  MessageCircle,
  MoreHorizontal,
  UserMinus,
  Ban
} from 'lucide-react';
import { User } from '../../types';

export const FriendsView: React.FC = () => {
  const {
    currentUser,
    setViewingUserId,
    setActiveTab,
    openChatDock,
    showToast,
    openReportModal
  } = useApp();

  const [activeMenu, setActiveMenu] = useState<'ALL' | 'REQUESTS' | 'FOLLOWING' | 'SUGGESTIONS'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [friendStatuses, setFriendStatuses] = useState<Record<string, 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE'>>({
    user_sv_02: 'REQUEST_RECEIVED',
    user_sv_03: 'FRIEND',
    user_sv_04: 'NONE'
  });

  const handleAccept = (userId: string) => {
    setFriendStatuses((prev) => ({ ...prev, [userId]: 'FRIEND' }));
    showToast('Đã chấp nhận lời mời kết bạn!', 'success');
  };

  const handleSendRequest = (userId: string) => {
    setFriendStatuses((prev) => ({ ...prev, [userId]: 'REQUEST_SENT' }));
    showToast('Đã gửi lời mời kết bạn!', 'success');
  };

  const handleCancelRequest = (userId: string) => {
    setFriendStatuses((prev) => ({ ...prev, [userId]: 'NONE' }));
    showToast('Đã hủy lời mời kết bạn.', 'info');
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-12 items-start justify-between">
      {/* ================= CỘT TRÁI (sticky sát lề trái) ================= */}
      <aside className="w-full lg:w-[300px] xl:w-[320px] shrink-0 space-y-3 select-none lg:sticky lg:top-18">
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-3">
          <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 px-2 mb-2">
            Bạn bè & Mối quan hệ
          </h2>

          <div className="space-y-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <button
              onClick={() => setActiveMenu('ALL')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left ${
                activeMenu === 'ALL'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                  : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              <Users className="w-4 h-4 text-gray-500" />
              <span>Tất cả bạn bè ({currentUser.friendsCount})</span>
            </button>

            <button
              onClick={() => setActiveMenu('REQUESTS')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left ${
                activeMenu === 'REQUESTS'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                  : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-4 h-4 text-gray-500" />
                <span>Lời mời kết bạn</span>
              </div>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                1
              </span>
            </button>

            <button
              onClick={() => setActiveMenu('FOLLOWING')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left ${
                activeMenu === 'FOLLOWING'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                  : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              <UserCheck className="w-4 h-4 text-gray-500" />
              <span>Đang theo dõi Giảng viên</span>
            </button>

            <button
              onClick={() => setActiveMenu('SUGGESTIONS')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left ${
                activeMenu === 'SUGGESTIONS'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                  : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              <Users className="w-4 h-4 text-gray-500" />
              <span>Gợi ý cùng khoa / lớp</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ================= CỘT PHẢI: Lưới người dùng (có khoảng trống 2 bên) ================= */}
      <main className="flex-1 max-w-[1000px] mx-auto space-y-4">
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên bạn bè, giảng viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-100 dark:bg-[#3A3B3C] text-xs rounded-full border border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>

        {/* User Cards Grid (REL.01, REL.02) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {mockOtherUsers.map((user) => {
            const status = friendStatuses[user.id] || 'NONE';

            return (
              <div
                key={user.id}
                className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
              >
                <div className="h-24 bg-linear-to-r from-blue-600 to-indigo-600 relative">
                  <img
                    src={user.coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4 pt-0 -mt-8 flex flex-col items-center text-center flex-1">
                  <AvatarWithFrame
                    user={user}
                    size="xl"
                    onClick={() => {
                      setViewingUserId(user.id);
                      setActiveTab('profile');
                    }}
                  />

                  <h4
                    onClick={() => {
                      setViewingUserId(user.id);
                      setActiveTab('profile');
                    }}
                    className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:underline cursor-pointer mt-2"
                  >
                    {user.name}
                  </h4>
                  <p className="text-[11px] text-gray-500">{user.classOrTitle}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{user.faculty}</p>

                  <div className="mt-auto pt-4 w-full space-y-1.5">
                    {user.role === 'LECTURER' ? (
                      <button
                        onClick={() => showToast('Đang theo dõi bài viết của Giảng viên', 'info')}
                        className="w-full py-1.5 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-100 transition"
                      >
                        ✓ Đang theo dõi
                      </button>
                    ) : status === 'REQUEST_RECEIVED' ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleAccept(user.id)}
                          className="py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                        >
                          Xác nhận
                        </button>
                        <button
                          onClick={() => handleCancelRequest(user.id)}
                          className="py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold"
                        >
                          Xóa
                        </button>
                      </div>
                    ) : status === 'FRIEND' ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openChatDock(user.id)}
                          className="flex-1 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Nhắn tin
                        </button>
                      </div>
                    ) : status === 'REQUEST_SENT' ? (
                      <button
                        onClick={() => handleCancelRequest(user.id)}
                        className="w-full py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-semibold"
                      >
                        Hủy lời mời
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(user.id)}
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Thêm bạn bè
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
