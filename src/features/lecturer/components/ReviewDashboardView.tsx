import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Edit3,
  ThumbsUp,
  FileText,
  User,
  ShieldCheck,
  ChevronRight,
  Filter,
  Layers,
  Send,
  Code,
  Search,
  CheckCheck,
  RotateCcw,
  BookOpen,
  Database,
  Award,
  ArrowLeft,
  SlidersHorizontal,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Question, ProposeSession } from '../../demo/types';
import { ApproveQuestionsModal } from './ApproveQuestionsModal';
import { RejectQuestionsModal } from './RejectQuestionsModal';
import { CompleteReviewModal } from './CompleteReviewModal';
import { ApiInspectorDrawer } from './ApiInspectorDrawer';

export const ReviewDashboardView: React.FC = () => {
  const {
    sessions,
    questions,
    currentUser,
    role,
    switchRole,
    setActiveTab,
    setActiveAIRefineQuestion,
    setIsExportQuestionsOpen,
    setIsExamWizardOpen,
    showToast
  } = useApp();

  // Navigation mode: 'PENDING_LIST' (GET /sessions/pending) or 'SESSION_DETAIL' (GET /sessions/{sessionId}) or 'HISTORY'
  const [viewMode, setViewMode] = useState<'PENDING_LIST' | 'SESSION_DETAIL' | 'HISTORY'>('SESSION_DETAIL');

  // Selected session ID
  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    const pending = sessions.find((s) => s.status === 'PENDING');
    return pending ? pending.id : sessions[0]?.id || '';
  });

  // Selected question in active session
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  // Checked question IDs for bulk action
  const [checkedQuestionIds, setCheckedQuestionIds] = useState<string[]>([]);

  // Search & Filters for pending sessions
  const [searchFilter, setSearchFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  // Modals state for Review APIs
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isApiDrawerOpen, setIsApiDrawerOpen] = useState(false);

  const pendingSessions = sessions.filter(
    (s) => s.status === 'PENDING' || s.status === 'IN_REVIEW' || s.status === 'PARTIAL_APPROVED'
  );
  const historySessions = sessions.filter(
    (s) => s.status === 'APPROVED' || s.status === 'REJECTED' || s.status === 'COMPLETED'
  );

  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  const activeQuestion = activeSession?.questions[selectedQuestionIndex] || activeSession?.questions[0];

  // Helper to open session detail (GET /sessions/{sessionId})
  const handleOpenSessionDetail = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSelectedQuestionIndex(0);
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      setCheckedQuestionIds(target.questions.map((q) => q.id));
    }
    setViewMode('SESSION_DETAIL');
  };

  // Toggle single question check
  const handleToggleQuestionCheck = (qId: string) => {
    setCheckedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  // Select all or none
  const handleToggleSelectAll = () => {
    if (!activeSession) return;
    if (checkedQuestionIds.length === activeSession.questions.length) {
      setCheckedQuestionIds([]);
    } else {
      setCheckedQuestionIds(activeSession.questions.map((q) => q.id));
    }
  };

  // Trigger Approve modal (POST /sessions/approve)
  const handleOpenApproveModal = (singleQuestionId?: string) => {
    if (!activeSession) return;
    if (singleQuestionId) {
      setCheckedQuestionIds([singleQuestionId]);
    } else if (checkedQuestionIds.length === 0) {
      setCheckedQuestionIds(activeSession.questions.map((q) => q.id));
    }
    setIsApproveModalOpen(true);
  };

  // Trigger Reject modal (POST /sessions/reject)
  const handleOpenRejectModal = (singleQuestionId?: string) => {
    if (!activeSession) return;
    if (singleQuestionId) {
      setCheckedQuestionIds([singleQuestionId]);
    } else if (checkedQuestionIds.length === 0) {
      setCheckedQuestionIds(activeSession.questions.map((q) => q.id));
    }
    setIsRejectModalOpen(true);
  };

  // Filtered pending sessions
  const filteredPendingSessions = pendingSessions.filter((s) => {
    const matchSubject = subjectFilter === 'ALL' || s.subject === subjectFilter;
    const matchSearch =
      s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.subject.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.creator.name.toLowerCase().includes(searchFilter.toLowerCase());
    return matchSubject && matchSearch;
  });

  const subjectsList = Array.from(new Set(sessions.map((s) => s.subject)));

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
                <CheckSquare className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                18. Giảng viên Duyệt Câu hỏi (Question Review)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                Chuẩn RESTful API
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Khu vực thẩm định đề xuất câu hỏi từ sinh viên, biên tập nội dung, phê chuẩn vào ngân hàng đề thi trường hoặc từ chối kèm phản hồi.
            </p>
          </div>

          {/* Action buttons on top right */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Link to Lecturer Question Bank */}
            <button
              onClick={() => setActiveTab('lecturer-bank')}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Database className="w-4 h-4" />
              <span>Ngân hàng đề của Giảng viên ({questions.filter(q => q.status === 'NEED_EDIT').length} Cần edit)</span>
            </button>

            {/* Interactive Swagger button */}
            <button
              onClick={() => setIsApiDrawerOpen(true)}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:hover:bg-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Code className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Xem 6 API Swagger & Live Log</span>
            </button>

            <button
              onClick={() => setIsExportQuestionsOpen(true)}
              className="px-3.5 py-2 bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-gray-500" />
              <span>Xuất dữ liệu</span>
            </button>

            <button
              onClick={() => setIsExamWizardOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <Layers className="w-4 h-4" />
              <span>Sinh đề thi chính thức</span>
            </button>
          </div>
        </div>



        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs">
          <div
            onClick={() => setViewMode('PENDING_LIST')}
            className="p-3 bg-purple-50/50 dark:bg-[#1E1F20] rounded-xl border border-purple-100 dark:border-purple-900/40 cursor-pointer hover:border-purple-400 transition"
          >
            <span className="text-gray-500 block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-600" /> Phiên chờ duyệt (GET /sessions/pending)
            </span>
            <span className="text-xl font-black text-purple-700 dark:text-purple-300">
              {pendingSessions.length} phiên
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Câu hỏi trong các phiên
            </span>
            <span className="text-xl font-black text-gray-900 dark:text-gray-100">
              {sessions.reduce((acc, s) => acc + s.questions.length, 0)} câu
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 block flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-blue-600" /> Tỉ lệ duyệt đạt chuẩn
            </span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400">
              88.5%
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 block flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-emerald-600" /> Ngân hàng chính thức
            </span>
            <span className="text-xl font-black text-gray-900 dark:text-gray-100">
              {questions.filter((q) => q.status === 'APPROVED').length} câu đã nạp
            </span>
          </div>
        </div>
      </div>

      {/* Primary Sub-Navigation Bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 text-xs font-bold gap-1 bg-white dark:bg-[#242526] px-4 rounded-xl shadow-xs">
        <button
          onClick={() => setViewMode('PENDING_LIST')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            viewMode === 'PENDING_LIST'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Danh sách phiên chờ duyệt</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
            GET /sessions/pending
          </span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-bold ml-1">
            {pendingSessions.length}
          </span>
        </button>

        <button
          onClick={() => setViewMode('SESSION_DETAIL')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            viewMode === 'SESSION_DETAIL'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Chi tiết thẩm định phiên</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
            GET /sessions/{activeSession ? activeSession.id : '{id}'}
          </span>
        </button>

        <button
          onClick={() => setViewMode('HISTORY')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            viewMode === 'HISTORY'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          <span>Lịch sử phiên đã chốt duyệt ({historySessions.length})</span>
        </button>
      </div>

      {/* =========================================================================
          VIEW 1: DANH SÁCH PHIÊN CHỜ DUYỆT (GET /sessions/pending)
          ========================================================================= */}
      {viewMode === 'PENDING_LIST' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-[#242526] rounded-xl p-4 shadow-xs border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Tìm phiên theo tên, môn học, sinh viên..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>

            {/* Subject Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <span className="text-gray-500 font-bold shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Môn học:
              </span>
              <button
                onClick={() => setSubjectFilter('ALL')}
                className={`px-3 py-1.5 rounded-full font-bold transition text-xs shrink-0 ${
                  subjectFilter === 'ALL'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Tất cả ({pendingSessions.length})
              </button>
              {subjectsList.map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSubjectFilter(subj)}
                  className={`px-3 py-1.5 rounded-full font-bold transition text-xs shrink-0 ${
                    subjectFilter === subj
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          </div>

          {/* Pending Sessions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPendingSessions.map((sess) => {
              const approvedCount = sess.questions.filter((q) => q.status === 'APPROVED').length;
              const rejectedCount = sess.questions.filter((q) => q.status === 'REJECTED').length;

              return (
                <div
                  key={sess.id}
                  className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-between hover:shadow-md transition group"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                        {sess.subject}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        {sess.status}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-purple-600 transition line-clamp-2">
                        {sess.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">{sess.chapter}</p>
                    </div>

                    {/* Author Card */}
                    <div className="flex items-center gap-2.5 p-2 bg-gray-50 dark:bg-[#1E1F20] rounded-xl border border-gray-100 dark:border-gray-800">
                      <AvatarWithFrame user={sess.creator} size="sm" />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-gray-800 dark:text-gray-200 block truncate">
                          {sess.creator.name}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate">
                          {sess.creator.classOrTitle} • Gửi {sess.submittedAt}
                        </span>
                      </div>
                    </div>

                    {/* Questions count & progress summary */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>Số lượng câu trong phiên:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {sess.questions.length} câu
                        </span>
                      </div>
                      {approvedCount > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-emerald-600">
                          <span>Đã duyệt đạt chuẩn:</span>
                          <span className="font-bold">{approvedCount} câu</span>
                        </div>
                      )}
                      {rejectedCount > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-red-600">
                          <span>Đã từ chối:</span>
                          <span className="font-bold">{rejectedCount} câu</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-4 mt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-gray-400">ID: {sess.id}</span>
                    <button
                      onClick={() => handleOpenSessionDetail(sess.id)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                    >
                      <span>Mở thẩm định & duyệt</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredPendingSessions.length === 0 && (
              <div className="col-span-full bg-white dark:bg-[#242526] rounded-2xl p-12 text-center text-gray-400 border border-gray-200 dark:border-gray-700">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-sm text-gray-700 dark:text-gray-300">
                  Tuyệt vời! Không có phiên đề xuất nào đang chờ duyệt.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Mọi câu hỏi từ sinh viên đã được thẩm định và xử lý xong.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: CHI TIẾT THẨM ĐỊNH PHIÊN (GET /sessions/{sessionId})
          ========================================================================= */}
      {viewMode === 'SESSION_DETAIL' && activeSession && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Active Session Top Bar with Batch Actions */}
          <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('PENDING_LIST')}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-600 dark:text-gray-300 transition"
                  title="Quay lại danh sách"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-gray-900 dark:text-gray-100">
                      {activeSession.title}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300">
                      GET /sessions/{activeSession.id}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Môn học: <span className="font-bold text-gray-800 dark:text-gray-200">{activeSession.subject}</span> • {activeSession.chapter} • Sinh viên: {activeSession.creator.name}
                  </p>
                </div>
              </div>

              {/* Batch Action Buttons Bar (POST /sessions/approve, POST /sessions/reject, POST /sessions/{id}/complete-review) */}
              <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
                {/* Select All Checkbox */}
                <button
                  onClick={handleToggleSelectAll}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 transition"
                >
                  {checkedQuestionIds.length === activeSession.questions.length ? 'Bỏ chọn tất cả' : `Chọn tất cả (${activeSession.questions.length})`}
                </button>

                {/* POST /sessions/approve */}
                <button
                  onClick={() => handleOpenApproveModal()}
                  disabled={checkedQuestionIds.length === 0}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                    checkedQuestionIds.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  }`}
                  title="POST /sessions/approve"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Duyệt ({checkedQuestionIds.length}) câu vào Ngân hàng</span>
                </button>

                {/* POST /sessions/reject */}
                <button
                  onClick={() => handleOpenRejectModal()}
                  disabled={checkedQuestionIds.length === 0}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                    checkedQuestionIds.length > 0
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  }`}
                  title="POST /sessions/reject"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Từ chối ({checkedQuestionIds.length}) câu</span>
                </button>

                {/* POST /sessions/{sessionId}/complete-review */}
                <button
                  onClick={() => setIsCompleteModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-1.5"
                  title="POST /sessions/{sessionId}/complete-review"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Chốt hoàn tất duyệt phiên</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3-Panel Studio Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* PANEL 1: Question Selector in Session (3 cols) */}
            <div className="lg:col-span-3 bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-bold text-xs text-gray-700 dark:text-gray-300">
                  Câu hỏi trong phiên ({activeSession.questions.length})
                </span>
                <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                  {activeSession.subject}
                </span>
              </div>

              <div className="space-y-2">
                {activeSession.questions.map((q, idx) => {
                  const isChecked = checkedQuestionIds.includes(q.id);
                  const isSelected = selectedQuestionIndex === idx;

                  return (
                    <div
                      key={q.id}
                      onClick={() => setSelectedQuestionIndex(idx)}
                      className={`p-3 rounded-xl border cursor-pointer text-xs transition relative ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 ring-1 ring-purple-600'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#242526] hover:bg-gray-50 dark:hover:bg-[#3A3B3C]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {/* Checkbox for batch selection */}
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleQuestionCheck(q.id);
                            }}
                            className="w-3.5 h-3.5 text-purple-600 rounded cursor-pointer"
                          />
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            Câu #{idx + 1}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            q.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : q.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {q.status === 'APPROVED'
                            ? 'Đã duyệt'
                            : q.status === 'REJECTED'
                            ? 'Từ chối'
                            : 'Chờ duyệt'}
                        </span>
                      </div>

                      <p className="line-clamp-2 text-gray-600 dark:text-gray-300 text-[11px] font-medium leading-relaxed">
                        {q.content}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                        <span>
                          Độ khó: {q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'MEDIUM' ? 'TB' : 'Khó'}
                        </span>
                        {q.isEditedByLecturer && (
                          <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-0.5">
                            <Edit3 className="w-3 h-3" /> Đã sửa
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PANEL 2: Active Question Detail & Inspector (6 cols) */}
            <div className="lg:col-span-6 bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-5 space-y-4">
              {activeQuestion ? (
                <>
                  {/* Top Bar for active question */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                          Chi tiết Câu hỏi #{selectedQuestionIndex + 1}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">({activeQuestion.id})</span>
                        {activeQuestion.isEditedByLecturer && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1">
                            <Edit3 className="w-3 h-3" /> Đã qua GV hiệu đính
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{activeSession.chapter}</p>
                    </div>

                    {/* Question Actions: Open Lecturer Bank to edit and interact with AI */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setActiveTab('lecturer-bank')}
                        className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:hover:bg-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                        title="Chuyển đến Ngân hàng đề của Giảng viên để biên tập và tương tác AI"
                      >
                        <Database className="w-3.5 h-3.5 text-purple-600" />
                        <span>Mở Ngân hàng đề GV để biên tập & chat AI →</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Duplicate & Quality Check */}
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">Kiểm tra trùng lặp AI: Đạt chuẩn (0% trùng)</span>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          Không phát hiện câu hỏi tương tự trong ngân hàng đề thi toàn trường.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                      Chất lượng cao
                    </span>
                  </div>

                  {/* Question Content */}
                  <div className="bg-gray-50 dark:bg-[#1E1F20] p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                      <span>NỘI DUNG ĐỀ BÀI</span>
                      <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {activeQuestion.difficulty === 'EASY'
                          ? 'Dễ (Nhận biết)'
                          : activeQuestion.difficulty === 'MEDIUM'
                          ? 'TB (Thông hiểu)'
                          : 'Khó (Vận dụng)'}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                      {activeQuestion.content}
                    </p>
                  </div>

                  {/* 4 Options */}
                  <div className="space-y-2 text-xs">
                    <span className="font-bold text-gray-600 dark:text-gray-400 text-[11px] block uppercase">
                      Phương án lựa chọn:
                    </span>
                    {activeQuestion.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition ${
                          opt.id === activeQuestion.correctAnswer
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-400'
                            : 'bg-white dark:bg-[#242526] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                              opt.id === activeQuestion.correctAnswer
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {opt.id === activeQuestion.correctAnswer && (
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                            Đáp án đúng
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Explanation */}
                  <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl text-xs text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-900/50 space-y-1">
                    <strong className="block font-bold">Giải thích chuẩn của tác giả / Giáo trình:</strong>
                    <p className="leading-relaxed">{activeQuestion.explanation}</p>
                  </div>

                  {/* If Rejected already, show reason */}
                  {activeQuestion.status === 'REJECTED' && activeQuestion.rejectionReason && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-800 dark:text-red-200 space-y-1">
                      <span className="font-bold flex items-center gap-1.5 text-red-700 dark:text-red-300">
                        <XCircle className="w-4 h-4" /> Lý do từ chối trước đó:
                      </span>
                      <p>{activeQuestion.rejectionReason}</p>
                    </div>
                  )}

                  {/* If Approved, show bank folder */}
                  {activeQuestion.status === 'APPROVED' && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-600" />
                        <span>
                          Đã phê chuẩn vào: <strong>{activeQuestion.targetBankCategory || 'Ngân hàng đề thi chung'}</strong>
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                        Chính thức
                      </span>
                    </div>
                  )}

                  {/* Direct Question Action Buttons */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenApproveModal(activeQuestion.id)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Duyệt câu này vào Ngân hàng</span>
                    </button>

                    <button
                      onClick={() => handleOpenRejectModal(activeQuestion.id)}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Từ chối câu này</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <p>Chọn một câu hỏi ở danh sách bên trái để tiến hành kiểm duyệt</p>
                </div>
              )}
            </div>

            {/* PANEL 3: Author & Review Control Center (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Student Author Card */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 pb-2 border-b border-gray-100 dark:border-gray-700">
                  Sinh viên đề xuất
                </h3>

                <div className="flex items-center gap-3">
                  <AvatarWithFrame user={activeSession.creator} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">
                      {activeSession.creator.name}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">{activeSession.creator.classOrTitle}</p>
                    <span className="inline-block text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold mt-1">
                      {activeSession.creator.points} điểm cống hiến
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl text-xs space-y-1.5 text-gray-600 dark:text-gray-300">
                  <p className="flex justify-between">
                    <strong className="text-gray-500">Mã phiên:</strong>
                    <span className="font-mono">{activeSession.id}</span>
                  </p>
                  <p className="flex justify-between">
                    <strong className="text-gray-500">Thời gian gửi:</strong>
                    <span>{activeSession.submittedAt}</span>
                  </p>
                  <p className="flex justify-between">
                    <strong className="text-gray-500">Trạng thái:</strong>
                    <span className="font-bold text-purple-600">{activeSession.status}</span>
                  </p>
                </div>
              </div>

              {/* Session Review Progress */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 pb-2 border-b border-gray-100 dark:border-gray-700">
                  Tiến độ duyệt phiên
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt (APPROVED):
                    </span>
                    <span className="font-bold">
                      {activeSession.questions.filter((q) => q.status === 'APPROVED').length} / {activeSession.questions.length}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Bị từ chối (REJECTED):
                    </span>
                    <span className="font-bold">
                      {activeSession.questions.filter((q) => q.status === 'REJECTED').length} / {activeSession.questions.length}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Chờ thẩm định:
                    </span>
                    <span className="font-bold">
                      {activeSession.questions.filter((q) => q.status === 'PENDING').length} / {activeSession.questions.length}
                    </span>
                  </div>
                </div>

                {/* Main Final Complete Action Button */}
                <div className="pt-2">
                  <button
                    onClick={() => setIsCompleteModalOpen(true)}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Chốt hoàn tất duyệt phiên này</span>
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-1.5">
                    (Gọi API POST /sessions/{activeSession.id}/complete-review)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: LỊCH SỬ ĐÃ DUYỆT & ĐÓNG PHIÊN (COMPLETED / APPROVED / REJECTED)
          ========================================================================= */}
      {viewMode === 'HISTORY' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">
              Lịch sử các phiên đã hoàn tất thẩm định ({historySessions.length} phiên)
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Theo dõi kết quả các phiên đã được chốt hoàn tất (POST /sessions/{`{id}`}/complete-review) và lưu trữ trong hồ sơ học phần.
            </p>

            <div className="space-y-3">
              {historySessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1E1F20]/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                        {sess.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sess.status === 'APPROVED' || sess.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        }`}
                      >
                        {sess.status}
                      </span>
                    </div>
                    <p className="text-gray-500">
                      Môn học: {sess.subject} • Tác giả: {sess.creator.name} • Đã thẩm định: {sess.reviewedAt || 'Gần đây'}
                    </p>
                    {sess.lecturerFeedback && (
                      <p className="text-gray-600 dark:text-gray-400 italic">
                        "Nhận xét của GV: {sess.lecturerFeedback}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenSessionDetail(sess.id)}
                      className="px-3.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition"
                    >
                      Xem lại chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS INTEGRATION FOR REVIEW
          ========================================================================= */}
      {/* 1. POST /sessions/approve Phê duyệt danh sách câu hỏi */}
      <ApproveQuestionsModal
        session={activeSession}
        selectedQuestionIds={checkedQuestionIds}
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
      />

      {/* 3. POST /sessions/reject Từ chối danh sách câu hỏi */}
      <RejectQuestionsModal
        session={activeSession}
        selectedQuestionIds={checkedQuestionIds}
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
      />

      {/* 4. POST /sessions/{sessionId}/complete-review Chốt hoàn tất duyệt phiên đề xuất */}
      <CompleteReviewModal
        session={activeSession}
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        onSuccess={() => setViewMode('HISTORY')}
      />

      {/* 5. Interactive Swagger & Live API Log Inspector Drawer */}
      <ApiInspectorDrawer
        isOpen={isApiDrawerOpen}
        onClose={() => setIsApiDrawerOpen(false)}
      />
    </div>
  );
};
