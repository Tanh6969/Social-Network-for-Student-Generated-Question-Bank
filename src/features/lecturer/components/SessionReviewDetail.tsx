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
} from '../../../api';
import { proposalGateway } from '../../proposals/proposalGateway';
import { RejectReasonModal } from './RejectReasonModal';
import { CompleteReviewModal } from './CompleteReviewModal';
import { EditQuestionModal } from './EditQuestionModal';
import { QuestionAiRefineModal, type RefinedContent } from './QuestionAiRefineModal';
import type { BasketItem } from './ReviewBasketBar';
import { QuestionListSkeleton } from '../../../shared/components/Skeleton';

interface SessionReviewDetailProps {
  session: PendingSessionItemDto;
  onBack: () => void;
  onSessionCompleted: (sessionId: number) => void;
  showToast: (message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  readOnly?: boolean;
  /** Id các câu đang nằm trong giỏ câu hỏi chung của trang kiểm duyệt. */
  basketIds: number[];
  onToggleBasket: (item: BasketItem) => void;
  onAddToBasket: (items: BasketItem[]) => void;
  /** Báo cho giỏ biết các câu đã được quyết định (chọn/không chọn) để gỡ khỏi giỏ. */
  onQuestionsDecided: (questionIds: number[]) => void;
  /** Tăng giá trị để tải lại phiên (ví dụ sau khi xử lý từ giỏ). */
  refreshKey?: number;
}

export const SessionReviewDetail: React.FC<SessionReviewDetailProps> = ({
  session,
  onBack,
  onSessionCompleted,
  showToast,
  readOnly = false,
  basketIds,
  onToggleBasket,
  onAddToBasket,
  onQuestionsDecided,
  refreshKey = 0,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SessionQuestionReviewDto[]>([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicateWarning[]>([]);


  // Action modals
  const [rejectingIds, setRejectingIds] = useState<number[] | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<SessionQuestionReviewDto | null>(null);
  const [aiQuestion, setAiQuestion] = useState<SessionQuestionReviewDto | null>(null);
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
      const res = await proposalGateway.getSessionDetailForReview(session.session_id);
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
  }, [fetchSessionDetail, refreshKey]);

  // Ngân hàng đích = ngân hàng đề của môn mà sinh viên chọn khi đăng bộ (Swagger
  // không cho đổi môn khi duyệt), nên mọi nút đều ghi rõ tên môn.
  const bankName = session.topic || 'môn của bộ câu hỏi này';

  // Giỏ câu hỏi: tích chọn câu ở nhiều bộ khác nhau rồi xử lý một lần
  const pendingQuestions = questions.filter((q) => q.status === 'PENDING');
  const toBasketItem = (q: SessionQuestionReviewDto): BasketItem => ({
    question_id: q.question_id!,
    content: q.content || '',
    session_id: session.session_id!,
    session_title: session.title || `Bộ câu hỏi #${session.session_id}`,
    topic: session.topic,
  });
  const pendingInBasket = pendingQuestions.filter(
    (q) => q.question_id && basketIds.includes(q.question_id),
  );
  const allPendingInBasket =
    pendingQuestions.length > 0 && pendingInBasket.length === pendingQuestions.length;

  const handleAddAllPendingToBasket = () => {
    onAddToBasket(
      pendingQuestions
        .filter((q) => q.question_id && !basketIds.includes(q.question_id))
        .map(toBasketItem),
    );
  };

  // Approve questions
  const handleApprove = async (ids: number[]) => {
    if (ids.length === 0) return;
    setIsApproving(true);
    try {
      const res = await proposalGateway.approveQuestions(ids);
      const pointsMsg =
        res.points_earned !== undefined ? ` (Đã cộng ${res.points_earned} điểm thưởng cho tác giả)` : '';
      showToast(`Đã thêm ${ids.length} câu vào ngân hàng đề ${bankName}${pointsMsg}`, 'success');

      // Update question statuses in state
      setQuestions((prev) =>
        prev.map((q) =>
          q.question_id && ids.includes(q.question_id) ? { ...q, status: 'APPROVED' } : q,
        ),
      );
      onQuestionsDecided(ids);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi chọn câu hỏi vào ngân hàng đề.';
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
      await proposalGateway.rejectQuestions(rejectingIds, reason);
      showToast(`Đã đánh dấu không chọn ${rejectingIds.length} câu hỏi`, 'success');

      // Update question statuses in state
      setQuestions((prev) =>
        prev.map((q) =>
          q.question_id && rejectingIds.includes(q.question_id)
            ? { ...q, status: 'REJECTED' }
            : q,
        ),
      );
      onQuestionsDecided(rejectingIds);
      setRejectingIds(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi đánh dấu không chọn câu hỏi.';
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

  // Áp dụng bản tinh chỉnh của AI vào câu hỏi đang hiển thị
  const handleAiApplied = (questionId: number, updated: RefinedContent) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.question_id === questionId
          ? {
              ...q,
              content: updated.content,
              options: updated.options,
              explanation: updated.explanation,
            }
          : q,
      ),
    );
  };

  // Complete session review
  const handleConfirmComplete = async () => {
    if (!session.session_id) return;
    setIsCompleting(true);
    try {
      await proposalGateway.completeSessionReview(session.session_id);
      showToast('Đã hoàn tất xem xét bộ câu hỏi.', 'success');
      setIsCompleteModalOpen(false);
      onSessionCompleted(session.session_id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể hoàn tất xem xét bộ câu hỏi.';
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
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-fb-divider">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-fb-divider bg-fb-card text-xs font-semibold text-fb-text hover:bg-fb-hover transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>

        {!readOnly && (
          <button
            onClick={() => setIsCompleteModalOpen(true)}
            disabled={isCompleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-fb-success hover:bg-fb-success/90 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Hoàn tất xem xét bộ câu hỏi</span>
          </button>
        )}
      </div>

      {/* Session Metadata Card */}
      <div className="bg-fb-card rounded-lg p-5 shadow-fb-card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-fb-blue-soft text-fb-blue border border-fb-blue/30">
                {session.topic || 'Học phần'}
              </span>

              {session.status === 'REVIEWING' ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-fb-blue-soft text-fb-blue border border-fb-blue/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Đang xem xét</span>
                </span>
              ) : session.status === 'RESOLVED' ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-fb-success-soft text-fb-success border border-fb-success/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Đã xem xét xong</span>
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-fb-warning-soft text-fb-warning border border-fb-warning/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Chờ xem xét</span>
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-fb-text">
              {session.title || 'Phiên đề xuất câu hỏi'}
            </h3>

            {session.content && (
              <p className="text-sm text-fb-text-2 leading-relaxed whitespace-pre-line">
                {session.content}
              </p>
            )}
          </div>

          {/* Counts statistics */}
          <div className="flex items-center gap-x-4 gap-y-1 flex-wrap bg-fb-input p-2.5 rounded-lg border border-fb-divider text-xs font-medium">
            <span className="text-fb-text-2">Tổng: <b>{questions.length}</b></span>
            <span className="text-fb-warning">Chưa xem xét: <b>{pendingCount}</b></span>
            <span className="text-fb-success">Đã chọn vào ngân hàng: <b>{approvedCount}</b></span>
            <span className="text-fb-danger">Không chọn: <b>{rejectedCount}</b></span>
          </div>
        </div>

        {/* Footer info: Author & Created time */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-fb-text-2 pt-3 border-t border-fb-divider">
          <div className="flex items-center gap-2">
            {session.author?.avatar_url ? (
              <img
                src={session.author.avatar_url}
                alt={session.author.full_name || 'Tác giả'}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-fb-text-3" />
            )}
            <span>
              Người đề xuất:{' '}
              <span className="font-semibold text-fb-text">
                {session.author?.full_name || 'Sinh viên'}
              </span>
            </span>
          </div>

          {session.created_at && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-fb-text-3" />
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
        <QuestionListSkeleton count={3} label="Đang tải danh sách câu hỏi trong phiên…" />
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-5 rounded-lg bg-fb-danger-soft border border-fb-danger/30 text-fb-danger space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Lỗi tải dữ liệu phiên</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchSessionDetail}
            className="px-4 py-1.5 rounded-lg bg-fb-danger text-white text-xs font-semibold hover:bg-fb-danger/90 transition cursor-pointer"
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
            <div className="bg-fb-card rounded-lg p-3 shadow-fb-card flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-fb-text-2 font-bold flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Lọc câu hỏi:
                </span>
                <button
                  type="button"
                  onClick={() => setQuestionFilter('ALL')}
                  className={`px-3 py-1.5 rounded-full font-bold transition text-xs cursor-pointer ${
                    questionFilter === 'ALL'
                      ? 'bg-fb-blue text-white shadow-2xs'
                      : 'bg-fb-input text-fb-text hover:bg-fb-btn-hover'
                  }`}
                >
                  Tất cả ({questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-full font-bold transition text-xs cursor-pointer ${
                    questionFilter === 'PENDING'
                      ? 'bg-fb-warning text-fb-card shadow-2xs'
                      : 'bg-fb-warning-soft text-fb-warning hover:bg-fb-warning/20'
                  }`}
                >
                  Chưa xem xét ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionFilter('APPROVED')}
                  className={`px-3 py-1.5 rounded-full font-bold transition text-xs cursor-pointer ${
                    questionFilter === 'APPROVED'
                      ? 'bg-fb-success text-white shadow-2xs'
                      : 'bg-fb-success-soft text-fb-success hover:bg-fb-success/20'
                  }`}
                >
                  Đã chọn ({approvedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionFilter('REJECTED')}
                  className={`px-3 py-1.5 rounded-full font-bold transition text-xs cursor-pointer ${
                    questionFilter === 'REJECTED'
                      ? 'bg-fb-danger text-white shadow-2xs'
                      : 'bg-fb-danger-soft text-fb-danger hover:bg-fb-danger/20'
                  }`}
                >
                  Không chọn ({rejectedCount})
                </button>
              </div>

              {/* Questions per page selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-fb-text-2 text-xs">Mỗi trang:</span>
                <select
                  value={questionsPerPage}
                  onChange={(e) => setQuestionsPerPage(Number(e.target.value))}
                  className="py-1 px-2.5 rounded-lg bg-fb-input border border-fb-divider text-fb-text text-xs font-semibold focus:outline-hidden cursor-pointer"
                >
                  <option value={2}>2 câu</option>
                  <option value={3}>3 câu</option>
                  <option value={5}>5 câu</option>
                  <option value={100}>Tất cả ({questions.length})</option>
                </select>
              </div>
            </div>
          )}

          {/* Thêm cả bộ vào giỏ câu hỏi chung (xử lý ở thanh giỏ phía trên) */}
          {!readOnly && pendingQuestions.length > 0 && (
            <div className="bg-fb-blue-soft/70 rounded-lg p-3.5 border border-fb-blue/30 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="select-all-pending"
                  checked={allPendingInBasket}
                  disabled={allPendingInBasket}
                  onChange={handleAddAllPendingToBasket}
                  className="w-4 h-4 text-fb-blue rounded border-fb-divider focus:ring-fb-blue cursor-pointer"
                />
                <label
                  htmlFor="select-all-pending"
                  className="font-semibold text-fb-text cursor-pointer select-none"
                >
                  Thêm tất cả {pendingQuestions.length} câu chưa xem xét của bộ này vào giỏ
                </label>
              </div>
              <span className="text-fb-text-2">
                Đã có <b className="text-fb-blue">{pendingInBasket.length}</b> câu của bộ này
                trong giỏ. Có thể chọn tiếp ở các bộ khác rồi xử lý một lần.
              </span>
            </div>
          )}

          {/* Question Cards */}
          {filteredQuestions.length === 0 ? (
            <div className="bg-fb-card rounded-lg border border-fb-divider p-12 text-center text-fb-text-2 text-xs">
              Không tìm thấy câu hỏi nào phù hợp với bộ lọc đã chọn.
            </div>
          ) : (
            <>
              <div className="space-y-4">
              {paginatedQuestions.map((q, localIdx) => {
                const globalIdx = (currentQuestionPage - 1) * questionsPerPage + localIdx;
                const isSelected = !!q.question_id && basketIds.includes(q.question_id);
                const isPending = q.status === 'PENDING';
                const isApproved = q.status === 'APPROVED';
                const isRejected = q.status === 'REJECTED';

                // Duplicate warning matching this question index
                const duplicateWarning = duplicateWarnings.find((w) => w.question_index === globalIdx);

                return (
                  <div
                    key={q.question_id || globalIdx}
                    className={`bg-fb-card rounded-lg border transition shadow-xs overflow-hidden ${
                      isSelected
                        ? 'border-fb-blue ring-2 ring-fb-blue/20'
                        : isApproved
                        ? 'border-fb-success/30'
                        : isRejected
                        ? 'border-fb-danger/30'
                        : 'border-fb-divider'
                    }`}
                  >
                    {/* Duplicate Warning Banner */}
                    {duplicateWarning && (
                      <div className="px-4 py-2.5 bg-fb-warning/10 border-b border-fb-warning/30 text-fb-warning text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-fb-warning shrink-0 mt-0.5" />
                        <div className="space-y-1 min-w-0">
                          <p className="font-bold">
                            Cảnh báo trùng lặp tự động (Độ tương đồng:{' '}
                            {Math.round((duplicateWarning.similarity_score || 0) * 100)}% - Tầng:{' '}
                            {duplicateWarning.tier || 'RULE_BASED'})
                          </p>
                          {duplicateWarning.similar_question_id && (
                            <p className="text-xs opacity-90">
                              Trùng với câu hỏi ID #{duplicateWarning.similar_question_id} đã có trong hệ thống.
                            </p>
                          )}
                          {duplicateWarning.matched_snipet && (
                            <p className="text-xs italic bg-fb-warning-soft p-2 rounded-lg border border-fb-warning/30">
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
                              onChange={() => onToggleBasket(toBasketItem(q))}
                              title="Thêm / bỏ khỏi giỏ câu hỏi"
                              className="w-4 h-4 text-fb-blue rounded border-fb-divider focus:ring-fb-blue cursor-pointer"
                            />
                          )}
                          <span className="px-2.5 py-1 rounded-lg bg-fb-input text-xs font-bold text-fb-text">
                            Câu {globalIdx + 1}
                          </span>
                          {q.question_id && (
                            <span className="text-xs text-fb-text-3 tabular-nums">
                              ID: #{q.question_id}
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isApproved ? (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-fb-success-soft text-fb-success border border-fb-success/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã chọn vào ngân hàng đề</span>
                            </span>
                          ) : isRejected ? (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-fb-danger-soft text-fb-danger border border-fb-danger/30 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Không chọn</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-fb-warning-soft text-fb-warning border border-fb-warning/30 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Chưa xem xét</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="text-sm font-medium text-fb-text whitespace-pre-wrap break-words leading-relaxed">
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
                              className="block relative group rounded-lg overflow-hidden border border-fb-divider hover:opacity-90"
                            >
                              <img
                                src={imgUrl}
                                alt={`Minh họa câu hỏi ${globalIdx + 1}`}
                                className="max-h-48 max-w-xs object-cover rounded-lg"
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
                              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                                isCorrect
                                  ? 'border-fb-success bg-fb-success-soft/70 text-fb-success font-semibold shadow-2xs'
                                  : 'border-fb-divider/80 bg-fb-inset/70 text-fb-text'
                              }`}
                            >
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isCorrect
                                    ? 'bg-fb-success text-white'
                                    : 'bg-fb-btn text-fb-text'
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
                                    className="max-h-24 max-w-full rounded-lg mt-1.5 object-cover border border-fb-divider"
                                  />
                                )}
                              </div>
                              {isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-fb-success shrink-0 mt-0.5" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-3.5 rounded-lg bg-fb-blue-soft/70 border border-fb-blue/30 text-xs text-fb-blue flex items-start gap-2.5">
                          <HelpCircle className="w-4 h-4 text-fb-blue shrink-0 mt-0.5" />
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
                        <div className="text-xs text-fb-text-2 pt-1 flex items-center gap-2">
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
                        <div className="pt-3 border-t border-fb-divider flex flex-wrap items-center justify-end gap-2 text-xs">
                          {q.question_id && (
                            <button
                              type="button"
                              onClick={() => setAiQuestion(q)}
                              className="px-3 py-1.5 rounded-lg border border-fb-blue/30 bg-fb-card text-fb-blue font-semibold hover:bg-fb-blue-soft transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>AI tinh chỉnh</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingQuestion(q)}
                            className="px-3 py-1.5 rounded-lg border border-fb-blue/30 bg-fb-blue-soft text-fb-blue font-semibold hover:bg-fb-blue/20 transition cursor-pointer flex items-center gap-1.5"
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
                                className="px-3 py-1.5 rounded-lg border border-fb-danger/30 bg-fb-danger-soft text-fb-danger font-semibold hover:bg-fb-danger/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Không chọn</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleApprove([q.question_id!])}
                                disabled={isApproving}
                                className="px-3.5 py-1.5 rounded-lg bg-fb-success hover:bg-fb-success/90 text-white font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Chọn vào ngân hàng đề {bankName}</span>
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
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-fb-card rounded-lg border border-fb-divider shadow-2xs">
                <p className="text-xs text-fb-text-2">
                  Hiển thị câu{' '}
                  <span className="font-bold text-fb-text">
                    {(currentQuestionPage - 1) * questionsPerPage + 1}
                  </span>{' '}
                  đến{' '}
                  <span className="font-bold text-fb-text">
                    {Math.min(currentQuestionPage * questionsPerPage, filteredQuestions.length)}
                  </span>{' '}
                  trên tổng số{' '}
                  <span className="font-bold text-fb-text">
                    {filteredQuestions.length}
                  </span>{' '}
                  câu hỏi
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionPage((p) => Math.max(1, p - 1))}
                    disabled={currentQuestionPage <= 1}
                    className="px-2.5 py-1.5 rounded-lg border border-fb-divider bg-fb-card text-xs font-semibold text-fb-text hover:bg-fb-hover disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
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
                          ? 'bg-fb-blue text-white shadow-fb-card'
                          : 'bg-fb-card text-fb-text hover:bg-fb-hover'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentQuestionPage((p) => Math.min(totalQuestionPages, p + 1))}
                    disabled={currentQuestionPage >= totalQuestionPages}
                    className="px-2.5 py-1.5 rounded-lg border border-fb-divider bg-fb-card text-xs font-semibold text-fb-text hover:bg-fb-hover disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
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

      {/* AI tinh chỉnh câu hỏi */}
      {aiQuestion?.question_id && (
        <QuestionAiRefineModal
          question={{
            question_id: aiQuestion.question_id,
            content: aiQuestion.content || '',
            options: aiQuestion.options || [],
            explanation: aiQuestion.explanation,
          }}
          onClose={() => setAiQuestion(null)}
          onApplied={(updated) => handleAiApplied(aiQuestion.question_id!, updated)}
          showToast={showToast}
        />
      )}

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
