import {
  User,
  Post,
  Question,
  ProposeSession,
  Exam,
  Minigame,
  LeaderboardUser,
  CosmeticItem,
  FriendRelation,
  Conversation,
  AppNotification
} from '../features/demo/types';

export const mockCurrentUserStudent: User = {
  id: 'user_sv_01',
  name: 'Nguyễn Văn Nam',
  role: 'STUDENT',
  email: 'nam.nv@truong.edu.vn',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
  bio: 'Sinh viên K64 - Viện Công nghệ Thông tin & Truyền thông. Đam mê Hệ phân tán & Ngân hàng đề thi.',
  faculty: 'Khoa Công nghệ Thông tin',
  classOrTitle: 'K64 - CNTT 02',
  points: 1420,
  approvedQuestionsCount: 18,
  friendsCount: 142,
  followersCount: 39,
  isOnline: true,
  equippedFrameId: 'frame_gold',
  equippedChatEffectId: 'effect_glow',
  verifiedLecturer: false,
};

export const mockCurrentUserLecturer: User = {
  id: 'user_gv_01',
  name: 'TS. Trần Minh Đức',
  role: 'LECTURER',
  email: 'duc.tm@truong.edu.vn',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80',
  bio: 'Bộ môn Kỹ thuật Mạng & An ninh Thông tin. Giảng dạy Mạng máy tính, Kiến trúc mạng thế hệ mới.',
  faculty: 'Khoa Mạng Máy tính & Truyền thông',
  classOrTitle: 'Phó Trưởng Bộ môn - Giảng viên chính',
  points: 5800,
  approvedQuestionsCount: 154,
  friendsCount: 380,
  followersCount: 1250,
  isOnline: true,
  equippedFrameId: 'frame_lecturer',
  verifiedLecturer: true,
};

export const mockOtherUsers: User[] = [
  {
    id: 'user_sv_02',
    name: 'Lê Thị Thuỳ Dung',
    role: 'STUDENT',
    email: 'dung.ltt21@truong.edu.vn',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    coverImage: 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&w=1200&q=80',
    bio: 'K65 - Khoa học Dữ liệu. Top 1 Minigame tuần trước!',
    faculty: 'Khoa Toán - Tin ứng dụng',
    classOrTitle: 'K65 - DS01',
    points: 1980,
    approvedQuestionsCount: 24,
    friendsCount: 210,
    followersCount: 88,
    isOnline: true,
    equippedFrameId: 'frame_laurel',
    verifiedLecturer: false,
  },
  {
    id: 'user_sv_03',
    name: 'Phạm Quang Huy',
    role: 'STUDENT',
    email: 'huy.pq20@truong.edu.vn',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    bio: 'Lập trình thi đấu ACM/ICPC. Chuyên Cấu trúc Dữ liệu & Giải thuật.',
    faculty: 'Khoa Công nghệ Thông tin',
    classOrTitle: 'K64 - CNTT 01',
    points: 2150,
    approvedQuestionsCount: 32,
    friendsCount: 312,
    followersCount: 120,
    isOnline: true,
    equippedFrameId: 'frame_dragon',
    verifiedLecturer: false,
  },
  {
    id: 'user_gv_02',
    name: 'PGS. TS. Vũ Hải Yến',
    role: 'LECTURER',
    email: 'yen.vh@truong.edu.vn',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    bio: 'Khoa Khoa học Máy tính. Chủ nhiệm học phần Cấu trúc dữ liệu & Giải thuật và Trí tuệ nhân tạo.',
    faculty: 'Khoa Khoa học Máy tính',
    classOrTitle: 'Chủ nhiệm Bộ môn',
    points: 6200,
    approvedQuestionsCount: 210,
    friendsCount: 450,
    followersCount: 1890,
    isOnline: false,
    equippedFrameId: 'frame_lecturer',
    verifiedLecturer: true,
  },
  {
    id: 'user_sv_04',
    name: 'Hoàng Mai Anh',
    role: 'STUDENT',
    email: 'anh.hm22@truong.edu.vn',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    bio: 'Thích học nhóm và ôn tập Giải tích 1. Cần tìm bạn cùng giải đề!',
    faculty: 'Khoa Điện tử Viễn thông',
    classOrTitle: 'K66 - DTVT 03',
    points: 860,
    approvedQuestionsCount: 9,
    friendsCount: 95,
    followersCount: 24,
    isOnline: true,
    verifiedLecturer: false,
  }
];

export const mockQuestions: Question[] = [
  {
    id: 'q_01',
    sessionId: 'sess_01',
    subject: 'Mạng máy tính',
    chapter: 'Chương 3: Tầng Giao vận (Transport Layer)',
    content: 'Trong giao thức TCP, cơ chế nào sau đây được sử dụng để điều khiển tắc nghẽn (Congestion Control) dựa trên kích thước cửa sổ cwnd?',
    options: [
      { id: 'A', text: 'Slow Start, Congestion Avoidance, Fast Retransmit và Fast Recovery' },
      { id: 'B', text: 'Three-way Handshake kết hợp Cyclic Redundancy Check' },
      { id: 'C', text: 'Chỉ dựa vào trường Receive Window (rwnd) được gửi từ bên nhận' },
      { id: 'D', text: 'Băm địa chỉ IP và áp dụng thuật toán Dijkstra trên router' }
    ],
    correctAnswer: 'A',
    explanation: 'TCP kiểm soát tắc nghẽn bằng 4 thuật toán chuẩn (RFC 5681): Khởi động chậm (Slow Start), Tránh tắc nghẽn (Congestion Avoidance), Truyền lại nhanh (Fast Retransmit) và Hồi phục nhanh (Fast Recovery). Còn rwnd là để kiểm soát luồng (Flow Control).',
    difficulty: 'MEDIUM',
    status: 'APPROVED',
    creatorId: 'user_sv_01',
    creatorName: 'Tuấn Anh gay',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    ratingAverage: 4.8,
    ratingCount: 38,
    totalAttempts: 145,
    correctAttempts: 112,
    optionDistribution: { A: 112, B: 18, C: 12, D: 3 },
  },
  {
    id: 'q_02',
    sessionId: 'sess_01',
    subject: 'Mạng máy tính',
    chapter: 'Chương 2: Tầng Ứng dụng',
    content: 'Giao thức DNS sử dụng cổng (Port) mặc định nào và hoạt động chủ yếu trên tầng giao vận nào đối với truy vấn thông thường của client?',
    options: [
      { id: 'A', text: 'Port 80 trên nền giao thức TCP' },
      { id: 'B', text: 'Port 53 trên nền giao thức UDP' },
      { id: 'C', text: 'Port 443 trên nền giao thức SCTP' },
      { id: 'D', text: 'Port 25 trên nền giao thức UDP' }
    ],
    correctAnswer: 'B',
    explanation: 'DNS thông thường truy vấn nhanh phân giải tên miền qua UDP cổng 53 để giảm độ trễ bắt tay. Khi truyền bản tin zone transfer kích thước lớn (>512 bytes trước EDNS0) mới dùng TCP 53.',
    difficulty: 'EASY',
    status: 'APPROVED',
    creatorId: 'user_sv_01',
    creatorName: 'Tuấn Anh gay',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    ratingAverage: 4.6,
    ratingCount: 52,
    totalAttempts: 230,
    correctAttempts: 198,
    optionDistribution: { A: 14, B: 198, C: 8, D: 10 },
  },
  {
    id: 'q_03',
    sessionId: 'sess_02',
    subject: 'Cấu trúc dữ liệu & Giải thuật',
    chapter: 'Chương 4: Cây nhị phân tìm kiếm & Cây AVL',
    content: 'Độ phức tạp thời gian trong trường hợp xấu nhất (Worst-case time complexity) của thao tác tìm kiếm trên một cây AVL chứa n phần tử là:',
    options: [
      { id: 'A', text: 'O(1)' },
      { id: 'B', text: 'O(n)' },
      { id: 'C', text: 'O(log n)' },
      { id: 'D', text: 'O(n log n)' }
    ],
    correctAnswer: 'C',
    explanation: 'Cây AVL là cây nhị phân tìm kiếm tự cân bằng nghiêm ngặt với hiệu độ cao hai cây con không vượt quá 1. Chiều cao cây luôn bị chặn bởi O(log n), do đó cả thao tác tìm kiếm, chèn, xóa trong trường hợp xấu nhất đều là O(log n).',
    difficulty: 'MEDIUM',
    status: 'APPROVED',
    creatorId: 'user_sv_03',
    creatorName: 'Phạm Quang Huy',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    ratingAverage: 4.9,
    ratingCount: 64,
    totalAttempts: 310,
    correctAttempts: 255,
    optionDistribution: { A: 5, B: 42, C: 255, D: 8 },
  },
  {
    id: 'q_04',
    sessionId: 'sess_pending_01',
    subject: 'Cơ sở dữ liệu',
    chapter: 'Chương 3: Ngôn ngữ SQL & Chuẩn hoá dữ liệu',
    content: 'Một lược đồ quan hệ đạt dạng chuẩn 3 (3NF) khi và chỉ khi nó đạt 2NF và thoả mãn điều kiện nào sau đây?',
    options: [
      { id: 'A', text: 'Mọi thuộc tính không khóa phụ thuộc hàm đầy đủ vào khóa chính' },
      { id: 'B', text: 'Không tồn tại phụ thuộc hàm bắc cầu giữa các thuộc tính không khóa vào khóa chính' },
      { id: 'C', text: 'Mọi định thức (determinant) đều phải là một siêu khóa' },
      { id: 'D', text: 'Các thuộc tính đa trị đều được tách ra thành các bảng độc lập' }
    ],
    correctAnswer: 'B',
    explanation: 'Điều kiện chuẩn 3NF: Đã ở 2NF và không có thuộc tính không khóa nào phụ thuộc bắc cầu vào bất kỳ khóa chính nào.',
    difficulty: 'MEDIUM',
    status: 'PENDING',
    creatorId: 'user_sv_02',
    creatorName: 'Lê Thị Thuỳ Dung',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    ratingAverage: 0,
    ratingCount: 0,
    totalAttempts: 0,
    correctAttempts: 0,
  },
  {
    id: 'q_05',
    sessionId: 'sess_rejected_01',
    subject: 'Giải tích 1',
    chapter: 'Chương 2: Phép tính vi phân hàm một biến',
    content: 'Đạo hàm cấp 1 của hàm số f(x) = ln(sin(2x)) với sin(2x) > 0 là:',
    options: [
      { id: 'A', text: '2 cot(2x)' },
      { id: 'B', text: 'cot(2x)' },
      { id: 'C', text: '-2 tan(2x)' },
      { id: 'D', text: '2 / sin(2x)' }
    ],
    correctAnswer: 'A',
    explanation: "Áp dụng công thức đạo hàm hàm hợp (ln u)' = u'/u. Với u = sin(2x), u' = 2 cos(2x) => f'(x) = 2 cos(2x) / sin(2x) = 2 cot(2x).",
    difficulty: 'EASY',
    status: 'REJECTED',
    rejectionReason: 'Trùng lặp với câu 18 trong Đề cương ôn tập Vi phân K63 đã có sẵn trên ngân hàng.',
    creatorId: 'user_sv_01',
    creatorName: 'Tuấn Anh gay',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    ratingAverage: 3.5,
    ratingCount: 4,
    totalAttempts: 12,
    correctAttempts: 9,
  }
];

export const mockProposeSessions: ProposeSession[] = [
  {
    id: 'sess_pending_01',
    title: 'Bộ câu hỏi trắc nghiệm Chuẩn hoá CSDL & Chuẩn 1NF-BCNF',
    subject: 'Cơ sở dữ liệu',
    chapter: 'Chương 3: Chuẩn hoá quan hệ dữ liệu',
    creator: mockOtherUsers[0], // Lê Thị Thuỳ Dung
    status: 'PENDING',
    submittedAt: 'Hôm nay lúc 09:30',
    questions: [mockQuestions[3]],
  },
  {
    id: 'sess_01',
    title: 'Ngân hàng 5 câu Tầng Giao vận & Ứng dụng TCP/UDP',
    subject: 'Mạng máy tính',
    chapter: 'Chương 3: Transport Layer',
    creator: mockCurrentUserStudent,
    status: 'APPROVED',
    submittedAt: '3 ngày trước',
    reviewedAt: '2 ngày trước',
    reviewer: mockCurrentUserLecturer,
    lecturerFeedback: 'Các câu hỏi biên soạn rất chuẩn, câu hỏi bám sát chuẩn kiến thức CCNA & giáo trình viện.',
    questions: [mockQuestions[0], mockQuestions[1]],
  },
  {
    id: 'sess_rejected_01',
    title: 'Tổng hợp câu hỏi Vi phân cấp 1 & Tích phân suy rộng',
    subject: 'Giải tích 1',
    chapter: 'Chương 2: Phép tính vi phân',
    creator: mockCurrentUserStudent,
    status: 'REJECTED',
    submittedAt: '1 tuần trước',
    reviewedAt: '5 ngày trước',
    reviewer: mockCurrentUserLecturer,
    lecturerFeedback: 'Đề nghị bổ sung thêm các bài toán ứng dụng thực tế hoặc đồ thị thay vì câu tính toán cơ bản.',
    questions: [mockQuestions[4]],
  }
];

export const mockPosts: Post[] = [
  {
    id: 'post_01',
    author: mockCurrentUserStudent,
    type: 'QUESTION_APPROVED',
    content: '🎉 Vừa được thầy TS. Trần Minh Đức duyệt thêm 2 câu hỏi mới về cơ chế Điều khiển tắc nghẽn TCP vào Ngân hàng đề thi viện CNTT! Mọi người vào làm thử câu hỏi trắc nghiệm nhé, có giải thích chi tiết cực dễ hiểu! 📚🔥',
    subjectTag: 'Mạng máy tính',
    linkedQuestionId: 'q_01',
    likesCount: 48,
    isLiked: false,
    commentsCount: 3,
    sharesCount: 5,
    privacy: 'PUBLIC',
    createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    lecturerNote: {
      lecturerName: 'TS. Trần Minh Đức',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      note: 'Câu hỏi có tính thực tiễn cao, giúp sinh viên phân biệt rõ kiểm soát tắc nghẽn (Congestion) và kiểm soát luồng (Flow Control). Điểm cộng học tập +50!',
      createdAt: '1 giờ trước'
    },
    comments: [
      {
        id: 'c_01',
        author: mockOtherUsers[0],
        content: 'Tuyệt vời Nam ơi, câu này kỳ trước thi giữa kỳ dính đúng một câu tương tự luôn! 👏',
        createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
        likesCount: 6,
        isLiked: true,
        replies: [
          {
            id: 'c_01_rep',
            author: mockCurrentUserStudent,
            content: 'Cảm ơn Dung nhé! Cố gắng tuần này lọt Top 3 Minigame nữa là được mở khung avatar mới!',
            createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
            likesCount: 2,
            isLiked: false
          }
        ]
      },
      {
        id: 'c_02',
        author: mockOtherUsers[1],
        content: 'Đã vào làm thử và đúng luôn, giải thích rất chi tiết nhé bạn!',
        createdAt: new Date(Date.now() - 30 * 60_000).toISOString(),
        likesCount: 3,
        isLiked: false
      }
    ]
  },
  {
    id: 'post_02',
    author: mockOtherUsers[2], // PGS TS Vũ Hải Yến
    type: 'KNOWLEDGE',
    content: '📌 [THÔNG BÁO TỪ BỘ MÔN KHOA HỌC MÁY TÍNH]\nĐể chuẩn bị cho kỳ thi kết thúc học phần Cấu trúc dữ liệu & Giải thuật tuần tới, ngân hàng câu hỏi đã cập nhật thêm 120 câu trắc nghiệm tự cân bằng AVL và Đồ thị.\n\nSinh viên hãy truy cập tab Ngân hàng đề để làm bài ôn tập có chấm điểm tự động. Chúc các em ôn thi hiệu quả!',
    subjectTag: 'Cấu trúc dữ liệu & Giải thuật',
    mediaUrls: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80'
    ],
    likesCount: 185,
    isLiked: true,
    commentsCount: 0,
    sharesCount: 42,
    privacy: 'PUBLIC',
    createdAt: new Date(Date.now() - 5 * 60 * 60_000).toISOString(),
    comments: []
  },
  {
    id: 'post_03',
    author: mockOtherUsers[1], // Phạm Quang Huy
    type: 'VIDEO',
    content: '🎥 Video 7 phút giải thích trực quan về thuật toán Dijkstra và cách tối ưu hoá bằng Min-Heap trong C++. Mình có đính kèm file code mẫu cho anh em ôn thi!',
    subjectTag: 'Cấu trúc dữ liệu & Giải thuật',
    videoUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80',
    likesCount: 92,
    isLiked: false,
    commentsCount: 0,
    sharesCount: 11,
    privacy: 'PUBLIC',
    createdAt: new Date(Date.now() - 26 * 60 * 60_000).toISOString(),
  }
];

export const mockMinigames: Minigame[] = [
  {
    id: 'game_01',
    type: 'PARTICIPANTS',
    title: 'Dự đoán số Sinh viên tham gia đề xuất câu hỏi tuần này',
    description: 'Dự đoán tổng số lượng sinh viên gửi ít nhất 1 phiên đề xuất câu hỏi trước 23h59 Chủ nhật.',
    currentValue: 348,
    previousValue: 312,
    status: 'OPEN',
    closesInHours: 5,
    rewardPoints: 200,
    userGuess: 365,
    hasUserGuessed: true,
  },
  {
    id: 'game_02',
    type: 'APPROVED_QUESTIONS',
    title: 'Dự đoán số câu hỏi được Giảng viên phê duyệt tuần này',
    description: 'Thử tài dự đoán tổng số câu hỏi đạt chuẩn và được thêm vào ngân hàng toàn trường kỳ 1.',
    currentValue: 124,
    previousValue: 108,
    status: 'OPEN',
    closesInHours: 8,
    rewardPoints: 250,
    hasUserGuessed: false,
  },
  {
    id: 'game_03',
    type: 'BANK_SIZE',
    title: 'Dự đoán quy mô Ngân hàng đề thi cán mốc cuối tháng',
    description: 'Liệu ngân hàng đề thi toàn trường có vượt mốc 3,500 câu hỏi được kiểm định?',
    currentValue: 3420,
    previousValue: 3150,
    status: 'OPEN',
    closesInHours: 72,
    rewardPoints: 500,
    hasUserGuessed: false,
  }
];

export const mockLeaderboard: LeaderboardUser[] = [
  {
    rank: 1,
    user: mockOtherUsers[1], // Phạm Quang Huy
    score: 2150,
    weekContribution: 32,
    badgeTitle: 'Vương miện Thuật toán'
  },
  {
    rank: 2,
    user: mockOtherUsers[0], // Lê Thị Thuỳ Dung
    score: 1980,
    weekContribution: 24,
    badgeTitle: 'Chiến thần CSDL'
  },
  {
    rank: 3,
    user: mockCurrentUserStudent, // Tuấn Anh gay
    score: 1420,
    weekContribution: 18,
    badgeTitle: 'Thợ săn Kiến thức Mạng'
  },
  {
    rank: 4,
    user: mockOtherUsers[3], // Hoàng Mai Anh
    score: 860,
    weekContribution: 9,
    badgeTitle: 'Tân binh Giải tích'
  },
  {
    rank: 5,
    user: {
      id: 'user_sv_05',
      name: 'Đặng Quốc Bảo',
      role: 'STUDENT',
      email: 'bao.dq21@truong.edu.vn',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
      coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
      bio: 'Lập trình nhúng & IoT',
      faculty: 'Khoa Điện tử',
      classOrTitle: 'K65 - DTVT',
      points: 790,
      approvedQuestionsCount: 8,
      friendsCount: 110,
      followersCount: 15,
      isOnline: false,
      verifiedLecturer: false
    },
    score: 790,
    weekContribution: 8,
    badgeTitle: 'Tích cực Đóng góp'
  }
];

export const mockCosmetics: CosmeticItem[] = [
  {
    id: 'frame_gold',
    name: 'Khung Hào Quang Thủ Khoa',
    type: 'AVATAR_FRAME',
    rarity: 'LEGENDARY',
    description: 'Hào quang vàng rực rỡ dành cho sinh viên có đóng góp xuất sắc lọt Top 3 tuần.',
    borderStyle: 'ring-4 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]',
    previewClass: 'from-amber-400 to-yellow-600',
    unlockCondition: 'Có trên 15 câu hỏi được giảng viên phê duyệt',
    progressCurrent: 18,
    progressRequired: 15,
    isUnlocked: true,
    isEquipped: true,
  },
  {
    id: 'frame_dragon',
    name: 'Khung Rồng Vàng Học Thuật',
    type: 'AVATAR_FRAME',
    rarity: 'EPIC',
    description: 'Khung hoa văn rồng vàng uy nghiêm của viện Công nghệ Thông tin.',
    borderStyle: 'ring-4 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]',
    previewClass: 'from-indigo-500 to-purple-600',
    unlockCondition: 'Đạt 2,000 điểm cống hiến',
    progressCurrent: 1420,
    progressRequired: 2000,
    isUnlocked: false,
    isEquipped: false,
  },
  {
    id: 'frame_laurel',
    name: 'Khung Vòng Nguyệt Quế',
    type: 'AVATAR_FRAME',
    rarity: 'RARE',
    description: 'Vòng nguyệt quế tri thức trao cho sinh viên có điểm đánh giá câu hỏi trên 4.5 sao.',
    borderStyle: 'ring-4 ring-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    previewClass: 'from-emerald-400 to-teal-600',
    unlockCondition: 'Được trên 50 đánh giá câu hỏi 5 sao',
    progressCurrent: 42,
    progressRequired: 50,
    isUnlocked: false,
    isEquipped: false,
  },
  {
    id: 'frame_lecturer',
    name: 'Khung Giảng Viên Uy Tín',
    type: 'AVATAR_FRAME',
    rarity: 'LEGENDARY',
    description: 'Khung xanh học thuật kèm biểu tượng xác thực giảng viên chính thức.',
    borderStyle: 'ring-4 ring-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.7)]',
    previewClass: 'from-blue-600 to-cyan-600',
    unlockCondition: 'Tài khoản Giảng viên được xác minh',
    progressCurrent: 1,
    progressRequired: 1,
    isUnlocked: true,
    isEquipped: false,
  },
  {
    id: 'effect_glow',
    name: 'Bong Bóng Neon Xanh Hoàng Gia',
    type: 'CHAT_EFFECT',
    rarity: 'RARE',
    description: 'Hiệu ứng viền sáng nhẹ bao quanh tin nhắn gửi đi trong Messenger.',
    unlockCondition: 'Tham gia dự đoán 5 minigame',
    progressCurrent: 5,
    progressRequired: 5,
    isUnlocked: true,
    isEquipped: true,
  },
  {
    id: 'effect_meteor',
    name: 'Sao Băng Tri Thức',
    type: 'CHAT_EFFECT',
    rarity: 'EPIC',
    description: 'Mỗi khi gửi tin nhắn sẽ có vệt sao băng tím lấp lánh.',
    unlockCondition: 'Top 10 Bảng xếp hạng tháng',
    progressCurrent: 3,
    progressRequired: 1,
    isUnlocked: true,
    isEquipped: false,
  }
];

export const mockConversations: Conversation[] = [
  {
    id: 'conv_01',
    partner: mockOtherUsers[0], // Lê Thị Thuỳ Dung
    lastMessage: 'Ok Nam ơi, tối nay mình làm đề trắc nghiệm CSDL cùng nhau nhé!',
    lastMessageTime: '10:45',
    unreadCount: 2,
    isTyping: false,
    messages: [
      {
        id: 'm_01',
        conversationId: 'conv_01',
        senderId: 'user_sv_02',
        text: 'Chào Nam! Mình vừa xem phiên đề xuất câu hỏi TCP của bạn, hay thật sự.',
        timestamp: '10:30',
        status: 'READ',
      },
      {
        id: 'm_02',
        conversationId: 'conv_01',
        senderId: 'user_sv_01',
        text: 'Cảm ơn Dung! Bên CSDL bạn cũng vừa gửi 1 phiên chuẩn hoá 3NF đúng không?',
        timestamp: '10:32',
        status: 'READ',
      },
      {
        id: 'm_03',
        conversationId: 'conv_01',
        senderId: 'user_sv_02',
        text: 'Đúng rồi, đang đợi thầy Đức duyệt. Hy vọng không bị trùng lặp!',
        timestamp: '10:40',
        status: 'READ',
      },
      {
        id: 'm_04',
        conversationId: 'conv_01',
        senderId: 'user_sv_02',
        text: 'Ok Nam ơi, tối nay mình làm đề trắc nghiệm CSDL cùng nhau nhé!',
        timestamp: '10:45',
        status: 'DELIVERED',
      }
    ]
  },
  {
    id: 'conv_02',
    partner: mockCurrentUserLecturer, // TS Trần Minh Đức
    lastMessage: 'Thầy đã duyệt 2 câu hỏi Mạng máy tính của em vào ngân hàng chung nhé.',
    lastMessageTime: 'Hôm qua',
    unreadCount: 0,
    isTyping: false,
    messages: [
      {
        id: 'm_05',
        conversationId: 'conv_02',
        senderId: 'user_gv_01',
        text: 'Chào Nam, em đã hoàn thành tốt phiên đề xuất Tầng Giao vận.',
        timestamp: 'Hôm qua 14:15',
        status: 'READ',
      },
      {
        id: 'm_06',
        conversationId: 'conv_02',
        senderId: 'user_gv_01',
        text: 'Thầy đã duyệt 2 câu hỏi Mạng máy tính của em vào ngân hàng chung nhé.',
        timestamp: 'Hôm qua 14:16',
        status: 'READ',
      }
    ]
  },
  {
    id: 'conv_03',
    partner: mockOtherUsers[1], // Phạm Quang Huy
    lastMessage: 'Giải thuật cây AVL nhớ chú ý phép quay kép RL và LR nhé!',
    lastMessageTime: '2 ngày trước',
    unreadCount: 0,
    isTyping: false,
    messages: [
      {
        id: 'm_07',
        conversationId: 'conv_03',
        senderId: 'user_sv_03',
        text: 'Giải thuật cây AVL nhớ chú ý phép quay kép RL và LR nhé!',
        timestamp: '2 ngày trước',
        status: 'READ',
      }
    ]
  }
];

export const mockNotifications: AppNotification[] = [
  {
    id: 'notif_01',
    title: 'Câu hỏi đã được phê duyệt! 🎉',
    message: 'Thầy TS. Trần Minh Đức đã duyệt 2 câu hỏi Mạng máy tính của bạn vào Ngân hàng đề chính thức.',
    timestamp: '2 giờ trước',
    isRead: false,
    type: 'QUESTION_APPROVED',
    actor: mockCurrentUserLecturer,
    targetId: 'q_01'
  },
  {
    id: 'notif_02',
    title: 'Lời mời kết bạn mới',
    message: 'Lê Thị Thuỳ Dung đã gửi cho bạn một lời mời kết bạn.',
    timestamp: '5 giờ trước',
    isRead: false,
    type: 'FRIEND_REQUEST',
    actor: mockOtherUsers[0]
  },
  {
    id: 'notif_03',
    title: 'Giảng viên đã để lại ghi chú',
    message: 'TS. Trần Minh Đức đã ghim một ghi chú học tập trên bài viết chia sẻ của bạn.',
    timestamp: 'Hôm qua lúc 19:40',
    isRead: true,
    type: 'LECTURER_NOTE',
    actor: mockCurrentUserLecturer,
    targetId: 'post_01'
  },
  {
    id: 'notif_04',
    title: 'Minigame tuần đã mở!',
    message: 'Minigame "Dự đoán số Sinh viên tham gia tuần này" sẽ đóng trong 5 giờ. Đặt cược điểm ngay!',
    timestamp: 'Hôm qua lúc 08:00',
    isRead: true,
    type: 'MINIGAME_WIN'
  }
];

export const mockExams: Exam[] = [
  {
    id: 'exam_01',
    title: 'Đề thi Giữa kỳ Học phần Mạng máy tính - Kỳ 2026.1',
    subject: 'Mạng máy tính',
    examCodes: ['Mã 201', 'Mã 202', 'Mã 203', 'Mã 204'],
    totalQuestions: 40,
    durationMinutes: 60,
    difficultyMatrix: {
      easy: 16,
      medium: 16,
      hard: 8
    },
    questions: [mockQuestions[0], mockQuestions[1]],
    createdAt: '08/10/2026',
    creator: mockCurrentUserLecturer
  },
  {
    id: 'exam_02',
    title: 'Đề kiểm tra trắc nghiệm Cấu trúc dữ liệu & Giải thuật',
    subject: 'Cấu trúc dữ liệu & Giải thuật',
    examCodes: ['Mã 101', 'Mã 102'],
    totalQuestions: 25,
    durationMinutes: 45,
    difficultyMatrix: {
      easy: 10,
      medium: 10,
      hard: 5
    },
    questions: [mockQuestions[2]],
    createdAt: '05/10/2026',
    creator: mockOtherUsers[2] // PGS TS Vũ Hải Yến
  }
];

export const mockSubjectsTree = [
  {
    name: 'Công nghệ Thông tin & Khoa học Máy tính',
    subjects: [
      { id: 'sub_01', name: 'Mạng máy tính', totalQuestions: 420 },
      { id: 'sub_02', name: 'Cấu trúc dữ liệu & Giải thuật', totalQuestions: 680 },
      { id: 'sub_03', name: 'Cơ sở dữ liệu', totalQuestions: 510 },
      { id: 'sub_04', name: 'Hệ điều hành', totalQuestions: 340 },
      { id: 'sub_05', name: 'Kiến trúc máy tính & Vi xử lý', totalQuestions: 290 },
    ]
  },
  {
    name: 'Toán & Khoa học Cơ bản',
    subjects: [
      { id: 'sub_06', name: 'Giải tích 1 & 2', totalQuestions: 750 },
      { id: 'sub_07', name: 'Đại số tuyến tính', totalQuestions: 460 },
      { id: 'sub_08', name: 'Xác suất thống kê', totalQuestions: 380 },
    ]
  }
];
