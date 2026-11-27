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
import {
  examsApi,
  errorMessage,
  subjectsFromCourseClasses,
  CourseClassResponse,
  ExamBankSummary,
  ExportResponse,
  SubjectResponse,
} from '../../../../api';

interface QuestionBankExportViewProps {
  showToast: (message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const QuestionBankExportView: React.FC<QuestionBankExportViewProps> = ({ showToast }) => {
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<CourseClassResponse[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [bankSummary, setBankSummary] = useState<ExamBankSummary | null>(null);
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [includeAnswer, setIncludeAnswer] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<ExportResponse | null>(null);

  // Tải số câu đã duyệt thực tế trong ngân hàng (GET /lecturer/exams/question-bank/{subjectId}/summary)
  useEffect(() => {
    setExportResult(null);
    setError(null);
    if (!selectedSubjectId) {
      setBankSummary(null);
      return;
    }
    let cancelled = false;
    examsApi
      .getBankSummary(Number(selectedSubjectId))
      .then((summary) => {
        if (!cancelled) setBankSummary(summary);
      })
      .catch(() => {
        if (!cancelled) setBankSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSubjectId]);

  // Chỉ tải các môn thuộc lớp học phần giảng viên được phân công trong học kỳ hiện tại
  useEffect(() => {
    let isMounted = true;
    const fetchAssignedSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const classes = await examsApi.getMyCourseClasses();
        const list = subjectsFromCourseClasses(classes);
        if (isMounted) {
          setAssignedClasses(classes);
          setSubjects(list);
          if (list.length > 0) {
            setSelectedSubjectId((prev) => (prev === '' ? list[0].subject_id || '' : prev));
          }
        }
      } catch (err: unknown) {
        if (isMounted) setError(errorMessage(err, 'Không tải được danh sách môn học được phân công.'));
      } finally {
        if (isMounted) setLoadingSubjects(false);
      }
    };
    fetchAssignedSubjects();
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
  const classesForSelectedSubject = assignedClasses.filter(
    (c) =>
      c.subject_id === Number(selectedSubjectId) &&
      c.active_semester !== false,
  );
  const approvedQuestionCount =
    bankSummary?.total_questions ?? exportResult?.questions_count;

  return (
    <div className="space-y-5">
      {/* Scope Disclaimer / Banner */}
      <div className="p-4 rounded-lg bg-fb-blue-soft border border-fb-blue/30 text-xs text-fb-blue flex items-start gap-3">
        <Info className="w-5 h-5 text-fb-blue shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm">
            Xuất ngân hàng câu hỏi theo Môn học (chỉ tính câu hỏi đã duyệt)
          </p>
          <p className="leading-relaxed">
            Thống kê hiển thị các câu hỏi đã được duyệt (<code>APPROVED</code>) trong các phiên đã chốt thuộc môn học bạn phụ trách. Nếu muốn xuất một đề thi với số lượng câu cố định cho lớp của mình, hãy dùng mục <strong>Sinh đề tự động</strong> rồi xuất file đề thi.
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
              <Database className="w-5 h-5 text-fb-blue" />
              <span>Cấu hình xuất ngân hàng câu hỏi</span>
            </h3>
            <p className="text-fb-text-2 text-xs mt-0.5">
              Chỉ hiển thị các môn học thuộc lớp học phần bạn được phân công trong học kỳ hiện tại.
            </p>
          </div>

          {/* Subject selection */}
          <div className="space-y-1.5">
            <label className="block font-bold text-fb-text">
              Môn học cần xuất <span className="text-fb-danger">*</span>:
            </label>
            <div className="relative">
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                disabled={loadingSubjects || isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-lg bg-fb-input border border-fb-divider text-fb-text font-semibold focus:ring-2 focus:ring-fb-blue focus:outline-hidden disabled:opacity-60 cursor-pointer"
              >
                {subjects.length === 0 ? (
                  <option value="">
                    {loadingSubjects
                      ? 'Đang tải môn học được phân công...'
                      : 'Bạn chưa được phân công lớp học phần nào trong học kỳ hiện tại'}
                  </option>
                ) : (
                  subjects.map((sub) => (
                    <option key={sub.subject_id} value={sub.subject_id}>
                      {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            {classesForSelectedSubject.length > 0 && (
              <p className="text-xs text-fb-text-3">
                Lớp bạn phụ trách thuộc môn này:{' '}
                <span className="font-semibold text-fb-text-2">
                  {classesForSelectedSubject.map((c) => c.class_code).filter(Boolean).join(', ')}
                </span>
              </p>
            )}
            {bankSummary?.total_questions !== undefined && (
              <p className="text-xs text-fb-text-3">
                Số câu đã duyệt trong ngân hàng đề (chỉ tính phiên đã chốt):{' '}
                <span className="font-bold text-fb-success">
                  {bankSummary.total_questions} câu
                </span>
              </p>
            )}
          </div>

          {/* Format selection */}
          <div className="space-y-1.5">
            <label className="block font-bold text-fb-text">
              Định dạng file xuất <span className="text-fb-danger">*</span>:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                disabled={isSubmitting}
                className={`p-3.5 rounded-lg border flex items-center gap-3 transition cursor-pointer ${
                  format === 'pdf'
                    ? 'border-fb-blue bg-fb-blue-soft text-fb-blue font-bold ring-1 ring-fb-blue'
                    : 'border-fb-divider hover:bg-fb-hover text-fb-text'
                }`}
              >
                <FileText className="w-6 h-6 text-fb-danger shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-xs">Tài liệu PDF</div>
                  <div className="text-xs text-fb-text-3">Trình bày theo trang in</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('excel')}
                disabled={isSubmitting}
                className={`p-3.5 rounded-lg border flex items-center gap-3 transition cursor-pointer ${
                  format === 'excel'
                    ? 'border-fb-blue bg-fb-blue-soft text-fb-blue font-bold ring-1 ring-fb-blue'
                    : 'border-fb-divider hover:bg-fb-hover text-fb-text'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 text-fb-success shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-xs">Bảng tính Excel (.xlsx)</div>
                  <div className="text-xs text-fb-text-3">Dễ phân tích & lọc dữ liệu</div>
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
                className="w-4 h-4 mt-0.5 text-fb-blue rounded border-fb-divider focus:ring-fb-blue cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-fb-text block">
                  Kèm đáp án đúng và lời giải chi tiết
                </span>
                <span className="text-xs text-fb-text-2 block">
                  Nếu bỏ chọn, file xuất chỉ chứa nội dung đề bài và phương án lựa chọn (phù hợp để in làm tài liệu kiểm tra cho sinh viên).
                </span>
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-lg bg-fb-danger-soft border border-fb-danger/30 text-fb-danger flex items-start gap-2.5">
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
                <div className="w-4 h-4 border-2 border-fb-card border-t-transparent rounded-full animate-spin" />
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
            <div className="bg-fb-card rounded-lg shadow-xs border border-fb-success/30 p-5 space-y-4 text-xs">
              <div className="flex items-center gap-2.5 text-fb-success font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-fb-success" />
                <span>File ngân hàng câu hỏi đã sẵn sàng!</span>
              </div>

              <div className="p-3.5 bg-fb-success-soft/70 rounded-lg border border-fb-success/30 space-y-2 text-fb-text">
                <div className="flex justify-between items-center py-1 border-b border-fb-success/50">
                  <span className="text-fb-text-2">Môn học:</span>
                  <span className="font-bold text-fb-text">
                    {selectedSubjectObj?.name || 'Môn học'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-fb-success/50">
                  <span className="text-fb-text-2">Định dạng:</span>
                  <span className="font-bold text-fb-blue">
                    {format}
                  </span>
                </div>
                {approvedQuestionCount !== undefined && (
                  <div className="flex justify-between items-center py-1 border-b border-fb-success/50">
                    <span className="text-fb-text-2">Tổng số câu hỏi đã duyệt:</span>
                    <span className="font-bold text-fb-success">
                      {approvedQuestionCount} câu
                    </span>
                  </div>
                )}
                {exportResult.file_size_mb !== undefined && (
                  <div className="flex justify-between items-center py-1 border-b border-fb-success/50">
                    <span className="text-fb-text-2">Dung lượng:</span>
                    <span className="font-bold text-fb-text">
                      {exportResult.file_size_mb.toFixed(2)} MB
                    </span>
                  </div>
                )}
                {exportResult.expires_at && (
                  <div className="flex items-center gap-1.5 text-xs text-fb-text-2 pt-1">
                    <Clock className="w-3.5 h-3.5 text-fb-warning" />
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
                  className="w-full py-3 px-4 rounded-lg bg-fb-success hover:bg-fb-success/90 text-white font-bold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer text-xs"
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
                <BookOpen className="w-4 h-4 text-fb-blue" />
                <span>Hướng dẫn sử dụng</span>
              </h4>
              <ul className="space-y-2 text-fb-text-2 text-xs leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-fb-blue">•</span>
                  <span>
                    Xuất file ngân hàng câu hỏi <strong>đã được duyệt</strong> của môn học bạn phụ trách (PDF hoặc Excel).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-fb-blue">•</span>
                  <span>
                    File xuất được lưu trữ tạm thời trên hệ thống đám mây (S3/MinIO) và có thời hạn sử dụng.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-fb-blue">•</span>
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
