import { Question, User } from '../demo/types';
import {
  mockCurrentUserStudent,
  mockOtherUsers,
  mockQuestions,
} from '../../mocks/mockData';

export interface CourseInfo {
  code: string;
  name: string;
  category: string;
  faculty: string;
  color: string;
}

export const COURSE_CATALOG: CourseInfo[] = [
  {
    code: 'IT3080',
    name: 'Mạng máy tính',
    category: 'Chuyên ngành CNTT',
    faculty: 'Khoa Mạng & Truyền thông',
    color: 'blue',
  },
  {
    code: 'IT3011',
    name: 'Cấu trúc dữ liệu & Giải thuật',
    category: 'Chuyên ngành CNTT',
    faculty: 'Khoa Khoa học Máy tính',
    color: 'emerald',
  },
  {
    code: 'IT3090',
    name: 'Cơ sở dữ liệu',
    category: 'Chuyên ngành CNTT',
    faculty: 'Khoa Hệ thống Thông tin',
    color: 'indigo',
  },
  {
    code: 'IT3040',
    name: 'Hệ điều hành',
    category: 'Chuyên ngành CNTT',
    faculty: 'Khoa Kỹ thuật Máy tính',
    color: 'purple',
  },
  {
    code: 'IT3020',
    name: 'Kiến trúc máy tính & Vi xử lý',
    category: 'Chuyên ngành CNTT',
    faculty: 'Khoa Kỹ thuật Máy tính',
    color: 'orange',
  },
  {
    code: 'MI1110',
    name: 'Giải tích 1 & 2',
    category: 'Toán & Khoa học Cơ bản',
    faculty: 'Viện Toán ứng dụng & Tin học',
    color: 'rose',
  },
  {
    code: 'MI1140',
    name: 'Đại số tuyến tính',
    category: 'Toán & Khoa học Cơ bản',
    faculty: 'Viện Toán ứng dụng & Tin học',
    color: 'amber',
  },
  {
    code: 'MI2020',
    name: 'Xác suất thống kê',
    category: 'Toán & Khoa học Cơ bản',
    faculty: 'Viện Toán ứng dụng & Tin học',
    color: 'teal',
  },
];

export const getCourseCode = (subjectName: string): string => {
  const found = COURSE_CATALOG.find(
    (c) =>
      c.name.toLowerCase() === subjectName.toLowerCase() ||
      subjectName.toLowerCase().includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(subjectName.toLowerCase()),
  );
  return found ? found.code : 'GEN1000';
};

export interface StudentExamSet {
  id: string;
  code: string;
  title: string;
  courseCode: string;
  subject: string;
  chapter: string;
  creator: User;
  createdAt: string;
  questions: Question[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
  description?: string;
  totalAttempts: number;
  ratingAverage: number;
  ratingCount: number;
  tags?: string[];
}

export const initialStudentExamSets: StudentExamSet[] = [
  {
    id: 'exam_net_01',
    code: 'NET-MID-2024.1',
    title: 'Đề ôn tập Giữa kỳ Tầng Giao vận & Socket TCP/UDP',
    courseCode: 'IT3080',
    subject: 'Mạng máy tính',
    chapter: 'Chương 2 & 3: Tầng Ứng dụng & Tầng Giao vận',
    creator: mockCurrentUserStudent,
    createdAt: '2 ngày trước',
    difficulty: 'MEDIUM',
    description:
      'Đề cương bám sát các dạng câu hỏi trắc nghiệm kiểm soát tắc nghẽn, bắt tay 3 bước TCP và phân giải tên miền DNS.',
    totalAttempts: 185,
    ratingAverage: 3.8,
    ratingCount: 42,
    tags: ['Giữa kỳ', 'Trọng tâm', 'CCNA'],
    questions: [
      mockQuestions[0],
      mockQuestions[1],
      {
        id: 'q_net_03',
        sessionId: 'exam_net_01',
        subject: 'Mạng máy tính',
        chapter: 'Chương 3: Tầng Giao vận (Transport Layer)',
        content:
          'Trong giao thức UDP, trường Checksum có độ dài bao nhiêu bit và việc kiểm tra lỗi có mang tính bắt buộc trên IPv4 hay không?',
        options: [
          { id: 'A', text: '16 bit và là tùy chọn (optional) trên IPv4' },
          { id: 'B', text: '32 bit và bắt buộc trên cả IPv4 lẫn IPv6' },
          { id: 'C', text: '8 bit và không có khả năng phát hiện lỗi bit' },
          { id: 'D', text: '64 bit được tính toán bằng hàm SHA-256' },
        ],
        correctAnswer: 'A',
        explanation:
          'Header UDP rất gọn nhẹ chỉ gồm 8 byte (4 trường 16-bit: Source Port, Dest Port, Length, Checksum). Trên IPv4, Checksum là tùy chọn (nếu không dùng thì đặt = 0), nhưng trên IPv6 nó là bắt buộc.',
        difficulty: 'EASY',
        status: 'APPROVED',
        creatorId: mockCurrentUserStudent.id,
        creatorName: mockCurrentUserStudent.name,
        creatorAvatar: mockCurrentUserStudent.avatar,
        ratingAverage: 3.7,
        ratingCount: 29,
        totalAttempts: 120,
        correctAttempts: 98,
        optionDistribution: { A: 98, B: 12, C: 6, D: 4 },
      },
    ],
  },
  {
    id: 'exam_db_01',
    code: 'DB-NORM-02',
    title: 'Bộ đề tổng hợp Chuẩn hoá CSDL & Phụ thuộc hàm (1NF -> BCNF)',
    courseCode: 'IT3090',
    subject: 'Cơ sở dữ liệu',
    chapter: 'Chương 3: Lý thuyết thiết kế quan hệ & Chuẩn hoá',
    creator: mockOtherUsers[0], // Lê Thị Thuỳ Dung
    createdAt: 'Hôm qua lúc 10:15',
    difficulty: 'HARD',
    description:
      'Tuyển tập các câu hỏi nâng cao tìm bao đóng thuộc tính, xác định tập khóa ứng viên tối tiểu và phân rã bảo toàn phụ thuộc hàm.',
    totalAttempts: 240,
    ratingAverage: 3.9,
    ratingCount: 56,
    tags: ['Khóa ứng viên', 'BCNF', '3NF'],
    questions: [
      mockQuestions[3],
      mockQuestions[4],
      mockQuestions[5],
      mockQuestions[6],
    ],
  },
  {
    id: 'exam_os_01',
    code: 'OS-DEADLOCK-01',
    title: 'Đề trắc nghiệm Quản lý Bế tắc (Deadlock) & Thuật toán Banker',
    courseCode: 'IT3040',
    subject: 'Hệ điều hành',
    chapter: 'Chương 5: Bế tắc (Deadlock) & Đồng bộ hóa',
    creator: mockOtherUsers[1], // Phạm Quang Huy
    createdAt: 'Hôm nay lúc 14:30',
    difficulty: 'MEDIUM',
    description:
      'Gồm các câu hỏi kiểm tra 4 điều kiện Coffman, thuật toán tránh bế tắc Banker Dijkstra và bài toán đồng bộ Semaphore.',
    totalAttempts: 160,
    ratingAverage: 3.6,
    ratingCount: 31,
    tags: ['Banker', 'Deadlock', 'Coffman'],
    questions: [
      mockQuestions[7],
      mockQuestions[8],
      {
        id: 'q_os_03',
        sessionId: 'exam_os_01',
        subject: 'Hệ điều hành',
        chapter: 'Chương 4: Lập lịch CPU',
        content:
          'Thuật toán lập lịch nào sau đây có thể dẫn đến hiện tượng đói tài nguyên (Starvation) đối với các tiến trình có thời gian thực thi dài?',
        options: [
          { id: 'A', text: 'SJF (Shortest Job First) phi trưng dụng' },
          { id: 'B', text: 'Round Robin với Time Quantum phù hợp' },
          { id: 'C', text: 'FIFO (First In First Out)' },
          { id: 'D', text: 'Fair-share Scheduling' },
        ],
        correctAnswer: 'A',
        explanation:
          'SJF luôn ưu tiên các tiến trình ngắn nhất trước. Nếu liên tục có các tiến trình ngắn mới đến, các tiến trình dài sẽ bị hoãn vô thời hạn (Starvation). Giải pháp là dùng kỹ thuật Lão hóa (Aging).',
        difficulty: 'MEDIUM',
        status: 'APPROVED',
        creatorId: mockOtherUsers[1].id,
        creatorName: mockOtherUsers[1].name,
        creatorAvatar: mockOtherUsers[1].avatar,
        ratingAverage: 3.8,
        ratingCount: 22,
        totalAttempts: 88,
        correctAttempts: 74,
        optionDistribution: { A: 74, B: 6, C: 5, D: 3 },
      },
    ],
  },
  {
    id: 'exam_dsa_01',
    code: 'DSA-TREE-01',
    title: 'Bộ câu hỏi Cây nhị phân tìm kiếm, Cây AVL & Đồ thị DFS/BFS',
    courseCode: 'IT3011',
    subject: 'Cấu trúc dữ liệu & Giải thuật',
    chapter: 'Chương 4 & 5: Cây tự cân bằng & Thuật toán đồ thị',
    creator: mockOtherUsers[3], // Hoàng Mai Anh
    createdAt: '3 ngày trước',
    difficulty: 'MEDIUM',
    description:
      'Ôn tập độ phức tạp thời gian các thao tác quay cây đơn/kép trên AVL và thứ tự duyệt đỉnh đồ thị.',
    totalAttempts: 310,
    ratingAverage: 3.7,
    ratingCount: 68,
    tags: ['Cây AVL', 'Đồ thị', 'Độ phức tạp'],
    questions: [
      mockQuestions[2],
      {
        id: 'q_dsa_02',
        sessionId: 'exam_dsa_01',
        subject: 'Cấu trúc dữ liệu & Giải thuật',
        chapter: 'Chương 5: Thuật toán đồ thị',
        content:
          'Khi biểu diễn đồ thị có hướng G = (V, E) có n đỉnh và m cung bằng Danh sách kề (Adjacency List), không gian bộ nhớ cần dùng là:',
        options: [
          { id: 'A', text: 'O(n + m)' },
          { id: 'B', text: 'O(n^2)' },
          { id: 'C', text: 'O(m^2)' },
          { id: 'D', text: 'O(n * log m)' },
        ],
        correctAnswer: 'A',
        explanation:
          'Danh sách kề cần 1 mảng kích thước n đỉnh, mỗi đỉnh trỏ tới danh sách các đỉnh kề. Tổng số phần tử trong các danh sách kề đúng bằng số cung m, vì thế tổng bộ nhớ là O(n + m). Ma trận kề mới tốn O(n^2).',
        difficulty: 'EASY',
        status: 'APPROVED',
        creatorId: mockOtherUsers[3].id,
        creatorName: mockOtherUsers[3].name,
        creatorAvatar: mockOtherUsers[3].avatar,
        ratingAverage: 3.6,
        ratingCount: 35,
        totalAttempts: 140,
        correctAttempts: 122,
        optionDistribution: { A: 122, B: 10, C: 3, D: 5 },
      },
    ],
  },
  {
    id: 'exam_calc_01',
    code: 'MATH-DIFF-01',
    title: 'Đề ôn tập Đạo hàm, Vi phân & Tích phân suy rộng',
    courseCode: 'MI1110',
    subject: 'Giải tích 1 & 2',
    chapter: 'Chương 2: Phép tính vi phân hàm một biến',
    creator: mockCurrentUserStudent,
    createdAt: '5 ngày trước',
    difficulty: 'HARD',
    description:
      'Các câu hỏi phân loại về khai triển Taylor-Maclaurin, quy tắc L’Hospital và xét sự hội tụ của tích phân suy rộng loại 1.',
    totalAttempts: 195,
    ratingAverage: 3.5,
    ratingCount: 34,
    tags: ['Vi phân', 'Tích phân', 'Taylor'],
    questions: [
      mockQuestions[9],
      {
        id: 'q_calc_02',
        sessionId: 'exam_calc_01',
        subject: 'Giải tích 1 & 2',
        chapter: 'Chương 1: Giới hạn dãy số & hàm số',
        content:
          'Giới hạn L = lim (x -> 0) [ (sin(3x) - 3x) / x^3 ] có giá trị bằng bao nhiêu?',
        options: [
          { id: 'A', text: '-9/2' },
          { id: 'B', text: '0' },
          { id: 'C', text: '-1/6' },
          { id: 'D', text: '-27/6 (-9/2)' },
        ],
        correctAnswer: 'A',
        explanation:
          'Sử dụng khai triển Maclaurin của sin(u) = u - u^3/6 + o(u^3). Với u = 3x: sin(3x) = 3x - 27x^3/6 + o(x^3) = 3x - (9/2)x^3 + o(x^3). Do đó sin(3x) - 3x = -(9/2)x^3 => lim = -9/2.',
        difficulty: 'HARD',
        status: 'APPROVED',
        creatorId: mockCurrentUserStudent.id,
        creatorName: mockCurrentUserStudent.name,
        creatorAvatar: mockCurrentUserStudent.avatar,
        ratingAverage: 3.9,
        ratingCount: 18,
        totalAttempts: 95,
        correctAttempts: 68,
        optionDistribution: { A: 68, B: 12, C: 10, D: 5 },
      },
    ],
  },
];
