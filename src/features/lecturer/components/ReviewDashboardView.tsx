import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  Layers,
  RotateCcw,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  User as UserIcon,
  ChevronRight,
  ChevronLeft,
  Info,
  FileQuestion,
} from 'lucide-react';
import { useApp } from '../../demo/context/AppContext';
import { errorMessage, PendingSessionItemDto, SubjectResponse } from '../../../api';
import { proposalGateway } from '../../proposals/proposalGateway';
import { SessionReviewDetail } from './SessionReviewDetail';
import {
  describeBankGroups,
  groupByBank,
  ReviewBasketBar,
  type BasketItem,
} from './ReviewBasketBar';
import { RejectReasonModal } from './RejectReasonModal';

type ReviewSidebarTab = 'PENDING' | 'REVIEWING' | 'HISTORY';

export const ReviewDashboardView: React.FC = () => {
  const { showToast } = useApp();

  // Active sidebar tab (exactly 3 tabs as required)
  const [activeTab, setActiveTabSidebar] = useState<ReviewSidebarTab>('PENDING');

  // Currently selected session to inspect / review in detail
  const [selectedSession, setSelectedSession] = useState<PendingSessionItemDto | null>(null);

  // Phiên PENDING/REVIEWING (GET /sessions/pending, đọc hết các trang) + lịch sử nếu có
  const [rawSessions, setRawSessions] = useState<PendingSessionItemDto[]>([]);
  // Completed sessions in current review workflow (for history view)
  const [completedSessions, setCompletedSessions] = useState<PendingSessionItemDto[]>([]);

  // Danh mục môn học cho bộ lọc (GET /subjects)
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);

  // Giỏ câu hỏi chung: câu được tích chọn từ nhiều bộ của nhiều sinh viên
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [basketBusy, setBasketBusy] = useState(false);
  const [isRejectingBasket, setIsRejectingBasket] = useState(false);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const basketIds = useMemo(() => basket.map((i) => i.question_id), [basket]);

  const toggleBasketItem = (item: BasketItem) =>
    setBasket((prev) =>
      prev.some((i) => i.question_id === item.question_id)
        ? prev.filter((i) => i.question_id !== item.question_id)
        : [...prev, item],
    );
  const addBasketItems = (items: BasketItem[]) =>
    setBasket((prev) => [
      ...prev,
      ...items.filter((item) => !prev.some((i) => i.question_id === item.question_id)),
    ]);
  const removeFromBasket = (questionIds: number[]) =>
    setBasket((prev) => prev.filter((i) => !questionIds.includes(i.question_id)));

  const approveBasket = async () => {
    const ids = basket.map((i) => i.question_id);
    if (ids.length === 0) return;
    const summary = describeBankGroups(groupByBank(basket));
    setBasketBusy(true);
    try {
      const res = await proposalGateway.approveQuestions(ids);
      const points =
        res.points_earned !== undefined ? ` (cộng ${res.points_earned} điểm cho tác giả)` : '';
      showToast(`Đã thêm ${summary}${points}`, 'success');
      removeFromBasket(ids);
      setDetailRefreshKey((k) => k + 1);
      void fetchSessions();
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Không thể chọn các câu hỏi vào ngân hàng đề.'), 'error');
    } finally {
      setBasketBusy(false);
    }
  };

  const rejectBasket = async (reason: string) => {
    const ids = basket.map((i) => i.question_id);
    if (ids.length === 0) return;
    setBasketBusy(true);
    try {
      await proposalGateway.rejectQuestions(ids, reason);
      showToast(`Đã đánh dấu không chọn ${ids.length} câu hỏi`, 'success');
      removeFromBasket(ids);
      setIsRejectingBasket(false);
      setDetailRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Không thể đánh dấu không chọn các câu hỏi.'), 'error');
    } finally {
      setBasketBusy(false);
    }
  };

  // Loading & Error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [historyResultFilter, setHistoryResultFilter] = useState<'ALL' | 'RESOLVED' | 'REJECTED'>('ALL');

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);

  // Fetch pending sessions from GET /sessions/pending
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pending, history] = await Promise.all([
        proposalGateway.getPendingSessions(),
        proposalGateway.getReviewHistory(),
      ]);
      setRawSessions([...pending, ...history]);
    } catch (err: unknown) {
      const msg = errorMessage(err, 'Không thể tải danh sách bộ câu hỏi cần xem xét.');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch subjects for subject filter
  const fetchSubjects = useCallback(async () => {
    try {
      // /sessions/my-enrolled-subjects chỉ dành cho sinh viên; giảng viên dùng /subjects.
      const subs = await proposalGateway.getAllSubjects();
      setSubjects(subs);
    } catch {
      // Non-critical, filter can fall back to topics extracted from sessions
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchSubjects();
  }, [fetchSessions, fetchSubjects]);

  // Reset page when tab, filters or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedSubjectId, sortBy, historyResultFilter, itemsPerPage]);

  // Separate sessions strictly by status
  const pendingSessions = useMemo(
    () => rawSessions.filter((s) => s.status === 'PENDING'),
    [rawSessions]
  );

  const reviewingSessions = useMemo(
    () => rawSessions.filter((s) => s.status === 'REVIEWING'),
    [rawSessions]
  );

  const resolvedSessions = useMemo(
    () => rawSessions.filter((s) => s.status === 'RESOLVED'),
    [rawSessions]
  );

  // All completed sessions for History tab (both from initial rawSessions and newly completed in-session)
  const allHistorySessions = useMemo(() => {
    const combined = [...completedSessions];
    resolvedSessions.forEach((r) => {
      if (!combined.some((c) => c.session_id === r.session_id)) {
        combined.push(r);
      }
    });
    return combined;
  }, [completedSessions, resolvedSessions]);

  // Callback when a session is completed in the detail view
  const handleSessionCompleted = (sessionId: number) => {
    // Find the session that was completed
    const finished = rawSessions.find((s) => s.session_id === sessionId);
    if (finished) {
      const resolvedSession: PendingSessionItemDto = {
        ...finished,
        status: 'RESOLVED',
      };
      setCompletedSessions((prev) => [resolvedSession, ...prev.filter((s) => s.session_id !== sessionId)]);
    }

    // Remove from rawSessions; câu của bộ này không còn chờ nên gỡ khỏi giỏ
    setRawSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    setBasket((prev) => prev.filter((i) => i.session_id !== sessionId));
    setSelectedSession(null);
    showToast('Bộ câu hỏi đã chuyển sang mục "Đã xem xét xong".', 'info');
  };

  // Determine current dataset based on active tab
  const currentTabSessions = useMemo(() => {
    if (activeTab === 'PENDING') return pendingSessions;
    if (activeTab === 'REVIEWING') return reviewingSessions;
    return allHistorySessions;
  }, [activeTab, pendingSessions, reviewingSessions, allHistorySessions]);

  // Apply search, subject filter, sort, history status filter
  const filteredSessions = useMemo(() => {
    let result = [...currentTabSessions];

    // Search by title, topic, author name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          (s.title && s.title.toLowerCase().includes(query)) ||
          (s.topic && s.topic.toLowerCase().includes(query)) ||
          (s.author?.full_name && s.author.full_name.toLowerCase().includes(query)) ||
          (s.content && s.content.toLowerCase().includes(query))
      );
    }

    // Filter by subject
    if (selectedSubjectId !== 'ALL') {
      result = result.filter((s) => {
        // Match either subject name or id in topic
        return s.topic === selectedSubjectId;
      });
    }

    // Filter in history view
    if (activeTab === 'HISTORY' && historyResultFilter !== 'ALL') {
      result = result.filter((s) => s.status === historyResultFilter);
    }

    // Sort by created_at
    result.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortBy === 'NEWEST' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [currentTabSessions, searchQuery, selectedSubjectId, historyResultFilter, sortBy, activeTab]);

  // Pagination calculation
  const totalItems = filteredSessions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSessions.slice(start, start + itemsPerPage);
  }, [filteredSessions, currentPage, itemsPerPage]);

  // Collect distinct subject topics from both subjects list and raw sessions
  const distinctTopics = useMemo(() => {
    const topicSet = new Set<string>();
    subjects.forEach((subj) => {
      if (subj.name) topicSet.add(subj.name);
    });
    rawSessions.forEach((s) => {
      if (s.topic) topicSet.add(s.topic);
    });
    return Array.from(topicSet);
  }, [subjects, rawSessions]);

  // Handler to start or continue review on a session
  const handleStartReview = (session: PendingSessionItemDto) => {
    // If opening from PENDING, optimistic transition to REVIEWING
    if (session.status === 'PENDING') {
      setRawSessions((prev) =>
        prev.map((s) =>
          s.session_id === session.session_id ? { ...s, status: 'REVIEWING' } : s
        )
      );
    }
    setSelectedSession(session);
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4">
      {/* Main Container: Left Sidebar + Right Content Area */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* =========================================================================
            LEFT SIDEBAR (3 mục: Chờ xem xét, Đang xem xét, Đã xem xét xong)
            ========================================================================= */}
        <aside className="scrollbar-hover w-full lg:w-64 xl:w-72 shrink-0 bg-fb-card rounded-lg shadow-fb-card p-3 sm:p-4 flex flex-col gap-2 lg:sticky lg:top-18 lg:h-[calc(100vh-5.5rem)] lg:overflow-y-auto">
          <div className="hidden lg:block pb-2 mb-2 border-b border-fb-divider">
            <span className="text-sm font-semibold text-fb-text-2">
              Trạng thái bộ câu hỏi
            </span>
          </div>

          {/* Navigation Items (Responsive: Horizontal on mobile/tablet, vertical on desktop) */}
          <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {/* 1. Chờ kiểm duyệt */}
            <button
              onClick={() => {
                setActiveTabSidebar('PENDING');
                setSelectedSession(null);
              }}
              className={`flex-1 lg:flex-initial flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'PENDING'
                  ? 'bg-fb-blue text-white shadow-xs'
                  : 'text-fb-text hover:bg-fb-hover'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className={`w-4 h-4 ${activeTab === 'PENDING' ? 'text-white' : 'text-fb-warning'}`} />
                <span>Chờ xem xét</span>
              </div>
              <span
                className={`min-w-6 px-2 py-0.5 rounded-full text-center text-xs font-bold tabular-nums ${
                  activeTab === 'PENDING'
                    ? 'bg-white/20 text-white'
                    : 'bg-fb-warning-soft text-fb-warning'
                }`}
              >
                {pendingSessions.length}
              </span>
            </button>

            {/* 2. Đang kiểm duyệt */}
            <button
              onClick={() => {
                setActiveTabSidebar('REVIEWING');
                setSelectedSession(null);
              }}
              className={`flex-1 lg:flex-initial flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'REVIEWING'
                  ? 'bg-fb-blue text-white shadow-xs'
                  : 'text-fb-text hover:bg-fb-hover'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className={`w-4 h-4 ${activeTab === 'REVIEWING' ? 'text-white' : 'text-fb-blue'}`} />
                <span>Đang xem xét</span>
              </div>
              <span
                className={`min-w-6 px-2 py-0.5 rounded-full text-center text-xs font-bold tabular-nums ${
                  activeTab === 'REVIEWING'
                    ? 'bg-white/20 text-white'
                    : 'bg-fb-blue-soft text-fb-blue'
                }`}
              >
                {reviewingSessions.length}
              </span>
            </button>

            {/* 3. Lịch sử kiểm duyệt */}
            <button
              onClick={() => {
                setActiveTabSidebar('HISTORY');
                setSelectedSession(null);
              }}
              className={`flex-1 lg:flex-initial flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'HISTORY'
                  ? 'bg-fb-blue text-white shadow-xs'
                  : 'text-fb-text hover:bg-fb-hover'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <RotateCcw className={`w-4 h-4 ${activeTab === 'HISTORY' ? 'text-white' : 'text-fb-success'}`} />
                <span>Đã xem xét xong</span>
              </div>
              <span
                className={`min-w-6 px-2 py-0.5 rounded-full text-center text-xs font-bold tabular-nums ${
                  activeTab === 'HISTORY'
                    ? 'bg-white/20 text-white'
                    : 'bg-fb-success-soft text-fb-success'
                }`}
              >
                {allHistorySessions.length}
              </span>
            </button>
          </div>

          {/* Helpful Note Box for Lecturer */}
          <div className="hidden lg:block mt-auto p-3 bg-fb-input rounded-lg text-xs leading-relaxed text-fb-text-2">
            <p className="mb-1.5 font-semibold text-sm text-fb-text flex items-center gap-1.5">
              <Info className="w-4 h-4 text-fb-blue shrink-0" />
              Quy trình
            </p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Mở một bộ đang chờ.</li>
              <li>Chọn câu vào ngân hàng đề, hoặc tích vào giỏ để gom từ nhiều bộ.</li>
              <li>Hoàn tất: câu chưa chọn tính là không chọn. Sinh viên không biết câu nào được chọn.</li>
            </ol>
          </div>
        </aside>

        {/* =========================================================================
            RIGHT MAIN CONTENT AREA
            ========================================================================= */}
        <main className="flex-1 min-w-0 w-full flex flex-col gap-4 lg:min-h-[calc(100vh-5.5rem)]">
          <ReviewBasketBar
            items={basket}
            busy={basketBusy}
            onApproveAll={() => void approveBasket()}
            onRejectAll={() => setIsRejectingBasket(true)}
            onRemove={(id) => removeFromBasket([id])}
            onClear={() => setBasket([])}
          />

          {/* If a session is actively opened in detail view, render SessionReviewDetail */}
          {selectedSession ? (
            <SessionReviewDetail
              session={selectedSession}
              onBack={() => {
                setSelectedSession(null);
                fetchSessions();
              }}
              onSessionCompleted={handleSessionCompleted}
              showToast={showToast}
              readOnly={activeTab === 'HISTORY'}
              basketIds={basketIds}
              onToggleBasket={toggleBasketItem}
              onAddToBasket={addBasketItems}
              onQuestionsDecided={removeFromBasket}
              refreshKey={detailRefreshKey}
            />
          ) : (
            <>
              {/* Filter & Search Toolbar */}
              <div className="bg-fb-card rounded-lg p-3 shadow-fb-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 text-sm">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-fb-text-2 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm bộ câu hỏi, môn học, sinh viên"
                    className="w-full h-10 pl-9 pr-3 rounded-full bg-fb-input text-fb-text placeholder:text-fb-text-2 focus:ring-2 focus:ring-fb-blue/40 focus:outline-hidden"
                  />
                </div>

                {/* Subject Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="h-10 max-w-[14rem] truncate appearance-none pl-3 pr-8 rounded-md bg-fb-btn hover:bg-fb-btn-hover text-fb-text font-semibold focus:ring-2 focus:ring-fb-blue/40 focus:outline-hidden cursor-pointer"
                    >
                      <option value="ALL">Tất cả môn học</option>
                      {distinctTopics.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                    <Filter className="w-3.5 h-3.5 text-fb-text-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Sort Order */}
                  <div className="relative shrink-0">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'NEWEST' | 'OLDEST')}
                      className="h-10 max-w-[14rem] truncate appearance-none pl-3 pr-8 rounded-md bg-fb-btn hover:bg-fb-btn-hover text-fb-text font-semibold focus:ring-2 focus:ring-fb-blue/40 focus:outline-hidden cursor-pointer"
                    >
                      <option value="NEWEST">Mới nhất</option>
                      <option value="OLDEST">Cũ nhất</option>
                    </select>
                    <ArrowUpDown className="w-3.5 h-3.5 text-fb-text-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <button
                    onClick={fetchSessions}
                    disabled={loading}
                    title="Làm mới"
                    aria-label="Làm mới danh sách"
                    className="w-10 h-10 shrink-0 rounded-md bg-fb-btn hover:bg-fb-btn-hover text-fb-text flex items-center justify-center transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="bg-fb-card rounded-lg p-5 border border-fb-divider animate-pulse space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <div className="h-5 w-24 bg-fb-btn rounded-full" />
                        <div className="h-4 w-16 bg-fb-btn rounded-md" />
                      </div>
                      <div className="h-6 w-3/4 bg-fb-btn rounded-md" />
                      <div className="h-12 w-full bg-fb-input rounded-lg" />
                      <div className="h-8 w-full bg-fb-btn rounded-lg" />
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {!loading && error && (
                <div className="flex-1 bg-fb-card rounded-lg shadow-fb-card p-8 text-center flex flex-col items-center justify-center gap-3">
                  <AlertCircle className="w-10 h-10 text-fb-danger" />
                  <h3 className="font-bold text-sm text-fb-text">
                    Không thể tải danh sách bộ câu hỏi
                  </h3>
                  <p className="text-xs text-fb-danger max-w-md mx-auto">
                    {error}
                  </p>
                  <button
                    onClick={fetchSessions}
                    className="px-4 py-2 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Thử lại</span>
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && filteredSessions.length === 0 && (
                <div className="flex-1 bg-fb-card rounded-lg shadow-fb-card px-6 py-12 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-fb-input flex items-center justify-center shrink-0">
                    {activeTab === 'PENDING' ? (
                      <CheckCircle2 className="w-8 h-8 text-fb-success" />
                    ) : (
                      <FileQuestion className="w-8 h-8 text-fb-text-3" />
                    )}
                  </div>
                  <h3 className="font-bold text-base leading-6 min-h-6 text-fb-text">
                    {activeTab === 'PENDING'
                      ? 'Không có bộ câu hỏi nào đang chờ xem xét'
                      : activeTab === 'REVIEWING'
                      ? 'Không có bộ câu hỏi nào đang được xem xét'
                      : 'Chưa có bộ câu hỏi nào đã xem xét xong'}
                  </h3>
                  <p className="text-sm leading-5 min-h-10 max-w-md mx-auto text-fb-text-2">
                    {activeTab === 'PENDING'
                      ? 'Tất cả các đề xuất câu hỏi từ sinh viên đã được tiếp nhận và xử lý đầy đủ.'
                      : activeTab === 'REVIEWING'
                      ? 'Khi sinh viên đăng bộ câu hỏi mới, bộ đó sẽ xuất hiện ở đây.'
                      : 'Các phiên sau khi giảng viên chốt hoàn tất sẽ được lưu trữ tại đây.'}
                  </p>
                </div>
              )}

              {/* Session Cards Grid */}
              {!loading && !error && filteredSessions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paginatedSessions.map((session) => (
                    <article
                      key={session.session_id}
                      className="bg-fb-card rounded-lg shadow-fb-card p-4 flex flex-col gap-3 transition hover:ring-1 hover:ring-fb-blue/40 group"
                    >
                      {/* Tác giả + thời gian, kiểu một bài đăng */}
                      <div className="flex items-center gap-2.5">
                        {session.author?.avatar_url ? (
                          <img
                            src={session.author.avatar_url}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <span className="w-9 h-9 rounded-full bg-fb-blue-soft flex items-center justify-center text-fb-blue shrink-0">
                            <UserIcon className="w-4 h-4" aria-hidden="true" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1 leading-tight">
                          <p className="text-sm font-semibold text-fb-text truncate">
                            {session.author?.full_name || 'Sinh viên'}
                          </p>
                          {session.created_at && (
                            <p
                              className="text-xs text-fb-text-2 tabular-nums"
                              title={new Date(session.created_at).toLocaleString('vi-VN')}
                            >
                              {new Date(session.created_at).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tiêu đề + mô tả */}
                      <div className="flex-1 min-h-[3.5rem]">
                        <h3
                          className="text-card-title font-bold text-fb-text line-clamp-2 [overflow-wrap:anywhere] group-hover:text-fb-blue transition"
                          title={session.title}
                        >
                          {session.title?.trim() || 'Bộ câu hỏi chưa đặt tên'}
                        </h3>
                        {session.content && (
                          <p className="mt-1 text-sm text-fb-text-2 line-clamp-2 [overflow-wrap:anywhere]">
                            {session.content}
                          </p>
                        )}
                      </div>

                      {/* Môn học + hành động */}
                      <div className="pt-3 border-t border-fb-divider flex items-center justify-between gap-2">
                        <span
                          className="min-w-0 truncate px-2.5 py-0.5 rounded-full text-xs font-semibold bg-fb-blue-soft text-fb-blue"
                          title={session.topic}
                        >
                          {session.topic || 'Chưa rõ môn'}
                        </span>
                        <button
                          onClick={() => handleStartReview(session)}
                          className={`shrink-0 h-9 px-3.5 rounded-md text-sm font-semibold transition flex items-center gap-1 cursor-pointer ${
                            activeTab === 'HISTORY'
                              ? 'bg-fb-btn hover:bg-fb-btn-hover text-fb-text'
                              : 'bg-fb-blue hover:bg-fb-blue-hover text-white'
                          }`}
                        >
                          {activeTab === 'PENDING'
                            ? 'Xem xét'
                            : activeTab === 'REVIEWING'
                              ? 'Tiếp tục'
                              : 'Xem chi tiết'}
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Pagination Bar */}
              {!loading && !error && totalItems > 0 && (
                <div className="mt-auto bg-fb-card rounded-lg px-4 py-3 shadow-fb-card flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                  {/* Left: Info & items per page selector */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-fb-text-2">
                      Hiển thị{' '}
                      <span className="font-bold text-fb-text">
                        {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                      </span>{' '}
                      -{' '}
                      <span className="font-bold text-fb-text">
                        {Math.min(currentPage * itemsPerPage, totalItems)}
                      </span>{' '}
                      trên tổng số{' '}
                      <span className="font-bold text-fb-text">
                        {totalItems}
                      </span>{' '}
                      bộ
                    </span>

                    <div className="flex items-center gap-1.5 border-l border-fb-divider pl-3">
                      <span className="text-fb-text-2">Mỗi trang:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="h-8 px-2 rounded-md bg-fb-btn text-fb-text text-sm font-semibold focus:outline-hidden cursor-pointer"
                      >
                        <option value={6}>6 bộ</option>
                        <option value={9}>9 bộ</option>
                        <option value={12}>12 bộ</option>
                        <option value={24}>24 bộ</option>
                      </select>
                    </div>
                  </div>

                  {/* Right: Page navigation */}
                  {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-fb-divider text-fb-text-2 hover:bg-fb-hover transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold text-xs"
                      title="Trang trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Trước</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg font-bold transition cursor-pointer text-xs ${
                            currentPage === page
                              ? 'bg-fb-blue text-white shadow-xs'
                              : 'border border-fb-divider text-fb-text hover:bg-fb-hover'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1.5 rounded-lg border border-fb-divider text-fb-text-2 hover:bg-fb-hover transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold text-xs"
                      title="Trang sau"
                    >
                      <span className="hidden sm:inline">Sau</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <RejectReasonModal
        isOpen={isRejectingBasket}
        questionIds={basketIds}
        onClose={() => setIsRejectingBasket(false)}
        onConfirm={rejectBasket}
        isSubmitting={basketBusy}
      />
    </div>
  );
};
