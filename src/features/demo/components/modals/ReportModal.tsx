import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ShieldAlert } from 'lucide-react';
import { isApiSession, reportsApi, type ReportTargetType, type ViolationType } from '../../../../api';

function mapReportTargetType(rawType: string): ReportTargetType | null {
  const normalized = rawType.trim().toUpperCase();
  if (normalized.includes('BÌNH LUẬN') || normalized === 'COMMENT') {
    return 'COMMENT';
  }
  if (normalized.includes('BÀI VIẾT') || normalized === 'POST') {
    return 'POST';
  }
  if (normalized.includes('NGƯỜI DÙNG') || normalized === 'USER') return 'USER';
  return null;
}

export const ReportModal: React.FC = () => {
  const { isReportModalOpen, closeReportModal, reportTarget, showToast } = useApp();

  const [violationType, setViolationType] = useState<ViolationType>('OTHER');
  const [reason, setReason] = useState('Nội dung sai kiến thức học thuật');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isReportModalOpen || !reportTarget) return null;

  const handleReasonChange = (nextReason: string) => {
    setReason(nextReason);
    if (nextReason === 'Spam hoặc quảng cáo') {
      setViolationType('SPAM');
    } else if (nextReason === 'Quấy rối hoặc ngôn từ thù địch') {
      setViolationType('HARASSMENT');
    } else if (nextReason === 'Phát ngôn thù ghét / xúc phạm') {
      setViolationType('HATE_STATEMENT');
    } else {
      setViolationType('OTHER');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isApiSession()) {
      const targetType = mapReportTargetType(reportTarget.type);
      const targetId = Number(reportTarget.id);
      if (!targetType || !Number.isSafeInteger(targetId) || targetId <= 0) {
        showToast('Đối tượng này chưa hỗ trợ gửi báo cáo.', 'error');
        return;
      }
      setIsSubmitting(true);
      try {
        await reportsApi.createReport({
          target_type: targetType,
          target_id: targetId,
          violation_type: violationType,
          description: description.trim() ? `${reason}: ${description.trim()}` : reason,
        });
        showToast(
          'Cảm ơn bạn đã gửi báo cáo. Ban quản trị sẽ rà soát nội dung trong 24 giờ.',
          'success',
        );
        closeReportModal();
        setDescription('');
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Không thể gửi báo cáo vi phạm.',
          'error',
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    showToast(
      'Cảm ơn bạn đã gửi báo cáo. Ban quản trị sẽ rà soát nội dung trong 24 giờ.',
      'success',
    );
    closeReportModal();
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-fb-card rounded-lg shadow-2xl max-w-md w-full p-5 border border-fb-divider space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-fb-divider">
          <div className="flex items-center gap-2 text-fb-danger">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-bold text-sm text-fb-text">
              Báo cáo vi phạm (REL.13)
            </h3>
          </div>
          <button
            onClick={closeReportModal}
            className="p-1 rounded-full hover:bg-fb-hover text-fb-text-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-fb-text-2">
          Đối tượng báo cáo: <strong className="text-fb-text">[{reportTarget.type}] {reportTarget.title}</strong>
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-fb-text mb-1">
              Chọn lý do vi phạm:
            </label>
            <select
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              className="w-full p-2 border border-fb-divider rounded-lg bg-fb-input"
            >
              <option value="Nội dung sai kiến thức học thuật">Sai kiến thức học thuật / đề sai</option>
              <option value="Spam hoặc quảng cáo">Spam hoặc quảng cáo không liên quan</option>
              <option value="Quấy rối hoặc ngôn từ thù địch">Quấy rối hoặc ngôn từ thù địch</option>
              <option value="Phát ngôn thù ghét / xúc phạm">Phát ngôn thù ghét / xúc phạm</option>
              <option value="Vi phạm bản quyền giáo trình">Vi phạm bản quyền tài liệu trường</option>
              <option value="Khác">Lý do khác</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-fb-text mb-1">
              Mô tả chi tiết bổ sung:
            </label>
            <textarea
              rows={3}
              placeholder="Cung cấp thêm chi tiết để hội đồng xử lý..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-fb-divider rounded-lg bg-fb-input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeReportModal}
              className="px-4 py-2 border rounded-lg font-semibold text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-fb-danger hover:bg-fb-danger/90 disabled:opacity-60 text-white rounded-lg font-bold text-xs"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
