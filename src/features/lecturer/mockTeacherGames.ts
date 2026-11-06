import { TeacherGameRoom, StudentParticipant, QuestionAnalytics, ClassPerformanceComparison } from './types/teacherGameTypes';
import { MOCK_SUBJECTS, MOCK_COURSE_CLASSES } from './mockExamData';

const STORAGE_KEY = 'unisocial_teacher_games_v1';

export const INITIAL_TEACHER_GAMES: TeacherGameRoom[] = [
  {
    id: 'game_room_01',
    title: 'Đấu trường Live: Giải mã Deadlock & Định thời CPU',
    description: 'Tranh tài trực tiếp trong tiết bài tập: Nhận diện 4 điều kiện Coffman, thuật toán Banker và phân biệt Preemptive vs Non-preemptive.',
    subjectId: 1,
    subjectName: 'Hệ điều hành',
    subjectCode: 'IT3080',
    targetClassCodes: ['171146', '171147'],
    gameMode: 'LIVE_ARENA',
    status: 'RUNNING',
    joinPin: '839204',
    totalQuestions: 10,
    timePerQuestionSec: 25,
    scoringRule: 'SPEED_ACCURACY',
    rewardPoints: 300,
    rewardBadgeTitle: 'Chiến thần Hệ Điều Hành K68',
    createdAt: '2026-11-02T08:30:00Z',
    startedAt: '2026-11-02T14:15:00Z',
    hostName: 'TS. Trần Minh Đức',
    totalParticipants: 78,
    averageGrade: 7.9,
    averageAccuracyPercent: 78.5,
    isRoomLocked: false,
    questionIds: ['q_09', 'q_10'],
  },
  {
    id: 'game_room_02',
    title: 'Thử thách Tuần 9: Phân chia mạng con CIDR & Giao thức TCP/UDP',
    description: 'Bài tập gamification tự luyện: Tính toán dải IP khả dụng, subnet mask và cơ chế bắt tay 3 bước 3-Way Handshake.',
    subjectId: 3,
    subjectName: 'Mạng máy tính',
    subjectCode: 'IT3070',
    targetClassCodes: ['173301'],
    gameMode: 'WEEKLY_QUEST',
    status: 'SCHEDULED',
    joinPin: '521908',
    totalQuestions: 15,
    timePerQuestionSec: 45,
    scoringRule: 'STANDARD',
    rewardPoints: 250,
    rewardBadgeTitle: 'Bậc thầy Mạng Máy Tính',
    createdAt: '2026-11-01T10:00:00Z',
    scheduledAt: '2026-11-05T19:00:00Z',
    hostName: 'TS. Trần Minh Đức',
    totalParticipants: 64,
    averageGrade: 8.3,
    averageAccuracyPercent: 82.0,
    isRoomLocked: false,
    questionIds: ['q_01', 'q_02'],
  },
  {
    id: 'game_room_03',
    title: 'Đấu trường Cơ sở Dữ liệu: Tối ưu Truy vấn SQL & Chuẩn hoá 3NF',
    description: 'Kiểm tra nhanh mức độ nắm vững thiết kế lược đồ quan hệ, phân biệt B-Tree index và Hash index.',
    subjectId: 2,
    subjectName: 'Cơ sở dữ liệu',
    subjectCode: 'IT3090',
    targetClassCodes: ['172201'],
    gameMode: 'LIVE_ARENA',
    status: 'COMPLETED',
    joinPin: '914372',
    totalQuestions: 12,
    timePerQuestionSec: 30,
    scoringRule: 'SPEED_ACCURACY',
    rewardPoints: 350,
    rewardBadgeTitle: 'Kiện tướng Cơ Sở Dữ Liệu',
    createdAt: '2026-10-28T09:00:00Z',
    startedAt: '2026-10-29T10:00:00Z',
    endedAt: '2026-10-29T10:45:00Z',
    hostName: 'TS. Trần Minh Đức',
    totalParticipants: 72,
    averageGrade: 8.4,
    averageAccuracyPercent: 84.2,
    isRoomLocked: true,
    questionIds: ['q_03', 'q_04'],
  },
  {
    id: 'game_room_04',
    title: 'Đấu hạng 1vs1: Đột phá Cấu trúc Dữ liệu AVL & Đồ thị Dijkstra',
    description: 'Chế độ ghép cặp sinh viên ngẫu nhiên cùng môn học thi đấu tốc độ giải mã cây cân bằng.',
    subjectId: 4,
    subjectName: 'Cấu trúc dữ liệu và giải thuật',
    subjectCode: 'IT3001',
    targetClassCodes: ['174401'],
    gameMode: 'PEER_DUEL',
    status: 'SCHEDULED',
    joinPin: '403816',
    totalQuestions: 8,
    timePerQuestionSec: 20,
    scoringRule: 'STREAK_BONUS',
    rewardPoints: 200,
    rewardBadgeTitle: 'Kỳ thủ Thuật Toán',
    createdAt: '2026-11-02T11:00:00Z',
    scheduledAt: '2026-11-06T15:30:00Z',
    hostName: 'TS. Trần Minh Đức',
    totalParticipants: 80,
    averageGrade: 7.2,
    averageAccuracyPercent: 71.5,
    isRoomLocked: false,
    questionIds: ['q_02'],
  },
];

export function loadStoredTeacherGames(): TeacherGameRoom[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TEACHER_GAMES));
      return INITIAL_TEACHER_GAMES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TEACHER_GAMES;
  }
}

export function saveStoredTeacherGames(games: TeacherGameRoom[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch {
    // Ignore storage errors in sandbox
  }
}

// Generate realistic student participants for a specific game room
export function getParticipantsForGame(gameId: string): StudentParticipant[] {
  const games = loadStoredTeacherGames();
  const game = games.find((g) => g.id === gameId) ?? INITIAL_TEACHER_GAMES[0];

  const firstNames = ['An', 'Bình', 'Dung', 'Hà', 'Huy', 'Khánh', 'Linh', 'Nam', 'Phúc', 'Quân', 'Trang', 'Tú', 'Vy', 'Long', 'Đức', 'Phương', 'Bảo', 'Thịnh', 'Giang', 'Thảo'];
  const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô'];
  const middleNames = ['Văn', 'Thị', 'Minh', 'Quang', 'Thu', 'Đức', 'Ngọc', 'Hải', 'Thanh', 'Quốc'];

  const homeClasses = [
    'Khoa học máy tính 01-K68',
    'Khoa học máy tính 02-K68',
    'Kỹ thuật máy tính 01-K68',
    'Kỹ thuật phần mềm 02-K68',
    'Khoa học dữ liệu 01-K68',
  ];

  const targetClasses = game.targetClassCodes.length > 0 && !game.targetClassCodes.includes('ALL')
    ? game.targetClassCodes
    : ['171146', '171147', '172201'];

  const seed = game.joinPin ? parseInt(game.joinPin, 10) : 123456;
  const count = game.totalParticipants || 45;

  const list: StudentParticipant[] = Array.from({ length: count }, (_, i) => {
    const fnIdx = (seed + i * 3) % firstNames.length;
    const lnIdx = (seed + i * 7) % lastNames.length;
    const mnIdx = (seed + i * 5) % middleNames.length;
    const fullName = `${lastNames[lnIdx]} ${middleNames[mnIdx]} ${firstNames[fnIdx]}`;
    const studentCode = `2023${String((seed * 17 + i * 31) % 9000 + 1000)}`;
    const classCode = targetClasses[i % targetClasses.length];
    const homeClass = homeClasses[i % homeClasses.length];

    // High performance bias for top ranks
    const totalQ = game.totalQuestions;
    const correctCount = Math.max(1, Math.min(totalQ, totalQ - Math.floor(Math.pow((i / count), 1.5) * (totalQ * 0.7))));
    const accuracy = Math.round((correctCount / totalQ) * 100);
    const score = Math.round(correctCount * 800 + (totalQ - correctCount) * 100 + (count - i) * 25);
    const grade10 = Number(((correctCount / totalQ) * 10).toFixed(1));
    const timeSpent = 120 + Math.floor((i * 18 + (seed % 60)));
    const maxStreak = Math.min(correctCount, Math.floor(correctCount * 0.8) + (i < 5 ? 2 : 0));
    const pointsAwarded = Math.round((correctCount / totalQ) * game.rewardPoints);

    return {
      id: `part_${gameId}_${i + 1}`,
      studentCode,
      fullName,
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + (i * 1000) % 99999}?auto=format&fit=crop&w=150&q=80`,
      homeClass,
      courseClassCode: classCode,
      enrolledSubject: game.subjectName,
      rank: i + 1,
      score,
      gradeScale10: grade10,
      correctAnswersCount: correctCount,
      totalQuestionsCount: totalQ,
      accuracyPercent: accuracy,
      timeSpentSec: timeSpent,
      maxStreak,
      pointsAwarded,
      submittedAt: new Date(Date.now() - (count - i) * 60_000).toISOString(),
      status: 'COMPLETED',
    };
  });

  return list.sort((a, b) => b.score - a.score).map((item, idx) => ({ ...item, rank: idx + 1 }));
}

// Question analytics data for pedagogical feedback
export function getQuestionAnalyticsForGame(gameId: string): QuestionAnalytics[] {
  return [
    {
      questionIndex: 1,
      questionId: 'q_09',
      questionText: 'Trong Hệ điều hành, để Deadlock (bế tắc) xảy ra, bắt buộc phải thỏa mãn đồng thời 4 điều kiện Coffman nào?',
      chapter: 'Chương 5: Bế tắc (Deadlock)',
      difficulty: 'MEDIUM',
      correctAnswer: 'A',
      options: [
        { id: 'A', text: 'Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait', pickCount: 62, pickPercent: 79.5 },
        { id: 'B', text: 'Starvation, Race Condition, Deadlock, Critical Section', pickCount: 8, pickPercent: 10.3 },
        { id: 'C', text: 'Bảo vệ bộ nhớ, Tranh chấp tài nguyên, Đa nhiệm, Tắc nghẽn', pickCount: 5, pickPercent: 6.4 },
        { id: 'D', text: 'Semaphore, Mutex, Monitor, Spinlock', pickCount: 3, pickPercent: 3.8 },
      ],
      correctPercent: 79.5,
      averageTimeSec: 14.2,
      commonMistakePedagogicalNote: 'Đa số sinh viên nhớ tốt 4 điều kiện Coffman. Một số ít nhầm lẫn với các cơ chế đồng bộ (Semaphore/Mutex).',
    },
    {
      questionIndex: 2,
      questionId: 'q_10',
      questionText: 'Thuật toán Banker (Nhà ngân hàng của Dijkstra) được áp dụng trong chiến lược nào để xử lý Deadlock?',
      chapter: 'Chương 5: Bế tắc (Deadlock)',
      difficulty: 'HARD',
      correctAnswer: 'B',
      options: [
        { id: 'A', text: 'Ngăn ngừa bế tắc (Deadlock Prevention)', pickCount: 22, pickPercent: 28.2 },
        { id: 'B', text: 'Tránh bế tắc (Deadlock Avoidance) bằng kiểm tra trạng thái an toàn', pickCount: 41, pickPercent: 52.6 },
        { id: 'C', text: 'Phát hiện và phục hồi bế tắc (Deadlock Detection & Recovery)', pickCount: 11, pickPercent: 14.1 },
        { id: 'D', text: 'Bỏ qua bế tắc (Thuật toán Ostrich)', pickCount: 4, pickPercent: 5.1 },
      ],
      correctPercent: 52.6,
      averageTimeSec: 21.8,
      commonMistakePedagogicalNote: '28.2% sinh viên nhầm giữa Prevention (phá vỡ 4 điều kiện) và Avoidance (mô phỏng Safe State qua thuật toán Banker). Cần nhắc lại đồ thị phân cấp tài nguyên trên lớp.',
    },
    {
      questionIndex: 3,
      questionId: 'q_03',
      questionText: 'Trong thuật toán định thời CPU Round Robin (RR), nếu thời lượng Time Quantum q quá lớn (tiến tới vô cùng) thì thuật toán sẽ hành xử giống thuật toán nào?',
      chapter: 'Chương 3: Lập lịch CPU',
      difficulty: 'MEDIUM',
      correctAnswer: 'C',
      options: [
        { id: 'A', text: 'SJF (Shortest Job First)', pickCount: 6, pickPercent: 7.7 },
        { id: 'B', text: 'Priority Scheduling (Định thời ưu tiên)', pickCount: 4, pickPercent: 5.1 },
        { id: 'C', text: 'FCFS (First-Come, First-Served)', pickCount: 65, pickPercent: 83.3 },
        { id: 'D', text: 'SRTF (Shortest Remaining Time First)', pickCount: 3, pickPercent: 3.8 },
      ],
      correctPercent: 83.3,
      averageTimeSec: 11.5,
      commonMistakePedagogicalNote: 'Khái niệm Time Quantum được lớp nắm rất vững. Tỉ lệ chọn FCFS đạt trên 83%.',
    },
    {
      questionIndex: 4,
      questionId: 'q_04',
      questionText: 'Sự khác biệt cốt lõi giữa cơ chế Mutex (Mutual Exclusion) và Binary Semaphore là gì?',
      chapter: 'Chương 4: Đồng bộ tiến trình',
      difficulty: 'HARD',
      correctAnswer: 'A',
      options: [
        { id: 'A', text: 'Mutex có khái niệm Ownership (chỉ thread lock mới được unlock), Semaphore thì không', pickCount: 36, pickPercent: 46.2 },
        { id: 'B', text: 'Semaphore chỉ có giá trị 0 và 1, Mutex có thể nhận giá trị nguyên âm', pickCount: 24, pickPercent: 30.8 },
        { id: 'C', text: 'Mutex áp dụng cho mạng, Semaphore áp dụng cho CPU', pickCount: 4, pickPercent: 5.1 },
        { id: 'D', text: 'Không có điểm khác biệt nào, hai thuật ngữ hoàn toàn tương đương', pickCount: 14, pickPercent: 17.9 },
      ],
      correctPercent: 46.2,
      averageTimeSec: 24.1,
      commonMistakePedagogicalNote: 'Điểm bẫy lớn nhất: 30.8% chọn nhầm vì nghĩ Binary Semaphore giống hệt Mutex. Cần nhấn mạnh tính chất Ownership và Priority Inversion.',
    },
  ];
}

// Class performance comparison
export function getClassComparisonsForGame(game: TeacherGameRoom): ClassPerformanceComparison[] {
  const classes = MOCK_COURSE_CLASSES.filter(
    (c) =>
      c.class_code &&
      (game.targetClassCodes.includes('ALL') || game.targetClassCodes.includes(c.class_code)),
  );

  return classes.map((c, idx) => {
    const totalEnrolled = c.total_students ?? 60;
    const participated = Math.round(totalEnrolled * (0.88 + idx * 0.04));
    const avgGrade = Number((7.8 + (idx % 3) * 0.4).toFixed(1));
    const topScore = idx === 0 ? 10.0 : 9.8;
    const weakestChapter = idx === 0 ? 'Bế tắc & Thuật toán Banker' : 'Đồng bộ Mutex vs Semaphore';

    return {
      courseClassCode: c.class_code ?? 'Lớp',
      subjectName: c.subject_name ?? game.subjectName,
      totalEnrolled,
      participatedCount: Math.min(participated, totalEnrolled),
      participationRate: Math.round((participated / totalEnrolled) * 100),
      averageGrade: avgGrade,
      topScore,
      weakestChapter,
    };
  });
}

// Generate CSV data for download
export function exportGameRosterToCSV(game: TeacherGameRoom, participants: StudentParticipant[]): void {
  const headers = [
    'STT',
    'Mã Sinh Viên',
    'Họ và Tên',
    'Lớp Tín Chỉ',
    'Lớp Sinh Hoạt',
    'Môn Học',
    'Hạng Đấu',
    'Điểm Trắc Nghiệm',
    'Số Câu Đúng',
    'Tổng Câu',
    'Tỉ Lệ Đúng (%)',
    'Điểm Hệ 10',
    'Thời Gian (giây)',
    'Điểm Thưởng UniPoints',
    'Trạng Thái',
    'Thời Gian Nộp',
  ];

  const rows = participants.map((p, index) => [
    index + 1,
    p.studentCode,
    `"${p.fullName}"`,
    p.courseClassCode,
    `"${p.homeClass}"`,
    `"${p.enrolledSubject}"`,
    p.rank,
    p.score,
    p.correctAnswersCount,
    p.totalQuestionsCount,
    `${p.accuracyPercent}%`,
    p.gradeScale10.toFixed(1),
    p.timeSpentSec,
    p.pointsAwarded,
    p.status,
    `"${new Date(p.submittedAt).toLocaleString('vi-VN')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `BangDiem_${game.subjectCode}_Lop_${game.targetClassCodes.join('-')}_${game.id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
