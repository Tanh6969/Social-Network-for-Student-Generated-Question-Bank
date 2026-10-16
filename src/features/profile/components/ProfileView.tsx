import React, { useRef, useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import { PostContent } from '../../feed/components/PostContent';
import { PostMediaGallery } from '../../feed/components/PostMediaGallery';
import {
  getMediaKind,
  readMediaFile,
  validateMediaFile,
} from '../../feed/mediaUtils';
import { MediaLightbox } from '../../../shared/components/MediaLightbox';
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
  } = useApp();

  const [activeTab, setActiveTabLocal] = useState<
    'POSTS' | 'ABOUT' | 'QUESTIONS' | 'FRIENDS'
  >('POSTS');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(currentUser.bio);
  const [profileMedia, setProfileMedia] = useState<'avatar' | 'cover' | null>(
    null,
  );
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

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

  const handleSaveBio = () => {
    updateCurrentUser({ bio: bioInput });
    setIsEditingBio(false);
  };

  const handleProfileImage = async (
    file: File | undefined,
    kind: 'avatar' | 'cover',
  ) => {
    if (!file) return;
    const error = validateMediaFile(file);
    if (getMediaKind(file.type) !== 'image' || error) {
      showToast(error ?? 'Chỉ chọn tệp ảnh.', 'warning');
      return;
    }
    try {
      const image = await readMediaFile(file);
      updateCurrentUser(
        kind === 'avatar' ? { avatar: image } : { coverImage: image },
      );
      showToast('Đã cập nhật ảnh.', 'success');
    } catch {
      showToast('Không đọc được ảnh đã chọn.', 'error');
    }
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
            />
          </button>
          {isMe && (
            <button
              onClick={() => coverInput.current?.click()}
              className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/60 hover:bg-white text-gray-800 dark:text-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Chỉnh sửa ảnh bìa</span>
            </button>
          )}
          <input
            ref={coverInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void handleProfileImage(event.target.files?.[0], 'cover');
              event.target.value = '';
            }}
          />
        </div>

        {/* Profile Info Row */}
        <div className="px-6 pb-4 pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="relative">
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
                    onClick={() => avatarInput.current?.click()}
                    aria-label="Đổi ảnh đại diện"
                    className="absolute bottom-0 right-0 rounded-full bg-white p-2 text-gray-800 shadow-md hover:bg-gray-100 dark:bg-[#3A3B3C] dark:text-white"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                )}
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    void handleProfileImage(event.target.files?.[0], 'avatar');
                    event.target.value = '';
                  }}
                />
              </div>

              <div className="mb-2">
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
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pb-2">
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
                    onClick={() => setIsEditingBio(true)}
                    className="px-4 py-2 bg-gray-100 dark:bg-[#3A3B3C] text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold hover:bg-gray-200 transition flex items-center gap-1.5"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Chỉnh sửa tiểu sử</span>
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
          <div className="flex border-t border-gray-100 dark:border-gray-700 mt-4 text-xs font-bold text-gray-600 dark:text-gray-300">
            {[
              { id: 'POSTS', label: 'Bài viết' },
              { id: 'ABOUT', label: 'Giới thiệu' },
              {
                id: 'QUESTIONS',
                label: `Câu hỏi đã đóng góp (${userQuestions.length})`,
              },
              { id: 'FRIENDS', label: `Bạn bè (${targetUser.friendsCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabLocal(tab.id as any)}
                className={`py-3 px-4 border-b-2 transition ${
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

      {/* ================= 2 CỘT DƯỚI ================= */}
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
                    onClick={() => setIsEditingBio(false)}
                    className="px-3 py-1 text-xs border rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
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
                    <PostContent key={post.id} content={post.content} compact />
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
                    <span className="font-bold text-blue-600">{q.subject}</span>
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
    </div>
  );
};
