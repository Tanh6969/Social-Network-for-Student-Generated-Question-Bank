import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import {
  Code,
  X,
  Play,
  RotateCcw,
  CheckCircle,
  Copy,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react';

interface ApiInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiInspectorDrawer: React.FC<ApiInspectorDrawerProps> = ({ isOpen, onClose }) => {
  const { apiLogs, clearApiLogs, sessions, questions } = useApp();
  const [activeTab, setActiveTab] = useState<'SWAGGER' | 'LIVE_LOGS'>('SWAGGER');
  const [selectedApiIndex, setSelectedApiIndex] = useState(0);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Exact 6 APIs from user's uploaded image
  const apiSpecs = [
    {
      method: 'PUT',
      path: '/questions/{questionId}',
      summary: 'Giảng viên chỉnh sửa câu hỏi',
      color: 'bg-amber-600',
      badgeColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800',
      description: 'Cho phép Giảng viên thẩm định cập nhật nội dung đề bài, các phương án A, B, C, D, đáp án đúng, giải thích và độ khó trước khi phê chuẩn vào ngân hàng đề thi trường.',
      params: [
        { name: 'questionId', type: 'string (path)', required: true, desc: 'ID định danh duy nhất của câu hỏi' }
      ],
      requestBody: {
        content: 'Một lược đồ quan hệ đạt dạng chuẩn 3 (3NF) khi và chỉ khi nó đạt 2NF và thoả mãn...',
        options: [
          { id: 'A', text: 'Mọi thuộc tính không khóa phụ thuộc hàm đầy đủ vào khóa chính' },
          { id: 'B', text: 'Không tồn tại phụ thuộc hàm bắc cầu giữa các thuộc tính không khóa vào khóa chính' }
        ],
        correctAnswer: 'B',
        explanation: 'Định nghĩa chuẩn 3NF bám sát giáo trình CSDL...',
        difficulty: 'MEDIUM',
        chapter: 'Chương 3: Chuẩn hoá quan hệ dữ liệu'
      },
      responseBody: {
        success: true,
        message: 'Cập nhật câu hỏi thành công',
        updatedQuestionId: 'q_04',
        updatedAt: '2026-10-14T20:00:00Z'
      }
    },
    {
      method: 'GET',
      path: '/sessions/{sessionId}',
      summary: 'Xem chi tiết phiên đề xuất để duyệt',
      color: 'bg-blue-600',
      badgeColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800',
      description: 'Lấy toàn bộ thông tin chi tiết của một phiên đề xuất câu hỏi từ sinh viên, danh sách các câu hỏi đi kèm, tình trạng duyệt và phân tích chất lượng AI.',
      params: [
        { name: 'sessionId', type: 'string (path)', required: true, desc: 'ID phiên đề xuất (vd: sess_pending_01)' }
      ],
      requestBody: null,
      responseBody: {
        sessionId: 'sess_pending_01',
        title: 'Bộ câu hỏi trắc nghiệm Chuẩn hoá CSDL & Chuẩn 1NF-BCNF (4 câu)',
        subject: 'Cơ sở dữ liệu',
        chapter: 'Chương 3: Chuẩn hoá quan hệ dữ liệu',
        creator: {
          id: 'user_sv_02',
          name: 'Lê Thị Thuỳ Dung',
          faculty: 'Khoa Công nghệ thông tin',
          points: 420
        },
        status: 'PENDING',
        totalQuestions: 4,
        questions: ['q_04', 'q_06', 'q_07', 'q_08']
      }
    },
    {
      method: 'POST',
      path: '/sessions/{sessionId}/complete-review',
      summary: 'Chốt hoàn tất duyệt phiên đề xuất',
      color: 'bg-emerald-600',
      badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800',
      description: 'Chốt phiên thẩm định, khóa phiên duyệt, lưu lại toàn bộ kết quả vào kho lưu trữ và gửi thông báo tổng kết điểm thưởng cho sinh viên.',
      params: [
        { name: 'sessionId', type: 'string (path)', required: true, desc: 'ID phiên cần hoàn tất' }
      ],
      requestBody: {
        finalFeedback: 'Đã hoàn tất đánh giá toàn bộ phiên đề xuất. 4 câu đạt chuẩn đã được lưu vào Ngân hàng câu hỏi chính thức.'
      },
      responseBody: {
        success: true,
        sessionStatus: 'COMPLETED',
        approvedCount: 3,
        rejectedCount: 1,
        reviewedAt: '2026-10-14T20:05:00Z'
      }
    },
    {
      method: 'POST',
      path: '/sessions/approve',
      summary: 'Phê duyệt danh sách câu hỏi',
      color: 'bg-emerald-600',
      badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800',
      description: 'Phê duyệt hàng loạt hoặc từng câu hỏi trong phiên, gán vào Ngân hàng đề thi chính thức được chỉ định và cộng điểm cống hiến cho sinh viên (+20đ/câu).',
      params: [],
      requestBody: {
        sessionId: 'sess_pending_01',
        questionIds: ['q_04', 'q_06', 'q_07'],
        targetBankName: 'Ngân hàng đề thi chính thức: Cơ sở dữ liệu [Đề thi kết thúc học phần (K64-K66)]',
        note: 'Đạt chuẩn kiểm duyệt kiến thức, câu hỏi có tính phân loại cao.',
        autoPost: true
      },
      responseBody: {
        success: true,
        approvedCount: 3,
        bonusPointsAwarded: 60,
        postCreated: true
      }
    },
    {
      method: 'GET',
      path: '/sessions/pending',
      summary: 'Lấy danh sách phiên đề xuất chờ duyệt',
      color: 'bg-blue-600',
      badgeColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800',
      description: 'Truy vấn danh sách các phiên đề xuất từ sinh viên đang ở trạng thái PENDING hoặc IN_REVIEW, hỗ trợ phân trang và lọc theo môn học.',
      params: [
        { name: 'subject', type: 'string (query)', required: false, desc: 'Lọc theo môn học (vd: Cơ sở dữ liệu)' },
        { name: 'page', type: 'integer (query)', required: false, desc: 'Trang hiện tại (mặc định 1)' }
      ],
      requestBody: null,
      responseBody: {
        totalPending: 2,
        sessions: [
          {
            id: 'sess_pending_01',
            title: 'Bộ câu hỏi trắc nghiệm Chuẩn hoá CSDL...',
            subject: 'Cơ sở dữ liệu',
            questionsCount: 4,
            submittedAt: 'Hôm nay lúc 09:30'
          },
          {
            id: 'sess_pending_02',
            title: 'Đề xuất trắc nghiệm Quản lý Bế tắc (Deadlock)...',
            subject: 'Hệ điều hành',
            questionsCount: 2,
            submittedAt: 'Hôm nay lúc 14:15'
          }
        ]
      }
    },
    {
      method: 'POST',
      path: '/sessions/reject',
      summary: 'Từ chối danh sách câu hỏi',
      color: 'bg-emerald-600',
      badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800',
      description: 'Từ chối câu hỏi không đạt yêu cầu sư phạm, kèm lý do phản hồi chi tiết để sinh viên biết điểm cần hoàn thiện và có thể nộp lại.',
      params: [],
      requestBody: {
        sessionId: 'sess_pending_01',
        questionIds: ['q_08'],
        reason: 'Trùng lặp với câu hỏi đã có sẵn trong ngân hàng đề cương ôn tập môn học.'
      },
      responseBody: {
        success: true,
        rejectedCount: 1,
        studentNotified: true
      }
    }
  ];

  const currentApi = apiSpecs[selectedApiIndex];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogId(id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[230] flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1E1F20] h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-[#242526]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Server className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                18. Giảng viên Duyệt Câu hỏi (Question Review)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tài liệu & Nhật ký tương tác 6 API chuẩn theo hình ảnh nghiệp vụ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: SWAGGER vs LIVE LOGS */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 text-xs font-bold bg-white dark:bg-[#1E1F20]">
          <button
            onClick={() => setActiveTab('SWAGGER')}
            className={`flex-1 py-3 border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'SWAGGER'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Đặc tả 6 API Swagger (Trong ảnh)</span>
          </button>
          <button
            onClick={() => setActiveTab('LIVE_LOGS')}
            className={`flex-1 py-3 border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'LIVE_LOGS'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Nhật ký gọi API thời gian thực ({apiLogs.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {activeTab === 'SWAGGER' ? (
            <div className="space-y-4">
              {/* 6 API Buttons List */}
              <div className="space-y-1.5">
                <span className="text-gray-500 font-bold block text-[11px] uppercase tracking-wider mb-2">
                  Danh mục 6 API Giảng viên Duyệt (Click chọn để xem chi tiết Payload):
                </span>
                {apiSpecs.map((spec, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedApiIndex(idx)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      selectedApiIndex === idx
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-600'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#242526] hover:bg-gray-50 dark:hover:bg-[#2A2B2D]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black text-white ${spec.color}`}
                      >
                        {spec.method}
                      </span>
                      <span className="font-mono font-bold text-gray-800 dark:text-gray-200 text-xs">
                        {spec.path}
                      </span>
                      <span className="text-gray-500 truncate text-[11px] hidden sm:inline">
                        — {spec.summary}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </div>
                ))}
              </div>

              {/* Selected API Documentation Card */}
              {currentApi && (
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-[#242526] space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded font-black text-white text-xs ${currentApi.color}`}
                      >
                        {currentApi.method}
                      </span>
                      <span className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">
                        {currentApi.path}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed font-medium">
                    {currentApi.description}
                  </p>

                  {/* Path / Query Parameters */}
                  {currentApi.params.length > 0 && (
                    <div>
                      <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Parameters:
                      </span>
                      <div className="space-y-1">
                        {currentApi.params.map((p, i) => (
                          <div
                            key={i}
                            className="p-2 rounded bg-white dark:bg-[#1E1F20] border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                {p.name}
                              </span>{' '}
                              <span className="text-[10px] text-gray-400">({p.type})</span>
                              <p className="text-[11px] text-gray-500 mt-0.5">{p.desc}</p>
                            </div>
                            {p.required && (
                              <span className="text-[10px] font-bold text-red-500">required</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Request Body JSON */}
                  {currentApi.requestBody && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          Request Body (JSON):
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(JSON.stringify(currentApi.requestBody, null, 2), 'req_spec')
                          }
                          className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedLogId === 'req_spec' ? 'Đã sao chép' : 'Sao chép'}</span>
                        </button>
                      </div>
                      <pre className="p-3 rounded-xl bg-gray-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                        {JSON.stringify(currentApi.requestBody, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Response Body JSON */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-700 dark:text-gray-300">
                        Response Body 200 OK (JSON):
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(JSON.stringify(currentApi.responseBody, null, 2), 'res_spec')
                        }
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedLogId === 'res_spec' ? 'Đã sao chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-gray-900 text-blue-300 font-mono text-[11px] overflow-x-auto">
                      {JSON.stringify(currentApi.responseBody, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Live Logs Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-bold text-[11px] uppercase tracking-wider">
                  Các lệnh API vừa được thực hiện trong phiên ({apiLogs.length})
                </span>
                {apiLogs.length > 0 && (
                  <button
                    onClick={clearApiLogs}
                    className="text-xs text-red-600 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Xóa nhật ký</span>
                  </button>
                )}
              </div>

              {apiLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 bg-gray-50 dark:bg-[#242526] rounded-xl border border-gray-200 dark:border-gray-700">
                  <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold">Chưa có lệnh gọi API nào được ghi nhận</p>
                  <p className="text-[11px] mt-1">
                    Hãy thử thực hiện Duyệt, Từ chối, Sửa câu hỏi hoặc Chốt phiên để thấy live log!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {apiLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-white dark:bg-[#242526] rounded-xl border border-gray-200 dark:border-gray-700 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black text-white ${
                              log.method === 'GET'
                                ? 'bg-blue-600'
                                : log.method === 'POST'
                                ? 'bg-emerald-600'
                                : log.method === 'PUT'
                                ? 'bg-amber-600'
                                : 'bg-red-600'
                            }`}
                          >
                            {log.method}
                          </span>
                          <span className="font-mono font-bold text-xs text-gray-900 dark:text-gray-100">
                            {log.endpoint}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {log.statusCode} OK
                          </span>
                          <span className="text-[10px] text-gray-400">{log.timestamp}</span>
                        </div>
                      </div>

                      <p className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                        {log.title}
                      </p>

                      {log.payload && (
                        <div>
                          <span className="text-[10px] font-bold text-gray-500 block mb-0.5">
                            Payload gửi lên:
                          </span>
                          <pre className="p-2 rounded-lg bg-gray-900 text-emerald-400 font-mono text-[10px] overflow-x-auto">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.response && (
                        <div>
                          <span className="text-[10px] font-bold text-gray-500 block mb-0.5">
                            Response phản hồi:
                          </span>
                          <pre className="p-2 rounded-lg bg-gray-900 text-blue-300 font-mono text-[10px] overflow-x-auto">
                            {JSON.stringify(log.response, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#242526] flex items-center justify-between text-xs text-gray-500">
          <span>Chuẩn đặc tả OpenAPI 3.0 / RESTful</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
