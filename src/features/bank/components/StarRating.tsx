import React, { useState } from 'react';
import { Star, RotateCcw } from 'lucide-react';

interface StarRatingProps {
  ratingAverage: number;
  ratingCount: number;
  userRatedStars?: number;
  onRate: (stars: number) => void;
  isAuthor?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
  ratingAverage,
  ratingCount,
  userRatedStars = 0,
  onRate,
  isAuthor = false,
  size = 'md',
}) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const activeDisplayStars = hoveredStar !== null ? hoveredStar : userRatedStars;

  return (
    <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-gray-50/80 dark:bg-[#1E1F20]/60 border border-gray-200/60 dark:border-gray-700/60">
      {/* Cột trái: Điểm & số lượt đánh giá */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{ratingAverage > 0 ? ratingAverage.toFixed(1) : '—'}</span>
        </div>
        <span className="text-xs text-gray-400">
          ({ratingCount})
        </span>
      </div>

      {/* Cột phải: 5 ngôi sao tương tác */}
      <div className="flex items-center gap-1.5">
        {isAuthor ? (
          <span className="text-[11px] text-gray-400 font-medium">Tác giả</span>
        ) : (
          <div className="flex items-center gap-1">
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
                        onRate(0);
                      } else {
                        onRate(star);
                      }
                    }}
                    onMouseEnter={() => setHoveredStar(star)}
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

            {userRatedStars > 0 && (
              <button
                type="button"
                onClick={() => onRate(0)}
                title="Bỏ đánh giá"
                className="p-1 text-gray-400 hover:text-rose-500 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
