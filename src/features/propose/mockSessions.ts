import type { MySubmissionDetail, SubmissionSessionSummary } from '../../api';

/** Dữ liệu mẫu ban đầu cho các phiên của sinh viên demo (nạp vào features/proposals/demoStore). */
export type StoredSubmissionSummary = SubmissionSessionSummary & {
  status?: 'PENDING' | 'REVIEWING' | 'RESOLVED';
};

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
