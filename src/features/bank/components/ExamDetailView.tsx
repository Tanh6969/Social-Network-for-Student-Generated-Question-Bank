import React, { useState } from 'react';
import { StudentExamSet } from '../studentBankData';
import { Question } from '../../demo/types';
import { StarRating } from './StarRating';
import { ExamStatsModal } from './ExamStatsModal';
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Users,
  BookOpen,
  TrendingUp,
  BarChart2,
} from 'lucide-react';

interface ExamDetailViewProps {
  exam: StudentExamSet;
  liveQuestions: Question[];
  currentUserId: string;
  onBack: () => void;
  onRateQuestion: (questionId: string, stars: number, comment?: string) => void;
  onPracticeQuestion?: (question: Question) => void;
  onStartPracticeExam: () => void;
  onViewAuthorProfile: (userId: string) => void;
}

export const ExamDetailView: React.FC<ExamDetailViewProps> = ({
  exam,
  liveQuestions,
  currentUserId,
  onBack,
  onRateQuestion,
  onPracticeQuestion,
  onStartPracticeExam,
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

  const totalQuestionAttempts = resolvedQuestions.reduce(
    (acc, q) => acc + (q.totalAttempts || 80),
    0,
  );
  const totalQuestionCorrect = resolvedQuestions.reduce(
    (acc, q) =>
      acc + (q.correctAttempts || Math.round((q.totalAttempts || 80) * 0.76)),
    0,
  );
  const calculatedCorrectRate =
    totalQuestionAttempts > 0
      ? Math.round((totalQuestionCorrect / totalQuestionAttempts) * 100)
      : 76;

  const [showExamStatsModal, setShowExamStatsModal] = useState(false);
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between bg-fb-card rounded-lg p-3 shadow-fb-card">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-fb-text hover:text-fb-blue transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách đề</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-fb-text-2 tabular-nums">
          <span className="font-bold text-fb-blue bg-fb-blue-soft px-2 py-0.5 rounded">
            {exam.courseCode}
          </span>
          <span className="hidden sm:inline font-sans text-fb-text-2">
            {exam.subject}
          </span>
        </div>
      </div>

      {/* Exam Header Hero Card */}
      <div className="bg-fb-card rounded-lg p-5 shadow-fb-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="tabular-nums font-bold px-2.5 py-0.5 rounded-md bg-fb-blue text-white">
                {exam.courseCode}
              </span>
              <span className="font-semibold text-fb-text">
                {exam.subject}
              </span>
              <span className="text-fb-text-3">·</span>
              <span className="text-fb-text-2">{exam.chapter}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-fb-text leading-tight">
              {exam.title}
            </h1>

            {exam.description && (
              <p className="text-xs text-fb-text-2 leading-relaxed">
                {exam.description}
              </p>
            )}

            {/* Author */}
            <div className="flex items-center gap-2.5 pt-1">
              <img
                src={exam.creator.avatar}
                alt={exam.creator.name}
                onClick={() => onViewAuthorProfile(exam.creator.id)}
                className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-fb-blue transition"
              />
              <div className="text-xs">
                <span
                  onClick={() => onViewAuthorProfile(exam.creator.id)}
                  className="font-bold text-fb-text hover:underline cursor-pointer"
                >
                  {exam.creator.name}
                </span>
                <span className="text-fb-text-3 text-xs ml-2">
                  {exam.createdAt}
                </span>
              </div>
            </div>
          </div>

          {/* Action & Rating */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 bg-fb-warning-soft border border-fb-warning/80 px-3 py-1.5 rounded-lg">
              <Star className="w-4 h-4 text-fb-warning fill-amber-500" />
              <span className="font-bold text-base text-fb-warning">
                {calculatedExamAvg > 0 ? calculatedExamAvg.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-fb-text-3">
                ({totalRatingsCount})
              </span>
            </div>

            <button
              type="button"
              onClick={onStartPracticeExam}
              className="px-4 py-2 bg-fb-blue hover:bg-fb-blue-hover text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Làm bài thi thử</span>
            </button>
          </div>
        </div>

        {/* Dải thống kê tổng quan ngay trong Card */}
        <div className="pt-3 border-t border-fb-divider flex items-center justify-between flex-wrap gap-2.5 text-xs">
          <div className="flex items-center gap-3.5 text-fb-text-2 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-fb-blue" />
              <span>
                <strong className="text-fb-text font-bold">
                  {exam.totalAttempts ?? 0}
                </strong>{' '}
                lượt làm
              </span>
            </span>

            <span className="flex items-center gap-1.5 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-fb-success" />
              <span>
                <strong className="text-fb-text font-bold">
                  {resolvedQuestions.length}
                </strong>{' '}
                câu hỏi
              </span>
            </span>

            <span className="flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-fb-blue" />
              <span>
                Đúng trung bình:{' '}
                <strong className="text-fb-blue font-bold">
                  {calculatedCorrectRate}%
                </strong>
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowExamStatsModal(true)}
            className="flex items-center gap-1.5 text-fb-blue hover:text-fb-blue font-bold text-xs hover:underline transition cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Xem thống kê chi tiết</span>
          </button>
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
              className="bg-fb-card rounded-lg p-4 sm:p-5 shadow-fb-card space-y-3.5"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-fb-divider">
                <span className="font-bold text-xs px-2.5 py-0.5 rounded-md bg-fb-blue-soft text-fb-blue">
                  Câu {index + 1}
                </span>
              </div>

              {/* Question Content */}
              <div className="text-sm font-semibold text-fb-text leading-relaxed">
                {q.content}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {q.options.map((opt) => {
                  const isChosen = userSelected === opt.id;
                  const isCorrect = q.correctAnswer === opt.id;
                  const showResult = isExplanationOpen;

                  let optionBorder =
                    'border-fb-divider hover:bg-fb-hover/50';
                  const optionBg = 'bg-fb-card/50';

                  if (showResult && isCorrect) {
                    optionBorder =
                      'border-fb-success bg-fb-success-soft/70 text-fb-success';
                  } else if (showResult && isChosen && !isCorrect) {
                    optionBorder =
                      'border-fb-danger bg-fb-danger-soft/70 text-fb-danger';
                  } else if (isChosen) {
                    optionBorder =
                      'border-fb-blue bg-fb-blue-soft/70 text-fb-blue';
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(q.id, opt.id)}
                      className={`p-2.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-start gap-2 ${optionBorder} ${optionBg}`}
                    >
                      <span
                        className={`font-bold w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${showResult && isCorrect
                            ? 'bg-fb-success text-white'
                            : isChosen
                              ? 'bg-fb-blue text-white'
                              : 'bg-fb-input text-fb-text'
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
              <div className="pt-1 space-y-2">
                <div>
                  <button
                    type="button"
                    onClick={() => toggleExplanation(q.id)}
                    className="flex items-center gap-1 text-xs font-bold text-fb-blue hover:underline cursor-pointer"
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
                </div>

                {isExplanationOpen && (
                  <div className="p-3 rounded-lg bg-fb-success-soft/60 border border-fb-success/60 text-xs space-y-1 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5 font-bold text-fb-success">
                      <CheckCircle2 className="w-4 h-4 text-fb-success" />
                      <span>Đáp án đúng: {q.correctAnswer}</span>
                    </div>
                    <p className="text-fb-success font-normal leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Star Rating Bar (0 - 4 sao) */}
              <div className="pt-2 border-t border-fb-divider">
                <StarRating
                  ratingAverage={q.ratingAverage || 0}
                  ratingCount={q.ratingCount || 0}
                  userRatedStars={q.userRatedStars || 0}
                  userComment={q.userComment}
                  onRate={(stars, comment) => onRateQuestion(q.id, stars, comment)}
                  isAuthor={isAuthor}
                  size="md"
                  allowComment={true}
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* Modal Thống kê tổng quan bộ đề thi */}
      {showExamStatsModal && (
        <ExamStatsModal
          exam={exam}
          questions={resolvedQuestions}
          examCorrectRate={calculatedCorrectRate}
          examRatingAverage={calculatedExamAvg}
          onClose={() => setShowExamStatsModal(false)}
        />
      )}
    </div>
  );
};
