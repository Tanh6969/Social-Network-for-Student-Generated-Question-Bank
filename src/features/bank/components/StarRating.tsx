import React, { useState } from 'react';
import { Star, RotateCcw } from 'lucide-react';

interface StarRatingProps {
  ratingAverage: number;
  ratingCount: number;
  userRatedStars?: number;
  onRate: (stars: number) => void;
  isAuthor?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  ratingAverage,
  ratingCount,
  userRatedStars = 0,
  onRate,
  isAuthor = false,
  size = 'md',
  showDetails = true,
}) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-5.5 h-5.5',
  };

  const getRatingFeedback = (stars: number) => {
    switch (stars) {
      case 1:
        return 'Chưa tốt (1 sao)';
      case 2:
        return 'Tạm được (2 sao)';
      case 3:
        return 'Khá hay (3 sao)';
      case 4:
        return 'Rất tốt (4 sao)';
      case 5:
        return 'Tuyệt vời (5 sao)';
      default:
        return '';
    }
  };

  const activeDisplayStars = hoveredStar !== null ? hoveredStar : userRatedStars;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-gray-50/80 dark:bg-[#1E1F20]/70 border border-gray-200/80 dark:border-gray-700/80 transition-colors">
      {/* Cột trái: Điểm trung bình cộng đồng */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 px-2.5 py-1 rounded-lg">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="font-bold text-xs text-amber-800 dark:text-amber-300">
            {ratingAverage > 0 ? ratingAverage.toFixed(1) : 'Chưa có'}
          </span>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/70">
            / 5.0
          </span>
        </div>

        {showDetails && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {ratingCount > 0 ? (
              <>
                <strong className="text-gray-700 dark:text-gray-200 font-semibold">
                  {ratingCount}
                </strong>{' '}
                đánh giá
              </>
            ) : (
              'Chưa có ai chấm sao'
            )}
          </span>
        )}
      </div>

      {/* Cột phải: Khối đánh giá tương tác 0 - 5 sao */}
      <div className="flex items-center gap-2">
        {isAuthor ? (
          <span className="text-[11px] font-medium text-gray-400 bg-gray-100 dark:bg-[#2A2B2D] px-2 py-1 rounded-md">
            Câu hỏi của bạn (không tự chấm sao)
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">
              Chấm sao:
            </span>

            {/* Dải 5 ngôi sao (1 - 5) */}
            <div
              className="flex items-center gap-0.5"
              onMouseLeave={() => setHoveredStar(null)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= activeDisplayStars;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      if (userRatedStars === star) {
                        onRate(0); // Bấm lại vào sao đã chọn để hủy đánh giá (0 sao)
                      } else {
                        onRate(star);
                      }
                    }}
                    onMouseEnter={() => setHoveredStar(star)}
                    title={`Đánh giá ${star} sao`}
                    className="p-1 rounded-md hover:bg-amber-100/60 dark:hover:bg-amber-950/40 transition-transform active:scale-125 focus:outline-hidden cursor-pointer"
                  >
                    <Star
                      className={`${starSizes[size]} transition-all duration-150 ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                          : 'text-gray-300 dark:text-gray-600 hover:text-amber-300'
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
                title="Hủy đánh giá"
                className="p-1 rounded-md text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-[11px] flex items-center cursor-pointer ml-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Feedback tooltip / text */}
            {activeDisplayStars > 0 && (
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 ml-1 truncate max-w-[120px]">
                {getRatingFeedback(activeDisplayStars)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
