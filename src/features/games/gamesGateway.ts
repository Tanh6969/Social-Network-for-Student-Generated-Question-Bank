/**
 * Điểm vào duy nhất cho màn hình trò chơi. Phiên thật chỉ gọi API (lỗi được ném
 * nguyên vẹn); phiên demo dùng demoGameStore.
 */
import { ApiError } from '../../api/client';
import { isApiSession } from '../../api/session-mode';
import { gamesApi } from '../../api/games';
import type {
  CheckInResponse,
  CheckInStatusResponse,
  Game1ClassDto,
  Game6ActiveSessionResponse,
  GamePredictionResponse,
  LeaderboardParams,
  LeaderboardResponse,
  UserBadgeResponseDto,
} from '../../api/games';
import type { QuestionOption } from '../../api';
import { collectAllPages } from '../proposals/proposalGateway';
import { demoGameStore, type DemoErrorReport } from './demoGameStore';

/** Một báo lỗi câu hỏi (Game 5) cần giảng viên thẩm định. */
export interface ErrorReport {
  question_id: number;
  rating_user_id: number;
  reporter_name: string;
  comment?: string;
  created_at?: string;
  content?: string;
  options?: QuestionOption[];
  explanation?: string;
  /** Chỉ biết ở demo; Swagger không trả trạng thái đã thẩm định. */
  review?: DemoErrorReport['review'];
}

const NO_DATA_CODE = '9994';

export const gamesGateway = {
  async getCheckInStatus(): Promise<CheckInStatusResponse> {
    return isApiSession()
      ? gamesApi.getCheckInStatus()
      : demoGameStore.getCheckInStatus();
  },

  async checkIn(): Promise<CheckInResponse> {
    return isApiSession() ? gamesApi.checkIn() : demoGameStore.checkIn();
  },

  async getLeaderboard(
    params: LeaderboardParams,
  ): Promise<LeaderboardResponse> {
    return isApiSession()
      ? gamesApi.getLeaderboard(params)
      : demoGameStore.getLeaderboard(params);
  },

  /** Toàn bộ lịch sử dự đoán (đọc hết các trang). */
  async getMyPredictions(): Promise<GamePredictionResponse[]> {
    if (!isApiSession()) return demoGameStore.getMyPredictions();
    return collectAllPages(async (after) => {
      const res = await gamesApi.getMyPredictions({ after, limit: 50 });
      return {
        items: res.contents ?? [],
        hasNext: res.pagination?.has_next ?? false,
        after: res.pagination?.after,
      };
    });
  },

  async getGame1Classes(): Promise<Game1ClassDto[]> {
    return isApiSession()
      ? gamesApi.getGame1Classes()
      : demoGameStore.getGame1Classes();
  },

  async predictParticipants(courseClassId: number, count: number) {
    return isApiSession()
      ? gamesApi.predictParticipants(courseClassId, count)
      : demoGameStore.predictParticipants(courseClassId, count);
  },

  async predictApprovedQuestions(
    sessionId: number,
    llm: number,
    human: number,
  ) {
    return isApiSession()
      ? gamesApi.predictApprovedQuestions(sessionId, llm, human)
      : demoGameStore.predictApprovedQuestions(sessionId, llm, human);
  },

  async predictBankSize(subjectId: number, size: number) {
    return isApiSession()
      ? gamesApi.predictBankSize(subjectId, size)
      : demoGameStore.predictBankSize(subjectId, size);
  },

  /** Phiên Game 6 đang mở; null nếu hiện không có phiên (backend trả 404 ngoài Thứ 7). */
  async getGame6ActiveSession(): Promise<Game6ActiveSessionResponse | null> {
    if (!isApiSession()) return demoGameStore.getGame6ActiveSession();
    try {
      return await gamesApi.getGame6ActiveSession();
    } catch (err: unknown) {
      // Máy chủ thật báo "không có phiên" bằng HTTP 200 + mã 9994 (NO_DATA).
      if (
        err instanceof ApiError &&
        (err.status === 404 || err.code === NO_DATA_CODE)
      )
        return null;
      throw err;
    }
  },

  async submitGame6(sessionId: number, selected: number[]) {
    return isApiSession()
      ? gamesApi.submitGame6(sessionId, selected)
      : demoGameStore.submitGame6(sessionId, selected);
  },

  async getMyBadges(): Promise<UserBadgeResponseDto[]> {
    return isApiSession()
      ? gamesApi.getMyBadges()
      : demoGameStore.getMyBadges();
  },

  /**
   * Báo lỗi cần thẩm định. Backend đã tách báo lỗi khỏi đánh giá
   * (PUT /questions/{id}/report) và chưa có endpoint liệt kê báo lỗi, nên phiên
   * thật chưa lấy được danh sách. Phiên demo trả dữ liệu mô phỏng.
   */
  async getErrorReports(questionId?: number): Promise<ErrorReport[]> {
    if (isApiSession()) return [];
    const all = demoGameStore.listErrorReports();
    return questionId ? all.filter((r) => r.question_id === questionId) : all;
  },

  async reviewError(
    questionId: number,
    ratingUserId: number,
    isConfirmed: boolean,
    notes?: string,
  ): Promise<string | undefined> {
    return isApiSession()
      ? gamesApi.reviewError(questionId, ratingUserId, isConfirmed, notes)
      : demoGameStore.reviewError(questionId, ratingUserId, isConfirmed, notes);
  },
};
