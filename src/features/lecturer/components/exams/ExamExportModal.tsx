import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { examsApi, ExportResponse } from '../../../../api';

interface ExamExportModalProps {
  isOpen: boolean;
  examId: number;
  examTitle?: string;
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ExamExportModal: React.FC<ExamExportModalProps> = ({
  isOpen,
  examId,
  examTitle,
  onClose,
  showToast,
}) => {
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter'>('A4');
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<ExportResponse | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setExportResult(null);

    try {
      const response = await examsApi.exportExam(examId, {
        format,
        paper_size: paperSize,
        include_answer_key: includeAnswerKey,
      });

      setExportResult(response);
      showToast('Biên dịch file đề thi thành công! Nhấn vào nút tải để lưu về máy.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xuất file đề thi thất bại. Vui lòng thử lại.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (exportResult?.download_url) {
      window.open(exportResult.download_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-150">
      <div className="bg-fb-card rounded-lg shadow-2xl max-w-lg w-full p-5 border border-fb-divider space-y-4">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-fb-divider">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-fb-text">
                Xuất file đề thi
              </h3>
              <p className="text-[11px] text-gray-500 truncate max-w-xs sm:max-w-sm">
                {examTitle || `Đề thi #${examId}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Form Options */}
        <div className="space-y-4 text-xs">
          {/* Format Selection */}
          <div>
            <label className="block font-bold text-fb-text mb-1.5">
              Định dạng file xuất:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-lg border flex items-center gap-2.5 transition cursor-pointer ${
                  format === 'pdf'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-600'
                    : 'border-fb-divider hover:bg-fb-hover text-fb-text'
                }`}
              >
                <FileText className="w-5 h-5 text-red-500" />
                <div className="text-left">
                  <div className="font-bold">PDF in ấn</div>
                  <div className="text-[10px] text-gray-400">Định dạng tiêu chuẩn đề thi</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`p-3 rounded-lg border flex items-center gap-2.5 transition cursor-pointer ${
                  format === 'excel'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-600'
                    : 'border-fb-divider hover:bg-fb-hover text-fb-text'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <div className="text-left">
                  <div className="font-bold">Excel (.xlsx)</div>
                  <div className="text-[10px] text-gray-400">Bảng tính và thống kê</div>
                </div>
              </button>
            </div>
          </div>

          {/* Paper size (Only if PDF) */}
          {format === 'pdf' && (
            <div>
              <label className="block font-bold text-fb-text mb-1">
                Khổ giấy in:
              </label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as 'A4' | 'Letter')}
                className="w-full px-3 py-2 rounded-lg bg-fb-input border border-gray-200 dark:border-gray-600 text-fb-text font-semibold focus:outline-hidden"
              >
                <option value="A4">A4 (Tiêu chuẩn Việt Nam - 210 x 297 mm)</option>
                <option value="Letter">Letter (216 x 279 mm)</option>
              </select>
            </div>
          )}

          {/* Include Answer Key Checkbox */}
          <div className="p-3 bg-fb-input rounded-lg border border-fb-divider">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAnswerKey}
                onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-fb-text block">
                  Kèm bảng đáp án đúng
                </span>
                <span className="text-[11px] text-fb-text-2 block">
                  In kèm ma trận phương án đúng ở cuối tài liệu (dành riêng cho Giảng viên chấm thi).
                </span>
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Export Result Success Card */}
          {exportResult && (
            <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Tài liệu đã sẵn sàng tải xuống</span>
              </div>

              <div className="text-[11px] text-fb-text-2 space-y-1">
                {exportResult.questions_count !== undefined && (
                  <p>
                    • Số lượng câu hỏi:{' '}
                    <strong className="text-fb-text">
                      {exportResult.questions_count} câu
                    </strong>
                  </p>
                )}
                {exportResult.file_size_mb !== undefined && (
                  <p>
                    • Dung lượng file:{' '}
                    <strong className="text-fb-text">
                      {exportResult.file_size_mb.toFixed(2)} MB
                    </strong>
                  </p>
                )}
                {exportResult.expires_at && (
                  <p className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>
                      Hết hạn tải lúc:{' '}
                      {new Date(exportResult.expires_at).toLocaleString('vi-VN')}
                    </span>
                  </p>
                )}
              </div>

              {exportResult.download_url && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải file xuống máy ({format.toUpperCase()})</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-fb-divider">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-fb-divider text-fb-text font-semibold text-xs hover:bg-fb-hover transition cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-fb-blue hover:bg-fb-blue-hover text-white font-bold text-xs transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang kết xuất...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Xuất file đề thi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
