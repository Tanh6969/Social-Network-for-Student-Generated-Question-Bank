import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
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
  SlidersHorizontal,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { Post, Question } from '../../demo/types';

export const FeedView: React.FC = () => {
  const {
    currentUser,
    role,
    posts,
    createPost,
    toggleLikePost,
    addComment,
    deletePost,
    setActiveTab,
    setIsCreatePostModalOpen,
    setIsProposeSessionModalOpen,
    setActiveQuizQuestion,
    setActivePostDetail,
    questions,
    minigames,
    leaderboard,
    openChatDock,
    setViewingUserId,
    showToast,
    openReportModal
  } = useApp();

  const [hasNewPostsBanner, setHasNewPostsBanner] = useState(true);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  const handleCommentSubmit = (postId: string) => {
    const text = commentInputs[postId] || '';
    if (text.trim()) {
      addComment(postId, text);
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    }
  };

  const getLinkedQuestion = (questionId?: string): Question | undefined => {
    if (!questionId) return undefined;
    return questions.find((q) => q.id === questionId);
  };

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
            className="w-full group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-200/60 dark:hover:bg-[#3A3B3C] transition text-left"
          >
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 group-hover:text-blue-600 flex items-center justify-center transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <span>Bạn bè & Giảng viên</span>
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
              onClick={() => setIsCreatePostModalOpen(true)}
              className="flex-1 bg-[#F0F2F5] dark:bg-[#3A3B3C] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50] text-gray-500 dark:text-gray-300 text-sm font-medium py-2.5 px-4 rounded-full text-left transition"
            >
              {currentUser.name.split(' ').slice(-1)[0]} ơi, bạn đang nghiên cứu gì thế?
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
            <button
              onClick={() => setIsCreatePostModalOpen(true)}
              className="flex items-center justify-center gap-2 flex-1 py-2 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-lg transition"
            >
              <Image className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" />
              <span>Ảnh/Tài liệu</span>
            </button>

            <button
              onClick={() => setIsCreatePostModalOpen(true)}
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
            <span>Có 2 bài viết và câu hỏi thi mới được cập nhật – Nhấn để làm mới</span>
          </div>
        )}

        {/* Feed Posts */}
        {posts.map((post) => {
          const linkedQuestion = getLinkedQuestion(post.linkedQuestionId);

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
                      <span>{post.createdAt}</span>
                      <span>·</span>
                      <span className="bg-gray-100 dark:bg-[#3A3B3C] px-1.5 py-0.2 rounded text-[10px]">
                        {post.subjectTag || 'Chia sẻ kiến thức'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() =>
                      setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)
                    }
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-500"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {activeMenuPostId === post.id && (
                    <div className="absolute right-0 top-8 bg-white dark:bg-[#242526] shadow-xl border border-gray-200 dark:border-gray-700 rounded-xl py-1 w-44 z-30 text-xs">
                      {post.author.id === currentUser.id ? (
                        <button
                          onClick={() => {
                            deletePost(post.id);
                            setActiveMenuPostId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                        >
                          Xóa bài viết
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            openReportModal('BÀI VIẾT', post.id, post.content.slice(0, 40));
                            setActiveMenuPostId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
                        >
                          Báo cáo bài viết
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Content text */}
              <div className="px-4 pb-3">
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                  {post.content}
                </p>
              </div>

              {/* Ghi chú của Giảng viên (SOC.06) */}
              {post.lecturerNote && (
                <div className="mx-4 mb-3 p-3 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-r-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <img
                      src={post.lecturerNote.avatar}
                      alt="GV"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Ghi chú từ {post.lecturerNote.lecturerName}
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400">
                      {post.lecturerNote.createdAt}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-300 italic">
                    "{post.lecturerNote.note}"
                  </p>
                </div>
              )}

              {/* Linked Question Card with "Làm thử" (BANK.07) */}
              {linkedQuestion && (
                <div className="mx-4 mb-3 p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      Câu hỏi kiểm định: {linkedQuestion.subject}
                    </span>
                    <span className="bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded text-[10px]">
                      Độ khó: {linkedQuestion.difficulty === 'EASY' ? 'Dễ' : linkedQuestion.difficulty === 'MEDIUM' ? 'Trung bình' : 'Khó'}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-3">
                    {linkedQuestion.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      {linkedQuestion.totalAttempts} lượt làm thử · {linkedQuestion.ratingAverage} ★ ({linkedQuestion.ratingCount})
                    </span>
                    <button
                      onClick={() => setActiveQuizQuestion(linkedQuestion)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                    >
                      Làm thử câu này
                    </button>
                  </div>
                </div>
              )}

              {/* Media images grid */}
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="bg-gray-100 dark:bg-black max-h-96 overflow-hidden">
                  <img
                    src={post.mediaUrls[0]}
                    alt="Media"
                    className="w-full object-cover max-h-96 cursor-pointer hover:opacity-95 transition"
                    onClick={() => setActivePostDetail(post)}
                  />
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
                  <span
                    onClick={() => setActivePostDetail(post)}
                    className="hover:underline cursor-pointer"
                  >
                    {post.commentsCount} bình luận
                  </span>
                  <span>{post.sharesCount} chia sẻ</span>
                </div>
              </div>

              {/* Action Buttons: Thích | Bình luận | Chia sẻ */}
              <div className="px-2 py-1 flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300">
                <button
                  onClick={() => toggleLikePost(post.id)}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition ${
                    post.isLiked ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
                  }`}
                >
                  <ThumbsUp
                    className={`w-4 h-4 ${post.isLiked ? 'fill-blue-600 dark:fill-blue-400' : ''}`}
                  />
                  <span>Thích</span>
                </button>

                <button
                  onClick={() => setActivePostDetail(post)}
                  className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Bình luận</span>
                </button>

                <button
                  onClick={() => showToast('Đã sao chép liên kết chia sẻ bài viết!', 'success')}
                  className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Chia sẻ</span>
                </button>
              </div>

              {/* Inline Comments Section */}
              <div className="p-4 bg-gray-50/50 dark:bg-[#1E1F20] border-t border-gray-100 dark:border-gray-700 space-y-3">
                {post.comments && post.comments.slice(0, 2).map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2 text-xs">
                    <AvatarWithFrame user={comment.author} size="sm" />
                    <div className="flex-1">
                      <div className="bg-white dark:bg-[#242526] p-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xs">
                        <span className="font-bold text-gray-900 dark:text-gray-100 block">
                          {comment.author.name}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">{comment.content}</span>
                      </div>
                      <div className="flex items-center gap-3 px-2 mt-1 text-[11px] text-gray-500 font-medium">
                        <span>{comment.createdAt}</span>
                        <span className="hover:underline cursor-pointer">Thích</span>
                        <span className="hover:underline cursor-pointer">Trả lời</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Comment Input */}
                <div className="flex items-center gap-2 pt-1">
                  <AvatarWithFrame user={currentUser} size="sm" />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Viết câu trả lời hoặc thảo luận..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommentSubmit(post.id);
                      }}
                      className="w-full bg-white dark:bg-[#242526] border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleCommentSubmit(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                      className="absolute right-2 top-1.5 p-1 text-blue-600 disabled:text-gray-300"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
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
              Thưởng ngay +{minigames[0].rewardPoints} điểm cống hiến cho dự đoán chính xác nhất!
            </p>

            <button
              onClick={() => setActiveTab('game')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs transition"
            >
              {minigames[0].hasUserGuessed ? 'Xem dự đoán của bạn' : 'Tham gia dự đoán ngay'}
            </button>
          </div>
        )}

        {/* Lời mời kết bạn */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Lời mời kết bạn
            </span>
            <button
              onClick={() => setActiveTab('friends')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Xem tất cả
            </button>
          </div>

          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
              alt="Avatar"
              className="w-11 h-11 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate">
                Lê Thị Thuỳ Dung
              </p>
              <p className="text-[11px] text-gray-500">14 bạn chung</p>
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={() => showToast('Đã chấp nhận lời mời kết bạn!', 'success')}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => showToast('Đã xóa lời mời.', 'info')}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
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

        {/* Người liên hệ trực tuyến (Click để mở Chat dock) */}
        <div className="pt-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase px-2 mb-2 block">
            Người liên hệ trực tuyến
          </span>
          <div className="space-y-0.5">
            {[
              {
                id: 'user_sv_02',
                name: 'Lê Thị Thuỳ Dung',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
                role: 'STUDENT' as const,
                isOnline: true
              },
              {
                id: 'user_sv_03',
                name: 'Phạm Quang Huy',
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
                role: 'STUDENT' as const,
                isOnline: true
              },
              {
                id: 'user_gv_01',
                name: 'TS. Trần Minh Đức',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                role: 'LECTURER' as const,
                isOnline: true
              }
            ].map((contact) => (
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
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#242526] rounded-full" />
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
