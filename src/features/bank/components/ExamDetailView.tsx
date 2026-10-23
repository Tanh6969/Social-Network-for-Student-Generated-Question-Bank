import React, { useState } from 'react';
import { StudentExamSet } from '../studentBankData';
import { Question } from '../../demo/types';
import { StarRating } from './StarRating';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Star,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  PlayCircle,
  Share2,
  Award,
} from 'lucide-react';

interface ExamDetailViewProps {
  exam: StudentExamSet;
  liveQuestions: Question[];
  currentUserId: string;
  onBack: () => void;
  onRateQuestion: (questionId: string, stars: number) => void;
  onPracticeQuestion: (question: Question) => void;
  onViewAuthorProfile: (userId: string) => void;
}

export const ExamDetailView: React.FC<ExamDetailViewProps> = ({
  exam,
  liveQuestions,
  currentUserId,
  onBack,
  onRateQuestion,
  onPracticeQuestion,
  onViewAuthorProfile,
}) => {
  // Sync questions with live updated state (for rating counts and userRatedStars)
  const resolvedQuestions = exam.questions.map((q) => {
    const live = liveQuestions.find((item) => item.id === q.id);
    return live || q;
  });

  const [expandedExplanations, setExpandedExplanations] = useState<
    Record<string, boolean>
  >({});
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, 'A' | 'B' | 'C' | 'D'>
  >({});

  const toggleExplanation = (questionId: string) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSelectOption = (
    questionId: string,
    optionId: 'A' | 'B' | 'C' | 'D',
  ) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Tính lại điểm trung bình của đề dựa trên live questions
  const totalRatingsSum = resolvedQuestions.reduce(
    (acc, q) => acc + (q.ratingAverage || 0) * (q.ratingCount || 0),
    0,
  );
  const totalRatingsCount = resolvedQuestions.reduce(
    (acc, q) => acc + (q.ratingCount || 0),
    0,
  );
  const calculatedExamAvg =
    totalRatingsCount > 0
      ? Number((totalRatingsSum / totalRatingsCount).toFixed(1))
      : exam.ratingAverage;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Navigation Bar / Breadcrumb */}
      <div className="flex items-center justify-between bg-white dark:bg-[#242526] rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách đề thi</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-bold">
            {exam.courseCode}
          </span>
          <span className="hidden sm:inline">· {exam.subject}</span>
        </div>
      </div>

      {/* Exam Header Hero Card */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-bold px-2.5 py-0.5 rounded-md bg-blue-600 text-white">
                Mã môn: {exam.courseCode}
              </span>
              <span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#3A3B3C] px-2.5 py-0.5 rounded-md">
                {exam.subject}
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">{exam.chapter}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
              {exam.title}
            </h1>

            {exam.description && (
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                {exam.description}
              </p>
            )}

            {/* Author */}
            <div className="flex items-center gap-3 pt-2">
              <img
                src={exam.creator.avatar}
                alt={exam.creator.name}
                onClick={() => onViewAuthorProfile(exam.creator.id)}
                className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span
                    onClick={() => onViewAuthorProfile(exam.creator.id)}
                    className="text-xs font-bold text-gray-900 dark:text-gray-100 hover:underline cursor-pointer"
                  >
                    {exam.creator.name}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    · {exam.createdAt}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  {exam.creator.classOrTitle || 'Sinh viên'} · {exam.creator.faculty || 'Khoa CNTT'}
                </p>
              </div>
            </div>
          </div>

          {/* Action & High-level rating */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-700">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 p-3 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="text-xl font-black text-amber-900 dark:text-amber-200">
                  {calculatedExamAvg > 0 ? calculatedExamAvg.toFixed(1) : 'Chưa có'}
                </span>
                <span className="text-xs text-amber-700 dark:text-amber-400">
                  / 5.0
                </span>
              </div>
              <p className="text-[10px] text-amber-800 dark:text-amber-300 mt-0.5">
                Đánh giá chất lượng bộ đề ({totalRatingsCount} lượt)
              </p>
            </div>

            <button
              type="button"
              onClick={() => onPracticeQuestion(resolvedQuestions[0])}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Làm bài thi thử toàn đề</span>
            </button>
          </div>
        </div>

        {/* Tags */}
        {exam.tags && exam.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700/80">
            {exam.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium bg-gray-100 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Instruction Banner */}
      <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-blue-600 shrink-0" />
          <span>
            Bạn có thể thử chọn đáp án, xem giải thích và <strong>đánh giá từ 0 đến 5 sao</strong> cho từng câu hỏi bên dưới để giúp cộng đồng sinh viên chọn lọc câu hỏi chất lượng nhất!
          </span>
        </div>
        <span className="font-bold text-xs shrink-0">
          {resolvedQuestions.length} câu hỏi
        </span>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {resolvedQuestions.map((q, index) => {
          const isExplanationOpen = !!expandedExplanations[q.id];
          const userSelected = selectedAnswers[q.id];
          const isAuthor = q.creatorId === currentUserId;

          return (
            <div
              key={q.id}
              className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4 hover:border-gray-300 dark:hover:border-gray-600 transition"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-100 dark:border-gray-700/80">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Câu {index + 1}
                  </span>
                  <span className="text-gray-400 font-mono text-[11px]">
                    #{q.id}
                  </span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500 font-medium truncate max-w-[220px]">
                    {q.chapter}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                      q.difficulty === 'EASY'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : q.difficulty === 'MEDIUM'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {q.difficulty === 'EASY'
                      ? 'Dễ'
                      : q.difficulty === 'MEDIUM'
                      ? 'Trung bình'
                      : 'Khó'}
                  </span>
                </div>
              </div>

              {/* Question Content */}
              <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
                {q.content}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {q.options.map((opt) => {
                  const isChosen = userSelected === opt.id;
                  const isCorrect = q.correctAnswer === opt.id;
                  const showResult = isExplanationOpen;

                  let optionBorder =
                    'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#3A3B3C]/50';
                  let optionBg = 'bg-white dark:bg-[#1E1F20]/50';

                  if (showResult && isCorrect) {
                    optionBorder =
                      'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
                  } else if (showResult && isChosen && !isCorrect) {
                    optionBorder =
                      'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                  } else if (isChosen) {
                    optionBorder =
                      'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200';
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(q.id, opt.id)}
                      className={`p-3 rounded-xl border text-xs sm:text-sm font-medium transition cursor-pointer flex items-start gap-2.5 ${optionBorder} ${optionBg}`}
                    >
                      <span
                        className={`font-bold w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                          showResult && isCorrect
                            ? 'bg-emerald-600 text-white'
                            : isChosen
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {opt.id}
                      </span>
                      <span className="leading-snug">{opt.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Explanation toggle & details */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => toggleExplanation(q.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <span>
                    {isExplanationOpen
                      ? 'Ẩn đáp án & giải thích'
                      : 'Xem đáp án chính xác & giải thích'}
                  </span>
                  {isExplanationOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {isExplanationOpen && (
                  <div className="mt-2.5 p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 text-xs space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">
                        Đáp án đúng: Phương án {q.correctAnswer}
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-emerald-950 dark:text-emerald-100 leading-relaxed font-normal">
                      <strong>Giải thích:</strong> {q.explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Interactive 0-5 Stars Rating Bar */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700/80">
                <StarRating
                  ratingAverage={q.ratingAverage || 0}
                  ratingCount={q.ratingCount || 0}
                  userRatedStars={q.userRatedStars || 0}
                  onRate={(stars) => onRateQuestion(q.id, stars)}
                  isAuthor={isAuthor}
                  size="md"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
