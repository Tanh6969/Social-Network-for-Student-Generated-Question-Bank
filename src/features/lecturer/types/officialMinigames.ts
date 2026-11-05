// ============================================================================
// Official 6 Minigames Specification Types (Slide 3.1 Yêu cầu chức năng)
// ============================================================================

export type OfficialMinigameId =
  | 'MG1_PARTICIPANTS'     // Minigame 1: Đoán số lượng người tham gia đề xuất (sai số ±5%)
  | 'MG2_APPROVAL_RATE'    // Minigame 2: Đoán tỷ lệ/số lượng câu duyệt của chính mình (AI / Tự làm)
  | 'MG3_POPULARITY'       // Minigame 3: Đoán mức độ yêu thích trong 10 câu (đúng >= 50% được +0.25đ)
  | 'MG4_BANK_SIZE'        // Minigame 4: Đoán số lượng câu trong ngân hàng đề (Top 3 chuẩn nhất và sớm nhất)
  | 'MG5_REPORT_ERROR'     // Minigame 5: Báo câu lỗi rate 0 sao (Chủ câu bị trừ, người báo cộng lúc cuối kỳ)
  | 'MG6_LLM_DETECTION';   // Minigame 6: Dự đoán câu của LLM trong >= 7 câu (Đúng hết + sớm nhất)

// ----------------------------------------------------------------------------
// Minigame 1: Đoán số lượng người tham gia đề xuất (±5%)
// ----------------------------------------------------------------------------
export interface MG1_Session {
  id: string;
  title: string;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  targetClassCodes: string[];
  startDate: string;
  endDate: string;
  currentActualProposers: number; // Số người thực tế đã gửi phiên đề xuất
  tolerancePercent: number;       // Mặc định 5 (±5%)
  rewardPoints: number;           // Mặc định 200 điểm
  status: 'OPEN' | 'RESOLVED';
  resolvedActualCount?: number;
  predictions: {
    studentId: string;
    studentName: string;
    studentCode: string;
    courseClassCode: string;
    guessedCount: number;
    submittedAt: string;
    diffFromActual?: number;
    errorPercent?: number;
    isWinner?: boolean;
  }[];
}

// ----------------------------------------------------------------------------
// Minigame 2: Đoán tỷ lệ/số câu duyệt của chính mình (Nhóm AI hoặc Tự làm)
// ----------------------------------------------------------------------------
export interface MG2_SessionPrediction {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  courseClassCode: string;
  subjectName: string;
  sessionId: string;
  sessionTitle: string;
  groupType: 'AI' | 'HUMAN';     // Nhóm câu hỏi sinh viên khai báo
  totalQuestionsInSession: number;
  predictedApprovedCount: number; // SV tự đoán số câu mình sẽ được duyệt
  actualApprovedCount?: number;   // Số câu thực tế giảng viên đã duyệt
  isExact?: boolean;              // Đoán chính xác 100%
  pointsAwarded?: number;
  status: 'PENDING_REVIEW' | 'EVALUATED';
  submittedAt: string;
  evaluatedAt?: string;
}

// ----------------------------------------------------------------------------
// Minigame 3: Đoán mức độ yêu thích trong 10 câu hỏi (Đúng >= 50% được +0.25đ)
// ----------------------------------------------------------------------------
export interface MG3_QuestionItem {
  questionId: string;
  questionIndex: number; // 1 -> 10
  content: string;
  actualUpvotes: number; // Lượt bạn học thích
  actualRatingAverage: number;
  isPopular: boolean;    // Câu thuộc Top 50% yêu thích
}

export interface MG3_Session {
  id: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  courseClassCode: string;
  tenQuestions: MG3_QuestionItem[];
  status: 'OPEN' | 'RESOLVED';
  bonusGradeValue: number; // 0.25 điểm quá trình
  submissions: {
    studentId: string;
    studentName: string;
    studentCode: string;
    courseClassCode: string;
    submittedAt: string;
    // SV đoán từng câu có được yêu thích hay không
    guesses: Record<string, boolean>; // questionId -> isPopular
    correctMatchesCount?: number;
    accuracyPercent?: number;
    isQualifiedBonus?: boolean; // Đúng >= 50% (>= 5 câu) -> nhận +0.25 điểm
  }[];
}

// ----------------------------------------------------------------------------
// Minigame 4: Đoán số lượng câu có trong ngân hàng đề (Chỉ Top 3 sớm & chuẩn nhất)
// ----------------------------------------------------------------------------
export interface MG4_Session {
  id: string;
  title: string;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  targetClassCodes: string[];
  currentBankSize: number;
  status: 'OPEN' | 'RESOLVED';
  resolvedBankSize?: number;
  deadline: string;
  rewardPrizes: { rank: number; points: number; title: string }[];
  predictions: {
    studentId: string;
    studentName: string;
    studentCode: string;
    courseClassCode: string;
    predictedSize: number;
    submittedAt: string;
    diff?: number;
    rank?: number;
    isTop3Winner?: boolean;
    pointsAwarded?: number;
  }[];
}

// ----------------------------------------------------------------------------
// Minigame 5: Báo câu lỗi rate 0 sao (Chủ câu bị trừ, người báo cộng lúc gần cuối kỳ)
// ----------------------------------------------------------------------------
export interface MG5_ErrorReport {
  id: string;
  questionId: string;
  questionContent: string;
  subjectName: string;
  subjectCode: string;
  courseClassCode: string;
  // Người phát hiện báo lỗi
  reporterId: string;
  reporterName: string;
  reporterStudentCode: string;
  reporterClass: string;
  rating: 0; // Luôn là rate 0 sao
  errorReason: string; // Lý do báo câu lỗi (sai đáp án, bẫy sai, giải thích sai...)
  reportedAt: string;
  // Người soạn câu hỏi (chủ câu)
  authorId: string;
  authorName: string;
  authorStudentCode: string;
  authorClass: string;
  isQuestionInApprovedBank: boolean; // Câu đó đã được duyệt vào ngân hàng đề chưa
  // Thẩm định của Giảng viên
  teacherAuditStatus: 'PENDING' | 'CONFIRMED_FAULTY' | 'DISMISSED';
  teacherAuditNote?: string;
  penaltyPointsForAuthor: number;     // Bị trừ điểm (ví dụ: -50 điểm)
  bountyPointsForReporter: number;    // Được cộng điểm (ví dụ: +100 điểm)
  // Quy định Slide 3.1: Người báo chỉ được thông báo & cộng điểm lúc gần cuối kỳ
  isReleasedAtEndOfTerm: boolean;
  releasedAt?: string;
}

// ----------------------------------------------------------------------------
// Minigame 6: Dự đoán câu của LLM trong >= 7 câu (Đúng hết + sớm nhất)
// ----------------------------------------------------------------------------
export interface MG6_QuestionItem {
  id: string;
  content: string;
  chapter: string;
  actualOrigin: 'AI' | 'HUMAN'; // Khai báo trung thực của SV khi nộp (ẩn với SV khác)
  aiModel?: string; // e.g. "GPT-4o", "Gemini 1.5 Pro", "Claude 3.5 Sonnet"
}

export interface MG6_Session {
  id: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  targetClassCodes: string[];
  status: 'OPEN' | 'RESOLVED';
  rewardPointsForFastestAllCorrect: number; // Thưởng điểm cho bạn đúng hết và sớm nhất
  questions: MG6_QuestionItem[];           // Tối thiểu 7 câu hỏi
  submissions: {
    studentId: string;
    studentName: string;
    studentCode: string;
    courseClassCode: string;
    submittedAt: string;
    guesses: Record<string, 'AI' | 'HUMAN'>; // questionId -> guessedOrigin
    correctCount?: number;
    totalQuestions?: number;
    isAllCorrect?: boolean;
    isFastestWinner?: boolean;
    pointsAwarded?: number;
  }[];
}
