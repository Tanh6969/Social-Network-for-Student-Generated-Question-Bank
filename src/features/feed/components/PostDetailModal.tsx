import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import {
  X,
  ThumbsUp,
  MessageCircle,
  Share2,
  Send,
  MoreHorizontal
} from 'lucide-react';
import { Post } from '../../demo/types';

export const PostDetailModal: React.FC = () => {
  const {
    activePostDetail,
    setActivePostDetail,
    currentUser,
    toggleLikePost,
    addComment,
    showToast
  } = useApp();

  const [commentInput, setCommentInput] = useState('');

  if (!activePostDetail) return null;

  const handleSendComment = () => {
    if (commentInput.trim()) {
      addComment(activePostDetail.id, commentInput);
      setCommentInput('');
    }
  };

  const hasMedia = activePostDetail.mediaUrls && activePostDetail.mediaUrls.length > 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-[#242526] rounded-none sm:rounded-2xl shadow-2xl w-full max-h-[96vh] overflow-hidden flex flex-col md:flex-row border border-gray-200 dark:border-gray-700 ${hasMedia ? 'max-w-5xl h-[85vh]' : 'max-w-xl'}`}>
        {/* Left: Media Viewer (nếu có ảnh) */}
        {hasMedia && (
          <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px]">
            <img
              src={activePostDetail.mediaUrls![0]}
              alt="Media full"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}

        {/* Right (hoặc toàn bộ): Nội dung & Bình luận */}
        <div className={`flex flex-col ${hasMedia ? 'w-full md:w-[420px]' : 'w-full'} h-full bg-white dark:bg-[#242526]`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AvatarWithFrame user={activePostDetail.author} size="md" />
              <div>
                <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100">
                  {activePostDetail.author.name}
                </h4>
                <span className="text-[10px] text-gray-500">
                  {activePostDetail.createdAt} · {activePostDetail.subjectTag || 'Chia sẻ'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActivePostDetail(null)}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content & Comments List (Cuộn) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
              {activePostDetail.content}
            </p>

            {/* Ghi chú của Giảng viên */}
            {activePostDetail.lecturerNote && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-r-xl">
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 block mb-0.5">
                  Ghi chú từ {activePostDetail.lecturerNote.lecturerName}
                </span>
                <p className="text-xs text-amber-800 dark:text-amber-300 italic">
                  "{activePostDetail.lecturerNote.note}"
                </p>
              </div>
            )}

            {/* Actions Bar */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
              <button
                onClick={() => toggleLikePost(activePostDetail.id)}
                className={`flex items-center gap-1.5 font-bold ${
                  activePostDetail.isLiked ? 'text-blue-600' : ''
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{activePostDetail.likesCount} Thích</span>
              </button>

              <span>{activePostDetail.commentsCount} Bình luận</span>
            </div>

            {/* Comments List */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-gray-500 block">Tất cả bình luận:</span>
              {activePostDetail.comments?.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 text-xs">
                  <AvatarWithFrame user={c.author} size="sm" />
                  <div className="flex-1">
                    <div className="bg-gray-100 dark:bg-[#3A3B3C] p-2.5 rounded-2xl">
                      <span className="font-bold text-gray-900 dark:text-gray-100 block">
                        {c.author.name}
                      </span>
                      <p className="text-gray-800 dark:text-gray-200 mt-0.5">{c.content}</p>
                    </div>
                    <div className="flex items-center gap-3 px-2 mt-1 text-[10px] text-gray-400">
                      <span>{c.createdAt}</span>
                      <span className="hover:underline cursor-pointer">Thích</span>
                      <span className="hover:underline cursor-pointer">Trả lời</span>
                    </div>

                    {/* Replies */}
                    {c.replies?.map((rep) => (
                      <div key={rep.id} className="flex items-start gap-2 mt-2 ml-4">
                        <AvatarWithFrame user={rep.author} size="xs" />
                        <div className="bg-gray-100 dark:bg-[#3A3B3C] p-2 rounded-xl flex-1">
                          <span className="font-bold text-gray-900 dark:text-gray-100 block">
                            {rep.author.name}
                          </span>
                          <p className="text-gray-800 dark:text-gray-200">{rep.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comment input footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#242526] flex items-center gap-2">
            <AvatarWithFrame user={currentUser} size="sm" />
            <input
              type="text"
              placeholder="Viết câu trả lời hoặc thảo luận..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendComment();
              }}
              className="flex-1 bg-gray-100 dark:bg-[#3A3B3C] text-xs px-3.5 py-2 rounded-full"
            />
            <button
              onClick={handleSendComment}
              disabled={!commentInput.trim()}
              className="p-2 text-blue-600 disabled:text-gray-300"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
