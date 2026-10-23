import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import { PostContent } from './PostContent';
import { PostMediaGallery } from './PostMediaGallery';
import { PostDocuments } from './PostDocuments';
import { formatPostTime, sortFeedPosts } from '../postUtils';
import {
  Users,
  BookOpen,
  PlusCircle,
  Gamepad2,
  Trophy,
  Tv,
  FileCode,
  CheckSquare,
  Image,
  FileText,
  Video,
  HelpCircle,
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Bookmark,
  Award,
  Clock,
  CheckCircle,
  Send,
  RefreshCw,
  Ban,
} from 'lucide-react';

export const FeedView: React.FC = () => {
  const {
    currentUser,
    role,
    posts,
    toggleLikePost,
    deletePost,
    allUsers,
    friendsList,
    friendStatuses,
    getMutualFriendsCount,
    acceptFriendRequest,
    declineFriendRequest,
    blockUser,
    isBlockedEitherWay,
    filterVisibleComments,
    openPostComposer,
    setActiveTab,
    setActivePostDetail,
    openPostMedia,
    minigames,
    leaderboard,
    openChatDock,
    setViewingUserId,
    showToast,
    openReportModal,
  } = useApp();

  const [hasNewPostsBanner, setHasNewPostsBanner] = useState(true);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAttachmentMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !attachmentMenuRef.current?.contains(event.target)
      )
        setIsAttachmentMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAttachmentMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isAttachmentMenuOpen]);

  const friendIds = new Set(friendsList.map((f) => f.id));
  const incomingRequests = allUsers.filter(
    (u) =>
      friendStatuses[u.id] === 'REQUEST_RECEIVED' && !isBlockedEitherWay(u.id),
  );
  const visiblePosts = posts.filter(
    (post) =>
      !isBlockedEitherWay(post.author.id) &&
      (post.author.id === currentUser.id ||
        post.privacy === 'PUBLIC' ||
        (post.privacy === 'FRIENDS' && friendIds.has(post.author.id))),
  );
  const orderedPosts = sortFeedPosts(visiblePosts, currentUser.id, friendIds);

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex justify-between items-start gap-4 lg:gap-8 xl:gap-12 2xl:gap-16">
      {/* ================= CỘT TRÁI (sticky sát lề trái) ================= */}
      <aside className="hidden lg:block w-[280px] xl:w-[300px] 2xl:w-[320px] shrink-0 sticky top-18 h-[calc(100vh-5rem)] overflow-y-auto space-y-2 pr-2 select-none">
        {/* User Quick Info */}
        <div
          onClick={() => {
            setViewingUserId(currentUser.id);
            setActiveTab('profile');
          }}
          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-200/60 dark:hover:bg-[#3A3B3C] cursor-pointer transition text-gray-800 dark:text-gray-100"
        >
          <AvatarWithFrame user={currentUser} size="md" />
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
              {currentUser.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {currentUser.classOrTitle}
            </p>
          </div>
        </div>

        {/* Shortcuts list - Tối giản & đồng bộ màu sắc */}
        <div className="space-y-0.5 text-sm font-medium text-gray-700 dark:text-gray-200">
          {/* 1. Đề xuất câu hỏi mới */}
          <button
            onClick={() => setActiveTab('propose')}
            className="w-full group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold transition text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 flex items-center justify-center transition-colors">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span>Đề xuất câu hỏi mới</span>
          </button>

          {/* 2. Ngân hàng đề thi */}
          <button
            onClick={() => setActiveTab('bank')}
            className="w-full group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-200/60 dark:hover:bg-[#3A3B3C] transition text-left"
          >
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 group-hover:text-blue-600 flex items-center justify-center transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <span>Ngân hàng đề thi</span>
          </button>

          {/* 3. Sinh đề thi & Mã đề */}
          <button
            onClick={() => setActiveTab('exams')}
            className="w-full group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-200/60 dark:hover:bg-[#3A3B3C] transition text-left"
          >
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 group-hover:text-blue-600 flex items-center justify-center transition-colors">
              <FileCode className="w-5 h-5" />
            </div>
            <span>Sinh đề thi & Mã đề</span>
          </button>

          {/* 4. Minigame dự đoán */}
          <button
            onClick={() => setActiveTab('game')}
            className="w-full group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-200/60 dark:hover:bg-[#3A3B3C] transition text-left"
          >
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 group-hover:text-blue-600 flex items-center justify-center transition-colors">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <span>Minigame dự đoán</span>
          </button>

          {/* 5. Video học tập */}
          <button
            onClick={() => setActiveTab('watch')}
            className="w-full group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-200/60 dark:hover:bg-[#3A3B3C] transition text-left"
          >
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 group-hover:text-blue-600 flex items-center justify-center transition-colors">
              <Tv className="w-5 h-5" />
            </div>
            <span>Video học tập</span>
          </button>

          {/* 6. Bạn bè & Giảng viên */}
          <button
            onClick={() => setActiveTab('friends')}
            className="w-full group flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-200/60 dark:hover:bg-[#3A3B3C] transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <span>Bạn bè & Giảng viên</span>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-[#3A3B3C] px-2 py-0.5 rounded-full">
              {currentUser.friendsCount}
            </span>
          </button>

          {role === 'LECTURER' && (
            <button
              onClick={() => setActiveTab('review')}
              className="w-full group flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition text-left mt-2"
            >
              <div className="w-9 h-9 rounded-full bg-white dark:bg-[#242526] text-blue-600 flex items-center justify-center shadow-xs">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="font-semibold">Kiểm duyệt câu hỏi (GV)</span>
            </button>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>© 2026 UniSocial & ExamBank Đại học</p>
          <p>Mạng xã hội học tập & Ngân hàng đề thi chuẩn Quốc gia</p>
        </div>
      </aside>

      {/* ================= CỘT GIỮA (cuộn nội dung, có khoảng trống 2 bên) ================= */}
      <main className="flex-1 max-w-[680px] mx-auto space-y-4 px-1 sm:px-2">
        {/* Card: "Bạn đang nghĩ gì?" (SOC.01, SOC.02) */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
            <AvatarWithFrame user={currentUser} size="md" />
            <button
              onClick={() => openPostComposer()}
              className="flex-1 bg-[#F0F2F5] dark:bg-[#3A3B3C] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50] text-gray-500 dark:text-gray-300 text-sm font-medium py-2.5 px-4 rounded-full text-left transition"
            >
              {currentUser.name.split(' ').slice(-1)[0]} ơi, bạn đang nghiên cứu
              gì thế?
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
            <div ref={attachmentMenuRef} className="relative flex-1">
              <button
                type="button"
                onClick={() => setIsAttachmentMenuOpen((open) => !open)}
                aria-expanded={isAttachmentMenuOpen}
                aria-haspopup="menu"
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2 transition hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
              >
                <Image className="w-4.5 h-4.5 shrink-0 text-gray-500 dark:text-gray-400" />
                <span>Ảnh/Tài liệu</span>
              </button>
              {isAttachmentMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-30 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-[#242526]"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAttachmentMenuOpen(false);
                      openPostComposer(undefined, 'image');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
                  >
                    <Image className="h-4 w-4" />
                    Chọn ảnh
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAttachmentMenuOpen(false);
                      openPostComposer(undefined, 'document');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
                  >
                    <FileText className="h-4 w-4" />
                    Chọn tài liệu
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => openPostComposer(undefined, 'video')}
              className="flex items-center justify-center gap-2 flex-1 py-2 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-lg transition"
            >
              <Video className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" />
              <span>Video học tập</span>
            </button>

            <button
              onClick={() => setActiveTab('propose')}
              className="flex items-center justify-center gap-2 flex-1 py-2 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-lg transition text-blue-600 dark:text-blue-400 font-semibold cursor-pointer"
            >
              <HelpCircle className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              <span>Đề xuất câu hỏi</span>
            </button>
          </div>
        </div>

        {/* Polling Banner: "Có bài viết mới" */}
        {hasNewPostsBanner && (
          <div
            onClick={() => {
              setHasNewPostsBanner(false);
              showToast('Đã cập nhật bảng tin mới nhất!', 'info');
            }}
            className="bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100/70 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-center text-xs font-semibold text-blue-700 dark:text-blue-300 cursor-pointer shadow-xs transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>
              Có 2 bài viết và câu hỏi thi mới được cập nhật – Nhấn để làm mới
            </span>
          </div>
        )}

        {/* Feed Posts */}
        {orderedPosts.map((post) => {
          const visibleComments = filterVisibleComments(post.comments);
          const visibleCommentsCount = visibleComments.reduce(
            (sum, c) => sum + 1 + (c.replies?.length ?? 0),
            0,
          );

          return (
            <article
              key={post.id}
              className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AvatarWithFrame
                    user={post.author}
                    size="md"
                    onClick={() => {
                      setViewingUserId(post.author.id);
                      setActiveTab('profile');
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        onClick={() => {
                          setViewingUserId(post.author.id);
                          setActiveTab('profile');
                        }}
                        className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:underline cursor-pointer"
                      >
                        {post.author.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatPostTime(post.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() =>
                      setActiveMenuPostId(
                        activeMenuPostId === post.id ? null : post.id,
                      )
                    }
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-500"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {activeMenuPostId === post.id && (
                    <div className="absolute right-0 top-8 bg-white dark:bg-[#242526] shadow-xl border border-gray-200 dark:border-gray-700 rounded-xl py-1 w-48 z-30 text-xs">
                      {post.author.id === currentUser.id ? (
                        <>
                          <button
                            onClick={() => {
                              openPostComposer(post.id);
                              setActiveMenuPostId(null);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
                          >
                            Sửa bài viết
                          </button>
                          <button
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
                            onClick={() => {
                              openReportModal(
                                'BÀI VIẾT',
                                post.id,
                                post.content.slice(0, 40),
                              );
                              setActiveMenuPostId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
                          >
                            Báo cáo bài viết
                          </button>
                          <button
                            onClick={() => {
                              blockUser(
                                post.author.id,
                                'Chặn từ menu bài viết trên Bảng tin',
                              );
                              setActiveMenuPostId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 border-t border-gray-100 dark:border-gray-700"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>
                              Chặn {post.author.name.split(' ').slice(-1)[0]}
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Content text */}
              {post.content.trim() && (
                <div className="px-4 pb-3">
                  <PostContent key={post.id} content={post.content} compact />
                </div>
              )}

              {/* Media images grid */}
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <PostMediaGallery
                  urls={post.mediaUrls}
                  isVideo={post.type === 'VIDEO'}
                  onOpen={(index) => openPostMedia(post, index)}
                />
              )}
              {post.documents && post.documents.length > 0 && (
                <div className="px-4 pb-3">
                  <PostDocuments documents={post.documents} />
                </div>
              )}

              {/* Stats Bar */}
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 bg-blue-600 text-white rounded-full">
                    <ThumbsUp className="w-2.5 h-2.5" />
                  </span>
                  <span>{post.likesCount} lượt thích</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActivePostDetail(post)}
                    className="hover:underline"
                  >
                    {visibleCommentsCount} bình luận
                  </button>
                  <span>{post.sharesCount} chia sẻ</span>
                </div>
              </div>

              {/* Action Buttons: Thích | Bình luận | Chia sẻ */}
              <div className="px-2 py-1 flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300">
                <button
                  onClick={() => toggleLikePost(post.id)}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition ${
                    post.isLiked
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : ''
                  }`}
                >
                  <ThumbsUp
                    className={`w-4 h-4 ${post.isLiked ? 'fill-blue-600 dark:fill-blue-400' : ''}`}
                  />
                  <span>Thích</span>
                </button>

                <button
                  onClick={() => setActivePostDetail(post, true)}
                  className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Bình luận</span>
                </button>

                <button
                  onClick={() =>
                    showToast(
                      'Đã sao chép liên kết chia sẻ bài viết!',
                      'success',
                    )
                  }
                  className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Chia sẻ</span>
                </button>
              </div>
            </article>
          );
        })}
      </main>

      {/* ================= CỘT PHẢI (sticky sát lề phải) ================= */}
      <aside className="hidden xl:block w-[300px] xl:w-[320px] 2xl:w-[340px] shrink-0 sticky top-18 h-[calc(100vh-5rem)] overflow-y-auto space-y-4 select-none pl-1">
        {/* Minigame Widget */}
        {minigames.length > 0 && (
          <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Minigame tuần
              </span>
              <span className="text-[10px] bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 px-2 py-0.5 rounded-md font-medium">
                Còn {minigames[0].closesInHours} giờ
              </span>
            </div>

            <h4 className="font-semibold text-xs text-gray-900 dark:text-gray-100 line-clamp-2 mb-1.5">
              {minigames[0].title}
            </h4>
            <p className="text-[11px] text-gray-500 mb-3">
              Thưởng ngay +{minigames[0].rewardPoints} điểm cống hiến cho dự
              đoán chính xác nhất!
            </p>

            <button
              onClick={() => setActiveTab('game')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs transition"
            >
              {minigames[0].hasUserGuessed
                ? 'Xem dự đoán của bạn'
                : 'Tham gia dự đoán ngay'}
            </button>
          </div>
        )}

        {/* Lời mời kết bạn thật */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Lời mời kết bạn ({incomingRequests.length})
            </span>
            <button
              onClick={() => setActiveTab('friends')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Xem tất cả
            </button>
          </div>

          {incomingRequests.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">
              Không có lời mời kết bạn mới.
            </p>
          ) : (
            <div className="space-y-3">
              {incomingRequests.slice(0, 2).map((req) => (
                <div key={req.id} className="flex items-center gap-3">
                  <img
                    src={req.avatar}
                    alt={req.name}
                    onClick={() => {
                      setViewingUserId(req.id);
                      setActiveTab('profile');
                    }}
                    className="w-11 h-11 rounded-full object-cover cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      onClick={() => {
                        setViewingUserId(req.id);
                        setActiveTab('profile');
                      }}
                      className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate hover:underline cursor-pointer"
                    >
                      {req.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {getMutualFriendsCount(req.id)} bạn chung
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => acceptFriendRequest(req.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium"
                      >
                        Xác nhận
                      </button>
                      <button
                        onClick={() => declineFriendRequest(req.id)}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 3 Bảng xếp hạng tuần */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-gray-400" />
              Top cống hiến tuần
            </span>
            <button
              onClick={() => setActiveTab('game')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Bảng vàng
            </button>
          </div>

          <div className="space-y-2">
            {leaderboard.slice(0, 3).map((lead) => (
              <div
                key={lead.user.id}
                onClick={() => {
                  setViewingUserId(lead.user.id);
                  setActiveTab('profile');
                }}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#3A3B3C] cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      lead.rank === 1
                        ? 'bg-blue-600 text-white'
                        : lead.rank === 2
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {lead.rank}
                  </span>
                  <AvatarWithFrame user={lead.user} size="sm" />
                  <span className="font-medium text-xs text-gray-800 dark:text-gray-200 truncate">
                    {lead.user.name}
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 shrink-0">
                  {lead.score} đ
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Người liên hệ trực tuyến thực tế (Click để mở Chat dock) */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
              Bạn bè ({friendsList.length})
            </span>
            <button
              onClick={() => setActiveTab('friends')}
              className="text-[11px] text-blue-600 hover:underline font-medium"
            >
              Quản lý
            </button>
          </div>
          <div className="space-y-0.5">
            {friendsList.map((contact) => (
              <div
                key={contact.id}
                onClick={() => openChatDock(contact.id)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-200/60 dark:hover:bg-[#3A3B3C] text-gray-800 dark:text-gray-200 cursor-pointer transition"
              >
                <div className="relative">
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  {contact.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#242526] rounded-full" />
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {contact.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};
