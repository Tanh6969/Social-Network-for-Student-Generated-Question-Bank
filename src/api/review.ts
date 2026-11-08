import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

export type PendingSessionsResponse =
  components['schemas']['PendingSessionsResponse'];
export type PendingSessionItemDto =
  components['schemas']['PendingSessionItemDto'];
export type SessionDetailReviewResponse =
  components['schemas']['SessionDetailReviewResponse'];
export type SessionQuestionReviewDto =
  components['schemas']['SessionQuestionReviewDto'];
export type DuplicateWarning = components['schemas']['DuplicateWarning'];
export type ApproveQuestionsRequest =
  components['schemas']['ApproveQuestionsRequest'];
export type ApproveQuestionsResponse =
  components['schemas']['ApproveQuestionsResponse'];
export type RejectQuestionsRequest =
  components['schemas']['RejectQuestionsRequest'];
export type EditQuestionRequest = components['schemas']['EditQuestionRequest'];
export type EditQuestionResponse =
  components['schemas']['EditQuestionResponse'];
export type QuestionOption = components['schemas']['QuestionOption'];
export type CursorPaginationDto = components['schemas']['CursorPaginationDto'];

export interface GetPendingSessionsParams {
  after?: number;
  limit?: number;
  subject_id?: number;
  sort_by?: string;
}

/**
 * Các endpoint kiểm duyệt dành cho giảng viên. Chỉ gọi API: lỗi được ném
 * nguyên vẹn để giao diện hiển thị. Dữ liệu demo nằm ở features/proposals.
 */
export const reviewApi = {
  /** GET /sessions/pending — phiên PENDING/REVIEWING, phân trang con trỏ. */
  async getPendingSessions(
    params: GetPendingSessionsParams = {},
  ): Promise<PendingSessionsResponse> {
    const result = await api.GET('/sessions/pending', {
      params: { query: params },
    });
    return expectEnvelope(result).data ?? { items: [] };
  },

  /** GET /sessions/{sessionId} — mở phiên để duyệt (backend chuyển sang REVIEWING). */
  async getSessionDetailForReview(
    sessionId: number,
  ): Promise<SessionDetailReviewResponse> {
    const result = await api.GET('/sessions/{sessionId}', {
      params: { path: { sessionId } },
    });
    return expectEnvelope(result).data ?? { items: [], duplicate_warnings: [] };
  },

  /** POST /sessions/approve */
  async approveQuestions(
    questionIds: number[],
  ): Promise<ApproveQuestionsResponse> {
    const result = await api.POST('/sessions/approve', {
      body: { question_ids: questionIds },
    });
    return expectEnvelope(result).data ?? {};
  },

  /** POST /sessions/reject */
  async rejectQuestions(questionIds: number[], reason?: string): Promise<void> {
    const result = await api.POST('/sessions/reject', {
      body: { question_ids: questionIds, reason: reason?.trim() || undefined },
    });
    expectEnvelope(result);
  },

  /** PUT /questions/{questionId} */
  async editQuestion(
    questionId: number,
    body: EditQuestionRequest,
  ): Promise<EditQuestionResponse> {
    const result = await api.PUT('/questions/{questionId}', {
      params: { path: { questionId } },
      body,
    });
    return expectEnvelope(result).data ?? { question_id: questionId };
  },

  /** POST /sessions/{sessionId}/complete-review */
  async completeSessionReview(sessionId: number): Promise<void> {
    const result = await api.POST('/sessions/{sessionId}/complete-review', {
      params: { path: { sessionId } },
    });
    expectEnvelope(result);
  },
};
