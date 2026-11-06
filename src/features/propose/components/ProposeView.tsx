import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../demo/context/AppContext';
import {
  sessionsApi,
  SubjectResponse,
  SubmissionSessionSummary,
  ProposeSessionRequest,
} from '../../../api';
import {
  getStoredSubmissions,
  saveNewStoredSubmission,
  deleteStoredSubmission,
  StoredSubmissionSummary,
} from '../mockSessions';
import { SubmissionDetailModal } from './SubmissionDetailModal';
import { EditSubmissionModal } from './EditSubmissionModal';
import {
  FilePlus,
  ListOrdered,
  Plus,
  Trash2,
  BookOpen,
  CheckCircle2,
  Eye,
  Send,
  Sparkles,
  Filter,
  RefreshCw,
  Edit3,
  Calendar,
  MessageSquare,
  Heart,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Info,
  Clock,
  Search,
  X,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';

export const ProposeView: React.FC = () => {
  const { showToast } = useApp();

  // Active view tab: 'create' | 'my-submissions'
  const [activeTab, setActiveTab] = useState<'create' | 'my-submissions'>('create');

  // Enrolled subjects state
  const [enrolledSubjects, setEnrolledSubjects] = useState<SubjectResponse[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // My Submissions state
  const [allSubmissions, setAllSubmissions] = useState<StoredSubmissionSummary[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState<number | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'REVIEWING' | 'RESOLVED'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'MOST_QUESTIONS'>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [paginationCursor, setPaginationCursor] = useState<{
    after?: number;
    has_next?: boolean;
    has_prev?: boolean;
  }>({});

  // Active modals
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);
  const [selectedEditId, setSelectedEditId] = useState<number | null>(null);

  // Form state for creating a new proposal
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  interface LocalQuestion {
    content: string;
    media_urls: string[];
    options: { key: string; text: string; is_correct: boolean; media_url?: string }[];
    explanation: string;
    llm_generated: boolean;
    confidence: number;
  }

  const [questions, setQuestions] = useState<LocalQuestion[]>([
    {
      content: 'Trong giao thức TCP, cờ (Flag) nào được sử dụng để khởi tạo quá trình bắt tay 3 bước?',
      media_urls: [],
      options: [
        { key: 'A', text: 'SYN', is_correct: true },
        { key: 'B', text: 'ACK', is_correct: false },
        { key: 'C', text: 'FIN', is_correct: false },
        { key: 'D', text: 'RST', is_correct: false },
      ],
      explanation: 'Bên khởi tạo gửi gói tin mang cờ SYN = 1 để đồng bộ số thứ tự chuỗi ban đầu (ISN).',
      llm_generated: false,
      confidence: 4,
    },
  ]);
  const [activeQIndex, setActiveQIndex] = useState(0);

  // Load Enrolled Subjects
  const fetchEnrolledSubjects = useCallback(async () => {
    setLoadingSubjects(true);
    try {
      const data = await sessionsApi.getMyEnrolledSubjects();
      setEnrolledSubjects(data);
      if (data.length > 0 && selectedSubjectId === 0) {
        setSelectedSubjectId(data[0].subject_id || 0);
      }
    } catch {
      // Fallback mock môn học đang tham gia nếu backend chưa sẵn sàng hoặc offline
      const mockSubjects: SubjectResponse[] = [
        { subject_id: 10, code: 'IT3180', name: 'Nhập môn Công nghệ phần mềm' },
        { subject_id: 11, code: 'IT3080', name: 'Mạng máy tính & Truyền thông' },
        { subject_id: 12, code: 'IT3011', name: 'Cấu trúc dữ liệu và giải thuật' },
        { subject_id: 13, code: 'IT3040', name: 'Kiến trúc máy tính & Hệ điều hành' },
      ];
      setEnrolledSubjects(mockSubjects);
      if (selectedSubjectId === 0) {
        setSelectedSubjectId(mockSubjects[0].subject_id || 0);
      }
    } finally {
      setLoadingSubjects(false);
    }
  }, [selectedSubjectId]);

  // Load My Submissions
  const fetchMySubmissions = useCallback(
    async (cursorAfter?: number) => {
      setLoadingSubmissions(true);
      try {
        const res = await sessionsApi.getMySubmissions({
          limit: 50,
          after: cursorAfter,
        });
        if (res.contents && res.contents.length > 0) {
          setAllSubmissions(res.contents);
        } else {
          setAllSubmissions(getStoredSubmissions());
        }
        setPaginationCursor(res.pagination || {});
      } catch {
        // Fallback stored mock submissions
        const list = getStoredSubmissions();
        setAllSubmissions(list);
        setPaginationCursor({ has_next: false, has_prev: false });
      } finally {
        setLoadingSubmissions(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchEnrolledSubjects();
  }, [fetchEnrolledSubjects]);

  useEffect(() => {
    if (activeTab === 'my-submissions') {
      fetchMySubmissions();
    }
  }, [activeTab, fetchMySubmissions]);

  // Status counts for quick filter pills
  const statusCounts = useMemo(() => {
    return {
      ALL: allSubmissions.length,
      PENDING: allSubmissions.filter((s) => (s.status || 'PENDING') === 'PENDING').length,
      REVIEWING: allSubmissions.filter((s) => s.status === 'REVIEWING').length,
      RESOLVED: allSubmissions.filter((s) => s.status === 'RESOLVED').length,
    };
  }, [allSubmissions]);

  // Reactive filtering & sorting (Instant, comprehensive, bug-free)
  const filteredSubmissions = useMemo(() => {
    let list = [...allSubmissions];

    // 1. Status filter
    if (filterStatus !== 'ALL') {
      list = list.filter((s) => (s.status || 'PENDING') === filterStatus);
    }

    // 2. Subject filter
    if (filterSubjectId !== undefined) {
      list = list.filter((s) => s.subject_id === filterSubjectId);
    }

    // 3. Search query filter (title, content, subject name, subject code, session code)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          (s.title || '').toLowerCase().includes(q) ||
          (s.content || '').toLowerCase().includes(q) ||
          (s.subject_name || '').toLowerCase().includes(q) ||
          (s.subject_code || '').toLowerCase().includes(q) ||
          (s.session_code || '').toLowerCase().includes(q)
      );
    }

    // 4. Sort
    if (sortBy === 'NEWEST') {
      list.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    } else if (sortBy === 'OLDEST') {
      list.sort(
        (a, b) =>
          new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      );
    } else if (sortBy === 'MOST_QUESTIONS') {
      list.sort((a, b) => (b.question_counts || 0) - (a.question_counts || 0));
    }

    return list;
  }, [allSubmissions, filterStatus, filterSubjectId, searchQuery, sortBy]);

  // Check if any filter is active
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterSubjectId !== undefined ||
    filterStatus !== 'ALL' ||
    sortBy !== 'NEWEST';

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterSubjectId(undefined);
    setFilterStatus('ALL');
    setSortBy('NEWEST');
    setCurrentPage(1);
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSubjectId, filterStatus, sortBy, pageSize]);

  // Pagination calculations for My Submissions
  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSubmissions = filteredSubmissions.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  // Question editing handlers
  const currentQ = questions[activeQIndex] || questions[0];

  const handleUpdateCurrentQ = (updates: Partial<LocalQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === activeQIndex ? { ...q, ...updates } : q))
    );
  };

  const handleUpdateOption = (optKey: string, text: string) => {
    if (!currentQ) return;
    const newOptions = currentQ.options.map((opt) =>
      opt.key === optKey ? { ...opt, text } : opt
    );
    handleUpdateCurrentQ({ options: newOptions });
  };

  const handleSetCorrectOption = (optKey: string) => {
    if (!currentQ) return;
    const newOptions = currentQ.options.map((opt) => ({
      ...opt,
      is_correct: opt.key === optKey,
    }));
    handleUpdateCurrentQ({ options: newOptions });
  };

  const handleAddQuestion = () => {
    const newQ: LocalQuestion = {
      content: '',
      media_urls: [],
      options: [
        { key: 'A', text: '', is_correct: true },
        { key: 'B', text: '', is_correct: false },
        { key: 'C', text: '', is_correct: false },
        { key: 'D', text: '', is_correct: false },
      ],
      explanation: '',
      llm_generated: false,
      confidence: 3.5,
    };
    setQuestions([...questions, newQ]);
    setActiveQIndex(questions.length);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      showToast('Phiên đề xuất cần tối thiểu 1 câu hỏi', 'warning');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
    setActiveQIndex(Math.max(0, activeQIndex - 1));
  };

  // Submit new proposal
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Vui lòng nhập tiêu đề cho phiên đề xuất', 'warning');
      return;
    }
    if (!selectedSubjectId) {
      showToast('Vui lòng chọn môn học đang tham gia', 'warning');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) {
        showToast(`Vui lòng nhập nội dung cho câu hỏi ${i + 1}`, 'warning');
        return;
      }
      const hasCorrect = q.options.some((opt) => opt.is_correct);
      if (!hasCorrect) {
        showToast(`Câu hỏi ${i + 1} chưa được chọn đáp án đúng`, 'warning');
        return;
      }
    }

    setIsSubmitting(true);
    const selectedSubject = enrolledSubjects.find((s) => s.subject_id === selectedSubjectId);
    try {
      const payload: ProposeSessionRequest = {
        title: title.trim(),
        content: content.trim(),
        source_url: sourceUrl.trim() || undefined,
        subject_id: selectedSubjectId,
        questions: questions.map((q) => ({
          content: q.content,
          media_urls: q.media_urls,
          options: q.options.map((opt) => ({
            key: opt.key,
            text: opt.text,
            is_correct: opt.is_correct,
            media_url: opt.media_url,
          })),
          explanation: q.explanation,
          llm_generated: q.llm_generated,
          confidence: q.confidence,
        })),
      };

      try {
        await sessionsApi.proposeSession(payload);
      } catch {
        // Fallback save in local stored sessions
        const { summary } = saveNewStoredSubmission(
          payload,
          selectedSubject?.name,
          selectedSubject?.code
        );
        setAllSubmissions((prev) => [summary, ...prev]);
      }

      showToast(`Đã gửi phiên đề xuất "${title}" tới giảng viên duyệt!`, 'success');

      // Reset form
      setTitle('');
      setContent('');
      setSourceUrl('');
      setQuestions([
        {
          content: '',
          media_urls: [],
          options: [
            { key: 'A', text: '', is_correct: true },
            { key: 'B', text: '', is_correct: false },
            { key: 'C', text: '', is_correct: false },
            { key: 'D', text: '', is_correct: false },
          ],
          explanation: '',
          llm_generated: false,
          confidence: 3.5,
        },
      ]);
      setActiveQIndex(0);

      // Switch to my-submissions tab to review
      fetchMySubmissions();
      setActiveTab('my-submissions');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi gửi đề xuất câu hỏi';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete proposal
  const handleDeleteSubmission = async (sessionId: number, sessionTitle?: string) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn hủy và xóa phiên đề xuất "${sessionTitle || sessionId}"? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    try {
      try {
        await sessionsApi.deleteMySubmission(sessionId);
      } catch {
        // Fallback ignore API error for mock/offline session
      }
      deleteStoredSubmission(sessionId);
      showToast('Đã xóa phiên đề xuất thành công', 'success');
      setAllSubmissions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa phiên đề xuất';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] flex flex-col md:flex-row items-start bg-[#F0F2F5] dark:bg-[#18191A]">
      {/* ================= CỘT TRÁI (LEFT SIDEBAR): CỐ ĐỊNH KHI CUỘN TRANG ================= */}
      <aside className="w-full md:w-80 lg:w-84 xl:w-88 shrink-0 bg-white dark:bg-[#242526] border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 sticky top-14 md:h-[calc(100vh-3.5rem)] md:overflow-y-auto p-3 sm:p-4 md:p-5 flex flex-col select-none z-20 shadow-xs md:shadow-none">
        <div className="space-y-3 md:space-y-4">
          <div className="hidden md:block px-1 pt-1 pb-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              <span>Đề xuất câu hỏi</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Biên soạn & đóng góp câu hỏi vào ngân hàng đề toàn trường
            </p>
          </div>

          {/* 2 Tabs: Linh hoạt theo màn hình (ngang trên mobile/tablet, dọc trên desktop) */}
          <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
            {/* Tab 1: Soạn phiên đề xuất mới */}
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`w-full flex items-center justify-between p-2.5 sm:p-3 md:p-3.5 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'create'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 font-semibold'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'create'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <FilePlus className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm block truncate font-bold">Soạn phiên mới</span>
                  <span className="text-[11px] text-gray-500 font-normal hidden sm:block truncate">
                    Tạo câu hỏi & nộp duyệt
                  </span>
                </div>
              </div>
              <ChevronRight
                className={`hidden md:block w-4 h-4 shrink-0 transition-transform ${
                  activeTab === 'create' ? 'text-blue-600 translate-x-0.5' : 'text-gray-400 opacity-60'
                }`}
              />
            </button>

            {/* Tab 2: Phiên đề xuất của tôi */}
            <button
              type="button"
              onClick={() => setActiveTab('my-submissions')}
              className={`w-full flex items-center justify-between p-2.5 sm:p-3 md:p-3.5 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'my-submissions'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 font-semibold'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'my-submissions'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <ListOrdered className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm block truncate font-bold">Phiên của tôi</span>
                  <span className="text-[11px] text-gray-500 font-normal hidden sm:block truncate">
                    Theo dõi, sửa & xóa
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {allSubmissions.length > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === 'my-submissions'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {allSubmissions.length}
                  </span>
                )}
                <ChevronRight
                  className={`hidden md:block w-4 h-4 transition-transform ${
                    activeTab === 'my-submissions' ? 'text-blue-600 translate-x-0.5' : 'text-gray-400 opacity-60'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* ================= CỘT PHẢI (MAIN CONTENT): NỘI DUNG THEO TAB ================= */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* ================= NỘI DUNG TAB 1: SOẠN PHIÊN ĐỀ XUẤT MỚI ================= */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmitProposal} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Form soạn thảo (7 cols) */}
              <div className="lg:col-span-7 bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-4">
                <div className="border-b border-gray-100 dark:border-gray-700 pb-2.5">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                    Thông tin phiên nộp
                  </h3>
                  <p className="text-xs text-gray-500">
                    Các trường đánh dấu (*) là bắt buộc
                  </p>
                </div>

                {/* Tiêu đề & Môn học */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Tiêu đề phiên đề xuất *
                    </label>
                    <textarea
                      rows={2}
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.max(44, e.target.scrollHeight)}px`;
                      }}
                      onFocus={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.max(44, e.target.scrollHeight)}px`;
                      }}
                      placeholder="Ví dụ: Bộ câu hỏi ôn tập Chương 3 (nhấn Enter xuống dòng thoải mái)&#10;Giao thức Tầng Mạng & Định tuyến OSPF..."
                      required
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition resize-y min-h-[44px] break-words whitespace-pre-wrap leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Môn học tham gia *
                      </label>
                      <select
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition font-medium"
                      >
                        {enrolledSubjects.map((sub) => (
                          <option key={sub.subject_id} value={sub.subject_id}>
                            {sub.name} ({sub.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        URL tài liệu tham khảo (source_url)
                      </label>
                      <input
                        type="url"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.preventDefault();
                        }}
                        placeholder="https://tailieu.hust.edu.vn/..."
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Mô tả tổng quan / Ghi chú cho Giảng viên
                    </label>
                    <textarea
                      rows={2}
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.max(56, e.target.scrollHeight)}px`;
                      }}
                      onFocus={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.max(56, e.target.scrollHeight)}px`;
                      }}
                      placeholder="Tóm tắt nội dung bộ câu hỏi hoặc mục đích ôn tập (nhấn Enter để xuống dòng thoải mái)..."
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition resize-y min-h-[56px] break-words whitespace-pre-wrap leading-relaxed"
                    />
                  </div>
                </div>

                {/* Danh sách câu hỏi */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        Danh sách câu hỏi
                      </span>
                      <span className="text-xs text-gray-500">
                        ({questions.length} câu)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm câu mới</span>
                    </button>
                  </div>

                  {/* Tabs các câu hỏi */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    {questions.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveQIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${idx === activeQIndex
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                      >
                        Câu {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Question Editor */}
                  {currentQ && (
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-[#1E1F20] space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          Nội dung Câu {activeQIndex + 1}
                        </span>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(activeQIndex)}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa câu này</span>
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Nội dung câu hỏi *
                        </label>
                        <textarea
                          rows={3}
                          value={currentQ.content}
                          onChange={(e) => {
                            handleUpdateCurrentQ({ content: e.target.value });
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.max(80, e.target.scrollHeight)}px`;
                          }}
                          onFocus={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.max(80, e.target.scrollHeight)}px`;
                          }}
                          placeholder="Nhập đề bài câu hỏi trắc nghiệm (hỗ trợ nhấn Enter xuống dòng tự do)..."
                          required
                          className="w-full p-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#242526] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px] break-words whitespace-pre-wrap leading-relaxed"
                        />
                      </div>

                      {/* 4 Options */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                          Các phương án trả lời (Bấm chữ A/B/C/D để đánh dấu đáp án đúng, tự động xuống dòng khi nhập dài):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {currentQ.options.map((opt) => (
                            <div
                              key={opt.key}
                              className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition ${opt.is_correct
                                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20'
                                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#242526]'
                                }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleSetCorrectOption(opt.key)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer transition mt-0.5 ${opt.is_correct
                                    ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                                  }`}
                                title={opt.is_correct ? 'Đáp án đúng' : 'Bấm để đặt làm đáp án đúng'}
                              >
                                {opt.key}
                              </button>
                              <textarea
                                rows={2}
                                value={opt.text}
                                onChange={(e) => {
                                  handleUpdateOption(opt.key, e.target.value);
                                  e.target.style.height = 'auto';
                                  e.target.style.height = `${Math.max(44, e.target.scrollHeight)}px`;
                                }}
                                onFocus={(e) => {
                                  e.target.style.height = 'auto';
                                  e.target.style.height = `${Math.max(44, e.target.scrollHeight)}px`;
                                }}
                                placeholder={`Phương án ${opt.key}...`}
                                className="flex-1 bg-transparent text-xs sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-hidden resize-y min-h-[44px] break-words whitespace-pre-wrap leading-relaxed"
                              />
                              {opt.is_correct && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Explanation */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Lời giải thích chi tiết cho đáp án đúng
                        </label>
                        <textarea
                          rows={2}
                          value={currentQ.explanation}
                          onChange={(e) => {
                            handleUpdateCurrentQ({ explanation: e.target.value });
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.max(56, e.target.scrollHeight)}px`;
                          }}
                          onFocus={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.max(56, e.target.scrollHeight)}px`;
                          }}
                          placeholder="Giải thích nguyên lý hoặc tài liệu tham khảo (nhấn Enter xuống dòng)..."
                          className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#242526] text-gray-900 dark:text-gray-100 focus:outline-hidden resize-y min-h-[56px] break-words whitespace-pre-wrap leading-relaxed"
                        />
                      </div>

                      {/* Additional settings */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-gray-200 dark:border-gray-700">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={currentQ.llm_generated}
                            onChange={(e) =>
                              handleUpdateCurrentQ({ llm_generated: e.target.checked })
                            }
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            Đánh dấu do AI/LLM hỗ trợ sinh
                          </span>
                        </label>

                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-medium">Độ tự tin [0 - 4]:</span>
                          <select
                            value={currentQ.confidence}
                            onChange={(e) =>
                              handleUpdateCurrentQ({ confidence: Number(e.target.value) })
                            }
                            className="px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#242526] text-xs font-semibold text-gray-800 dark:text-gray-200"
                          >
                            <option value={4}>4.0 - Tự tin / Câu hỏi hay</option>
                            <option value={3.5}>3.5 - Cơ bản / Tốt</option>
                            <option value={2}>2.0 - Chưa nắm vững</option>
                            <option value={1}>1.0 - Cần kiểm tra kỹ</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit button bar */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang nộp phiên đề xuất...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Gửi phiên đề xuất tới Giảng viên</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Live Preview (5 cols) */}
              <div className="lg:col-span-5 space-y-4 sticky top-20">
                <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 mb-3.5">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        Xem trước trực tiếp (Live Preview)
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400">
                      Câu {activeQIndex + 1} / {questions.length}
                    </span>
                  </div>

                  {/* Preview Box */}
                  <div className="space-y-3.5">
                    <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                        {enrolledSubjects.find((s) => s.subject_id === selectedSubjectId)?.name ||
                          'Môn học chưa chọn'}
                      </span>
                      {title && (
                        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words mb-2 leading-snug">
                          {title}
                        </h4>
                      )}
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap break-words">
                        {currentQ?.content || 'Nội dung câu hỏi sẽ hiển thị ở đây...'}
                      </p>
                    </div>

                    {/* Options preview */}
                    <div className="space-y-2">
                      {currentQ?.options.map((opt) => (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 transition ${opt.is_correct
                              ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-[#1E1F20] text-gray-700 dark:text-gray-300'
                            }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${opt.is_correct
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                          >
                            {opt.key}
                          </span>
                          <span className="flex-1 break-words whitespace-pre-wrap leading-relaxed">
                            {opt.text || `Nội dung phương án ${opt.key}`}
                          </span>
                          {opt.is_correct && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full shrink-0">
                              Đáp án đúng
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Explanation preview */}
                    {currentQ?.explanation && (
                      <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Giải thích chi tiết:</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                          {currentQ.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ================= NỘI DUNG TAB 2: DANH SÁCH PHIÊN CỦA TÔI ================= */}
        {activeTab === 'my-submissions' && (
          <div className="space-y-4">
            {/* Filter & Search Toolbar */}
            <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              {/* Row 1: Search + Subject + Sort + Refresh */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tiêu đề, mô tả, môn học, mã phiên..."
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/70 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      title="Xóa tìm kiếm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Subject Filter */}
                  <div className="relative flex-1 sm:flex-initial">
                    <select
                      value={filterSubjectId ?? ''}
                      onChange={(e) =>
                        setFilterSubjectId(e.target.value ? Number(e.target.value) : undefined)
                      }
                      className="w-full sm:w-auto pl-3 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/70 dark:bg-[#3A3B3C] text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Tất cả môn học</option>
                      {enrolledSubjects.map((sub) => (
                        <option key={sub.subject_id} value={sub.subject_id}>
                          {sub.code} - {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Filter */}
                  <div className="relative shrink-0">
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as 'NEWEST' | 'OLDEST' | 'MOST_QUESTIONS')
                      }
                      className="pl-3 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/70 dark:bg-[#3A3B3C] text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="NEWEST">Mới nhất</option>
                      <option value="OLDEST">Cũ nhất</option>
                      <option value="MOST_QUESTIONS">Nhiều câu nhất</option>
                    </select>
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>

                  {/* Refresh Button */}
                  <button
                    type="button"
                    onClick={() => fetchMySubmissions()}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="Làm mới danh sách phiên"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingSubmissions ? 'animate-spin text-blue-600' : ''}`} />
                    <span className="hidden sm:inline">Làm mới</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Status Quick Filter Pills + Result Counter */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700 text-xs">
                {/* Status Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mr-1">
                    Trạng thái:
                  </span>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('ALL')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      filterStatus === 'ALL'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>Tất cả</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        filterStatus === 'ALL' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {statusCounts.ALL}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterStatus('PENDING')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      filterStatus === 'PENDING'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
                    }`}
                  >
                    <span>Chờ duyệt</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        filterStatus === 'PENDING' ? 'bg-white/20 text-white' : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                      }`}
                    >
                      {statusCounts.PENDING}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterStatus('REVIEWING')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      filterStatus === 'REVIEWING'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100'
                    }`}
                  >
                    <span>Đang thẩm định</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        filterStatus === 'REVIEWING' ? 'bg-white/20 text-white' : 'bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
                      }`}
                    >
                      {statusCounts.REVIEWING}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterStatus('RESOLVED')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      filterStatus === 'RESOLVED'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
                    }`}
                  >
                    <span>Đã duyệt</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        filterStatus === 'RESOLVED' ? 'bg-white/20 text-white' : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
                      }`}
                    >
                      {statusCounts.RESOLVED}
                    </span>
                  </button>

                  {/* Reset Filters button */}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-2.5 py-1 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1 ml-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Đặt lại</span>
                    </button>
                  )}
                </div>

                {/* Submissions count summary */}
                <div className="text-gray-500 font-medium">
                  {hasActiveFilters ? (
                    <span>
                      Khớp <span className="font-bold text-blue-600">{filteredSubmissions.length}</span> / {allSubmissions.length} phiên
                    </span>
                  ) : (
                    <span>
                      Tổng <span className="font-bold text-blue-600">{allSubmissions.length}</span> phiên
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dòng hướng dẫn sinh viên: Chỉ sửa & xóa khi Chờ duyệt */}
            <div className="flex items-start sm:items-center gap-3 p-3.5 sm:px-4 sm:py-3 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
              <div className="w-6 h-6 rounded-lg bg-amber-200/60 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-bold">
                <Info className="w-4 h-4" />
              </div>
              <p className="leading-relaxed">
                <span className="font-bold">Lưu ý sinh viên:</span> Bạn chỉ có thể{' '}
                <span className="font-bold underline underline-offset-2">Chỉnh sửa</span> và{' '}
                <span className="font-bold underline underline-offset-2">Xóa</span> phiên đề xuất khi đang ở trạng thái{' '}
                <span className="inline-block px-1.5 py-0.5 rounded font-bold bg-amber-200/80 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 text-[11px]">
                  Chờ duyệt
                </span>
                . Khi phiên ở trạng thái khác (đang thẩm định hoặc đã duyệt), các nút thao tác này sẽ tự động được làm mờ và khóa lại.
              </p>
            </div>

            {/* Submissions Cards List */}
            {loadingSubmissions ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-500">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm">Đang tải danh sách phiên đề xuất...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mx-auto">
                  <FilePlus className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="font-bold text-base text-gray-900 dark:text-gray-100">
                    {allSubmissions.length === 0
                      ? 'Chưa có phiên đề xuất nào'
                      : 'Không tìm thấy phiên đề xuất phù hợp'}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {allSubmissions.length === 0
                      ? 'Bạn chưa nộp phiên đề xuất nào. Hãy tạo phiên mới để đóng góp vào ngân hàng đề!'
                      : 'Không có phiên nào khớp với điều kiện lọc hoặc từ khóa tìm kiếm hiện tại.'}
                  </p>
                </div>
                {allSubmissions.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
                  >
                    + Soạn phiên đề xuất ngay
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-gray-100 dark:bg-[#3A3B3C] text-gray-800 dark:text-gray-200 hover:bg-gray-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Đặt lại bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {paginatedSubmissions.map((sub) => {
                    const status = sub.status || 'PENDING';
                    const isPending = status === 'PENDING';

                    return (
                      <div
                        key={sub.session_id}
                        className="bg-white dark:bg-[#242526] rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1 max-w-2xl">
                            <div className="flex items-center gap-2 flex-wrap">
                              {status === 'RESOLVED' ? (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Đã duyệt</span>
                                </span>
                              ) : status === 'REVIEWING' ? (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Đang thẩm định</span>
                                </span>
                              ) : (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Chờ duyệt</span>
                                </span>
                              )}
                            </div>

                            <h4
                              className="font-bold text-base text-gray-900 dark:text-gray-100 hover:text-blue-600 cursor-pointer whitespace-pre-wrap break-words"
                              onClick={() => setSelectedDetailId(sub.session_id || null)}
                            >
                              {sub.title}
                            </h4>

                            {sub.content && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                {sub.content}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setSelectedDetailId(sub.session_id || null)}
                              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Chi tiết</span>
                            </button>

                            <button
                              disabled={!isPending}
                              onClick={() => isPending && setSelectedEditId(sub.session_id || null)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
                                isPending
                                  ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 cursor-pointer shadow-2xs'
                                  : 'opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-[#3A3B3C] text-gray-400 dark:text-gray-500'
                              }`}
                              title={
                                isPending
                                  ? 'Chỉnh sửa phiên đề xuất'
                                  : 'Chỉ có thể chỉnh sửa khi ở trạng thái Chờ duyệt'
                              }
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>

                            <button
                              disabled={!isPending}
                              onClick={() =>
                                isPending && handleDeleteSubmission(sub.session_id!, sub.title)
                              }
                              className={`p-1.5 rounded-xl border transition ${
                                isPending
                                  ? 'border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer shadow-2xs'
                                  : 'opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-[#3A3B3C] text-gray-400 dark:text-gray-500'
                              }`}
                              title={
                                isPending
                                  ? 'Hủy & xóa phiên đề xuất'
                                  : 'Chỉ có thể xóa khi ở trạng thái Chờ duyệt'
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      {/* Metadata footer */}
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            Môn: {sub.subject_name || sub.subject_code} ({sub.subject_code})
                          </span>
                          <span>•</span>
                          <span>{sub.question_counts || 0} câu trắc nghiệm</span>
                          {sub.created_at && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{new Date(sub.created_at).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-rose-500" />
                            <span>{sub.react_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                            <span>{sub.comment_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>

                {/* Phân trang (Pagination) */}
                {filteredSubmissions.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-1 px-1 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700/60 mt-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span>
                        Hiển thị{' '}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {(safeCurrentPage - 1) * pageSize + 1}
                        </span>
                        -
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {Math.min(safeCurrentPage * pageSize, filteredSubmissions.length)}
                        </span>{' '}
                        trong tổng số{' '}
                        <span className="font-bold text-blue-600">{filteredSubmissions.length}</span> phiên
                        {hasActiveFilters && (
                          <span className="text-gray-400"> (lọc từ {allSubmissions.length} phiên)</span>
                        )}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">•</span>
                        <span>Mỗi trang:</span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#3A3B3C] text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-hidden cursor-pointer"
                        >
                          <option value={3}>3 phiên</option>
                          <option value={5}>5 phiên</option>
                          <option value={10}>10 phiên</option>
                          <option value={20}>20 phiên</option>
                        </select>
                      </div>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={safeCurrentPage === 1}
                          className="px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#242526] text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-[#3A3B3C] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Trước</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                              return (
                                page === 1 ||
                                page === totalPages ||
                                Math.abs(page - safeCurrentPage) <= 1
                              );
                            })
                            .map((page, idx, arr) => {
                              const prev = arr[idx - 1];
                              const hasGap = prev && page - prev > 1;

                              return (
                                <React.Fragment key={page}>
                                  {hasGap && (
                                    <span className="px-1 text-gray-400 font-bold">...</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                                      page === safeCurrentPage
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#242526] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                </React.Fragment>
                              );
                            })}
                        </div>

                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safeCurrentPage === totalPages}
                          className="px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#242526] text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-[#3A3B3C] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
                        >
                          <span className="hidden sm:inline">Sau</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Xem chi tiết phiên đề xuất */}
      <SubmissionDetailModal
        sessionId={selectedDetailId}
        onClose={() => setSelectedDetailId(null)}
      />

      {/* Modal Chỉnh sửa phiên đề xuất */}
      <EditSubmissionModal
        sessionId={selectedEditId}
        enrolledSubjects={enrolledSubjects}
        onClose={() => setSelectedEditId(null)}
        onSuccess={() => fetchMySubmissions()}
        showToast={showToast}
      />
    </div>
  );
};
