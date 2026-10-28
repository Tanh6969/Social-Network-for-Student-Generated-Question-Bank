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
  Calendar,
  User as UserIcon,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Info,
  CheckSquare,
  FileQuestion,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../demo/context/AppContext';
import {
  reviewApi,
  sessionsApi,
  PendingSessionItemDto,
  SubjectResponse,
} from '../../../api';
import { SessionReviewDetail } from './SessionReviewDetail';
import { loadStoredMockSessions } from '../mockReviewData';

type ReviewSidebarTab = 'PENDING' | 'REVIEWING' | 'HISTORY';

export const ReviewDashboardView: React.FC = () => {
  const { showToast, setActiveTab } = useApp();

  // Active sidebar tab (exactly 3 tabs as required)
  const [activeTab, setActiveTabSidebar] = useState<ReviewSidebarTab>('PENDING');

  // Currently selected session to inspect / review in detail
  const [selectedSession, setSelectedSession] = useState<PendingSessionItemDto | null>(null);

  // Raw sessions fetched from API (pre-populated with mock sessions so UI renders instantly)
  const [rawSessions, setRawSessions] = useState<PendingSessionItemDto[]>(() => loadStoredMockSessions());
  // Completed sessions in current review workflow (for history view)
  const [completedSessions, setCompletedSessions] = useState<PendingSessionItemDto[]>([]);

  // Enrolled subjects for filtering
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);

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
  const ITEMS_PER_PAGE = 6;

  // Fetch pending sessions from GET /sessions/pending
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reviewApi.getPendingSessions();
      setRawSessions(response.items || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách phiên kiểm duyệt.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch subjects for subject filter
  const fetchSubjects = useCallback(async () => {
    try {
      const subs = await sessionsApi.getMyEnrolledSubjects();
      setSubjects(subs);
    } catch {
      // Non-critical, filter can fall back to topics extracted from sessions
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchSubjects();
  }, [fetchSessions, fetchSubjects]);

  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedSubjectId, sortBy, historyResultFilter]);

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

    // Remove from rawSessions
    setRawSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    setSelectedSession(null);
    showToast('Phiên kiểm duyệt đã được lưu vào lịch sử.', 'info');
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
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSessions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSessions, currentPage]);

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
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 space-y-4">
      {/* Top Page Header */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2.5 rounded-xl bg-purple-600 text-white shadow-xs">
                <CheckSquare className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                Kiểm duyệt câu hỏi
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                Dành cho Giảng viên
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Thẩm định các phiên đề xuất câu hỏi từ sinh viên, phê chuẩn vào ngân hàng đề thi hoặc gửi phản hồi từ chối.
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="px-3.5 py-2 bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Làm mới danh sách phiên"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>

            <button
              onClick={() => setActiveTab('lecturer-bank')}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:hover:bg-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Ngân hàng đề của Giảng viên</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container: Left Sidebar + Right Content Area */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* =========================================================================
            LEFT SIDEBAR (EXACTLY 3 ITEMS: Chờ kiểm duyệt, Đang kiểm duyệt, Lịch sử kiểm duyệt)
            ========================================================================= */}
        <aside className="w-full lg:w-64 xl:w-72 shrink-0 bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-3 sm:p-4 space-y-2">
          <div className="hidden lg:block pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">
              Trạng thái kiểm duyệt
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
              className={`flex-1 lg:flex-initial flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'PENDING'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className={`w-4 h-4 ${activeTab === 'PENDING' ? 'text-white' : 'text-amber-500'}`} />
                <span>Chờ kiểm duyệt</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeTab === 'PENDING'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
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
              className={`flex-1 lg:flex-initial flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'REVIEWING'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className={`w-4 h-4 ${activeTab === 'REVIEWING' ? 'text-white' : 'text-blue-500'}`} />
                <span>Đang kiểm duyệt</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeTab === 'REVIEWING'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
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
              className={`flex-1 lg:flex-initial flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'HISTORY'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <RotateCcw className={`w-4 h-4 ${activeTab === 'HISTORY' ? 'text-white' : 'text-emerald-500'}`} />
                <span>Lịch sử kiểm duyệt</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeTab === 'HISTORY'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {allHistorySessions.length}
              </span>
            </button>
          </div>

          {/* Helpful Note Box for Lecturer */}
          <div className="hidden lg:block mt-4 p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl border border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
            <p className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              Quy trình kiểm duyệt:
            </p>
            <p>1. Chọn phiên Chờ kiểm duyệt để bắt đầu thẩm định.</p>
            <p>2. Phê duyệt, từ chối hoặc chỉnh sửa từng câu hỏi.</p>
            <p>3. Chốt hoàn tất để lưu vào Ngân hàng đề thi trường.</p>
          </div>
        </aside>

        {/* =========================================================================
            RIGHT MAIN CONTENT AREA
            ========================================================================= */}
        <main className="flex-1 min-w-0 w-full space-y-4">
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
            />
          ) : (
            <>
              {/* Notice Banner for HISTORY tab regarding Swagger endpoint limitation */}
              {activeTab === 'HISTORY' && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">
                      Thông tin tra cứu lịch sử kiểm duyệt
                    </p>
                    <p className="leading-relaxed">
                      Hiện tại đặc tả OpenAPI/Swagger của hệ thống chưa cung cấp endpoint chuyên biệt để tra cứu toàn bộ lịch sử các phiên đã hoàn tất (Đề xuất backend bổ sung endpoint <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">GET /sessions/history</code> hoặc tham số lọc <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">status=RESOLVED</code> trong API <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">GET /sessions/pending</code>).
                    </p>
                    <p className="leading-relaxed text-blue-800 dark:text-blue-300">
                      Dưới đây hiển thị các phiên đã được chốt duyệt thành công trong phiên làm việc hiện tại ở chế độ chỉ xem.
                    </p>
                  </div>
                </div>
              )}

              {/* Filter & Search Toolbar */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl p-4 shadow-xs border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tiêu đề phiên, môn học, sinh viên..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                {/* Subject Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="ALL">Tất cả môn học ({distinctTopics.length})</option>
                      {distinctTopics.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                    <Filter className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>

                  {/* History Filter */}
                  {activeTab === 'HISTORY' && (
                    <select
                      value={historyResultFilter}
                      onChange={(e) => setHistoryResultFilter(e.target.value as 'ALL' | 'RESOLVED' | 'REJECTED')}
                      className="pl-3 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="RESOLVED">Đã phê chuẩn (RESOLVED)</option>
                      <option value="REJECTED">Đã từ chối (REJECTED)</option>
                    </select>
                  )}

                  {/* Sort Order */}
                  <div className="relative shrink-0">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'NEWEST' | 'OLDEST')}
                      className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="NEWEST">Mới nhất trước</option>
                      <option value="OLDEST">Cũ nhất trước</option>
                    </select>
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-md" />
                      </div>
                      <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-md" />
                      <div className="h-12 w-full bg-gray-100 dark:bg-gray-800 rounded-xl" />
                      <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded-xl" />
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {!loading && error && (
                <div className="bg-white dark:bg-[#242526] rounded-2xl p-8 border border-red-200 dark:border-red-900/50 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    Không thể tải dữ liệu phiên kiểm duyệt
                  </h3>
                  <p className="text-xs text-red-600 dark:text-red-400 max-w-md mx-auto">
                    {error}
                  </p>
                  <button
                    onClick={fetchSessions}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Thử lại</span>
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && filteredSessions.length === 0 && (
                <div className="bg-white dark:bg-[#242526] rounded-2xl p-12 border border-gray-200 dark:border-gray-700 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-[#3A3B3C] flex items-center justify-center mx-auto text-gray-400">
                    {activeTab === 'PENDING' ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                    ) : (
                      <FileQuestion className="w-7 h-7 text-gray-400" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">
                    {activeTab === 'PENDING'
                      ? 'Không có phiên nào đang chờ kiểm duyệt'
                      : activeTab === 'REVIEWING'
                      ? 'Không có phiên nào đang trong quá trình kiểm duyệt'
                      : 'Chưa có lịch sử phiên kiểm duyệt nào'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    {activeTab === 'PENDING'
                      ? 'Tất cả các đề xuất câu hỏi từ sinh viên đã được tiếp nhận và xử lý đầy đủ.'
                      : activeTab === 'REVIEWING'
                      ? 'Chọn một phiên từ mục "Chờ kiểm duyệt" để bắt đầu quy trình thẩm định.'
                      : 'Các phiên sau khi giảng viên chốt hoàn tất sẽ được lưu trữ tại đây.'}
                  </p>
                </div>
              )}

              {/* Session Cards Grid */}
              {!loading && !error && filteredSessions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paginatedSessions.map((session) => {
                    const isPending = session.status === 'PENDING';
                    const isReviewing = session.status === 'REVIEWING';
                    const isResolved = session.status === 'RESOLVED';

                    return (
                      <div
                        key={session.session_id}
                        className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-between hover:shadow-md transition group"
                      >
                        <div className="space-y-3">
                          {/* Card Header: Subject Topic + Status Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 truncate max-w-[65%]">
                              {session.topic || 'Chưa phân môn'}
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                isPending
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : isReviewing
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {isPending
                                ? 'Chờ kiểm duyệt'
                                : isReviewing
                                ? 'Đang kiểm duyệt'
                                : 'Đã hoàn tất'}
                            </span>
                          </div>

                          {/* Session Title */}
                          <div>
                            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-purple-600 transition line-clamp-2">
                              {session.title || 'Phiên đề xuất không có tiêu đề'}
                            </h3>
                            {session.content && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                {session.content}
                              </p>
                            )}
                          </div>

                          {/* Author Info */}
                          <div className="flex items-center gap-2.5 p-2 bg-gray-50 dark:bg-[#1E1F20] rounded-xl border border-gray-100 dark:border-gray-800">
                            {session.author?.avatar_url ? (
                              <img
                                src={session.author.avatar_url}
                                alt={session.author.full_name || 'Tác giả'}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0">
                                <UserIcon className="w-4 h-4" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-xs text-gray-800 dark:text-gray-200 block truncate">
                                {session.author?.full_name || 'Sinh viên đề xuất'}
                              </span>
                              <span className="text-[10px] text-gray-400 block truncate">
                                Mã tác giả: #{session.author?.user_id || '---'}
                              </span>
                            </div>
                          </div>

                          {/* Creation Time */}
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>
                              Tạo lúc:{' '}
                              {session.created_at
                                ? new Date(session.created_at).toLocaleString('vi-VN')
                                : '---'}
                            </span>
                          </div>
                        </div>

                        {/* Card Footer: Action Button */}
                        <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-gray-400">
                            ID: {session.session_id}
                          </span>

                          {activeTab === 'PENDING' && (
                            <button
                              onClick={() => handleStartReview(session)}
                              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <span>Bắt đầu kiểm duyệt</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {activeTab === 'REVIEWING' && (
                            <button
                              onClick={() => handleStartReview(session)}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <span>Tiếp tục kiểm duyệt</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {activeTab === 'HISTORY' && (
                            <button
                              onClick={() => handleStartReview(session)}
                              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#3A3B3C] dark:hover:bg-[#4E4F50] text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>Xem chi tiết</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Bar */}
              {!loading && !error && totalPages > 1 && (
                <div className="bg-white dark:bg-[#242526] rounded-2xl p-4 shadow-xs border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    Hiển thị{' '}
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                    </span>{' '}
                    -{' '}
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
                    </span>{' '}
                    trên tổng số{' '}
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {totalItems}
                    </span>{' '}
                    phiên
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Trang trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-xl font-bold transition cursor-pointer text-xs ${
                          currentPage === page
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Trang sau"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
