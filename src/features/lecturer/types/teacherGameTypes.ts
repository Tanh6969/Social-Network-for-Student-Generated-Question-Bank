export type GameMode =
  | 'LIVE_ARENA'          // Đấu trường Kahoot trực tiếp theo thời gian thực
  | 'WEEKLY_QUEST'        // Thử thách tự luyện theo tuần
  | 'PREDICTION_CHALLENGE'// Minigame dự đoán kết quả / mốc chỉ số
  | 'PEER_DUEL';          // Đấu xếp hạng 1vs1 ngẫu nhiên

export type GameStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'RUNNING'
  | 'COMPLETED';

export interface QuestionAnalytics {
  questionIndex: number;
  questionId: string;
  questionText: string;
  chapter: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  options: { id: 'A' | 'B' | 'C' | 'D'; text: string; pickCount: number; pickPercent: number }[];
  correctPercent: number;
  averageTimeSec: number;
  commonMistakePedagogicalNote: string;
}

export interface StudentParticipant {
  id: string;
  studentCode: string;
  fullName: string;
  avatarUrl: string;
  homeClass: string;          // Lớp sinh hoạt (vd: Kỹ thuật máy tính 01-K68)
  courseClassCode: string;    // Lớp tín chỉ (vd: 171146, 171147)
  enrolledSubject: string;    // Môn học đang đăng ký
  rank: number;
  score: number;              // Điểm đấu trường (vd: 8,450 pts)
  gradeScale10: number;       // Điểm quy đổi hệ 10 (vd: 8.5)
  correctAnswersCount: number;
  totalQuestionsCount: number;
  accuracyPercent: number;
  timeSpentSec: number;
  maxStreak: number;
  pointsAwarded: number;
  submittedAt: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'ABSENT';
}

export interface ClassPerformanceComparison {
  courseClassCode: string;
  subjectName: string;
  totalEnrolled: number;
  participatedCount: number;
  participationRate: number;
  averageGrade: number;
  topScore: number;
  weakestChapter: string;
}

export interface TeacherGameRoom {
  id: string;
  title: string;
  description: string;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  targetClassCodes: string[]; // Các lớp học phần được tham gia (vd: ['171146', '171147'] hoặc ['ALL'])
  gameMode: GameMode;
  status: GameStatus;
  joinPin: string;            // Mã PIN 6 số (vd: 839204)
  qrCodeUrl?: string;
  totalQuestions: number;
  timePerQuestionSec: number;
  scoringRule: 'SPEED_ACCURACY' | 'STANDARD' | 'STREAK_BONUS';
  rewardPoints: number;
  rewardBadgeTitle: string;
  createdAt: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  hostName: string;
  totalParticipants: number;
  averageGrade: number;
  averageAccuracyPercent: number;
  isRoomLocked: boolean;
  questionIds: string[];
}
