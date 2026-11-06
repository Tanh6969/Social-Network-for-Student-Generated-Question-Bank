import { api, expectEnvelope } from './client';
import { tokenStore } from './token';
import type { components } from './generated/openapi';
import {
  loadStoredMockSessions,
  saveStoredMockSessions,
  loadStoredMockDetails,
  saveStoredMockDetails,
} from '../features/lecturer/mockReviewData';

export type ReviewableSessionsResponse = components['schemas']['ReviewableSessionsResponse'];
export type ReviewableSessionItemDto = components['schemas']['ReviewableSessionItemDto'];
export type PendingSessionsResponse = ReviewableSessionsResponse;
export type PendingSessionItemDto = ReviewableSessionItemDto;
export type SessionDetailReviewResponse = components['schemas']['SessionDetailReviewResponse'];
export type SessionQuestionReviewDto = components['schemas']['SessionQuestionReviewDto'];
export type DuplicateWarning = components['schemas']['DuplicateWarning'];
export type ApproveQuestionsRequest = components['schemas']['ApproveQuestionsRequest'];
export type ApproveQuestionsResponse = components['schemas']['ApproveQuestionsResponse'];
export type RejectQuestionsRequest = components['schemas']['RejectQuestionsRequest'];
export type EditQuestionRequest = components['schemas']['EditQuestionRequest'];
export type EditQuestionResponse = components['schemas']['EditQuestionResponse'];
export type QuestionOption = components['schemas']['QuestionOption'];
export type CursorPaginationDto = components['schemas']['CursorPaginationDto'];

export interface GetPendingSessionsParams {
  after?: number;
  limit?: number;
  subject_id?: number;
  course_class_id?: number;
  sort_by?: string;
}

export const reviewApi = {
  /**
   * Lấy danh sách các phiên đề xuất chờ duyệt (PENDING/REVIEWING)
   * GET /lecturer/sessions/reviewable
   */
  async getPendingSessions(params?: GetPendingSessionsParams): Promise<PendingSessionsResponse> {
    const mockItems = loadStoredMockSessions();
    const token = tokenStore.get();

    if (!token) {
      return { items: mockItems };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const query: Record<string, string | number> = {};
      if (params?.after !== undefined) query.after = params.after;
      if (params?.limit !== undefined) query.limit = params.limit;
      if (params?.subject_id !== undefined) query.subject_id = params.subject_id;
      if (params?.course_class_id !== undefined) query.course_class_id = params.course_class_id;
      if (params?.sort_by !== undefined) query.sort_by = params.sort_by;

      const result = await api.GET('/lecturer/sessions/reviewable', {
        params: {
          query: query as {
            after?: number;
            limit?: number;
            subject_id?: number;
            course_class_id?: number;
            sort_by?: string;
          },
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const envelope = expectEnvelope(result);
      if (envelope.data?.items && envelope.data.items.length > 0) {
        return envelope.data;
      }
    } catch {
      // Backend not running or endpoint returned empty -> use rich mock review sessions
    }

    return {
      items: mockItems,
    };
  },

  /**
   * Giảng viên mở xem chi tiết phiên đề xuất để duyệt (chuyển sang REVIEWING)
   * GET /lecturer/sessions/{sessionId}
   */
  async getSessionDetailForReview(sessionId: number): Promise<SessionDetailReviewResponse> {
    const token = tokenStore.get();
    if (token) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const result = await api.GET('/lecturer/sessions/{sessionId}', {
          params: {
            path: { sessionId },
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const envelope = expectEnvelope(result);
        if (envelope.data && envelope.data.items && envelope.data.items.length > 0) {
          return envelope.data;
        }
      } catch {
        // Backend error -> fallback to mock detail
      }
    }

    const mockDetails = loadStoredMockDetails();
    if (mockDetails[sessionId]) {
      return mockDetails[sessionId];
    }

    return {
      items: [
        {
          question_id: sessionId * 10 + 1,
          content: 'Thuật toán định thời nào sau đây có thể dẫn đến hiện tượng đói CPU (Starvation) đối với tiến trình?',
          options: [
            { key: 'A', text: 'Round-Robin với Time Quantum nhỏ', is_correct: false },
            { key: 'B', text: 'Shortest Job First (SJF) không độc quyền', is_correct: true },
            { key: 'C', text: 'First-Come, First-Served (FCFS)', is_correct: false },
            { key: 'D', text: 'FIFO luân phiên', is_correct: false },
          ],
          correct_answer: 'B',
          explanation: 'SJF ưu tiên các tiến trình có thời gian thực thi ngắn. Khi các tiến trình ngắn liên tục đến, tiến trình dài sẽ bị trì hoãn vô thời hạn.',
          status: 'PENDING',
        },
        {
          question_id: sessionId * 10 + 2,
          content: 'Kỹ thuật nào sau đây được dùng để khắc phục hiện tượng Starvation trong hệ điều hành?',
          options: [
            { key: 'A', text: 'Aging (Tăng dần độ ưu tiên theo thời gian chờ)', is_correct: true },
            { key: 'B', text: 'Swapping bộ nhớ liên tục', is_correct: false },
            { key: 'C', text: 'Giảm kích thước Time Quantum', is_correct: false },
            { key: 'D', text: 'Tắt ngắt cứng', is_correct: false },
          ],
          correct_answer: 'A',
          explanation: 'Aging tăng dần độ ưu tiên của tiến trình khi nó phải chờ đợi lâu trong hàng đợi.',
          status: 'PENDING',
        },
      ],
      duplicate_warnings: [
        {
          question_index: 0,
          similar_question_id: 1024,
          similarity_score: 0.89,
          tier: 'RULE_BASED',
          matched_snipet: 'Thuật toán định thời nào sau đây có thể dẫn đến hiện tượng đói CPU (Starvation)...',
        },
      ],
    };
  },

  /**
   * Phê duyệt danh sách câu hỏi
   * POST /lecturer/sessions/approve
   */
  async approveQuestions(questionIds: number[]): Promise<ApproveQuestionsResponse> {
    const token = tokenStore.get();
    if (token) {
      try {
        const result = await api.POST('/lecturer/sessions/approve', {
          body: {
            question_ids: questionIds,
          },
        });
        const envelope = expectEnvelope(result);
        if (envelope.data) return envelope.data;
      } catch {
        // fallback to local mock update
      }
    }

    const details = loadStoredMockDetails();
    Object.keys(details).forEach((sessId) => {
      const d = details[Number(sessId)];
      if (d?.items) {
        d.items = d.items.map((q) =>
          q.question_id && questionIds.includes(q.question_id)
            ? { ...q, status: 'APPROVED' }
            : q
        );
      }
    });
    saveStoredMockDetails(details);

    return {
      points_earned: questionIds.length * 15,
    };
  },

  /**
   * Từ chối danh sách câu hỏi
   * POST /lecturer/sessions/reject
   */
  async rejectQuestions(questionIds: number[], reason?: string): Promise<void> {
    const token = tokenStore.get();
    if (token) {
      try {
        const result = await api.POST('/lecturer/sessions/reject', {
          body: {
            question_ids: questionIds,
            reason: reason?.trim() || undefined,
          },
        });
        expectEnvelope(result);
        return;
      } catch {
        // fallback to local mock update
      }
    }

    const details = loadStoredMockDetails();
    Object.keys(details).forEach((sessId) => {
      const d = details[Number(sessId)];
      if (d?.items) {
        d.items = d.items.map((q) =>
          q.question_id && questionIds.includes(q.question_id)
            ? { ...q, status: 'REJECTED' }
            : q
        );
      }
    });
    saveStoredMockDetails(details);
  },

  /**
   * Giảng viên chỉnh sửa câu hỏi
   * PUT /lecturer/questions/{questionId}
   */
  async editQuestion(
    questionId: number,
    body: EditQuestionRequest,
  ): Promise<EditQuestionResponse> {
    const token = tokenStore.get();
    if (token) {
      try {
        const result = await api.PUT('/lecturer/questions/{questionId}', {
          params: {
            path: { questionId },
          },
          body,
        });
        const envelope = expectEnvelope(result);
        if (envelope.data) return envelope.data;
      } catch {
        // fallback to local mock update
      }
    }

    const details = loadStoredMockDetails();
    Object.keys(details).forEach((sessId) => {
      const d = details[Number(sessId)];
      if (d?.items) {
        d.items = d.items.map((q) => {
          if (q.question_id === questionId) {
            return {
              ...q,
              content: body.content,
              options: body.options,
              explanation: body.explanation,
              status: body.auto_approve ? 'APPROVED' : q.status,
            };
          }
          return q;
        });
      }
    });
    saveStoredMockDetails(details);

    return {
      question_id: questionId,
      status: body.auto_approve ? 'APPROVED' : 'PENDING',
    };
  },

  /**
   * Chốt hoàn tất duyệt phiên đề xuất
   * POST /lecturer/sessions/{sessionId}/complete-review
   */
  async completeSessionReview(sessionId: number): Promise<void> {
    const token = tokenStore.get();
    if (token) {
      try {
        const result = await api.POST('/lecturer/sessions/{sessionId}/complete-review', {
          params: {
            path: { sessionId },
          },
        });
        expectEnvelope(result);
        return;
      } catch {
        // fallback to local mock update
      }
    }

    const sessions = loadStoredMockSessions();
    const updated = sessions.map((s) =>
      s.session_id === sessionId ? { ...s, status: 'RESOLVED' } : s
    );
    saveStoredMockSessions(updated);
  },
};
