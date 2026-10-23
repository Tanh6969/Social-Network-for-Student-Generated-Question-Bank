import React from 'react';
import { StudentExamSet } from '../studentBankData';
import {
  FileText,
  Star,
  Clock,
  BookOpen,
  ChevronRight,
  Eye,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface ExamSetCardProps {
  exam: StudentExamSet;
  onSelectExam: (exam: StudentExamSet) => void;
  onQuickPractice: (exam: StudentExamSet) => void;
  onViewAuthorProfile: (userId: string) => void;
}

export const ExamSetCard: React.FC<ExamSetCardProps> = ({
  exam,
  onSelectExam,
  onQuickPractice,
  onViewAuthorProfile,
}) => {
  const difficultyConfig = {
    EASY: {
      label: 'Độ khó: Dễ',
      bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50',
    },
    MEDIUM: {
      label: 'Độ khó: TB',
      bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50',
    },
    HARD: {
      label: 'Độ khó: Khó',
      bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/50',
    },
    MIXED: {
      label: 'Tổng hợp',
      bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/50',
    },
  };

  const diffStyle = difficultyConfig[exam.difficulty] || difficultyConfig.MEDIUM;

  return (
    <article className="group bg-white dark:bg-[#242526] rounded-2xl shadow-xs hover:shadow-md border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between">
      {/* Top Meta: Course badge, Exam code, Difficulty */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              {exam.courseCode}
            </span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {exam.subject}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${diffStyle.bg}`}
            >
              {diffStyle.label}
            </span>
            <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
              #{exam.code}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelectExam(exam)}
          className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition cursor-pointer line-clamp-2 leading-snug mb-1.5"
        >
          {exam.title}
        </h3>

        {/* Chapter / Description */}
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {exam.description || exam.chapter}
        </p>

        {/* Author information */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-700/80">
          <img
            src={exam.creator.avatar}
            alt={exam.creator.name}
            onClick={() => onViewAuthorProfile(exam.creator.id)}
            className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                onClick={() => onViewAuthorProfile(exam.creator.id)}
                className="text-xs font-semibold text-gray-800 dark:text-gray-200 hover:underline cursor-pointer truncate"
              >
                {exam.creator.name}
              </span>
              <span className="text-[10px] text-gray-400 font-normal truncate">
                · {exam.createdAt}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 truncate">
              {exam.creator.classOrTitle || 'Sinh viên'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Metrics & Action buttons */}
      <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
        {/* Metrics */}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-200">
            <FileText className="w-4 h-4 text-blue-500" />
            {exam.questions.length} câu
          </span>

          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <strong className="text-gray-800 dark:text-gray-200 font-bold">
              {exam.ratingAverage > 0 ? exam.ratingAverage.toFixed(1) : 'Chưa có'}
            </strong>
            <span className="text-[11px] text-gray-400">
              ({exam.ratingCount})
            </span>
          </span>

          <span className="hidden sm:inline text-[11px]">
            {exam.totalAttempts} lượt làm
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectExam(exam)}
            className="flex-1 sm:flex-none px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem đề & Chấm sao</span>
          </button>

          <button
            type="button"
            onClick={() => onQuickPractice(exam)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#3A3B3C] dark:hover:bg-[#4E4F50] text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Làm thử</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
