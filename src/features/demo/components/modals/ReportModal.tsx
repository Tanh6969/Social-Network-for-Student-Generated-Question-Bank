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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-md w-full p-5 border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-red-600">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
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

        <p className="text-xs text-gray-600 dark:text-gray-300">
          Đối tượng báo cáo: <strong className="text-gray-900 dark:text-gray-100">[{reportTarget.type}] {reportTarget.title}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
              Chọn lý do vi phạm:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-[#3A3B3C]"
            >
              <option value="Nội dung sai kiến thức học thuật">Sai kiến thức học thuật / đề sai</option>
              <option value="Spam hoặc quảng cáo">Spam hoặc quảng cáo không liên quan</option>
              <option value="Quấy rối hoặc ngôn từ thù địch">Quấy rối hoặc ngôn từ thù địch</option>
              <option value="Vi phạm bản quyền giáo trình">Vi phạm bản quyền tài liệu trường</option>
              <option value="Khác">Lý do khác</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
              Mô tả chi tiết bổ sung:
            </label>
            <textarea
              rows={3}
              placeholder="Cung cấp thêm chi tiết để hội đồng xử lý..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-[#3A3B3C]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeReportModal}
              className="px-4 py-2 border rounded-xl font-semibold text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs"
            >
              Gửi báo cáo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
