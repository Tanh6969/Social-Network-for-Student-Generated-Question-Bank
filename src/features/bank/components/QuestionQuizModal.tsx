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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200">
      <div className="bg-fb-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-fb-divider animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-fb-divider flex items-center justify-between bg-fb-input">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs bg-fb-blue-soft text-fb-blue px-2.5 py-0.5 rounded-full">
                {activeQuizQuestion.subject}
              </span>
              <span className="text-xs text-fb-text-2">{activeQuizQuestion.chapter}</span>
            </div>
            <h3 className="font-bold text-sm text-fb-text mt-1">
              Kiểm tra trực tuyến & Làm thử câu hỏi
            </h3>
          </div>

          <button
            onClick={() => {
              setActiveQuizQuestion(null);
              handleReset();
            }}
            className="p-1.5 rounded-full hover:bg-fb-btn-hover text-fb-text-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Làm bài / Thống kê */}
        <div className="flex border-b border-fb-divider px-4 bg-fb-card text-xs font-semibold">
          <button
            onClick={() => setActiveTab('QUIZ')}
            className={`py-2.5 px-3 border-b-2 transition ${
              activeTab === 'QUIZ'
                ? 'border-fb-blue text-fb-blue'
                : 'border-transparent text-fb-text-2 hover:text-fb-text'
            }`}
          >
            Làm bài thi
          </button>
          <button
            onClick={() => setActiveTab('STATS')}
            className={`py-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'STATS'
                ? 'border-fb-blue text-fb-blue'
                : 'border-transparent text-fb-text-2 hover:text-fb-text'
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
              <div className="bg-fb-input p-4 rounded-lg border border-fb-divider">
                <p className="font-semibold text-sm sm:text-base text-fb-text leading-relaxed">
                  {activeQuizQuestion.content}
                </p>
              </div>

              {/* 4 Options A, B, C, D */}
              <div className="space-y-2.5">
                {activeQuizQuestion.options.map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  const isAnswer = activeQuizQuestion.correctAnswer === opt.id;

                  let optionStyle =
                    'border-fb-divider bg-fb-card hover:border-fb-blue';
                  if (isSelected && !hasSubmitted) {
                    optionStyle =
                      'border-fb-blue bg-fb-blue-soft/70 text-fb-blue ring-1 ring-fb-blue';
                  } else if (hasSubmitted) {
                    if (isAnswer) {
                      optionStyle =
                        'border-fb-success bg-fb-success-soft text-fb-success ring-2 ring-fb-success';
                    } else if (isSelected && !isAnswer) {
                      optionStyle =
                        'border-fb-danger bg-fb-danger-soft text-fb-danger ring-2 ring-fb-danger';
                    }
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => !hasSubmitted && setSelectedOption(opt.id)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition flex items-center justify-between text-xs sm:text-sm font-medium ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected || (hasSubmitted && isAnswer)
                              ? 'bg-fb-blue text-white'
                              : 'bg-fb-input text-fb-text'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                      </div>

                      {hasSubmitted && isAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-fb-success shrink-0" />
                      )}
                      {hasSubmitted && isSelected && !isAnswer && (
                        <XCircle className="w-5 h-5 text-fb-danger shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Result & Explanation */}
              {hasSubmitted && (
                <div
                  className={`p-4 rounded-lg border animate-in fade-in duration-200 ${
                    isCorrect
                      ? 'bg-fb-success-soft border-fb-success/30'
                      : 'bg-fb-danger-soft border-fb-danger/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-fb-success" />
                        <span className="text-fb-success">
                          Chính xác! (+10 Điểm cống hiến)
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-fb-danger" />
                        <span className="text-fb-danger">
                          Chưa chính xác! Đáp án đúng là {activeQuizQuestion.correctAnswer}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-fb-text leading-relaxed font-normal bg-fb-card/70 p-3 rounded-lg border border-black/5">
                    <strong>Lời giải chi tiết: </strong>
                    {activeQuizQuestion.explanation}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* STATS TAB (BANK.08, BANK.10) */
            <div className="space-y-4">
              <div className="p-4 bg-fb-blue-soft rounded-lg border border-fb-blue/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-fb-text-2">Tỉ lệ trả lời đúng</span>
                  <p className="text-2xl font-bold text-fb-blue">
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
                  <span className="text-xs text-fb-text-2">Tổng số lượt làm</span>
                  <p className="text-2xl font-bold text-fb-text">
                    {activeQuizQuestion.totalAttempts || 145}
                  </p>
                </div>
              </div>

              {/* Bar chart of distribution */}
              <div>
                <h4 className="font-bold text-xs text-fb-text-2 mb-2">
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
                        <div className="flex-1 bg-fb-input rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full ${
                              letter === activeQuizQuestion.correctAnswer
                                ? 'bg-fb-success'
                                : 'bg-fb-blue'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-fb-text-2">{pct}% ({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phân bố đánh giá 0 - 4 sao (GET /questions/{id}/statistics) */}
              <div className="pt-3 border-t border-fb-divider">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-xs text-fb-text-2">
                    Phân bố đánh giá (thang 0 – 4 sao):
                  </h4>
                  <span className="text-xs font-bold text-fb-warning">
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
                        <span className="w-12 font-medium text-fb-text-2">
                          {level} sao
                        </span>
                        <div className="flex-1 bg-fb-input rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full bg-fb-warning rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-fb-text-3 text-xs">
                          {pct}% ({count})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rating 0 to 4 stars (POST /questions/{id}/rate) */}
              <div className="p-4 bg-fb-input rounded-lg border border-fb-divider text-center">
                <span className="text-xs font-semibold text-fb-text-2 block mb-2">
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
                            ? 'text-fb-warning fill-amber-500'
                            : 'text-fb-text-3'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {hasRated && (
                  <p className="text-xs text-fb-success font-semibold">
                    Đã lưu đánh giá {userStars} / 4 sao!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-fb-divider bg-fb-input flex items-center justify-between">
          {hasSubmitted ? (
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-fb-divider rounded-lg text-xs font-semibold hover:bg-fb-hover transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại câu này</span>
            </button>
          ) : (
            <div className="text-xs text-fb-text-3">Chọn 1 đáp án A, B, C hoặc D</div>
          )}

          {!hasSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className="px-6 py-2 bg-fb-blue hover:bg-fb-blue-hover disabled:bg-fb-divider text-white rounded-lg text-xs font-bold shadow-md transition"
            >
              Nộp bài kiểm tra
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveQuizQuestion(null);
                handleReset();
              }}
              className="px-6 py-2 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold transition"
            >
              Hoàn thành
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
