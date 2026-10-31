import React from 'react';
import { StudentExamSet } from '../studentBankData';
import { getSubjectTone } from '../subjectTone';
import { FileText, Play, Star, Users } from 'lucide-react';

interface ExamSetCardProps {
  exam: StudentExamSet;
  onSelectExam: (exam: StudentExamSet) => void;
  onQuickPractice: (exam: StudentExamSet) => void;
  onViewAuthorProfile: (userId: string) => void;
}

// Thẻ bộ đề: tác giả + nhãn môn → nội dung → số liệu & hành động trên cùng một hàng
export const ExamSetCard: React.FC<ExamSetCardProps> = ({
  exam,
  onSelectExam,
  onQuickPractice,
  onViewAuthorProfile,
}) => {
  return (
    <article className="bg-fb-card rounded-lg shadow-fb-card p-4 transition-shadow hover:shadow-md">
      {/* Tác giả & môn học */}
      <header className="flex items-center gap-2.5">
        <img
          src={exam.creator.avatar}
          alt=""
          onClick={() => onViewAuthorProfile(exam.creator.id)}
          className="w-9 h-9 rounded-full object-cover cursor-pointer"
        />
        <div className="min-w-0 flex-1 leading-tight">
          <button
            type="button"
            onClick={() => onViewAuthorProfile(exam.creator.id)}
            className="text-[15px] font-semibold text-fb-text hover:underline cursor-pointer"
          >
            {exam.creator.name}
          </button>
          <p className="text-[13px] text-fb-text-2">{exam.createdAt}</p>
        </div>
        <span
          className={`shrink-0 max-w-[45%] truncate px-2.5 py-1 rounded-full text-xs font-semibold ${getSubjectTone(exam.subject)}`}
          title={`${exam.courseCode} · ${exam.subject}`}
        >
          {exam.courseCode} · {exam.subject}
        </span>
      </header>

      {/* Nội dung */}
      <button
        type="button"
        onClick={() => onSelectExam(exam)}
        className="block w-full text-left mt-3 cursor-pointer group"
      >
        <h3 className="text-[17px] font-semibold leading-snug text-fb-text group-hover:text-fb-blue transition-colors line-clamp-2">
          {exam.title}
        </h3>
        <p className="text-[13px] text-fb-text-2 mt-0.5">{exam.chapter}</p>
        {exam.description && (
          <p className="text-[15px] text-fb-text mt-1.5 line-clamp-2">{exam.description}</p>
        )}
      </button>

      {/* Số liệu & hành động */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-fb-divider">
        <div className="flex items-center gap-4 text-[13px] text-fb-text-2">
          <span className="flex items-center gap-1" title={`${exam.ratingCount} lượt đánh giá`}>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" aria-hidden="true" />
            <strong className="font-semibold text-fb-text">
              {exam.ratingAverage > 0 ? exam.ratingAverage.toFixed(1) : '—'}
            </strong>
            ({exam.ratingCount})
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4 text-fb-blue" aria-hidden="true" />
            {exam.questions.length} câu
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            {exam.totalAttempts} lượt làm
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectExam(exam)}
            className="h-9 px-4 rounded-md bg-fb-btn hover:bg-fb-btn-hover text-[15px] font-semibold text-fb-text transition-colors cursor-pointer"
          >
            Xem chi tiết
          </button>
          <button
            type="button"
            onClick={() => onQuickPractice(exam)}
            className="h-9 px-4 rounded-md bg-fb-blue hover:bg-fb-blue-hover text-[15px] font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" aria-hidden="true" />
            Làm thử
          </button>
        </div>
      </div>
    </article>
  );
};
