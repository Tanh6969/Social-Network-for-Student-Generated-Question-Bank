import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import { PostContent } from '../../feed/components/PostContent';
import { PostMediaGallery } from '../../feed/components/PostMediaGallery';
import { PostDocuments } from '../../feed/components/PostDocuments';
import { PostShareButton } from '../../feed/components/PostShareButton';
import { PostComposerCard } from '../../feed/components/PostComposerCard';
import {
  MediaLightbox,
  type LightboxItem,
} from '../../../shared/components/MediaLightbox';
import { ProfilePhotoEditor, type PhotoOption } from './ProfilePhotoEditor';
import { ProfilePhotoLibrary } from './ProfilePhotoLibrary';
import { EditProfileModal } from './EditProfileModal';
import { formatPostTime } from '../../feed/postUtils';
import { getProfileRelationAction } from '../profileRelations';
import {
  Camera,
  Edit,
  Sparkles,
  MessageCircle,
  ShieldAlert,
  MoreHorizontal,
  Ban,
  ThumbsUp,
  UserPlus,
  UserCheck,
  UserMinus,
  Check,
  X,
} from 'lucide-react';
import type { User } from '../../demo/types';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    role,
    viewingUserId,
    getUserById,
    getFriendsOfUser,
    posts,
    friendStatuses,
    followingIds,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    toggleFollowUser,
    openPostComposer,
    deletePost,
    setActivePostDetail,
    openPostMedia,
    toggleLikePost,
    filterVisibleComments,
    blockUser,
    setActiveTab,
    openChatDock,
    showToast,
    openReportModal,
    updateCurrentUser,
    profilePhotoHistory,
    saveProfilePhoto,
  } = useApp();

  const [activeTab, setActiveTabLocal] = useState<
    'POSTS' | 'ABOUT' | 'PHOTOS' | 'FRIENDS'
  >('POSTS');
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileMedia, setProfileMedia] = useState<'avatar' | 'cover' | null>(
    null,
  );
  const [editorKind, setEditorKind] = useState<'avatar' | 'cover' | null>(null);
  const [galleryPreview, setGalleryPreview] = useState<{
    items: LightboxItem[];
    index: number;
  } | null>(null);

  const targetUser: User = viewingUserId
    ? getUserById(viewingUserId)
    : currentUser;
  const isMe = targetUser.id === currentUser.id;
  const profileFriends = getFriendsOfUser(targetUser.id);
  const relationAction = getProfileRelationAction(
    role,
    targetUser.role,
    friendStatuses[targetUser.id] ?? 'NONE',
  );
  const isFollowing = followingIds.includes(targetUser.id);

  const openFriendProfile = (userId: string) => {
    setViewingUserId(userId);
    setActiveTab('profile');
  };

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

  return (
    <div className="max-w-[1000px] mx-auto pb-10">
      {/* ================= HEADER BÌA + AVATAR (Facebook Style) ================= */}
      <div className="bg-fb-card rounded-b-2xl shadow-xs border-b border-fb-divider">
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
              className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/60 hover:bg-white text-fb-text px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
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
                className="absolute bottom-0 right-0 rounded-full bg-white p-2 text-gray-800 shadow-md hover:bg-fb-input dark:text-white"
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center justify-between gap-4 text-center sm:ml-28 sm:flex-row sm:items-end sm:text-left">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-fb-text">
                  {targetUser.name}
                </h1>
              </div>

              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                {targetUser.classOrTitle} · {targetUser.faculty}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-gray-500 mt-1">
                <span>
                  <strong>{targetUser.friendsCount}</strong> bạn bè
                </span>
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
                    onClick={() => setActiveTab('cosmetics')}
                    className="px-4 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-100 transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Kho vật phẩm</span>
                  </button>

                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 bg-fb-input text-fb-text rounded-lg text-xs font-bold hover:bg-gray-200 transition flex items-center gap-1.5"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Chỉnh sửa trang cá nhân</span>
                  </button>
                </>
              ) : (
                <>
                  {relationAction === 'FOLLOW' && (
                    <button
                      type="button"
                      onClick={() => toggleFollowUser(targetUser.id)}
                      aria-pressed={isFollowing}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        isFollowing
                          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>
                        {isFollowing ? 'Đang theo dõi' : 'Theo dõi giảng viên'}
                      </span>
                    </button>
                  )}

                  {relationAction === 'SEND_REQUEST' && (
                    <button
                      type="button"
                      onClick={() => sendFriendRequest(targetUser.id)}
                      className="px-4 py-2 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Thêm bạn bè</span>
                    </button>
                  )}

                  {relationAction === 'CANCEL_REQUEST' && (
                    <button
                      type="button"
                      onClick={() => cancelFriendRequest(targetUser.id)}
                      className="px-4 py-2 bg-fb-input text-fb-text rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <UserMinus className="w-4 h-4" />
                      <span>Hủy lời mời</span>
                    </button>
                  )}

                  {relationAction === 'RESPOND_TO_REQUEST' && (
                    <>
                      <button
                        type="button"
                        onClick={() => acceptFriendRequest(targetUser.id)}
                        className="px-4 py-2 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Xác nhận lời mời</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => declineFriendRequest(targetUser.id)}
                        className="px-4 py-2 bg-fb-input text-fb-text rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>Từ chối</span>
                      </button>
                    </>
                  )}

                  {relationAction === 'ALREADY_FRIENDS' && (
                    <span className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" />
                      <span>Đã là bạn bè</span>
                    </span>
                  )}

                  <button
                    onClick={() => openChatDock(targetUser.id)}
                    className="px-5 py-2 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Nhắn tin</span>
                  </button>

                  <button
                    onClick={() =>
                      openReportModal(
                        'NGƯỜI DÙNG',
                        targetUser.id,
                        targetUser.name,
                      )
                    }
                    className="p-2 text-gray-500 hover:text-red-600 border border-fb-divider rounded-lg transition"
                    title="Báo cáo người dùng"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sticky Tab Bar */}
          <div
            role="tablist"
            aria-label="Mục hồ sơ"
            className="flex overflow-x-auto border-t border-fb-divider mt-4 text-xs font-bold text-fb-text-2"
          >
            {[
              { id: 'POSTS', label: 'Bài viết' },
              { id: 'ABOUT', label: 'Giới thiệu' },
              { id: 'PHOTOS', label: 'Ảnh' },
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
                    : 'border-transparent hover:bg-fb-hover'
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

      {/* ================= 2 CỘT DƯỚI ================= */}
      {activeTab !== 'PHOTOS' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4 px-2 sm:px-0">
          {/* CỘT TRÁI (360px): Giới thiệu & Bạn bè (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            {/* Bio card */}
            <div className="bg-fb-card rounded-lg shadow-fb-card p-4 space-y-3">
              <h3 className="font-bold text-sm text-fb-text">
                Giới thiệu
              </h3>

              <p className="text-center text-xs leading-relaxed text-fb-text">
                {targetUser.bio || 'Chưa cập nhật tiểu sử.'}
              </p>

              <div className="pt-2 border-t border-fb-divider space-y-2 text-xs text-fb-text-2">
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

            {/* 9 Friends grid */}
            <div className="bg-fb-card rounded-lg shadow-fb-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-fb-text">
                  Bạn bè
                </h3>
                <span className="text-xs text-gray-500">
                  {targetUser.friendsCount} người bạn
                </span>
              </div>

              {profileFriends.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {profileFriends.slice(0, 9).map((friend) => (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => openFriendProfile(friend.id)}
                      className="group min-w-0 text-left"
                    >
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="h-20 w-full rounded-lg object-cover transition group-hover:opacity-90"
                      />
                      <span className="mt-1 block truncate text-[10px] font-bold text-fb-text">
                        {friend.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="pt-2 text-xs text-gray-500">
                  {isMe
                    ? 'Bạn chưa có bạn bè nào.'
                    : 'Người này chưa có bạn bè hiển thị.'}
                </p>
              )}
              {profileFriends.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTabLocal('FRIENDS')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Xem tất cả bạn bè
                </button>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: Dòng thời gian bài viết & câu hỏi (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            {activeTab === 'FRIENDS' && (
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-fb-text">
                  Bạn bè của {isMe ? 'bạn' : targetUser.name}
                </h2>
                {profileFriends.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {profileFriends.map((friend) => (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => openFriendProfile(friend.id)}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-[#242526] dark:hover:bg-[#3A3B3C]"
                      >
                        <AvatarWithFrame user={friend} size="md" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-fb-text">
                            {friend.name}
                          </span>
                          <span className="block truncate text-xs text-gray-500">
                            {friend.classOrTitle}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-[#242526]">
                    {isMe
                      ? 'Bạn chưa có bạn bè nào.'
                      : 'Người này chưa có bạn bè hiển thị.'}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'POSTS' && (
              <>
                {isMe && <PostComposerCard />}
                {userPosts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-fb-card rounded-lg shadow-fb-card overflow-hidden"
                  >
                    <div className="p-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <AvatarWithFrame user={post.author} size="md" />
                        <div>
                          <h4 className="font-bold text-sm text-fb-text">
                            {post.author.name}
                          </h4>
                          <span className="text-xs text-fb-text-2">
                            {formatPostTime(post.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          aria-label="Tùy chọn bài viết"
                          aria-expanded={activeMenuPostId === post.id}
                          onClick={() =>
                            setActiveMenuPostId(
                              activeMenuPostId === post.id ? null : post.id,
                            )
                          }
                          className="p-1.5 rounded-full hover:bg-fb-hover text-gray-500"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        {activeMenuPostId === post.id && (
                          <div className="absolute right-0 top-8 bg-fb-card shadow-xl border border-fb-divider rounded-lg py-1 w-48 z-30 text-xs">
                            {isMe ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    openPostComposer(post.id);
                                    setActiveMenuPostId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-fb-hover"
                                >
                                  Sửa bài viết
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm('Xóa bài viết này?'))
                                      deletePost(post.id);
                                    setActiveMenuPostId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                  Xóa bài viết
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    openReportModal(
                                      'BÀI VIẾT',
                                      post.id,
                                      post.content.slice(0, 40),
                                    );
                                    setActiveMenuPostId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-fb-text hover:bg-fb-hover"
                                >
                                  Báo cáo bài viết
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    blockUser(
                                      post.author.id,
                                      'Chặn từ menu bài viết trên trang cá nhân',
                                    );
                                    setActiveMenuPostId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 border-t border-fb-divider"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>
                                    Chặn{' '}
                                    {post.author.name.split(' ').slice(-1)[0]}
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {post.content.trim() && (
                      <div className="px-4 pb-3">
                        <PostContent
                          key={post.id}
                          content={post.content}
                          compact
                        />
                      </div>
                    )}
                    {post.mediaUrls?.length ? (
                      <PostMediaGallery
                        urls={post.mediaUrls}
                        isVideo={post.type === 'VIDEO'}
                        onOpen={(index) => openPostMedia(post, index)}
                      />
                    ) : null}
                    {post.documents && post.documents.length > 0 && (
                      <div className="px-4 pb-3">
                        <PostDocuments documents={post.documents} />
                      </div>
                    )}
                    {(() => {
                      const visibleComments = filterVisibleComments(
                        post.comments,
                      );
                      const visibleCommentsCount = visibleComments.reduce(
                        (sum, comment) =>
                          sum + 1 + (comment.replies?.length ?? 0),
                        0,
                      );
                      return (
                        <>
                          {(post.likesCount > 0 ||
                            visibleCommentsCount > 0) && (
                            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 text-xs text-gray-500 dark:border-gray-700">
                              <div className="flex items-center gap-1.5">
                                {post.likesCount > 0 && (
                                  <>
                                    <span className="rounded-full bg-blue-600 p-1 text-white">
                                      <ThumbsUp className="h-2.5 w-2.5" />
                                    </span>
                                    <span>{post.likesCount} lượt thích</span>
                                  </>
                                )}
                              </div>
                              {visibleCommentsCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setActivePostDetail(post)}
                                  className="hover:underline"
                                >
                                  {visibleCommentsCount} bình luận
                                </button>
                              )}
                            </div>
                          )}
                          <div className="px-2 py-1 flex items-center justify-between text-xs sm:text-sm font-semibold text-fb-text-2">
                            <button
                              type="button"
                              onClick={() => toggleLikePost(post.id)}
                              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-fb-hover transition ${
                                post.isLiked
                                  ? 'text-fb-blue font-bold'
                                  : ''
                              }`}
                            >
                              <ThumbsUp
                                className={`w-4 h-4 ${post.isLiked ? 'fill-blue-600 dark:fill-blue-400' : ''}`}
                              />
                              <span>Thích</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivePostDetail(post, true)}
                              className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-fb-hover transition"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>Bình luận</span>
                            </button>
                            <PostShareButton
                              postId={post.id}
                              showToast={showToast}
                            />
                          </div>
                        </>
                      );
                    })()}
                  </article>
                ))}
              </>
            )}
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
      {isEditingProfile && isMe && (
        <EditProfileModal
          user={currentUser}
          onClose={() => setIsEditingProfile(false)}
          onSave={(updates) => {
            updateCurrentUser(updates);
            setIsEditingProfile(false);
          }}
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
