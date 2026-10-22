import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import { PostContent } from '../../feed/components/PostContent';
import { PostMediaGallery } from '../../feed/components/PostMediaGallery';
import { CommentList } from '../../feed/components/CommentList';
import {
  MediaLightbox,
  type LightboxItem,
} from '../../../shared/components/MediaLightbox';
import { ProfilePhotoEditor, type PhotoOption } from './ProfilePhotoEditor';
import { ProfilePhotoLibrary } from './ProfilePhotoLibrary';
import { formatPostTime } from '../../feed/postUtils';
import {
  Camera,
  Edit,
  Sparkles,
  Users,
  MessageCircle,
  UserPlus,
  UserCheck,
  UserMinus,
  ShieldAlert,
  Ban,
  Unlock,
  Search,
  ThumbsUp,
  ArrowLeft,
  Flag,
} from 'lucide-react';
import { User } from '../../demo/types';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    viewingUserId,
    setViewingUserId,
    getUserById,
    getFriendsOfUser,
    getMutualFriendsCount,
    posts,
    toggleLikePost,
    friendStatuses,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    unfriendUser,
    blockUser,
    unblockUser,
    toggleSimulatedBlockedByOther,
    isBlockedByMe,
    isBlockingMe,
    isBlockedEitherWay,
    filterVisibleComments,
    openPostComposer,
    deletePost,
    setActivePostDetail,
    openPostMedia,
    questions,
    setActiveQuizQuestion,
    setActiveTab,
    openChatDock,
    showToast,
    openReportModal,
    updateCurrentUser,
    profilePhotoHistory,
    saveProfilePhoto,
  } = useApp();

  const [activeTab, setActiveTabLocal] = useState<
    'POSTS' | 'ABOUT' | 'PHOTOS' | 'QUESTIONS' | 'FRIENDS'
  >('POSTS');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(currentUser.bio);
  const [profileMedia, setProfileMedia] = useState<'avatar' | 'cover' | null>(
    null,
  );
  const [editorKind, setEditorKind] = useState<'avatar' | 'cover' | null>(null);
  const [galleryPreview, setGalleryPreview] = useState<{
    items: LightboxItem[];
    index: number;
  } | null>(null);
  const [friendSearch, setFriendSearch] = useState('');
  const [showConfirmBlock, setShowConfirmBlock] = useState(false);
  const [showConfirmUnfriend, setShowConfirmUnfriend] = useState<User | null>(
    null,
  );

  const targetUser: User = viewingUserId
    ? getUserById(viewingUserId)
    : currentUser;
  const isMe = targetUser.id === currentUser.id;

  // Slide 24: "Việc chặn một người sẽ khiến hai người không xem được trang cá nhân của nhau."
  if (!isMe && isBlockedEitherWay(targetUser.id)) {
    const blockedByMe = isBlockedByMe(targetUser.id);
    return (
      <div className="max-w-[680px] mx-auto py-12 px-4">
        <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
            <Ban className="w-8 h-8" />
          </div>

          <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">
            {blockedByMe
              ? `Bạn đã chặn ${targetUser.name}`
              : 'Trang cá nhân này hiện không khả dụng'}
          </h2>

          <p className="text-xs text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
            {blockedByMe
              ? `Theo chính sách chặn người dùng (Slide 24), khi bạn chặn ${targetUser.name}, hai người đã tự động hủy kết bạn, không thể trao đổi tin nhắn và không thể xem trang cá nhân của nhau.`
              : `${targetUser.name} đã chặn bạn hoặc hạn chế quyền truy cập trang cá nhân. Hai người không thể xem trang cá nhân hoặc nhắn tin cho nhau.`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setViewingUserId(currentUser.id);
              }}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 text-gray-700 dark:text-gray-200 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về trang cá nhân của tôi</span>
            </button>

            {blockedByMe ? (
              <button
                type="button"
                onClick={() => unblockUser(targetUser.id)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Unlock className="w-4 h-4" />
                <span>Bỏ chặn {targetUser.name} ngay</span>
              </button>
            ) : (
              isBlockingMe(targetUser.id) && (
                <button
                  type="button"
                  onClick={() => toggleSimulatedBlockedByOther(targetUser.id)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition"
                >
                  Tắt mô phỏng bị {targetUser.name} chặn
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  const targetFriends = getFriendsOfUser(targetUser.id);
  const filteredTargetFriends = targetFriends.filter((fr) => {
    const q = friendSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      fr.name.toLowerCase().includes(q) ||
      fr.classOrTitle.toLowerCase().includes(q) ||
      fr.faculty.toLowerCase().includes(q)
    );
  });

  const relationWithTarget = friendStatuses[targetUser.id] || 'NONE';

  const userPosts = posts
    .filter(
      (post) =>
        post.author.id === targetUser.id &&
        (isMe ||
          post.privacy === 'PUBLIC' ||
          (post.privacy === 'FRIENDS' &&
            friendStatuses[targetUser.id] === 'FRIEND')),
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const userQuestions = questions.filter(
    (q) => q.creatorId === targetUser.id && q.status === 'APPROVED',
  );
  const photoHistory = profilePhotoHistory.filter(
    (photo) => photo.userId === targetUser.id,
  );
  const avatarPhotos = [
    {
      id: 'avatar-current',
      url: targetUser.avatar,
      alt: 'Ảnh đại diện hiện tại',
      crop: targetUser.avatarCrop,
    },
    ...photoHistory
      .filter((photo) => photo.kind === 'avatar')
      .map((photo) => ({
        id: photo.id,
        url: photo.url,
        alt: 'Ảnh đại diện cũ',
        crop: photo.crop,
      })),
  ];
  const coverPhotos = [
    {
      id: 'cover-current',
      url: targetUser.coverImage,
      alt: 'Ảnh bìa hiện tại',
      crop: targetUser.coverCrop,
    },
    ...photoHistory
      .filter((photo) => photo.kind === 'cover')
      .map((photo) => ({
        id: photo.id,
        url: photo.url,
        alt: 'Ảnh bìa cũ',
        crop: photo.crop,
      })),
  ];
  const postPhotos = userPosts
    .filter((post) => post.type !== 'VIDEO')
    .flatMap((post) =>
      (post.mediaUrls ?? []).map((url, index) => ({
        id: `${post.id}-${index}`,
        url,
        alt: `Ảnh từ bài viết của ${targetUser.name}`,
        post,
        index,
      })),
    );
  const photoOptions: PhotoOption[] = [
    ...postPhotos,
    ...avatarPhotos,
    ...coverPhotos,
  ];

  const openPhotoGroup = (photos: PhotoOption[], index: number) => {
    setGalleryPreview({
      items: photos.map((photo) => ({
        src: photo.url,
        kind: 'image',
        alt: photo.alt,
      })),
      index,
    });
  };

  const handleSaveBio = () => {
    updateCurrentUser({ bio: bioInput });
    setIsEditingBio(false);
  };

  return (
    <div className="max-w-[1000px] mx-auto pb-10">
      {/* ================= HEADER BÌA + AVATAR (Facebook Style) ================= */}
      <div className="bg-white dark:bg-[#242526] rounded-b-2xl shadow-xs border-b border-gray-200 dark:border-gray-700">
        {/* Cover Photo */}
        <div className="relative h-64 sm:h-80 w-full bg-gray-200 dark:bg-gray-800 rounded-b-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setProfileMedia('cover')}
            aria-label="Xem ảnh bìa"
            className="h-full w-full"
          >
            <img
              src={targetUser.coverImage}
              alt="Ảnh bìa"
              className="h-full w-full object-cover object-center"
              style={{
                objectPosition: `${targetUser.coverCrop?.x ?? 50}% ${targetUser.coverCrop?.y ?? 50}%`,
                transform: `scale(${targetUser.coverCrop?.zoom ?? 1})`,
              }}
            />
          </button>
          {isMe && (
            <button
              type="button"
              onClick={() => setEditorKind('cover')}
              className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/60 hover:bg-white text-gray-800 dark:text-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Chỉnh sửa ảnh bìa</span>
            </button>
          )}
        </div>

        {/* Profile Info Row */}
        <div className="relative px-6 pb-4 pt-20 sm:pt-8">
          <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 sm:left-6 sm:-top-4 sm:translate-x-0">
            <button
              type="button"
              onClick={() => setProfileMedia('avatar')}
              aria-label="Xem ảnh đại diện"
            >
              <AvatarWithFrame
                user={targetUser}
                size="2xl"
                className="ring-4 ring-white dark:ring-[#242526]"
              />
            </button>
            {isMe && (
              <button
                type="button"
                onClick={() => setEditorKind('avatar')}
                aria-label="Đổi ảnh đại diện"
                className="absolute bottom-0 right-0 rounded-full bg-white p-2 text-gray-800 shadow-md hover:bg-gray-100 dark:bg-[#3A3B3C] dark:text-white"
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center justify-between gap-4 text-center sm:ml-28 sm:flex-row sm:items-end sm:text-left">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                  {targetUser.name}
                </h1>
              </div>

              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                {targetUser.classOrTitle} · {targetUser.faculty}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-gray-500 mt-1">
                <button
                  type="button"
                  onClick={() => setActiveTabLocal('FRIENDS')}
                  className="hover:underline cursor-pointer"
                >
                  <strong>{targetUser.friendsCount}</strong> bạn bè
                </button>
                <span>·</span>
                <span>
                  <strong>{targetUser.approvedQuestionsCount}</strong> câu hỏi
                  được duyệt
                </span>
                <span>·</span>
                <span className="text-amber-600 font-bold">
                  {targetUser.points} điểm cống hiến
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
              {isMe ? (
                <>
                  <button
                    type="button"
                    onClick={() => openPostComposer()}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Tạo bài viết
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cosmetics')}
                    className="px-4 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold hover:bg-purple-100 transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Kho vật phẩm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingBio(true)}
                    className="px-4 py-2 bg-gray-100 dark:bg-[#3A3B3C] text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold hover:bg-gray-200 transition flex items-center gap-1.5"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Chỉnh sửa tiểu sử</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Nút kết bạn / trạng thái bạn bè thật */}
                  {relationWithTarget === 'FRIEND' ? (
                    <button
                      type="button"
                      onClick={() => setShowConfirmUnfriend(targetUser)}
                      className="px-4 py-2 bg-gray-100 dark:bg-[#3A3B3C] hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-800 dark:text-gray-200 hover:text-red-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      title="Nhấn để hủy kết bạn"
                    >
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>Bạn bè (Hủy kết bạn)</span>
                    </button>
                  ) : relationWithTarget === 'REQUEST_SENT' ? (
                    <button
                      type="button"
                      onClick={() => cancelFriendRequest(targetUser.id)}
                      className="px-4 py-2 bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition"
                    >
                      Hủy lời mời kết bạn
                    </button>
                  ) : relationWithTarget === 'REQUEST_RECEIVED' ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => acceptFriendRequest(targetUser.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
                      >
                        Chấp nhận kết bạn
                      </button>
                      <button
                        type="button"
                        onClick={() => declineFriendRequest(targetUser.id)}
                        className="px-3 py-2 bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold"
                      >
                        Xóa lời mời
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendFriendRequest(targetUser.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Thêm bạn bè</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openChatDock(targetUser.id)}
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Nhắn tin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openReportModal(
                        'NGƯỜI DÙNG',
                        targetUser.id,
                        targetUser.name,
                      )
                    }
                    className="p-2 text-gray-500 hover:text-amber-600 border border-gray-200 dark:border-gray-700 rounded-xl transition"
                    title="Báo cáo người dùng"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowConfirmBlock(true)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    title="Chặn người dùng này"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Chặn</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sticky Tab Bar */}
          <div
            role="tablist"
            aria-label="Mục hồ sơ"
            className="flex overflow-x-auto border-t border-gray-100 dark:border-gray-700 mt-4 text-xs font-bold text-gray-600 dark:text-gray-300"
          >
            {[
              { id: 'POSTS', label: 'Bài viết' },
              { id: 'ABOUT', label: 'Giới thiệu' },
              { id: 'PHOTOS', label: 'Ảnh' },
              {
                id: 'QUESTIONS',
                label: `Câu hỏi đã đóng góp (${userQuestions.length})`,
              },
              { id: 'FRIENDS', label: `Bạn bè (${targetUser.friendsCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTabLocal(tab.id as typeof activeTab)}
                className={`shrink-0 py-3 px-4 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#3A3B3C]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'PHOTOS' && (
        <ProfilePhotoLibrary
          avatarPhotos={avatarPhotos}
          coverPhotos={coverPhotos}
          postPhotos={postPhotos}
          canAdd={isMe}
          onAdd={() => openPostComposer()}
          onOpenProfilePhoto={(kind, index) =>
            openPhotoGroup(
              kind === 'avatar' ? avatarPhotos : coverPhotos,
              index,
            )
          }
          onOpenPostPhoto={(post, index) => openPostMedia(post, index)}
        />
      )}

      {/* ================= TAB BẠN BÈ ĐẦY ĐỦ (NHƯ THẬT) ================= */}
      {activeTab === 'FRIENDS' && (
        <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-5 mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                Bạn bè của {targetUser.name} ({targetUser.friendsCount})
              </h3>
              <p className="text-xs text-gray-500">
                Danh sách bạn bè thực tế và đồng bộ số lượng theo thời gian thực
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2" />
                <input
                  type="text"
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  placeholder="Tìm bạn bè..."
                  className="pl-9 pr-3 py-1.5 bg-gray-100 dark:bg-[#3A3B3C] rounded-full text-xs border border-gray-200 dark:border-gray-700"
                />
              </div>
              {isMe && (
                <button
                  type="button"
                  onClick={() => setActiveTab('friends')}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 transition"
                >
                  Lời mời & Quản lý chặn
                </button>
              )}
            </div>
          </div>

          {filteredTargetFriends.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-500 space-y-2">
              <Users className="w-10 h-10 text-gray-400 mx-auto" />
              <p className="font-semibold text-gray-700 dark:text-gray-300">
                {friendSearch
                  ? `Không tìm thấy người bạn nào khớp với "${friendSearch}"`
                  : 'Chưa có bạn bè nào trong danh sách'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTargetFriends.map((fr) => {
                const isFriendMe = fr.id === currentUser.id;
                const myStatusWithFr = friendStatuses[fr.id] || 'NONE';
                const mutual = getMutualFriendsCount(fr.id);

                return (
                  <div
                    key={fr.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50/60 dark:hover:bg-[#3A3B3C]/40 transition"
                  >
                    <div
                      onClick={() => {
                        setViewingUserId(fr.id);
                        setActiveTabLocal('POSTS');
                      }}
                      className="flex items-center gap-3 min-w-0 cursor-pointer"
                    >
                      <img
                        src={fr.avatar}
                        alt={fr.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:underline truncate">
                          {fr.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 truncate">
                          {fr.classOrTitle} · {fr.faculty}
                        </p>
                        {!isFriendMe && mutual > 0 && (
                          <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                            {mutual} bạn chung
                          </p>
                        )}
                      </div>
                    </div>

                    {!isFriendMe && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {myStatusWithFr === 'FRIEND' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openChatDock(fr.id)}
                              className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 hover:bg-blue-100 transition"
                              title="Nhắn tin"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowConfirmUnfriend(fr)}
                              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#3A3B3C] hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-700 dark:text-gray-200 hover:text-red-600 text-xs font-semibold flex items-center gap-1 transition"
                              title="Hủy kết bạn"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              <span>Hủy kết bạn</span>
                            </button>
                          </>
                        ) : myStatusWithFr === 'REQUEST_SENT' ? (
                          <button
                            type="button"
                            onClick={() => cancelFriendRequest(fr.id)}
                            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-200 text-xs font-semibold"
                          >
                            Hủy lời mời
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => sendFriendRequest(fr.id)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Thêm bạn</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= 2 CỘT DƯỚI ================= */}
      {activeTab !== 'PHOTOS' && activeTab !== 'FRIENDS' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4 px-2 sm:px-0">
          {/* CỘT TRÁI (360px): Giới thiệu & Bạn bè (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            {/* Bio card */}
            <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                Giới thiệu
              </h3>

              {isEditingBio ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="w-full p-2 text-xs border rounded-lg bg-gray-50 dark:bg-[#3A3B3C]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingBio(false)}
                      className="px-3 py-1 text-xs border rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBio}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg font-bold"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic text-center">
                  "{targetUser.bio || 'Chưa cập nhật tiểu sử.'}"
                </p>
              )}

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <p>
                  🎓 Đang học tại: <strong>{targetUser.faculty}</strong>
                </p>
                <p>
                  📌 Lớp sinh hoạt: <strong>{targetUser.classOrTitle}</strong>
                </p>
                <p>
                  ✉️ Email trường: <strong>{targetUser.email}</strong>
                </p>
              </div>
            </div>

            {/* Khung Bạn bè thực tế (9 người đầu) */}
            <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    Bạn bè
                  </h3>
                  <span className="text-xs text-gray-500">
                    {targetUser.friendsCount} người bạn
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTabLocal('FRIENDS')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Xem tất cả bạn bè
                </button>
              </div>

              {targetFriends.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">
                  Chưa có bạn bè nào.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  {targetFriends.slice(0, 9).map((fr) => (
                    <div
                      key={fr.id}
                      onClick={() => {
                        setViewingUserId(fr.id);
                        setActiveTabLocal('POSTS');
                      }}
                      className="cursor-pointer group"
                    >
                      <img
                        src={fr.avatar}
                        alt={fr.name}
                        className="w-full h-22 rounded-lg object-cover group-hover:opacity-90 transition"
                      />
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 block truncate mt-1">
                        {fr.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: Dòng thời gian bài viết & câu hỏi (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            {activeTab === 'POSTS' && (
              <>
                {userPosts.map((post) => {
                  const visibleComments = filterVisibleComments(post.comments);
                  return (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <AvatarWithFrame user={post.author} size="md" />
                          <div>
                            <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100">
                              {post.author.name}
                            </h4>
                            <span className="text-[10px] text-gray-400">
                              {formatPostTime(post.createdAt)}
                            </span>
                          </div>
                        </div>
                        {isMe ? (
                          <div className="flex gap-3 text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => openPostComposer(post.id)}
                              className="text-blue-600 hover:underline"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Xóa bài viết này?'))
                                  deletePost(post.id);
                              }}
                              className="text-red-600 hover:underline"
                            >
                              Xóa
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              openReportModal(
                                'BÀI VIẾT',
                                post.id,
                                post.content.slice(0, 40),
                              )
                            }
                            className="text-xs font-semibold text-gray-500 hover:text-red-600 flex items-center gap-1"
                            title="Báo cáo bài viết này"
                          >
                            <Flag className="w-3.5 h-3.5" />
                            <span>Báo cáo</span>
                          </button>
                        )}
                      </div>

                      {post.content.trim() && (
                        <PostContent
                          key={post.id}
                          content={post.content}
                          compact
                        />
                      )}
                      {post.mediaUrls?.length ? (
                        <PostMediaGallery
                          urls={post.mediaUrls}
                          isVideo={post.type === 'VIDEO'}
                          onOpen={(index) => openPostMedia(post, index)}
                        />
                      ) : null}

                      {/* Lượt thích giữ nguyên kể cả khi chặn (Slide 24), bình luận của người bị chặn được ẩn */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
                        <button
                          type="button"
                          onClick={() => toggleLikePost(post.id)}
                          className={`flex items-center gap-1.5 font-semibold ${
                            post.isLiked ? 'text-blue-600' : 'hover:text-blue-600'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{post.likesCount} lượt thích</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivePostDetail(post)}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          {visibleComments.reduce(
                            (sum, c) => sum + 1 + (c.replies?.length ?? 0),
                            0,
                          )}{' '}
                          bình luận hiển thị · Xem chi tiết
                        </button>
                      </div>

                      {visibleComments.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                          <CommentList
                            comments={visibleComments}
                            limit={2}
                            onReply={() => setActivePostDetail(post)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {activeTab === 'QUESTIONS' && (
              <div className="space-y-3">
                {userQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-2"
                  >
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-blue-600">
                        {q.subject}
                      </span>
                      <span className="text-emerald-600 font-bold">
                        ✓ Đã phê duyệt
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {q.content}
                    </p>
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveQuizQuestion(q)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold"
                      >
                        Làm thử câu này
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal xác nhận hủy kết bạn */}
      {showConfirmUnfriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-[#242526] rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
              Hủy kết bạn với {showConfirmUnfriend.name}?
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Bạn có chắc chắn muốn xóa{' '}
              <strong>{showConfirmUnfriend.name}</strong> khỏi danh sách bạn bè?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmUnfriend(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-[#3A3B3C]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  unfriendUser(showConfirmUnfriend.id);
                  setShowConfirmUnfriend(null);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Xác nhận xóa bạn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận chặn người dùng từ trang cá nhân */}
      {showConfirmBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-[#242526] rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Ban className="w-4 h-4 text-red-600" />
              <span>Chặn {targetUser.name}?</span>
            </h3>
            <ul className="space-y-1.5 list-disc pl-4 text-xs text-gray-600 dark:text-gray-300">
              <li>
                <strong>{targetUser.name}</strong> sẽ không còn là bạn bè của
                bạn.
              </li>
              <li>
                Hai người sẽ không thể nhắn tin hoặc xem trang cá nhân của nhau.
              </li>
              <li>
                Bình luận và lượt thích của họ trên trang cá nhân của bạn không
                bị xóa, nhưng bạn sẽ không thấy các bình luận đó.
              </li>
              <li>
                Bạn có thể bỏ chặn và chặn lại bất kỳ lúc nào mà không bị giới
                hạn thời gian.
              </li>
            </ul>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmBlock(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-[#3A3B3C]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  blockUser(targetUser.id, 'Chặn từ trang cá nhân');
                  setShowConfirmBlock(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Chặn {targetUser.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {editorKind && (
        <ProfilePhotoEditor
          key={`${targetUser.id}-${editorKind}`}
          kind={editorKind}
          initialUrl={
            editorKind === 'avatar' ? targetUser.avatar : targetUser.coverImage
          }
          initialCrop={
            editorKind === 'avatar'
              ? targetUser.avatarCrop
              : targetUser.coverCrop
          }
          options={photoOptions.filter(
            (photo) =>
              photo.url !==
              (editorKind === 'avatar'
                ? targetUser.avatar
                : targetUser.coverImage),
          )}
          onSave={(url, crop) => {
            saveProfilePhoto(editorKind, url, crop);
            setEditorKind(null);
            showToast('Đã cập nhật ảnh.', 'success');
          }}
          onClose={() => setEditorKind(null)}
        />
      )}
      {profileMedia && (
        <MediaLightbox
          items={[
            {
              src:
                profileMedia === 'avatar'
                  ? targetUser.avatar
                  : targetUser.coverImage,
              kind: 'image',
              alt: profileMedia === 'avatar' ? 'Ảnh đại diện' : 'Ảnh bìa',
            },
          ]}
          onClose={() => setProfileMedia(null)}
        />
      )}
      {galleryPreview && (
        <MediaLightbox
          items={galleryPreview.items}
          initialIndex={galleryPreview.index}
          onClose={() => setGalleryPreview(null)}
        />
      )}
    </div>
  );
};
