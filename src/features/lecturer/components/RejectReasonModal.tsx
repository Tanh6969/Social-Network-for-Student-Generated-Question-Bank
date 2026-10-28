import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface RejectReasonModalProps {
  isOpen: boolean;
  questionIds: number[];
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  questionIds,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const [reason, setReason] = useState(
    'Nội dung diễn đạt chưa chuẩn sư phạm hoặc đáp án chưa chính xác.',
  );

  const presets = [
    'Nội dung diễn đạt chưa chuẩn sư phạm hoặc thiếu giải thích cơ sở khoa học.',
    'Trùng lặp với câu hỏi đã có sẵn trong ngân hàng câu hỏi môn học.',
    'Phương án được đánh dấu là đáp án đúng chưa chính xác theo giáo trình.',
    'Các phương án lựa chọn gây nhiễu chưa hợp lý, thiếu tính phân hóa.',
    'Nội dung câu hỏi nằm ngoài phạm vi chuẩn đầu ra của học phần.',
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    await onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-red-50/80 dark:bg-red-950/30">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-red-600 text-white shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                Từ chối phê duyệt ({questionIds.length} câu hỏi)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Nhập lý do từ chối để phản hồi cho người đề xuất
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
              Chọn nhanh lý do mẫu:
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border text-left transition cursor-pointer ${
                    reason === preset
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-semibold'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
              Lý do từ chối cụ thể <span className="text-red-500">*</span>:
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do câu hỏi chưa đạt yêu cầu..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1E1F20] text-sm text-gray-900 dark:text-gray-100 focus:border-red-500 focus:outline-hidden resize-y"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>Xác nhận từ chối</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
