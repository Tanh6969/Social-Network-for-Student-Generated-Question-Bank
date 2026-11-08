import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

export type RatingItemDto = components['schemas']['RatingItemDto'];
export type QuestionRatingsResponse =
  components['schemas']['QuestionRatingsResponse'];
export type ProfileResponse = components['schemas']['ProfileResponse'];
export type SessionQuestionsResponse =
  components['schemas']['SessionQuestionsResponse'];
export type PracticeQuestionDto = components['schemas']['PracticeQuestionDto'];
export type AnswerQuestionResponse =
  components['schemas']['AnswerQuestionResponse'];
export type RateQuestionRequest = components['schemas']['RateQuestionRequest'];
export type RateQuestionResponse =
  components['schemas']['RateQuestionResponse'];
export type AiRefineResponse = components['schemas']['AiRefineResponse'];
export type AiApplyResponse = components['schemas']['AiApplyResponse'];
type SubmissionsResponse = components['schemas']['SubmissionsResponse'];

export interface UserSessionsParams {
  after?: number;
  limit?: number;
  subject_id?: number;
  status?: 'PENDING' | 'REVIEWING' | 'RESOLVED';
}

export interface GetQuestionRatingsParams {
  /** Cursor: ID người đánh giá cuối ở trang trước. */
  after?: number;
  /** Mặc định 10, tối đa 50. */
  limit?: number;
}

// RatingItemDto chỉ trả user_id, nên tên/avatar phải lấy qua GET /users/{userId}.
// Cache theo userId để cùng một người không bị gọi lại ở mỗi trang nhận xét.
const profileCache = new Map<number, Promise<ProfileResponse | null>>();

export const questionsApi = {
  /** GET /questions/{questionId}/ratings — đánh giá & nhận xét, phân trang cursor. */
  async getRatings(
    questionId: number,
    params: GetQuestionRatingsParams = {},
    signal?: AbortSignal,
  ): Promise<QuestionRatingsResponse> {
    const result = await api.GET('/questions/{questionId}/ratings', {
      params: { path: { questionId }, query: params },
      signal,
    });
    return expectEnvelope(result).data ?? { items: [] };
  },

  /** GET /users/{userId}/sessions — người khác chỉ thấy phiên đã RESOLVED. */
  async getUserSessions(
    userId: number,
    params: UserSessionsParams = {},
  ): Promise<SubmissionsResponse> {
    const result = await api.GET('/users/{userId}/sessions', {
      params: { path: { userId }, query: params },
    });
    return expectEnvelope(result).data ?? { contents: [] };
  },

  /** GET /sessions/{sessionId}/questions — đáp án bị ẩn tới khi đã trả lời. */
  async getSessionQuestions(
    sessionId: number,
  ): Promise<SessionQuestionsResponse> {
    const result = await api.GET('/sessions/{sessionId}/questions', {
      params: { path: { sessionId } },
    });
    return expectEnvelope(result).data ?? { questions: [] };
  },

  /** POST /questions/{questionId}/answer */
  async answer(
    questionId: number,
    selectedOptions: string[],
    questionUpdatedAt?: string,
  ): Promise<AnswerQuestionResponse> {
    const result = await api.POST('/questions/{questionId}/answer', {
      params: { path: { questionId } },
      body: {
        selected_options: selectedOptions,
        question_updated_at: questionUpdatedAt,
      },
    });
    return expectEnvelope(result).data ?? {};
  },

  /** POST /questions/{questionId}/rate — rating 0..4; is_error = báo lỗi câu hỏi. */
  async rate(
    questionId: number,
    body: RateQuestionRequest,
  ): Promise<RateQuestionResponse> {
    const result = await api.POST('/questions/{questionId}/rate', {
      params: { path: { questionId } },
      body,
    });
    return expectEnvelope(result).data ?? {};
  },

  /** POST /questions/{questionId}/ai-refine — AI đề xuất bản sửa (chưa ghi đè). */
  async aiRefine(
    questionId: number,
    prompt: string,
  ): Promise<AiRefineResponse> {
    const result = await api.POST('/questions/{questionId}/ai-refine', {
      params: { path: { questionId } },
      body: { prompt },
    });
    const data = expectEnvelope(result).data;
    if (!data) throw new Error('AI không trả về đề xuất.');
    return data;
  },

  /** POST /questions/{questionId}/ai-apply — áp dụng (approve=true) hoặc loại bỏ bản AI. */
  async aiApply(
    questionId: number,
    editLogId: number,
    approve: boolean,
  ): Promise<AiApplyResponse> {
    const result = await api.POST('/questions/{questionId}/ai-apply', {
      params: { path: { questionId } },
      body: { edit_log_id: editLogId, approve },
    });
    return expectEnvelope(result).data ?? { question_id: questionId };
  },

  /** GET /users/{userId} — có cache; lỗi trả về null để giao diện dùng tên mặc định. */
  getUserProfile(userId: number): Promise<ProfileResponse | null> {
    let cached = profileCache.get(userId);
    if (!cached) {
      cached = api
        .GET('/users/{userId}', { params: { path: { userId } } })
        .then((result) => expectEnvelope(result).data ?? null)
        .catch(() => {
          profileCache.delete(userId);
          return null;
        });
      profileCache.set(userId, cached);
    }
    return cached;
  },
};
