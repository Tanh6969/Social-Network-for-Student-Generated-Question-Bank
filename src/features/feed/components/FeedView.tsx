import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import { PostContent } from './PostContent';
import { PostMediaGallery } from './PostMediaGallery';
import { PostDocuments } from './PostDocuments';
import { PostShareButton } from './PostShareButton';
import { PostComposerCard } from './PostComposerCard';
import { StudentSidebarSections } from './StudentSidebarSections';
import { LecturerSidebarSections } from './LecturerSidebarSections';
import {
  formatPostTime,
  isPostVisibleToViewer,
  sortFeedPosts,
} from '../postUtils';
import { useFeedPages } from '../useFeedPages';
import {
  Gamepad2,
  Trophy,
  FileCode,
  ThumbsUp,
  MessageCircle,
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
    activePostDetail,
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
    setViewingUserId,
    showToast,
    openReportModal,
  } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const unavailablePost =
    new URLSearchParams(location.search).has('post') && !activePostDetail;

  const [hasNewPostsBanner, setHasNewPostsBanner] = useState(true);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const feedSentinelRef = useRef<HTMLDivElement>(null);

  const friendIds = new Set(friendsList.map((f) => f.id));
  const incomingRequests = allUsers.filter(
    (u) =>
      friendStatuses[u.id] === 'REQUEST_RECEIVED' && !isBlockedEitherWay(u.id),
  );
  const visiblePosts = posts.filter(
    (post) =>
      !isBlockedEitherWay(post.author.id) &&
      isPostVisibleToViewer(post, currentUser.id, friendIds),
  );
  const orderedPosts = sortFeedPosts(visiblePosts, currentUser.id, friendIds);
  const feedPages = useFeedPages(orderedPosts, feedSentinelRef);
  const myRank = leaderboard.find((l) => l.user.id === currentUser.id)?.rank;

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex justify-between items-start gap-4 xl:gap-6">
      {/* ================= CỘT TRÁI (sticky sát lề trái) ================= */}
      <aside className="hidden lg:block w-[280px] xl:w-[300px] 2xl:w-[320px] shrink-0 sticky top-18 h-[calc(100vh-5rem)] overflow-y-auto space-y-2 pr-2 select-none">
        {/* User Quick Info */}
        <div
          onClick={() => {
            setViewingUserId(currentUser.id);
            setActiveTab('profile');
          }}
          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-[#3A3B3C] cursor-pointer transition text-fb-text"
        >
          <AvatarWithFrame user={currentUser} size="md" />
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-fb-text truncate">
              {currentUser.name}
            </h3>
            <p className="text-xs text-fb-text-2 truncate">
              {currentUser.classOrTitle}
            </p>
            {role !== 'LECTURER' && (
              <p className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 truncate">
                <Trophy className="w-3.5 h-3.5 shrink-0" />
                {currentUser.points.toLocaleString('vi-VN')} điểm
                {myRank && <> · Hạng #{myRank}</>}
              </p>
            )}
          </div>
        </div>

        {/* Shortcuts list - Tối giản & đồng bộ màu sắc */}
        <div className="space-y-0.5 text-sm font-medium text-fb-text">
          {role === 'LECTURER' ? (
            // Giảng viên: các trang chức năng đã có trên header, sidebar chỉ hiện dữ liệu cá nhân
            <LecturerSidebarSections />
          ) : (
            // Sinh viên: chỉ hiện nội dung cá nhân, không lặp lại các trang đã có trên header
            <StudentSidebarSections />
          )}
        </div>

        <div className="pt-4 border-t border-fb-divider text-xs text-fb-text-2 space-y-1">
          <p>© 2026 UniSocial & ExamBank Đại học</p>
          <p>Mạng xã hội học tập & Ngân hàng đề thi chuẩn Quốc gia</p>
        </div>
      </aside>

      {/* ================= CỘT GIỮA (cuộn nội dung, có khoảng trống 2 bên) ================= */}
      <main className="flex-1 min-w-0 max-w-[760px] mx-auto space-y-4">
        <PostComposerCard />

        {/* Polling Banner: "Có bài viết mới" */}
        {hasNewPostsBanner && (
          <div
            onClick={() => {
              setHasNewPostsBanner(false);
              showToast('Đã cập nhật bảng tin mới nhất!', 'info');
            }}
            className="bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100/70 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center text-xs font-semibold text-blue-700 dark:text-blue-300 cursor-pointer shadow-xs transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>
              Có 2 bài viết và câu hỏi thi mới được cập nhật – Nhấn để làm mới
            </span>
          </div>
        )}

        {/* Feed Posts */}
        {unavailablePost && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-[#242526] dark:text-gray-200">
            Bài viết này không tồn tại hoặc bạn không có quyền xem.
            <button
              type="button"
              onClick={() => navigate('/feed', { replace: true })}
              className="ml-2 font-semibold text-blue-600 hover:underline"
            >
              Về bảng tin
            </button>
          </div>
        )}
        {feedPages.visiblePosts.map((post) => {
          const visibleComments = filterVisibleComments(post.comments);
          const visibleCommentsCount = visibleComments.reduce(
            (sum, c) => sum + 1 + (c.replies?.length ?? 0),
            0,
          );

          return (
            <article
              key={post.id}
              className="bg-fb-card rounded-lg shadow-fb-card overflow-hidden"
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
                        className="font-bold text-sm text-fb-text hover:underline cursor-pointer"
                      >
                        {post.author.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-fb-text-2">
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
                    className="p-1.5 rounded-full hover:bg-fb-hover text-gray-500"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {activeMenuPostId === post.id && (
                    <div className="absolute right-0 top-8 bg-fb-card shadow-xl border border-fb-divider rounded-lg py-1 w-48 z-30 text-xs">
                      {post.author.id === currentUser.id ? (
                        <>
                          <button
                            onClick={() => {
                              openPostComposer(post.id);
                              setActiveMenuPostId(null);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-fb-hover"
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
                            className="w-full px-3 py-2 text-left text-fb-text hover:bg-fb-hover"
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
                            className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 border-t border-fb-divider"
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
              {(post.likesCount > 0 || visibleCommentsCount > 0) && (
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

              {/* Action Buttons: Thích | Bình luận | Chia sẻ */}
              <div className="px-2 py-1 flex items-center justify-between text-xs sm:text-sm font-semibold text-fb-text-2">
                <button
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
                  onClick={() => setActivePostDetail(post, true)}
                  className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-fb-hover transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Bình luận</span>
                </button>

                <PostShareButton postId={post.id} showToast={showToast} />
              </div>
            </article>
          );
        })}
        <div
          ref={feedSentinelRef}
          className="py-3 text-center text-xs text-gray-500"
        >
          {feedPages.isLoadingMore && (
            <div
              role="status"
              aria-label="Đang tải bài viết"
              className="animate-pulse rounded-lg border border-gray-200 bg-white p-4 text-left shadow-xs dark:border-gray-700 dark:bg-[#242526]"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2">
                  <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-2 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
              <div className="mt-5 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          )}
          {feedPages.hasMore && !feedPages.isLoadingMore && (
            <button
              type="button"
              onClick={feedPages.loadMore}
              className="font-semibold text-blue-600 hover:underline"
            >
              Xem thêm bài viết
            </button>
          )}
          {!feedPages.hasMore && feedPages.visiblePosts.length > 0 && (
            <span>Đã xem hết bài viết.</span>
          )}
        </div>
      </main>

      {/* ================= CỘT PHẢI (sticky sát lề phải) ================= */}
      <aside className="hidden xl:block w-[300px] xl:w-[320px] 2xl:w-[340px] shrink-0 sticky top-18 h-[calc(100vh-5rem)] overflow-y-auto space-y-4 select-none pl-1">
        {/* Minigame Widget */}
        {minigames.length > 0 && (
          <div className="bg-fb-card rounded-lg shadow-fb-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-fb-text flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-fb-blue" />
                Minigame tuần
              </span>
              <span className="text-[10px] bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 px-2 py-0.5 rounded-md font-medium">
                Còn {minigames[0].closesInHours} giờ
              </span>
            </div>

            <h4 className="font-semibold text-xs text-fb-text line-clamp-2 mb-1.5">
              {minigames[0].title}
            </h4>
            <p className="text-[11px] text-gray-500 mb-3">
              Thưởng ngay +{minigames[0].rewardPoints} điểm cống hiến cho dự
              đoán chính xác nhất!
            </p>

            <button
              onClick={() => setActiveTab('game')}
              className="w-full py-2 bg-fb-blue hover:bg-fb-blue-hover text-white font-medium text-xs rounded-lg shadow-xs transition"
            >
              {minigames[0].hasUserGuessed
                ? 'Xem dự đoán của bạn'
                : 'Tham gia dự đoán ngay'}
            </button>
          </div>
        )}

        {/* Lời mời kết bạn thật */}
        <div className="bg-fb-card rounded-lg shadow-fb-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-fb-text-2">
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
                      className="font-semibold text-xs text-fb-text truncate hover:underline cursor-pointer"
                    >
                      {req.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {getMutualFriendsCount(req.id)} bạn chung
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => acceptFriendRequest(req.id)}
                        className="px-3 py-1 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-md text-xs font-medium"
                      >
                        Xác nhận
                      </button>
                      <button
                        onClick={() => declineFriendRequest(req.id)}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-fb-text rounded-md text-xs font-medium"
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
        <div className="bg-fb-card rounded-lg shadow-fb-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-fb-text-2 flex items-center gap-1.5">
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
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-fb-hover cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      lead.rank === 1
                        ? 'bg-blue-600 text-white'
                        : lead.rank === 2
                          ? 'bg-gray-300 dark:bg-gray-600 text-fb-text'
                          : 'bg-gray-200 dark:bg-gray-700 text-fb-text-2'
                    }`}
                  >
                    {lead.rank}
                  </span>
                  <AvatarWithFrame user={lead.user} size="sm" />
                  <span className="font-medium text-xs text-fb-text truncate">
                    {lead.user.name}
                  </span>
                </div>
                <span className="text-xs font-semibold text-fb-text-2 shrink-0">
                  {lead.score} đ
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};
