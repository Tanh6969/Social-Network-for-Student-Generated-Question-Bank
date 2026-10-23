import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import {
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Star,
  BarChart2,
  Award,
  ChevronRight,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const QuestionQuizModal: React.FC = () => {
  const {
    activeQuizQuestion,
    setActiveQuizQuestion,
    answerQuestion,
    rateQuestion,
    showToast
  } = useApp();

  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [userStars, setUserStars] = useState<number>(0);
  const [hasRated, setHasRated] = useState(false);
  const [activeTab, setActiveTab] = useState<'QUIZ' | 'STATS'>('QUIZ');

  if (!activeQuizQuestion) return null;

  const handleSubmit = () => {
    if (!selectedOption) return;
    const correct = answerQuestion(activeQuizQuestion.id, selectedOption);
    setIsCorrect(correct);
    setHasSubmitted(true);
    if (correct) {
      showToast('Chúc mừng! Bạn đã trả lời chính xác (+10 điểm cống hiến)', 'success');
    } else {
      showToast('Rất tiếc! Đáp án chưa chính xác, hãy xem giải thích nhé.', 'warning');
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
    setIsCorrect(null);
  };

  const handleRate = (stars: number) => {
    setUserStars(stars);
    rateQuestion(activeQuizQuestion.id, stars);
    setHasRated(true);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-[#1E1F20]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 px-2.5 py-0.5 rounded-full">
                {activeQuizQuestion.subject}
              </span>
              <span className="text-xs text-gray-500">{activeQuizQuestion.chapter}</span>
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mt-1">
              Kiểm tra trực tuyến & Làm thử câu hỏi
            </h3>
          </div>

          <button
            onClick={() => {
              setActiveQuizQuestion(null);
              handleReset();
            }}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Làm bài / Thống kê */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-4 bg-white dark:bg-[#242526] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('QUIZ')}
            className={`py-2.5 px-3 border-b-2 transition ${
              activeTab === 'QUIZ'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Làm bài thi
          </button>
          <button
            onClick={() => setActiveTab('STATS')}
            className={`py-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'STATS'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Thống kê & Đánh giá</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'QUIZ' ? (
            <>
              {/* Question text */}
              <div className="bg-gray-50 dark:bg-[#1E1F20] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 leading-relaxed">
                  {activeQuizQuestion.content}
                </p>
              </div>

              {/* 4 Options A, B, C, D */}
              <div className="space-y-2.5">
                {activeQuizQuestion.options.map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  const isAnswer = activeQuizQuestion.correctAnswer === opt.id;

                  let optionStyle =
                    'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#242526] hover:border-blue-400';
                  if (isSelected && !hasSubmitted) {
                    optionStyle =
                      'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600';
                  } else if (hasSubmitted) {
                    if (isAnswer) {
                      optionStyle =
                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500';
                    } else if (isSelected && !isAnswer) {
                      optionStyle =
                        'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 ring-2 ring-red-500';
                    }
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => !hasSubmitted && setSelectedOption(opt.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs sm:text-sm font-medium ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected || (hasSubmitted && isAnswer)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                      </div>

                      {hasSubmitted && isAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {hasSubmitted && isSelected && !isAnswer && (
                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Result & Explanation */}
              {hasSubmitted && (
                <div
                  className={`p-4 rounded-xl border animate-in fade-in duration-200 ${
                    isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-emerald-800 dark:text-emerald-300">
                          Chính xác! (+10 Điểm cống hiến)
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-800 dark:text-red-300">
                          Chưa chính xác! Đáp án đúng là {activeQuizQuestion.correctAnswer}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-normal bg-white/70 dark:bg-black/30 p-3 rounded-lg border border-black/5">
                    <strong>Lời giải chi tiết: </strong>
                    {activeQuizQuestion.explanation}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* STATS TAB (BANK.08, BANK.10) */
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500">Tỉ lệ trả lời đúng</span>
                  <p className="text-2xl font-black text-blue-700 dark:text-blue-400">
                    {activeQuizQuestion.totalAttempts > 0
                      ? Math.round(
                          (activeQuizQuestion.correctAttempts / activeQuizQuestion.totalAttempts) *
                            100
                        )
                      : 85}
                    %
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Tổng số lượt làm</span>
                  <p className="text-2xl font-black text-gray-800 dark:text-gray-200">
                    {activeQuizQuestion.totalAttempts || 145}
                  </p>
                </div>
              </div>

              {/* Bar chart of distribution */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2">
                  Phân bố lựa chọn phương án của sinh viên:
                </h4>
                <div className="space-y-2 text-xs">
                  {['A', 'B', 'C', 'D'].map((letter) => {
                    const dist = activeQuizQuestion.optionDistribution || {
                      A: 80,
                      B: 12,
                      C: 10,
                      D: 5
                    };
                    const count = (dist as any)[letter] || 0;
                    const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
                    const pct = Math.round((count / total) * 100);

                    return (
                      <div key={letter} className="flex items-center gap-2">
                        <span className="w-5 font-bold">{letter}</span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full ${
                              letter === activeQuizQuestion.correctAnswer
                                ? 'bg-emerald-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-gray-500">{pct}% ({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phân bố đánh giá 0 - 4 sao (GET /questions/{id}/statistics) */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">
                    Phân bố đánh giá (thang 0 – 4 sao):
                  </h4>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    TB: {activeQuizQuestion.ratingAverage ? Math.min(4.0, activeQuizQuestion.ratingAverage).toFixed(1) : '3.8'} / 4.0
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[4, 3, 2, 1, 0].map((level) => {
                    // Phân bố mẫu khớp spec Slide 3
                    const distCounts: Record<number, number> = {
                      4: Math.max(1, Math.round((activeQuizQuestion.ratingCount || 38) * 0.7)),
                      3: Math.max(0, Math.round((activeQuizQuestion.ratingCount || 38) * 0.2)),
                      2: Math.max(0, Math.round((activeQuizQuestion.ratingCount || 38) * 0.08)),
                      1: Math.max(0, Math.round((activeQuizQuestion.ratingCount || 38) * 0.02)),
                      0: 0,
                    };
                    const count = distCounts[level] || 0;
                    const total = Object.values(distCounts).reduce((a, b) => a + b, 0) || 1;
                    const pct = Math.round((count / total) * 100);

                    return (
                      <div key={level} className="flex items-center gap-2">
                        <span className="w-12 font-medium text-gray-600 dark:text-gray-300">
                          {level} sao
                        </span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-gray-400 text-[11px]">
                          {pct}% ({count})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rating 0 to 4 stars (POST /questions/{id}/rate) */}
              <div className="p-4 bg-gray-50 dark:bg-[#1E1F20] rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-2">
                  Đánh giá câu hỏi này (thang 0 – 4 sao)
                </span>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {[1, 2, 3, 4].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(star)}
                      className="p-1 hover:scale-110 transition cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (userStars || activeQuizQuestion.userRatedStars || 0) >= star
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {hasRated && (
                  <p className="text-xs text-emerald-600 font-semibold">
                    Đã lưu đánh giá {userStars} / 4 sao!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1E1F20] flex items-center justify-between">
          {hasSubmitted ? (
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại câu này</span>
            </button>
          ) : (
            <div className="text-xs text-gray-400">Chọn 1 đáp án A, B, C hoặc D</div>
          )}

          {!hasSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              Nộp bài kiểm tra
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveQuizQuestion(null);
                handleReset();
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
            >
              Hoàn thành
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
