import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
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
} from 'lucide-react';

export const ProposeView: React.FC = () => {
  const { showToast } = useApp();
  // Hỗ trợ mở thẳng từ sidebar: /propose?view=my-submissions&status=PENDING
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status');

  // Active view tab: 'create' | 'my-submissions'
  const [activeTab, setActiveTab] = useState<'create' | 'my-submissions'>(
    searchParams.get('view') === 'my-submissions' ? 'my-submissions' : 'create',
  );

  // Enrolled subjects state
  const [enrolledSubjects, setEnrolledSubjects] = useState<SubjectResponse[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // My Submissions state
  const [submissions, setSubmissions] = useState<StoredSubmissionSummary[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [filterSubjectId, setFilterSubjectId] = useState<number | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'REVIEWING' | 'RESOLVED' | undefined>(
    initialStatus === 'PENDING' || initialStatus === 'REVIEWING' || initialStatus === 'RESOLVED'
      ? initialStatus
      : undefined,
  );
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
          subject_id: filterSubjectId,
          status: filterStatus,
          limit: 10,
          after: cursorAfter,
        });
        setSubmissions(res.contents || []);
        setPaginationCursor(res.pagination || {});
      } catch {
        // Fallback stored mock submissions
        let list = getStoredSubmissions();
        if (filterSubjectId) {
          list = list.filter((s) => s.subject_id === filterSubjectId);
        }
        setSubmissions(list);
        setPaginationCursor({ has_next: false, has_prev: false });
      } finally {
        setLoadingSubmissions(false);
      }
    },
    [filterSubjectId, filterStatus]
  );

  useEffect(() => {
    const timer = setTimeout(() => void fetchEnrolledSubjects(), 0);
    return () => clearTimeout(timer);
  }, [fetchEnrolledSubjects]);

  useEffect(() => {
    if (activeTab !== 'my-submissions') return;
    const timer = setTimeout(() => void fetchMySubmissions(), 0);
    return () => clearTimeout(timer);
  }, [activeTab, fetchMySubmissions]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSubjectId, filterStatus]);

  // Pagination calculations for My Submissions
  const totalPages = Math.max(1, Math.ceil(submissions.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSubmissions = submissions.slice(
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
        setSubmissions((prev) => [summary, ...prev]);
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
      setSubmissions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa phiên đề xuất';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] flex flex-col md:flex-row items-start bg-fb-canvas">
      {/* ================= CỘT TRÁI (LEFT SIDEBAR): CỐ ĐỊNH KHI CUỘN TRANG ================= */}
      <aside className="w-full md:w-80 lg:w-84 xl:w-88 shrink-0 bg-fb-card border-r border-fb-divider md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] overflow-y-auto p-4 sm:p-5 flex flex-col select-none z-20">
        <div className="space-y-4">
          <div className="px-1 pt-1 pb-3 border-b border-fb-divider">
            <h2 className="text-xl font-black text-fb-text flex items-center gap-2.5">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              <span>Đề xuất câu hỏi</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Biên soạn & đóng góp câu hỏi vào ngân hàng đề toàn trường
            </p>
          </div>

          {/* 2 Tabs Dọc Bên Trái */}
          <div className="space-y-2">
            {/* Tab 1: Soạn phiên đề xuất mới */}
            <button
              onClick={() => setActiveTab('create')}
              className={`w-full flex items-center justify-between p-3.5 rounded-lg transition cursor-pointer text-left ${activeTab === 'create'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-fb-blue font-bold shadow-xs'
                  : 'hover:bg-fb-hover text-fb-text font-semibold'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'create'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-fb-input text-fb-text-2'
                    }`}
                >
                  <FilePlus className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm block truncate">Soạn phiên mới</span>
                  <span className="text-xs text-gray-500 font-normal block truncate">
                    Tạo câu hỏi & nộp duyệt
                  </span>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-transform ${activeTab === 'create' ? 'text-blue-600 translate-x-0.5' : 'text-gray-400 opacity-60'
                  }`}
              />
            </button>

            {/* Tab 2: Phiên đề xuất của tôi */}
            <button
              onClick={() => setActiveTab('my-submissions')}
              className={`w-full flex items-center justify-between p-3.5 rounded-lg transition cursor-pointer text-left ${activeTab === 'my-submissions'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-fb-blue font-bold shadow-xs'
                  : 'hover:bg-fb-hover text-fb-text font-semibold'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'my-submissions'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-fb-input text-fb-text-2'
                    }`}
                >
                  <ListOrdered className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm block truncate">Phiên của tôi</span>
                  <span className="text-xs text-gray-500 font-normal block truncate">
                    Theo dõi, sửa & xóa
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {submissions.length > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'my-submissions'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-fb-text'
                      }`}
                  >
                    {submissions.length}
                  </span>
                )}
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${activeTab === 'my-submissions' ? 'text-blue-600 translate-x-0.5' : 'text-gray-400 opacity-60'
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
              <div className="lg:col-span-7 bg-fb-card rounded-lg shadow-fb-card p-4 sm:p-5 space-y-4">
                <div className="border-b border-fb-divider pb-2.5">
                  <h3 className="font-bold text-sm sm:text-base text-fb-text">
                    Thông tin phiên nộp
                  </h3>
                  <p className="text-xs text-gray-500">
                    Các trường đánh dấu (*) là bắt buộc
                  </p>
                </div>

                {/* Tiêu đề & Môn học */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-fb-text mb-1">
                      Tiêu đề phiên đề xuất *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ví dụ: Bộ câu hỏi ôn tập Chương 3 - Giao thức Tầng Mạng & Định tuyến OSPF"
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-[#3A3B3C] text-fb-text focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-fb-text mb-1">
                        Môn học tham gia *
                      </label>
                      <select
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-[#3A3B3C] text-fb-text focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition font-medium"
                      >
                        {enrolledSubjects.map((sub) => (
                          <option key={sub.subject_id} value={sub.subject_id}>
                            {sub.name} ({sub.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-fb-text mb-1">
                        URL tài liệu tham khảo (source_url)
                      </label>
                      <input
                        type="url"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        placeholder="https://tailieu.hust.edu.vn/..."
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-[#3A3B3C] text-fb-text focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-fb-text mb-1">
                      Mô tả tổng quan / Ghi chú cho Giảng viên
                    </label>
                    <textarea
                      rows={2}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Tóm tắt nội dung bộ câu hỏi hoặc mục đích ôn tập..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-[#3A3B3C] text-fb-text focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Danh sách câu hỏi */}
                <div className="pt-3 border-t border-fb-divider space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-fb-text">
                        Danh sách câu hỏi
                      </span>
                      <span className="text-xs text-gray-500">
                        ({questions.length} câu)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-fb-blue border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
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
                            : 'bg-fb-input text-fb-text hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                      >
                        Câu {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Question Editor */}
                  {currentQ && (
                    <div className="p-4 rounded-lg border border-fb-divider bg-gray-50/70 dark:bg-[#1E1F20] space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-fb-blue">
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
                        <label className="block text-xs font-bold text-fb-text mb-1">
                          Nội dung câu hỏi *
                        </label>
                        <textarea
                          rows={3}
                          value={currentQ.content}
                          onChange={(e) => handleUpdateCurrentQ({ content: e.target.value })}
                          placeholder="Nhập đề bài câu hỏi trắc nghiệm..."
                          required
                          className="w-full p-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-fb-card text-fb-text focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* 4 Options */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-fb-text">
                          Các phương án trả lời (Bấm chữ A/B/C/D để đánh dấu đáp án đúng, tự động xuống dòng khi nhập dài):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {currentQ.options.map((opt) => (
                            <div
                              key={opt.key}
                              className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition ${opt.is_correct
                                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20'
                                  : 'border-gray-300 dark:border-gray-600 bg-fb-card'
                                }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleSetCorrectOption(opt.key)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer transition mt-0.5 ${opt.is_correct
                                    ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                    : 'bg-gray-200 dark:bg-gray-700 text-fb-text hover:bg-gray-300'
                                  }`}
                                title={opt.is_correct ? 'Đáp án đúng' : 'Bấm để đặt làm đáp án đúng'}
                              >
                                {opt.key}
                              </button>
                              <textarea
                                rows={2}
                                value={opt.text}
                                onChange={(e) => handleUpdateOption(opt.key, e.target.value)}
                                placeholder={`Phương án ${opt.key}...`}
                                className="flex-1 bg-transparent text-xs sm:text-sm text-fb-text focus:outline-hidden resize-y min-h-[44px] break-words leading-relaxed"
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
                        <label className="block text-xs font-bold text-fb-text mb-1">
                          Lời giải thích chi tiết cho đáp án đúng
                        </label>
                        <textarea
                          rows={2}
                          value={currentQ.explanation}
                          onChange={(e) =>
                            handleUpdateCurrentQ({ explanation: e.target.value })
                          }
                          placeholder="Giải thích nguyên lý hoặc tài liệu tham khảo..."
                          className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-fb-card text-fb-text focus:outline-hidden"
                        />
                      </div>

                      {/* Additional settings */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-fb-divider">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={currentQ.llm_generated}
                            onChange={(e) =>
                              handleUpdateCurrentQ({ llm_generated: e.target.checked })
                            }
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-fb-text font-medium">
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
                            className="px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-fb-card text-xs font-semibold text-fb-text"
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
                <div className="pt-2 border-t border-fb-divider flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-fb-blue hover:bg-fb-blue-hover text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                <div className="bg-fb-card rounded-lg shadow-fb-card p-4 sm:p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-fb-divider mb-3.5">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <h4 className="font-bold text-sm text-fb-text">
                        Xem trước trực tiếp (Live Preview)
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400">
                      Câu {activeQIndex + 1} / {questions.length}
                    </span>
                  </div>

                  {/* Preview Box */}
                  <div className="space-y-3.5">
                    <div className="p-3.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                      <span className="text-[10px] font-bold text-fb-blue block mb-1">
                        {enrolledSubjects.find((s) => s.subject_id === selectedSubjectId)?.name ||
                          'Môn học chưa chọn'}{' '}
                        - {title || 'Chưa nhập tiêu đề'}
                      </span>
                      <p className="font-semibold text-sm text-fb-text leading-relaxed">
                        {currentQ?.content || 'Nội dung câu hỏi sẽ hiển thị ở đây...'}
                      </p>
                    </div>

                    {/* Options preview */}
                    <div className="space-y-2">
                      {currentQ?.options.map((opt) => (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-lg border text-xs sm:text-sm flex items-start gap-2.5 transition ${opt.is_correct
                              ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold'
                              : 'border-fb-divider bg-gray-50/40 dark:bg-[#1E1F20] text-fb-text'
                            }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${opt.is_correct
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-fb-text'
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
                      <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Giải thích chi tiết:</span>
                        </div>
                        <p className="text-fb-text">
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
            {/* Filter Bar */}
            <div className="bg-fb-card rounded-lg shadow-fb-card p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                  <Filter className="w-4 h-4" />
                  <span>Lọc:</span>
                </div>

                {/* Subject filter */}
                <select
                  value={filterSubjectId ?? ''}
                  onChange={(e) =>
                    setFilterSubjectId(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-fb-input text-xs font-medium text-fb-text focus:outline-hidden"
                >
                  <option value="">Tất cả môn học</option>
                  {enrolledSubjects.map((sub) => (
                    <option key={sub.subject_id} value={sub.subject_id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>

                {/* Status filter */}
                <select
                  value={filterStatus ?? ''}
                  onChange={(e) =>
                    setFilterStatus(
                      e.target.value
                        ? (e.target.value as 'PENDING' | 'REVIEWING' | 'RESOLVED')
                        : undefined
                    )
                  }
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-fb-input text-xs font-medium text-fb-text focus:outline-hidden"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="REVIEWING">Đang thẩm định</option>
                  <option value="RESOLVED">Đã duyệt</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => fetchMySubmissions()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold text-fb-text hover:bg-fb-hover transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSubmissions ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
                <span className="text-xs text-gray-500 font-medium ml-1">
                  Tổng <span className="font-bold text-blue-600">{submissions.length}</span> phiên
                </span>
              </div>
            </div>

            {/* Dòng hướng dẫn sinh viên: Chỉ sửa & xóa khi Chờ duyệt */}
            <div className="flex items-start sm:items-center gap-3 p-3.5 sm:px-4 sm:py-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
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
            ) : submissions.length === 0 ? (
              <div className="bg-fb-card rounded-lg border border-fb-divider p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mx-auto">
                  <FilePlus className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="font-bold text-base text-fb-text">
                    Chưa có phiên đề xuất nào
                  </h4>
                  <p className="text-xs text-gray-500">
                    Bạn chưa nộp phiên đề xuất nào phù hợp với bộ lọc hiện tại. Hãy tạo
                    phiên mới để đóng góp vào ngân hàng đề!
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
                >
                  + Soạn phiên đề xuất ngay
                </button>
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
                        className="bg-fb-card rounded-lg p-4 sm:p-5 shadow-fb-card hover:border-blue-400 dark:hover:border-blue-600 transition space-y-3"
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
                              className="font-bold text-base text-fb-text hover:text-blue-600 cursor-pointer"
                              onClick={() => setSelectedDetailId(sub.session_id || null)}
                            >
                              {sub.title}
                            </h4>

                            {sub.content && (
                              <p className="text-xs text-fb-text-2 line-clamp-2">
                                {sub.content}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setSelectedDetailId(sub.session_id || null)}
                              className="px-3 py-1.5 rounded-lg border border-fb-divider text-xs font-semibold text-fb-text hover:bg-fb-hover transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Chi tiết</span>
                            </button>

                            <button
                              disabled={!isPending}
                              onClick={() => isPending && setSelectedEditId(sub.session_id || null)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${
                                isPending
                                  ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-fb-blue hover:bg-blue-100 cursor-pointer shadow-2xs'
                                  : 'opacity-40 cursor-not-allowed border-fb-divider bg-fb-input text-gray-400 dark:text-gray-500'
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
                              className={`p-1.5 rounded-lg border transition ${
                                isPending
                                  ? 'border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer shadow-2xs'
                                  : 'opacity-40 cursor-not-allowed border-fb-divider bg-fb-input text-gray-400 dark:text-gray-500'
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
                      <div className="pt-2 border-t border-fb-divider flex flex-wrap items-center justify-between gap-3 text-xs text-fb-text-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-semibold text-fb-text">
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
                {submissions.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-1 px-1 text-xs text-fb-text-2 border-t border-fb-divider/60 mt-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span>
                        Hiển thị{' '}
                        <span className="font-semibold text-fb-text">
                          {(safeCurrentPage - 1) * pageSize + 1}
                        </span>
                        -
                        <span className="font-semibold text-fb-text">
                          {Math.min(safeCurrentPage * pageSize, submissions.length)}
                        </span>{' '}
                        trong tổng số{' '}
                        <span className="font-bold text-blue-600">{submissions.length}</span> phiên
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
                          className="px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#3A3B3C] text-xs font-semibold text-fb-text focus:outline-hidden cursor-pointer"
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
                          className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-fb-card text-fb-text font-semibold hover:bg-fb-hover disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
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
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                                      page === safeCurrentPage
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'border border-gray-300 dark:border-gray-700 bg-fb-card text-fb-text hover:bg-fb-hover'
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
                          className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-fb-card text-fb-text font-semibold hover:bg-fb-hover disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
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
