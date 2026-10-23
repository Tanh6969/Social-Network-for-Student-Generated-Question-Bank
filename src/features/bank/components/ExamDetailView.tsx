import React, { useState } from 'react';
import { StudentExamSet } from '../studentBankData';
import { Question } from '../../demo/types';
import { StarRating } from './StarRating';
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  PlayCircle,
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
      {/* Navigation Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-[#242526] rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách đề</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
          <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
            {exam.courseCode}
          </span>
          <span className="hidden sm:inline font-sans text-gray-600 dark:text-gray-300">
            {exam.subject}
          </span>
        </div>
      </div>

      {/* Exam Header Hero Card */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-bold px-2.5 py-0.5 rounded-md bg-blue-600 text-white">
                {exam.courseCode}
              </span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {exam.subject}
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">{exam.chapter}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {exam.title}
            </h1>

            {exam.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {exam.description}
              </p>
            )}

            {/* Author */}
            <div className="flex items-center gap-2.5 pt-1">
              <img
                src={exam.creator.avatar}
                alt={exam.creator.name}
                onClick={() => onViewAuthorProfile(exam.creator.id)}
                className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
              />
              <div className="text-xs">
                <span
                  onClick={() => onViewAuthorProfile(exam.creator.id)}
                  className="font-bold text-gray-900 dark:text-gray-100 hover:underline cursor-pointer"
                >
                  {exam.creator.name}
                </span>
                <span className="text-gray-400 text-[11px] ml-2">
                  {exam.createdAt}
                </span>
              </div>
            </div>
          </div>

          {/* Action & Rating */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 px-3 py-1.5 rounded-xl">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-base text-amber-900 dark:text-amber-200">
                {calculatedExamAvg > 0 ? calculatedExamAvg.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-gray-400">
                ({totalRatingsCount})
              </span>
            </div>

            <button
              type="button"
              onClick={() => onPracticeQuestion(resolvedQuestions[0])}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Làm bài thi thử</span>
            </button>
          </div>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-3.5">
        {resolvedQuestions.map((q, index) => {
          const isExplanationOpen = !!expandedExplanations[q.id];
          const userSelected = selectedAnswers[q.id];
          const isAuthor = q.creatorId === currentUserId;

          return (
            <div
              key={q.id}
              className="bg-white dark:bg-[#242526] rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-xs space-y-3.5"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-100 dark:border-gray-700/80">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Câu {index + 1}
                  </span>
                  <span className="text-gray-500 font-medium truncate max-w-[260px]">
                    {q.chapter}
                  </span>
                </div>
              </div>

              {/* Question Content */}
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
                {q.content}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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
                      className={`p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer flex items-start gap-2 ${optionBorder} ${optionBg}`}
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

              {/* Toggle explanation */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => toggleExplanation(q.id)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <span>
                    {isExplanationOpen
                      ? 'Ẩn đáp án'
                      : 'Xem đáp án & giải thích'}
                  </span>
                  {isExplanationOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {isExplanationOpen && (
                  <div className="mt-2 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 text-xs space-y-1 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đáp án đúng: {q.correctAnswer}</span>
                    </div>
                    <p className="text-emerald-950 dark:text-emerald-100 font-normal leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Star Rating Bar */}
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
