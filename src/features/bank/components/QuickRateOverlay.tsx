import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  XCircle,
} from 'lucide-react';
import type { Question } from '../../demo/types';
import { QuestionRatingBar } from './QuestionRatingBar';

interface QuickRateOverlayProps {
  questions: Question[];
  answers: Record<string, string>;
  correctAnswerOf: (q: Question) => string;
  isAuthorOf: (q: Question) => boolean;
  flagged: Set<string>;
  onRate: (questionId: string, rating: number) => void | Promise<void>;
  onReportError: (
    questionId: string,
    description: string,
  ) => void | Promise<void>;
  onClose: () => void;
}

const isRated = (q: Question) => q.userRatedStars !== undefined;

/**
 * Chấm nhanh sau khi nộp bài: mỗi lần một câu, bấm sao (hoặc phím 1–4) là tự
 * sang câu chưa chấm tiếp theo. Không bắt buộc — "Để sau" đóng bất cứ lúc nào.
 */
export const QuickRateOverlay: React.FC<QuickRateOverlayProps> = ({
  questions,
  answers,
  correctAnswerOf,
  isAuthorOf,
  flagged,
  onRate,
  onReportError,
  onClose,
}) => {
  const rateable = questions.filter((q) => !isAuthorOf(q));
  const firstUnrated = Math.max(
    0,
    rateable.findIndex((q) => !isRated(q)),
  );
  const [index, setIndex] = useState(firstUnrated);
  const question = rateable[index];
  const ratedCount = rateable.filter(isRated).length;

  const nextUnrated = (from: number) => {
    for (let i = from + 1; i < rateable.length; i += 1) {
      if (!isRated(rateable[i])) return i;
    }
    return Math.min(from + 1, rateable.length - 1);
  };

  const rate = async (rating: number) => {
    if (!question) return;
    await onRate(question.id, rating);
    // Cho người dùng thấy sao vừa chọn rồi mới chuyển câu.
    setTimeout(() => setIndex((i) => nextUnrated(i)), 250);
  };

  const report = async (description: string) => {
    if (!question) return;
    await onReportError(question.id, description);
    setTimeout(() => setIndex((i) => nextUnrated(i)), 250);
  };

  // Phím tắt: 1–4 chấm sao, ←/→ chuyển câu, Esc đóng.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if (['1', '2', '3', '4'].includes(e.key)) void rate(Number(e.key));
      else if (e.key === 'ArrowRight')
        setIndex((i) => Math.min(rateable.length - 1, i + 1));
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const done = rateable.length > 0 && ratedCount === rateable.length;
  const userAns = question ? answers[question.id] : undefined;
  const correctKey = question ? correctAnswerOf(question) : '';

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div
        role="dialog"
        aria-label="Đánh giá nhanh các câu hỏi"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-fb-card shadow-2xl"
      >
        <div className="border-b border-fb-divider p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-fb-text">
              Đánh giá nhanh
              <span className="ml-2 text-sm font-normal text-fb-text-2 tabular-nums">
                {ratedCount}/{rateable.length} câu đã đánh giá
              </span>
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-fb-text-2 hover:bg-fb-hover cursor-pointer"
            >
              Để sau <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-fb-input">
            <div
              className="h-full rounded-full bg-fb-warning transition-[width]"
              style={{
                width: `${rateable.length ? (ratedCount / rateable.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {done && (
            <p className="rounded-lg bg-fb-success-soft p-3 text-sm font-semibold text-fb-success">
              Bạn đã đánh giá hết các câu. Cảm ơn bạn đã góp ý cho bạn học!
            </p>
          )}
          {!question && (
            <p className="text-sm text-fb-text-2">
              Không có câu nào để đánh giá.
            </p>
          )}
          {question && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="rounded-md bg-fb-input px-2.5 py-0.5 font-bold text-fb-text">
                  Câu {questions.indexOf(question) + 1}
                </span>
                {userAns ? (
                  correctKey && userAns === correctKey ? (
                    <span className="flex items-center gap-1 font-semibold text-fb-success">
                      <CheckCircle2 className="h-4 w-4" /> Bạn trả lời đúng
                    </span>
                  ) : correctKey ? (
                    <span className="flex items-center gap-1 font-semibold text-fb-danger">
                      <XCircle className="h-4 w-4" /> Bạn chọn {userAns}, đáp án{' '}
                      {correctKey}
                    </span>
                  ) : null
                ) : (
                  <span className="text-fb-text-3">Bạn chưa làm câu này</span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-base font-semibold text-fb-text [overflow-wrap:anywhere]">
                {question.content}
              </p>
              <ul className="space-y-1.5 text-sm">
                {question.options.map((o) => (
                  <li
                    key={o.id}
                    className={`rounded-lg border px-3 py-2 ${
                      correctKey === o.id
                        ? 'border-fb-success bg-fb-success-soft text-fb-success font-semibold'
                        : 'border-fb-divider text-fb-text'
                    }`}
                  >
                    <span className="font-bold">{o.id}.</span> {o.text}
                  </li>
                ))}
              </ul>
              <div className="rounded-lg bg-fb-inset p-3">
                <QuestionRatingBar
                  key={question.id}
                  size="lg"
                  value={question.userRatedStars}
                  startInReport={flagged.has(question.id)}
                  onRate={rate}
                  onReportError={report}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-fb-divider p-3">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold text-fb-text hover:bg-fb-hover disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" /> Câu trước
          </button>
          <button
            type="button"
            disabled={index >= rateable.length - 1}
            onClick={() =>
              setIndex((i) => Math.min(rateable.length - 1, i + 1))
            }
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold text-fb-text hover:bg-fb-hover disabled:opacity-40 cursor-pointer"
          >
            Bỏ qua <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
