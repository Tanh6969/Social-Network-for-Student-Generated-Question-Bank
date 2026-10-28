import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCode,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Plus,
  BookOpen,
  Eye,
  ExternalLink,
} from 'lucide-react';
import {
  examsApi,
  ExamItem,
  CursorPaginationDto,
  SubjectResponse,
} from '../../../../api';
import { ExamExportModal } from './ExamExportModal';

interface ExamListViewProps {
  onSelectExam: (examId: number) => void;
  onNavigateToGenerate: () => void;
  showToast: (message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ExamListView: React.FC<ExamListViewProps> = ({
  onSelectExam,
  onNavigateToGenerate,
  showToast,
}) => {
  // Exams & Pagination data
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [pagination, setPagination] = useState<CursorPaginationDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter params
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | 'ALL'>('ALL');
  const [limit, setLimit] = useState<number>(10);

  // Search keyword for client-side quick filter
  const [searchQuery, setSearchQuery] = useState('');

  // Cursor navigation stack: array of 'after' tokens for each page
  // Page 1: after = undefined
  const [cursorHistory, setCursorHistory] = useState<(number | undefined)[]>([undefined]);
  const [pageIndex, setPageIndex] = useState<number>(0);

  // Export modal state
  const [exportingExam, setExportingExam] = useState<{ id: number; title?: string } | null>(null);

  // Load subjects for filter
  useEffect(() => {
    let isMounted = true;
    const fetchSubjects = async () => {
      try {
        const list = await examsApi.getAllSubjects();
        if (isMounted) setSubjects(list);
      } catch {
        // Fallback
      }
    };
    fetchSubjects();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch exams function
  const fetchExams = useCallback(
    async (cursorAfter?: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await examsApi.getMyExams({
          after: cursorAfter,
          limit,
          subject_id: selectedSubjectId === 'ALL' ? undefined : Number(selectedSubjectId),
        });

        setExams(response.items || []);
        setPagination(response.pagination || null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không thể tải danh sách đề thi.';
        setError(msg);
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    },
    [limit, selectedSubjectId, showToast]
  );

  // Initial fetch and reset when subject or limit changes
  useEffect(() => {
    setCursorHistory([undefined]);
    setPageIndex(0);
    fetchExams(undefined);
  }, [fetchExams, selectedSubjectId, limit]);

  // Handle Next Page (using cursor pagination)
  const handleNextPage = () => {
    if (!pagination?.has_next || pagination.after === undefined) return;
    const nextCursor = pagination.after;
    const nextIndex = pageIndex + 1;

    setCursorHistory((prev) => {
      const updated = [...prev];
      updated[nextIndex] = nextCursor;
      return updated;
    });
    setPageIndex(nextIndex);
    fetchExams(nextCursor);
  };

  // Handle Prev Page (using cursor history)
  const handlePrevPage = () => {
    if (pageIndex <= 0) return;
    const prevIndex = pageIndex - 1;
    const prevCursor = cursorHistory[prevIndex];

    setPageIndex(prevIndex);
    fetchExams(prevCursor);
  };

  // Filter exams by search query
  const filteredExams = exams.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (e.title && e.title.toLowerCase().includes(q)) ||
      (e.subject_name && e.subject_name.toLowerCase().includes(q)) ||
      (e.exam_id && String(e.exam_id).includes(q))
    );
  });

  return (
    <div className="space-y-4 text-xs">
      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề đề thi, tên môn học hoặc mã đề..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold text-[11px] whitespace-nowrap">Môn học:</span>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                setSelectedSubjectId(val);
              }}
              className="py-1.5 px-3 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Tất cả môn học</option>
              {subjects.map((s) => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Limit selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold text-[11px] whitespace-nowrap">Mỗi trang:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="py-1.5 px-2.5 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value={10}>10 đề</option>
              <option value={15}>15 đề</option>
              <option value={20}>20 đề</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchExams(cursorHistory[pageIndex])}
            disabled={loading}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#242526] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-3 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-1/4" />
              <div className="h-8 bg-gray-50 dark:bg-gray-800 rounded-xl w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchExams(cursorHistory[pageIndex])}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredExams.length === 0 && (
        <div className="bg-white dark:bg-[#242526] rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center">
            <FileCode className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
            Chưa có đề thi nào trong danh sách
          </h4>
          <p className="text-gray-500 max-w-md mx-auto text-xs leading-relaxed">
            Bạn chưa tạo đề thi nào phù hợp với bộ lọc hiện tại. Hãy sử dụng tính năng tạo đề thi tự động từ ngân hàng câu hỏi đã phê duyệt.
          </p>
          <button
            type="button"
            onClick={onNavigateToGenerate}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đề thi tự động mới</span>
          </button>
        </div>
      )}

      {/* Exams Grid / List */}
      {!loading && !error && filteredExams.length > 0 && (
        <div className="space-y-3">
          {filteredExams.map((exam) => (
            <div
              key={exam.exam_id}
              className="bg-white dark:bg-[#242526] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition space-y-3 group"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {exam.subject_name && (
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-100 dark:border-blue-900">
                        {exam.subject_name}
                      </span>
                    )}
                    {exam.exam_id && (
                      <span className="text-[11px] font-mono text-gray-400 bg-gray-100 dark:bg-[#3A3B3C] px-2 py-0.5 rounded-md">
                        Mã đề #{exam.exam_id}
                      </span>
                    )}
                  </div>
                  <h4
                    onClick={() => exam.exam_id && onSelectExam(exam.exam_id)}
                    className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 hover:text-blue-600 transition cursor-pointer truncate"
                  >
                    {exam.title || `Đề thi môn ${exam.subject_name || 'chưa đặt tên'}`}
                  </h4>
                </div>

                {/* Right Quick CTAs */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setExportingExam({ id: exam.exam_id!, title: exam.title })
                    }
                    className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    title="Xuất file PDF hoặc Excel"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Xuất file</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exam.exam_id && onSelectExam(exam.exam_id)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem chi tiết</span>
                  </button>
                </div>
              </div>

              {/* Meta details & Difficulty statistics pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-[11px] text-gray-500">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span>{exam.question_count ?? 0} câu hỏi</span>
                  </span>

                  {exam.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Tạo: {new Date(exam.created_at).toLocaleDateString('vi-VN')}</span>
                    </span>
                  )}

                  {exam.download_url && (
                    <a
                      href={exam.download_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải trực tiếp</span>
                    </a>
                  )}
                </div>

                {/* Difficulty Statistics Badges */}
                {exam.statistic && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-900/40">
                      Dễ: {exam.statistic.easy_count ?? 0}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-900/40">
                      TB: {exam.statistic.medium_count ?? 0}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-900/40">
                      Khó: {exam.statistic.hard_count ?? 0}
                    </span>
                    {(exam.statistic.unclassified_count ?? 0) > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-400 font-bold">
                        Chưa PL: {exam.statistic.unclassified_count}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cursor Pagination Bar */}
      {!loading && !error && exams.length > 0 && (
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-4 shadow-xs border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-gray-500">
            Trang hiện tại:{' '}
            <strong className="text-gray-900 dark:text-gray-100 font-bold">
              {pageIndex + 1}
            </strong>
            {pagination?.after && (
              <span className="ml-2 font-mono text-[10px] text-gray-400">
                (Cursor: #{pagination.after})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={pageIndex <= 0}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#242526] text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-[#3A3B3C] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Trang trước</span>
            </button>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={!pagination?.has_next}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#242526] text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-[#3A3B3C] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
            >
              <span>Trang sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportingExam && (
        <ExamExportModal
          isOpen={true}
          examId={exportingExam.id}
          examTitle={exportingExam.title}
          onClose={() => setExportingExam(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
};
