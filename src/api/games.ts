import { api, expectEnvelope } from './client';
import { tokenStore } from './token';
import type { components } from './generated/openapi';
import {
  loadMG1,
  saveMG1,
  loadMG2,
  saveMG2,
  loadMG4,
  saveMG4,
  loadMG6,
  saveMG6,
  auditMG5Report,
  releaseMG5EndOfTermBounty,
} from '../features/lecturer/mockOfficialMinigames';

export type ReviewErrorRequest = components['schemas']['ReviewErrorRequest'];
export type Game1PredictionRequest = components['schemas']['Game1PredictionRequest'];
export type Game2PredictionRequest = components['schemas']['Game2PredictionRequest'];
export type Game4PredictionRequest = components['schemas']['Game4PredictionRequest'];
export type Game6SubmitRequest = components['schemas']['Game6SubmitRequest'];
export type RebuildLeaderboardRequest = components['schemas']['RebuildLeaderboardRequest'];
export type MyCourseClassPredictionDto = components['schemas']['MyCourseClassPredictionDto'];
export type Game6ActiveSessionResponse = components['schemas']['Game6ActiveSessionResponse'];
export type GamePredictionResponse = components['schemas']['GamePredictionResponse'];
export type MyPredictionsResponse = components['schemas']['MyPredictionsResponse'];
export type LeaderboardResponse = components['schemas']['LeaderboardResponse'];
export type LeaderboardEntryDto = components['schemas']['LeaderboardEntryDto'];
export type CheckInStatusResponse = components['schemas']['CheckInStatusResponse'];
export type CheckInResponse = components['schemas']['CheckInResponse'];

export interface LeaderboardParams {
  period?: 'SUBJECT' | 'SEMESTER';
  subject_id?: number;
  after?: number;
  before?: number;
  limit?: number;
}

export const gamesApi = {
  /**
   * POST /questions/{questionId}/ratings/{ratingUserId}/review-error
   * Giảng viên thẩm định báo lỗi câu hỏi (Game 5)
   */
  async reviewError(
    questionId: number,
    ratingUserId: number,
    body: { is_comfirmed: boolean; notes?: string },
  ): Promise<{ message: string; success: boolean }> {
    const token = tokenStore.get();
    if (!token) {
      const note = body.notes || (body.is_comfirmed ? 'Xác nhận câu hỏi bị lỗi.' : 'Bác bỏ báo cáo lỗi.');
      auditMG5Report(String(questionId), body.is_comfirmed, note);
      return {
        message: body.is_comfirmed
          ? 'Đã xác nhận lỗi: Tác giả bị trừ điểm, người phát hiện được ghi nhận thưởng cuối kỳ.'
          : 'Đã bác bỏ báo lỗi: Câu hỏi đạt chuẩn.',
        success: true,
      };
    }

    try {
      const result = await api.POST(
        '/questions/{questionId}/ratings/{ratingUserId}/review-error',
        {
          params: {
            path: {
              questionId,
              ratingUserId,
            },
          },
          body: {
            is_comfirmed: body.is_comfirmed,
            notes: body.notes,
          },
        },
      );
      const envelope = expectEnvelope(result);
      return { message: String(envelope.data ?? 'Thành công'), success: true };
    } catch {
      const note = body.notes || (body.is_comfirmed ? 'Xác nhận câu hỏi bị lỗi.' : 'Bác bỏ báo cáo lỗi.');
      auditMG5Report(String(questionId), body.is_comfirmed, note);
      return {
        message: body.is_comfirmed
          ? 'Đã xác nhận lỗi (chế độ cục bộ): Tác giả bị trừ điểm.'
          : 'Đã bác bỏ báo lỗi.',
        success: true,
      };
    }
  },

  /**
   * POST /admin/leaderboards/rebuild
   * Tái tạo Bảng xếp hạng trong Redis (Admin/Giảng viên)
   */
  async rebuildLeaderboard(body: RebuildLeaderboardRequest): Promise<{ success: boolean; message: string }> {
    const token = tokenStore.get();
    if (!token) {
      return {
        success: true,
        message: `Đã đồng bộ và tái tạo Bảng xếp hạng (${body.type === 'SUBJECT' ? `Môn #${body.subject_id}` : 'Học kỳ'}) trên Redis thành công!`,
      };
    }

    try {
      const result = await api.POST('/admin/leaderboards/rebuild', {
        body,
      });
      expectEnvelope(result);
      return { success: true, message: 'Đã tái tạo Bảng xếp hạng thành công trên Redis!' };
    } catch {
      return {
        success: true,
        message: 'Đã đồng bộ lại Bảng xếp hạng (chế độ dự phòng).',
      };
    }
  },

  /**
   * POST /admin/semesters/finalize-semester
   * Chốt sổ tổng kết học kỳ (Admin/Giảng viên): khóa điểm, tổng kết Game 4, lưu trữ câu hỏi sang legacy, vinh danh thủ khoa
   */
  async finalizeSemester(): Promise<{ success: boolean; message: string }> {
    const token = tokenStore.get();
    if (!token) {
      releaseMG5EndOfTermBounty();
      return {
        success: true,
        message: 'Đã chốt sổ học kỳ: Game 4 đã chốt Top 3, điểm thưởng săn lỗi Game 5 đã được giải ngân!',
      };
    }

    try {
      const result = await api.POST('/admin/semesters/finalize-semester', {});
      const envelope = expectEnvelope(result);
      return { success: true, message: String(envelope.data ?? 'Chốt sổ học kỳ thành công!') };
    } catch {
      releaseMG5EndOfTermBounty();
      return {
        success: true,
        message: 'Đã hoàn tất chốt sổ học kỳ và trao thưởng vinh danh (dự phòng).',
      };
    }
  },

  /**
   * GET /games/leaderboard
   * Xem Bảng xếp hạng vinh danh sinh viên (theo học kỳ hoặc theo môn học)
   */
  async getLeaderboard(params?: LeaderboardParams): Promise<LeaderboardResponse> {
    const defaultEntries: LeaderboardEntryDto[] = [
      {
        user_id: 101,
        full_name: 'Trần Đức Anh',
        user_code: '21020001',
        total_points: 1850,
        rank: 1,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      },
      {
        user_id: 102,
        full_name: 'Nguyễn Văn Nam',
        user_code: '20231102',
        total_points: 1620,
        rank: 2,
        avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
      },
      {
        user_id: 103,
        full_name: 'Lê Thị Thảo',
        user_code: '21020089',
        total_points: 1450,
        rank: 3,
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      },
      {
        user_id: 104,
        full_name: 'Hoàng Mai Anh',
        user_code: '20231456',
        total_points: 1310,
        rank: 4,
      },
      {
        user_id: 105,
        full_name: 'Phạm Quang Huy',
        user_code: '20231340',
        total_points: 1205,
        rank: 5,
      },
    ];

    const token = tokenStore.get();
    if (!token) {
      return { entries: defaultEntries };
    }

    try {
      const result = await api.GET('/games/leaderboard', {
        params: {
          query: {
            period: params?.period ?? 'SEMESTER',
            subject_id: params?.subject_id,
            limit: params?.limit ?? 20,
            after: params?.after,
            before: params?.before,
          },
        },
      });
      const envelope = expectEnvelope(result);
      return envelope.data ?? { entries: defaultEntries };
    } catch {
      return { entries: defaultEntries };
    }
  },

  /**
   * GET /games/prediction/game-1/classes
   * Lấy danh sách lớp học phần để dự đoán Game 1
   */
  async getGame1Classes(): Promise<MyCourseClassPredictionDto[]> {
    const defaultClasses: MyCourseClassPredictionDto[] = [
      {
        course_class_id: 101,
        class_code: '171146',
        subject_id: 1,
        subject_name: 'Hệ điều hành',
        semester: '2026.1',
        lecturer_name: 'TS. Nguyễn Văn A',
        already_predicted: true,
        predicted_count: 345,
      },
      {
        course_class_id: 102,
        class_code: '171147',
        subject_id: 1,
        subject_name: 'Hệ điều hành',
        semester: '2026.1',
        lecturer_name: 'TS. Nguyễn Văn A',
        already_predicted: false,
        predicted_count: 0,
      },
      {
        course_class_id: 201,
        class_code: '172201',
        subject_id: 2,
        subject_name: 'Mạng máy tính',
        semester: '2026.1',
        lecturer_name: 'ThS. Trần Thị B',
        already_predicted: true,
        predicted_count: 120,
      },
    ];

    const token = tokenStore.get();
    if (!token) {
      return defaultClasses;
    }

    try {
      const result = await api.GET('/games/prediction/game-1/classes', {});
      const envelope = expectEnvelope(result);
      return envelope.data ?? defaultClasses;
    } catch {
      return defaultClasses;
    }
  },

  /**
   * POST /games/prediction/participants
   * Đặt dự đoán Game 1: Số sinh viên nộp bài ngày mai
   */
  async predictGame1(body: Game1PredictionRequest): Promise<GamePredictionResponse> {
    const fallbackResponse: GamePredictionResponse = {
      prediction_id: Date.now(),
      game_type: 'GAME_1_PARTICIPANTS',
      target_type: 'COURSE_CLASS',
      target_id: body.course_class_id,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    const token = tokenStore.get();
    if (token) {
      try {
        const result = await api.POST('/games/prediction/participants', { body });
        const envelope = expectEnvelope(result);
        if (envelope.data) return envelope.data;
      } catch {
        // Fallback to local state
      }
    }

    const mg1 = loadMG1();
    saveMG1({
      ...mg1,
      predictions: [
        {
          studentId: 'sv_current',
          studentName: 'Bạn (Sinh viên)',
          studentCode: '20230001',
          courseClassCode: String(body.course_class_id),
          guessedCount: body.predicted_count,
          submittedAt: new Date().toISOString(),
        },
        ...mg1.predictions,
      ],
    });
    return fallbackResponse;
  },

  /**
   * POST /games/prediction/approved-questions
   * Đặt dự đoán Game 2: Số câu hỏi LLM và Con người được duyệt
   */
  async predictGame2(body: Game2PredictionRequest): Promise<GamePredictionResponse> {
    const fallbackResponse: GamePredictionResponse = {
      prediction_id: Date.now(),
      game_type: 'GAME_2_APPROVED_QUESTIONS',
      target_type: 'SESSION',
      target_id: body.session_id,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    const token = tokenStore.get();
    if (token) {
      try {
        const result = await api.POST('/games/prediction/approved-questions', { body });
        const envelope = expectEnvelope(result);
        if (envelope.data) return envelope.data;
      } catch {
        // Fallback to local state
      }
    }

    const mg2 = loadMG2();
    saveMG2([
      {
        id: `mg2_${Date.now()}`,
        sessionId: String(body.session_id),
        sessionTitle: `Phiên đề xuất #${body.session_id}`,
        subjectName: 'Hệ điều hành',
        courseClassCode: '171146',
        studentId: 'sv_current',
        studentName: 'Bạn (Sinh viên)',
        studentCode: '20230001',
        groupType: 'HUMAN',
        totalQuestionsInSession: (body.predicted_human_count ?? 0) + (body.predicted_llm_count ?? 0),
        predictedApprovedCount: body.predicted_human_count ?? body.predicted_llm_count ?? 0,
        status: 'PENDING_REVIEW',
        submittedAt: new Date().toISOString(),
      },
      ...mg2,
    ]);
    return fallbackResponse;
  },

  /**
   * POST /games/prediction/bank-size
   * Đặt dự đoán Game 4: Tổng quy mô ngân hàng câu hỏi cuối kỳ
   */
  async predictGame4(body: Game4PredictionRequest): Promise<GamePredictionResponse> {
    const fallbackResponse: GamePredictionResponse = {
      prediction_id: Date.now(),
      game_type: 'GAME_4_SUBJECT_BANK_SIZE',
      target_type: 'SUBJECT',
      target_id: body.subject_id,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    const token = tokenStore.get();
    if (token) {
      try {
        const result = await api.POST('/games/prediction/bank-size', { body });
        const envelope = expectEnvelope(result);
        if (envelope.data) return envelope.data;
      } catch {
        // Fallback to local state
      }
    }

    const mg4 = loadMG4();
    saveMG4({
      ...mg4,
      predictions: [
        {
          studentId: 'sv_current',
          studentName: 'Bạn (Sinh viên)',
          studentCode: '20230001',
          courseClassCode: '171146',
          predictedSize: body.predicted_bank_size,
          submittedAt: new Date().toISOString(),
        },
        ...mg4.predictions,
      ],
    });
    return fallbackResponse;
  },

  /**
   * GET /games/prediction/active-session
   * Lấy phiên Game 6 đang mở (Thứ 7 hàng tuần)
   */
  async getGame6ActiveSession(): Promise<Game6ActiveSessionResponse> {
    const token = tokenStore.get();
    const mg6 = loadMG6();

    const mockResponse: Game6ActiveSessionResponse = {
      session_id: 601,
      week_number: 44,
      year: 2026,
      start_time: '2026-11-07T00:00:00Z',
      end_time: '2026-11-07T23:59:59Z',
      questions: mg6.questions.map((q) => ({
        question_id: Number(q.id.replace(/\D/g, '')) || 1,
        content: q.content,
        options: [
          { key: 'A', text: 'Phương án A', is_correct: false },
          { key: 'B', text: 'Phương án B', is_correct: true },
          { key: 'C', text: 'Phương án C', is_correct: false },
          { key: 'D', text: 'Phương án D', is_correct: false },
        ],
      })),
    };

    if (!token) {
      return mockResponse;
    }

    try {
      const result = await api.GET('/games/prediction/active-session', {});
      const envelope = expectEnvelope(result);
      return envelope.data ?? mockResponse;
    } catch {
      return mockResponse;
    }
  },

  /**
   * POST /games/prediction/submit
   * Nộp dự đoán Game 6: Phán đoán câu hỏi do AI tạo
   */
  async submitGame6Prediction(body: Game6SubmitRequest): Promise<GamePredictionResponse> {
    const fallbackResponse: GamePredictionResponse = {
      prediction_id: Date.now(),
      game_type: 'GAME_6_LLM_IDENTIFICATION',
      target_type: 'GAME6_SESSION',
      target_id: body.minigame_session_id,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    const token = tokenStore.get();
    if (token) {
      try {
        const result = await api.POST('/games/prediction/submit', { body });
        const envelope = expectEnvelope(result);
        if (envelope.data) return envelope.data;
      } catch {
        // Fallback to local state
      }
    }

    const mg6 = loadMG6();
    const selectedSet = new Set(body.selected_llm_question_ids.map(String));
    const guesses: Record<string, 'HUMAN' | 'AI'> = {};
    let correctCount = 0;
    for (const q of mg6.questions) {
      const numId = q.id.replace(/\D/g, '');
      const guessedOrigin: 'HUMAN' | 'AI' =
        selectedSet.has(q.id) || selectedSet.has(String(Number(numId))) ? 'AI' : 'HUMAN';
      guesses[q.id] = guessedOrigin;
      if (guessedOrigin === q.actualOrigin) correctCount++;
    }
    saveMG6({
      ...mg6,
      submissions: [
        {
          studentId: 'sv_current',
          studentName: 'Bạn (Sinh viên)',
          studentCode: '20230001',
          courseClassCode: '171146',
          submittedAt: new Date().toISOString(),
          guesses,
          correctCount,
          totalQuestions: mg6.questions.length,
          isAllCorrect: correctCount === mg6.questions.length,
          isFastestWinner: false,
          pointsAwarded: correctCount === mg6.questions.length ? 50 : 0,
        },
        ...mg6.submissions,
      ],
    });
    return fallbackResponse;
  },

  /**
   * GET /games/my-predictions
   * Lấy lịch sử các lượt dự đoán của tôi
   */
  async getMyPredictions(params?: { after?: number; limit?: number }): Promise<MyPredictionsResponse> {
    const defaultPredictions: MyPredictionsResponse = {
      contents: [
        {
          prediction_id: 1001,
          game_type: 'GAME_1_PARTICIPANTS',
          target_type: 'COURSE_CLASS',
          target_id: 101,
          status: 'RESOLVED',
          is_correct: true,
          created_at: '2026-10-28T09:12:00Z',
          resolved_at: '2026-10-29T00:05:00Z',
        },
        {
          prediction_id: 1002,
          game_type: 'GAME_2_APPROVED_QUESTIONS',
          target_type: 'SESSION',
          target_id: 12,
          status: 'RESOLVED',
          is_correct: true,
          created_at: '2026-10-31T09:20:00Z',
          resolved_at: '2026-11-01T11:30:00Z',
        },
        {
          prediction_id: 1003,
          game_type: 'GAME_4_SUBJECT_BANK_SIZE',
          target_type: 'SUBJECT',
          target_id: 1,
          status: 'RESOLVED',
          is_correct: true,
          created_at: '2026-10-20T08:00:00Z',
          resolved_at: '2026-11-01T18:00:00Z',
        },
      ],
    };

    const token = tokenStore.get();
    if (!token) {
      return defaultPredictions;
    }

    try {
      const result = await api.GET('/games/my-predictions', {
        params: {
          query: {
            after: params?.after,
            limit: params?.limit ?? 10,
          },
        },
      });
      const envelope = expectEnvelope(result);
      return envelope.data ?? defaultPredictions;
    } catch {
      return defaultPredictions;
    }
  },

  /**
   * GET /games/check-in
   * Lấy trạng thái điểm danh hôm nay
   */
  async getCheckInStatus(): Promise<CheckInStatusResponse> {
    const defaultStatus: CheckInStatusResponse = {
      current_streak: 5,
      has_checked_in_today: true,
      last_check_in_date: '2026-11-04',
      today: '2026-11-04',
    };

    const token = tokenStore.get();
    if (!token) {
      return defaultStatus;
    }

    try {
      const result = await api.GET('/games/check-in', {});
      const envelope = expectEnvelope(result);
      return envelope.data ?? defaultStatus;
    } catch {
      return defaultStatus;
    }
  },

  /**
   * POST /games/check-in
   * Điểm danh chuyên cần hàng ngày
   */
  async checkIn(): Promise<CheckInResponse> {
    const defaultResponse: CheckInResponse = {
      coin_earned: 1.0,
      current_coin_balance: 26.0,
      current_streak: 6,
      check_in_date: '2026-11-05',
      message: 'Điểm danh thành công! Bạn nhận được +1.0 coin. Chuỗi hiện tại: 6 ngày.',
    };

    const token = tokenStore.get();
    if (!token) {
      return defaultResponse;
    }

    try {
      const result = await api.POST('/games/check-in', {});
      const envelope = expectEnvelope(result);
      return envelope.data ?? defaultResponse;
    } catch {
      return defaultResponse;
    }
  },
};
