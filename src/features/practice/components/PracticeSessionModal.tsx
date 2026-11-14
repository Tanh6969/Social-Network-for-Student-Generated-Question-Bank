import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Star,
  X,
  XCircle,
} from 'lucide-react';
import { errorMessage, isApiSession } from '../../../api';
import { practiceGateway } from '../../proposals/practiceGateway';
import { QuestionComments } from './QuestionComments';
import { reportQuestionError } from '../../bank/apiExamRoom';
import type {
  AnswerQuestionResponse,
  PracticeQuestionDto,
  SessionQuestionsResponse,
} from '../../proposals/types';

/** Thang đánh giá đúng theo mô tả của POST /questions/{id}/rate. */
const RATING_LABELS = [
  'Sai hoàn toàn / lỗi',
  'Có dấu hiệu AI bịa',
  'Tác giả chưa vững kiến thức',
  'Kiến thức cơ bản',
  'Câu hỏi hay',
];

interface AnswerState {
  selected?: string;
  result?: AnswerQuestionResponse;
}

interface PracticeSessionModalProps {
  sessionId: number;
  onClose: () => void;
  showToast: (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error',
  ) => void;
}

/**
 * Luyện tập một bộ câu hỏi: GET /sessions/{id}/questions → POST /answer → POST /rate.
 * Không hiển thị nguồn gốc câu hỏi (AI/người — phục vụ Game 6) và không hiển
 * thị việc câu hỏi có được chọn vào ngân hàng đề hay không.
 */
export const PracticeSessionModal: React.FC<PracticeSessionModalProps> = ({
  sessionId,
  onClose,
  showToast,
}) => {
  const [data, setData] = useState<SessionQuestionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [rated, setRated] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState(false);

  // Form đánh giá của câu đang xem
  const [stars, setStars] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await practiceGateway.getSessionQuestions(sessionId));
    } catch (err: unknown) {
      setError(errorMessage(err, 'Không tải được bộ câu hỏi.'));
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const questions = data?.questions ?? [];
  const question: PracticeQuestionDto | undefined = questions[index];
  const qid = question?.question_id;
  const state = qid ? answers[qid] : undefined;

  // Câu đã trả lời từ trước: backend trả đáp án trong hidden_fields.
  const correctKey =
    state?.result?.correct_answer ??
    (question?.my_interaction?.answered
      ? question.hidden_fields?.correct_answer
      : undefined);
  const explanation =
    state?.result?.explanation ??
    (question?.my_interaction?.answered
      ? question.hidden_fields?.explanation
      : undefined);
  const isAnswered = Boolean(
    state?.result || question?.my_interaction?.answered,
  );
  const isRated = Boolean(
    (qid && rated[qid]) || question?.my_interaction?.rated,
  );

  const goTo = (next: number) => {
    setIndex(next);
    setStars(null);
    setComment('');
    setIsError(false);
  };

  const choose = (key: string) => {
    if (!qid || isAnswered) return;
    setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], selected: key } }));
  };

  const submitAnswer = async () => {
    if (!qid || !state?.selected) return;
    setBusy(true);
    try {
      const result = await practiceGateway.answer(
        qid,
        state.selected,
        question?.updated_at,
      );
      setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], result } }));
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Không gửi được câu trả lời.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const submitRating = async () => {
    if (!qid || (isError ? !comment.trim() : stars === null)) return;
    setBusy(true);
    try {
      // Minigame 5: báo lỗi = gửi mô tả để thẩm định + rating 0 sao.
      if (isError) await reportQuestionError(qid, comment.trim());
      else
        await practiceGateway.rate(qid, {
          rating: stars ?? 0,
          comment: comment.trim() || undefined,
        });
      setRated((prev) => ({ ...prev, [qid]: true }));
      showToast(
        isError ? 'Đã gửi báo lỗi câu hỏi.' : 'Cảm ơn bạn đã đánh giá!',
        'success',
      );
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Không gửi được đánh giá.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const optionClass = (key: string) => {
    if (!isAnswered) {
      return state?.selected === key
        ? 'border-fb-blue bg-fb-blue-soft text-fb-blue font-semibold'
        : 'border-fb-divider text-fb-text hover:bg-fb-hover cursor-pointer';
    }
    if (key === correctKey)
      return 'border-fb-success bg-fb-success-soft text-fb-success font-semibold';
    if (key === state?.selected)
      return 'border-fb-danger bg-fb-danger-soft text-fb-danger';
    return 'border-fb-divider text-fb-text-2';
  };

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-fb-divider bg-fb-card shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-fb-divider bg-fb-input p-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-fb-text">
              {data?.title ?? 'Luyện tập bộ câu hỏi'}
            </h3>
            {data && (
              <p className="text-sm text-fb-text-2">
                {data.subject_name}
                {questions.length > 0 &&
                  ` · Câu ${index + 1}/${questions.length}`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-full p-1.5 text-fb-text-2 hover:bg-fb-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {!data && !error && (
            <p className="py-10 text-center text-sm text-fb-text-2">
              Đang tải…
            </p>
          )}
          {error && (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-fb-danger">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-lg bg-fb-blue px-4 py-2 text-sm font-semibold text-white"
              >
                Thử lại
              </button>
            </div>
          )}
          {data && questions.length === 0 && (
            <p className="py-10 text-center text-sm text-fb-text-2">
              Bộ này chưa có câu hỏi.
            </p>
          )}

          {question && (
            <>
              <p className="whitespace-pre-wrap text-base font-medium text-fb-text [overflow-wrap:anywhere]">
                {question.content}
              </p>
              {question.image_urls?.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="max-h-64 rounded-lg border border-fb-divider"
                />
              ))}

              <div
                className="space-y-2"
                role="radiogroup"
                aria-label="Các phương án"
              >
                {question.options?.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    role="radio"
                    aria-checked={state?.selected === o.key}
                    disabled={isAnswered}
                    onClick={() => choose(o.key ?? '')}
                    className={`flex w-full items-start gap-2 rounded-lg border p-3 text-left text-sm transition ${optionClass(o.key ?? '')}`}
                  >
                    <span className="font-bold">{o.key}.</span>
                    <span className="flex-1 [overflow-wrap:anywhere]">
                      {o.text}
                    </span>
                    {isAnswered && o.key === correctKey && (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    )}
                    {isAnswered &&
                      o.key === state?.selected &&
                      o.key !== correctKey && (
                        <XCircle className="h-4 w-4 shrink-0" />
                      )}
                  </button>
                ))}
              </div>

              {!isAnswered && (
                <button
                  type="button"
                  onClick={() => void submitAnswer()}
                  disabled={!state?.selected || busy}
                  className="rounded-lg bg-fb-blue px-4 py-2 text-sm font-semibold text-white hover:bg-fb-blue-hover disabled:opacity-50"
                >
                  Trả lời
                </button>
              )}

              {isAnswered && (
                <div className="space-y-3">
                  {state?.result && (
                    <p
                      className={`text-sm font-semibold ${
                        state.result.is_correct
                          ? 'text-fb-success'
                          : 'text-fb-danger'
                      }`}
                    >
                      {state.result.is_correct
                        ? 'Chính xác!'
                        : `Chưa đúng. Đáp án đúng là ${correctKey}.`}
                    </p>
                  )}
                  {explanation && (
                    <p className="whitespace-pre-wrap rounded-lg bg-fb-input p-3 text-sm text-fb-text-2">
                      <span className="font-semibold text-fb-text">
                        Lời giải:{' '}
                      </span>
                      {explanation}
                    </p>
                  )}

                  {/* Đánh giá chất lượng / báo lỗi (Game 5) */}
                  <div className="space-y-2 rounded-lg border border-fb-divider p-3">
                    {isRated ? (
                      <p className="text-sm text-fb-text-2">
                        Bạn đã đánh giá câu hỏi này.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-fb-text">
                          Đánh giá câu hỏi
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {RATING_LABELS.map((label, value) => (
                            <button
                              key={label}
                              type="button"
                              disabled={isError}
                              onClick={() => setStars(value)}
                              title={label}
                              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition disabled:opacity-40 ${
                                stars === value && !isError
                                  ? 'border-fb-warning bg-fb-warning-soft font-semibold text-fb-warning'
                                  : 'border-fb-divider text-fb-text-2 hover:bg-fb-hover'
                              }`}
                            >
                              <Star className="h-3.5 w-3.5" /> {value} · {label}
                            </button>
                          ))}
                        </div>
                        <label className="flex items-center gap-2 text-sm text-fb-danger">
                          <input
                            type="checkbox"
                            checked={isError}
                            onChange={(e) => setIsError(e.target.checked)}
                          />
                          <Flag className="h-3.5 w-3.5" /> Báo lỗi: đề hoặc đáp
                          án bị sai
                        </label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={2}
                          placeholder={
                            isError
                              ? 'Mô tả lỗi bạn phát hiện (bắt buộc)…'
                              : 'Nhận xét (không bắt buộc)'
                          }
                          className="w-full rounded-lg border border-fb-divider bg-fb-input px-3 py-2 text-sm text-fb-text"
                        />
                        <button
                          type="button"
                          onClick={() => void submitRating()}
                          disabled={
                            busy ||
                            (isError ? !comment.trim() : stars === null)
                          }
                          className="rounded-lg bg-fb-blue px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {isError ? 'Gửi báo lỗi' : 'Gửi đánh giá'}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Bình luận sau khi trả lời, để không lộ đáp án trước */}
                  {qid && isApiSession() && (
                    <QuestionComments
                      key={qid}
                      questionId={qid}
                      showToast={showToast}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {questions.length > 1 && (
          <div className="flex items-center justify-between border-t border-fb-divider p-3">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-fb-text hover:bg-fb-hover disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Câu trước
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index >= questions.length - 1}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-fb-text hover:bg-fb-hover disabled:opacity-40"
            >
              Câu sau <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
