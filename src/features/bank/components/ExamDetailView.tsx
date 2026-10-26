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
  Users,
  BookOpen,
  TrendingUp,
  BarChart2,
  X,
  MessageSquare,
  Filter,
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
  const [statsModalTab, setStatsModalTab] = useState<'ACCURACY' | 'COMMENTS'>('ACCURACY');
  const [filterQuestionIndex, setFilterQuestionIndex] = useState<number | 'ALL'>('ALL');
  const [onlyShowQuestionsWithComments, setOnlyShowQuestionsWithComments] = useState(false);
  const [expandedQuestionPreview, setExpandedQuestionPreview] = useState<number | null>(null);

  // Predefined community comments mapped to questions
  const baseCommunityComments: Record<
    number,
    Array<{
      id: string;
      userName: string;
      userAvatar: string;
      rating: number;
      comment: string;
      createdAt: string;
    }>
  > = {
    0: [
      {
        id: 'c_0_1',
        userName: 'Trần Minh Đức',
        userAvatar:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        rating: 4,
        comment:
          'Phần khai triển Maclaurin này rất hay ra trong đề thi giữa kỳ, cần cẩn thận dấu trừ!',
        createdAt: '1 giờ trước',
      },
      {
        id: 'c_0_2',
        userName: 'Lê Thị Thu',
        userAvatar:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        rating: 4,
        comment: 'Giải thích chi tiết và trực quan. 10 điểm cho tác giả!',
        createdAt: '3 giờ trước',
      },
    ],
    1: [
      {
        id: 'c_1_1',
        userName: 'Phạm Quang Huy',
        userAvatar:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        rating: 3,
        comment:
          'Cần chú ý điều kiện xác định trước khi tính tích phân suy rộng.',
        createdAt: 'Hôm qua',
      },
    ],
    2: [
      {
        id: 'c_2_1',
        userName: 'Hoàng Mai Anh',
        userAvatar:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        rating: 4,
        comment: 'Bám sát đề thi giữa kỳ của thầy cô viện Toán.',
        createdAt: '2 ngày trước',
      },
    ],
    3: [
      {
        id: 'c_3_1',
        userName: 'Vũ Quốc Bảo',
        userAvatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        rating: 4,
        comment: 'Câu hỏi phân loại khá tốt cho sinh viên ôn điểm A.',
        createdAt: '3 ngày trước',
      },
    ],
  };

  // Aggregate comments across all questions in this exam set
  const allExamComments = resolvedQuestions.flatMap((q, idx) => {
    const list = [...(baseCommunityComments[idx % 4] || [])];
    if (q.userComment) {
      list.unshift({
        id: `user_c_${q.id}`,
        userName: 'Bạn (Sinh viên)',
        userAvatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        rating: q.userRatedStars || 4,
        comment: q.userComment,
        createdAt: 'Vừa xong',
      });
    }
    return list.map((item) => ({
      ...item,
      questionIdx: idx,
      questionContent: q.content,
    }));
  });

  const questionsWithCommentsIndices = Array.from(
    new Set(allExamComments.map((c) => c.questionIdx)),
  );

  const displayedPillQuestions = resolvedQuestions
    .map((q, idx) => ({ q, idx }))
    .filter(
      ({ idx }) =>
        !onlyShowQuestionsWithComments ||
        questionsWithCommentsIndices.includes(idx),
    );

  const filteredComments =
    filterQuestionIndex === 'ALL'
      ? onlyShowQuestionsWithComments
        ? allExamComments.filter((c) => questionsWithCommentsIndices.includes(c.questionIdx))
        : allExamComments
      : allExamComments.filter((c) => c.questionIdx === filterQuestionIndex);

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
              onClick={onStartPracticeExam}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Làm bài thi thử</span>
            </button>
          </div>
        </div>

        {/* Dải thống kê tổng quan ngay trong Card */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between flex-wrap gap-2.5 text-xs">
          <div className="flex items-center gap-3.5 text-gray-500 dark:text-gray-400 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>
                <strong className="text-gray-900 dark:text-gray-100 font-bold">
                  {exam.totalAttempts || 195}
                </strong>{' '}
                lượt làm
              </span>
            </span>

            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">
              •
            </span>

            <span className="flex items-center gap-1.5 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong className="text-gray-900 dark:text-gray-100 font-bold">
                  {resolvedQuestions.length}
                </strong>{' '}
                câu hỏi
              </span>
            </span>

            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">
              •
            </span>

            <span className="flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>
                Đúng trung bình:{' '}
                <strong className="text-purple-600 dark:text-purple-400 font-bold">
                  {calculatedCorrectRate}%
                </strong>
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowExamStatsModal(true)}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold text-xs hover:underline transition cursor-pointer"
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
              className="bg-white dark:bg-[#242526] rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-xs space-y-3.5"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-100 dark:border-gray-700/80">
                <span className="font-bold text-xs px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Câu {index + 1}
                </span>
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
                  const optionBg = 'bg-white dark:bg-[#1E1F20]/50';

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
                        className={`font-bold w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${showResult && isCorrect
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
              <div className="pt-1 space-y-2">
                <div>
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
                </div>

                {isExplanationOpen && (
                  <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 text-xs space-y-1 animate-in fade-in duration-150">
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

              {/* Star Rating Bar (0 - 4 sao) */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700/80">
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-xl w-full max-h-[88vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-[#1E1F20]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    Thống kê & Đánh giá bộ đề thi
                  </h3>
                  <p className="text-[11px] text-gray-500 truncate max-w-xs sm:max-w-md">
                    {exam.title} ({exam.courseCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExamStatsModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab điều hướng: Tỷ lệ đúng VS Nhận xét các câu */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 px-4 bg-white dark:bg-[#242526] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatsModalTab('ACCURACY')}
                className={`py-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${statsModalTab === 'ACCURACY'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Tỷ lệ đúng & Độ khó</span>
              </button>

              <button
                type="button"
                onClick={() => setStatsModalTab('COMMENTS')}
                className={`py-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${statsModalTab === 'COMMENTS'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Nhận xét các câu hỏi</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                  {allExamComments.length}
                </span>
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {statsModalTab === 'ACCURACY' ? (
                <div className="space-y-4">
                  {/* 3 cards overview */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 text-center">
                      <span className="text-lg font-black text-blue-600 dark:text-blue-400 block">
                        {exam.totalAttempts || 195}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Lượt làm đề
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block">
                        {calculatedCorrectRate}%
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Đúng trung bình
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 text-center">
                      <span className="text-lg font-black text-amber-600 dark:text-amber-400 block">
                        {calculatedExamAvg > 0
                          ? calculatedExamAvg.toFixed(1)
                          : '3.8'}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Điểm sao / 4.0
                      </span>
                    </div>
                  </div>

                  {/* Tỷ lệ trả lời đúng từng câu hỏi trong đề */}
                  <div className="space-y-2 pt-1">
                    <h4 className="font-bold text-xs uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Tỷ lệ làm đúng theo từng câu hỏi trong đề
                    </h4>
                    <div className="space-y-2">
                      {resolvedQuestions.map((q, idx) => {
                        const attempts = q.totalAttempts || 80;
                        const correct =
                          q.correctAttempts || Math.round(attempts * 0.75);
                        const pct = Math.round((correct / (attempts || 1)) * 100);

                        return (
                          <div
                            key={q.id}
                            className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1E1F20] border border-gray-100 dark:border-gray-800 flex items-center gap-3"
                          >
                            <span className="w-14 font-bold text-gray-800 dark:text-gray-200 shrink-0">
                              Câu {idx + 1}
                            </span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-12 text-right font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* THANH LỌC & ĐIỀU HƯỚNG NHANH CÂU HỎI */}
                  <div className="space-y-2 bg-gray-50/80 dark:bg-[#1E1F20]/80 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                      <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Nhận xét đề thi ({allExamComments.length})</span>
                      </span>

                      {/* Bộ lọc nâng cao: Chọn nhanh câu qua Dropdown + Lọc câu có thảo luận */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Toggle chỉ câu có nhận xét */}
                        <button
                          type="button"
                          onClick={() =>
                            setOnlyShowQuestionsWithComments(
                              !onlyShowQuestionsWithComments,
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 border ${onlyShowQuestionsWithComments
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white dark:bg-[#2A2B2D] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          <Filter className="w-3 h-3" />
                          <span>
                            Chỉ câu có nhận xét ({questionsWithCommentsIndices.length})
                          </span>
                        </button>

                        {/* Dropdown nhảy nhanh tới bất kỳ câu nào trong đề (rất hữu ích khi đề có 20-50 câu) */}
                        <select
                          value={filterQuestionIndex}
                          onChange={(e) =>
                            setFilterQuestionIndex(
                              e.target.value === 'ALL'
                                ? 'ALL'
                                : Number(e.target.value),
                            )
                          }
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A2B2D] text-gray-700 dark:text-gray-200 cursor-pointer focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="ALL">
                            Toàn bộ đề ({allExamComments.length} nhận xét)
                          </option>
                          {resolvedQuestions.map((q, idx) => {
                            const count = allExamComments.filter(
                              (c) => c.questionIdx === idx,
                            ).length;
                            return (
                              <option key={q.id} value={idx}>
                                Câu {idx + 1}{' '}
                                {count > 0 ? `(${count} nhận xét)` : '(Trống)'}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {/* Dải nút Pills cuộn ngang mượt mà */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
                      <button
                        type="button"
                        onClick={() => setFilterQuestionIndex('ALL')}
                        className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${filterQuestionIndex === 'ALL'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-[#2A2B2D] text-gray-600 dark:text-gray-300 hover:bg-gray-100 border border-gray-200 dark:border-gray-700'
                          }`}
                      >
                        Tất cả ({allExamComments.length})
                      </button>

                      {displayedPillQuestions.map(({ q, idx }) => {
                        const count = allExamComments.filter(
                          (c) => c.questionIdx === idx,
                        ).length;
                        const isSelected = filterQuestionIndex === idx;

                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setFilterQuestionIndex(idx)}
                            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition cursor-pointer shrink-0 flex items-center gap-1.5 ${isSelected
                                ? 'bg-blue-600 text-white font-bold shadow-xs'
                                : count > 0
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                  : 'bg-white dark:bg-[#2A2B2D] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] border border-gray-200 dark:border-gray-700'
                              }`}
                          >
                            <span>Câu {idx + 1}</span>
                            {count > 0 && (
                              <span
                                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isSelected
                                    ? 'bg-white text-blue-600'
                                    : 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
                                  }`}
                              >
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* DANH SÁCH CÁC NHẬN XÉT THEO CÂU */}
                  <div className="space-y-3 pt-1">
                    {filteredComments.length > 0 ? (
                      filteredComments.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 bg-gray-50 dark:bg-[#1E1F20] rounded-xl border border-gray-100 dark:border-gray-800 text-xs space-y-2 hover:border-gray-200 dark:hover:border-gray-700 transition"
                        >
                          {/* Header: User avatar, name, "đã nhận xét ở", Câu X badge, Rating, Time */}
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.userAvatar}
                                alt={item.userName}
                                className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-gray-200 dark:ring-gray-700"
                              />
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-gray-900 dark:text-gray-100">
                                    {item.userName}
                                  </span>
                                  <span className="text-gray-400 font-normal text-[11px]">
                                    đã nhận xét ở
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFilterQuestionIndex(item.questionIdx)
                                    }
                                    title="Lọc chỉ xem nhận xét của câu này"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer"
                                  >
                                    <span> Câu {item.questionIdx + 1}</span>
                                  </button>
                                </div>
                                <span className="text-[10px] text-gray-400">
                                  {item.createdAt}
                                </span>
                              </div>
                            </div>

                            {/* Star rating */}
                            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{item.rating} / 4.0</span>
                            </div>
                          </div>

                          {/* Nội dung nhận xét */}
                          <p className="text-gray-800 dark:text-gray-200 pl-9.5 leading-relaxed font-medium">
                            "{item.comment}"
                          </p>

                          {/* Trích đoạn câu hỏi và nút mở rộng xem toàn bộ đề bài */}
                          <div className="pl-9.5 pt-0.5">
                            <div className="p-2 rounded-lg bg-white dark:bg-[#242526] border border-gray-200/80 dark:border-gray-700/80 flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                  Nội dung câu {item.questionIdx + 1}
                                </span>
                                <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-1 italic">
                                  {item.questionContent}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedQuestionPreview(
                                    expandedQuestionPreview === item.questionIdx
                                      ? null
                                      : item.questionIdx,
                                  )
                                }
                                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0 flex items-center gap-0.5 cursor-pointer pt-0.5"
                              >
                                <span>
                                  {expandedQuestionPreview === item.questionIdx
                                    ? 'Thu gọn'
                                    : 'Xem đề'}
                                </span>
                                {expandedQuestionPreview ===
                                  item.questionIdx ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                            </div>

                            {/* Khi bấm "Xem đề" -> mở rộng preview toàn bộ câu hỏi (options, đáp án đúng) */}
                            {expandedQuestionPreview === item.questionIdx && (
                              <div className="mt-2 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs space-y-2 animate-in fade-in duration-150">
                                <p className="font-medium text-gray-800 dark:text-gray-200">
                                  {
                                    resolvedQuestions[item.questionIdx]?.content
                                  }
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                  {resolvedQuestions[
                                    item.questionIdx
                                  ]?.options.map((opt) => {
                                    const isCorrect =
                                      opt.id ===
                                      resolvedQuestions[item.questionIdx]
                                        ?.correctAnswer;
                                    return (
                                      <div
                                        key={opt.id}
                                        className={`p-1.5 rounded text-[11px] border ${isCorrect
                                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-semibold'
                                            : 'bg-white dark:bg-[#1E1F20] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                          }`}
                                      >
                                        <span className="font-bold mr-1">
                                          {opt.id}.
                                        </span>
                                        {opt.text}
                                        {isCorrect && ' ✓'}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-gray-50 dark:bg-[#1E1F20] rounded-xl border border-dashed border-gray-200 dark:border-gray-800 space-y-2">
                        <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
                        <p className="text-xs text-gray-500 font-medium">
                          {filterQuestionIndex === 'ALL'
                            ? 'Chưa có nhận xét nào cho đề thi này.'
                            : `Chưa có nhận xét nào cho Câu ${typeof filterQuestionIndex === 'number'
                              ? filterQuestionIndex + 1
                              : ''
                            }.`}
                        </p>
                        {filterQuestionIndex !== 'ALL' && (
                          <button
                            type="button"
                            onClick={() => setFilterQuestionIndex('ALL')}
                            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                          >
                            ← Quay lại xem tất cả nhận xét
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1E1F20] flex justify-end">
              <button
                type="button"
                onClick={() => setShowExamStatsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-semibold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
