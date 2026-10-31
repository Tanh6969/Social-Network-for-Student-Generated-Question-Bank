import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  BookOpen,
  Info,
  Layers,
  Database,
} from 'lucide-react';
import { examsApi, ExportResponse, SubjectResponse } from '../../../../api';

interface QuestionBankExportViewProps {
  showToast: (message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const QuestionBankExportView: React.FC<QuestionBankExportViewProps> = ({ showToast }) => {
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [includeAnswer, setIncludeAnswer] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<ExportResponse | null>(null);

  // Load all subjects for selector
  useEffect(() => {
    let isMounted = true;
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const list = await examsApi.getAllSubjects();
        if (isMounted) {
          setSubjects(list);
          if (list.length > 0 && selectedSubjectId === '') {
            setSelectedSubjectId(list[0].subject_id || '');
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoadingSubjects(false);
      }
    };
    fetchSubjects();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      showToast('Vui lòng chọn môn học cần xuất câu hỏi.', 'warning');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setExportResult(null);

    try {
      const response = await examsApi.exportQuestions({
        subject_id: Number(selectedSubjectId),
        format,
        include_answer: includeAnswer,
      });

      setExportResult(response);
      showToast('Xuất ngân hàng câu hỏi môn học thành công!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xuất ngân hàng câu hỏi. Vui lòng thử lại.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (exportResult?.download_url) {
      window.open(exportResult.download_url, '_blank', 'noopener,noreferrer');
    }
  };

  const selectedSubjectObj = subjects.find((s) => s.subject_id === Number(selectedSubjectId));

  return (
    <div className="space-y-5">
      {/* Scope Disclaimer / Banner */}
      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm">
            Phân biệt: Xuất toàn bộ ngân hàng câu hỏi theo Môn học
          </p>
          <p className="leading-relaxed">
            Chức năng này trích xuất <strong>toàn bộ kho câu hỏi</strong> đã được duyệt thuộc một môn học cụ thể (dành cho lưu trữ thư viện giáo trình hoặc kiểm định chất lượng), <strong>không phải</strong> xuất một đề thi đơn lẻ với số câu giới hạn.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (7 cols) */}
        <form
          onSubmit={handleExport}
          className="lg:col-span-7 bg-fb-card rounded-lg shadow-fb-card p-5 sm:p-6 space-y-5 text-xs"
        >
          <div className="border-b border-fb-divider pb-3">
            <h3 className="text-base font-bold text-fb-text flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span>Cấu hình xuất ngân hàng câu hỏi</span>
            </h3>
            <p className="text-gray-500 text-[11px] mt-0.5">
              Chọn môn học và định dạng file bạn muốn kết xuất từ hệ thống.
            </p>
          </div>

          {/* Subject selection */}
          <div className="space-y-1.5">
            <label className="block font-bold text-fb-text">
              Môn học cần xuất <span className="text-red-500">*</span>:
            </label>
            <div className="relative">
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                disabled={loadingSubjects || isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-lg bg-fb-input border border-gray-200 dark:border-gray-600 text-fb-text font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:opacity-60 cursor-pointer"
              >
                {subjects.length === 0 ? (
                  <option value="">{loadingSubjects ? 'Đang tải danh mục môn học...' : 'Chưa có môn học'}</option>
                ) : (
                  subjects.map((sub) => (
                    <option key={sub.subject_id} value={sub.subject_id}>
                      {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Format selection */}
          <div className="space-y-1.5">
            <label className="block font-bold text-fb-text">
              Định dạng file xuất <span className="text-red-500">*</span>:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                disabled={isSubmitting}
                className={`p-3.5 rounded-lg border flex items-center gap-3 transition cursor-pointer ${
                  format === 'pdf'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-600'
                    : 'border-fb-divider hover:bg-fb-hover text-fb-text'
                }`}
              >
                <FileText className="w-6 h-6 text-red-500 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-xs">Tài liệu PDF</div>
                  <div className="text-[10px] text-gray-400">Trình bày theo trang in</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('excel')}
                disabled={isSubmitting}
                className={`p-3.5 rounded-lg border flex items-center gap-3 transition cursor-pointer ${
                  format === 'excel'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-600'
                    : 'border-fb-divider hover:bg-fb-hover text-fb-text'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-500 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-xs">Bảng tính Excel (.xlsx)</div>
                  <div className="text-[10px] text-gray-400">Dễ phân tích & lọc dữ liệu</div>
                </div>
              </button>
            </div>
          </div>

          {/* Include Answer Option */}
          <div className="p-3.5 bg-fb-input rounded-lg border border-fb-divider">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAnswer}
                onChange={(e) => setIncludeAnswer(e.target.checked)}
                disabled={isSubmitting}
                className="w-4 h-4 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-fb-text block">
                  Kèm đáp án đúng và lời giải chi tiết
                </span>
                <span className="text-[11px] text-fb-text-2 block">
                  Nếu bỏ chọn, file xuất chỉ chứa nội dung đề bài và phương án lựa chọn (phù hợp để in làm tài liệu kiểm tra cho sinh viên).
                </span>
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !selectedSubjectId}
            className="w-full py-3 px-5 rounded-lg bg-fb-blue hover:bg-fb-blue-hover text-white font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý xuất ngân hàng câu hỏi...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Tạo liên kết tải ngân hàng câu hỏi</span>
              </>
            )}
          </button>
        </form>

        {/* Right Info / Result Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Result Card if available */}
          {exportResult ? (
            <div className="bg-fb-card rounded-lg shadow-xs border border-emerald-300 dark:border-emerald-800/80 p-5 space-y-4 text-xs">
              <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>File ngân hàng câu hỏi đã sẵn sàng!</span>
              </div>

              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900/40 space-y-2 text-fb-text">
                <div className="flex justify-between items-center py-1 border-b border-emerald-200/50 dark:border-emerald-900/50">
                  <span className="text-gray-500">Môn học:</span>
                  <span className="font-bold text-fb-text">
                    {selectedSubjectObj?.name || 'Môn học'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-emerald-200/50 dark:border-emerald-900/50">
                  <span className="text-gray-500">Định dạng:</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">
                    {format}
                  </span>
                </div>
                {exportResult.questions_count !== undefined && (
                  <div className="flex justify-between items-center py-1 border-b border-emerald-200/50 dark:border-emerald-900/50">
                    <span className="text-gray-500">Tổng số câu hỏi:</span>
                    <span className="font-bold text-fb-text">
                      {exportResult.questions_count} câu
                    </span>
                  </div>
                )}
                {exportResult.file_size_mb !== undefined && (
                  <div className="flex justify-between items-center py-1 border-b border-emerald-200/50 dark:border-emerald-900/50">
                    <span className="text-gray-500">Dung lượng:</span>
                    <span className="font-bold text-fb-text">
                      {exportResult.file_size_mb.toFixed(2)} MB
                    </span>
                  </div>
                )}
                {exportResult.expires_at && (
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pt-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      Hết hạn tải: {new Date(exportResult.expires_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>

              {exportResult.download_url && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải file ngân hàng câu hỏi ({format.toUpperCase()})</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>
              )}
            </div>
          ) : (
            <div className="bg-fb-card rounded-lg shadow-fb-card p-5 space-y-3 text-xs">
              <h4 className="font-bold text-fb-text flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Hướng dẫn sử dụng</span>
              </h4>
              <ul className="space-y-2 text-fb-text-2 text-[11px] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">•</span>
                  <span>
                    Chỉ các câu hỏi có trạng thái <strong>Đã duyệt (APPROVED)</strong> mới được đưa vào danh sách xuất.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">•</span>
                  <span>
                    File xuất được lưu trữ tạm thời trên hệ thống đám mây (S3/MinIO) và có thời hạn sử dụng.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">•</span>
                  <span>
                    Định dạng Excel có chứa đầy đủ các cột: Nội dung, Phương án A, B, C, D, Đáp án đúng, Độ khó và Chủ đề.
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
