import {
  MG1_Session,
  MG2_SessionPrediction,
  MG3_Session,
  MG4_Session,
  MG5_ErrorReport,
  MG6_Session,
} from './types/officialMinigames';

const STORAGE_KEY_PREFIX = 'unisocial_official_mg_';

// ============================================================================
// 1. Initial Data for Minigame 1: Đoán số lượng người tham gia đề xuất (±5%)
// ============================================================================
export const INITIAL_MG1: MG1_Session = {
  id: 'mg1_sess_01',
  title: 'Minigame 1: Dự đoán số lượng sinh viên tham gia đề xuất câu hỏi Tuần 9',
  subjectId: 1,
  subjectName: 'Hệ điều hành',
  subjectCode: 'IT3080',
  targetClassCodes: ['171146', '171147'],
  startDate: '2026-10-27T00:00:00Z',
  endDate: '2026-11-03T23:59:59Z',
  currentActualProposers: 340, // Số SV thực tế đã nộp đề xuất tính đến hiện tại
  tolerancePercent: 5,         // Sai số cho phép ±5% (tức từ 323 đến 357)
  rewardPoints: 200,
  status: 'OPEN',
  predictions: [
    {
      studentId: 'sv_01',
      studentName: 'Nguyễn Văn Nam',
      studentCode: '20231102',
      courseClassCode: '171146',
      guessedCount: 345,
      submittedAt: '2026-10-28T09:12:00Z',
    },
    {
      studentId: 'sv_02',
      studentName: 'Lê Thị Thuỳ Dung',
      studentCode: '20231205',
      courseClassCode: '171146',
      guessedCount: 338,
      submittedAt: '2026-10-28T10:45:00Z',
    },
    {
      studentId: 'sv_03',
      studentName: 'Phạm Quang Huy',
      studentCode: '20231340',
      courseClassCode: '171147',
      guessedCount: 352,
      submittedAt: '2026-10-29T14:20:00Z',
    },
    {
      studentId: 'sv_04',
      studentName: 'Hoàng Mai Anh',
      studentCode: '20231456',
      courseClassCode: '171147',
      guessedCount: 390, // Ngoài dải ±5%
      submittedAt: '2026-10-29T16:05:00Z',
    },
    {
      studentId: 'sv_05',
      studentName: 'Trần Minh Quân',
      studentCode: '20231588',
      courseClassCode: '171146',
      guessedCount: 305, // Ngoài dải ±5%
      submittedAt: '2026-10-30T08:30:00Z',
    },
    {
      studentId: 'sv_06',
      studentName: 'Vũ Quốc Khánh',
      studentCode: '20231622',
      courseClassCode: '171147',
      guessedCount: 330,
      submittedAt: '2026-10-30T11:15:00Z',
    },
    {
      studentId: 'sv_07',
      studentName: 'Đặng Thu Trang',
      studentCode: '20231780',
      courseClassCode: '171146',
      guessedCount: 355,
      submittedAt: '2026-10-31T15:40:00Z',
    },
  ],
};

// ============================================================================
// 2. Initial Data for Minigame 2: Đoán tỷ lệ/số lượng câu duyệt của chính mình
// ============================================================================
export const INITIAL_MG2: MG2_SessionPrediction[] = [
  {
    id: 'mg2_pred_01',
    studentId: 'sv_01',
    studentName: 'Nguyễn Văn Nam',
    studentCode: '20231102',
    courseClassCode: '171146',
    subjectName: 'Mạng máy tính',
    sessionId: 'sess_pending_03',
    sessionTitle: 'Trắc nghiệm Phân chia mạng con CIDR & Định tuyến OSPF',
    groupType: 'HUMAN', // Tự làm
    totalQuestionsInSession: 5,
    predictedApprovedCount: 4, // SV đoán mình sẽ được duyệt 4/5 câu
    actualApprovedCount: 4,    // GV thực tế duyệt đúng 4 câu -> ĐOÁN TRÚNG!
    isExact: true,
    pointsAwarded: 150,
    status: 'EVALUATED',
    submittedAt: '2026-10-30T14:00:00Z',
    evaluatedAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'mg2_pred_02',
    studentId: 'sv_02',
    studentName: 'Lê Thị Thuỳ Dung',
    studentCode: '20231205',
    courseClassCode: '171146',
    subjectName: 'Cơ sở dữ liệu',
    sessionId: 'sess_reviewing_01',
    sessionTitle: 'Tối ưu hóa Truy vấn SQL & Chỉ mục B-Tree vs Hash Index',
    groupType: 'AI', // SV khai báo là AI tạo
    totalQuestionsInSession: 4,
    predictedApprovedCount: 3,
    actualApprovedCount: 3,
    isExact: true,
    pointsAwarded: 150,
    status: 'EVALUATED',
    submittedAt: '2026-10-31T09:20:00Z',
    evaluatedAt: '2026-11-01T11:30:00Z',
  },
  {
    id: 'mg2_pred_03',
    studentId: 'sv_03',
    studentName: 'Phạm Quang Huy',
    studentCode: '20231340',
    courseClassCode: '171147',
    subjectName: 'Hệ điều hành',
    sessionId: 'sess_pending_02',
    sessionTitle: 'Cơ chế Bế tắc Deadlock & Thuật toán Banker',
    groupType: 'HUMAN',
    totalQuestionsInSession: 5,
    predictedApprovedCount: 5,
    actualApprovedCount: 4, // Sai lệch 1 câu -> Không chính xác
    isExact: false,
    pointsAwarded: 0,
    status: 'EVALUATED',
    submittedAt: '2026-11-01T16:10:00Z',
    evaluatedAt: '2026-11-02T08:00:00Z',
  },
  {
    id: 'mg2_pred_04',
    studentId: 'sv_04',
    studentName: 'Hoàng Mai Anh',
    studentCode: '20231456',
    courseClassCode: '171147',
    subjectName: 'Hệ điều hành',
    sessionId: 'sess_pending_04',
    sessionTitle: 'Định thời CPU Round Robin & Priority Scheduling',
    groupType: 'AI',
    totalQuestionsInSession: 6,
    predictedApprovedCount: 4,
    status: 'PENDING_REVIEW', // Đang chờ GV duyệt phiên để chốt
    submittedAt: '2026-11-02T10:00:00Z',
  },
];

// ============================================================================
// 3. Initial Data for Minigame 3: Đoán mức độ yêu thích trong 10 câu (Đúng >= 50% được +0.25đ)
// ============================================================================
export const INITIAL_MG3: MG3_Session = {
  id: 'mg3_sess_01',
  title: 'Minigame 3: Dự đoán độ yêu thích của bạn học trong Phiên 10 câu ôn tập CSDL',
  subjectName: 'Cơ sở dữ liệu',
  subjectCode: 'IT3090',
  courseClassCode: '172201',
  status: 'OPEN',
  bonusGradeValue: 0.25,
  tenQuestions: [
    { questionId: 'q_db_01', questionIndex: 1, content: 'Phân biệt chỉ mục Clustered Index và Non-clustered Index trong SQL Server', actualUpvotes: 84, actualRatingAverage: 4.8, isPopular: true },
    { questionId: 'q_db_02', questionIndex: 2, content: 'Điều kiện cần và đủ để một lược đồ quan hệ đạt Chuẩn 3 (3NF)', actualUpvotes: 72, actualRatingAverage: 4.6, isPopular: true },
    { questionId: 'q_db_03', questionIndex: 3, content: 'Mô hình giao dịch ACID: Ý nghĩa của tính Isolation và các mức cô lập', actualUpvotes: 68, actualRatingAverage: 4.5, isPopular: true },
    { questionId: 'q_db_04', questionIndex: 4, content: 'Cách tối ưu truy vấn SELECT khi có biểu thức LIKE %keyword%', actualUpvotes: 91, actualRatingAverage: 4.9, isPopular: true },
    { questionId: 'q_db_05', questionIndex: 5, content: 'Khái niệm Foreign Key và tùy chọn ON DELETE CASCADE hoạt động như thế nào?', actualUpvotes: 65, actualRatingAverage: 4.4, isPopular: true },
    { questionId: 'q_db_06', questionIndex: 6, content: 'Cú pháp chuẩn của câu lệnh CREATE VIEW WITH SCHEMABINDING', actualUpvotes: 24, actualRatingAverage: 3.2, isPopular: false },
    { questionId: 'q_db_07', questionIndex: 7, content: 'Định nghĩa toán tử chia trong đại số quan hệ và ví dụ áp dụng', actualUpvotes: 31, actualRatingAverage: 3.5, isPopular: false },
    { questionId: 'q_db_08', questionIndex: 8, content: 'Bảng băm Hash Index có hỗ trợ tốt cho truy vấn tìm kiếm theo dải (Range scan) không?', actualUpvotes: 38, actualRatingAverage: 3.6, isPopular: false },
    { questionId: 'q_db_09', questionIndex: 9, content: 'Phân loại Trigger DDL và Trigger DML trong quản trị hệ cơ sở dữ liệu', actualUpvotes: 29, actualRatingAverage: 3.3, isPopular: false },
    { questionId: 'q_db_10', questionIndex: 10, content: 'Nguyên lý hoạt động của giải thuật ghi nhật ký trước WAL (Write-Ahead Logging)', actualUpvotes: 42, actualRatingAverage: 3.8, isPopular: false },
  ],
  submissions: [
    {
      studentId: 'sv_01',
      studentName: 'Nguyễn Văn Nam',
      studentCode: '20231102',
      courseClassCode: '172201',
      submittedAt: '2026-10-30T15:20:00Z',
      guesses: {
        q_db_01: true,
        q_db_02: true,
        q_db_03: true,
        q_db_04: true,
        q_db_05: true,
        q_db_06: false,
        q_db_07: false,
        q_db_08: false,
        q_db_09: false,
        q_db_10: false,
      },
      correctMatchesCount: 10,
      accuracyPercent: 100,
      isQualifiedBonus: true, // +0.25đ
    },
    {
      studentId: 'sv_02',
      studentName: 'Lê Thị Thuỳ Dung',
      studentCode: '20231205',
      courseClassCode: '172201',
      submittedAt: '2026-10-31T08:15:00Z',
      guesses: {
        q_db_01: true,
        q_db_02: true,
        q_db_03: true,
        q_db_04: true,
        q_db_05: false,
        q_db_06: false,
        q_db_07: true,
        q_db_08: false,
        q_db_09: false,
        q_db_10: false,
      },
      correctMatchesCount: 8,
      accuracyPercent: 80,
      isQualifiedBonus: true, // +0.25đ
    },
    {
      studentId: 'sv_05',
      studentName: 'Trần Minh Quân',
      studentCode: '20231588',
      courseClassCode: '172201',
      submittedAt: '2026-11-01T11:00:00Z',
      guesses: {
        q_db_01: false,
        q_db_02: false,
        q_db_03: false,
        q_db_04: true,
        q_db_05: true,
        q_db_06: true,
        q_db_07: true,
        q_db_08: true,
        q_db_09: false,
        q_db_10: false,
      },
      correctMatchesCount: 4, // 4/10 < 50% -> Không đạt
      accuracyPercent: 40,
      isQualifiedBonus: false,
    },
  ],
};

// ============================================================================
// 4. Initial Data for Minigame 4: Đoán số lượng câu có trong ngân hàng đề (Top 3 duy nhất)
// ============================================================================
export const INITIAL_MG4: MG4_Session = {
  id: 'mg4_sess_01',
  title: 'Minigame 4: Đoán quy mô Ngân hàng đề thi môn Hệ Điều Hành (Chốt tháng 10)',
  subjectId: 1,
  subjectName: 'Hệ điều hành',
  subjectCode: 'IT3080',
  targetClassCodes: ['171146', '171147'],
  currentBankSize: 1420, // Số câu hỏi thực tế trong ngân hàng hiện tại
  deadline: '2026-11-05T23:59:59Z',
  status: 'OPEN',
  rewardPrizes: [
    { rank: 1, points: 500, title: 'Thủ Khoa Dự Đoán (500 UniPoints)' },
    { rank: 2, points: 300, title: 'Á Khoa Dự Đoán (300 UniPoints)' },
    { rank: 3, points: 200, title: 'Giải Ba Dự Đoán (200 UniPoints)' },
  ],
  predictions: [
    {
      studentId: 'sv_03',
      studentName: 'Phạm Quang Huy',
      studentCode: '20231340',
      courseClassCode: '171147',
      predictedSize: 1422, // Lệch 2 câu - Gửi sớm lúc 09:15
      submittedAt: '2026-10-29T09:15:00Z',
      diff: 2,
      rank: 1,
      isTop3Winner: true,
      pointsAwarded: 500,
    },
    {
      studentId: 'sv_01',
      studentName: 'Nguyễn Văn Nam',
      studentCode: '20231102',
      courseClassCode: '171146',
      predictedSize: 1417, // Lệch 3 câu
      submittedAt: '2026-10-29T10:30:00Z',
      diff: 3,
      rank: 2,
      isTop3Winner: true,
      pointsAwarded: 300,
    },
    {
      studentId: 'sv_02',
      studentName: 'Lê Thị Thuỳ Dung',
      studentCode: '20231205',
      courseClassCode: '171146',
      predictedSize: 1425, // Lệch 5 câu
      submittedAt: '2026-10-30T14:10:00Z',
      diff: 5,
      rank: 3,
      isTop3Winner: true,
      pointsAwarded: 200,
    },
    {
      studentId: 'sv_06',
      studentName: 'Vũ Quốc Khánh',
      studentCode: '20231622',
      courseClassCode: '171147',
      predictedSize: 1430, // Lệch 10 câu -> Không nằm trong Top 3
      submittedAt: '2026-10-30T16:45:00Z',
      diff: 10,
      rank: 4,
      isTop3Winner: false,
      pointsAwarded: 0,
    },
    {
      studentId: 'sv_04',
      studentName: 'Hoàng Mai Anh',
      studentCode: '20231456',
      courseClassCode: '171147',
      predictedSize: 1390,
      submittedAt: '2026-10-31T08:00:00Z',
      diff: 30,
      rank: 5,
      isTop3Winner: false,
      pointsAwarded: 0,
    },
  ],
};

// ============================================================================
// 5. Initial Data for Minigame 5: Báo câu lỗi rate 0 sao (Chủ câu bị trừ, người báo cộng lúc cuối kỳ)
// ============================================================================
export const INITIAL_MG5: MG5_ErrorReport[] = [
  {
    id: 'mg5_rep_01',
    questionId: 'q_db_07',
    questionContent: 'Định nghĩa toán tử chia trong đại số quan hệ: Kết quả có chứa các thuộc tính của quan hệ bị chia hay không?',
    subjectName: 'Cơ sở dữ liệu',
    subjectCode: 'IT3090',
    courseClassCode: '172201',
    reporterId: 'sv_01',
    reporterName: 'Nguyễn Văn Nam',
    reporterStudentCode: '20231102',
    reporterClass: 'Khoa học máy tính 01-K68',
    rating: 0,
    errorReason: 'Đáp án đúng ghi A (R - S) nhưng phần giải thích lại chứng minh là đáp án C (R ÷ S). Đề bị mâu thuẫn giữa key và explanation.',
    reportedAt: '2026-10-25T14:30:00Z',
    authorId: 'sv_05',
    authorName: 'Trần Minh Quân',
    authorStudentCode: '20231588',
    authorClass: 'Khoa học máy tính 02-K68',
    isQuestionInApprovedBank: true, // Câu này đã được duyệt vào ngân hàng đề
    teacherAuditStatus: 'CONFIRMED_FAULTY', // GV đã thẩm định và xác nhận câu lỗi thật
    teacherAuditNote: 'Xác nhận câu hỏi bị nhầm lẫn giữa đáp án A và C. Đã chuyển trạng thái câu hỏi về NEED_EDIT.',
    penaltyPointsForAuthor: -50,    // Trừ 50 điểm của chủ câu
    bountyPointsForReporter: 100,   // Cộng 100 điểm thưởng săn lỗi cho người báo
    isReleasedAtEndOfTerm: false,   // CHƯA CÔNG BỐ - Tạm giữ đến gần cuối kỳ theo đặc tả Slide 3.1
  },
  {
    id: 'mg5_rep_02',
    questionId: 'q_net_04',
    questionContent: 'Cờ SYN và ACK trong quá trình bắt tay 3 bước TCP có kích thước bao nhiêu bit trong header?',
    subjectName: 'Mạng máy tính',
    subjectCode: 'IT3070',
    courseClassCode: '173301',
    reporterId: 'sv_02',
    reporterName: 'Lê Thị Thuỳ Dung',
    reporterStudentCode: '20231205',
    reporterClass: 'Khoa học máy tính 01-K68',
    rating: 0,
    errorReason: 'Đáp án trắc nghiệm ghi là 1 Byte (8 bits), nhưng chuẩn RFC 793 quy định cờ SYN và ACK chỉ là 1 bit cờ hiệu duy nhất.',
    reportedAt: '2026-10-28T09:15:00Z',
    authorId: 'sv_03',
    authorName: 'Phạm Quang Huy',
    authorStudentCode: '20231340',
    authorClass: 'Kỹ thuật máy tính 01-K68',
    isQuestionInApprovedBank: true,
    teacherAuditStatus: 'CONFIRMED_FAULTY',
    teacherAuditNote: 'Báo cáo rất chuẩn xác. TCP control flags chỉ gồm 1 bit mỗi cờ.',
    penaltyPointsForAuthor: -50,
    bountyPointsForReporter: 100,
    isReleasedAtEndOfTerm: false, // Tạm giữ đến gần cuối kỳ
  },
  {
    id: 'mg5_rep_03',
    questionId: 'q_os_09',
    questionContent: 'Thuật toán Banker có giải quyết được hoàn toàn tình trạng Starvation trong Hệ điều hành hay không?',
    subjectName: 'Hệ điều hành',
    subjectCode: 'IT3080',
    courseClassCode: '171146',
    reporterId: 'sv_04',
    reporterName: 'Hoàng Mai Anh',
    reporterStudentCode: '20231456',
    reporterClass: 'Khoa học máy tính 02-K68',
    rating: 0,
    errorReason: 'Câu hỏi có đáp án không rõ ràng giữa Deadlock và Starvation.',
    reportedAt: '2026-11-01T11:20:00Z',
    authorId: 'sv_01',
    authorName: 'Nguyễn Văn Nam',
    authorStudentCode: '20231102',
    authorClass: 'Khoa học máy tính 01-K68',
    isQuestionInApprovedBank: false, // Câu chưa được duyệt vào ngân hàng đề
    teacherAuditStatus: 'PENDING',  // Đang chờ Giảng viên thẩm định
    penaltyPointsForAuthor: 0,
    bountyPointsForReporter: 0,
    isReleasedAtEndOfTerm: false,
  },
];

// ============================================================================
// 6. Initial Data for Minigame 6: Dự đoán câu của LLM (>= 7 câu)
// ============================================================================
export const INITIAL_MG6: MG6_Session = {
  id: 'mg6_sess_01',
  title: 'Minigame 6: Đấu trường Phân biệt Câu hỏi Tự làm vs LLM tạo (Turing Test)',
  subjectName: 'Hệ điều hành',
  subjectCode: 'IT3080',
  targetClassCodes: ['171146', '171147'],
  status: 'OPEN',
  rewardPointsForFastestAllCorrect: 350,
  questions: [
    {
      id: 'q_turing_01',
      chapter: 'Chương 3: Lập lịch CPU',
      content: 'Trong một hệ thống nhúng thời gian thực sử dụng thuật toán Rate-Monotonic Scheduling (RMS), nếu tổng độ chiếm dụng CPU U = 0.75 với 3 tiến trình, hệ thống có đảm bảo đáp ứng mọi deadline không?',
      actualOrigin: 'HUMAN', // Tự làm
    },
    {
      id: 'q_turing_02',
      chapter: 'Chương 4: Quản lý Bộ nhớ',
      content: 'Giải thích hiện tượng Belady Anomaly và nêu ví dụ chuỗi tham chiếu trang (Page Reference String) làm tăng số lượng Page Fault khi tăng số Frame bộ nhớ trong thuật toán FIFO.',
      actualOrigin: 'AI', // LLM tạo (Prompt: Tạo câu hỏi bẫy về Belady anomaly)
      aiModel: 'GPT-4o',
    },
    {
      id: 'q_turing_03',
      chapter: 'Chương 5: Bế tắc Deadlock',
      content: 'Cho ma trận Allocation và Max của 4 tiến trình P0-P3 và 3 loại tài nguyên R1-R3. Trình bày vector Available tối thiểu để hệ thống đạt trạng thái an toàn (Safe State).',
      actualOrigin: 'HUMAN',
    },
    {
      id: 'q_turing_04',
      chapter: 'Chương 2: Tiến trình & Luồng',
      content: 'So sánh chi phí chuyển ngữ cảnh (Context Switching) giữa Kernel-Level Thread (KLT) và User-Level Thread (ULT) thông qua cấu trúc PCB và TCB.',
      actualOrigin: 'AI',
      aiModel: 'Claude 3.5 Sonnet',
    },
    {
      id: 'q_turing_05',
      chapter: 'Chương 4: Bộ nhớ ảo',
      content: 'Thuật toán thay thế trang Clock (Second Chance) sử dụng bit Reference như thế nào để xấp xỉ thuật toán tối ưu LRU?',
      actualOrigin: 'HUMAN',
    },
    {
      id: 'q_turing_06',
      chapter: 'Chương 6: Hệ thống File',
      content: 'Cấu trúc inode trong hệ thống tập tin UNIX/Linux hỗ trợ quản lý tập tin có kích thước tối đa bao nhiêu khi sử dụng 12 con trỏ trực tiếp, 1 gián tiếp đơn, 1 gián tiếp kép và 1 gián tiếp tam?',
      actualOrigin: 'AI',
      aiModel: 'Gemini 1.5 Pro',
    },
    {
      id: 'q_turing_07',
      chapter: 'Chương 5: Bế tắc Deadlock',
      content: 'Tại sao việc đánh số thứ tự tài nguyên và bắt buộc tiến trình phải xin cấp phát theo thứ tự tăng dần lại phá vỡ được điều kiện Circular Wait?',
      actualOrigin: 'HUMAN',
    },
  ],
  submissions: [
    {
      studentId: 'sv_01',
      studentName: 'Nguyễn Văn Nam',
      studentCode: '20231102',
      courseClassCode: '171146',
      submittedAt: '2026-10-31T09:05:12Z', // Nộp sớm nhất
      guesses: {
        q_turing_01: 'HUMAN',
        q_turing_02: 'AI',
        q_turing_03: 'HUMAN',
        q_turing_04: 'AI',
        q_turing_05: 'HUMAN',
        q_turing_06: 'AI',
        q_turing_07: 'HUMAN',
      },
      correctCount: 7,
      totalQuestions: 7,
      isAllCorrect: true,     // Đúng 7/7 câu
      isFastestWinner: true,  // Đúng hết và nộp sớm nhất -> CHIẾN THẮNG
      pointsAwarded: 350,
    },
    {
      studentId: 'sv_02',
      studentName: 'Lê Thị Thuỳ Dung',
      studentCode: '20231205',
      courseClassCode: '171146',
      submittedAt: '2026-10-31T09:18:40Z',
      guesses: {
        q_turing_01: 'HUMAN',
        q_turing_02: 'AI',
        q_turing_03: 'HUMAN',
        q_turing_04: 'HUMAN', // Sai câu 4
        q_turing_05: 'HUMAN',
        q_turing_06: 'AI',
        q_turing_07: 'HUMAN',
      },
      correctCount: 6,
      totalQuestions: 7,
      isAllCorrect: false,
      isFastestWinner: false,
      pointsAwarded: 0,
    },
    {
      studentId: 'sv_03',
      studentName: 'Phạm Quang Huy',
      studentCode: '20231340',
      courseClassCode: '171147',
      submittedAt: '2026-10-31T10:12:05Z',
      guesses: {
        q_turing_01: 'HUMAN',
        q_turing_02: 'AI',
        q_turing_03: 'HUMAN',
        q_turing_04: 'AI',
        q_turing_05: 'HUMAN',
        q_turing_06: 'AI',
        q_turing_07: 'HUMAN',
      },
      correctCount: 7,
      totalQuestions: 7,
      isAllCorrect: true, // Đúng 7/7 nhưng nộp sau Nam -> Không phải Fastest
      isFastestWinner: false,
      pointsAwarded: 50,
    },
  ],
};

// ============================================================================
// Storage & State Helpers
// ============================================================================

export function loadMG1(): MG1_Session {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}1`);
    return raw ? JSON.parse(raw) : INITIAL_MG1;
  } catch {
    return INITIAL_MG1;
  }
}
export function saveMG1(data: MG1_Session): void {
  try { localStorage.setItem(`${STORAGE_KEY_PREFIX}1`, JSON.stringify(data)); } catch {}
}

export function loadMG2(): MG2_SessionPrediction[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}2`);
    return raw ? JSON.parse(raw) : INITIAL_MG2;
  } catch {
    return INITIAL_MG2;
  }
}
export function saveMG2(data: MG2_SessionPrediction[]): void {
  try { localStorage.setItem(`${STORAGE_KEY_PREFIX}2`, JSON.stringify(data)); } catch {}
}

export function loadMG3(): MG3_Session {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}3`);
    return raw ? JSON.parse(raw) : INITIAL_MG3;
  } catch {
    return INITIAL_MG3;
  }
}
export function saveMG3(data: MG3_Session): void {
  try { localStorage.setItem(`${STORAGE_KEY_PREFIX}3`, JSON.stringify(data)); } catch {}
}

export function loadMG4(): MG4_Session {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}4`);
    return raw ? JSON.parse(raw) : INITIAL_MG4;
  } catch {
    return INITIAL_MG4;
  }
}
export function saveMG4(data: MG4_Session): void {
  try { localStorage.setItem(`${STORAGE_KEY_PREFIX}4`, JSON.stringify(data)); } catch {}
}

export function loadMG5(): MG5_ErrorReport[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}5`);
    return raw ? JSON.parse(raw) : INITIAL_MG5;
  } catch {
    return INITIAL_MG5;
  }
}
export function saveMG5(data: MG5_ErrorReport[]): void {
  try { localStorage.setItem(`${STORAGE_KEY_PREFIX}5`, JSON.stringify(data)); } catch {}
}

export function loadMG6(): MG6_Session {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}6`);
    return raw ? JSON.parse(raw) : INITIAL_MG6;
  } catch {
    return INITIAL_MG6;
  }
}
export function saveMG6(data: MG6_Session): void {
  try { localStorage.setItem(`${STORAGE_KEY_PREFIX}6`, JSON.stringify(data)); } catch {}
}

// ============================================================================
// Operation & Resolution Handlers
// ============================================================================

/**
 * Minigame 1: Chốt kết quả đoán số người đề xuất trong khung thời gian (sai số ±5%)
 */
export function resolveMG1(session: MG1_Session, actualCount: number): MG1_Session {
  const tolerance = session.tolerancePercent / 100; // 0.05
  const minAllowed = actualCount * (1 - tolerance);
  const maxAllowed = actualCount * (1 + tolerance);

  const updatedPredictions = session.predictions.map((p) => {
    const diff = Math.abs(p.guessedCount - actualCount);
    const errPct = Number(((diff / actualCount) * 100).toFixed(2));
    const isWinner = p.guessedCount >= minAllowed && p.guessedCount <= maxAllowed;
    return {
      ...p,
      diffFromActual: diff,
      errorPercent: errPct,
      isWinner,
    };
  });

  const updated: MG1_Session = {
    ...session,
    status: 'RESOLVED',
    resolvedActualCount: actualCount,
    predictions: updatedPredictions,
  };
  saveMG1(updated);
  return updated;
}

/**
 * Minigame 4: Chốt ngân hàng đề và chọn Top 3 sinh viên đoán chính xác & sớm nhất
 */
export function resolveMG4(session: MG4_Session, finalBankSize: number): MG4_Session {
  const sorted = [...session.predictions].map((p) => ({
    ...p,
    diff: Math.abs(p.predictedSize - finalBankSize),
  })).sort((a, b) => {
    if (a.diff !== b.diff) return a.diff - b.diff; // Càng gần càng tốt
    return Date.parse(a.submittedAt) - Date.parse(b.submittedAt); // Sớm hơn thắng
  });

  const ranked = sorted.map((p, idx) => {
    const rank = idx + 1;
    const isTop3 = rank <= 3;
    const points = isTop3 ? (session.rewardPrizes.find((r) => r.rank === rank)?.points ?? 100) : 0;
    return {
      ...p,
      rank,
      isTop3Winner: isTop3,
      pointsAwarded: points,
    };
  });

  const updated: MG4_Session = {
    ...session,
    status: 'RESOLVED',
    resolvedBankSize: finalBankSize,
    predictions: ranked,
  };
  saveMG4(updated);
  return updated;
}

/**
 * Minigame 5: Giảng viên thẩm định câu lỗi rate 0 sao
 */
export function auditMG5Report(
  reportId: string,
  isConfirmed: boolean,
  teacherNote: string,
): MG5_ErrorReport[] {
  const list = loadMG5();
  const updated = list.map((item) => {
    if (item.id !== reportId) return item;
    if (isConfirmed) {
      return {
        ...item,
        teacherAuditStatus: 'CONFIRMED_FAULTY' as const,
        teacherAuditNote: teacherNote,
        penaltyPointsForAuthor: -50,
        bountyPointsForReporter: 100,
      };
    }
    return {
      ...item,
      teacherAuditStatus: 'DISMISSED' as const,
      teacherAuditNote: teacherNote,
      penaltyPointsForAuthor: 0,
      bountyPointsForReporter: 0,
    };
  });
  saveMG5(updated);
  return updated;
}

/**
 * Minigame 5: Kích hoạt công bố & trao điểm thưởng cho người báo lỗi vào GẦN CUỐI KỲ
 * (Đúng theo quy định Slide 3.1: Người báo lỗi chỉ được thông báo & cộng điểm lúc gần cuối kỳ)
 */
export function releaseMG5EndOfTermBounty(): { updatedList: MG5_ErrorReport[]; releasedCount: number } {
  const list = loadMG5();
  let count = 0;
  const updatedList = list.map((item) => {
    if (item.teacherAuditStatus === 'CONFIRMED_FAULTY' && !item.isReleasedAtEndOfTerm) {
      count++;
      return {
        ...item,
        isReleasedAtEndOfTerm: true,
        releasedAt: new Date().toISOString(),
      };
    }
    return item;
  });
  saveMG5(updatedList);
  return { updatedList, releasedCount: count };
}

/**
 * Utility: Xuất danh sách kết quả Minigame bất kỳ sang CSV
 */
export function exportOfficialMinigameToCSV(
  minigameName: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${minigameName}_KetQua_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
