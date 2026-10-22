import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { Question, QuestionDifficulty, QuestionStatus } from '../../demo/types';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import {
  Database,
  Edit3,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Award,
  Search,
  Filter,
  CheckCheck,
  Send,
  Bot,
  User,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  FileText,
  AlertCircle,
  RotateCcw,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { EditQuestionModal } from './EditQuestionModal';
import { ApiInspectorDrawer } from './ApiInspectorDrawer';

interface AIChatMessage {
  id: string;
  sender: 'LECTURER' | 'AI';
  text: string;
  suggestedContent?: string;
  suggestedExplanation?: string;
  suggestedOptions?: { id: 'A' | 'B' | 'C' | 'D'; text: string }[];
  timestamp: string;
}

export const LecturerBankView: React.FC = () => {
  const {
    questions,
    currentUser,
    role,
    editQuestionByLecturer,
    decideKeepQuestion,
    decideDiscardQuestion,
    setIsExamWizardOpen,
    setActiveTab,
    showToast
  } = useApp();

  // Filters & Tabs
  const [activeFilterTab, setActiveFilterTab] = useState<'NEED_EDIT' | 'APPROVED' | 'REJECTED' | 'ALL'>('NEED_EDIT');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected question in workspace
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isApiDrawerOpen, setIsApiDrawerOpen] = useState(false);
  const [discardReasonModalOpen, setDiscardReasonModalOpen] = useState(false);
  const [discardReason, setDiscardReason] = useState('Độ khó chưa cân xứng với đề thi học phần.');

  // AI Chat state for current question
  const [aiInputPrompt, setAiInputPrompt] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'AI',
      text: 'Xin chào Thầy/Cô! Em là Trợ lý AI học thuật. Thầy/Cô có thể yêu cầu em viết lại văn phong câu hỏi, tạo phương án nhiễu hoặc bổ sung giải thích chi tiết theo giáo trình.',
      timestamp: 'Vừa xong'
    }
  ]);

  // Filtered questions
  const lecturerQuestions = questions.filter((q) => {
    // Show questions in lecturer bank or with NEED_EDIT/APPROVED/REJECTED status
    const matchesBank = q.inLecturerBank || q.status === 'NEED_EDIT' || q.status === 'APPROVED' || q.status === 'REJECTED';
    const matchesTab =
      activeFilterTab === 'ALL'
        ? true
        : activeFilterTab === 'NEED_EDIT'
        ? q.status === 'NEED_EDIT'
        : activeFilterTab === 'APPROVED'
        ? q.status === 'APPROVED'
        : q.status === 'REJECTED';
    const matchesSubject = selectedSubject === 'ALL' || q.subject === selectedSubject;
    const matchesDiff = selectedDifficulty === 'ALL' || q.difficulty === selectedDifficulty;
    const matchesSearch =
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.chapter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.creatorName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesBank && matchesTab && matchesSubject && matchesDiff && matchesSearch;
  });

  // Current active question
  const activeQuestion =
    lecturerQuestions.find((q) => q.id === selectedQuestionId) ||
    lecturerQuestions[0] ||
    questions.find((q) => q.status === 'NEED_EDIT') ||
    questions[0];

  // Subjects set
  const subjectsList = Array.from(new Set(questions.map((q) => q.subject)));

  // Counts
  const needEditCount = questions.filter((q) => q.status === 'NEED_EDIT').length;
  const approvedCount = questions.filter((q) => q.status === 'APPROVED').length;
  const rejectedCount = questions.filter((q) => q.status === 'REJECTED' && (q.studentPointsReserved || q.inLecturerBank)).length;

  // Handle AI Chat Send
  const handleSendAiPrompt = (presetText?: string) => {
    const promptToSend = presetText || aiInputPrompt;
    if (!promptToSend.trim() || !activeQuestion) return;

    const userMsg: AIChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'LECTURER',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setAiInputPrompt('');
    setIsAiThinking(true);

    setTimeout(() => {
      setIsAiThinking(false);
      let replyText = '';
      let suggestedContent = activeQuestion.content;
      let suggestedExplanation = activeQuestion.explanation;

      if (promptToSend.includes('văn phong') || promptToSend.includes('sư phạm')) {
        replyText =
          'Em đã chuẩn hóa câu hỏi theo văn phong trắc nghiệm khách quan chuẩn Bộ GD&ĐT: lược bỏ các đại từ mơ hồ, dùng thuật ngữ chuyên ngành chuẩn xác và nêu rõ điều kiện biên.';
        suggestedContent =
          activeQuestion.content.replace(/\?$/, '') +
          ' (Xét trong môi trường giả định chuẩn theo quy chuẩn kỹ thuật quốc tế)?';
        suggestedExplanation =
          'Theo giáo trình chuẩn: ' + activeQuestion.explanation;
      } else if (promptToSend.includes('nhiễu') || promptToSend.includes('phương án')) {
        replyText =
          'Em đã tối ưu 3 phương án gây nhiễu B, C, D để đánh giá đúng lỗ hổng nhận thức thường gặp của sinh viên (hiểu sai khái niệm, nhầm lẫn đơn vị hoặc giả định sai).';
        suggestedExplanation =
          activeQuestion.explanation +
          ' [Ghi chú phương án nhiễu: Các phương án sai bẫy lỗi nhầm lẫn điển hình của sinh viên K64].';
      } else if (promptToSend.includes('giải thích')) {
        replyText =
          'Em đã bổ sung giải thích chuyên sâu có dẫn xuất công thức và tài liệu tham khảo giáo trình chính khóa.';
        suggestedExplanation =
          activeQuestion.explanation +
          ' (Tài liệu tham khảo: Giáo trình ' +
          activeQuestion.subject +
          ', NXB Đại học Quốc gia, Chương ' +
          activeQuestion.chapter +
          ').';
      } else {
        replyText =
          'Em đã hiệu đính câu hỏi theo yêu cầu: "' +
          promptToSend +
          '". Đề xuất đã được tối ưu hóa cho dạng Single-choice.';
        suggestedContent =
          activeQuestion.content + ' [Phiên bản AI tối ưu hóa văn phong sư phạm]';
      }

      const aiMsg: AIChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'AI',
        text: replyText,
        suggestedContent,
        suggestedExplanation,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    }, 900);
  };

  // Apply AI suggestion to question
  const handleApplyAiSuggestion = (msg: AIChatMessage) => {
    if (!activeQuestion) return;
    editQuestionByLecturer(activeQuestion.id, {
      content: msg.suggestedContent || activeQuestion.content,
      explanation: msg.suggestedExplanation || activeQuestion.explanation,
      isEditedByLecturer: true,
      editedAt: 'Vừa xong'
    });
    showToast('Đã áp dụng đề xuất cải thiện của AI vào câu hỏi!', 'success');
  };

  // Handle Discard confirm
  const handleConfirmDiscard = () => {
    if (!activeQuestion) return;
    decideDiscardQuestion(activeQuestion.id, discardReason);
    setDiscardReasonModalOpen(false);
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 space-y-4">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
                <Database className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                Ngân Hàng Đề Thi Riêng Của Giảng Viên
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                TS. Trần Minh Đức
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-4xl leading-relaxed">
              <strong>Quy trình duyệt theo chuẩn:</strong> Câu hỏi tiềm năng sau khi được duyệt từ sinh viên sẽ nạp vào kho này ở trạng thái <strong>"Cần edit"</strong> (điểm cộng của SV đã được chốt bảo lưu). Tại đây, Giảng viên có toàn quyền <strong>chỉnh sửa câu hỏi (PUT)</strong>, <strong>chat với AI (LLM)</strong> để cải thiện văn phong, quyết định <strong>Giữ / Loại</strong> và <strong>bốc tách sinh đề thi</strong>.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsExamWizardOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <Layers className="w-4 h-4" />
              <span>Sinh đề thi (Bốc tách ngẫu nhiên / Có chủ đích)</span>
            </button>

            <button
              onClick={() => setActiveTab('review')}
              className="px-3.5 py-2 bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-gray-500" />
              <span>Mở Hàng chờ duyệt từ SV</span>
            </button>
          </div>
        </div>

        {/* 4 Status Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs">
          <div
            onClick={() => setActiveFilterTab('NEED_EDIT')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              activeFilterTab === 'NEED_EDIT'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-1 ring-amber-500'
                : 'bg-gray-50 dark:bg-[#1E1F20] border-gray-100 dark:border-gray-800 hover:border-gray-300'
            }`}
          >
            <span className="text-amber-700 dark:text-amber-300 font-bold block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Trạng thái "Cần edit"
            </span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">
              {needEditCount} câu
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              (Điểm SV đã chốt bảo lưu)
            </span>
          </div>

          <div
            onClick={() => setActiveFilterTab('APPROVED')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              activeFilterTab === 'APPROVED'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-500'
                : 'bg-gray-50 dark:bg-[#1E1F20] border-gray-100 dark:border-gray-800 hover:border-gray-300'
            }`}
          >
            <span className="text-emerald-700 dark:text-emerald-300 font-bold block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã chuẩn hóa / Giữ lại
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {approvedCount} câu
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              (Sẵn sàng bốc tách sinh đề)
            </span>
          </div>

          <div
            onClick={() => setActiveFilterTab('REJECTED')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              activeFilterTab === 'REJECTED'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 ring-1 ring-red-500'
                : 'bg-gray-50 dark:bg-[#1E1F20] border-gray-100 dark:border-gray-800 hover:border-gray-300'
            }`}
          >
            <span className="text-red-700 dark:text-red-300 font-bold block flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Đã quyết định loại
            </span>
            <span className="text-xl font-black text-red-600 dark:text-red-400">
              {rejectedCount} câu
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              (Điểm SV vẫn được bảo lưu)
            </span>
          </div>

          <div
            onClick={() => setActiveFilterTab('ALL')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              activeFilterTab === 'ALL'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 ring-1 ring-purple-500'
                : 'bg-gray-50 dark:bg-[#1E1F20] border-gray-100 dark:border-gray-800 hover:border-gray-300'
            }`}
          >
            <span className="text-gray-500 font-bold block flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-purple-600" /> Tổng ngân hàng GV
            </span>
            <span className="text-xl font-black text-gray-900 dark:text-gray-100">
              {questions.length} câu
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              (Toàn bộ các môn học)
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo nội dung câu hỏi, chương, tác giả..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">Tất cả môn học</option>
            {subjectsList.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">Mọi độ khó</option>
            <option value="EASY">Dễ (Nhận biết)</option>
            <option value="MEDIUM">Trung bình (Vận dụng)</option>
            <option value="HARD">Khó (Vận dụng cao)</option>
          </select>
        </div>
      </div>

      {/* 3-COLUMN STUDIO WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* =========================================================================
            PANEL 1 (3 cols): Question Selector List
            ========================================================================= */}
        <div className="lg:col-span-3 bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-3.5 space-y-3 flex flex-col max-h-[820px]">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
            <span className="font-bold text-xs text-gray-700 dark:text-gray-300">
              Danh sách câu hỏi ({lecturerQuestions.length})
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              {activeFilterTab === 'NEED_EDIT'
                ? 'Cần edit'
                : activeFilterTab === 'APPROVED'
                ? 'Đã chuẩn hóa'
                : activeFilterTab === 'REJECTED'
                ? 'Đã loại'
                : 'Tất cả'}
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {lecturerQuestions.map((q, idx) => {
              const isSelected = activeQuestion?.id === q.id;

              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestionId(q.id)}
                  className={`p-3 rounded-xl border cursor-pointer text-xs transition relative ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 ring-1 ring-purple-600'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#242526] hover:bg-gray-50 dark:hover:bg-[#3A3B3C]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      #{idx + 1} • {q.subject}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        q.status === 'NEED_EDIT'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : q.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {q.status === 'NEED_EDIT'
                        ? 'Cần edit'
                        : q.status === 'APPROVED'
                        ? 'Đã chuẩn hóa'
                        : 'Đã loại'}
                    </span>
                  </div>

                  <p className="line-clamp-2 text-gray-600 dark:text-gray-300 text-[11px] font-medium leading-relaxed">
                    {q.content}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                    <span>
                      Độ khó: {q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'MEDIUM' ? 'TB' : 'Khó'}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      +{q.studentPointsReserved || 20}đ SV bảo lưu
                    </span>
                  </div>
                </div>
              );
            })}

            {lecturerQuestions.length === 0 && (
              <div className="text-center py-12 text-gray-400 space-y-1">
                <Database className="w-8 h-8 mx-auto opacity-40 mb-1" />
                <p className="font-semibold text-xs">Không có câu hỏi phù hợp</p>
                <p className="text-[11px]">Hãy chọn bộ lọc khác hoặc duyệt thêm câu từ SV.</p>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            PANEL 2 (5 cols): Active Question Detail & Teacher Editing (PUT) & Decision
            ========================================================================= */}
        <div className="lg:col-span-5 bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-5 space-y-4 flex flex-col justify-between">
          {activeQuestion ? (
            <div className="space-y-4">
              {/* Top Question Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      Biên Tập Câu Hỏi ({activeQuestion.id})
                    </span>
                    {activeQuestion.status === 'NEED_EDIT' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Trạng thái: Cần edit
                      </span>
                    )}
                    {activeQuestion.status === 'APPROVED' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Đã chuẩn hóa (Sẵn sàng thi)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Môn: <strong className="text-gray-800 dark:text-gray-200">{activeQuestion.subject}</strong> • {activeQuestion.chapter}
                  </p>
                </div>

                {/* Question Edit Button: PUT /questions/{id} */}
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa câu hỏi (PUT)</span>
                </button>
              </div>

              {/* Student Points Reserved Notice (Slide requirement) */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold">
                      Sinh viên đề xuất: {activeQuestion.creatorName}
                    </span>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      Điểm cống hiến (+{activeQuestion.studentPointsReserved || 20}đ) đã được chốt bảo lưu cho sinh viên khi chuyển vào ngân hàng đề GV.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white shrink-0">
                  +{activeQuestion.studentPointsReserved || 20}đ Bảo lưu
                </span>
              </div>

              {/* Question Content Box */}
              <div className="bg-gray-50 dark:bg-[#1E1F20] p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                  <span>NỘI DUNG ĐỀ BÀI (SINGLE-CHOICE)</span>
                  <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {activeQuestion.difficulty === 'EASY'
                      ? 'Dễ (Nhận biết)'
                      : activeQuestion.difficulty === 'MEDIUM'
                      ? 'Trung bình (Vận dụng)'
                      : 'Khó (Vận dụng cao)'}
                  </span>
                </div>
                <p className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                  {activeQuestion.content}
                </p>
              </div>

              {/* 4 Options */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-gray-600 dark:text-gray-400 text-[11px] block uppercase">
                  4 Phương án trắc nghiệm:
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
                <strong className="block font-bold">Giải thích chuẩn khoa học:</strong>
                <p className="leading-relaxed">{activeQuestion.explanation}</p>
              </div>

              {/* DECISION ACTION BUTTONS: GIỮ / LOẠI (Yêu cầu chức năng 1) */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Quyết định của Giảng viên (Giữ / Loại):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decideKeepQuestion(activeQuestion.id)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Giữ & Chuẩn hóa vào kho thi</span>
                  </button>

                  <button
                    onClick={() => setDiscardReasonModalOpen(true)}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Quyết định loại khỏi kho</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <Database className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Chọn câu hỏi từ danh sách bên trái để xem chi tiết và biên tập</p>
            </div>
          )}
        </div>

        {/* =========================================================================
            PANEL 3 (4 cols): AI LLM Chatbot Studio (Tương tác AI - Yêu cầu chức năng 2)
            ========================================================================= */}
        <div className="lg:col-span-4 bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-3 flex flex-col max-h-[820px]">
          {/* AI Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-gray-900 dark:text-gray-100">
                  Tương tác AI (LLM) Trực Tiếp
                </h3>
                <p className="text-[10px] text-gray-400">Tự động cải thiện văn phong & câu hỏi</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              Online
            </span>
          </div>

          {/* Quick AI Prompts */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Gợi ý prompt 1 chạm:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                onClick={() => handleSendAiPrompt('Cải thiện văn phong sư phạm và làm rõ câu hỏi')}
                className="p-1.5 text-left rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800/60 transition truncate"
              >
                ✨ Chuẩn hóa văn phong
              </button>
              <button
                onClick={() => handleSendAiPrompt('Tối ưu hóa 3 phương án gây nhiễu B, C, D có tính phân loại cao')}
                className="p-1.5 text-left rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800/60 transition truncate"
              >
                🎯 Tối ưu đáp án nhiễu
              </button>
              <button
                onClick={() => handleSendAiPrompt('Bổ sung lời giải thích chi tiết có trích dẫn giáo trình')}
                className="p-1.5 text-left rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800/60 transition truncate"
              >
                📖 Thêm giải thích chuẩn
              </button>
              <button
                onClick={() => handleSendAiPrompt('Đơn giản hóa câu văn để sinh viên dễ hiểu')}
                className="p-1.5 text-left rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800/60 transition truncate"
              >
                ⚡ Rút gọn súc tích
              </button>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto space-y-3 p-1 text-xs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'LECTURER' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[90%] space-y-2 leading-relaxed ${
                    msg.sender === 'LECTURER'
                      ? 'bg-purple-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-gray-100 dark:bg-[#1E1F20] text-gray-800 dark:text-gray-200 rounded-tl-xs border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <p className="text-xs">{msg.text}</p>

                  {/* AI Suggested Content & Apply Button */}
                  {msg.suggestedContent && (
                    <div className="mt-2 pt-2 border-t border-purple-400/40 dark:border-gray-700 space-y-1.5 bg-white/10 dark:bg-black/20 p-2 rounded-xl">
                      <span className="font-bold text-[10px] uppercase tracking-wider block text-purple-700 dark:text-purple-300">
                        Bản đề xuất sửa đổi của AI:
                      </span>
                      <p className="text-[11px] italic font-medium">{msg.suggestedContent}</p>
                      <button
                        onClick={() => handleApplyAiSuggestion(msg)}
                        className="w-full mt-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition flex items-center justify-center gap-1 shadow-xs"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Áp dụng vào câu hỏi này</span>
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isAiThinking && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl text-gray-500 text-xs">
                <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                <span>Trợ lý AI đang phân tích và cải thiện văn phong...</span>
              </div>
            )}
          </div>

          {/* Chat Input Field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendAiPrompt();
            }}
            className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2"
          >
            <input
              type="text"
              value={aiInputPrompt}
              onChange={(e) => setAiInputPrompt(e.target.value)}
              placeholder="Gõ yêu cầu sửa câu hỏi (VD: làm rõ câu hỏi hơn)..."
              className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] border border-gray-200 dark:border-gray-600 text-xs text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={!aiInputPrompt.trim() || isAiThinking}
              className={`p-2 rounded-xl text-white transition ${
                aiInputPrompt.trim() && !isAiThinking
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-xs'
                  : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* =========================================================================
          MODALS INTEGRATION
          ========================================================================= */}
      {/* 1. Modal Chỉnh sửa câu hỏi (PUT /questions/{id}) - Nằm trong Ngân hàng đề của GV */}
      <EditQuestionModal
        question={activeQuestion}
        sessionId={activeQuestion?.sessionId || ''}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* 2. Modal Xác nhận Loại câu hỏi (Bảo lưu điểm SV) */}
      {discardReasonModalOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-md w-full p-5 border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Quyết định loại câu hỏi khỏi kho đề
            </h3>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200">
              <strong>Lưu ý quan trọng theo quy chế:</strong> Điểm cộng của sinh viên (
              {activeQuestion?.studentPointsReserved || 20} điểm) vẫn được chốt bảo lưu trọn vẹn, không bị thu hồi khi loại bỏ câu hỏi khỏi kho đề thi.
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Lý do loại câu hỏi:
              </label>
              <textarea
                rows={2}
                value={discardReason}
                onChange={(e) => setDiscardReason(e.target.value)}
                className="w-full p-2.5 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDiscardReasonModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDiscard}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Xác nhận loại câu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Interactive API Inspector Drawer */}
      <ApiInspectorDrawer
        isOpen={isApiDrawerOpen}
        onClose={() => setIsApiDrawerOpen(false)}
      />
    </div>
  );
};
