import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

export type RatingItemDto = components['schemas']['RatingItemDto'];
export type QuestionRatingsResponse =
  components['schemas']['QuestionRatingsResponse'];
export type ProfileResponse = components['schemas']['ProfileResponse'];

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
