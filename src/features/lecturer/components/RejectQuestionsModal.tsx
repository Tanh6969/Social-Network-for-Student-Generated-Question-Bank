import React, { useState } from 'react';
import { Question, ProposeSession } from '../../demo/types';
import { useApp } from '../../demo/context/AppContext';
import {
  XCircle,
  X,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  HelpCircle,
  FileWarning
} from 'lucide-react';

interface RejectQuestionsModalProps {
  session: ProposeSession | null;
  selectedQuestionIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RejectQuestionsModal: React.FC<RejectQuestionsModalProps> = ({
  session,
  selectedQuestionIds,
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen || !session) return null;
  return (
    <RejectQuestionsContent
      key={session.id}
      session={session}
      selectedQuestionIds={selectedQuestionIds}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

const RejectQuestionsContent: React.FC<Omit<RejectQuestionsModalProps, 'isOpen' | 'session'> & { session: ProposeSession }> = ({
  session,
  selectedQuestionIds,
  onClose,
  onSuccess,
}) => {
  const { rejectQuestionsBulk } = useApp();

  const targetQuestions = session.questions.filter((q) =>
    selectedQuestionIds.includes(q.id)
  );

  const [presetReason, setPresetReason] = useState<string>(
    'Nội dung diễn đạt chưa chuẩn sư phạm hoặc thiếu giải thích cơ sở khoa học.'
  );
  const [detailedFeedback, setDetailedFeedback] = useState<string>(
    'Đề nghị sinh viên tham khảo lại giáo trình chính khóa và bổ sung thêm lý giải chi tiết cho từng phương án gây nhiễu.'
  );
  const [allowResubmission, setAllowResubmission] = useState<boolean>(true);

  const presets = [
    {
      label: 'Diễn đạt chưa rõ ràng / Thiếu cơ sở',
      text: 'Nội dung diễn đạt chưa chuẩn sư phạm hoặc thiếu giải thích cơ sở khoa học.'
    },
    {
      label: 'Trùng lặp ngân hàng câu hỏi',
      text: 'Trùng lặp với câu hỏi đã có sẵn trong ngân hàng đề cương ôn tập môn học.'
    },
    {
      label: 'Đáp án không chính xác',
      text: 'Phương án được đánh dấu là đáp án đúng chưa chính xác theo định nghĩa giáo trình chuẩn.'
    },
    {
      label: 'Chưa đạt chuẩn đầu ra (CĐR)',
      text: 'Nội dung câu hỏi nằm ngoài phạm vi chuẩn đầu ra học phần đã được công bố.'
    },
    {
      label: 'Phương án nhiễu chưa hợp lý',
      text: 'Các phương án lựa chọn B, C, D chưa có tính phân hóa sinh viên tốt, cần thiết kế lại phương án nhiễu.'
    }
  ];

  const handleSelectPreset = (text: string) => {
    setPresetReason(text);
    if (!detailedFeedback || detailedFeedback.length < 20) {
      setDetailedFeedback(text);
    }
  };

  const handleConfirm = () => {
    const finalReason = detailedFeedback.trim()
      ? `${presetReason} Chi tiết: ${detailedFeedback.trim()}`
      : presetReason;

    rejectQuestionsBulk(session.id, selectedQuestionIds, finalReason);
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
      <div className="bg-fb-card rounded-lg shadow-2xl max-w-xl w-full border border-fb-divider overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-fb-divider flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-red-600 text-white shadow-xs">
              <XCircle className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-fb-text">
                  Từ Chối Câu Hỏi Đề Xuất
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] tabular-nums font-bold bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30">
                  POST /sessions/reject
                </span>
              </div>
              <p className="text-xs text-fb-text-2">
                Phiên: {session.title} • Người gửi: {session.creator.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-fb-hover transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Warning box */}
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-red-800 dark:text-red-200">
            <FileWarning className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <span className="font-bold block">
                Bạn đang từ chối {targetQuestions.length} câu hỏi trong phiên này
              </span>
              <p className="text-[11px] text-red-700 dark:text-red-300 mt-0.5">
                Sinh viên sẽ nhận được thông báo phản hồi kèm lý do từ chối để có cơ hội học hỏi và hoàn thiện lại.
              </p>
            </div>
          </div>

          {/* Questions list being rejected */}
          <div>
            <label className="block font-bold text-fb-text mb-1.5">
              Các câu hỏi bị từ chối ({targetQuestions.length} câu):
            </label>
            <div className="max-h-32 overflow-y-auto space-y-1 border border-fb-divider rounded-lg p-2 bg-fb-input">
              {targetQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-2 bg-white dark:bg-[#2A2B2D] rounded-lg border border-fb-divider flex items-center justify-between"
                >
                  <span className="font-bold text-fb-text truncate">
                    Câu #{idx + 1}: {q.content}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300 shrink-0">
                    Từ chối
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Preset Reasons */}
          <div>
            <label className="block font-bold text-fb-text mb-1.5">
              Chọn lý do mẫu chuẩn sư phạm:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(p.text)}
                  className={`p-2 rounded-lg text-left border transition text-[11px] font-medium ${
                    presetReason === p.text
                      ? 'border-red-500 bg-red-50/70 dark:bg-red-950/40 text-red-900 dark:text-red-200 font-bold ring-1 ring-red-500'
                      : 'border-fb-divider bg-fb-input text-fb-text hover:bg-gray-100'
                  }`}
                >
                  ● {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed feedback */}
          <div>
            <label className="block font-bold text-fb-text mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-red-500" />
              <span>Ý kiến phản hồi cụ thể cho sinh viên:</span>
            </label>
            <textarea
              rows={3}
              value={detailedFeedback}
              onChange={(e) => setDetailedFeedback(e.target.value)}
              placeholder="Nhập hướng dẫn cụ thể để sinh viên biết cần chỉnh sửa điểm nào..."
              className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-fb-input text-fb-text focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
          </div>

          {/* Resubmit toggle */}
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-[#2A2B2D] border border-fb-divider cursor-pointer">
            <input
              type="checkbox"
              checked={allowResubmission}
              onChange={(e) => setAllowResubmission(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded cursor-pointer"
            />
            <span className="font-semibold text-fb-text flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
              Cho phép sinh viên sửa câu hỏi và nộp lại phiên này để duyệt lần 2
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-fb-divider bg-fb-input flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-fb-hover transition"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            <span>Xác nhận từ chối (POST /sessions/reject)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
