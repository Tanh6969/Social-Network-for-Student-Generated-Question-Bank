import React, { useEffect, useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import {
  BadgeCheck,
  Users,
  UserPlus,
  Shield,
  Search,
  MessageCircle,
  MoreHorizontal,
  UserMinus,
  Ban,
  Unlock,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  X,
  Clock,
  Sparkles,
  EyeOff,
} from 'lucide-react';
import { User } from '../../demo/types';

type FriendsMenuTab =
  'ALL' | 'REQUESTS' | 'SUGGESTIONS' | 'FOLLOWING' | 'BLOCKED';

const BLOCK_SEARCH_LIMIT = 6;

const GRID_CLASS =
  'grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 sm:gap-3';
const BTN_BASE =
  'w-full h-9 rounded-md text-sm font-semibold transition flex items-center justify-center gap-1.5';
const BTN_WIDE = `${BTN_BASE} px-2 sm:flex-1 sm:min-w-0`;
const BTN_COMPACT = `${BTN_BASE} px-3 sm:w-auto sm:shrink-0`;
const COLOR_SOFT = 'bg-fb-blue-soft hover:bg-fb-blue/20 text-fb-blue';
const COLOR_NEUTRAL = 'bg-fb-btn hover:bg-fb-btn-hover text-fb-text';
const BTN_PRIMARY = `${BTN_WIDE} bg-fb-blue hover:bg-fb-blue-hover text-white`;
const BTN_SOFT = `${BTN_WIDE} ${COLOR_SOFT}`;
const BTN_NEUTRAL = `${BTN_WIDE} ${COLOR_NEUTRAL}`;
const MENU_ITEM =
  'w-full px-3 py-2 text-left flex items-center gap-2 rounded-md transition';

const EmptyState: React.FC<{
  icon: React.ElementType;
  title: string;
  children?: React.ReactNode;
}> = ({ icon: Icon, title, children }) => (
  <div className="py-16 px-4 text-center space-y-3">
    <div className="w-20 h-20 mx-auto rounded-full bg-fb-btn flex items-center justify-center">
      <Icon className="w-9 h-9 text-fb-text-3" />
    </div>
    <p className="font-semibold text-body text-fb-text-2">{title}</p>
    {children}
  </div>
);

export const FriendsView: React.FC = () => {
  const {
    allUsers,
    friendsList,
    friendStatuses,
    getUserById,
    getFriendsOfUser,
    getMutualFriendsCount,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    unfriendUser,
    followingIds,
    followersIds,
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
    isPresenceVisible,
    setViewingUserId,
    setActiveTab,
    openChatDock,
    openReportModal,
    searchUsersOnApi,
  } = useApp();

  const [activeMenu, setActiveMenu] = useState<FriendsMenuTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'UNFRIEND' | 'BLOCK';
    user: User;
  } | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockSearch, setBlockSearch] = useState('');

  useEffect(() => {
    const query = searchTerm.trim();
    if (!query) return;
    const timer = window.setTimeout(() => {
      void searchUsersOnApi(query);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm, searchUsersOnApi]);

  useEffect(() => {
    const query = blockSearch.trim();
    if (!query) return;
    const timer = window.setTimeout(() => {
      void searchUsersOnApi(query);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [blockSearch, searchUsersOnApi]);

  // Các danh sách người dùng thực tế (loại trừ những người đang trong trạng thái chặn)
  const unblockedUsers = allUsers.filter((u) => !isBlockedEitherWay(u.id));

  const incomingRequests = unblockedUsers.filter(
    (u) => friendStatuses[u.id] === 'REQUEST_RECEIVED',
  );
  const sentRequests = unblockedUsers.filter(
    (u) => friendStatuses[u.id] === 'REQUEST_SENT',
  );
  const lecturersList = unblockedUsers.filter(
    (u) => u.role === 'LECTURER' || followingIds.includes(u.id),
  );
  const followersList = unblockedUsers.filter((u) =>
    followersIds.includes(u.id),
  );
  const suggestionsList = unblockedUsers.filter(
    (u) =>
      u.role !== 'LECTURER' &&
      (friendStatuses[u.id] || 'NONE') === 'NONE' &&
      !dismissedSuggestionIds.includes(u.id),
  );

  const userMatches = (u: User, query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.classOrTitle.toLowerCase().includes(q) ||
      u.faculty.toLowerCase().includes(q)
    );
  };
  const matchSearch = (u: User) => userMatches(u, searchTerm);

  const blockSearchTerm = blockSearch.trim();
  const blockCandidates = blockSearchTerm
    ? allUsers.filter(
        (u) => !isBlockedByMe(u.id) && userMatches(u, blockSearchTerm),
      )
    : [];

  const filteredFriends = friendsList.filter(matchSearch);
  const filteredIncoming = incomingRequests.filter(matchSearch);
  const filteredSent = sentRequests.filter(matchSearch);
  const filteredLecturers = lecturersList.filter(matchSearch);
  const filteredFollowers = followersList.filter(matchSearch);
  const filteredSuggestions = suggestionsList.filter(matchSearch);

  const trimmedSearch = searchTerm.trim();
  const noSearchResult = `Không tìm thấy kết quả cho "${trimmedSearch}"`;

  const handleOpenProfile = (userId: string) => {
    setViewingUserId(userId);
    setActiveTab('profile');
  };

  const selectMenu = (menu: FriendsMenuTab) => {
    setActiveMenu(menu);
    setOpenMenuUserId(null);
    window.scrollTo({ top: 0 });
  };

  const renderCardActions = (user: User) => {
    const status = friendStatuses[user.id] || 'NONE';

    if (user.role === 'LECTURER') {
      const isFollowing = followingIds.includes(user.id);
      return (
        <>
          <button
            type="button"
            onClick={() => toggleFollowUser(user.id)}
            className={isFollowing ? BTN_NEUTRAL : BTN_PRIMARY}
          >
            {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </button>
          <button
            type="button"
            onClick={() => openChatDock(user.id)}
            aria-label={`Nhắn tin cho ${user.name}`}
            title="Nhắn tin"
            className={`${BTN_COMPACT} ${COLOR_SOFT}`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="sm:hidden">Nhắn tin</span>
          </button>
        </>
      );
    }

    if (status === 'REQUEST_RECEIVED') {
      return (
        <>
          <button
            type="button"
            onClick={() => acceptFriendRequest(user.id)}
            className={BTN_PRIMARY}
          >
            Xác nhận
          </button>
          <button
            type="button"
            onClick={() => declineFriendRequest(user.id)}
            className={BTN_NEUTRAL}
          >
            Xóa
          </button>
        </>
      );
    }

    if (status === 'FRIEND') {
      return (
        <button
          type="button"
          onClick={() => openChatDock(user.id)}
          className={BTN_SOFT}
        >
          <MessageCircle className="w-4 h-4" /> Nhắn tin
        </button>
      );
    }

    if (status === 'REQUEST_SENT') {
      return (
        <button
          type="button"
          onClick={() => cancelFriendRequest(user.id)}
          className={BTN_NEUTRAL}
        >
          Hủy lời mời
        </button>
      );
    }

    return (
      <>
        <button
          type="button"
          onClick={() => sendFriendRequest(user.id)}
          className={BTN_SOFT}
        >
          <UserPlus className="w-4 h-4" /> Thêm bạn bè
        </button>
        <button
          type="button"
          onClick={() => dismissSuggestion(user.id)}
          className={`${BTN_COMPACT} ${COLOR_NEUTRAL}`}
        >
          Gỡ
        </button>
      </>
    );
  };

  const renderUserCard = (user: User) => {
    const isFriend = friendStatuses[user.id] === 'FRIEND';
    const mutualCount = getMutualFriendsCount(user.id);
    const mutualFriendIds = new Set(friendsList.map((f) => f.id));
    const mutualPreview = getFriendsOfUser(user.id)
      .filter((f) => mutualFriendIds.has(f.id))
      .slice(0, 2);
    const isMenuOpen = openMenuUserId === user.id;

    return (
      <article
        key={user.id}
        className="relative flex flex-col bg-fb-card rounded-lg shadow-fb-card"
      >
        <button
          type="button"
          onClick={() => handleOpenProfile(user.id)}
          aria-label={`Xem trang cá nhân của ${user.name}`}
          className="relative block aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-fb-input hover:opacity-90 transition-opacity"
        >
          <img
            src={user.avatar}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            style={{
              objectPosition: `${user.avatarCrop?.x ?? 50}% ${user.avatarCrop?.y ?? 25}%`,
              transform: `scale(${user.avatarCrop?.zoom ?? 1})`,
            }}
          />
          {user.isOnline && isPresenceVisible(user.id) && (
            <span
              className="absolute bottom-2 right-2 w-3.5 h-3.5 bg-fb-success ring-2 ring-fb-card rounded-full"
              title="Đang trực tuyến"
            />
          )}
        </button>

        {/* Menu tùy chọn */}
        <div className="absolute top-2 right-2">
          <button
            type="button"
            onClick={() => setOpenMenuUserId(isMenuOpen ? null : user.id)}
            aria-label={`Tùy chọn cho ${user.name}`}
            aria-expanded={isMenuOpen}
            className="w-8 h-8 rounded-full bg-fb-card/90 hover:bg-fb-card text-fb-text shadow-fb-card flex items-center justify-center transition"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpenMenuUserId(null)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 sm:w-52 bg-fb-card rounded-lg shadow-xl border border-fb-divider p-1 z-20 text-xs sm:text-sm font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuUserId(null);
                    handleOpenProfile(user.id);
                  }}
                  className={`${MENU_ITEM} hover:bg-fb-hover text-fb-text`}
                >
                  <Users className="w-4 h-4 shrink-0 text-fb-text-2" />
                  <span>Xem trang cá nhân</span>
                </button>

                {isFriend && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuUserId(null);
                      setConfirmAction({ type: 'UNFRIEND', user });
                    }}
                    className={`${MENU_ITEM} hover:bg-fb-hover text-fb-text`}
                  >
                    <UserMinus className="w-4 h-4 shrink-0 text-fb-text-2" />
                    <span>Hủy kết bạn</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuUserId(null);
                    openReportModal('NGƯỜI DÙNG', user.id, user.name);
                  }}
                  className={`${MENU_ITEM} hover:bg-fb-hover text-fb-text`}
                >
                  <Shield className="w-4 h-4 shrink-0 text-fb-text-2" />
                  <span>Báo cáo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuUserId(null);
                    setBlockReason('');
                    setConfirmAction({ type: 'BLOCK', user });
                  }}
                  className={`${MENU_ITEM} hover:bg-fb-danger-soft text-fb-danger`}
                >
                  <Ban className="w-4 h-4 shrink-0" />
                  <span>Chặn {user.name.split(' ').slice(-1)[0]}</span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col flex-1 p-3">
          <h3 className="flex items-center gap-1 text-body sm:text-card-title leading-tight font-semibold text-fb-text">
            <button
              type="button"
              onClick={() => handleOpenProfile(user.id)}
              title={user.name}
              className="truncate hover:underline"
            >
              {user.name}
            </button>
            {user.role === 'LECTURER' && (
              <span title="Giảng viên đã xác thực" className="shrink-0">
                <BadgeCheck className="w-4 h-4 text-fb-blue" />
              </span>
            )}
          </h3>
          <p
            className="mt-1 text-sm text-fb-text-2 truncate"
            title={`${user.classOrTitle} · ${user.faculty}`}
          >
            {user.classOrTitle} · {user.faculty}
          </p>

          <div className="mt-1 h-5 flex items-center gap-1.5 text-sm text-fb-text-2 min-w-0">
            {mutualCount > 0 && (
              <>
                <span className="flex -space-x-1.5 shrink-0">
                  {mutualPreview.map((friend) => (
                    <img
                      key={friend.id}
                      src={friend.avatar}
                      alt=""
                      loading="lazy"
                      className="w-4 h-4 rounded-full object-cover ring-1 ring-fb-card"
                    />
                  ))}
                </span>
                <span className="truncate">{mutualCount} bạn chung</span>
              </>
            )}
          </div>

          <div className="mt-auto pt-3 flex flex-col sm:flex-row gap-1.5">
            {renderCardActions(user)}
          </div>
        </div>
      </article>
    );
  };

  const renderSectionHeader = (title: string, count: number) => (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="text-lg sm:text-xl font-bold text-fb-text">
        {title}
        <span className="ml-2 font-normal text-fb-text-2 text-base">
          {count}
        </span>
      </h2>
    </div>
  );

  const menuItems: {
    id: FriendsMenuTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { id: 'ALL', label: 'Tất cả bạn bè', icon: Users },
    {
      id: 'REQUESTS',
      label: 'Lời mời kết bạn',
      icon: UserPlus,
      badge: incomingRequests.length,
    },
    { id: 'SUGGESTIONS', label: 'Gợi ý', icon: Sparkles },
    { id: 'FOLLOWING', label: 'Giảng viên', icon: GraduationCap },
    { id: 'BLOCKED', label: 'Danh sách đã chặn', icon: Ban },
  ];

  return (
    <div className="w-full flex flex-col lg:flex-row items-start">
      {/* ================= CỘT TRÁI: Menu điều hướng ================= */}
      <aside className="scrollbar-hover w-full lg:w-[320px] xl:w-[360px] shrink-0 select-none bg-fb-card shadow-fb-card lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto p-3 lg:p-2">
        <h1 className="hidden lg:block px-2 pt-2 pb-3 text-2xl font-bold text-fb-text">
          Bạn bè
        </h1>

        {activeMenu !== 'BLOCKED' && (
          <div className="relative mb-2 lg:mx-2">
            <Search className="w-4 h-4 text-fb-text-2 absolute left-3 top-2.5" />
            <input
              type="text"
              aria-label="Tìm bạn bè"
              placeholder="Tìm theo tên, lớp, khoa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-fb-input text-body rounded-full text-fb-text placeholder:text-fb-text-2 outline-none focus:ring-2 focus:ring-fb-blue/40"
            />
          </div>
        )}

        <nav
          aria-label="Mục bạn bè"
          className="flex lg:flex-col gap-1.5 lg:gap-0.5 overflow-x-auto [scrollbar-width:none]"
        >
          {menuItems.map(({ id, label, icon: Icon, badge }) => {
            const isActive = activeMenu === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectMenu(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`shrink-0 lg:w-full flex items-center gap-2 lg:gap-3 p-1.5 pr-3 lg:p-2 rounded-full lg:rounded-lg text-left transition ${
                  isActive
                    ? 'bg-fb-blue-soft lg:bg-fb-hover'
                    : 'hover:bg-fb-hover'
                }`}
              >
                <span
                  className={`w-7 h-7 lg:w-9 lg:h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-fb-blue text-white'
                      : 'bg-fb-btn text-fb-text'
                  }`}
                >
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                </span>
                <span className="lg:flex-1 text-sm lg:text-body font-semibold text-fb-text whitespace-nowrap">
                  {label}
                </span>
                {!!badge && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-fb-danger text-white text-xs font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
                <ChevronRight className="hidden lg:block w-5 h-5 text-fb-text-2 shrink-0" />
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ================= CỘT PHẢI: Nội dung chính ================= */}
      <main className="flex-1 min-w-0 w-full max-w-[1560px] px-3 sm:px-6 lg:px-8 py-4 space-y-6">
        {/* ================= TẤT CẢ BẠN BÈ ================= */}
        {activeMenu === 'ALL' && (
          <section>
            {renderSectionHeader('Tất cả bạn bè', friendsList.length)}
            {filteredFriends.length > 0 ? (
              <div className={GRID_CLASS}>
                {filteredFriends.map(renderUserCard)}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title={
                  trimmedSearch
                    ? noSearchResult
                    : 'Bạn chưa có người bạn nào trong danh sách'
                }
              >
                {!trimmedSearch && (
                  <button
                    type="button"
                    onClick={() => selectMenu('SUGGESTIONS')}
                    className="px-4 h-9 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-md text-sm font-semibold"
                  >
                    Tìm bạn bè gợi ý
                  </button>
                )}
              </EmptyState>
            )}
          </section>
        )}

        {/* ================= LỜI MỜI KẾT BẠN ================= */}
        {activeMenu === 'REQUESTS' && (
          <>
            <section>
              {renderSectionHeader('Lời mời kết bạn', filteredIncoming.length)}
              {filteredIncoming.length > 0 ? (
                <div className={GRID_CLASS}>
                  {filteredIncoming.map(renderUserCard)}
                </div>
              ) : (
                <EmptyState
                  icon={UserPlus}
                  title={
                    trimmedSearch
                      ? noSearchResult
                      : 'Không có lời mời kết bạn nào đang chờ xác nhận'
                  }
                />
              )}
            </section>

            {filteredSent.length > 0 && (
              <>
                <hr className="border-fb-divider" />
                <section>
                  {renderSectionHeader('Lời mời đã gửi', filteredSent.length)}
                  <div className={GRID_CLASS}>
                    {filteredSent.map(renderUserCard)}
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {/* ================= GỢI Ý KẾT BẠN ================= */}
        {activeMenu === 'SUGGESTIONS' && (
          <section>
            {renderSectionHeader(
              'Những người bạn có thể biết',
              filteredSuggestions.length,
            )}
            {filteredSuggestions.length > 0 ? (
              <div className={GRID_CLASS}>
                {filteredSuggestions.map(renderUserCard)}
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title={
                  trimmedSearch
                    ? noSearchResult
                    : 'Hiện không còn gợi ý kết bạn mới'
                }
              />
            )}
          </section>
        )}

        {/* ================= GIẢNG VIÊN & THEO DÕI ================= */}
        {activeMenu === 'FOLLOWING' && (
          <>
            <section>
              {renderSectionHeader('Giảng viên & Đang theo dõi', filteredLecturers.length)}
              {filteredLecturers.length > 0 ? (
                <div className={GRID_CLASS}>
                  {filteredLecturers.map(renderUserCard)}
                </div>
              ) : (
                <EmptyState
                  icon={GraduationCap}
                  title={
                    trimmedSearch
                      ? noSearchResult
                      : 'Không tìm thấy giảng viên nào'
                  }
                />
              )}
            </section>

            {filteredFollowers.length > 0 && (
              <>
                <hr className="border-fb-divider" />
                <section>
                  {renderSectionHeader(
                    'Người đang theo dõi bạn',
                    filteredFollowers.length,
                  )}
                  <div className={GRID_CLASS}>
                    {filteredFollowers.map(renderUserCard)}
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {/* ================= TAB 5: QUẢN LÝ DANH SÁCH ĐÃ CHẶN (SLIDE 24) ================= */}
        {activeMenu === 'BLOCKED' && (
          <div className="space-y-4 max-w-4xl">
            <h2 className="text-lg sm:text-xl font-bold text-fb-text">
              Danh sách đã chặn
              <span className="ml-2 font-normal text-fb-text-2 text-base">
                {blockedUsers.length}
              </span>
            </h2>

            {/* Thêm nhanh người vào danh sách chặn */}
            <div className="bg-fb-card rounded-lg border border-fb-divider p-4 space-y-3">
              <div>
                <h4 className="text-card-title font-semibold text-fb-text">
                  Chặn người dùng
                </h4>
                <p className="mt-0.5 text-sm text-fb-text-2">
                  Hai người sẽ tự động hủy kết bạn, không thể nhắn tin hay xem
                  trang cá nhân của nhau. Bình luận cũ của họ được ẩn với bạn
                  chứ không bị xóa.
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-fb-text-2 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  aria-label="Tìm người dùng để chặn"
                  placeholder="Nhập tên, lớp hoặc khoa..."
                  value={blockSearch}
                  onChange={(e) => setBlockSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-fb-input text-body rounded-full text-fb-text placeholder:text-fb-text-2 outline-none focus:ring-2 focus:ring-fb-blue/40"
                />
              </div>

              {blockSearchTerm &&
                (blockCandidates.length > 0 ? (
                  <ul className="divide-y divide-fb-divider -mx-1">
                    {blockCandidates.slice(0, BLOCK_SEARCH_LIMIT).map((u) => (
                      <li
                        key={u.id}
                        className="flex items-center gap-3 px-1 py-2"
                      >
                        <img
                          src={u.avatar}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-body font-semibold text-fb-text truncate">
                            {u.name}
                          </p>
                          <p className="text-sm text-fb-text-2 truncate">
                            {friendStatuses[u.id] === 'FRIEND' && 'Bạn bè · '}
                            {u.classOrTitle} · {u.faculty}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setBlockReason('');
                            setConfirmAction({ type: 'BLOCK', user: u });
                            setBlockSearch('');
                          }}
                          className="h-9 px-4 rounded-md bg-fb-danger-soft hover:bg-fb-danger hover:text-white text-fb-danger text-sm font-semibold transition shrink-0"
                        >
                          Chặn
                        </button>
                      </li>
                    ))}
                    {blockCandidates.length > BLOCK_SEARCH_LIMIT && (
                      <li className="px-1 pt-2 text-sm text-fb-text-2">
                        Còn {blockCandidates.length - BLOCK_SEARCH_LIMIT} người
                        khác, nhập cụ thể hơn để thu hẹp kết quả.
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="py-3 text-center text-sm text-fb-text-2">
                    Không tìm thấy người dùng nào khớp với “{blockSearchTerm}”.
                  </p>
                ))}
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
                    const blockedUser =
                      allUsers.find((u) => u.id === entry.userId) ??
                      getUserById(entry.userId);
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
                    Hai người sẽ <strong>không thể trao đổi tin nhắn</strong>{' '}
                    với nhau được nữa.
                  </li>
                  <li>
                    Hai người sẽ <strong>không xem được trang cá nhân</strong>{' '}
                    của nhau.
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
