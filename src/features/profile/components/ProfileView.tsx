import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import { PostContent } from '../../feed/components/PostContent';
import { PostMediaGallery } from '../../feed/components/PostMediaGallery';
import {
  MediaLightbox,
  type LightboxItem,
} from '../../../shared/components/MediaLightbox';
import { ProfilePhotoEditor, type PhotoOption } from './ProfilePhotoEditor';
import { ProfilePhotoLibrary } from './ProfilePhotoLibrary';
import { EditProfileModal } from './EditProfileModal';
import { formatPostTime } from '../../feed/postUtils';
import {
  Camera,
  Edit,
  Sparkles,
  BookOpen,
  Award,
  Users,
  Grid,
  FileText,
  MessageCircle,
  UserPlus,
  ShieldAlert,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { User, Post } from '../../demo/types';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    viewingUserId,
    getUserById,
    posts,
    friendStatuses,
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
                    onClick={() => openPostComposer()}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Tạo bài viết
                  </button>
                  <button
                    onClick={() => setActiveTab('cosmetics')}
                    className="px-4 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold hover:bg-purple-100 transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Kho vật phẩm</span>
                  </button>

                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 bg-gray-100 dark:bg-[#3A3B3C] text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold hover:bg-gray-200 transition flex items-center gap-1.5"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Chỉnh sửa trang cá nhân</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openChatDock(targetUser.id)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
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
                    className="p-2 text-gray-500 hover:text-red-600 border border-gray-200 dark:border-gray-700 rounded-xl transition"
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

      {/* ================= 2 CỘT DƯỚI ================= */}
      {activeTab !== 'PHOTOS' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4 px-2 sm:px-0">
          {/* CỘT TRÁI (360px): Giới thiệu & Bạn bè (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            {/* Bio card */}
            <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                Giới thiệu
              </h3>

              <p className="text-center text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                {targetUser.bio || 'Chưa cập nhật tiểu sử.'}
              </p>

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

            {/* 9 Friends grid */}
            <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  Bạn bè
                </h3>
                <span className="text-xs text-gray-500">
                  {targetUser.friendsCount} người bạn
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                {[
                  {
                    name: 'Lê Thuỳ Dung',
                    avatar:
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
                  },
                  {
                    name: 'Phạm Q. Huy',
                    avatar:
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
                  },
                  {
                    name: 'Hoàng M. Anh',
                    avatar:
                      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
                  },
                ].map((fr, idx) => (
                  <div key={idx} className="cursor-pointer group">
                    <img
                      src={fr.avatar}
                      alt={fr.name}
                      className="w-full h-20 rounded-lg object-cover group-hover:opacity-90 transition"
                    />
                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 block truncate mt-1">
                      {fr.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Dòng thời gian bài viết & câu hỏi (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            {activeTab === 'POSTS' && (
              <>
                {userPosts.map((post) => (
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
                      {isMe && (
                        <div className="flex gap-3 text-xs font-semibold">
                          <button
                            onClick={() => openPostComposer(post.id)}
                            className="text-blue-600 hover:underline"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Xóa bài viết này?'))
                                deletePost(post.id);
                            }}
                            className="text-red-600 hover:underline"
                          >
                            Xóa
                          </button>
                        </div>
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
                    <button
                      onClick={() => setActivePostDetail(post)}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      {post.commentsCount} bình luận · Xem chi tiết
                    </button>
                  </div>
                ))}
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
