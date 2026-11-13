/**
 * Nối phòng thi (ExamTestFullscreenModal) với API thật.
 * - Đề lấy từ GET /sessions/{id}/questions: đáp án bị ẩn cho tới khi trả lời.
 * - Nộp bài = POST /questions/{id}/answer cho từng câu đã chọn; máy chủ trả
 *   đáp án đúng + lời giải để hiện màn kết quả.
 * Không mang theo trạng thái duyệt hay nguồn câu hỏi (AI/người).
 */
import { basicUser } from '../friends/apiRelationships';
import { practiceGateway } from '../proposals/practiceGateway';
import { errorMessage } from '../../api/session-mode';
import type {
  PracticeQuestionDto,
  SessionQuestionsResponse,
} from '../proposals/types';
import type { Question } from '../demo/types';
import type { StudentExamSet } from './studentBankData';
import type { RemoteAnswerResult } from './components/ExamTestFullscreenModal';

type OptionKey = 'A' | 'B' | 'C' | 'D';

const ANONYMOUS_AUTHOR = basicUser({ full_name: 'Sinh viên' });

function previousAnswer(q: PracticeQuestionDto) {
  return q.my_interaction?.answered ? q.hidden_fields : undefined;
}

export function questionFromApi(
  q: PracticeQuestionDto,
  session: SessionQuestionsResponse,
): Question {
  const prev = previousAnswer(q);
  return {
    id: String(q.question_id),
    sessionId: String(session.session_id),
    subject: session.subject_name ?? '',
    chapter: '',
    content: q.content ?? '',
    imageUrl: q.image_urls?.[0],
    options: (q.options ?? []).map((o) => ({
      id: (o.key ?? '') as OptionKey,
      text: o.text ?? '',
    })),
    // Chuỗi rỗng = chưa biết đáp án (chỉ biết sau khi trả lời).
    correctAnswer: (prev?.correct_answer ?? '') as OptionKey,
    explanation: prev?.explanation ?? '',
    difficulty: 'MEDIUM',
    // Không hiển thị trong phòng thi; sinh viên không được biết trạng thái duyệt.
    status: 'PENDING',
    creatorId: '',
    creatorName: '',
    creatorAvatar: '',
    // API không trả điểm trung bình trong bộ câu hỏi → để trống, không bịa số.
    ratingAverage: 0,
    ratingCount: q.rating_count ?? 0,
    totalAttempts: 0,
    correctAttempts: 0,
    userRatedStars: q.my_interaction?.rated
      ? (q.my_interaction.my_rating ?? undefined)
      : undefined,
    userComment: q.my_interaction?.rating_comment ?? undefined,
  };
}

export function examSetFromSession(
  session: SessionQuestionsResponse,
): StudentExamSet {
  return {
    id: String(session.session_id),
    code: session.session_code ?? `#${session.session_id}`,
    title: session.title?.trim() || `Bộ câu hỏi #${session.session_id}`,
    courseCode: session.subject_code ?? '',
    subject: session.subject_name ?? '',
    chapter: session.content ?? '',
    creator: ANONYMOUS_AUTHOR,
    createdAt: session.created_at ?? '',
    questions: (session.questions ?? [])
      .filter((q) => q.question_id !== undefined)
      .map((q) => questionFromApi(q, session)),
    difficulty: 'MIXED',
    description: session.content,
    totalAttempts: 0,
    ratingAverage: 0,
    ratingCount: 0,
  };
}

export interface SubmitOutcome {
  results: Record<string, RemoteAnswerResult>;
  /** Số câu máy chủ không chấm được (đã có kết quả dự phòng thì không tính). */
  failed: number;
  firstError?: string;
}

/**
 * Gửi từng câu đã chọn. Nếu máy chủ từ chối một câu đã làm từ trước, dùng
 * đáp án đã có trong hidden_fields. Ném lỗi khi không chấm được câu nào.
 */
export async function submitAnswersToApi(
  questions: PracticeQuestionDto[],
  answers: Record<string, string>,
): Promise<SubmitOutcome> {
  const results: Record<string, RemoteAnswerResult> = {};
  let failed = 0;
  let firstError: string | undefined;

  await Promise.all(
    questions.map(async (q) => {
      if (q.question_id === undefined) return;
      const id = String(q.question_id);
      const selected = answers[id];
      const prev = previousAnswer(q);

      if (!selected) {
        // Không chọn lần này nhưng đã làm trước đó: vẫn được xem đáp án.
        if (prev?.correct_answer) {
          results[id] = {
            correctAnswer: prev.correct_answer,
            explanation: prev.explanation,
            isCorrect: false,
          };
        }
        return;
      }

      try {
        const res = await practiceGateway.answer(
          q.question_id,
          selected,
          q.updated_at,
        );
        results[id] = {
          correctAnswer: res.correct_answer,
          explanation: res.explanation,
          isCorrect:
            res.is_correct ??
            (res.correct_answer ? res.correct_answer === selected : undefined),
        };
      } catch (err: unknown) {
        if (prev?.correct_answer) {
          results[id] = {
            correctAnswer: prev.correct_answer,
            explanation: prev.explanation,
            isCorrect: prev.correct_answer === selected,
          };
          return;
        }
        failed += 1;
        firstError ??= errorMessage(err, 'Không chấm được câu hỏi.');
      }
    }),
  );

  const attempted = Object.keys(answers).length;
  if (attempted > 0 && failed === attempted) {
    throw new Error(firstError ?? 'Không nộp được bài.');
  }
  return { results, failed, firstError };
}
