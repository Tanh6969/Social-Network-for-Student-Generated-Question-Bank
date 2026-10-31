import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const ReportModal: React.FC = () => {
  const { isReportModalOpen, closeReportModal, reportTarget, showToast } = useApp();

  const [reason, setReason] = useState('Nội dung sai kiến thức học thuật');
  const [description, setDescription] = useState('');

  if (!isReportModalOpen || !reportTarget) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Cảm ơn bạn đã gửi báo cáo. Ban quản trị sẽ rà soát nội dung trong 24 giờ.', 'success');
    closeReportModal();
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-fb-card rounded-lg shadow-2xl max-w-md w-full p-5 border border-fb-divider space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-fb-divider">
          <div className="flex items-center gap-2 text-red-600">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-bold text-sm text-fb-text">
              Báo cáo vi phạm (REL.13)
            </h3>
          </div>
          <button
            onClick={closeReportModal}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-fb-text-2">
          Đối tượng báo cáo: <strong className="text-fb-text">[{reportTarget.type}] {reportTarget.title}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-fb-text mb-1">
              Chọn lý do vi phạm:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-fb-input"
            >
              <option value="Nội dung sai kiến thức học thuật">Sai kiến thức học thuật / đề sai</option>
              <option value="Spam hoặc quảng cáo">Spam hoặc quảng cáo không liên quan</option>
              <option value="Quấy rối hoặc ngôn từ thù địch">Quấy rối hoặc ngôn từ thù địch</option>
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
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-fb-input"
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
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs"
            >
              Gửi báo cáo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
