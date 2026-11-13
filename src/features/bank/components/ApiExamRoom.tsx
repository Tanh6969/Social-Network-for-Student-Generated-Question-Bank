import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { errorMessage } from '../../../api';
import { practiceGateway } from '../../proposals/practiceGateway';
import type { SessionQuestionsResponse } from '../../proposals/types';
import type { StudentExamSet } from '../studentBankData';
import { examSetFromSession, submitAnswersToApi } from '../apiExamRoom';
import { ExamTestFullscreenModal } from './ExamTestFullscreenModal';
import { QuestionComments } from '../../practice/components/QuestionComments';

interface ApiExamRoomProps {
  sessionId: number;
  currentUserId: string;
  onClose: () => void;
  showToast: (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error',
  ) => void;
}

/**
 * Phòng thi toàn màn hình (giao diện cũ) chạy bằng dữ liệu thật:
 * GET /sessions/{id}/questions → nộp bài qua POST /answer → chấm sao qua
 * POST /rate → bình luận từng câu qua /comments.
 */
export const ApiExamRoom: React.FC<ApiExamRoomProps> = ({
  sessionId,
  currentUserId,
  onClose,
  showToast,
}) => {
  const [session, setSession] = useState<SessionQuestionsResponse | null>(null);
  const [exam, setExam] = useState<StudentExamSet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await practiceGateway.getSessionQuestions(sessionId);
      setSession(data);
      setExam(examSetFromSession(data));
    } catch (err: unknown) {
      setError(errorMessage(err, 'Không tải được bộ câu hỏi.'));
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setUserRating = (questionId: string, stars: number, comment?: string) =>
    setExam((prev) =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map((q) =>
              q.id === questionId
                ? { ...q, userRatedStars: stars, userComment: comment }
                : q,
            ),
          }
        : prev,
    );

  const rateQuestion = async (
    questionId: string,
    stars: number,
    comment?: string,
  ) => {
    // Thang sao 1–4 của giao diện = rating 1–4 của API (0 là "sai hoàn toàn").
    // API không có thao tác huỷ đánh giá.
    if (stars <= 0) {
      showToast(
        'Hệ thống chưa hỗ trợ bỏ đánh giá. Bạn có thể chọn lại số sao khác.',
        'info',
      );
      return;
    }
    const previous = exam?.questions.find((q) => q.id === questionId);
    setUserRating(questionId, stars, comment);
    try {
      await practiceGateway.rate(Number(questionId), {
        rating: stars,
        comment: comment || undefined,
      });
      showToast('Cảm ơn bạn đã đánh giá!', 'success');
    } catch (err: unknown) {
      setUserRating(
        questionId,
        previous?.userRatedStars ?? 0,
        previous?.userComment,
      );
      showToast(errorMessage(err, 'Không gửi được đánh giá.'), 'error');
    }
  };

  if (!exam || !session) {
    return createPortal(
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-fb-canvas p-4">
        <div className="w-full max-w-sm space-y-3 rounded-lg bg-fb-card p-6 text-center shadow-fb-card">
          {error ? (
            <>
              <p role="alert" className="text-sm text-fb-danger">
                {error}
              </p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => void load()}
                  className="h-9 rounded-md bg-fb-blue px-4 text-sm font-semibold text-white hover:bg-fb-blue-hover"
                >
                  Thử lại
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 items-center gap-1 rounded-md px-4 text-sm font-semibold text-fb-text hover:bg-fb-hover"
                >
                  <X className="h-4 w-4" /> Đóng
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-fb-text-2">Đang chuẩn bị phòng thi…</p>
          )}
        </div>
      </div>,
      document.body,
    );
  }

  if (exam.questions.length === 0) {
    return createPortal(
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-fb-canvas p-4">
        <div className="w-full max-w-sm space-y-3 rounded-lg bg-fb-card p-6 text-center shadow-fb-card">
          <p className="text-sm text-fb-text-2">Bộ này chưa có câu hỏi.</p>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md bg-fb-blue px-4 text-sm font-semibold text-white"
          >
            Đóng
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <ExamTestFullscreenModal
      exam={exam}
      onClose={onClose}
      currentUserId={currentUserId}
      onRateQuestion={(id, stars, comment) =>
        void rateQuestion(id, stars, comment)
      }
      onSubmitAnswers={async (answers) => {
        const outcome = await submitAnswersToApi(
          session.questions ?? [],
          answers,
        );
        // Làm mới trạng thái "đã làm" để lần "Làm lại đề" sau vẫn có đáp án dự phòng.
        practiceGateway
          .getSessionQuestions(sessionId)
          .then(setSession)
          .catch(() => undefined);
        if (outcome.failed > 0) {
          showToast(
            `Không chấm được ${outcome.failed} câu: ${outcome.firstError ?? ''}`,
            'warning',
          );
        }
        return outcome.results;
      }}
      renderQuestionExtras={(questionId) => (
        <QuestionComments
          questionId={Number(questionId)}
          showToast={showToast}
        />
      )}
    />
  );
};
