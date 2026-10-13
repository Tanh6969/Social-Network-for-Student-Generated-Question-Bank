import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Edit3,
  ThumbsUp,
  FileText,
  User,
  ShieldCheck,
  ChevronRight,
  Filter,
  Layers,
  Send
} from 'lucide-react';
import { Question } from '../../demo/types';

export const ReviewDashboardView: React.FC = () => {
  const {
    sessions,
    approveSession,
    rejectSession,
    currentUser,
    setActiveAIRefineQuestion,
    setIsExportQuestionsOpen,
    setIsExamWizardOpen,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    sessions.find((s) => s.status === 'PENDING')?.id || sessions[0]?.id || ''
  );
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [checkedQuestionIds, setCheckedQuestionIds] = useState<string[]>([]);

  // Modals for approve / reject
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Nội dung diễn đạt chưa rõ ràng và cần bổ sung thêm giải thích.');
  const [approveNote, setApproveNote] = useState('Đạt chuẩn kiến thức đại học, duyệt vào ngân hàng chung.');
  const [autoPostAnnouncement, setAutoPostAnnouncement] = useState(true);

  const pendingSessions = sessions.filter((s) => s.status === 'PENDING');
  const historySessions = sessions.filter((s) => s.status !== 'PENDING');

  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  const activeQuestion = activeSession?.questions[selectedQuestionIndex] || activeSession?.questions[0];

  const handleSelectSession = (id: string) => {
    setSelectedSessionId(id);
    setSelectedQuestionIndex(0);
    const sess = sessions.find((s) => s.id === id);
    if (sess) {
      setCheckedQuestionIds(sess.questions.map((q) => q.id));
    }
  };

  const handleApproveConfirm = () => {
    if (!activeSession) return;
    approveSession(
      activeSession.id,
      checkedQuestionIds.length > 0 ? checkedQuestionIds : activeSession.questions.map((q) => q.id),
      approveNote,
      autoPostAnnouncement
    );
    setIsApproveDialogOpen(false);
  };

  const handleRejectConfirm = () => {
    if (!activeSession) return;
    rejectSession(
      activeSession.id,
      checkedQuestionIds.length > 0 ? checkedQuestionIds : activeSession.questions.map((q) => q.id),
      rejectReason
    );
    setIsRejectDialogOpen(false);
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 space-y-4">
      {/* Top Header & Stats (REVIEW.01) */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                <CheckSquare className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
                Khu Vực Kiểm Duyệt Của Giảng Viên (REVIEW.01 – REVIEW.06)
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Phê chuẩn đề xuất câu hỏi từ sinh viên, đánh giá trùng lặp bằng AI và thêm vào ngân hàng thi trường.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExportQuestionsOpen(true)}
              className="px-3.5 py-2 bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-gray-500" />
              <span>Xuất dữ liệu câu hỏi</span>
            </button>

            <button
              onClick={() => setIsExamWizardOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <Layers className="w-4 h-4" />
              <span>Sinh đề thi chính thức</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards - Thống nhất màu sắc tối giản */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs">
          <div className="p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 block">Phiên chờ duyệt</span>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {pendingSessions.length} phiên
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 block">Duyệt hôm nay</span>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              18 câu
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 block">Tỉ lệ đạt chuẩn</span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              88.4%
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 block">Tổng ngân hàng</span>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              3,520 câu
            </span>
          </div>
        </div>
      </div>

      {/* Tabs PENDING vs HISTORY */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 text-xs font-bold">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`py-2 px-4 border-b-2 transition ${
            activeTab === 'PENDING'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Hàng chờ duyệt ({pendingSessions.length})
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`py-2 px-4 border-b-2 transition ${
            activeTab === 'HISTORY'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Lịch sử đã kiểm duyệt ({historySessions.length})
        </button>
      </div>

      {/* 3-PANEL WORKSPACE (REVIEW.03) */}
      {activeSession ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* PANEL 1: Danh sách câu trong phiên (3 cols) */}
          <div className="lg:col-span-3 bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
              <span className="font-bold text-xs text-gray-700 dark:text-gray-300">
                Câu hỏi trong phiên ({activeSession.questions.length})
              </span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
                {activeSession.subject}
              </span>
            </div>

            <div className="space-y-2">
              {activeSession.questions.map((q, idx) => (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestionIndex(idx)}
                  className={`p-3 rounded-xl border cursor-pointer text-xs transition ${
                    selectedQuestionIndex === idx
                      ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 ring-1 ring-purple-600'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#3A3B3C]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      Câu hỏi #{idx + 1}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Độ khó: {q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'MEDIUM' ? 'TB' : 'Khó'}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-gray-600 dark:text-gray-300 text-[11px]">
                    {q.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* PANEL 2: Chi tiết câu hỏi & AI Duplicate Check (6 cols) */}
          <div className="lg:col-span-6 bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            {activeQuestion ? (
              <>
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                  <div>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">
                      Chi tiết câu hỏi #{selectedQuestionIndex + 1}
                    </span>
                    <p className="text-[11px] text-gray-500">{activeSession.chapter}</p>
                  </div>

                  <button
                    onClick={() => setActiveAIRefineQuestion(activeQuestion)}
                    className="px-3 py-1.5 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold shadow-xs hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nhờ AI tinh chỉnh</span>
                  </button>
                </div>

                {/* AI Duplicate check indicator */}
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Kiểm tra trùng lặp AI: Đạt chuẩn (0% trùng)</span>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Không tìm thấy câu hỏi tương tự trong ngân hàng đề thi toàn trường.
                    </p>
                  </div>
                </div>

                {/* Question body */}
                <div className="bg-gray-50 dark:bg-[#1E1F20] p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                    {activeQuestion.content}
                  </p>
                </div>

                {/* 4 options */}
                <div className="space-y-2 text-xs">
                  {activeQuestion.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        opt.id === activeQuestion.correctAnswer
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-semibold'
                          : 'bg-white dark:bg-[#242526] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>
                        <strong className="mr-1">{opt.id}.</strong> {opt.text}
                      </span>
                      {opt.id === activeQuestion.correctAnswer && (
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                          Đáp án đúng
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl text-xs text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-900/50">
                  <strong>Giải thích chuẩn của tác giả: </strong>
                  {activeQuestion.explanation}
                </div>
              </>
            ) : (
              <p className="text-center text-xs text-gray-400 py-10">Chọn một câu hỏi để kiểm duyệt</p>
            )}
          </div>

          {/* PANEL 3: Thông tin SV & Hành động duyệt (3 cols) */}
          <div className="lg:col-span-3 bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 pb-2 border-b border-gray-100 dark:border-gray-700">
              Sinh viên đề xuất
            </h3>

            <div className="flex items-center gap-3">
              <AvatarWithFrame user={activeSession.creator} size="lg" />
              <div>
                <p className="font-bold text-xs text-gray-900 dark:text-gray-100">
                  {activeSession.creator.name}
                </p>
                <p className="text-[11px] text-gray-500">{activeSession.creator.classOrTitle}</p>
                <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  {activeSession.creator.points} điểm cống hiến
                </span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl text-xs space-y-1 text-gray-600 dark:text-gray-300">
              <p>
                <strong>Phiên gửi:</strong> {activeSession.title}
              </p>
              <p>
                <strong>Thời gian:</strong> {activeSession.submittedAt}
              </p>
              <p>
                <strong>Trạng thái:</strong>{' '}
                <span className="font-bold text-amber-600">{activeSession.status}</span>
              </p>
            </div>

            {/* Actions Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setIsApproveDialogOpen(true)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Chấp nhận & Duyệt vào ngân hàng</span>
              </button>

              <button
                onClick={() => setIsRejectDialogOpen(true)}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Từ chối phiên câu hỏi</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#242526] rounded-xl p-12 text-center text-gray-400">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
          <p className="font-bold text-sm text-gray-700 dark:text-gray-300">
            Không còn phiên nào đang chờ kiểm duyệt!
          </p>
        </div>
      )}

      {/* APPROVE DIALOG (REVIEW.04) */}
      {isApproveDialogOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-md w-full p-5 border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Xác nhận phê duyệt phiên câu hỏi
            </h3>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              Bạn đang chuẩn y các câu hỏi của <strong>{activeSession?.creator.name}</strong> vào
              ngân hàng đề thi chính thức môn <strong>{activeSession?.subject}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Ghi chú của Giảng viên gửi Sinh viên:
              </label>
              <textarea
                rows={2}
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPostAnnouncement}
                onChange={(e) => setAutoPostAnnouncement(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span>Tự động đăng bài thông báo chúc mừng sinh viên trên Bảng tin</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsApproveDialogOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleApproveConfirm}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700"
              >
                Xác nhận phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT DIALOG (REVIEW.05) */}
      {isRejectDialogOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-md w-full p-5 border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Từ chối phiên đề xuất câu hỏi
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Lý do từ chối (Gợi ý sẵn):
              </label>
              <select
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-[#3A3B3C] mb-2"
              >
                <option value="Nội dung diễn đạt chưa rõ ràng và cần bổ sung thêm giải thích.">
                  Diễn đạt chưa rõ ràng
                </option>
                <option value="Trùng lặp với câu hỏi đã có sẵn trong đề cương viện.">
                  Trùng lặp với ngân hàng
                </option>
                <option value="Đáp án chưa chính xác theo giáo trình chuẩn.">
                  Sai đáp án
                </option>
                <option value="Không phù hợp với chuẩn đầu ra học phần.">
                  Không phù hợp chuẩn đầu ra
                </option>
              </select>

              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100"
                placeholder="Nhập phản hồi chi tiết để sinh viên chỉnh sửa..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRejectDialogOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-red-700"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
