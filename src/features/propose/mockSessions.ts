import {
  SubmissionSessionSummary,
  MySubmissionDetail,
  UpdateSubmissionSessionRequest,
  ProposeSessionRequest,
} from '../../api';

export type StoredSubmissionSummary = SubmissionSessionSummary & {
  status?: 'PENDING' | 'REVIEWING' | 'RESOLVED' | string;
};

const SUMMARIES_STORAGE_KEY = 'sn_propose_submissions_summaries_v2';
const DETAIL_STORAGE_PREFIX = 'sn_propose_submission_detail_v2_';

export const INITIAL_MOCK_SUMMARIES: StoredSubmissionSummary[] = [
  {
    session_id: 101,
    session_code: 'IT3180_A7B2C1_1728200000000_101',
    title: 'Ôn tập Design Patterns & Microservice Architectures',
    content: '5 câu trắc nghiệm Saga & CQRS trong hệ thống phân tán',
    subject_id: 10,
    subject_name: 'Nhập môn Công nghệ phần mềm',
    subject_code: 'IT3180',
    question_counts: 2,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    react_count: 14,
    comment_count: 5,
    status: 'PENDING',
  },
  {
    session_id: 102,
    session_code: 'IT3080_B8C3D2_1728300000000_102',
    title: 'Trắc nghiệm Tầng Giao vận TCP/UDP & Bắt tay 3 bước',
    content: '3 câu hỏi về cơ chế điều khiển luồng và tắc nghẽn TCP Tahoe/Reno',
    subject_id: 11,
    subject_name: 'Mạng máy tính & Truyền thông',
    subject_code: 'IT3080',
    question_counts: 2,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    react_count: 9,
    comment_count: 2,
    status: 'RESOLVED',
  },
  {
    session_id: 103,
    session_code: 'IT3011_C9D4E3_1728400000000_103',
    title: 'Ôn tập Cây Nhị phân Tìm kiếm AVL & Đồ thị BFS/DFS',
    content: '4 câu hỏi về cân bằng cây AVL và đường đi ngắn nhất Dijkstra',
    subject_id: 12,
    subject_name: 'Cấu trúc dữ liệu và giải thuật',
    subject_code: 'IT3011',
    question_counts: 1,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    react_count: 6,
    comment_count: 1,
    status: 'REVIEWING',
  },
];

export const INITIAL_MOCK_DETAILS: Record<number, MySubmissionDetail> = {
  101: {
    session_id: 101,
    session_code: 'IT3180_A7B2C1_1728200000000_101',
    title: 'Ôn tập Design Patterns & Microservice Architectures',
    content: '5 câu trắc nghiệm Saga & CQRS trong hệ thống phân tán',
    subject_id: 10,
    subject_name: 'Nhập môn Công nghệ phần mềm',
    subject_code: 'IT3180',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    react_count: 14,
    comment_count: 5,
    questions: [
      {
        question_id: 1001,
        content: 'Trong kiến trúc Microservices, mẫu hình Saga được áp dụng để giải quyết vấn đề cốt lõi nào sau đây?',
        image_urls: [],
        options: [
          {
            key: 'A',
            text: 'Quản lý và duy trì tính nhất quán dữ liệu qua các giao dịch phân tán (Distributed Transactions) giữa các dịch vụ độc lập thông qua bù trừ (Compensating Transactions).',
            is_correct: true,
          },
          {
            key: 'B',
            text: 'Tự động cân bằng tải lưu lượng mạng đầu vào đến các cụm máy chủ container Kubernetes.',
            is_correct: false,
          },
          {
            key: 'C',
            text: 'Mã hóa bảo mật toàn bộ dữ liệu ở trạng thái lưu trữ (Data at rest) trong cơ sở dữ liệu NoSQL.',
            is_correct: false,
          },
          {
            key: 'D',
            text: 'Tự động phân vùng bộ nhớ đệm phân tán Redis khi lưu lượng người dùng tăng đột biến.',
            is_correct: false,
          },
        ],
        explanation: 'Saga Pattern điều phối một chuỗi các giao dịch cục bộ trên từng microservice, sử dụng cơ chế giao dịch bù trừ để đảm bảo tính nhất quán cuối cùng (Eventual Consistency).',
        confidence_score: 4,
        source: 'HOMO_SAPIENS',
      },
      {
        question_id: 1002,
        content: 'Khi triển khai kiến trúc CQRS (Command Query Responsibility Segregation), sự khác biệt cơ bản nhất giữa luồng Command và luồng Query là gì?',
        image_urls: [],
        options: [
          {
            key: 'A',
            text: 'Command làm thay đổi trạng thái dữ liệu (Create/Update/Delete) và không trả về dữ liệu nghiệp vụ, trong khi Query chỉ đọc dữ liệu (Read-only) và không sinh tác dụng phụ (no side-effects).',
            is_correct: true,
          },
          {
            key: 'B',
            text: 'Command chỉ dùng giao thức TCP Socket còn Query chỉ được phép dùng HTTP GET request.',
            is_correct: false,
          },
          {
            key: 'C',
            text: 'Command dành riêng cho cơ sở dữ liệu quan hệ RDBMS còn Query bắt buộc dùng Elasticsearch.',
            is_correct: false,
          },
          {
            key: 'D',
            text: 'Command luôn chạy đồng bộ (synchronous) còn Query bắt buộc phải chạy bất đồng bộ qua hàng đợi.',
            is_correct: false,
          },
        ],
        explanation: 'Nguyên lý CQRS tách rời mô hình đọc và ghi để tối ưu hóa hiệu năng, bảo mật và khả năng mở rộng của hệ thống.',
        confidence_score: 3.5,
        source: 'HOMO_SAPIENS',
      },
    ],
  },
  102: {
    session_id: 102,
    session_code: 'IT3080_B8C3D2_1728300000000_102',
    title: 'Trắc nghiệm Tầng Giao vận TCP/UDP & Bắt tay 3 bước',
    content: '3 câu hỏi về cơ chế điều khiển luồng và tắc nghẽn TCP Tahoe/Reno',
    subject_id: 11,
    subject_name: 'Mạng máy tính & Truyền thông',
    subject_code: 'IT3080',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    react_count: 9,
    comment_count: 2,
    questions: [
      {
        question_id: 1003,
        content: 'Trong giao thức TCP, cờ (Flag) nào trong tiêu đề TCP Segment được bên khởi tạo sử dụng để bắt đầu quá trình bắt tay 3 bước (Three-way Handshake)?',
        image_urls: [],
        options: [
          {
            key: 'A',
            text: 'SYN (Synchronize Sequence Numbers) được bật bằng 1 để thiết lập số thứ tự chuỗi ban đầu (Initial Sequence Number - ISN).',
            is_correct: true,
          },
          {
            key: 'B',
            text: 'ACK (Acknowledgment) nhằm xác nhận đã tiếp nhận toàn bộ gói tin từ máy chủ.',
            is_correct: false,
          },
          {
            key: 'C',
            text: 'FIN (Finish) dùng để yêu cầu đóng phiên truyền dữ liệu hai chiều ngay lập tức.',
            is_correct: false,
          },
          {
            key: 'D',
            text: 'RST (Reset) nhằm hủy bỏ kết nối hiện tại và yêu cầu thiết lập lại cổng lắng nghe.',
            is_correct: false,
          },
        ],
        explanation: 'Bắt tay 3 bước bắt đầu bằng gói tin mang cờ SYN = 1 từ Client đến Server để đồng bộ số thứ tự sequence.',
        confidence_score: 4,
        source: 'HOMO_SAPIENS',
      },
      {
        question_id: 1004,
        content: 'Cơ chế Congestion Control của giao thức TCP Tahoe thực hiện hành động gì ngay khi phát hiện mất gói tin thông qua biến cố Timeout?',
        image_urls: [],
        options: [
          {
            key: 'A',
            text: 'Đặt ngưỡng ssthresh = cwnd / 2, giảm ngay kích thước cửa sổ tắc nghẽn cwnd về 1 MSS, sau đó quay lại pha Slow Start.',
            is_correct: true,
          },
          {
            key: 'B',
            text: 'Giữ nguyên kích thước cwnd hiện tại và tiếp tục gửi lại toàn bộ các phân đoạn tin bị lỗi.',
            is_correct: false,
          },
          {
            key: 'C',
            text: 'Tăng gấp đôi kích thước cửa sổ tắc nghẽn cwnd để bù đắp các gói tin bị mất trên đường truyền.',
            is_correct: false,
          },
          {
            key: 'D',
            text: 'Chuyển đổi tức thì sang giao thức UDP để truyền dữ liệu thời gian thực nhanh hơn.',
            is_correct: false,
          },
        ],
        explanation: 'Khi Timeout xảy ra ở TCP Tahoe, thuật toán giả định mạng bị tắc nghẽn nặng nề nên thiết lập lại cwnd = 1 MSS và ssthresh = cwnd/2.',
        confidence_score: 3.5,
        source: 'HOMO_SAPIENS',
      },
    ],
  },
};

/**
 * Lấy danh sách tóm tắt các phiên đề xuất từ LocalStorage hoặc dữ liệu mẫu khởi tạo
 */
export function getStoredSubmissions(): StoredSubmissionSummary[] {
  try {
    const raw = localStorage.getItem(SUMMARIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  // Initialize default
  try {
    localStorage.setItem(SUMMARIES_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_SUMMARIES));
  } catch {
    // ignore
  }
  return INITIAL_MOCK_SUMMARIES;
}

/**
 * Lấy chi tiết một phiên đề xuất
 */
export function getStoredSubmissionDetail(sessionId: number): MySubmissionDetail | null {
  try {
    const raw = localStorage.getItem(DETAIL_STORAGE_PREFIX + sessionId);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  if (INITIAL_MOCK_DETAILS[sessionId]) {
    return INITIAL_MOCK_DETAILS[sessionId];
  }

  // Fallback: look in summaries
  const summaries = getStoredSubmissions();
  const summary = summaries.find((s) => s.session_id === sessionId);
  if (summary) {
    return {
      session_id: summary.session_id,
      session_code: summary.session_code,
      title: summary.title,
      content: summary.content,
      subject_id: summary.subject_id,
      subject_name: summary.subject_name,
      subject_code: summary.subject_code,
      created_at: summary.created_at,
      react_count: summary.react_count,
      comment_count: summary.comment_count,
      questions: [
        {
          question_id: sessionId * 10 + 1,
          content: 'Nội dung câu hỏi mẫu của phiên ' + summary.title,
          image_urls: [],
          options: [
            { key: 'A', text: 'Phương án A (Đáp án đúng)', is_correct: true },
            { key: 'B', text: 'Phương án B', is_correct: false },
            { key: 'C', text: 'Phương án C', is_correct: false },
            { key: 'D', text: 'Phương án D', is_correct: false },
          ],
          explanation: 'Giải thích chi tiết cho câu hỏi này...',
          confidence_score: 3.5,
        },
      ],
    };
  }

  return null;
}

/**
 * Lưu phiên đề xuất mới
 */
export function saveNewStoredSubmission(
  req: ProposeSessionRequest,
  subjectName?: string,
  subjectCode?: string
): { summary: SubmissionSessionSummary; detail: MySubmissionDetail } {
  const newId = Date.now();
  const sessionCode = `${subjectCode || 'SUB'}_${Math.random().toString(36).substring(2, 8).toUpperCase()}_${newId}`;

  const detail: MySubmissionDetail = {
    session_id: newId,
    session_code: sessionCode,
    title: req.title,
    content: req.content,
    subject_id: req.subject_id,
    subject_name: subjectName || 'Môn học #' + req.subject_id,
    subject_code: subjectCode || 'MH' + req.subject_id,
    created_at: new Date().toISOString(),
    react_count: 0,
    comment_count: 0,
    questions: (req.questions || []).map((q, idx) => ({
      question_id: newId * 10 + idx + 1,
      content: q.content,
      image_urls: q.media_urls || [],
      options: (q.options || []).map((opt) => ({
        key: opt.key,
        text: opt.text,
        is_correct: opt.is_correct,
        media_url: opt.media_url,
      })),
      explanation: q.explanation,
      confidence_score: q.confidence,
      source: (q.llm_generated ? 'LLM' : 'HOMO_SAPIENS') as 'LLM' | 'HOMO_SAPIENS',
    })),
  };

  const summary: StoredSubmissionSummary = {
    session_id: newId,
    session_code: sessionCode,
    title: req.title,
    content: req.content,
    subject_id: req.subject_id,
    subject_name: detail.subject_name,
    subject_code: detail.subject_code,
    question_counts: req.questions?.length || 0,
    created_at: detail.created_at,
    react_count: 0,
    comment_count: 0,
    status: 'PENDING',
  };

  try {
    const list = getStoredSubmissions();
    const updated = [summary, ...list];
    localStorage.setItem(SUMMARIES_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(DETAIL_STORAGE_PREFIX + newId, JSON.stringify(detail));
  } catch {
    // ignore
  }

  return { summary, detail };
}

/**
 * Cập nhật phiên đề xuất
 */
export function updateStoredSubmission(
  sessionId: number,
  req: UpdateSubmissionSessionRequest,
  subjectName?: string,
  subjectCode?: string
): { summary: SubmissionSessionSummary; detail: MySubmissionDetail } | null {
  const currentDetail = getStoredSubmissionDetail(sessionId);
  if (!currentDetail) return null;

  const updatedDetail: MySubmissionDetail = {
    ...currentDetail,
    title: req.title,
    content: req.content,
    subject_id: req.subject_id,
    subject_name: subjectName || currentDetail.subject_name,
    subject_code: subjectCode || currentDetail.subject_code,
    questions: (req.questions || []).map((q, idx) => ({
      question_id: q.question_id || sessionId * 10 + idx + 1,
      content: q.content,
      image_urls: q.media_urls || [],
      options: (q.options || []).map((opt) => ({
        key: opt.key,
        text: opt.text,
        is_correct: opt.is_correct,
        media_url: opt.media_url,
      })),
      explanation: q.explanation,
      confidence_score: q.confidence,
      source: (q.source || 'HOMO_SAPIENS') as 'LLM' | 'HOMO_SAPIENS',
    })),
  };

  const summaries = getStoredSubmissions();
  let updatedSummary: SubmissionSessionSummary | null = null;
  const newSummaries = summaries.map((s) => {
    if (s.session_id === sessionId) {
      updatedSummary = {
        ...s,
        title: req.title,
        content: req.content,
        subject_id: req.subject_id,
        subject_name: updatedDetail.subject_name,
        subject_code: updatedDetail.subject_code,
        question_counts: req.questions?.length || 0,
      };
      return updatedSummary;
    }
    return s;
  });

  if (!updatedSummary) {
    updatedSummary = {
      session_id: sessionId,
      session_code: currentDetail.session_code,
      title: req.title,
      content: req.content,
      subject_id: req.subject_id,
      subject_name: updatedDetail.subject_name,
      subject_code: updatedDetail.subject_code,
      question_counts: req.questions?.length || 0,
      created_at: currentDetail.created_at,
      react_count: currentDetail.react_count || 0,
      comment_count: currentDetail.comment_count || 0,
    };
    newSummaries.unshift(updatedSummary);
  }

  try {
    localStorage.setItem(SUMMARIES_STORAGE_KEY, JSON.stringify(newSummaries));
    localStorage.setItem(DETAIL_STORAGE_PREFIX + sessionId, JSON.stringify(updatedDetail));
  } catch {
    // ignore
  }

  return { summary: updatedSummary, detail: updatedDetail };
}

/**
 * Xóa phiên đề xuất
 */
export function deleteStoredSubmission(sessionId: number): void {
  try {
    const list = getStoredSubmissions();
    const filtered = list.filter((s) => s.session_id !== sessionId);
    localStorage.setItem(SUMMARIES_STORAGE_KEY, JSON.stringify(filtered));
    localStorage.removeItem(DETAIL_STORAGE_PREFIX + sessionId);
  } catch {
    // ignore
  }
}
