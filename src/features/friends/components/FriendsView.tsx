import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import {
  Users,
  UserPlus,
  UserCheck,
  Shield,
  Search,
  MessageCircle,
  MoreHorizontal,
  UserMinus,
  Ban,
  Unlock,
  CheckCircle2,
  X,
  Clock,
  Sparkles,
  AlertTriangle,
  EyeOff,
} from 'lucide-react';
import { User } from '../../demo/types';

type FriendsMenuTab =
  | 'ALL'
  | 'REQUESTS'
  | 'SUGGESTIONS'
  | 'FOLLOWING'
  | 'BLOCKED';

export const FriendsView: React.FC = () => {
  const {
    currentUser,
    allUsers,
    friendsList,
    friendStatuses,
    getMutualFriendsCount,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    unfriendUser,
    followingIds,
    toggleFollowUser,
    dismissedSuggestionIds,
    dismissSuggestion,
    blockedUsers,
    blockedByOtherIds,
    blockUser,
    unblockUser,
    toggleSimulatedBlockedByOther,
    isBlockedByMe,
    isBlockingMe,
    isBlockedEitherWay,
    setViewingUserId,
    setActiveTab,
    openChatDock,
    openReportModal,
  } = useApp();

  const [activeMenu, setActiveMenu] = useState<FriendsMenuTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'UNFRIEND' | 'BLOCK';
    user: User;
  } | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [quickBlockUserId, setQuickBlockUserId] = useState('');

  // Các danh sách người dùng thực tế (loại trừ những người đang trong trạng thái chặn)
  const unblockedUsers = allUsers.filter((u) => !isBlockedEitherWay(u.id));

  const incomingRequests = unblockedUsers.filter(
    (u) => friendStatuses[u.id] === 'REQUEST_RECEIVED',
  );
  const sentRequests = unblockedUsers.filter(
    (u) => friendStatuses[u.id] === 'REQUEST_SENT',
  );
  const lecturersList = unblockedUsers.filter((u) => u.role === 'LECTURER');
  const suggestionsList = unblockedUsers.filter(
    (u) =>
      u.role !== 'LECTURER' &&
      (friendStatuses[u.id] || 'NONE') === 'NONE' &&
      !dismissedSuggestionIds.includes(u.id),
  );

  const matchSearch = (u: User) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.classOrTitle.toLowerCase().includes(q) ||
      u.faculty.toLowerCase().includes(q)
    );
  };

  const filteredFriends = friendsList.filter(matchSearch);
  const filteredIncoming = incomingRequests.filter(matchSearch);
  const filteredSent = sentRequests.filter(matchSearch);
  const filteredLecturers = lecturersList.filter(matchSearch);
  const filteredSuggestions = suggestionsList.filter(matchSearch);

  const handleOpenProfile = (userId: string) => {
    setViewingUserId(userId);
    setActiveTab('profile');
  };

  const renderUserCard = (user: User) => {
    const status = friendStatuses[user.id] || 'NONE';
    const mutualCount = getMutualFriendsCount(user.id);
    const isFollowing = followingIds.includes(user.id);

    return (
      <div
        key={user.id}
        className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col relative group"
      >
        {/* Cover + More menu */}
        <div className="h-24 bg-linear-to-r from-blue-600 to-indigo-600 relative">
          <img
            src={user.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <button
              type="button"
              onClick={() =>
                setOpenMenuUserId(openMenuUserId === user.id ? null : user.id)
              }
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition"
              title="Tùy chọn"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {openMenuUserId === user.id && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-[#242526] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-20 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuUserId(null);
                    handleOpenProfile(user.id);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-700 dark:text-gray-200 flex items-center gap-2"
                >
                  <Users className="w-3.5 h-3.5 text-gray-500" />
                  <span>Xem trang cá nhân</span>
                </button>

                {status === 'FRIEND' && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuUserId(null);
                      setConfirmAction({ type: 'UNFRIEND', user });
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 flex items-center gap-2"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Hủy kết bạn</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuUserId(null);
                    openReportModal('NGƯỜI DÙNG', user.id, user.name);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-700 dark:text-gray-200 flex items-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5 text-gray-500" />
                  <span>Báo cáo trang cá nhân</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuUserId(null);
                    setBlockReason('');
                    setConfirmAction({ type: 'BLOCK', user });
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 font-semibold flex items-center gap-2 border-t border-gray-100 dark:border-gray-700"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Chặn {user.name.split(' ').slice(-1)[0]}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 pt-0 -mt-8 flex flex-col items-center text-center flex-1">
          <div className="relative">
            <AvatarWithFrame
              user={user}
              size="xl"
              onClick={() => handleOpenProfile(user.id)}
            />
            {user.isOnline && (
              <span
                className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#242526] rounded-full"
                title="Đang trực tuyến"
              />
            )}
          </div>

          <h4
            onClick={() => handleOpenProfile(user.id)}
            className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:underline cursor-pointer mt-2"
          >
            {user.name}
          </h4>
          <p className="text-[11px] text-gray-500">{user.classOrTitle}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{user.faculty}</p>

          {mutualCount > 0 && (
            <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full font-semibold">
              <Users className="w-3 h-3" /> {mutualCount} bạn chung
            </span>
          )}

          <div className="mt-auto pt-4 w-full space-y-1.5">
            {user.role === 'LECTURER' ? (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleFollowUser(user.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    isFollowing
                      ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {isFollowing ? '✓ Đang theo dõi' : '+ Theo dõi GV'}
                </button>
                <button
                  type="button"
                  onClick={() => openChatDock(user.id)}
                  className="px-2.5 py-1.5 bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold"
                  title="Nhắn tin cho Giảng viên"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : status === 'REQUEST_RECEIVED' ? (
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => acceptFriendRequest(user.id)}
                  className="py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                >
                  Xác nhận
                </button>
                <button
                  type="button"
                  onClick={() => declineFriendRequest(user.id)}
                  className="py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition"
                >
                  Xóa
                </button>
              </div>
            ) : status === 'FRIEND' ? (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => openChatDock(user.id)}
                  className="flex-1 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Nhắn tin
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAction({ type: 'UNFRIEND', user })}
                  className="px-2.5 py-1.5 bg-gray-100 dark:bg-[#3A3B3C] hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-600 dark:text-gray-300 hover:text-red-600 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  title="Hủy kết bạn"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBlockReason('');
                    setConfirmAction({ type: 'BLOCK', user });
                  }}
                  className="px-2.5 py-1.5 bg-gray-100 dark:bg-[#3A3B3C] hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-600 dark:text-gray-300 hover:text-red-600 rounded-lg text-xs font-semibold transition"
                  title="Chặn người dùng này"
                >
                  <Ban className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : status === 'REQUEST_SENT' ? (
              <button
                type="button"
                onClick={() => cancelFriendRequest(user.id)}
                className="w-full py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition"
              >
                Hủy lời mời đã gửi
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => sendFriendRequest(user.id)}
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Thêm bạn bè
                </button>
                {activeMenu === 'SUGGESTIONS' && (
                  <button
                    type="button"
                    onClick={() => dismissSuggestion(user.id)}
                    className="px-2.5 py-1.5 bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-semibold"
                    title="Ẩn gợi ý này"
                  >
                    Gỡ
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-12 items-start justify-between">
      {/* ================= CỘT TRÁI: Menu điều hướng Bạn bè & Chặn ================= */}
      <aside className="w-full lg:w-[300px] xl:w-[320px] shrink-0 space-y-3 select-none lg:sticky lg:top-18">
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-3">
          <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 px-2 mb-2">
            Bạn bè & Mối quan hệ
          </h2>

          <div className="space-y-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <button
              type="button"
              onClick={() => setActiveMenu('ALL')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left ${
                activeMenu === 'ALL'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                  : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Tất cả bạn bè</span>
              </div>
              <span className="bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-200 text-[11px] px-2 py-0.5 rounded-full font-bold">
                {currentUser.friendsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu('REQUESTS')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left ${
                activeMenu === 'REQUESTS'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                  : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-4 h-4 text-emerald-500" />
                <span>Lời mời kết bạn</span>
              </div>
              {incomingRequests.length > 0 ? (
                <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {incomingRequests.length}
                </span>
              ) : (
                <span className="text-[10px] text-gray-400">0</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu('SUGGESTIONS')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left ${
                activeMenu === 'SUGGESTIONS'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                  : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Gợi ý cùng khoa / lớp</span>
              </div>
              <span className="text-[11px] text-gray-400">
                {suggestionsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu('FOLLOWING')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left ${
                activeMenu === 'FOLLOWING'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                  : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserCheck className="w-4 h-4 text-purple-500" />
                <span>Đang theo dõi Giảng viên</span>
              </div>
              <span className="text-[11px] text-gray-400">
                {
                  lecturersList.filter((u) => followingIds.includes(u.id))
                    .length
                }
              </span>
            </button>

            <div className="pt-1 mt-1 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setActiveMenu('BLOCKED')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left ${
                  activeMenu === 'BLOCKED'
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold'
                    : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Ban className="w-4 h-4 text-red-500" />
                  <span>Danh sách đã chặn</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    blockedUsers.length > 0
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-[#3A3B3C] text-gray-500'
                  }`}
                >
                  {blockedUsers.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= CỘT PHẢI: Nội dung chính ================= */}
      <main className="flex-1 max-w-[1000px] mx-auto space-y-4 w-full">
        {/* Thanh tìm kiếm & tổng quan */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
              {activeMenu === 'ALL' &&
                `Tất cả bạn bè (${currentUser.friendsCount} người bạn)`}
              {activeMenu === 'REQUESTS' &&
                `Lời mời kết bạn (${incomingRequests.length} chờ xác nhận · ${sentRequests.length} đã gửi)`}
              {activeMenu === 'SUGGESTIONS' &&
                `Những người bạn có thể biết (${suggestionsList.length})`}
              {activeMenu === 'FOLLOWING' &&
                `Danh sách Giảng viên (${lecturersList.length})`}
              {activeMenu === 'BLOCKED' &&
                `Quản lý danh sách chặn (${blockedUsers.length} người đang bị chặn)`}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {activeMenu === 'BLOCKED'
                ? 'Chặn và bỏ chặn bất kỳ ai không giới hạn thời gian chờ (chuẩn đặc tả Slide 24).'
                : 'Kết nối bạn bè cùng lớp, trao đổi câu hỏi ôn tập và theo dõi giảng viên bộ môn.'}
            </p>
          </div>

          {activeMenu !== 'BLOCKED' && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm theo tên, lớp, khoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-100 dark:bg-[#3A3B3C] text-xs rounded-full border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}
        </div>

        {/* ================= TAB 1: TẤT CẢ BẠN BÈ ================= */}
        {activeMenu === 'ALL' && (
          <>
            {filteredFriends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredFriends.map(renderUserCard)}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center space-y-3">
                <Users className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                  {searchTerm
                    ? `Không tìm thấy người bạn nào khớp với "${searchTerm}"`
                    : 'Bạn chưa có người bạn nào trong danh sách'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveMenu('SUGGESTIONS')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Tìm bạn bè gợi ý
                </button>
              </div>
            )}
          </>
        )}

        {/* ================= TAB 2: LỜI MỜI KẾT BẠN ================= */}
        {activeMenu === 'REQUESTS' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 px-1">
                Lời mời kết bạn nhận được ({filteredIncoming.length})
              </h4>
              {filteredIncoming.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredIncoming.map(renderUserCard)}
                </div>
              ) : (
                <div className="bg-white dark:bg-[#242526] rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center text-xs text-gray-500">
                  Không có lời mời kết bạn nào đang chờ xác nhận.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 px-1">
                Lời mời bạn đã gửi ({filteredSent.length})
              </h4>
              {filteredSent.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredSent.map(renderUserCard)}
                </div>
              ) : (
                <div className="bg-white dark:bg-[#242526] rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center text-xs text-gray-500">
                  Bạn chưa gửi lời mời kết bạn mới nào.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: GỢI Ý KẾT BẠN ================= */}
        {activeMenu === 'SUGGESTIONS' && (
          <>
            {filteredSuggestions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredSuggestions.map(renderUserCard)}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center text-xs text-gray-500">
                Hiện không còn gợi ý kết bạn mới.
              </div>
            )}
          </>
        )}

        {/* ================= TAB 4: ĐANG THEO DÕI GIẢNG VIÊN ================= */}
        {activeMenu === 'FOLLOWING' && (
          <>
            {filteredLecturers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredLecturers.map(renderUserCard)}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center text-xs text-gray-500">
                Không tìm thấy giảng viên nào.
              </div>
            )}
          </>
        )}

        {/* ================= TAB 5: QUẢN LÝ DANH SÁCH ĐÃ CHẶN (SLIDE 24) ================= */}
        {activeMenu === 'BLOCKED' && (
          <div className="space-y-4">
            {/* Thêm nhanh người vào danh sách chặn */}
            <div className="bg-white dark:bg-[#242526] rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-600" />
                <span>Thêm người dùng vào danh sách chặn</span>
              </h4>
              <p className="text-xs text-gray-500">
                Khi bạn chặn một người: hai người sẽ tự động hủy kết bạn, không
                thể nhắn tin, không thể xem trang cá nhân của nhau, và bạn sẽ
                không nhìn thấy bình luận của người đó (nhưng bình luận & lượt
                thích cũ không bị xóa khỏi bài viết). Việc chặn lại sau khi bỏ
                chặn không bị giới hạn thời gian.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={quickBlockUserId}
                  onChange={(e) => setQuickBlockUserId(e.target.value)}
                  className="flex-1 bg-gray-100 dark:bg-[#3A3B3C] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-gray-100"
                >
                  <option value="">
                    -- Chọn người dùng để chặn ngay lập tức --
                  </option>
                  {allUsers
                    .filter((u) => !isBlockedByMe(u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.classOrTitle} ·{' '}
                        {friendStatuses[u.id] === 'FRIEND'
                          ? 'Đang là Bạn bè'
                          : 'Chưa kết bạn'}
                        )
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  disabled={!quickBlockUserId}
                  onClick={() => {
                    const target = allUsers.find(
                      (u) => u.id === quickBlockUserId,
                    );
                    if (target) {
                      setBlockReason('');
                      setConfirmAction({ type: 'BLOCK', user: target });
                      setQuickBlockUserId('');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-xl text-xs font-bold transition shrink-0"
                >
                  Chặn người dùng
                </button>
              </div>
            </div>

            {/* Danh sách các đối tượng đang bị bạn chặn */}
            <div className="bg-white dark:bg-[#242526] rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  Danh sách người bạn đang chặn ({blockedUsers.length})
                </h4>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Bỏ chặn & chặn lại
                  không giới hạn thời gian
                </span>
              </div>

              {blockedUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500 space-y-1">
                  <Shield className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300">
                    Danh sách chặn đang trống
                  </p>
                  <p>Bạn hiện không chặn bất kỳ người dùng nào.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {blockedUsers.map((entry) => {
                    const blockedUser = allUsers.find(
                      (u) => u.id === entry.userId,
                    );
                    if (!blockedUser) return null;
                    return (
                      <div
                        key={entry.userId}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={blockedUser.avatar}
                            alt={blockedUser.name}
                            className="w-11 h-11 rounded-full object-cover grayscale"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-gray-900 dark:text-gray-100">
                                {blockedUser.name}
                              </span>
                              <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">
                                Đã chặn
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500">
                              {blockedUser.classOrTitle} · {blockedUser.faculty}
                            </p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> Chặn lúc:{' '}
                              {entry.blockedAt}
                              {entry.reason ? ` · Lý do: ${entry.reason}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleOpenProfile(blockedUser.id)}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition"
                          >
                            Kiểm tra trang cá nhân
                          </button>
                          <button
                            type="button"
                            onClick={() => unblockUser(blockedUser.id)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Bỏ chặn</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bảng mô phỏng trường hợp "Người khác chặn bạn" để kiểm thử đủ chiều 2 người */}
            <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4" />
                    <span>
                      Chế độ kiểm thử chiều ngược lại: Mô phỏng người khác chặn
                      bạn ({blockedByOtherIds.length})
                    </span>
                  </h4>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                    Bật công tắc bên dưới để kiểm tra trường hợp đối phương chặn
                    bạn: bạn cũng sẽ bị hủy kết bạn, không xem được trang cá
                    nhân và không nhắn tin được cho họ.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {allUsers.slice(0, 6).map((u) => {
                  const blockingMe = isBlockingMe(u.id);
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#242526] border border-gray-200 dark:border-gray-700 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                        <span className="font-semibold truncate text-gray-800 dark:text-gray-200">
                          {u.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSimulatedBlockedByOther(u.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition ${
                          blockingMe
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {blockingMe ? 'Đang chặn bạn' : 'Bình thường'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL XÁC NHẬN HỦY KẾT BẠN / CHẶN NGƯỜI DÙNG ================= */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-[#242526] rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {confirmAction.type === 'BLOCK' ? (
                  <>
                    <Ban className="w-4 h-4 text-red-600" />
                    <span>Chặn {confirmAction.user.name}?</span>
                  </>
                ) : (
                  <>
                    <UserMinus className="w-4 h-4 text-amber-600" />
                    <span>Hủy kết bạn với {confirmAction.user.name}?</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {confirmAction.type === 'BLOCK' ? (
              <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
                <p>
                  Khi bạn chặn <strong>{confirmAction.user.name}</strong>:
                </p>
                <ul className="space-y-1.5 list-disc pl-4 text-[11px]">
                  <li>
                    Người này sẽ <strong>không còn là bạn bè</strong> của bạn
                    (tự động hủy kết bạn).
                  </li>
                  <li>
                    Hai người sẽ{' '}
                    <strong>không thể trao đổi tin nhắn</strong> với nhau được
                    nữa.
                  </li>
                  <li>
                    Hai người sẽ{' '}
                    <strong>không xem được trang cá nhân</strong> của nhau.
                  </li>
                  <li>
                    Bình luận và lượt thích của họ trên trang cá nhân của bạn{' '}
                    <strong>không bị xóa</strong>, nhưng bạn sẽ không nhìn thấy
                    các bình luận đó.
                  </li>
                  <li>
                    Bạn có thể bỏ chặn và chặn lại bất kỳ lúc nào mà{' '}
                    <strong>không bị giới hạn thời gian</strong>.
                  </li>
                </ul>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    Ghi chú lý do chặn (tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="VD: Làm phiền, spam tin nhắn..."
                    className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#3A3B3C] border border-gray-200 dark:border-gray-700 text-xs"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Bạn có chắc chắn muốn xóa{' '}
                <strong>{confirmAction.user.name}</strong> khỏi danh sách bạn bè
                không? Số lượng bạn bè sẽ được cập nhật ngay lập tức.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmAction.type === 'BLOCK') {
                    blockUser(confirmAction.user.id, blockReason);
                  } else {
                    unfriendUser(confirmAction.user.id);
                  }
                  setConfirmAction(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white ${
                  confirmAction.type === 'BLOCK'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmAction.type === 'BLOCK'
                  ? 'Xác nhận Chặn'
                  : 'Xác nhận Hủy kết bạn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
