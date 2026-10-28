import {
  ExamItem,
  ExamDetailResponse,
  SubjectResponse,
  CourseClassResponse,
  GenerateExamRequest,
  ExportResponse,
} from '../../api';

export const MOCK_SUBJECTS: SubjectResponse[] = [
  { subject_id: 1, name: 'Hệ điều hành', code: 'IT3080' },
  { subject_id: 2, name: 'Cơ sở dữ liệu', code: 'IT3090' },
  { subject_id: 3, name: 'Mạng máy tính', code: 'IT3070' },
  { subject_id: 4, name: 'Cấu trúc dữ liệu và giải thuật', code: 'IT3001' },
  { subject_id: 5, name: 'Trí tuệ nhân tạo', code: 'IT3160' },
  { subject_id: 6, name: 'Lập trình hướng đối tượng', code: 'IT3100' },
  { subject_id: 7, name: 'An toàn thông tin', code: 'IT4010' },
  { subject_id: 8, name: 'Nhập môn Công nghệ phần mềm', code: 'IT3180' },
];

export const MOCK_COURSE_CLASSES: CourseClassResponse[] = [
  {
    course_class_id: 101,
    class_code: '171146',
    subject_id: 1,
    subject_code: 'IT3080',
    subject_name: 'Hệ điều hành',
    semester_name: 'Học kỳ 2026.1',
    total_students: 65,
  },
  {
    course_class_id: 102,
    class_code: '171147',
    subject_id: 1,
    subject_code: 'IT3080',
    subject_name: 'Hệ điều hành',
    semester_name: 'Học kỳ 2026.1',
    total_students: 58,
  },
  {
    course_class_id: 201,
    class_code: '172201',
    subject_id: 2,
    subject_code: 'IT3090',
    subject_name: 'Cơ sở dữ liệu',
    semester_name: 'Học kỳ 2026.1',
    total_students: 72,
  },
  {
    course_class_id: 301,
    class_code: '173301',
    subject_id: 3,
    subject_code: 'IT3070',
    subject_name: 'Mạng máy tính',
    semester_name: 'Học kỳ 2026.1',
    total_students: 64,
  },
  {
    course_class_id: 401,
    class_code: '174401',
    subject_id: 4,
    subject_code: 'IT3001',
    subject_name: 'Cấu trúc dữ liệu và giải thuật',
    semester_name: 'Học kỳ 2026.1',
    total_students: 80,
  },
];

export const INITIAL_MOCK_EXAMS: ExamItem[] = [
  {
    exam_id: 1001,
    title: 'Đề thi Giữa kỳ Hệ điều hành - Ca sáng 2026.1',
    subject_name: 'Hệ điều hành',
    question_count: 40,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    statistic: {
      easy_count: 12,
      medium_count: 20,
      hard_count: 8,
      unclassified_count: 0,
    },
    download_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    exam_id: 1002,
    title: 'Đề thi Kết thúc học phần Cơ sở dữ liệu - Đề chẵn',
    subject_name: 'Cơ sở dữ liệu',
    question_count: 30,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    statistic: {
      easy_count: 10,
      medium_count: 15,
      hard_count: 5,
      unclassified_count: 0,
    },
    download_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    exam_id: 1003,
    title: 'Đề thi Trắc nghiệm Mạng máy tính & Giao thức TCP/IP',
    subject_name: 'Mạng máy tính',
    question_count: 40,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    statistic: {
      easy_count: 14,
      medium_count: 18,
      hard_count: 8,
      unclassified_count: 0,
    },
    download_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    exam_id: 1004,
    title: 'Kiểm tra 45 phút Cây AVL và Đồ thị - DSA',
    subject_name: 'Cấu trúc dữ liệu và giải thuật',
    question_count: 20,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    statistic: {
      easy_count: 6,
      medium_count: 10,
      hard_count: 4,
      unclassified_count: 0,
    },
    download_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    exam_id: 1005,
    title: 'Đề thi Cuối kỳ Trí tuệ nhân tạo & Học máy cơ bản',
    subject_name: 'Trí tuệ nhân tạo',
    question_count: 35,
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
    statistic: {
      easy_count: 10,
      medium_count: 18,
      hard_count: 7,
      unclassified_count: 0,
    },
    download_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    exam_id: 1006,
    title: 'Đề thi Khảo sát An toàn thông tin & Mã hóa RSA/AES',
    subject_name: 'An toàn thông tin',
    question_count: 25,
    created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
    statistic: {
      easy_count: 7,
      medium_count: 13,
      hard_count: 5,
      unclassified_count: 0,
    },
    download_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
];

export const INITIAL_MOCK_EXAM_DETAILS: Record<number, ExamDetailResponse> = {
  1001: {
    exam_id: 1001,
    title: 'Đề thi Giữa kỳ Hệ điều hành - Ca sáng 2026.1',
    subject_name: 'Hệ điều hành',
    question_count: 5,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    statistic: {
      easy_count: 2,
      medium_count: 2,
      hard_count: 1,
      unclassified_count: 0,
    },
    questions: [
      {
        order: 1,
        question_id: 901,
        content: 'Thuật toán định thời nào sau đây có thể dẫn đến hiện tượng đói tiến trình (Starvation)?',
        topic: 'Định thời CPU',
        difficulty: 'EASY',
        options: [
          { key: 'A', text: 'Round Robin (RR)', is_correct: false },
          { key: 'B', text: 'Shortest Job First (SJF / SRTF)', is_correct: true },
          { key: 'C', text: 'First-Come, First-Served (FCFS)', is_correct: false },
          { key: 'D', text: 'Priority Scheduling có kỹ thuật Aging', is_correct: false },
        ],
      },
      {
        order: 2,
        question_id: 902,
        content: 'Điều kiện nào sau đây KHÔNG PHẢI là một trong 4 điều kiện cần để xảy ra Deadlock (bế tắc)?',
        topic: 'Quản lý Deadlock',
        difficulty: 'EASY',
        options: [
          { key: 'A', text: 'Mutual Exclusion (Loại trừ tương hỗ)', is_correct: false },
          { key: 'B', text: 'Hold and Wait (Giữ và chờ cấp thêm)', is_correct: false },
          { key: 'C', text: 'Preemption (Được phép trưng dụng tài nguyên cưỡng chế)', is_correct: true },
          { key: 'D', text: 'Circular Wait (Chờ đợi vòng tròn)', is_correct: false },
        ],
      },
      {
        order: 3,
        question_id: 903,
        content: 'Trong giải thuật Banker phòng tránh Deadlock, trạng thái được gọi là "Safe State" (An toàn) khi nào?',
        topic: 'Giải thuật Banker',
        difficulty: 'MEDIUM',
        options: [
          { key: 'A', text: 'Hệ thống còn ít nhất 50% tài nguyên rỗi dự trữ.', is_correct: false },
          { key: 'B', text: 'Tồn tại ít nhất một chuỗi an toàn (Safe Sequence) cho phép tất cả tiến trình hoàn tất.', is_correct: true },
          { key: 'C', text: 'Không có tiến trình nào yêu cầu tài nguyên vượt quá dung lượng RAM vật lý.', is_correct: false },
          { key: 'D', text: 'Mọi tiến trình chỉ sử dụng tài nguyên chia sẻ read-only.', is_correct: false },
        ],
      },
      {
        order: 4,
        question_id: 904,
        content: 'Hiện tượng Thrashing (Đập trang liên tục) xảy ra trong bộ nhớ ảo khi nào?',
        topic: 'Bộ nhớ ảo & Phân trang',
        difficulty: 'MEDIUM',
        options: [
          { key: 'A', text: 'Khi kích thước khung trang vật lý (Page Frame) lớn hơn kích thước bảng trang.', is_correct: false },
          { key: 'B', text: 'Khi tổng tập làm việc (Working Set) của các tiến trình vượt quá dung lượng bộ nhớ vật lý sẵn có.', is_correct: true },
          { key: 'C', text: 'Khi ổ cứng SSD sử dụng phân vùng swap định dạng ext4.', is_correct: false },
          { key: 'D', text: 'Khi CPU bị giới hạn xung nhịp do quá nhiệt.', is_correct: false },
        ],
      },
      {
        order: 5,
        question_id: 905,
        content: 'Cho bảng phân trang hai cấp với địa chỉ ảo 32-bit: Bậc 1 gồm 10 bit, Bậc 2 gồm 10 bit, Độ dời (Offset) 12 bit. Kích thước của mỗi trang (Page Size) là bao nhiêu?',
        topic: 'Phân trang đa cấp',
        difficulty: 'HARD',
        options: [
          { key: 'A', text: '1 KB', is_correct: false },
          { key: 'B', text: '2 KB', is_correct: false },
          { key: 'C', text: '4 KB (2^12 bytes)', is_correct: true },
          { key: 'D', text: '8 KB', is_correct: false },
        ],
      },
    ],
  },
  1002: {
    exam_id: 1002,
    title: 'Đề thi Kết thúc học phần Cơ sở dữ liệu - Đề chẵn',
    subject_name: 'Cơ sở dữ liệu',
    question_count: 3,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    statistic: {
      easy_count: 1,
      medium_count: 1,
      hard_count: 1,
      unclassified_count: 0,
    },
    questions: [
      {
        order: 1,
        question_id: 906,
        content: 'Thuộc tính nào sau đây trong lược đồ quan hệ xác định duy nhất một bộ (tuple) mà không thể loại bỏ bất kỳ thuộc tính nào khỏi nó?',
        topic: 'Lý thuyết thiết kế CSDL',
        difficulty: 'EASY',
        options: [
          { key: 'A', text: 'Siêu khóa (Superkey)', is_correct: false },
          { key: 'B', text: 'Khóa ứng viên (Candidate Key)', is_correct: true },
          { key: 'C', text: 'Khóa ngoại (Foreign Key)', is_correct: false },
          { key: 'D', text: 'Thuộc tính suy diễn (Derived Attribute)', is_correct: false },
        ],
      },
      {
        order: 2,
        question_id: 907,
        content: 'Một lược đồ quan hệ ở dạng chuẩn 2NF (Second Normal Form) khi và chỉ khi nó đạt dạng chuẩn 1NF và thỏa mãn điều kiện gì?',
        topic: 'Chuẩn hóa CSDL',
        difficulty: 'MEDIUM',
        options: [
          { key: 'A', text: 'Không chứa bất kỳ khóa ngoại nào trỏ vòng lặp.', is_correct: false },
          { key: 'B', text: 'Mọi thuộc tính không khóa đều phụ thuộc hàm đầy đủ vào khóa chính (không có phụ thuộc từng phần).', is_correct: true },
          { key: 'C', text: 'Không chứa phụ thuộc hàm bắc cầu.', is_correct: false },
          { key: 'D', text: 'Mọi định thức đều phải là siêu khóa.', is_correct: false },
        ],
      },
      {
        order: 3,
        question_id: 908,
        content: 'Trong giao dịch (Transaction), tính chất "Isolation" (Cô lập) ở mức cấp độ SERIALIZABLE ngăn ngừa được hiện tượng dị thường nào?',
        topic: 'Giao dịch & Kiểm soát đồng thời',
        difficulty: 'HARD',
        options: [
          { key: 'A', text: 'Dirty Read (Đọc bẩn).', is_correct: false },
          { key: 'B', text: 'Non-repeatable Read (Đọc không lặp lại).', is_correct: false },
          { key: 'C', text: 'Phantom Read (Đọc bóng ma).', is_correct: false },
          { key: 'D', text: 'Tất cả các hiện tượng Dirty Read, Non-repeatable Read và Phantom Read.', is_correct: true },
        ],
      },
    ],
  },
};

// ============================================================================
// Storage Utilities
// ============================================================================

const STORAGE_KEY_EXAMS = 'sqb_mock_lecturer_exams_v1';
const STORAGE_KEY_DETAILS = 'sqb_mock_lecturer_exam_details_v1';

export function loadStoredMockExams(): ExamItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXAMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(INITIAL_MOCK_EXAMS));
      return INITIAL_MOCK_EXAMS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MOCK_EXAMS;
  } catch {
    return INITIAL_MOCK_EXAMS;
  }
}

export function saveStoredMockExams(items: ExamItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(items));
  } catch {
    // Non-critical
  }
}

export function loadStoredMockExamDetails(): Record<number, ExamDetailResponse> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DETAILS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DETAILS, JSON.stringify(INITIAL_MOCK_EXAM_DETAILS));
      return INITIAL_MOCK_EXAM_DETAILS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_EXAM_DETAILS;
  }
}

export function saveStoredMockExamDetail(detail: ExamDetailResponse): void {
  try {
    if (!detail.exam_id) return;
    const all = loadStoredMockExamDetails();
    all[detail.exam_id] = detail;
    localStorage.setItem(STORAGE_KEY_DETAILS, JSON.stringify(all));
  } catch {
    // Non-critical
  }
}

/**
 * Tạo đề thi giả lập khi server offline
 */
export function generateMockExamLocally(req: GenerateExamRequest): ExamDetailResponse {
  const newId = 1000 + Math.floor(Math.random() * 9000);
  const subject = MOCK_SUBJECTS.find((s) => s.subject_id === req.subject_id);
  const subjectName = subject?.name || 'Môn học #' + req.subject_id;
  const count = req.question_count || 30;

  const easyRatio = req.difficulty_distribution?.easy ?? 0.3;
  const medRatio = req.difficulty_distribution?.medium ?? 0.5;
  const hardRatio = req.difficulty_distribution?.hard ?? 0.2;

  const easyCount = Math.round(count * easyRatio);
  const medCount = Math.round(count * medRatio);
  const hardCount = Math.max(0, count - easyCount - medCount);

  // Generate mock questions
  const generatedQuestions = Array.from({ length: count }, (_, idx) => {
    const diff =
      idx < easyCount ? 'EASY' : idx < easyCount + medCount ? 'MEDIUM' : 'HARD';
    const topic =
      req.topic_weights && Object.keys(req.topic_weights).length > 0
        ? Object.keys(req.topic_weights)[idx % Object.keys(req.topic_weights).length]
        : `Chương ${(idx % 4) + 1} - Trọng tâm lý thuyết & thực hành`;

    return {
      order: idx + 1,
      question_id: 2000 + idx,
      content: `[Câu hỏi bốc ngẫu nhiên từ kho APPROVED] Xét tiến trình trong môn ${subjectName}: Khẳng định nào sau đây là phát biểu chuẩn xác nhất về ${topic}?`,
      topic,
      difficulty: diff as any,
      options: [
        { key: 'A', text: 'Phương án A: Thỏa mãn định lý và tiên đề chuẩn.', is_correct: true },
        { key: 'B', text: 'Phương án B: Bẫy lỗi thường gặp do giả định sai.', is_correct: false },
        { key: 'C', text: 'Phương án C: Phương án nhiễu theo khái niệm lỗi thời.', is_correct: false },
        { key: 'D', text: 'Phương án D: Phát biểu không đầy đủ điều kiện biên.', is_correct: false },
      ],
    };
  });

  const newExamDetail: ExamDetailResponse = {
    exam_id: newId,
    title: req.title || `Đề thi ${subjectName} - Sinh tự động ngày ${new Date().toLocaleDateString('vi-VN')}`,
    subject_name: subjectName,
    question_count: count,
    created_at: new Date().toISOString(),
    statistic: {
      easy_count: easyCount,
      medium_count: medCount,
      hard_count: hardCount,
      unclassified_count: 0,
    },
    questions: generatedQuestions,
  };

  // Add to exam items list
  const existingExams = loadStoredMockExams();
  const newExamItem: ExamItem = {
    exam_id: newId,
    title: newExamDetail.title,
    subject_name: subjectName,
    question_count: count,
    created_at: newExamDetail.created_at,
    statistic: newExamDetail.statistic,
    download_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  };

  saveStoredMockExams([newExamItem, ...existingExams]);
  saveStoredMockExamDetail(newExamDetail);

  return newExamDetail;
}

/**
 * Mock Export URL generator
 */
export function generateMockExportLocally(
  title: string,
  questionCount: number = 30
): ExportResponse {
  return {
    download_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size_mb: 1.45,
    questions_count: questionCount,
    expires_at: new Date(Date.now() + 3600000 * 24).toISOString(),
  };
}
