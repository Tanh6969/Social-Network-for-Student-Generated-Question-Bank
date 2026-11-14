import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ShieldAlert } from 'lucide-react';
import { reportsApi, type CreateReportRequest } from '../../../../api/reports';
import { errorMessage } from '../../../../api';

export const ReportModal: React.FC = () => {
  const { isReportModalOpen, closeReportModal, reportTarget, showToast, sessionKind } = useApp();

  const [reason, setReason] = useState<CreateReportRequest['violation_type']>('OTHER');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isReportModalOpen || !reportTarget) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (sessionKind === 'api') {
      const targetType = reportTarget.type === 'BÀI VIẾT' ? 'POST' :
        reportTarget.type === 'NGƯỜI DÙNG' ? 'USER' : null;
      const targetId = Number(reportTarget.id);
      if (!targetType || !Number.isSafeInteger(targetId) || targetId <= 0) {
        setError('Đối tượng này chưa hỗ trợ gửi báo cáo.');
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await reportsApi.create({ target_type: targetType, target_id: targetId,
          violation_type: reason, description: description.trim() || undefined });
      } catch (cause: unknown) {
        setError(errorMessage(cause, 'Không gửi được báo cáo.'));
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    showToast('Đã gửi báo cáo.', 'success');
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

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-fb-text mb-1">
              Chọn lý do vi phạm:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as CreateReportRequest['violation_type'])}
              className="w-full p-2 border border-fb-divider rounded-lg bg-fb-input"
            >
              <option value="OTHER">Nội dung không phù hợp hoặc sai kiến thức</option>
              <option value="SPAM">Spam hoặc quảng cáo</option>
              <option value="HARASSMENT">Quấy rối</option>
              <option value="HATE_STATEMENT">Phát ngôn thù ghét</option>
            </select>
          </div>

          {error && <p role="alert" className="text-fb-danger">{error}</p>}

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
              disabled={busy}
              className="px-5 py-2 bg-fb-danger hover:bg-fb-danger/90 text-white rounded-lg font-bold text-xs"
            >
              {busy ? 'Đang gửi…' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
