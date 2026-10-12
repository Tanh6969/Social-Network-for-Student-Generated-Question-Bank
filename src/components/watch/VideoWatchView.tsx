import React from 'react';
import { useApp } from '../../context/AppContext';
import { Tv, ThumbsUp, MessageCircle, Share2, Play, Bookmark } from 'lucide-react';

export const VideoWatchView: React.FC = () => {
  const { posts, toggleLikePost, showToast } = useApp();

  const videoPosts = posts.filter((p) => p.type === 'VIDEO' || p.videoUrl);

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-12 items-start justify-between">
      {/* CỘT TRÁI: Danh mục Video Watch (sticky sát lề trái) */}
      <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-2 select-none lg:sticky lg:top-18">
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 px-2 mb-3 flex items-center gap-2">
          <Tv className="w-6 h-6 text-rose-600" />
          <span>Video học tập</span>
        </h2>

        <div className="space-y-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
          {['Dành cho bạn', 'Mạng máy tính', 'Giải thuật & C++', 'Cơ sở dữ liệu', 'Đã lưu'].map(
            (cat, idx) => (
              <button
                key={idx}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition ${
                  idx === 0
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-bold'
                    : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </aside>

      {/* CỘT PHẢI: Feed Video Watch (có khoảng trống 2 bên) */}
      <main className="flex-1 max-w-[840px] mx-auto space-y-6">
        {videoPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-4 flex items-center gap-3">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100">
                  {post.author.name}
                </h4>
                <span className="text-[10px] text-gray-400">{post.createdAt}</span>
              </div>
            </div>

            <p className="px-4 pb-3 text-xs text-gray-800 dark:text-gray-200">
              {post.content}
            </p>

            {/* Simulated Video Player */}
            <div className="relative aspect-video bg-black flex items-center justify-center group cursor-pointer">
              <img
                src={post.videoUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80'}
                alt="Thumbnail"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition"
              />
              <div className="w-16 h-16 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-white ml-1" />
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
              <button
                onClick={() => toggleLikePost(post.id)}
                className="flex items-center gap-1.5 hover:text-blue-600 font-semibold"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{post.likesCount} Thích</span>
              </button>

              <button className="flex items-center gap-1.5 hover:text-blue-600 font-semibold">
                <MessageCircle className="w-4 h-4" />
                <span>{post.commentsCount} Bình luận</span>
              </button>

              <button
                onClick={() => showToast('Đã lưu video vào danh sách học tập!', 'success')}
                className="flex items-center gap-1.5 hover:text-blue-600 font-semibold"
              >
                <Bookmark className="w-4 h-4" />
                <span>Lưu</span>
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};
