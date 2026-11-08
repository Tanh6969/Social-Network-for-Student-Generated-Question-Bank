/**
 * Luyện tập theo bộ câu hỏi (phiên đề xuất). Phiên thật chỉ gọi API, phiên
 * demo dùng kho demo dùng chung. Không có hàm nào trả về việc câu hỏi được
 * chọn vào ngân hàng đề hay không — sinh viên không được biết điều đó.
 */
import { isApiSession } from '../../api/session-mode';
import { questionsApi } from '../../api/questions';
import { demoProposalStore } from './demoStore';
import { collectAllPages, PAGE_LIMIT } from './proposalGateway';
import type {
  AnswerQuestionResponse,
  RateQuestionRequest,
  RateQuestionResponse,
  SessionQuestionsResponse,
  SubmissionSessionSummary,
} from './types';

export interface ProfileOwner {
  id: string;
  name: string;
}

/** id người dùng của API là số; người dùng mẫu (chuỗi) thì không gọi API được. */
export function apiUserId(user: ProfileOwner): number | null {
  return /^\d+$/.test(user.id) ? Number(user.id) : null;
}

export const practiceGateway = {
  /**
   * Bộ câu hỏi trên trang cá nhân. Người khác chỉ thấy bộ đã được giảng viên
   * xem xét xong (RESOLVED) — quy tắc của GET /users/{userId}/sessions.
   * Trả null nếu người dùng này không có trên hệ thống thật.
   */
  async getUserSessions(
    user: ProfileOwner,
    isMe: boolean,
  ): Promise<SubmissionSessionSummary[] | null> {
    if (!isApiSession()) {
      return demoProposalStore.listUserSessions(user, isMe).contents ?? [];
    }
    const userId = apiUserId(user);
    if (userId === null) return null;
    return collectAllPages(async (after) => {
      const res = await questionsApi.getUserSessions(userId, {
        limit: PAGE_LIMIT,
        after,
      });
      return {
        items: res.contents ?? [],
        hasNext: res.pagination?.has_next ?? false,
        after: res.pagination?.after,
      };
    });
  },

  async getSessionQuestions(
    sessionId: number,
  ): Promise<SessionQuestionsResponse> {
    return isApiSession()
      ? questionsApi.getSessionQuestions(sessionId)
      : demoProposalStore.getSessionQuestions(sessionId);
  },

  async answer(
    questionId: number,
    selectedOption: string,
    questionUpdatedAt?: string,
  ): Promise<AnswerQuestionResponse> {
    return isApiSession()
      ? questionsApi.answer(questionId, [selectedOption], questionUpdatedAt)
      : demoProposalStore.answer(questionId, [selectedOption]);
  },

  async rate(
    questionId: number,
    body: RateQuestionRequest,
  ): Promise<RateQuestionResponse> {
    return isApiSession()
      ? questionsApi.rate(questionId, body)
      : demoProposalStore.rate(questionId, body);
  },
};
