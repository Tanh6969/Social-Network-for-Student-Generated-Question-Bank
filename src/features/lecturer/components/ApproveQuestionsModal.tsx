import React, { useState } from 'react';
import { Question, ProposeSession } from '../../demo/types';
import { useApp } from '../../demo/context/AppContext';
import {
  CheckCircle2,
  X,
  Database,
  Award,
  Share2,
  MessageSquare,
  Sparkles,
  BookCheck,
  Check
} from 'lucide-react';

interface ApproveQuestionsModalProps {
  session: ProposeSession | null;
  selectedQuestionIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ApproveQuestionsModal: React.FC<ApproveQuestionsModalProps> = ({
  session,
  selectedQuestionIds,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { approveQuestionsBulk } = useApp();

  if (!isOpen || !session) return null;

  const targetQuestions = session.questions.filter((q) =>
    selectedQuestionIds.includes(q.id)
  );

  const [targetBankName, setTargetBankName] = useState(
    `Ngân hàng đề thi chính thức: ${session.subject}`
  );
  const [bankFolder, setBankFolder] = useState('Đề thi kết thúc học phần (K64-K66)');
  const [approveNote, setApproveNote] = useState(
    'Câu hỏi đạt chuẩn yêu cầu sư phạm, nội dung chính xác theo giáo trình. Duyệt nạp vào ngân hàng câu hỏi đề thi chung.'
  );
  const [autoPostAnnouncement, setAutoPostAnnouncement] = useState(true);

  const earnedPoints = targetQuestions.length * 20;

  const handleConfirm = () => {
    approveQuestionsBulk(
      session.id,
      selectedQuestionIds,
      `${targetBankName} [${bankFolder}]`,
      approveNote,
      autoPostAnnouncement
    );
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-xl w-full border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-[#1A2D24] dark:to-[#172621]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  Phê Duyệt Câu Hỏi Vào Ngân Hàng Đề
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  POST /sessions/approve
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Phiên: {session.title} • Sinh viên: {session.creator.name}
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

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Summary Box */}
          <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div>
              <span className="font-bold text-emerald-900 dark:text-emerald-200 text-sm block">
                Tích chọn {targetQuestions.length} câu hỏi tiềm năng → Đưa vào trạng thái "Cần edit"
              </span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                Điểm cộng của sinh viên (+{earnedPoints} điểm) được chốt bảo lưu ngay lập tức. Câu hỏi sẽ được chuyển vào <strong>Ngân hàng đề riêng của Giảng viên</strong> để biên tập, tương tác AI và quyết định giữ/loại.
              </p>
            </div>
            <div className="text-right shrink-0 pl-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">
                <Award className="w-3.5 h-3.5" />
                +{earnedPoints} điểm bảo lưu
              </span>
            </div>
          </div>

          {/* List of questions to approve preview */}
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Danh sách câu hỏi được phê duyệt ({targetQuestions.length} câu):
            </label>
            <div className="max-h-40 overflow-y-auto space-y-1.5 border border-gray-200 dark:border-gray-700 rounded-xl p-2 bg-gray-50 dark:bg-[#1E1F20]">
              {targetQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-2 bg-white dark:bg-[#2A2B2D] rounded-lg border border-gray-200 dark:border-gray-700 flex items-start justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-gray-800 dark:text-gray-200 block truncate">
                      Câu #{idx + 1}: {q.content}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Đáp án: {q.correctAnswer} • Độ khó: {q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'MEDIUM' ? 'TB' : 'Khó'}
                      {q.isEditedByLecturer && ' • (Đã hiệu đính bởi GV)'}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                    Đạt chuẩn
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Target Bank Destination */}
          <div className="space-y-2">
            <label className="block font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Chỉ định Ngân Hàng Đề tiếp nhận:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={targetBankName}
                onChange={(e) => setTargetBankName(e.target.value)}
                placeholder="Tên ngân hàng đề..."
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <select
                value={bankFolder}
                onChange={(e) => setBankFolder(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Đề thi kết thúc học phần (K64-K66)">Đề thi kết thúc học phần</option>
                <option value="Đề thi giữa kỳ chính thức">Đề thi giữa kỳ chính thức</option>
                <option value="Ngân hàng câu hỏi tự luyện của sinh viên">Bộ câu hỏi tự luyện tập</option>
                <option value="Kho đề thi Olympic & Chuyên đề nâng cao">Kho đề thi nâng cao</option>
              </select>
            </div>
          </div>

          {/* Lecturer Note */}
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              <span>Ghi chú của Giảng viên (gửi kèm thông báo đến Sinh viên):</span>
            </label>
            <textarea
              rows={2}
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Social Announcement Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 cursor-pointer">
            <input
              type="checkbox"
              checked={autoPostAnnouncement}
              onChange={(e) => setAutoPostAnnouncement(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
            <div className="flex-1">
              <span className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                Tự động đăng bài vinh danh trên Bảng tin mạng xã hội UniSocial
              </span>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Lan tỏa tinh thần học thuật, giúp các sinh viên khác cùng tham gia thử sức và chúc mừng tác giả.
              </p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1E1F20] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5"
          >
            <BookCheck className="w-4 h-4" />
            <span>Xác nhận phê duyệt (POST /sessions/approve)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
