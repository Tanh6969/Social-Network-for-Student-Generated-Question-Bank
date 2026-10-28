import React from 'react';
import { AlertCircle, X, CheckCheck } from 'lucide-react';

interface CompleteReviewModalProps {
  isOpen: boolean;
  sessionId: number | null;
  sessionTitle?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting?: boolean;
}

export const CompleteReviewModal: React.FC<CompleteReviewModalProps> = ({
  isOpen,
  sessionId,
  sessionTitle,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  if (!isOpen || !sessionId) return null;

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-600 text-white shadow-xs">
              <CheckCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                Hoàn tất phiên kiểm duyệt
              </h3>
              {sessionTitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                  {sessionTitle}
                </p>
              )}
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
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Bạn có chắc chắn muốn hoàn tất kiểm duyệt phiên này? Các câu hỏi vẫn còn ở
              trạng thái chờ xử lý sẽ bị từ chối. Hành động này có thể không hoàn tác
              được.
            </p>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Hệ thống sẽ chuyển trạng thái phiên sang <span className="font-semibold text-gray-700 dark:text-gray-300">Đã giải quyết (RESOLVED)</span> và tự động gửi thông báo kết quả kiểm duyệt tới tác giả.
          </p>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition cursor-pointer disabled:opacity-50"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>Xác nhận hoàn tất</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
