import React, { useState } from 'react';
import { ProposeSession } from '../../demo/types';
import { useApp } from '../../demo/context/AppContext';
import {
  CheckCheck,
  X,
  CheckCircle2,
  XCircle,
  Edit3,
  Clock,
  Award,
  Sparkles,
  Archive,
  AlertTriangle
} from 'lucide-react';

interface CompleteReviewModalProps {
  session: ProposeSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CompleteReviewModal: React.FC<CompleteReviewModalProps> = ({
  session,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { completeReviewSession } = useApp();

  if (!isOpen || !session) return null;

  const total = session.questions.length;
  const approvedCount = session.questions.filter((q) => q.status === 'APPROVED').length;
  const rejectedCount = session.questions.filter((q) => q.status === 'REJECTED').length;
  const pendingCount = session.questions.filter((q) => q.status === 'PENDING').length;
  const editedCount = session.questions.filter((q) => q.isEditedByLecturer).length;
  const totalPoints = approvedCount * 20;

  const [finalRemarks, setFinalRemarks] = useState(
    approvedCount > 0
      ? `Đã thẩm định và chốt toàn bộ ${total} câu hỏi trong phiên. ${approvedCount} câu đạt chuẩn đã được lưu vào Ngân hàng câu hỏi chính thức của trường.`
      : 'Đã hoàn tất đánh giá toàn bộ phiên đề xuất câu hỏi.'
  );

  const handleConfirm = () => {
    completeReviewSession(session.id, finalRemarks);
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#1D2435] dark:to-[#191F2F]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <CheckCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  Chốt Hoàn Tất Duyệt Phiên Đề Xuất
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  POST /sessions/{session.id}/complete-review
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Lưu kết quả thẩm định và đóng phiên đề xuất vào lịch sử
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

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Notice if still pending */}
          {pendingCount > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 flex items-start gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Lưu ý: Còn {pendingCount} câu hỏi chưa được thẩm định!</span>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Khi chốt phiên, các câu chưa duyệt sẽ được giữ nguyên trạng thái hoặc chuyển sang phiên bổ sung tiếp theo.
                </p>
              </div>
            </div>
          )}

          {/* Session Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl border border-gray-200 dark:border-gray-700 text-center">
              <span className="text-[11px] text-gray-500 block">Tổng số câu</span>
              <span className="text-lg font-black text-gray-900 dark:text-gray-100">{total}</span>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Phê duyệt
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {approvedCount}
              </span>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800 text-center">
              <span className="text-[11px] text-red-700 dark:text-red-300 block flex items-center justify-center gap-1">
                <XCircle className="w-3 h-3" /> Từ chối
              </span>
              <span className="text-lg font-black text-red-600 dark:text-red-400">
                {rejectedCount}
              </span>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 text-center">
              <span className="text-[11px] text-purple-700 dark:text-purple-300 block flex items-center justify-center gap-1">
                <Edit3 className="w-3 h-3" /> GV đã sửa
              </span>
              <span className="text-lg font-black text-purple-600 dark:text-purple-400">
                {editedCount}
              </span>
            </div>
          </div>

          {/* Points awarded banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-orange-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500 text-white">
                <Award className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  Điểm cống hiến cho sinh viên {session.creator.name}
                </span>
                <p className="text-[11px] text-gray-500">
                  +20 điểm với mỗi câu hỏi được duyệt thành công vào ngân hàng
                </p>
              </div>
            </div>
            <span className="text-sm font-black text-amber-600 dark:text-amber-400">
              +{totalPoints} Điểm
            </span>
          </div>

          {/* Final Remarks Textarea */}
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
              Nhận xét tổng kết & Đánh giá kết quả phiên duyệt:
            </label>
            <textarea
              rows={3}
              value={finalRemarks}
              onChange={(e) => setFinalRemarks(e.target.value)}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="Nhập nhận xét tổng quan về chất lượng câu hỏi của phiên..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1E1F20] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition"
          >
            Quay lại kiểm tra
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5"
          >
            <Archive className="w-4 h-4" />
            <span>Chốt hoàn tất duyệt (POST /sessions/{`{id}`}/complete-review)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
