/**
 * Dữ liệu DEMO cho nhóm trò chơi (chỉ dùng khi không có phiên đăng nhập thật).
 * Mọi hàm trả đúng DTO của Swagger. Việc chấm kết quả do backend thực hiện,
 * nên dự đoán mới ở demo luôn ở trạng thái PENDING (chờ tổng kết).
 */
import { ApiError } from '../../api/client';
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
import { mockCurrentUserStudent, mockOtherUsers } from '../../mocks/mockData';
import {
  DEMO_STUDENT_USER_ID,
  demoProposalStore,
  loadDemoSessions,
} from '../proposals/demoStore';

type GameType = NonNullable<GamePredictionResponse['game_type']>;
/** Swagger mô tả prediction_data/actual_data là object tự do (sinh ra kiểu rỗng). */
const asData = (value: Record<string, unknown>) =>
  value as unknown as NonNullable<GamePredictionResponse['prediction_data']>;

type TargetType = NonNullable<GamePredictionResponse['target_type']>;

interface DemoGameState {
  streak: number;
  lastCheckIn?: string;
  coins: number;
  predictions: GamePredictionResponse[];
  /** Kết quả thẩm định báo lỗi: khoá `${questionId}:${userId}`. */
  reviews: Record<string, { is_confirmed: boolean; notes?: string }>;
  nextPredictionId: number;
}

const STORAGE_KEY = 'sqb_demo_games_v1';
let memory: DemoGameState | null = null;

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

function seed(): DemoGameState {
  return {
    streak: 4,
    lastCheckIn: undefined,
    coins: 23,
    nextPredictionId: 2000,
    reviews: {},
    // Lịch sử đã tổng kết để màn "Lịch sử dự đoán" có dữ liệu.
    predictions: [
      {
        prediction_id: 1001,
        game_type: 'GAME_1_PARTICIPANTS',
        target_type: 'COURSE_CLASS',
        target_id: 501,
        prediction_data: asData({ predicted_count: 6 }),
        actual_data: asData({ actual_count: 6 }),
        status: 'RESOLVED',
        is_correct: true,
        created_at: daysAgo(3),
        resolved_at: daysAgo(2),
      },
      {
        prediction_id: 1002,
        game_type: 'GAME_6_LLM_IDENTIFICATION',
        target_type: 'GAME6_SESSION',
        target_id: 2,
        prediction_data: asData({ selected_llm_question_ids: [9102, 9105] }),
        actual_data: asData({ correct_count: 5, total: 7 }),
        status: 'RESOLVED',
        is_correct: false,
        created_at: daysAgo(8),
        resolved_at: daysAgo(7),
      },
      {
        prediction_id: 1003,
        game_type: 'GAME_3_AUTHOR_CONFIDENCE',
        target_type: 'SESSION',
        target_id: 202,
        prediction_data: asData({ confidence: 3.5 }),
        actual_data: asData({ avg_rating: 3.4 }),
        status: 'RESOLVED',
        is_correct: true,
        created_at: daysAgo(10),
        resolved_at: daysAgo(6),
      },
    ],
  };
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function load(): DemoGameState {
  if (memory) return memory;
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (raw) return (memory = JSON.parse(raw) as DemoGameState);
  } catch {
    // dựng lại từ dữ liệu mẫu
  }
  return (memory = seed());
}

function save(state: DemoGameState): void {
  memory = state;
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // vẫn còn bản trong bộ nhớ
  }
}

export function resetDemoGames(): void {
  memory = null;
  storage()?.removeItem(STORAGE_KEY);
}

function addPrediction(
  gameType: GameType,
  targetType: TargetType,
  targetId: number,
  data: Record<string, unknown>,
): GamePredictionResponse {
  const state = load();
  const prediction: GamePredictionResponse = {
    prediction_id: state.nextPredictionId,
    game_type: gameType,
    target_type: targetType,
    target_id: targetId,
    prediction_data: asData(data),
    status: 'PENDING',
    created_at: new Date().toISOString(),
  };
  save({
    ...state,
    nextPredictionId: state.nextPredictionId + 1,
    predictions: [prediction, ...state.predictions],
  });
  return prediction;
}

function hasPrediction(
  gameType: GameType,
  targetId: number,
  sameDay = false,
): boolean {
  return load().predictions.some(
    (p) =>
      p.game_type === gameType &&
      p.target_id === targetId &&
      (!sameDay ||
        p.created_at?.slice(0, 10) === new Date().toISOString().slice(0, 10)),
  );
}

// ---------------------------------------------------------------------------
// Dữ liệu cố định của demo
// ---------------------------------------------------------------------------
const DEMO_CLASSES: Omit<
  Game1ClassDto,
  'already_predicted' | 'predicted_count'
>[] = [
  {
    course_class_id: 501,
    class_code: 'IT3080_01',
    semester: '2026.1',
    subject_id: 11,
    subject_name: 'Mạng máy tính',
    lecturer_name: 'TS. Trần Minh Đức',
  },
  {
    course_class_id: 502,
    class_code: 'IT3180_02',
    semester: '2026.1',
    subject_id: 10,
    subject_name: 'Công nghệ phần mềm',
    lecturer_name: 'PGS. TS. Vũ Hải Yến',
  },
];

const opts = (texts: string[], correct: number): QuestionOption[] =>
  texts.map((text, i) => ({ key: 'ABCD'[i], text, is_correct: i === correct }));

/** 7 câu của phiên Game 6 demo; `ai` là đáp án thật (chỉ dùng nội bộ). */
const GAME6_QUESTIONS = [
  {
    id: 9201,
    ai: false,
    content: 'Trong TCP, cờ nào dùng để khởi tạo bắt tay 3 bước?',
    o: opts(['SYN', 'ACK', 'FIN', 'RST'], 0),
  },
  {
    id: 9202,
    ai: true,
    content:
      'Thuật toán nào đảm bảo tìm được đường đi ngắn nhất trên đồ thị có trọng số không âm?',
    o: opts(['DFS', 'Dijkstra', 'Prim', 'Kruskal'], 1),
  },
  {
    id: 9203,
    ai: false,
    content: 'Chuẩn hoá 3NF loại bỏ loại phụ thuộc nào?',
    o: opts(
      [
        'Phụ thuộc bắc cầu',
        'Phụ thuộc đa trị',
        'Phụ thuộc kết nối',
        'Phụ thuộc hàm đầy đủ',
      ],
      0,
    ),
  },
  {
    id: 9204,
    ai: true,
    content: 'Mẫu thiết kế nào đảm bảo một lớp chỉ có duy nhất một thể hiện?',
    o: opts(['Factory', 'Observer', 'Singleton', 'Adapter'], 2),
  },
  {
    id: 9205,
    ai: false,
    content:
      'Hiện tượng "đói CPU" (starvation) có thể xảy ra với thuật toán nào?',
    o: opts(['FCFS', 'Round-Robin', 'SJF', 'FIFO'], 2),
  },
  {
    id: 9206,
    ai: true,
    content: 'Độ phức tạp trung bình của Quick Sort là bao nhiêu?',
    o: opts(['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], 1),
  },
  {
    id: 9207,
    ai: false,
    content: 'Địa chỉ IPv4 có độ dài bao nhiêu bit?',
    o: opts(['16', '32', '64', '128'], 1),
  },
];

const DEMO_GAME6_SESSION_ID = 3;

const LEADERBOARD_BASE = [
  { user: mockOtherUsers[1], points: 1520.5, code: '20210002' },
  { user: mockOtherUsers[0], points: 1384, code: '20210001' },
  { user: mockCurrentUserStudent, points: 1250, code: '20210099', me: true },
  { user: mockOtherUsers[3], points: 980, code: '20210004' },
  { user: mockOtherUsers[4], points: 875.5, code: '20210005' },
].filter((row) => row.user);

/** Ánh xạ user_id số trên bảng xếp hạng demo → id người dùng mẫu để mở hồ sơ. */
export function demoProfileIdForUser(
  userId: number | undefined,
): string | null {
  const row = LEADERBOARD_BASE[(userId ?? 0) - 1];
  return row ? row.user.id : null;
}

export interface DemoErrorReport {
  question_id: number;
  rating_user_id: number;
  reporter_name: string;
  comment?: string;
  created_at?: string;
  content: string;
  options: QuestionOption[];
  explanation?: string;
  subject_id: number;
  review?: { is_confirmed: boolean; notes?: string };
}

// ---------------------------------------------------------------------------
// Các thao tác mô phỏng endpoint
// ---------------------------------------------------------------------------
export const demoGameStore = {
  getCheckInStatus(): CheckInStatusResponse {
    const state = load();
    return {
      current_streak: state.streak,
      has_checked_in_today: state.lastCheckIn === today(),
      last_check_in_date: state.lastCheckIn,
      today: today(),
    };
  },

  checkIn(): CheckInResponse {
    const state = load();
    if (state.lastCheckIn === today()) {
      throw new ApiError('Hôm nay bạn đã điểm danh rồi.', 409);
    }
    const yesterday = new Date(Date.now() - 86_400_000);
    const y = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const streak =
      state.lastCheckIn === y || state.lastCheckIn === undefined
        ? state.streak + 1
        : 1;
    const coins = state.coins + 1;
    save({ ...state, streak, coins, lastCheckIn: today() });
    return {
      coin_earned: 1,
      current_coin_balance: coins,
      current_streak: streak,
      check_in_date: today(),
      message: `Điểm danh thành công! Bạn nhận được +1 xu. Chuỗi hiện tại: ${streak} ngày.`,
    };
  },

  getLeaderboard(params: LeaderboardParams): LeaderboardResponse {
    // Điểm theo môn: giả lập bằng hệ số cố định theo môn để danh sách khác nhau.
    const factor =
      params.period === 'SUBJECT'
        ? 0.3 + ((params.subject_id ?? 0) % 5) * 0.1
        : 1;
    const rows = LEADERBOARD_BASE.map((row, i) => ({
      ...row,
      user_id: i + 1,
      points: Math.round(row.points * factor * 10) / 10,
    }))
      .sort((a, b) => b.points - a.points)
      .map((row, i) => ({
        rank: i + 1,
        user_id: row.user_id,
        user_code: row.code,
        full_name: row.user.name,
        avatar_url: row.user.avatar,
        total_points: row.points,
        is_current_user: Boolean(row.me),
      }));
    const mine = rows.find((r) => r.is_current_user);
    return {
      entries: rows,
      my_rank: mine && {
        rank: mine.rank,
        total_points: mine.total_points,
        top_percent: Math.round((mine.rank / 120) * 1000) / 10,
        total_participants: 120,
        full_name: mine.full_name,
        avatar_url: mine.avatar_url,
      },
      pagination: { has_next: false, has_prev: false },
    };
  },

  getMyPredictions(): GamePredictionResponse[] {
    return load().predictions;
  },

  getGame1Classes(): Game1ClassDto[] {
    const state = load();
    const todayIso = new Date().toISOString().slice(0, 10);
    return DEMO_CLASSES.map((c) => {
      const p = state.predictions.find(
        (x) =>
          x.game_type === 'GAME_1_PARTICIPANTS' &&
          x.target_id === c.course_class_id &&
          x.created_at?.slice(0, 10) === todayIso,
      );
      return {
        ...c,
        already_predicted: Boolean(p),
        predicted_count: p
          ? Number(
              (p.prediction_data as { predicted_count?: number })
                ?.predicted_count,
            )
          : undefined,
      };
    });
  },

  predictParticipants(
    courseClassId: number,
    count: number,
  ): GamePredictionResponse {
    if (!DEMO_CLASSES.some((c) => c.course_class_id === courseClassId)) {
      throw new ApiError('Bạn không thuộc lớp học phần này.', 403);
    }
    if (!Number.isInteger(count) || count < 1)
      throw new ApiError('Số dự đoán phải từ 1 trở lên.', 400);
    if (hasPrediction('GAME_1_PARTICIPANTS', courseClassId, true)) {
      throw new ApiError('Bạn đã dự đoán cho lớp này hôm nay.', 409);
    }
    return addPrediction('GAME_1_PARTICIPANTS', 'COURSE_CLASS', courseClassId, {
      predicted_count: count,
    });
  },

  predictApprovedQuestions(
    sessionId: number,
    llm: number,
    human: number,
  ): GamePredictionResponse {
    const detail = demoProposalStore.getMySubmissionDetail(sessionId); // 403 nếu không phải của mình
    const session = loadDemoSessions().find((s) => s.session_id === sessionId);
    if (session?.status === 'RESOLVED') {
      throw new ApiError(
        'Bộ câu hỏi đã được xem xét xong, không thể dự đoán nữa.',
        400,
      );
    }
    const llmTotal = (detail.questions ?? []).filter(
      (q) => q.source === 'LLM',
    ).length;
    const humanTotal = (detail.questions ?? []).length - llmTotal;
    if (llm < 0 || human < 0 || llm > llmTotal || human > humanTotal) {
      throw new ApiError(
        `Số dự đoán vượt quá số câu của bộ (AI: ${llmTotal}, tự làm: ${humanTotal}).`,
        400,
      );
    }
    if (hasPrediction('GAME_2_APPROVED_QUESTIONS', sessionId)) {
      throw new ApiError('Bạn đã dự đoán cho bộ câu hỏi này.', 409);
    }
    return addPrediction('GAME_2_APPROVED_QUESTIONS', 'SESSION', sessionId, {
      predicted_llm_count: llm,
      predicted_human_count: human,
    });
  },

  predictBankSize(subjectId: number, size: number): GamePredictionResponse {
    if (
      !demoProposalStore
        .listEnrolledSubjects()
        .some((s) => s.subject_id === subjectId)
    ) {
      throw new ApiError('Bạn chưa tham gia môn học này.', 403);
    }
    if (!Number.isInteger(size) || size < 0)
      throw new ApiError('Quy mô dự đoán không hợp lệ.', 400);
    if (hasPrediction('GAME_4_SUBJECT_BANK_SIZE', subjectId)) {
      throw new ApiError('Mỗi môn chỉ được dự đoán một lần.', 409);
    }
    return addPrediction('GAME_4_SUBJECT_BANK_SIZE', 'SUBJECT', subjectId, {
      predicted_bank_size: size,
    });
  },

  getGame6ActiveSession(): Game6ActiveSessionResponse {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 86_400_000 - 1000);
    return {
      session_id: DEMO_GAME6_SESSION_ID,
      week_number: Math.ceil(
        (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
          (7 * 86_400_000),
      ),
      year: now.getFullYear(),
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      questions: GAME6_QUESTIONS.map((q) => ({
        question_id: q.id,
        content: q.content,
        options: q.o,
      })),
    };
  },

  submitGame6(sessionId: number, selected: number[]): GamePredictionResponse {
    if (sessionId !== DEMO_GAME6_SESSION_ID)
      throw new ApiError('Phiên Game 6 không tồn tại.', 404);
    if (hasPrediction('GAME_6_LLM_IDENTIFICATION', sessionId)) {
      throw new ApiError('Mỗi phiên chỉ được nộp một lần.', 409);
    }
    return addPrediction(
      'GAME_6_LLM_IDENTIFICATION',
      'GAME6_SESSION',
      sessionId,
      {
        selected_llm_question_ids: selected,
      },
    );
  },

  getMyBadges(): UserBadgeResponseDto[] {
    return [
      {
        badge_id: 1,
        name: 'Tác giả tích cực',
        description: 'Có từ 10 câu hỏi được chọn vào ngân hàng đề',
        badge_tier: 'SILVER',
        earned_at: daysAgo(20),
      },
      {
        badge_id: 2,
        name: 'Chuyên cần',
        description: 'Điểm danh 7 ngày liên tiếp',
        badge_tier: 'BRONZE',
        earned_at: daysAgo(12),
      },
      {
        badge_id: 3,
        name: 'Thợ săn lỗi',
        description: 'Có báo lỗi câu hỏi được giảng viên xác nhận',
        badge_tier: 'GOLD',
        earned_at: daysAgo(4),
      },
    ];
  },

  /**
   * Báo lỗi câu hỏi (Game 5) cho màn thẩm định của giảng viên: lấy từ các lần
   * sinh viên demo báo lỗi khi luyện tập, cộng hai báo cáo mẫu của bạn học.
   */
  listErrorReports(): DemoErrorReport[] {
    const state = load();
    const sessions = loadDemoSessions();
    const reports: DemoErrorReport[] = [];
    for (const s of sessions) {
      for (const q of s.questions) {
        if (q.my_rating?.is_error) {
          reports.push({
            question_id: q.question_id,
            rating_user_id: DEMO_STUDENT_USER_ID,
            reporter_name: mockCurrentUserStudent.name,
            comment: q.my_rating.comment,
            content: q.content,
            options: q.options,
            explanation: q.explanation,
            subject_id: s.subject_id,
          });
        }
      }
    }
    const banked = sessions.flatMap((s) =>
      s.questions.filter((q) => q.status === 'APPROVED').map((q) => ({ s, q })),
    );
    const samples = [
      {
        userId: 202,
        name: 'Lê Thị Thuỳ Dung',
        comment: 'Đáp án đúng phải là phương án khác, đề thiếu dữ kiện.',
      },
      {
        userId: 203,
        name: 'Phạm Quang Huy',
        comment: 'Phương án B và C cùng đúng.',
      },
    ];
    samples.forEach((sample, i) => {
      const item = banked[i];
      if (!item) return;
      reports.push({
        question_id: item.q.question_id,
        rating_user_id: sample.userId,
        reporter_name: sample.name,
        comment: sample.comment,
        created_at: daysAgo(i + 1),
        content: item.q.content,
        options: item.q.options,
        explanation: item.q.explanation,
        subject_id: item.s.subject_id,
      });
    });
    return reports.map((r) => ({
      ...r,
      review: state.reviews[`${r.question_id}:${r.rating_user_id}`],
    }));
  },

  reviewError(
    questionId: number,
    ratingUserId: number,
    isConfirmed: boolean,
    notes?: string,
  ): string {
    const key = `${questionId}:${ratingUserId}`;
    const report = demoGameStore
      .listErrorReports()
      .find((r) => `${r.question_id}:${r.rating_user_id}` === key);
    if (!report) throw new ApiError('Không tìm thấy báo lỗi này.', 404);
    if (report.review)
      throw new ApiError('Báo lỗi này đã được thẩm định.', 409);
    const state = load();
    save({
      ...state,
      reviews: {
        ...state.reviews,
        [key]: { is_confirmed: isConfirmed, notes: notes?.trim() || undefined },
      },
    });
    return isConfirmed ? 'Đã xác nhận câu hỏi có lỗi.' : 'Đã bác bỏ báo lỗi.';
  },
};
