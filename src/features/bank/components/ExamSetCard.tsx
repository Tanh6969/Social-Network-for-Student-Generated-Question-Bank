import React from 'react';
import { StudentExamSet } from '../studentBankData';
import { FileText, Star, ChevronRight, Eye } from 'lucide-react';

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
  return (
    <article className="group bg-white dark:bg-[#242526] rounded-xl shadow-xs hover:shadow-md border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 p-4 flex flex-col justify-between gap-3">
      <div>
        {/* Top: Course badge, subject, exam code */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              {exam.courseCode}
            </span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {exam.subject}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-xs text-gray-500 truncate max-w-[280px]">
              {exam.chapter}
            </span>
          </div>

          <span className="text-[11px] text-gray-400 font-mono shrink-0">
            #{exam.code}
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelectExam(exam)}
          className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition cursor-pointer line-clamp-2 leading-snug mb-1"
        >
          {exam.title}
        </h3>

        {/* Description (if any) */}
        {exam.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
            {exam.description}
          </p>
        )}

        {/* Author info */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <img
            src={exam.creator.avatar}
            alt={exam.creator.name}
            onClick={() => onViewAuthorProfile(exam.creator.id)}
            className="w-5 h-5 rounded-full object-cover cursor-pointer hover:ring-1 hover:ring-blue-500 transition"
          />
          <span
            onClick={() => onViewAuthorProfile(exam.creator.id)}
            className="font-semibold text-gray-800 dark:text-gray-200 hover:underline cursor-pointer"
          >
            {exam.creator.name}
          </span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-400">{exam.createdAt}</span>
        </div>
      </div>

      {/* Bottom Section: Metrics & Action buttons */}
      <div className="pt-2.5 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between gap-3">
        {/* Metrics */}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 shrink-0">
          <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-200">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            {exam.questions.length} câu
          </span>

          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <strong className="text-gray-800 dark:text-gray-200 font-bold">
              {exam.ratingAverage > 0 ? exam.ratingAverage.toFixed(1) : '—'}
            </strong>
            <span className="text-[11px] text-gray-400">
              ({exam.ratingCount})
            </span>
          </span>

          <span className="text-[11px] hidden sm:inline">
            {exam.totalAttempts} lượt làm
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSelectExam(exam)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem chi tiết</span>
          </button>

          <button
            type="button"
            onClick={() => onQuickPractice(exam)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#3A3B3C] dark:hover:bg-[#4E4F50] text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Làm thử</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
