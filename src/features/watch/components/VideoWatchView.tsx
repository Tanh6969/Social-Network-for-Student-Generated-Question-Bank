import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import {
  Tv,
  ThumbsUp,
  MessageCircle,
  Share2,
  Play,
  Bookmark,
  BookmarkCheck,
  Search,
  Sparkles,
  Flame,
  Clock,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { PostContent } from '../../feed/components/PostContent';
import { formatPostTime } from '../../feed/postUtils';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';

type VideoCategory =
  | 'ALL'
  | 'FOR_YOU'
  | 'Mạng máy tính'
  | 'Cấu trúc dữ liệu & Giải thuật'
  | 'Cơ sở dữ liệu'
  | 'SAVED';

export const VideoWatchView: React.FC = () => {
  const {
    posts,
    currentUser,
    friendStatuses,
    toggleLikePost,
    setActivePostDetail,
    openPostMedia,
    setViewingUserId,
    setActiveTab,
    setSelectedSubject,
    showToast,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<VideoCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedVideoIds, setSavedVideoIds] = useState<Set<string>>(
    new Set(['post_03']),
  );

  const toggleSaveVideo = (postId: string) => {
    setSavedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
        showToast('Đã xóa video khỏi danh sách lưu.', 'info');
      } else {
        next.add(postId);
        showToast('Đã lưu video vào danh sách học tập!', 'success');
      }
      return next;
    });
  };

  const videoPosts = posts.filter((post) => {
    const isVideo = post.type === 'VIDEO' || Boolean(post.videoUrl);
    if (!isVideo) return false;

    const canView =
      post.author.id === currentUser.id ||
      post.privacy === 'PUBLIC' ||
      (post.privacy === 'FRIENDS' && friendStatuses[post.author.id] === 'FRIEND');
    if (!canView) return false;

    // Filter by category
    if (activeCategory === 'SAVED') {
      if (!savedVideoIds.has(post.id)) return false;
    } else if (activeCategory === 'FOR_YOU') {
      // For you: likes > 50 or recent
    } else if (activeCategory !== 'ALL') {
      if (post.subjectTag !== activeCategory) return false;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchContent = post.content.toLowerCase().includes(q);
      const matchAuthor = post.author.name.toLowerCase().includes(q);
      const matchSubject = post.subjectTag?.toLowerCase().includes(q);
      if (!matchContent && !matchAuthor && !matchSubject) return false;
    }

    return true;
  });

  const categories: { id: VideoCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'ALL', label: 'Tất cả video', icon: <Flame className="w-4 h-4 text-orange-500" /> },
    { id: 'FOR_YOU', label: 'Dành cho bạn', icon: <Sparkles className="w-4 h-4 text-rose-500" /> },
    { id: 'Mạng máy tính', label: 'Mạng máy tính', icon: <BookOpen className="w-4 h-4 text-blue-500" /> },
    { id: 'Cấu trúc dữ liệu & Giải thuật', label: 'Cấu trúc dữ liệu & C++', icon: <BookOpen className="w-4 h-4 text-emerald-500" /> },
    { id: 'Cơ sở dữ liệu', label: 'Cơ sở dữ liệu', icon: <BookOpen className="w-4 h-4 text-purple-500" /> },
    { id: 'SAVED', label: 'Video đã lưu', icon: <Bookmark className="w-4 h-4 text-amber-500" /> },
  ];

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex justify-between items-start gap-4 lg:gap-8 xl:gap-12 2xl:gap-16">
      {/* ================= CỘT TRÁI (sticky sát lề trái) ================= */}
      <aside className="hidden lg:block w-[280px] xl:w-[300px] 2xl:w-[320px] shrink-0 sticky top-18 h-[calc(100vh-5rem)] overflow-y-auto space-y-4 select-none pr-2">
        <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
                Video học tập
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Bài giảng & Video ôn thi
              </p>
            </div>
          </div>

          {/* Ô tìm kiếm video */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm video học tập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-[#3A3B3C] rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-1 focus:ring-rose-500 transition"
            />
          </div>

          {/* Danh mục danh sách */}
          <div className="space-y-1 text-xs font-semibold text-gray-700 dark:text-gray-300 pt-1">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold'
                      : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {cat.icon}
                    <span>{cat.label}</span>
                  </div>
                  {cat.id === 'SAVED' && savedVideoIds.size > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                      {savedVideoIds.size}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Banner sinh viên cống hiến video */}
        <div className="bg-linear-to-br from-rose-500 to-pink-600 text-white rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-rose-200" />
            <h4 className="font-bold text-xs">Chia sẻ video giải đề</h4>
          </div>
          <p className="text-[11px] text-rose-100 leading-relaxed">
            Đăng tải clip ngắn giải thích câu hỏi hoặc mẹo ôn thi để nhận điểm cống hiến và khung Avatar đặc quyền!
          </p>
        </div>
      </aside>

      {/* ================= CỘT GIỮA: Feed Video Watch ================= */}
      <main className="flex-1 max-w-[720px] xl:max-w-[760px] 2xl:max-w-[800px] mx-auto space-y-5 px-1 sm:px-2">
        {/* Thanh filter nhanh dạng pill trên mobile & tablet */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#242526] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {videoPosts.length === 0 ? (
          <div className="bg-white dark:bg-[#242526] rounded-2xl p-10 text-center border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto text-gray-400">
              <Tv className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">
              Không tìm thấy video nào
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Không có video nào thuộc danh mục đã chọn hoặc phù hợp với từ khóa tìm kiếm.
            </p>
            <button
              onClick={() => {
                setActiveCategory('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Xem tất cả video
            </button>
          </div>
        ) : (
          videoPosts.map((post) => {
            const isSaved = savedVideoIds.has(post.id);
            return (
              <article
                key={post.id}
                className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Header bài đăng */}
                <div className="p-4 flex items-center justify-between">
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
                      <div className="flex items-center gap-1.5">
                        <h4
                          onClick={() => {
                            setViewingUserId(post.author.id);
                            setActiveTab('profile');
                          }}
                          className="font-bold text-xs text-gray-900 dark:text-gray-100 hover:underline cursor-pointer"
                        >
                          {post.author.name}
                        </h4>
                        {post.author.role === 'LECTURER' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                        <span>{formatPostTime(post.createdAt)}</span>
                        {post.subjectTag && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-rose-600 dark:text-rose-400">
                              {post.subjectTag}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSaveVideo(post.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition cursor-pointer"
                    title={isSaved ? 'Đã lưu video' : 'Lưu video'}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-4 h-4 text-rose-600 dark:text-rose-400 fill-rose-600 dark:fill-rose-400" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Nội dung bài đăng */}
                <div className="px-4 pb-3">
                  <PostContent content={post.content} />
                </div>

                {/* Khung xem Video Player */}
                <div
                  onClick={() => openPostMedia(post, 0)}
                  className="relative aspect-video bg-black flex items-center justify-center cursor-pointer group overflow-hidden"
                >
                  <img
                    src={
                      post.mediaUrls?.[0] ||
                      post.videoUrl ||
                      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80'
                    }
                    alt="Thumbnail video"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-85"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                  {/* Nút Play trung tâm */}
                  <div className="absolute w-16 h-16 rounded-full bg-rose-600/90 group-hover:bg-rose-600 group-hover:scale-110 text-white flex items-center justify-center shadow-2xl transition duration-200">
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </div>

                  {/* Badge thời lượng video */}
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/80 text-white text-[11px] font-mono font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-rose-400" />
                    <span>07:15</span>
                  </div>
                </div>

                {/* Thống kê tương tác */}
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700/80 flex items-center justify-between text-xs text-gray-500">
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
                      className="hover:underline cursor-pointer"
                    >
                      {post.commentsCount} bình luận
                    </button>
                    <span>{post.sharesCount} chia sẻ</span>
                  </div>
                </div>

                {/* Action Buttons: Thích | Bình luận | Chia sẻ */}
                <div className="px-2 py-1 flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300">
                  <button
                    onClick={() => toggleLikePost(post.id)}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition cursor-pointer ${
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
                    className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Bình luận</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      showToast('Đã sao chép liên kết video!', 'success');
                    }}
                    className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Chia sẻ</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </main>

      {/* ================= CỘT PHẢI (đối xứng, giữ căn giữa feed) ================= */}
      <aside className="hidden xl:block w-[280px] xl:w-[300px] 2xl:w-[320px] shrink-0 sticky top-18 h-[calc(100vh-5rem)] overflow-y-auto space-y-4 select-none pl-2">
        {/* Playlist ôn thi nổi bật */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Playlist đề xuất
            </h3>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
              HOT
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                title: 'Giải nhanh 100 câu Trắc nghiệm Mạng TCP/IP',
                subject: 'Mạng máy tính',
                views: '1.4k lượt xem',
                duration: '18:20',
                img: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=300&q=80',
              },
              {
                title: 'Tối ưu độ phức tạp thuật toán O(n log n)',
                subject: 'Giải thuật & C++',
                views: '980 lượt xem',
                duration: '12:45',
                img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80',
              },
              {
                title: 'Mẹo chuẩn hoá CSDL từ 1NF đến BCNF không nhầm lẫn',
                subject: 'Cơ sở dữ liệu',
                views: '2.1k lượt xem',
                duration: '09:10',
                img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80',
              },
            ].map((pl, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedSubject(pl.subject);
                  setActiveTab('bank');
                }}
                className="flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#3A3B3C]/50 transition cursor-pointer group"
              >
                <div className="relative w-20 h-13 rounded-lg overflow-hidden shrink-0 bg-gray-900">
                  <img
                    src={pl.img}
                    alt={pl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <span className="absolute bottom-1 right-1 text-[9px] bg-black/80 text-white px-1 rounded font-mono">
                    {pl.duration}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-rose-600 transition">
                    {pl.title}
                  </p>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {pl.views}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Giảng viên chia sẻ bài giảng */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <h3 className="font-bold text-xs text-gray-900 dark:text-gray-100 uppercase tracking-wider">
            Giảng viên tiêu biểu
          </h3>

          <div className="space-y-3">
            {[
              {
                id: 'user_gv_01',
                name: 'TS. Trần Minh Đức',
                subject: 'Khoa Mạng Máy tính',
                avatar:
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                videosCount: 14,
              },
              {
                id: 'user_gv_02',
                name: 'PGS. TS. Vũ Hải Yến',
                subject: 'Khoa Khoa học Máy tính',
                avatar:
                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
                videosCount: 22,
              },
            ].map((gv) => (
              <div key={gv.id} className="flex items-center justify-between">
                <div
                  onClick={() => {
                    setViewingUserId(gv.id);
                    setActiveTab('profile');
                  }}
                  className="flex items-center gap-2.5 cursor-pointer min-w-0"
                >
                  <img
                    src={gv.avatar}
                    alt={gv.name}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate hover:underline">
                      {gv.name}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {gv.subject} • {gv.videosCount} video
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setViewingUserId(gv.id);
                    setActiveTab('profile');
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};
