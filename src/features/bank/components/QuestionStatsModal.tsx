import React, { useState } from 'react';
import {
  X,
  BarChart2,
  CheckCircle2,
  Star,
  Users,
  MessageSquare,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';
import { Question } from '../../demo/types';

interface QuestionStatsModalProps {
  question: Question | null;
  onClose: () => void;
}

export const QuestionStatsModal: React.FC<QuestionStatsModalProps> = ({
  question,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'STATS' | 'RATINGS'>('STATS');
  const [visibleRatingsCount, setVisibleRatingsCount] = useState(3);

  if (!question) return null;

  // Mocking GET /questions/{questionId}/statistics
  const totalAnswers = question.totalAttempts || 48;
  const correctAttempts = question.correctAttempts || Math.round(totalAnswers * 0.75);
  const correctRate = Math.round((correctAttempts / (totalAnswers || 1)) * 100);

  const optionDist: Record<string, number> = question.optionDistribution || {
    A: Math.round(totalAnswers * 0.7),
    B: Math.round(totalAnswers * 0.15),
    C: Math.round(totalAnswers * 0.1),
    D: Math.max(0, totalAnswers - Math.round(totalAnswers * 0.95)),
  };

  const avgRating = question.ratingAverage > 0 ? Math.min(4.0, question.ratingAverage) : 3.8;
  const totalRatings = question.ratingCount || 25;

  // Distribution for ratings [0, 1, 2, 3, 4]
  const ratingDistribution: Record<number, number> = {
    4: Math.max(1, Math.round(totalRatings * 0.65)),
    3: Math.max(0, Math.round(totalRatings * 0.22)),
    2: Math.max(0, Math.round(totalRatings * 0.09)),
    1: Math.max(0, Math.round(totalRatings * 0.03)),
    0: Math.max(0, Math.round(totalRatings * 0.01)),
  };

  // Mocking GET /questions/{questionId}/ratings?after=...&limit=...
  const mockRatingsList = [
    {
      id: 'rate_01',
      user_id: 'SV20210042',
      userName: 'Trần Minh Đức',
      rating: '4.00',
      comment: 'Câu hỏi phân loại rất hay, giải thích ngắn gọn và dễ hiểu!',
      createdAt: '1 giờ trước',
    },
    {
      id: 'rate_02',
      user_id: 'SV20224510',
      userName: 'Nguyễn Thị Thu',
      rating: '4.00',
      comment: 'Bám sát đề thi giữa kỳ của thầy cô. Đề xuất thêm ví dụ.',
      createdAt: '5 giờ trước',
    },
    {
      id: 'rate_03',
      user_id: 'SV20203112',
      userName: 'Vũ Quốc Bảo',
      rating: '3.00',
      comment: 'Đề bài rõ ràng, đáp án chính xác.',
      createdAt: 'Hôm qua',
    },
    {
      id: 'rate_04',
      user_id: 'SV20216789',
      userName: 'Lê Hoàng Nam',
      rating: '4.00',
      comment: 'Cần ra thêm nhiều câu tương tự dạng này nhé tác giả.',
      createdAt: '2 ngày trước',
    },
    {
      id: 'rate_05',
      user_id: 'SV20229811',
      userName: 'Đỗ Hải Đăng',
      rating: '2.00',
      comment: 'Hơi bẫy một chút ở câu từ nhưng chấp nhận được.',
      createdAt: '3 ngày trước',
    },
  ];

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200">
      <div className="bg-fb-card rounded-lg shadow-2xl max-w-xl w-full max-h-[88vh] overflow-hidden flex flex-col border border-fb-divider animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-fb-divider flex items-center justify-between bg-fb-input">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-fb-blue flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-fb-text">
                Thống kê & Đánh giá câu hỏi
              </h3>
              <p className="text-[11px] text-gray-500">
                Dữ liệu thống kê cộng đồng từ hệ thống
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung tóm tắt câu hỏi */}
        <div className="px-4 py-3 bg-gray-50/70 dark:bg-[#1E1F20]/50 border-b border-fb-divider">
          <p className="text-xs font-medium text-fb-text line-clamp-2">
            {question.content}
          </p>
        </div>

        {/* Tab chuyển đổi */}
        <div className="flex border-b border-fb-divider px-4 bg-fb-card text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('STATS')}
            className={`py-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'STATS'
                ? 'border-blue-600 text-fb-blue'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Kết quả làm bài</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RATINGS')}
            className={`py-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'RATINGS'
                ? 'border-blue-600 text-fb-blue'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Đánh giá sao (0 - 4)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'STATS' ? (
            <div className="space-y-4">
              {/* Chỉ số tổng quan */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3.5 rounded-lg border border-blue-200/60 dark:border-blue-800/60">
                  <div className="flex items-center gap-1.5 text-fb-blue text-xs font-semibold mb-1">
                    <Users className="w-4 h-4" />
                    <span>Lượt làm bài</span>
                  </div>
                  <div className="text-xl font-black text-blue-900 dark:text-blue-200">
                    {totalAnswers}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Tổng số sinh viên đã làm
                  </div>
                </div>

                <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tỷ lệ làm đúng</span>
                  </div>
                  <div className="text-xl font-black text-emerald-900 dark:text-emerald-200">
                    {correctRate}%
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {correctAttempts} / {totalAnswers} câu trả lời đúng
                  </div>
                </div>
              </div>

              {/* Phân bố lựa chọn phương án A, B, C, D (option_distribution) */}
              <div className="bg-fb-input p-4 rounded-lg border border-fb-divider/80 space-y-2.5">
                <h4 className="text-xs font-bold text-fb-text">
                  Phân bố lựa chọn phương án
                </h4>
                <div className="space-y-2 text-xs">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const count = optionDist[opt] || 0;
                    const pct = Math.round((count / (totalAnswers || 1)) * 100);
                    const isCorrect = question.correctAnswer === opt;

                    return (
                      <div key={opt} className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-fb-text'
                          }`}
                        >
                          {opt}
                        </span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCorrect ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-fb-text-2 text-[11px] font-medium">
                          {pct}% ({count})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tổng quan sao */}
              <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>Điểm đánh giá trung bình</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-amber-900 dark:text-amber-200">
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400">/ 4.0</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-fb-text">
                    {totalRatings}
                  </div>
                  <div className="text-xs text-gray-400">Lượt đánh giá</div>
                </div>
              </div>

              {/* Phân bố 0 đến 4 sao (distribution) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-fb-text">
                  Phân bố đánh giá (thang 0 – 4 sao)
                </h4>
                <div className="space-y-1.5 text-xs">
                  {[4, 3, 2, 1, 0].map((level) => {
                    const count = ratingDistribution[level] || 0;
                    const pct = Math.round((count / (totalRatings || 1)) * 100);

                    return (
                      <div key={level} className="flex items-center gap-2">
                        <span className="w-12 font-medium text-fb-text-2">
                          {level} sao
                        </span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-gray-400 text-[11px]">
                          {pct}% ({count})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Danh sách đánh giá từ sinh viên (GET /questions/{id}/ratings) */}
              <div className="pt-3 border-t border-fb-divider space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-fb-text flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Nhận xét & đánh giá gần đây</span>
                  </h4>
                  <span className="text-[11px] text-gray-400">
                    {mockRatingsList.length} nhận xét
                  </span>
                </div>

                <div className="space-y-2">
                  {mockRatingsList.slice(0, visibleRatingsCount).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-fb-input rounded-lg border border-fb-divider text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-fb-text">
                          {item.userName}{' '}
                          <span className="text-[10px] text-gray-400 font-normal">
                            ({item.user_id})
                          </span>
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-[11px]">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{item.rating} / 4.0</span>
                        </div>
                      </div>
                      <p className="text-fb-text-2 leading-relaxed">
                        {item.comment}
                      </p>
                      <div className="text-[10px] text-gray-400 pt-0.5">
                        {item.createdAt}
                      </div>
                    </div>
                  ))}

                  {visibleRatingsCount < mockRatingsList.length && (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleRatingsCount((prev) =>
                          Math.min(mockRatingsList.length, prev + 2),
                        )
                      }
                      className="w-full py-2 bg-gray-100 dark:bg-[#2A2B2D] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs font-medium text-fb-text-2 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Xem thêm đánh giá</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-fb-divider bg-fb-input flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-fb-text rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
