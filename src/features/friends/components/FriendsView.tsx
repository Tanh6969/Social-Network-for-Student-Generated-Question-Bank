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
        className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 hover:bg-fb-hover/50 transition first:rounded-t-lg last:rounded-b-lg"
      >
        {/* Avatar + tên + chức danh */}
        <div className="flex items-center gap-3 min-w-0 flex-[3]">
          <div className="relative shrink-0">
            <AvatarWithFrame
              user={user}
              size="md"
              onClick={() => handleOpenProfile(user.id)}
            />
            {user.isOnline && (
              <span
                className="absolute bottom-0 right-0 w-3 h-3 bg-fb-success border-2 border-fb-card rounded-full"
                title="Đang trực tuyến"
              />
            )}
          </div>
          <div className="min-w-0">
            <h4
              onClick={() => handleOpenProfile(user.id)}
              className="font-bold text-sm text-fb-text hover:underline cursor-pointer truncate"
            >
              {user.name}
            </h4>
            <p className="text-xs text-fb-text-2 truncate">
              {user.classOrTitle}
              <span className="lg:hidden"> · {user.faculty}</span>
            </p>
          </div>
        </div>

        {/* Khoa + bạn chung (màn hình rộng) */}
        <div className="hidden lg:block min-w-0 flex-[2] text-xs">
          <p className="text-fb-text-2 truncate">{user.faculty}</p>
          {mutualCount > 0 && (
            <p className="mt-0.5 flex items-center gap-1 text-fb-text-3">
              <Users className="w-3 h-3 shrink-0" /> {mutualCount} bạn chung
            </p>
          )}
        </div>

        {/* Hành động */}
        <div className="flex items-center justify-end gap-1.5 shrink-0 lg:w-60">
          {user.role === 'LECTURER' ? (
            <>
              <button
                type="button"
                onClick={() => toggleFollowUser(user.id)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  isFollowing
                    ? 'bg-fb-blue-soft text-fb-blue hover:bg-fb-blue/20'
                    : 'bg-fb-blue hover:bg-fb-blue-hover text-white'
                }`}
              >
                {isFollowing ? '✓ Đang theo dõi' : '+ Theo dõi GV'}
              </button>
              <button
                type="button"
                onClick={() => openChatDock(user.id)}
                className="px-2.5 py-1.5 bg-fb-input hover:bg-fb-btn-hover text-fb-text rounded-lg text-xs font-semibold"
                title="Nhắn tin cho Giảng viên"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </>
          ) : status === 'REQUEST_RECEIVED' ? (
            <>
              <button
                type="button"
                onClick={() => acceptFriendRequest(user.id)}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold transition"
              >
                Xác nhận
              </button>
              <button
                type="button"
                onClick={() => declineFriendRequest(user.id)}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-fb-input hover:bg-fb-btn-hover text-fb-text rounded-lg text-xs font-semibold transition"
              >
                Xóa
              </button>
            </>
          ) : status === 'FRIEND' ? (
            <button
              type="button"
              onClick={() => openChatDock(user.id)}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-fb-blue-soft hover:bg-fb-blue/20 text-fb-blue rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Nhắn tin
            </button>
          ) : status === 'REQUEST_SENT' ? (
            <button
              type="button"
              onClick={() => cancelFriendRequest(user.id)}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-fb-input hover:bg-fb-btn-hover text-fb-text rounded-lg text-xs font-semibold transition"
            >
              Hủy lời mời đã gửi
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => sendFriendRequest(user.id)}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Thêm bạn bè
              </button>
              {activeMenu === 'SUGGESTIONS' && (
                <button
                  type="button"
                  onClick={() => dismissSuggestion(user.id)}
                  className="px-2.5 py-1.5 bg-fb-input hover:bg-fb-btn-hover text-fb-text-2 rounded-lg text-xs font-semibold"
                  title="Ẩn gợi ý này"
                >
                  Gỡ
                </button>
              )}
            </>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenMenuUserId(openMenuUserId === user.id ? null : user.id)
              }
              className="p-1.5 rounded-lg bg-fb-input hover:bg-fb-btn-hover text-fb-text-2 transition"
              title="Tùy chọn"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {openMenuUserId === user.id && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-fb-card rounded-lg shadow-xl border border-fb-divider py-1 z-20 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuUserId(null);
                    handleOpenProfile(user.id);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-fb-hover text-fb-text flex items-center gap-2"
                >
                  <Users className="w-3.5 h-3.5 text-fb-text-2" />
                  <span>Xem trang cá nhân</span>
                </button>

                {status === 'FRIEND' && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuUserId(null);
                      setConfirmAction({ type: 'UNFRIEND', user });
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-fb-warning-soft text-fb-warning flex items-center gap-2"
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
                  className="w-full px-3 py-2 text-left hover:bg-fb-hover text-fb-text flex items-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5 text-fb-text-2" />
                  <span>Báo cáo trang cá nhân</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuUserId(null);
                    setBlockReason('');
                    setConfirmAction({ type: 'BLOCK', user });
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-fb-danger-soft text-fb-danger font-semibold flex items-center gap-2 border-t border-fb-divider"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Chặn {user.name.split(' ').slice(-1)[0]}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
      {/* ================= CỘT TRÁI: Menu điều hướng Bạn bè & Chặn ================= */}
      <aside className="w-full lg:w-[300px] xl:w-[320px] shrink-0 space-y-3 select-none lg:sticky lg:top-18">
        <div className="bg-fb-card rounded-lg shadow-fb-card p-3">
          <h2 className="font-bold text-base text-fb-text px-2 mb-2">
            Bạn bè & Mối quan hệ
          </h2>

          <div className="space-y-1 text-xs font-semibold text-fb-text">
            <button
              type="button"
              onClick={() => setActiveMenu('ALL')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition text-left ${
                activeMenu === 'ALL'
                  ? 'bg-fb-blue-soft text-fb-blue font-bold'
                  : 'hover:bg-fb-hover'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-fb-blue" />
                <span>Tất cả bạn bè</span>
              </div>
              <span className="bg-fb-input text-fb-text text-xs px-2 py-0.5 rounded-full font-bold">
                {currentUser.friendsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu('REQUESTS')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition text-left ${
                activeMenu === 'REQUESTS'
                  ? 'bg-fb-blue-soft text-fb-blue font-bold'
                  : 'hover:bg-fb-hover'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-4 h-4 text-fb-success" />
                <span>Lời mời kết bạn</span>
              </div>
              {incomingRequests.length > 0 ? (
                <span className="bg-fb-blue text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {incomingRequests.length}
                </span>
              ) : (
                <span className="text-xs text-fb-text-3">0</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu('SUGGESTIONS')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition text-left ${
                activeMenu === 'SUGGESTIONS'
                  ? 'bg-fb-blue-soft text-fb-blue font-bold'
                  : 'hover:bg-fb-hover'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-fb-warning" />
                <span>Gợi ý cùng khoa / lớp</span>
              </div>
              <span className="text-xs text-fb-text-3">
                {suggestionsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu('FOLLOWING')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition text-left ${
                activeMenu === 'FOLLOWING'
                  ? 'bg-fb-blue-soft text-fb-blue font-bold'
                  : 'hover:bg-fb-hover'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserCheck className="w-4 h-4 text-fb-blue" />
                <span>Đang theo dõi Giảng viên</span>
              </div>
              <span className="text-xs text-fb-text-3">
                {
                  lecturersList.filter((u) => followingIds.includes(u.id))
                    .length
                }
              </span>
            </button>

            <div className="pt-1 mt-1 border-t border-fb-divider">
              <button
                type="button"
                onClick={() => setActiveMenu('BLOCKED')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition text-left ${
                  activeMenu === 'BLOCKED'
                    ? 'bg-fb-danger-soft text-fb-danger font-bold'
                    : 'hover:bg-fb-hover text-fb-text'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Ban className="w-4 h-4 text-fb-danger" />
                  <span>Danh sách đã chặn</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    blockedUsers.length > 0
                      ? 'bg-fb-danger text-white'
                      : 'bg-fb-input text-fb-text-2'
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
      <main className="flex-1 min-w-0 space-y-4 w-full">
        {/* Thanh tìm kiếm & tổng quan */}
        <div className="bg-fb-card rounded-lg shadow-fb-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-fb-text">
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
            <p className="text-xs text-fb-text-2 mt-0.5">
              {activeMenu === 'BLOCKED'
                ? 'Chặn và bỏ chặn bất kỳ ai không giới hạn thời gian chờ (chuẩn đặc tả Slide 24).'
                : 'Kết nối bạn bè cùng lớp, trao đổi câu hỏi ôn tập và theo dõi giảng viên bộ môn.'}
            </p>
          </div>

          {activeMenu !== 'BLOCKED' && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-fb-text-3 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm theo tên, lớp, khoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-fb-input text-xs rounded-full border border-fb-divider text-fb-text"
              />
            </div>
          )}
        </div>

        {/* ================= TAB 1: TẤT CẢ BẠN BÈ ================= */}
        {activeMenu === 'ALL' && (
          <>
            {filteredFriends.length > 0 ? (
              <div className="bg-fb-card rounded-lg shadow-fb-card divide-y divide-fb-divider">
                {filteredFriends.map(renderUserCard)}
              </div>
            ) : (
              <div className="bg-fb-card rounded-lg border border-fb-divider p-10 text-center space-y-3">
                <Users className="w-10 h-10 text-fb-text-3 mx-auto" />
                <p className="font-bold text-sm text-fb-text">
                  {searchTerm
                    ? `Không tìm thấy người bạn nào khớp với "${searchTerm}"`
                    : 'Bạn chưa có người bạn nào trong danh sách'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveMenu('SUGGESTIONS')}
                  className="px-4 py-2 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold"
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
              <h4 className="font-bold text-xs text-fb-text-2 px-1">
                Lời mời kết bạn nhận được ({filteredIncoming.length})
              </h4>
              {filteredIncoming.length > 0 ? (
                <div className="bg-fb-card rounded-lg shadow-fb-card divide-y divide-fb-divider">
                  {filteredIncoming.map(renderUserCard)}
                </div>
              ) : (
                <div className="bg-fb-card rounded-lg border border-fb-divider p-6 text-center text-xs text-fb-text-2">
                  Không có lời mời kết bạn nào đang chờ xác nhận.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs text-fb-text-2 px-1">
                Lời mời bạn đã gửi ({filteredSent.length})
              </h4>
              {filteredSent.length > 0 ? (
                <div className="bg-fb-card rounded-lg shadow-fb-card divide-y divide-fb-divider">
                  {filteredSent.map(renderUserCard)}
                </div>
              ) : (
                <div className="bg-fb-card rounded-lg border border-fb-divider p-6 text-center text-xs text-fb-text-2">
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
              <div className="bg-fb-card rounded-lg shadow-fb-card divide-y divide-fb-divider">
                {filteredSuggestions.map(renderUserCard)}
              </div>
            ) : (
              <div className="bg-fb-card rounded-lg border border-fb-divider p-10 text-center text-xs text-fb-text-2">
                Hiện không còn gợi ý kết bạn mới.
              </div>
            )}
          </>
        )}

        {/* ================= TAB 4: ĐANG THEO DÕI GIẢNG VIÊN ================= */}
        {activeMenu === 'FOLLOWING' && (
          <>
            {filteredLecturers.length > 0 ? (
              <div className="bg-fb-card rounded-lg shadow-fb-card divide-y divide-fb-divider">
                {filteredLecturers.map(renderUserCard)}
              </div>
            ) : (
              <div className="bg-fb-card rounded-lg border border-fb-divider p-10 text-center text-xs text-fb-text-2">
                Không tìm thấy giảng viên nào.
              </div>
            )}
          </>
        )}

        {/* ================= TAB 5: QUẢN LÝ DANH SÁCH ĐÃ CHẶN (SLIDE 24) ================= */}
        {activeMenu === 'BLOCKED' && (
          <div className="space-y-4">
            {/* Thêm nhanh người vào danh sách chặn */}
            <div className="bg-fb-card rounded-lg border border-fb-divider p-4 space-y-3">
              <h4 className="font-bold text-xs text-fb-text flex items-center gap-2">
                <Ban className="w-4 h-4 text-fb-danger" />
                <span>Thêm người dùng vào danh sách chặn</span>
              </h4>
              <p className="text-xs text-fb-text-2">
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
                  className="flex-1 bg-fb-input border border-fb-divider rounded-lg px-3 py-2 text-xs text-fb-text"
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
                  className="px-4 py-2 bg-fb-danger hover:bg-fb-danger/90 disabled:bg-fb-divider text-white rounded-lg text-xs font-bold transition shrink-0"
                >
                  Chặn người dùng
                </button>
              </div>
            </div>

            {/* Danh sách các đối tượng đang bị bạn chặn */}
            <div className="bg-fb-card rounded-lg border border-fb-divider p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-fb-divider pb-3">
                <h4 className="font-bold text-sm text-fb-text">
                  Danh sách người bạn đang chặn ({blockedUsers.length})
                </h4>
                <span className="text-xs text-fb-success font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Bỏ chặn & chặn lại
                  không giới hạn thời gian
                </span>
              </div>

              {blockedUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-fb-text-2 space-y-1">
                  <Shield className="w-8 h-8 text-fb-text-3 mx-auto mb-1" />
                  <p className="font-semibold text-fb-text">
                    Danh sách chặn đang trống
                  </p>
                  <p>Bạn hiện không chặn bất kỳ người dùng nào.</p>
                </div>
              ) : (
                <div className="divide-y divide-fb-divider">
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
                              <span className="font-bold text-xs text-fb-text">
                                {blockedUser.name}
                              </span>
                              <span className="text-xs bg-fb-danger-soft text-fb-danger px-2 py-0.5 rounded-full font-bold">
                                Đã chặn
                              </span>
                            </div>
                            <p className="text-xs text-fb-text-2">
                              {blockedUser.classOrTitle} · {blockedUser.faculty}
                            </p>
                            <p className="text-xs text-fb-text-3 flex items-center gap-1 mt-0.5">
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
                            className="px-3 py-1.5 bg-fb-input hover:bg-fb-btn-hover text-fb-text rounded-lg text-xs font-semibold transition"
                          >
                            Kiểm tra trang cá nhân
                          </button>
                          <button
                            type="button"
                            onClick={() => unblockUser(blockedUser.id)}
                            className="px-3.5 py-1.5 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
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
            <div className="bg-fb-warning-soft/60 rounded-lg border border-fb-warning/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-fb-warning flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4" />
                    <span>
                      Chế độ kiểm thử chiều ngược lại: Mô phỏng người khác chặn
                      bạn ({blockedByOtherIds.length})
                    </span>
                  </h4>
                  <p className="text-xs text-fb-warning/80 mt-0.5">
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
                      className="flex items-center justify-between p-2.5 rounded-lg bg-fb-card border border-fb-divider text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                        <span className="font-semibold truncate text-fb-text">
                          {u.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSimulatedBlockedByOther(u.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition ${
                          blockingMe
                            ? 'bg-fb-danger text-white'
                            : 'bg-fb-input text-fb-text-2 hover:bg-fb-btn-hover'
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
          <div className="bg-fb-card rounded-lg max-w-md w-full p-5 shadow-2xl border border-fb-divider space-y-4">
            <div className="flex items-center justify-between border-b border-fb-divider pb-3">
              <h3 className="font-bold text-sm text-fb-text flex items-center gap-2">
                {confirmAction.type === 'BLOCK' ? (
                  <>
                    <Ban className="w-4 h-4 text-fb-danger" />
                    <span>Chặn {confirmAction.user.name}?</span>
                  </>
                ) : (
                  <>
                    <UserMinus className="w-4 h-4 text-fb-warning" />
                    <span>Hủy kết bạn với {confirmAction.user.name}?</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="p-1 rounded-full hover:bg-fb-hover"
              >
                <X className="w-4 h-4 text-fb-text-2" />
              </button>
            </div>

            {confirmAction.type === 'BLOCK' ? (
              <div className="space-y-3 text-xs text-fb-text-2">
                <p>
                  Khi bạn chặn <strong>{confirmAction.user.name}</strong>:
                </p>
                <ul className="space-y-1.5 list-disc pl-4 text-xs">
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
                  <label className="block text-xs font-semibold text-fb-text-2 mb-1">
                    Ghi chú lý do chặn (tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="VD: Làm phiền, spam tin nhắn..."
                    className="w-full px-3 py-2 rounded-lg bg-fb-input border border-fb-divider text-xs"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-fb-text-2">
                Bạn có chắc chắn muốn xóa{' '}
                <strong>{confirmAction.user.name}</strong> khỏi danh sách bạn bè
                không? Số lượng bạn bè sẽ được cập nhật ngay lập tức.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-fb-input text-fb-text hover:bg-fb-btn-hover"
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
                className={`px-4 py-2 rounded-lg text-xs font-bold text-white ${
                  confirmAction.type === 'BLOCK'
                    ? 'bg-fb-danger hover:bg-fb-danger/90'
                    : 'bg-fb-warning hover:bg-fb-warning/90'
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
