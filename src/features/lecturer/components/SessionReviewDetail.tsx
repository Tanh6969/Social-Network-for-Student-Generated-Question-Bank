import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  HelpCircle,
  Edit3,
  Calendar,
  User,
  BookOpen,
  CheckSquare,
  Sparkles,
  ExternalLink,
  Layers,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  PendingSessionItemDto,
  SessionDetailReviewResponse,
  SessionQuestionReviewDto,
  DuplicateWarning,
  EditQuestionResponse,
  reviewApi,
} from '../../../api';
import { RejectReasonModal } from './RejectReasonModal';
import { CompleteReviewModal } from './CompleteReviewModal';
import { EditQuestionModal } from './EditQuestionModal';

interface SessionReviewDetailProps {
  session: PendingSessionItemDto;
  onBack: () => void;
  onSessionCompleted: (sessionId: number) => void;
  showToast: (message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  readOnly?: boolean;
}

export const SessionReviewDetail: React.FC<SessionReviewDetailProps> = ({
  session,
  onBack,
  onSessionCompleted,
  showToast,
  readOnly = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SessionQuestionReviewDto[]>([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicateWarning[]>([]);

  // Selection for bulk actions
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);

  // Action modals
  const [rejectingIds, setRejectingIds] = useState<number[] | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<SessionQuestionReviewDto | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Question filtering & pagination state
  const [questionFilter, setQuestionFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [questionsPerPage, setQuestionsPerPage] = useState<number>(3);
  const [currentQuestionPage, setCurrentQuestionPage] = useState<number>(1);

  // Reset question page when filter or per-page changes
  useEffect(() => {
    setCurrentQuestionPage(1);
  }, [questionFilter, questionsPerPage]);

  // Submitting state
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Fetch session details
  const fetchSessionDetail = useCallback(async () => {
    if (!session.session_id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await reviewApi.getSessionDetailForReview(session.session_id);
      setQuestions(res.items || []);
      setDuplicateWarnings(res.duplicate_warnings || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải chi tiết phiên kiểm duyệt.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [session.session_id, showToast]);

  useEffect(() => {
    fetchSessionDetail();
  }, [fetchSessionDetail]);

  // Bulk selection helpers
  const pendingQuestions = questions.filter((q) => q.status === 'PENDING');
  const allPendingSelected =
    pendingQuestions.length > 0 &&
    pendingQuestions.every((q) => q.question_id && selectedQuestionIds.includes(q.question_id));

  const handleToggleSelectAllPending = () => {
    if (allPendingSelected) {
      setSelectedQuestionIds([]);
    } else {
      const ids = pendingQuestions
        .map((q) => q.question_id)
        .filter((id): id is number => id !== undefined);
      setSelectedQuestionIds(ids);
    }
  };

  const handleToggleSelectQuestion = (qId?: number) => {
    if (!qId) return;
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId],
    );
  };

  // Approve questions
  const handleApprove = async (ids: number[]) => {
    if (ids.length === 0) return;
    setIsApproving(true);
    try {
      const res = await reviewApi.approveQuestions(ids);
      const pointsMsg =
        res.points_earned !== undefined ? ` (Đã cộng ${res.points_earned} điểm thưởng cho tác giả)` : '';
      showToast(`Đã phê duyệt thành công ${ids.length} câu hỏi${pointsMsg}`, 'success');

      // Update question statuses in state
      setQuestions((prev) =>
        prev.map((q) =>
          q.question_id && ids.includes(q.question_id) ? { ...q, status: 'APPROVED' } : q,
        ),
      );
      setSelectedQuestionIds((prev) => prev.filter((id) => !ids.includes(id)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi phê duyệt câu hỏi.';
      showToast(msg, 'error');
    } finally {
      setIsApproving(false);
    }
  };

  // Reject questions
  const handleConfirmReject = async (reason: string) => {
    if (!rejectingIds || rejectingIds.length === 0) return;
    setIsRejecting(true);
    try {
      await reviewApi.rejectQuestions(rejectingIds, reason);
      showToast(`Đã từ chối ${rejectingIds.length} câu hỏi`, 'success');

      // Update question statuses in state
      setQuestions((prev) =>
        prev.map((q) =>
          q.question_id && rejectingIds.includes(q.question_id)
            ? { ...q, status: 'REJECTED' }
            : q,
        ),
      );
      setSelectedQuestionIds((prev) => prev.filter((id) => !rejectingIds.includes(id)));
      setRejectingIds(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi từ chối câu hỏi.';
      showToast(msg, 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  // Edit question saved
  const handleQuestionEdited = (
    updatedResponse: EditQuestionResponse,
    newContent: { content: string; options: any[]; explanation: string },
  ) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.question_id === updatedResponse.question_id) {
          return {
            ...q,
            content: newContent.content,
            options: newContent.options,
            explanation: newContent.explanation,
            status: (updatedResponse.status as any) || q.status,
          };
        }
        return q;
      }),
    );
  };

  // Complete session review
  const handleConfirmComplete = async () => {
    if (!session.session_id) return;
    setIsCompleting(true);
    try {
      await reviewApi.completeSessionReview(session.session_id);
      showToast('Đã hoàn tất kiểm duyệt phiên thành công!', 'success');
      setIsCompleteModalOpen(false);
      onSessionCompleted(session.session_id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể hoàn tất phiên kiểm duyệt.';
      showToast(msg, 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  // Count summaries
  const approvedCount = questions.filter((q) => q.status === 'APPROVED').length;
  const rejectedCount = questions.filter((q) => q.status === 'REJECTED').length;
  const pendingCount = questions.filter((q) => q.status === 'PENDING').length;

  // Filtered and paginated questions
  const filteredQuestions = questions.filter((q) => {
    if (questionFilter === 'ALL') return true;
    return q.status === questionFilter;
  });

  const totalQuestionPages = Math.max(1, Math.ceil(filteredQuestions.length / questionsPerPage));
  const paginatedQuestions = filteredQuestions.slice(
    (currentQuestionPage - 1) * questionsPerPage,
    currentQuestionPage * questionsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Bar: Back button & Complete Review */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#242526] text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>

        {!readOnly && (
          <button
            onClick={() => setIsCompleteModalOpen(true)}
            disabled={isCompleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Hoàn tất kiểm duyệt phiên</span>
          </button>
        )}
      </div>

      {/* Session Metadata Card */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {session.topic || 'Học phần'}
              </span>

              {session.status === 'REVIEWING' ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Đang kiểm duyệt</span>
                </span>
              ) : session.status === 'RESOLVED' ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Đã giải quyết</span>
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Chờ kiểm duyệt</span>
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {session.title || 'Phiên đề xuất câu hỏi'}
            </h3>

            {session.content && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {session.content}
              </p>
            )}
          </div>

          {/* Counts statistics */}
          <div className="flex items-center gap-2 flex-wrap bg-gray-50 dark:bg-[#1E1F20] p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium">
            <span className="text-gray-500">Tổng: <b>{questions.length}</b></span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400">Chờ: <b>{pendingCount}</b></span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400">Đã duyệt: <b>{approvedCount}</b></span>
            <span>•</span>
            <span className="text-red-500">Từ chối: <b>{rejectedCount}</b></span>
          </div>
        </div>

        {/* Footer info: Author & Created time */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            {session.author?.avatar_url ? (
              <img
                src={session.author.avatar_url}
                alt={session.author.full_name || 'Tác giả'}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-gray-400" />
            )}
            <span>
              Người đề xuất:{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {session.author?.full_name || 'Sinh viên'}
              </span>
            </span>
          </div>

          {session.created_at && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>
                Ngày tạo:{' '}
                {new Date(session.created_at).toLocaleString('vi-VN')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Đang tải danh sách câu hỏi trong phiên...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Lỗi tải dữ liệu phiên</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchSessionDetail}
            className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Questions list & Bulk Actions */}
      {!loading && !error && (
        <div className="space-y-4">
          {/* Question Filter & Per-Page Controls */}
          {questions.length > 0 && (
            <div className="bg-white dark:bg-[#242526] rounded-2xl p-3 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-gray-500 font-bold flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Lọc câu hỏi:
                </span>
                <button
                  type="button"
                  onClick={() => setQuestionFilter('ALL')}
                  className={`px-3 py-1.5 rounded-full font-bold transition text-xs cursor-pointer ${
                    questionFilter === 'ALL'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Tất cả ({questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-full font-bold transition text-xs cursor-pointer ${
                    questionFilter === 'PENDING'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                  }`}
                >
                  Chờ duyệt ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionFilter('APPROVED')}
                  className={`px-3 py-1.5 rounded-full font-bold transition text-xs cursor-pointer ${
                    questionFilter === 'APPROVED'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  Đã duyệt ({approvedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionFilter('REJECTED')}
                  className={`px-3 py-1.5 rounded-full font-bold transition text-xs cursor-pointer ${
                    questionFilter === 'REJECTED'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100'
                  }`}
                >
                  Từ chối ({rejectedCount})
                </button>
              </div>

              {/* Questions per page selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 text-[11px]">Mỗi trang:</span>
                <select
                  value={questionsPerPage}
                  onChange={(e) => setQuestionsPerPage(Number(e.target.value))}
                  className="py-1 px-2.5 rounded-lg bg-gray-50 dark:bg-[#3A3B3C] border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-xs font-semibold focus:outline-hidden cursor-pointer"
                >
                  <option value={2}>2 câu</option>
                  <option value={3}>3 câu</option>
                  <option value={5}>5 câu</option>
                  <option value={100}>Tất cả ({questions.length})</option>
                </select>
              </div>
            </div>
          )}

          {/* Bulk Action Bar (only if not read-only and has pending questions) */}
          {!readOnly && pendingQuestions.length > 0 && (
            <div className="bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl p-3.5 border border-blue-200 dark:border-blue-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="select-all-pending"
                  checked={allPendingSelected}
                  onChange={handleToggleSelectAllPending}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="select-all-pending"
                  className="font-semibold text-gray-800 dark:text-gray-200 cursor-pointer select-none"
                >
                  Chọn tất cả ({pendingQuestions.length} câu chờ duyệt)
                </label>
                {selectedQuestionIds.length > 0 && (
                  <span className="text-blue-600 font-bold ml-1">
                    (Đã chọn {selectedQuestionIds.length})
                  </span>
                )}
              </div>

              {selectedQuestionIds.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleApprove(selectedQuestionIds)}
                    disabled={isApproving}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Phê duyệt ({selectedQuestionIds.length}) câu đã chọn</span>
                  </button>

                  <button
                    onClick={() => setRejectingIds(selectedQuestionIds)}
                    disabled={isRejecting}
                    className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Từ chối ({selectedQuestionIds.length}) câu đã chọn</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Question Cards */}
          {filteredQuestions.length === 0 ? (
            <div className="bg-white dark:bg-[#242526] rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 text-xs">
              Không tìm thấy câu hỏi nào phù hợp với bộ lọc đã chọn.
            </div>
          ) : (
            <>
              <div className="space-y-4">
              {paginatedQuestions.map((q, localIdx) => {
                const globalIdx = (currentQuestionPage - 1) * questionsPerPage + localIdx;
                const isSelected = !!q.question_id && selectedQuestionIds.includes(q.question_id);
                const isPending = q.status === 'PENDING';
                const isApproved = q.status === 'APPROVED';
                const isRejected = q.status === 'REJECTED';

                // Duplicate warning matching this question index
                const duplicateWarning = duplicateWarnings.find((w) => w.question_index === globalIdx);

                return (
                  <div
                    key={q.question_id || globalIdx}
                    className={`bg-white dark:bg-[#242526] rounded-2xl border transition shadow-xs overflow-hidden ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                        : isApproved
                        ? 'border-emerald-200 dark:border-emerald-900/60'
                        : isRejected
                        ? 'border-red-200 dark:border-red-900/60'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Duplicate Warning Banner */}
                    {duplicateWarning && (
                      <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1 min-w-0">
                          <p className="font-bold">
                            Cảnh báo trùng lặp tự động (Độ tương đồng:{' '}
                            {Math.round((duplicateWarning.similarity_score || 0) * 100)}% - Tầng:{' '}
                            {duplicateWarning.tier || 'RULE_BASED'})
                          </p>
                          {duplicateWarning.similar_question_id && (
                            <p className="text-[11px] opacity-90">
                              Trùng với câu hỏi ID #{duplicateWarning.similar_question_id} đã có trong hệ thống.
                            </p>
                          )}
                          {duplicateWarning.matched_snipet && (
                            <p className="text-[11px] italic bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900/40">
                              "{duplicateWarning.matched_snipet}"
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-5 space-y-4">
                      {/* Question Header */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          {!readOnly && isPending && q.question_id && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectQuestion(q.question_id)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                            />
                          )}
                          <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#3A3B3C] text-xs font-bold text-gray-700 dark:text-gray-300">
                            Câu {globalIdx + 1}
                          </span>
                          {q.question_id && (
                            <span className="text-[11px] text-gray-400 font-mono">
                              ID: #{q.question_id}
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isApproved ? (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã phê duyệt</span>
                            </span>
                          ) : isRejected ? (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Bị từ chối</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Chờ duyệt</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
                        {q.content}
                      </div>

                      {/* Question Images */}
                      {q.image_urls && q.image_urls.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {q.image_urls.map((imgUrl, imgIdx) => (
                            <a
                              key={imgIdx}
                              href={imgUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-90"
                            >
                              <img
                                src={imgUrl}
                                alt={`Minh họa câu hỏi ${globalIdx + 1}`}
                                className="max-h-48 max-w-xs object-cover rounded-xl"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Options List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {q.options?.map((opt, optIdx) => {
                          const key = opt.key || String.fromCharCode(65 + optIdx);
                          const isCorrect =
                            opt.is_correct ?? (q.correct_answer === key);

                          return (
                            <div
                              key={key}
                              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 font-semibold shadow-2xs'
                                  : 'border-gray-200 dark:border-gray-700/80 bg-gray-50/70 dark:bg-[#1E1F20] text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {key}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="break-words whitespace-pre-wrap leading-relaxed block">
                                  {opt.text}
                                </span>
                                {opt.media_url && (
                                  <img
                                    src={opt.media_url}
                                    alt={`Ảnh đáp án ${key}`}
                                    className="max-h-24 max-w-full rounded-lg mt-1.5 object-cover border border-gray-200 dark:border-gray-700"
                                  />
                                )}
                              </div>
                              {isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                          <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold block">Giải thích đáp án:</span>
                            <span className="whitespace-pre-wrap leading-relaxed">
                              {q.explanation}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Edit Log */}
                      {q.edit_log && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 pt-1 flex items-center gap-2">
                          <span className="font-medium">Nhật ký sửa đổi:</span>
                          <span>
                            {q.edit_log.actor_name || 'Giảng viên'}{' '}
                            {q.edit_log.created_at &&
                              `(${new Date(q.edit_log.created_at).toLocaleString('vi-VN')})`}
                          </span>
                        </div>
                      )}

                      {/* Question Single Actions */}
                      {!readOnly && (
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setEditingQuestion(q)}
                            className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Chỉnh sửa</span>
                          </button>

                          {isPending && q.question_id && (
                            <>
                              <button
                                type="button"
                                onClick={() => setRejectingIds([q.question_id!])}
                                disabled={isRejecting}
                                className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold hover:bg-red-100 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Từ chối</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleApprove([q.question_id!])}
                                disabled={isApproving}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Phê duyệt</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Question Pagination Bar */}
            {totalQuestionPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-[#242526] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xs">
                <p className="text-xs text-gray-500">
                  Hiển thị câu{' '}
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {(currentQuestionPage - 1) * questionsPerPage + 1}
                  </span>{' '}
                  đến{' '}
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {Math.min(currentQuestionPage * questionsPerPage, filteredQuestions.length)}
                  </span>{' '}
                  trên tổng số{' '}
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {filteredQuestions.length}
                  </span>{' '}
                  câu hỏi
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionPage((p) => Math.max(1, p - 1))}
                    disabled={currentQuestionPage <= 1}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#242526] text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3A3B3C] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Trước</span>
                  </button>

                  {Array.from({ length: totalQuestionPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentQuestionPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        pageNum === currentQuestionPage
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-[#242526] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentQuestionPage((p) => Math.min(totalQuestionPages, p + 1))}
                    disabled={currentQuestionPage >= totalQuestionPages}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#242526] text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3A3B3C] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Sau</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )}

      {/* Reject Reason Modal */}
      <RejectReasonModal
        isOpen={rejectingIds !== null}
        questionIds={rejectingIds || []}
        onClose={() => setRejectingIds(null)}
        onConfirm={handleConfirmReject}
        isSubmitting={isRejecting}
      />

      {/* Edit Question Modal */}
      <EditQuestionModal
        isOpen={editingQuestion !== null}
        question={editingQuestion}
        onClose={() => setEditingQuestion(null)}
        onSaved={handleQuestionEdited}
        showToast={showToast}
      />

      {/* Complete Review Modal */}
      <CompleteReviewModal
        isOpen={isCompleteModalOpen}
        sessionId={session.session_id || null}
        sessionTitle={session.title}
        onClose={() => setIsCompleteModalOpen(false)}
        onConfirm={handleConfirmComplete}
        isSubmitting={isCompleting}
      />
    </div>
  );
};
