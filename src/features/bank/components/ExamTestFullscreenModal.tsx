import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StudentExamSet } from '../studentBankData';
import { StarRating } from './StarRating';
import { useLockPageScroll } from '../../../shared/lockPageScroll';
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

type OptionKey = 'A' | 'B' | 'C' | 'D';

/** Kết quả chấm của một câu do máy chủ trả về (POST /questions/{id}/answer). */
export interface RemoteAnswerResult {
  correctAnswer?: string;
  explanation?: string;
  isCorrect?: boolean;
}

interface ExamTestFullscreenModalProps {
  exam: StudentExamSet;
  onClose: () => void;
  onRateQuestion: (questionId: string, stars: number, comment?: string) => void;
  currentUserId: string;
  /**
   * Phiên thật: đáp án bị ẩn nên bài được chấm ở máy chủ khi nộp.
   * Không truyền = phiên demo, chấm bằng đáp án có sẵn trong đề.
   */
  onSubmitAnswers?: (
    answers: Record<string, OptionKey>,
  ) => Promise<Record<string, RemoteAnswerResult>>;
  /** Nội dung thêm dưới mỗi câu ở màn kết quả (vd. bình luận). */
  renderQuestionExtras?: (questionId: string) => React.ReactNode;
}

export const ExamTestFullscreenModal: React.FC<
  ExamTestFullscreenModalProps
> = ({
  exam,
  onClose,
  onRateQuestion,
  currentUserId,
  onSubmitAnswers,
  renderQuestionExtras,
}) => {
  // Test states
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [remoteResults, setRemoteResults] = useState<
    Record<string, RemoteAnswerResult>
  >({});
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>(
    {},
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Elapsed timer starting from 0:00
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Modals inside test
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [, setIsFullscreen] = useState(false);
  // Popup rời phòng mở vì người dùng thoát toàn màn hình (Esc / F11)
  const [leftFullscreen, setLeftFullscreen] = useState(false);
  const isSubmittedRef = useRef(isSubmitted);
  const wasFullscreenRef = useRef(false);

  useEffect(() => {
    isSubmittedRef.current = isSubmitted;
  }, [isSubmitted]);

  // Khoá cuộn trang phía sau (cả <html>) để không hiện 2 thanh cuộn
  useLockPageScroll();

  const enterFullscreen = () => {
    try {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } catch {
      // Trình duyệt chặn toàn màn hình thì vẫn làm bài bình thường
    }
  };

  // Enter browser fullscreen on mount (with catch for browser permissions)
  useEffect(() => {
    enterFullscreen();

    const onFullscreenChange = () => {
      const fullscreen = !!document.fullscreenElement;
      setIsFullscreen(fullscreen);
      // Đang làm bài mà thoát toàn màn hình → hỏi lại, đồng hồ dừng tại đây
      if (!fullscreen && wasFullscreenRef.current && !isSubmittedRef.current) {
        setLeftFullscreen(true);
        setShowConfirmExit(true);
      }
      wasFullscreenRef.current = fullscreen;
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

  // Đồng hồ đếm tăng từ 0:00; dừng khi đang hỏi rời phòng thi, chạy tiếp
  // đúng từ giây đó nếu người dùng chọn tiếp tục.
  useEffect(() => {
    if (isSubmitted || showConfirmExit) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, showConfirmExit]);

  const continueExam = () => {
    setShowConfirmExit(false);
    // Bấm nút là thao tác của người dùng → trình duyệt cho vào lại toàn màn hình
    if (leftFullscreen) enterFullscreen();
    setLeftFullscreen(false);
  };

  const handleSubmitExam = async () => {
    if (!onSubmitAnswers) {
      setIsSubmitted(true);
      setShowConfirmSubmit(false);
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      setRemoteResults(await onSubmitAnswers(answers));
      setIsSubmitted(true);
      setShowConfirmSubmit(false);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : 'Không nộp được bài. Vui lòng thử lại.',
      );
    } finally {
      setIsSubmitting(false);
    }
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
    setRemoteResults({});
    setSubmitError(null);
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

  // Đáp án / giải thích: ưu tiên kết quả máy chủ chấm (phiên thật).
  // Chuỗi rỗng = chưa biết đáp án (câu chưa làm trong phiên thật).
  const correctAnswerOf = (q: (typeof exam.questions)[number]): string =>
    remoteResults[q.id]?.correctAnswer ?? q.correctAnswer ?? '';
  const explanationOf = (q: (typeof exam.questions)[number]): string =>
    remoteResults[q.id]?.explanation ?? q.explanation ?? '';
  const isCorrectOf = (q: (typeof exam.questions)[number]): boolean => {
    const remote = remoteResults[q.id]?.isCorrect;
    if (remote !== undefined) return remote;
    const key = correctAnswerOf(q);
    return Boolean(key) && answers[q.id] === key;
  };

  // Score statistics after submission
  const correctCount = exam.questions.filter(isCorrectOf).length;
  const scoreOutOf10 =
    exam.questions.length > 0
      ? Number(((correctCount / exam.questions.length) * 10).toFixed(1))
      : 0;

  return (
    <div className="fixed inset-0 z-[1000] bg-fb-canvas flex flex-col text-fb-text select-none overflow-hidden animate-in fade-in duration-200">
      {/* ================= TOP BAR (CỐ ĐỊNH, KHÔNG CHO OUT RA) ================= */}
      <header className="h-16 px-4 sm:px-6 bg-fb-card border-b border-fb-divider flex items-center justify-between shrink-0 shadow-xs">
        {/* Left: Info */}
        <div className="flex items-center gap-3">
          <span className="tabular-nums text-xs font-bold px-2.5 py-1 rounded bg-fb-blue-soft text-fb-blue border border-fb-blue/30">
            {exam.courseCode}
          </span>
          <div className="truncate max-w-[200px] sm:max-w-md">
            <h2 className="font-bold text-sm text-fb-text truncate">
              {exam.title}
            </h2>
            <p className="text-xs text-fb-text-3 truncate">
              {exam.subject} · {exam.chapter}
            </p>
          </div>
        </div>

        {/* Right Actions: Timer, Tiến độ Đã làm, Nút thoát */}
        <div className="flex items-center gap-3">
          {!isSubmitted ? (
            <>
              {/* Timer đếm tăng dần từ 0:00 đặt cạnh Đã làm */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg tabular-nums font-bold text-xs sm:text-sm bg-fb-input text-fb-text shadow-xs">
                <Clock className="w-4 h-4 text-fb-blue" />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>

              <span className="text-xs text-fb-text-2 font-medium hidden sm:inline">
                Đã làm:{' '}
                <strong className="text-fb-blue font-bold">
                  {answeredCount}
                </strong>
                /{exam.questions.length}
              </span>

              <button
                type="button"
                onClick={() => setShowConfirmExit(true)}
                title="Rời khỏi phòng thi"
                className="p-2 text-fb-text-3 hover:text-fb-danger hover:bg-fb-danger-soft rounded-lg transition cursor-pointer"
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
                <span className="font-semibold text-sm px-3 py-1 rounded-full bg-fb-blue-soft text-fb-blue">
                  Câu {currentQuestionIndex + 1} / {exam.questions.length}
                </span>
              </div>

              {/* Question text */}
              <h3 className="text-lg sm:text-xl font-semibold text-fb-text leading-relaxed py-2 [overflow-wrap:anywhere]">
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
                      className={`p-4 rounded-lg border text-body transition cursor-pointer flex items-center gap-3.5 ${
                        isSelected
                          ? 'border-fb-blue bg-fb-blue-soft text-fb-text font-semibold ring-1 ring-fb-blue'
                          : 'border-fb-divider bg-fb-card hover:border-fb-blue/60 hover:bg-fb-hover text-fb-text'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-fb-blue text-white'
                            : 'bg-fb-btn text-fb-text'
                        }`}
                      >
                        {opt.id}
                      </span>
                      <span className="leading-snug [overflow-wrap:anywhere]">{opt.text}</span>
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
                className="px-4 h-9 rounded-md text-sm font-semibold bg-fb-btn text-fb-text hover:bg-fb-btn-hover disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <span className="text-sm text-fb-text-2 tabular-nums">
                {currentQuestionIndex + 1} / {exam.questions.length}
              </span>

              <button
                type="button"
                disabled={currentQuestionIndex >= exam.questions.length - 1}
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(exam.questions.length - 1, prev + 1),
                  )
                }
                className="px-4 h-9 rounded-md text-sm font-semibold bg-fb-blue hover:bg-fb-blue-hover disabled:opacity-30 disabled:cursor-not-allowed text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                <h4 className="font-semibold text-body text-fb-text">
                  Danh sách câu hỏi
                </h4>
                <span className="text-sm tabular-nums font-semibold text-fb-blue">
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
                      className={`h-9 rounded-md font-semibold text-sm tabular-nums transition flex items-center justify-center cursor-pointer ${
                        isCurrent
                          ? 'bg-fb-blue text-white ring-2 ring-fb-blue ring-offset-2 ring-offset-fb-card'
                          : isAnswered
                          ? 'bg-fb-blue-soft text-fb-blue ring-1 ring-inset ring-fb-blue/50'
                          : 'bg-fb-btn text-fb-text-2 hover:bg-fb-btn-hover'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Chú thích màu */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-fb-divider text-sm text-fb-text-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-fb-blue-soft ring-1 ring-inset ring-fb-blue/50" />
                  <span>Đã làm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-fb-btn" />
                  <span>Chưa làm</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-fb-divider">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full h-10 bg-fb-success hover:bg-fb-success/90 text-white font-semibold text-body rounded-md transition cursor-pointer"
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
                    <Award className="w-6 h-6 text-fb-warning" />
                    <h2 className="text-xl font-bold text-fb-text">
                      Kết quả bài thi thử
                    </h2>
                  </div>
                  <p className="text-xs text-fb-text-2 mt-1">
                    {exam.title} ({exam.courseCode} · {exam.subject})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRestartExam}
                    className="px-4 py-2 rounded-lg text-xs font-bold border border-fb-divider text-fb-text hover:bg-fb-hover transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại đề</span>
                  </button>
                </div>
              </div>

              {/* 3 Thẻ thống kê điểm & thời gian */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-lg bg-fb-blue-soft border border-fb-blue/60 text-center">
                  <span className="text-2xl font-bold text-fb-blue block">
                    {scoreOutOf10} / 10
                  </span>
                  <span className="text-xs text-fb-text-2">Điểm số đạt được</span>
                </div>

                <div className="p-4 rounded-lg bg-fb-success-soft border border-fb-success/60 text-center">
                  <span className="text-2xl font-bold text-fb-success block">
                    {correctCount} / {exam.questions.length}
                  </span>
                  <span className="text-xs text-fb-text-2">
                    Số câu trả lời đúng (
                    {Math.round((correctCount / exam.questions.length) * 100)}
                    %)
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-fb-blue-soft border border-fb-blue/60 text-center">
                  <span className="text-2xl font-bold text-fb-blue block">
                    {formatTime(elapsedSeconds)}
                  </span>
                  <span className="text-xs text-fb-text-2">Thời gian làm bài</span>
                </div>
              </div>
            </div>

            {/* Chi tiết từng câu hỏi & Đáp án & Chấm sao */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-fb-text flex items-center justify-between">
                <span>Chi tiết đáp án & Giải thích từng câu</span>
                <span className="text-xs text-fb-text-3 font-normal">
                  Bạn có thể đánh giá từ 0 đến 4 sao cho từng câu hỏi bên dưới
                </span>
              </h3>

              {exam.questions.map((q, idx) => {
                const userAns = answers[q.id];
                const isCorrect = isCorrectOf(q);
                const correctKey = correctAnswerOf(q);
                const explanation = explanationOf(q);
                const isAuthor = Boolean(q.creatorId) && q.creatorId === currentUserId;

                return (
                  <div
                    key={q.id}
                    className="bg-fb-card rounded-lg p-5 shadow-fb-card space-y-3.5"
                  >
                    {/* Header câu */}
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-fb-divider">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs px-2.5 py-0.5 rounded-md bg-fb-input text-fb-text">
                          Câu {idx + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {isCorrect ? (
                          <span className="flex items-center gap-1 text-fb-success">
                            <CheckCircle2 className="w-4 h-4" />
                            Đúng
                          </span>
                        ) : userAns ? (
                          <span className="flex items-center gap-1 text-fb-danger">
                            <XCircle className="w-4 h-4" />
                            Sai (Bạn chọn: {userAns})
                          </span>
                        ) : (
                          <span className="text-fb-text-3">Chưa làm</span>
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
                        const isThisCorrect = correctKey === opt.id;
                        const isUserChoice = userAns === opt.id;

                        let borderStyle =
                          'border-fb-divider bg-fb-card/50';
                        if (isThisCorrect) {
                          borderStyle =
                            'border-fb-success bg-fb-success-soft/80 text-fb-success font-semibold';
                        } else if (isUserChoice && !isThisCorrect) {
                          borderStyle =
                            'border-fb-danger bg-fb-danger-soft/80 text-fb-danger';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-lg border text-xs font-medium flex items-start gap-2.5 ${borderStyle}`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isThisCorrect
                                  ? 'bg-fb-success text-white'
                                  : isUserChoice
                                  ? 'bg-fb-danger text-white'
                                  : 'bg-fb-btn text-fb-text'
                              }`}
                            >
                              {opt.id}
                            </span>
                            <span className="leading-snug [overflow-wrap:anywhere]">{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Giải thích chi tiết */}
                    {correctKey ? (
                      <div className="p-3.5 rounded-lg bg-fb-success-soft/60 border border-fb-success/60 text-xs space-y-1">
                        <div className="font-bold text-fb-success flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-fb-success" />
                          <span>Đáp án chính xác: Phương án {correctKey}</span>
                        </div>
                        {explanation && (
                          <p className="text-fb-success font-normal leading-relaxed">
                            <strong>Giải thích:</strong> {explanation}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-lg bg-fb-input border border-fb-divider text-xs text-fb-text-2">
                        Bạn chưa làm câu này nên đáp án và lời giải vẫn được ẩn.
                        Làm lại đề và trả lời câu này để xem.
                      </div>
                    )}

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

                    {renderQuestionExtras?.(q.id)}
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
            <div className="flex items-center gap-3 text-fb-warning">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-fb-text">
                Xác nhận nộp bài?
              </h3>
            </div>

            <p className="text-xs text-fb-text-2 leading-relaxed">
              Bạn đã hoàn thành{' '}
              <strong className="text-fb-blue font-bold">
                {answeredCount} / {exam.questions.length}
              </strong>{' '}
              câu hỏi. Thời gian làm bài là{' '}
              <strong>{formatTime(elapsedSeconds)}</strong>. Bạn có chắc chắn muốn nộp
              bài không?
            </p>

            {submitError && (
              <p role="alert" className="text-xs text-fb-danger">
                {submitError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-fb-text hover:bg-fb-hover transition cursor-pointer disabled:opacity-50"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={() => void handleSubmitExam()}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-fb-success hover:bg-fb-success/90 text-white transition cursor-pointer shadow-xs disabled:opacity-60"
              >
                {isSubmitting ? 'Đang chấm bài…' : 'Xác nhận nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CẢNH BÁO KHÔNG CHO OUT RA ================= */}
      {showConfirmExit && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60">
          <div
            role="alertdialog"
            aria-label="Xác nhận thoát phòng thi"
            className="bg-fb-card rounded-lg max-w-sm w-full p-5 border border-fb-divider shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <h3 className="font-bold text-base text-fb-text">
              Bạn có muốn thoát khỏi phòng thi không?
            </h3>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={continueExam}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-fb-text bg-fb-btn hover:bg-fb-btn-hover transition cursor-pointer"
              >
                Ở lại
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmExit(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-fb-danger text-white hover:bg-fb-danger/90 transition cursor-pointer"
              >
                Thoát
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
