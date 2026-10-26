import React, { useState } from 'react';
import { Star, RotateCcw, MessageSquare, Send, Check } from 'lucide-react';

interface StarRatingProps {
  ratingAverage: number;
  ratingCount: number;
  userRatedStars?: number;
  userComment?: string;
  onRate: (stars: number, comment?: string) => void;
  isAuthor?: boolean;
  size?: 'sm' | 'md' | 'lg';
  allowComment?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  ratingAverage,
  ratingCount,
  userRatedStars = 0,
  userComment,
  onRate,
  isAuthor = false,
  size = 'md',
  allowComment = false,
}) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentDraft, setCommentDraft] = useState({
    source: userComment,
    text: userComment || '',
  });
  const commentText =
    commentDraft.source === userComment ? commentDraft.text : userComment || '';
  const setCommentText = (text: string) =>
    setCommentDraft({ source: userComment, text });

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const activeDisplayStars =
    hoveredStar !== null ? hoveredStar : userRatedStars;

  const handleRateStar = (star: number) => {
    if (userRatedStars === star) {
      onRate(0); // 0 sao (hủy đánh giá)
      setCommentText('');
      setShowCommentBox(false);
    } else {
      onRate(star, commentText.trim() || undefined);
    }
  };

  const handleSendComment = () => {
    if (commentText.trim()) {
      const targetStars = userRatedStars > 0 ? userRatedStars : 4;
      onRate(targetStars, commentText.trim());
      setShowCommentBox(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-gray-50/80 dark:bg-[#1E1F20]/60 border border-gray-200/60 dark:border-gray-700/60">
        {/* Cột trái: Điểm trung bình (thang điểm 4) & số lượt đánh giá */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>
              {ratingAverage > 0 ? ratingAverage.toFixed(1) : '—'}
            </span>
            <span className="text-[10px] text-gray-400 font-normal">/ 4.0</span>
          </div>
          <span className="text-xs text-gray-400">({ratingCount})</span>
        </div>

        {/* Cột phải: 4 ngôi sao tương tác (thang điểm [0; 4]) */}
        <div className="flex items-center gap-1.5">
          {isAuthor ? (
            <span className="text-[11px] text-gray-400 font-medium">Tác giả</span>
          ) : (
            <div className="flex items-center gap-1">
              <div
                className="flex items-center gap-0.5"
                onMouseLeave={() => setHoveredStar(null)}
              >
                {[1, 2, 3, 4].map((star) => {
                  const isFilled = star <= activeDisplayStars;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRateStar(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      title={`Đánh giá ${star} sao (thang 0-4)`}
                      className="p-0.5 hover:scale-110 transition cursor-pointer"
                    >
                      <Star
                        className={`${starSizes[size]} transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Nút reset 0 sao nếu đã đánh giá */}
              {userRatedStars > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onRate(0);
                    setCommentText('');
                    setShowCommentBox(false);
                  }}
                  title="Bỏ đánh giá (về 0 sao)"
                  className="p-1 text-gray-400 hover:text-rose-500 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}

              {/* Nút nhận xét nếu được phép */}
              {allowComment && (
                <button
                  type="button"
                  onClick={() => setShowCommentBox(!showCommentBox)}
                  title="Viết nhận xét cho câu hỏi"
                  className={`p-1 transition cursor-pointer ${
                    showCommentBox || userComment
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-gray-400 hover:text-blue-500'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ô nhận xét (POST /questions/{id}/rate -> comment) */}
      {showCommentBox && (
        <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
          <input
            type="text"
            placeholder="Viết nhận xét ngắn cho câu hỏi này..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
            className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-[#2A2B2D] rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSendComment}
            disabled={!commentText.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
            <span>Gửi</span>
          </button>
        </div>
      )}

      {/* Hiển thị nhận xét đã gửi của sinh viên */}
      {userComment && !showCommentBox && (
        <div className="flex items-center justify-between text-xs bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 px-3 py-1.5 rounded-lg border border-blue-200/60 dark:border-blue-800/60 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 truncate">
            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Nhận xét của bạn:
            </span>
            <span className="italic truncate text-blue-700 dark:text-blue-300">
              "{userComment}"
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowCommentBox(true)}
            className="text-[11px] font-bold text-blue-600 hover:underline shrink-0 ml-2 cursor-pointer"
          >
            Sửa
          </button>
        </div>
      )}
    </div>
  );
};
