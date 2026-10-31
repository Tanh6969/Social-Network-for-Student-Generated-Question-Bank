import React, { useState, useEffect, useCallback } from 'react';
import { StudentExamSet } from '../studentBankData';
import { StarRating } from './StarRating';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  LogOut,
  Maximize2,
  Minimize2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface ExamTestFullscreenModalProps {
  exam: StudentExamSet;
  onClose: () => void;
  onRateQuestion: (questionId: string, stars: number, comment?: string) => void;
  currentUserId: string;
}

export const ExamTestFullscreenModal: React.FC<
  ExamTestFullscreenModalProps
> = ({ exam, onClose, onRateQuestion, currentUserId }) => {
  // Test states
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>(
    {},
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Elapsed timer starting from 0:00
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Modals inside test
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lock body scroll on mount to prevent double scrollbars
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Enter browser fullscreen on mount (with catch for browser permissions)
  useEffect(() => {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // Ignored if browser blocks automatic fullscreen
    }

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Prevent leaving / accidental tab close while test is active
  useEffect(() => {
    if (isSubmitted) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return 'Bài thi chưa nộp, bạn có chắc chắn muốn rời đi?';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSubmitted]);

  // Handle timer counting up from 0:00
  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted]);

  const handleSubmitExam = () => {
    setIsSubmitted(true);
    setShowConfirmSubmit(false);
  };

  const handleSelectOption = (
    questionId: string,
    optionId: 'A' | 'B' | 'C' | 'D',
  ) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleRestartExam = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setElapsedSeconds(0);
    setIsSubmitted(false);
  };

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const currentQuestion = exam.questions[currentQuestionIndex];

  // Score statistics after submission
  const correctCount = exam.questions.filter(
    (q) => answers[q.id] === q.correctAnswer,
  ).length;
  const scoreOutOf10 =
    exam.questions.length > 0
      ? Number(((correctCount / exam.questions.length) * 10).toFixed(1))
      : 0;

  return (
    <div className="fixed inset-0 z-[1000] bg-gray-100 dark:bg-[#18191A] flex flex-col text-fb-text select-none overflow-hidden animate-in fade-in duration-200">
      {/* ================= TOP BAR (CỐ ĐỊNH, KHÔNG CHO OUT RA) ================= */}
      <header className="h-16 px-4 sm:px-6 bg-fb-card border-b border-fb-divider flex items-center justify-between shrink-0 shadow-xs">
        {/* Left: Info */}
        <div className="flex items-center gap-3">
          <span className="tabular-nums text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {exam.courseCode}
          </span>
          <div className="truncate max-w-[200px] sm:max-w-md">
            <h2 className="font-bold text-sm text-fb-text truncate">
              {exam.title}
            </h2>
            <p className="text-[11px] text-gray-400 truncate">
              {exam.subject} · {exam.chapter}
            </p>
          </div>
        </div>

        {/* Right Actions: Timer, Tiến độ Đã làm, Nút thoát */}
        <div className="flex items-center gap-3">
          {!isSubmitted ? (
            <>
              {/* Timer đếm tăng dần từ 0:00 đặt cạnh Đã làm */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg tabular-nums font-bold text-xs sm:text-sm bg-gray-100 text-gray-800 dark:bg-[#3A3B3C] dark:text-gray-100 shadow-xs">
                <Clock className="w-4 h-4 text-fb-blue" />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>

              <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                Đã làm:{' '}
                <strong className="text-blue-600 font-bold">
                  {answeredCount}
                </strong>
                /{exam.questions.length}
              </span>

              <button
                type="button"
                onClick={() => setShowConfirmExit(true)}
                title="Rời khỏi phòng thi"
                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-fb-blue hover:bg-fb-blue-hover text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer"
            >
              Thoát phòng thi
            </button>
          )}
        </div>
      </header>

      {/* ================= GIAO DIỆN 1: ĐANG LÀM BÀI THI (Chưa nộp) ================= */}
      {!isSubmitted && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Area: Nội dung câu hỏi đang làm */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col justify-between">
            <div className="max-w-3xl mx-auto w-full space-y-4">
              {/* Question header */}
              <div className="flex items-center justify-between pb-3 border-b border-fb-divider">
                <span className="font-bold text-sm px-3 py-1 rounded-lg bg-blue-600 text-white shadow-xs">
                  Câu {currentQuestionIndex + 1} / {exam.questions.length}
                </span>
              </div>

              {/* Question text */}
              <h3 className="text-base sm:text-lg font-semibold text-fb-text leading-relaxed py-2">
                {currentQuestion.content}
              </h3>

              {/* 4 Options */}
              <div className="space-y-2.5 pt-2">
                {currentQuestion.options.map((opt) => {
                  const isSelected =
                    answers[currentQuestion.id] === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() =>
                        handleSelectOption(currentQuestion.id, opt.id)
                      }
                      className={`p-4 rounded-lg border text-sm font-medium transition cursor-pointer flex items-center gap-3.5 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs'
                          : 'border-fb-divider hover:bg-white dark:hover:bg-[#242526] text-fb-text'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-fb-text'
                        }`}
                      >
                        {opt.id}
                      </span>
                      <span className="leading-snug">{opt.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Nav: Câu trước / Câu tiếp theo */}
            <div className="max-w-3xl mx-auto w-full pt-6 mt-6 border-t border-fb-divider flex items-center justify-between">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                }
                className="px-4 py-2 rounded-lg text-xs font-bold border border-gray-300 dark:border-gray-600 text-fb-text hover:bg-gray-200 dark:hover:bg-[#3A3B3C] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <span className="text-xs text-gray-400 tabular-nums">
                {currentQuestionIndex + 1} of {exam.questions.length}
              </span>

              <button
                type="button"
                disabled={currentQuestionIndex >= exam.questions.length - 1}
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(exam.questions.length - 1, prev + 1),
                  )
                }
                className="px-4 py-2 rounded-lg text-xs font-bold bg-fb-blue hover:bg-fb-blue-hover disabled:opacity-30 disabled:cursor-not-allowed text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </main>

          {/* Right Area: Bảng danh sách câu hỏi điều hướng */}
          <aside className="w-full lg:w-72 bg-fb-card border-t lg:border-t-0 lg:border-l border-fb-divider p-4 flex flex-col justify-between shrink-0">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-fb-divider">
                <h4 className="font-bold text-xs text-gray-500">
                  Danh sách câu hỏi
                </h4>
                <span className="text-xs tabular-nums font-bold text-blue-600">
                  {answeredCount}/{exam.questions.length}
                </span>
              </div>

              {/* Grid các số câu hỏi */}
              <div className="grid grid-cols-5 gap-2">
                {exam.questions.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIndex;
                  const isAnswered = !!answers[q.id];

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-9 rounded-lg font-bold text-xs transition flex items-center justify-center cursor-pointer ${
                        isCurrent
                          ? 'ring-2 ring-blue-600 bg-blue-600 text-white shadow-xs'
                          : isAnswered
                          ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold'
                          : 'bg-fb-input text-fb-text-2 hover:bg-gray-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Chú thích màu */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-fb-divider text-[11px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-100 text-blue-700 border border-blue-300" />
                  <span>Đã làm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-fb-input border border-gray-300" />
                  <span>Chưa làm</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-fb-divider">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer"
              >
                Nộp bài thi
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ================= GIAO DIỆN 2: SAU KHI NỘP BÀI (XEM ĐÁP ÁN & THỐNG KÊ) ================= */}
      {isSubmitted && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Thống kê kết quả bài thi */}
            <div className="bg-fb-card rounded-lg p-6 shadow-fb-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-amber-500" />
                    <h2 className="text-xl font-bold text-fb-text">
                      Kết quả bài thi thử
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {exam.title} ({exam.courseCode} · {exam.subject})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRestartExam}
                    className="px-4 py-2 rounded-lg text-xs font-bold border border-gray-300 dark:border-gray-600 text-fb-text hover:bg-fb-hover transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại đề</span>
                  </button>
                </div>
              </div>

              {/* 3 Thẻ thống kê điểm & thời gian */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-center">
                  <span className="text-2xl font-black text-fb-blue block">
                    {scoreOutOf10} / 10
                  </span>
                  <span className="text-xs text-gray-500">Điểm số đạt được</span>
                </div>

                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
                    {correctCount} / {exam.questions.length}
                  </span>
                  <span className="text-xs text-gray-500">
                    Số câu trả lời đúng (
                    {Math.round((correctCount / exam.questions.length) * 100)}
                    %)
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 text-center">
                  <span className="text-2xl font-black text-purple-600 dark:text-purple-400 block">
                    {formatTime(elapsedSeconds)}
                  </span>
                  <span className="text-xs text-gray-500">Thời gian làm bài</span>
                </div>
              </div>
            </div>

            {/* Chi tiết từng câu hỏi & Đáp án & Chấm sao */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-fb-text flex items-center justify-between">
                <span>Chi tiết đáp án & Giải thích từng câu</span>
                <span className="text-xs text-gray-400 font-normal">
                  Bạn có thể đánh giá từ 0 đến 4 sao cho từng câu hỏi bên dưới
                </span>
              </h3>

              {exam.questions.map((q, idx) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correctAnswer;
                const isAuthor = q.creatorId === currentUserId;

                return (
                  <div
                    key={q.id}
                    className="bg-fb-card rounded-lg p-5 shadow-fb-card space-y-3.5"
                  >
                    {/* Header câu */}
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-fb-divider">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-fb-text">
                          Câu {idx + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {isCorrect ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Đúng
                          </span>
                        ) : userAns ? (
                          <span className="flex items-center gap-1 text-rose-600">
                            <XCircle className="w-4 h-4" />
                            Sai (Bạn chọn: {userAns})
                          </span>
                        ) : (
                          <span className="text-gray-400">Chưa làm</span>
                        )}
                      </div>
                    </div>

                    {/* Question text */}
                    <div className="text-sm font-semibold text-fb-text leading-relaxed">
                      {q.content}
                    </div>

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt) => {
                        const isThisCorrect = q.correctAnswer === opt.id;
                        const isUserChoice = userAns === opt.id;

                        let borderStyle =
                          'border-fb-divider bg-fb-card/50';
                        if (isThisCorrect) {
                          borderStyle =
                            'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-semibold';
                        } else if (isUserChoice && !isThisCorrect) {
                          borderStyle =
                            'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-lg border text-xs font-medium flex items-start gap-2.5 ${borderStyle}`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isThisCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : isUserChoice
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-fb-text'
                              }`}
                            >
                              {opt.id}
                            </span>
                            <span className="leading-snug">{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Giải thích chi tiết */}
                    <div className="p-3.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 text-xs space-y-1">
                      <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đáp án chính xác: Phương án {q.correctAnswer}</span>
                      </div>
                      <p className="text-emerald-950 dark:text-emerald-100 font-normal leading-relaxed">
                        <strong>Giải thích:</strong> {q.explanation}
                      </p>
                    </div>

                    {/* Đánh giá sao câu hỏi (0 - 4 sao) */}
                    <div className="pt-2 border-t border-fb-divider">
                      <StarRating
                        ratingAverage={q.ratingAverage || 0}
                        ratingCount={q.ratingCount || 0}
                        userRatedStars={q.userRatedStars || 0}
                        userComment={q.userComment}
                        onRate={(stars, comment) =>
                          onRateQuestion(q.id, stars, comment)
                        }
                        isAuthor={isAuthor}
                        size="md"
                        allowComment={true}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN NỘP BÀI ================= */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-fb-card rounded-lg max-w-sm w-full p-5 border border-fb-divider shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-fb-text">
                Xác nhận nộp bài?
              </h3>
            </div>

            <p className="text-xs text-fb-text-2 leading-relaxed">
              Bạn đã hoàn thành{' '}
              <strong className="text-blue-600 font-bold">
                {answeredCount} / {exam.questions.length}
              </strong>{' '}
              câu hỏi. Thời gian làm bài là{' '}
              <strong>{formatTime(elapsedSeconds)}</strong>. Bạn có chắc chắn muốn nộp
              bài không?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-fb-text hover:bg-fb-hover transition cursor-pointer"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={handleSubmitExam}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-xs"
              >
                Xác nhận nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CẢNH BÁO KHÔNG CHO OUT RA ================= */}
      {showConfirmExit && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-fb-card rounded-lg max-w-sm w-full p-5 border border-fb-divider shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-fb-text">
                Cảnh báo rời phòng thi
              </h3>
            </div>

            <p className="text-xs text-fb-text-2 leading-relaxed">
              Bạn đang trong quá trình làm bài thi thử. Nếu rời đi bây giờ, toàn bộ câu trả lời sẽ <strong>không được lưu lại</strong>!
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmExit(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmExit(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
              >
                Thoát bài thi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
