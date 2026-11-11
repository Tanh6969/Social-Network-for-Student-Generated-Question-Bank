import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

type Schemas = components['schemas'];
export type CheckInStatusResponse = Schemas['CheckInStatusResponse'];
export type CheckInResponse = Schemas['CheckInResponse'];
export type LeaderboardResponse = Schemas['LeaderboardResponse'];
export type LeaderboardEntryDto = Schemas['LeaderboardEntryDto'];
export type MyRankDto = Schemas['MyRankDto'];
export type MyPredictionsResponse = Schemas['MyPredictionsResponse'];
export type GamePredictionResponse = Schemas['GamePredictionResponse'];
export type Game6ActiveSessionResponse = Schemas['Game6ActiveSessionResponse'];
export type Game6QuestionDto = Schemas['Game6QuestionDto'];
export type Game1ClassDto = Schemas['MyCourseClassPredictionDto'];
export type UserBadgeResponseDto = Schemas['UserBadgeResponseDto'];
export type LeaderboardPeriod = 'SEMESTER' | 'SUBJECT';

export interface LeaderboardParams {
  period?: LeaderboardPeriod;
  subject_id?: number;
  after?: number;
  before?: number;
  limit?: number;
}

/**
 * Nhóm "21. Gamification & Minigames" của Swagger (cùng /badges/me). Chỉ gọi
 * API; lỗi được ném nguyên vẹn. Dữ liệu demo nằm ở features/games.
 */
export const gamesApi = {
  /** GET /games/check-in */
  async getCheckInStatus(): Promise<CheckInStatusResponse> {
    return expectEnvelope(await api.GET('/games/check-in')).data ?? {};
  },

  /** POST /games/check-in */
  async checkIn(): Promise<CheckInResponse> {
    return expectEnvelope(await api.POST('/games/check-in')).data ?? {};
  },

  /** GET /games/leaderboard */
  async getLeaderboard(
    params: LeaderboardParams = {},
  ): Promise<LeaderboardResponse> {
    const result = await api.GET('/games/leaderboard', {
      params: { query: params },
    });
    return expectEnvelope(result).data ?? { entries: [] };
  },

  /** GET /games/my-predictions */
  async getMyPredictions(
    params: { after?: number; limit?: number } = {},
  ): Promise<MyPredictionsResponse> {
    const result = await api.GET('/games/my-predictions', {
      params: { query: params },
    });
    return expectEnvelope(result).data ?? { contents: [] };
  },

  /** GET /games/prediction/game-1/classes */
  async getGame1Classes(): Promise<Game1ClassDto[]> {
    return (
      expectEnvelope(await api.GET('/games/prediction/game-1/classes')).data ??
      []
    );
  },

  /** POST /games/prediction/participants (Game 1) */
  async predictParticipants(courseClassId: number, predictedCount: number) {
    const result = await api.POST('/games/prediction/participants', {
      body: { course_class_id: courseClassId, predicted_count: predictedCount },
    });
    return expectEnvelope(result).data;
  },

  /** POST /games/prediction/approved-questions (Game 2) */
  async predictApprovedQuestions(
    sessionId: number,
    llmCount: number,
    humanCount: number,
  ) {
    const result = await api.POST('/games/prediction/approved-questions', {
      body: {
        session_id: sessionId,
        predicted_llm_count: llmCount,
        predicted_human_count: humanCount,
      },
    });
    return expectEnvelope(result).data;
  },

  /** POST /games/prediction/bank-size (Game 4) */
  async predictBankSize(subjectId: number, predictedBankSize: number) {
    const result = await api.POST('/games/prediction/bank-size', {
      body: { subject_id: subjectId, predicted_bank_size: predictedBankSize },
    });
    return expectEnvelope(result).data;
  },

  /** GET /games/prediction/active-session (Game 6) */
  async getGame6ActiveSession(): Promise<Game6ActiveSessionResponse | null> {
    return (
      expectEnvelope(await api.GET('/games/prediction/active-session')).data ??
      null
    );
  },

  /** POST /games/prediction/submit (Game 6) */
  async submitGame6(
    minigameSessionId: number,
    selectedLlmQuestionIds: number[],
  ) {
    const result = await api.POST('/games/prediction/submit', {
      body: {
        minigame_session_id: minigameSessionId,
        selected_llm_question_ids: selectedLlmQuestionIds,
      },
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /questions/{questionId}/ratings/{ratingUserId}/review-error (Game 5).
   * Lưu ý: Swagger đặt tên trường là `is_comfirmed` (sai chính tả) — phải giữ nguyên.
   */
  async reviewError(
    questionId: number,
    ratingUserId: number,
    isConfirmed: boolean,
    notes?: string,
  ): Promise<string | undefined> {
    const result = await api.POST(
      '/questions/{questionId}/ratings/{ratingUserId}/review-error',
      {
        params: { path: { questionId, ratingUserId } },
        body: { is_comfirmed: isConfirmed, notes: notes?.trim() || undefined },
      },
    );
    return expectEnvelope(result).data;
  },

  /** GET /badges/me */
  async getMyBadges(): Promise<UserBadgeResponseDto[]> {
    return expectEnvelope(await api.GET('/badges/me')).data ?? [];
  },

  /** POST /admin/leaderboards/rebuild — chỉ Quản trị viên (FE chưa có vai trò Admin). */
  async rebuildLeaderboard(
    type: LeaderboardPeriod = 'SEMESTER',
    subjectId?: number,
  ) {
    const result = await api.POST('/admin/leaderboards/rebuild', {
      body: { type, subject_id: subjectId },
    });
    return expectEnvelope(result).data;
  },

  /** POST /admin/semesters/finalize-semester — chỉ Quản trị viên. */
  async finalizeSemester(): Promise<string | undefined> {
    return expectEnvelope(await api.POST('/admin/semesters/finalize-semester'))
      .data;
  },
};
