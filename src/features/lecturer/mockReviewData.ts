import {
  PendingSessionItemDto,
  SessionDetailReviewResponse,
  SessionQuestionReviewDto,
  DuplicateWarning,
  EditQuestionRequest,
  EditQuestionResponse,
  ApproveQuestionsResponse,
} from '../../api';

// Initial Mock Pending / Reviewing / Resolved Sessions for Lecturer Review
export const INITIAL_MOCK_REVIEW_SESSIONS: PendingSessionItemDto[] = [
  // 1. PENDING SESSIONS (Chờ kiểm duyệt)
  {
    session_id: 101,
    topic: 'Hệ điều hành',
    title: 'Đề xuất trắc nghiệm Giải thuật Điều phối CPU & Định thời Round-Robin',
    content: 'Bộ 4 câu hỏi trắc nghiệm thẩm định thời gian chờ trung bình (Average Waiting Time) của các thuật toán FCFS, SJF và RR.',
    author: {
      user_id: 201,
      full_name: 'Nguyễn Văn An',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    status: 'PENDING',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    session_id: 102,
    topic: 'Cơ sở dữ liệu',
    title: 'Bộ câu hỏi Chuẩn hoá CSDL quan hệ: 1NF, 2NF, 3NF & BCNF',
    content: '5 câu hỏi trắc nghiệm về bao đóng tập thuộc tính, tìm khóa ứng viên tối tiểu và phân rã quan hệ bảo toàn phụ thuộc hàm.',
    author: {
      user_id: 202,
      full_name: 'Lê Thị Thuỳ Dung',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    },
    status: 'PENDING',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    session_id: 103,
    topic: 'Mạng máy tính',
    title: 'Trắc nghiệm Phân chia mạng con CIDR & Giao thức Định tuyến OSPF',
    content: 'Tính toán Subnet Mask, Default Gateway và phân tích gói tin Hello trong giao thức trạng thái liên kết OSPF.',
    author: {
      user_id: 203,
      full_name: 'Phạm Quang Huy',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
    status: 'PENDING',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    session_id: 104,
    topic: 'Cấu trúc dữ liệu và giải thuật',
    title: 'Ôn tập Cây AVL, Cây Đỏ - Đen (Red-Black) & B-Tree',
    content: 'Các câu hỏi về phép xoay đơn/kép khi mất cân bằng cây AVL và thời gian tìm kiếm trong trường hợp xấu nhất.',
    author: {
      user_id: 204,
      full_name: 'Trần Minh Quân',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    status: 'PENDING',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    session_id: 105,
    topic: 'Kiến trúc máy tính',
    title: 'Trắc nghiệm Đường ống lệnh MIPS (Pipelining) & Xung đột dữ liệu',
    content: 'Phân tích hiện tượng Data Hazard, Branch Hazard trong kiến trúc 5 tầng IF-ID-EX-MEM-WB và kỹ thuật Forwarding.',
    author: {
      user_id: 205,
      full_name: 'Hoàng Thị Mai',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80',
    },
    status: 'PENDING',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
  {
    session_id: 106,
    topic: 'Trí tuệ nhân tạo',
    title: 'Thuật toán tìm kiếm A* và Cắt tỉa Alpha-Beta trong Minimax',
    content: 'Đánh giá tính chấp nhận được (Admissibility) của hàm Heuristic và thứ tự duyệt cây trò chơi cờ vua.',
    author: {
      user_id: 206,
      full_name: 'Đỗ Quốc Bảo',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    },
    status: 'PENDING',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },

  // 2. REVIEWING SESSIONS (Đang kiểm duyệt)
  {
    session_id: 107,
    topic: 'Hệ điều hành',
    title: 'Xử lý Bế tắc (Deadlock) & Thuật toán Nhà ngân hàng Banker',
    content: 'Phiên đang thẩm định: 2 câu đã được duyệt, đang kiểm tra câu hỏi số 3 về kiểm tra chuỗi an toàn Safe Sequence.',
    author: {
      user_id: 207,
      full_name: 'Phạm Hải Đăng',
      avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    },
    status: 'REVIEWING',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    session_id: 108,
    topic: 'Mạng máy tính',
    title: 'Cơ chế Bắt tay 3 bước TCP & Điều khiển tắc nghẽn Tahoe/Reno',
    content: 'Phiên đang thẩm định: Giảng viên đang xem xét giải thích của tác giả về ngưỡng Slow Start Threshold (ssthresh).',
    author: {
      user_id: 208,
      full_name: 'Vũ Phương Thảo',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    },
    status: 'REVIEWING',
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
  {
    session_id: 109,
    topic: 'Cơ sở dữ liệu',
    title: 'Tối ưu hóa Truy vấn SQL & Chỉ mục B-Tree vs Hash Index',
    content: 'Phiên đang thẩm định: Đã phát hiện cảnh báo tương đồng với ngân hàng câu hỏi đề thi kỳ trước.',
    author: {
      user_id: 209,
      full_name: 'Ngô Quang Dũng',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    },
    status: 'REVIEWING',
    created_at: new Date(Date.now() - 3600000 * 40).toISOString(),
  },

  // 3. RESOLVED SESSIONS (Lịch sử kiểm duyệt)
  {
    session_id: 110,
    topic: 'Mạng máy tính',
    title: 'Tổng hợp 10 câu trắc nghiệm Mô hình OSI vs TCP/IP & Giao thức Tầng Ứng dụng',
    content: 'Phiên đề xuất xuất sắc, toàn bộ câu hỏi đã được thẩm định và phê chuẩn vào Ngân hàng đề thi trường.',
    author: {
      user_id: 201,
      full_name: 'Nguyễn Văn An',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    status: 'RESOLVED',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    session_id: 111,
    topic: 'Hệ điều hành',
    title: 'Bộ nhớ ảo, Phân trang Paging & Giải thuật thay thế trang LRU',
    content: 'Đã hoàn tất kiểm duyệt: 3 câu được phê chuẩn, 1 câu bị từ chối do nội dung trùng lặp.',
    author: {
      user_id: 203,
      full_name: 'Phạm Quang Huy',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
    status: 'RESOLVED',
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
  },
  {
    session_id: 112,
    topic: 'Cấu trúc dữ liệu và giải thuật',
    title: 'Đồ thị có hướng và Giải thuật tìm đường đi ngắn nhất Dijkstra / Bellman-Ford',
    content: 'Đã hoàn tất kiểm duyệt: Các câu hỏi đạt chuẩn phân loại độ khó (Nhận biết - Thông hiểu - Vận dụng).',
    author: {
      user_id: 204,
      full_name: 'Trần Minh Quân',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    status: 'RESOLVED',
    created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
  },
];

// Initial Mock Details with Questions & Duplicate Warnings
export const INITIAL_MOCK_SESSION_DETAILS: Record<number, SessionDetailReviewResponse> = {
  101: {
    items: [
      {
        question_id: 1001,
        content: 'Cho danh sách tiến trình với CPU Burst Time lần lượt là P1 (24ms), P2 (3ms), P3 (3ms) cùng đến tại thời điểm t = 0 theo thứ tự P1, P2, P3. Thời gian chờ trung bình (Average Waiting Time) khi áp dụng giải thuật FCFS là bao nhiêu?',
        options: [
          { key: 'A', text: '17 ms', is_correct: true },
          { key: 'B', text: '27 ms', is_correct: false },
          { key: 'C', text: '13 ms', is_correct: false },
          { key: 'D', text: '30 ms', is_correct: false },
        ],
        correct_answer: 'A',
        explanation: 'Thời gian chờ của P1 là 0ms, P2 là 24ms, P3 là 24 + 3 = 27ms. Thời gian chờ trung bình = (0 + 24 + 27) / 3 = 51 / 3 = 17ms.',
        status: 'PENDING',
      },
      {
        question_id: 1002,
        content: 'Trong giải thuật điều phối Round-Robin (RR), nếu định mức thời gian (Time Quantum q) được thiết lập cực kỳ lớn (q -> vô cùng), giải thuật RR sẽ hoạt động tương đương với giải thuật nào sau đây?',
        options: [
          { key: 'A', text: 'SJF (Shortest Job First)' },
          { key: 'B', text: 'FCFS (First-Come, First-Served)', is_correct: true },
          { key: 'C', text: 'Priority Scheduling độc quyền' },
          { key: 'D', text: 'Multilevel Feedback Queue' },
        ],
        correct_answer: 'B',
        explanation: 'Khi Time Quantum q rất lớn, mỗi tiến trình sẽ chạy hết toàn bộ Burst Time của mình mà không bị ngắt quãng chuyển ngữ cảnh, do đó giải thuật thoái hóa thành FCFS.',
        status: 'PENDING',
      },
      {
        question_id: 1003,
        content: 'Giải thuật điều phối CPU nào sau đây có thể dẫn đến hiện tượng đói tài nguyên (Starvation) đối với các tiến trình có thời gian thực thi dài?',
        options: [
          { key: 'A', text: 'Round-Robin với Time Quantum nhỏ' },
          { key: 'B', text: 'SJF (Shortest Job First) không độc quyền (SRTF)', is_correct: true },
          { key: 'C', text: 'FCFS' },
          { key: 'D', text: 'FIFO hàng đợi vòng' },
        ],
        correct_answer: 'B',
        explanation: 'SJF và SRTF ưu tiên tuyệt đối các tiến trình ngắn. Nếu các tiến trình ngắn liên tục xuất hiện trong Ready Queue, tiến trình dài sẽ bị hoãn vô thời hạn (Starvation).',
        status: 'PENDING',
      },
      {
        question_id: 1004,
        content: 'Kỹ thuật nào thường được sử dụng trong các hệ điều hành để khắc phục hiện tượng đói tài nguyên (Starvation) trong giải thuật điều phối theo độ ưu tiên?',
        options: [
          { key: 'A', text: 'Aging (Tăng dần độ ưu tiên theo thời gian chờ)', is_correct: true },
          { key: 'B', text: 'Swapping bộ nhớ liên tục' },
          { key: 'C', text: 'Giảm Time Quantum của tiến trình' },
          { key: 'D', text: 'Thu hồi tài nguyên bắt buộc (Preemption)' },
        ],
        correct_answer: 'A',
        explanation: 'Aging là kỹ thuật tăng dần mức độ ưu tiên của một tiến trình khi tiến trình đó phải chờ đợi quá lâu trong hệ thống, đảm bảo tiến trình cuối cùng cũng sẽ được cấp phát CPU.',
        status: 'PENDING',
      },
    ],
    duplicate_warnings: [
      {
        question_index: 2,
        similar_question_id: 842,
        similarity_score: 0.91,
        tier: 'RULE_BASED',
        matched_snipet: 'Giải thuật định thời nào sau đây có thể dẫn đến hiện tượng đói CPU (starvation) đối với tiến trình dài...',
      },
    ],
  },

  102: {
    items: [
      {
        question_id: 1005,
        content: 'Một lược đồ quan hệ R đạt dạng chuẩn 2 (2NF) khi và chỉ khi nó đạt 1NF và thoả mãn điều kiện nào sau đây?',
        options: [
          { key: 'A', text: 'Mọi thuộc tính không khóa phụ thuộc hàm đầy đủ vào khóa chính', is_correct: true },
          { key: 'B', text: 'Không tồn tại phụ thuộc hàm bắc cầu giữa các thuộc tính không khóa' },
          { key: 'C', text: 'Mọi vế trái của phụ thuộc hàm đều phải là siêu khóa' },
          { key: 'D', text: 'Không có thuộc tính nào nhận giá trị NULL' },
        ],
        correct_answer: 'A',
        explanation: 'Chuẩn 2NF loại bỏ phụ thuộc hàm một phần: Mọi thuộc tính không khóa đều phải phụ thuộc hàm đầy đủ vào toàn bộ khóa chính, không được phụ thuộc vào một phần của khóa ghép.',
        status: 'PENDING',
      },
      {
        question_id: 1006,
        content: 'Cho lược đồ quan hệ R(A, B, C, D) với tập phụ thuộc hàm F = {AB -> C, C -> D, D -> A}. Khóa ứng viên (Candidate Key) của R là:',
        options: [
          { key: 'A', text: '{AB}, {BC}, {BD}', is_correct: true },
          { key: 'B', text: 'Chỉ có duy nhất {AB}' },
          { key: 'C', text: '{CD} và {AB}' },
          { key: 'D', text: '{A, B, C, D}' },
        ],
        correct_answer: 'A',
        explanation: 'Tính bao đóng: (AB)+ = ABCD => AB là khóa. Vì D -> A nên (BD)+ = BDAC = ABCD => BD là khóa. Vì C -> D nên (BC)+ = BCDA = ABCD => BC là khóa.',
        status: 'PENDING',
      },
      {
        question_id: 1007,
        content: 'Dạng chuẩn Boyce-Codd (BCNF) khác với dạng chuẩn 3 (3NF) ở điểm mấu chốt nào?',
        options: [
          { key: 'A', text: '3NF cho phép vế phải là thuộc tính khóa, còn BCNF bắt buộc mọi định thức (determinant X trong X -> Y) đều phải là siêu khóa', is_correct: true },
          { key: 'B', text: 'BCNF không yêu cầu đạt chuẩn 1NF' },
          { key: 'C', text: '3NF không cho phép phụ thuộc hàm bắc cầu' },
          { key: 'D', text: 'BCNF luôn bảo toàn phụ thuộc hàm khi phân rã quan hệ' },
        ],
        correct_answer: 'A',
        explanation: 'Trong 3NF, điều kiện cho phụ thuộc hàm X -> A là: X là siêu khóa HOẶC A là thuộc tính khóa. BCNF loại bỏ trường hợp ngoại lệ A là thuộc tính khóa, bắt buộc X phải là siêu khóa.',
        status: 'PENDING',
      },
    ],
    duplicate_warnings: [
      {
        question_index: 0,
        similar_question_id: 419,
        similarity_score: 0.88,
        tier: 'TEXT_EMBEDDING',
        matched_snipet: 'Lược đồ quan hệ đạt chuẩn 2NF khi mọi thuộc tính không khóa phụ thuộc đầy đủ vào khóa chính...',
      },
    ],
  },

  107: {
    items: [
      {
        question_id: 1008,
        content: 'Thuật toán Banker (Nhà ngân hàng của Dijkstra) được áp dụng trong chiến lược nào để quản lý Deadlock trong hệ điều hành?',
        options: [
          { key: 'A', text: 'Ngăn ngừa bế tắc (Deadlock Prevention)' },
          { key: 'B', text: 'Tránh bế tắc (Deadlock Avoidance) bằng cách duy trì Safe State', is_correct: true },
          { key: 'C', text: 'Phát hiện và phục hồi bế tắc (Detection & Recovery)' },
          { key: 'D', text: 'Bỏ qua bế tắc (Ostrich Algorithm)' },
        ],
        correct_answer: 'B',
        explanation: 'Thuật toán Banker là thuật toán Tránh bế tắc (Deadlock Avoidance). Hệ thống chỉ cấp phát tài nguyên khi việc cấp phát đó đảm bảo vẫn tồn tại ít nhất một chuỗi an toàn (Safe Sequence).',
        status: 'APPROVED',
      },
      {
        question_id: 1009,
        content: 'Bốn điều kiện cần thiết của Coffman để một bế tắc (Deadlock) có thể xảy ra trong hệ thống gồm:',
        options: [
          { key: 'A', text: 'Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait', is_correct: true },
          { key: 'B', text: 'Paging, Segmentation, Thrashing, Starvation' },
          { key: 'C', text: 'FCFS, SJF, Round-Robin, Priority' },
          { key: 'D', text: 'Critical Section, Semaphore, Mutex, Spinlock' },
        ],
        correct_answer: 'A',
        explanation: '4 điều kiện Coffman: Độc quyền tài nguyên (Mutual Exclusion), Giữ và chờ thêm (Hold and Wait), Không thể thu hồi cưỡng bức (No Preemption), và Chờ đợi vòng tròn (Circular Wait).',
        status: 'APPROVED',
      },
      {
        question_id: 1010,
        content: 'Trong đồ thị cấp phát tài nguyên (Resource Allocation Graph), nếu hệ thống chỉ có MỘT bản sao cho mỗi loại tài nguyên, điều kiện nào là điều kiện cần VÀ đủ để kết luận có bế tắc?',
        options: [
          { key: 'A', text: 'Đồ thị tồn tại chu trình (Cycle)', is_correct: true },
          { key: 'B', text: 'Tất cả các tiến trình đều đang yêu cầu tài nguyên' },
          { key: 'C', text: 'Số tiến trình vượt quá số tài nguyên khả dụng' },
          { key: 'D', text: 'Đồ thị có ít nhất 2 nút tài nguyên' },
        ],
        correct_answer: 'A',
        explanation: 'Khi mỗi loại tài nguyên chỉ có 1 bản sao (Single instance per resource type), sự tồn tại của chu trình trong đồ thị cấp phát tài nguyên là điều kiện cần và đủ để xảy ra bế tắc.',
        status: 'PENDING',
      },
    ],
    duplicate_warnings: [],
  },

  110: {
    items: [
      {
        question_id: 1011,
        content: 'Giao thức DNS thông thường hoạt động trên cổng nào và sử dụng giao thức truyền vận nào cho các truy vấn phân giải tên miền phổ biến?',
        options: [
          { key: 'A', text: 'TCP cổng 53' },
          { key: 'B', text: 'UDP cổng 53', is_correct: true },
          { key: 'C', text: 'UDP cổng 67' },
          { key: 'D', text: 'TCP cổng 80' },
        ],
        correct_answer: 'B',
        explanation: 'DNS truy vấn phân giải tên miền nhanh dùng UDP 53 để tiết kiệm chi phí thiết lập kết nối. Chỉ khi kích thước bản tin vượt quá 512 bytes hoặc Zone Transfer mới dùng TCP 53.',
        status: 'APPROVED',
      },
    ],
    duplicate_warnings: [],
  },
};

// Storage keys for local persistence in mock mode
const MOCK_STORAGE_KEY_SESSIONS = 'sqb_mock_review_sessions_v1';
const MOCK_STORAGE_KEY_DETAILS = 'sqb_mock_review_details_v1';

export function loadStoredMockSessions(): PendingSessionItemDto[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY_SESSIONS);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [...INITIAL_MOCK_REVIEW_SESSIONS];
}

export function saveStoredMockSessions(sessions: PendingSessionItemDto[]) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch {
    // fallback
  }
}

export function loadStoredMockDetails(): Record<number, SessionDetailReviewResponse> {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY_DETAILS);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return { ...INITIAL_MOCK_SESSION_DETAILS };
}

export function saveStoredMockDetails(details: Record<number, SessionDetailReviewResponse>) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY_DETAILS, JSON.stringify(details));
  } catch {
    // fallback
  }
}
