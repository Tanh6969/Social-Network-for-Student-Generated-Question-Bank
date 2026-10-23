import React, { useState } from 'react';
import { Star, RotateCcw, MessageSquare, Send } from 'lucide-react';

interface StarRatingProps {
  ratingAverage: number;
  ratingCount: number;
  userRatedStars?: number;
  onRate: (stars: number, comment?: string) => void;
  isAuthor?: boolean;
  size?: 'sm' | 'md' | 'lg';
  allowComment?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  ratingAverage,
  ratingCount,
  userRatedStars = 0,
  onRate,
  isAuthor = false,
  size = 'md',
  allowComment = false,
}) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');

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
    } else {
      onRate(star, commentText.trim() || undefined);
    }
  };

  const handleSendComment = () => {
    if (userRatedStars > 0 && commentText.trim()) {
      onRate(userRatedStars, commentText.trim());
      setCommentText('');
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
                  onClick={() => onRate(0)}
                  title="Bỏ đánh giá (về 0 sao)"
                  className="p-1 text-gray-400 hover:text-rose-500 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}

              {/* Nút nhận xét nếu được phép */}
              {allowComment && userRatedStars > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCommentBox(!showCommentBox)}
                  title="Gửi nhận xét kèm đánh giá"
                  className="p-1 text-gray-400 hover:text-blue-500 transition cursor-pointer"
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
            placeholder="Viết nhận xét cho câu hỏi (tùy chọn)..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-[#2A2B2D] rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSendComment}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
