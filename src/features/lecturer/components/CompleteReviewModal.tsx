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
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
      <div className="bg-fb-card rounded-lg shadow-2xl max-w-md w-full border border-fb-divider overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-fb-divider flex items-center justify-between bg-fb-warning-soft">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-fb-warning text-fb-card shadow-xs">
              <CheckCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-fb-text">
                Hoàn tất phiên kiểm duyệt
              </h3>
              {sessionTitle && (
                <p className="text-xs text-fb-text-2 truncate max-w-xs">
                  {sessionTitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-full hover:bg-fb-btn-hover text-fb-text-2 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-fb-warning-soft/80 border border-fb-warning/30 text-fb-warning text-xs">
            <AlertCircle className="w-5 h-5 text-fb-warning shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Bạn có chắc chắn muốn hoàn tất kiểm duyệt phiên này? Các câu hỏi vẫn còn ở
              trạng thái chờ xử lý sẽ bị từ chối. Hành động này có thể không hoàn tác
              được.
            </p>
          </div>

          <p className="text-xs text-fb-text-2">
            Hệ thống sẽ chuyển trạng thái phiên sang <span className="font-semibold text-fb-text">Đã giải quyết (RESOLVED)</span> và tự động gửi thông báo kết quả kiểm duyệt tới tác giả.
          </p>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-fb-divider">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-fb-divider text-xs font-semibold text-fb-text hover:bg-fb-hover transition cursor-pointer disabled:opacity-50"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-fb-blue hover:bg-fb-blue-hover text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && (
                <div className="w-3.5 h-3.5 border-2 border-fb-card border-t-transparent rounded-full animate-spin" />
              )}
              <span>Xác nhận hoàn tất</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
