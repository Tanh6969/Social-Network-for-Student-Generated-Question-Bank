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
            <div className="w-8 h-8 rounded-lg bg-fb-blue-soft text-fb-blue flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-fb-text">
                Thống kê & Đánh giá câu hỏi
              </h3>
              <p className="text-xs text-fb-text-2">
                Dữ liệu thống kê cộng đồng từ hệ thống
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-fb-btn-hover text-fb-text-3 hover:text-fb-text-2 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung tóm tắt câu hỏi */}
        <div className="px-4 py-3 bg-fb-inset/70 border-b border-fb-divider">
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
                ? 'border-fb-blue text-fb-blue'
                : 'border-transparent text-fb-text-2 hover:text-fb-text'
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
                ? 'border-fb-blue text-fb-blue'
                : 'border-transparent text-fb-text-2 hover:text-fb-text'
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
                <div className="bg-fb-blue-soft/60 p-3.5 rounded-lg border border-fb-blue/60">
                  <div className="flex items-center gap-1.5 text-fb-blue text-xs font-semibold mb-1">
                    <Users className="w-4 h-4" />
                    <span>Lượt làm bài</span>
                  </div>
                  <div className="text-xl font-bold text-fb-blue">
                    {totalAnswers}
                  </div>
                  <div className="text-xs text-fb-text-2">
                    Tổng số sinh viên đã làm
                  </div>
                </div>

                <div className="bg-fb-success-soft/60 p-3.5 rounded-lg border border-fb-success/60">
                  <div className="flex items-center gap-1.5 text-fb-success text-xs font-semibold mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tỷ lệ làm đúng</span>
                  </div>
                  <div className="text-xl font-bold text-fb-success">
                    {correctRate}%
                  </div>
                  <div className="text-xs text-fb-text-2">
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
                              ? 'bg-fb-success text-white'
                              : 'bg-fb-btn text-fb-text'
                          }`}
                        >
                          {opt}
                        </span>
                        <div className="flex-1 bg-fb-btn rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isCorrect ? 'bg-fb-success' : 'bg-fb-blue'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-fb-text-2 text-xs font-medium">
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
              <div className="bg-fb-warning-soft/60 p-4 rounded-lg border border-fb-warning/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-fb-warning text-xs font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-fb-warning" />
                    <span>Điểm đánh giá trung bình</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-fb-warning">
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-fb-text-3">/ 4.0</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-fb-text">
                    {totalRatings}
                  </div>
                  <div className="text-xs text-fb-text-3">Lượt đánh giá</div>
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
                        <div className="flex-1 bg-fb-input rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full bg-fb-warning rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-fb-text-3 text-xs">
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
                  <span className="text-xs text-fb-text-3">
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
                          <span className="text-xs text-fb-text-3 font-normal">
                            ({item.user_id})
                          </span>
                        </span>
                        <div className="flex items-center gap-1 text-fb-warning font-bold text-xs">
                          <Star className="w-3 h-3 fill-amber-400 text-fb-warning" />
                          <span>{item.rating} / 4.0</span>
                        </div>
                      </div>
                      <p className="text-fb-text-2 leading-relaxed">
                        {item.comment}
                      </p>
                      <div className="text-xs text-fb-text-3 pt-0.5">
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
                      className="w-full py-2 bg-fb-input hover:bg-fb-btn-hover rounded-lg text-xs font-medium text-fb-text-2 transition flex items-center justify-center gap-1 cursor-pointer"
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
            className="px-5 py-1.5 bg-fb-btn hover:bg-fb-btn-hover text-fb-text rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
