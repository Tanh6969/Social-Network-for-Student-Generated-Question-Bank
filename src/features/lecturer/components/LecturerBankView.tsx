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
  ArrowRight,
  Target,
  Zap,
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
      <div className="bg-fb-card rounded-lg shadow-fb-card p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-lg bg-fb-blue text-white shadow-xs">
                <Database className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-fb-text tracking-tight">
                Ngân Hàng Đề Thi Riêng Của Giảng Viên
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-fb-blue-soft text-fb-blue">
                TS. Trần Minh Đức
              </span>
            </div>
            <p className="text-xs text-fb-text-2 max-w-4xl leading-relaxed">
              <strong>Quy trình duyệt theo chuẩn:</strong> Câu hỏi tiềm năng sau khi được duyệt từ sinh viên sẽ nạp vào kho này ở trạng thái <strong>"Cần edit"</strong> (điểm cộng của SV đã được chốt bảo lưu). Tại đây, Giảng viên có toàn quyền <strong>chỉnh sửa câu hỏi (PUT)</strong>, <strong>chat với AI (LLM)</strong> để cải thiện văn phong, quyết định <strong>Giữ / Loại</strong> và <strong>bốc tách sinh đề thi</strong>.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('exams')}
              className="px-4 py-2 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Sinh đề thi (Bốc tách ngẫu nhiên / Có chủ đích)</span>
            </button>

            <button
              onClick={() => setActiveTab('review')}
              className="px-3.5 py-2 bg-fb-input hover:bg-fb-btn-hover text-fb-text rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-fb-text-2" />
              <span>Mở Hàng chờ duyệt từ SV</span>
            </button>
          </div>
        </div>

        {/* 4 Status Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-fb-divider text-xs">
          <div
            onClick={() => setActiveFilterTab('NEED_EDIT')}
            className={`p-3 rounded-lg border cursor-pointer transition ${
              activeFilterTab === 'NEED_EDIT'
                ? 'bg-fb-warning-soft border-fb-warning/30 ring-1 ring-fb-warning'
                : 'bg-fb-input border-fb-divider hover:border-fb-divider'
            }`}
          >
            <span className="text-fb-warning font-bold block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Trạng thái "Cần edit"
            </span>
            <span className="text-xl font-bold text-fb-warning">
              {needEditCount} câu
            </span>
            <span className="text-xs text-fb-text-3 block mt-0.5">
              (Điểm SV đã chốt bảo lưu)
            </span>
          </div>

          <div
            onClick={() => setActiveFilterTab('APPROVED')}
            className={`p-3 rounded-lg border cursor-pointer transition ${
              activeFilterTab === 'APPROVED'
                ? 'bg-fb-success-soft border-fb-success/30 ring-1 ring-fb-success'
                : 'bg-fb-input border-fb-divider hover:border-fb-divider'
            }`}
          >
            <span className="text-fb-success font-bold block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã chuẩn hóa / Giữ lại
            </span>
            <span className="text-xl font-bold text-fb-success">
              {approvedCount} câu
            </span>
            <span className="text-xs text-fb-text-3 block mt-0.5">
              (Sẵn sàng bốc tách sinh đề)
            </span>
          </div>

          <div
            onClick={() => setActiveFilterTab('REJECTED')}
            className={`p-3 rounded-lg border cursor-pointer transition ${
              activeFilterTab === 'REJECTED'
                ? 'bg-fb-danger-soft border-fb-danger/30 ring-1 ring-fb-danger'
                : 'bg-fb-input border-fb-divider hover:border-fb-divider'
            }`}
          >
            <span className="text-fb-danger font-bold block flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Đã quyết định loại
            </span>
            <span className="text-xl font-bold text-fb-danger">
              {rejectedCount} câu
            </span>
            <span className="text-xs text-fb-text-3 block mt-0.5">
              (Điểm SV vẫn được bảo lưu)
            </span>
          </div>

          <div
            onClick={() => setActiveFilterTab('ALL')}
            className={`p-3 rounded-lg border cursor-pointer transition ${
              activeFilterTab === 'ALL'
                ? 'bg-fb-blue-soft border-fb-blue/30 ring-1 ring-fb-blue'
                : 'bg-fb-input border-fb-divider hover:border-fb-divider'
            }`}
          >
            <span className="text-fb-text-2 font-bold block flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-fb-blue" /> Tổng ngân hàng GV
            </span>
            <span className="text-xl font-bold text-fb-text">
              {questions.length} câu
            </span>
            <span className="text-xs text-fb-text-3 block mt-0.5">
              (Toàn bộ các môn học)
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="bg-fb-card rounded-lg shadow-fb-card p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-fb-text-3 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo nội dung câu hỏi, chương, tác giả..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-fb-input border border-fb-divider text-fb-text focus:ring-2 focus:ring-fb-blue focus:outline-hidden"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-lg bg-fb-input border border-fb-divider text-fb-text font-semibold focus:outline-hidden focus:ring-2 focus:ring-fb-blue"
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
            className="px-3 py-2 rounded-lg bg-fb-input border border-fb-divider text-fb-text font-semibold focus:outline-hidden focus:ring-2 focus:ring-fb-blue"
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
        <div className="lg:col-span-3 bg-fb-card rounded-lg shadow-fb-card p-3.5 space-y-3 flex flex-col max-h-[820px]">
          <div className="flex items-center justify-between pb-2 border-b border-fb-divider">
            <span className="font-bold text-xs text-fb-text">
              Danh sách câu hỏi ({lecturerQuestions.length})
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-fb-blue-soft text-fb-blue">
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
                  className={`p-3 rounded-lg border cursor-pointer text-xs transition relative ${
                    isSelected
                      ? 'border-fb-blue bg-fb-blue-soft/70 ring-1 ring-fb-blue'
                      : 'border-fb-divider bg-fb-card hover:bg-fb-hover'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-fb-text">
                      #{idx + 1} • {q.subject}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        q.status === 'NEED_EDIT'
                          ? 'bg-fb-warning-soft text-fb-warning'
                          : q.status === 'APPROVED'
                          ? 'bg-fb-success-soft text-fb-success'
                          : 'bg-fb-danger-soft text-fb-danger'
                      }`}
                    >
                      {q.status === 'NEED_EDIT'
                        ? 'Cần edit'
                        : q.status === 'APPROVED'
                        ? 'Đã chuẩn hóa'
                        : 'Đã loại'}
                    </span>
                  </div>

                  <p className="line-clamp-2 text-fb-text-2 text-xs font-medium leading-relaxed">
                    {q.content}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-xs text-fb-text-3">
                    <span>
                      Độ khó: {q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'MEDIUM' ? 'TB' : 'Khó'}
                    </span>
                    <span className="text-fb-warning font-semibold">
                      +{q.studentPointsReserved || 20}đ SV bảo lưu
                    </span>
                  </div>
                </div>
              );
            })}

            {lecturerQuestions.length === 0 && (
              <div className="text-center py-12 text-fb-text-3 space-y-1">
                <Database className="w-8 h-8 mx-auto opacity-40 mb-1" />
                <p className="font-semibold text-xs">Không có câu hỏi phù hợp</p>
                <p className="text-xs">Hãy chọn bộ lọc khác hoặc duyệt thêm câu từ SV.</p>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            PANEL 2 (5 cols): Active Question Detail & Teacher Editing (PUT) & Decision
            ========================================================================= */}
        <div className="lg:col-span-5 bg-fb-card rounded-lg shadow-fb-card p-5 space-y-4 flex flex-col justify-between">
          {activeQuestion ? (
            <div className="space-y-4">
              {/* Top Question Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-fb-divider pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-fb-blue">
                      Biên Tập Câu Hỏi ({activeQuestion.id})
                    </span>
                    {activeQuestion.status === 'NEED_EDIT' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-fb-warning-soft text-fb-warning">
                        Trạng thái: Cần edit
                      </span>
                    )}
                    {activeQuestion.status === 'APPROVED' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-fb-success-soft text-fb-success">
                        Đã chuẩn hóa (Sẵn sàng thi)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-fb-text-2 mt-0.5">
                    Môn: <strong className="text-fb-text">{activeQuestion.subject}</strong> • {activeQuestion.chapter}
                  </p>
                </div>

                {/* Question Edit Button: PUT /questions/{id} */}
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3.5 py-1.5 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa câu hỏi (PUT)</span>
                </button>
              </div>

              {/* Student Points Reserved Notice (Slide requirement) */}
              <div className="p-3 bg-fb-warning-soft border border-fb-warning/30 rounded-lg flex items-center justify-between text-xs text-fb-warning">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-fb-warning shrink-0" />
                  <div>
                    <span className="font-bold">
                      Sinh viên đề xuất: {activeQuestion.creatorName}
                    </span>
                    <p className="text-xs text-fb-warning">
                      Điểm cống hiến (+{activeQuestion.studentPointsReserved || 20}đ) đã được chốt bảo lưu cho sinh viên khi chuyển vào ngân hàng đề GV.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-fb-warning text-fb-card shrink-0">
                  +{activeQuestion.studentPointsReserved || 20}đ Bảo lưu
                </span>
              </div>

              {/* Question Content Box */}
              <div className="bg-fb-input p-4 rounded-lg border border-fb-divider space-y-2">
                <div className="flex items-center justify-between text-xs text-fb-text-2 font-bold">
                  <span>Nội dung đề bài (một đáp án)</span>
                  <span className="px-2 py-0.5 rounded bg-fb-btn text-fb-text">
                    {activeQuestion.difficulty === 'EASY'
                      ? 'Dễ (Nhận biết)'
                      : activeQuestion.difficulty === 'MEDIUM'
                      ? 'Trung bình (Vận dụng)'
                      : 'Khó (Vận dụng cao)'}
                  </span>
                </div>
                <p className="font-bold text-sm text-fb-text leading-relaxed">
                  {activeQuestion.content}
                </p>
              </div>

              {/* 4 Options */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-fb-text-2 text-xs block">
                  4 Phương án trắc nghiệm:
                </span>
                {activeQuestion.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-lg border flex items-center justify-between transition ${
                      opt.id === activeQuestion.correctAnswer
                        ? 'bg-fb-success-soft border-fb-success text-fb-success font-semibold ring-1 ring-fb-success'
                        : 'bg-fb-card border-fb-divider text-fb-text'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          opt.id === activeQuestion.correctAnswer
                            ? 'bg-fb-success text-white'
                            : 'bg-fb-input text-fb-text-2'
                        }`}
                      >
                        {opt.id}
                      </span>
                      <span>{opt.text}</span>
                    </div>
                    {opt.id === activeQuestion.correctAnswer && (
                      <span className="text-xs bg-fb-success text-white px-2 py-0.5 rounded-full font-bold">
                        Đáp án đúng
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div className="p-3.5 bg-fb-blue-soft/70 rounded-lg text-xs text-fb-blue border border-fb-blue/30 space-y-1">
                <strong className="block font-bold">Giải thích chuẩn khoa học:</strong>
                <p className="leading-relaxed">{activeQuestion.explanation}</p>
              </div>

              {/* DECISION ACTION BUTTONS: GIỮ / LOẠI (Yêu cầu chức năng 1) */}
              <div className="pt-3 border-t border-fb-divider space-y-2">
                <span className="text-xs font-bold text-fb-text-2 block">
                  Quyết định của Giảng viên (Giữ / Loại):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decideKeepQuestion(activeQuestion.id)}
                    className="flex-1 py-2.5 bg-fb-success hover:bg-fb-success/90 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Giữ & Chuẩn hóa vào kho thi</span>
                  </button>

                  <button
                    onClick={() => setDiscardReasonModalOpen(true)}
                    className="flex-1 py-2.5 bg-fb-danger hover:bg-fb-danger/90 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Quyết định loại khỏi kho</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-fb-text-3">
              <Database className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Chọn câu hỏi từ danh sách bên trái để xem chi tiết và biên tập</p>
            </div>
          )}
        </div>

        {/* =========================================================================
            PANEL 3 (4 cols): AI LLM Chatbot Studio (Tương tác AI - Yêu cầu chức năng 2)
            ========================================================================= */}
        <div className="lg:col-span-4 bg-fb-card rounded-lg shadow-fb-card p-4 space-y-3 flex flex-col max-h-[820px]">
          {/* AI Header */}
          <div className="flex items-center justify-between pb-2 border-b border-fb-divider">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-fb-blue text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-fb-text">
                  Tương tác AI (LLM) Trực Tiếp
                </h3>
                <p className="text-xs text-fb-text-3">Tự động cải thiện văn phong & câu hỏi</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-fb-blue-soft text-fb-blue">
              Online
            </span>
          </div>

          {/* Quick AI Prompts */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-fb-text-3 block">
              Gợi ý prompt 1 chạm:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                onClick={() => handleSendAiPrompt('Cải thiện văn phong sư phạm và làm rõ câu hỏi')}
                className="flex items-center gap-1.5 p-1.5 text-left rounded-lg bg-fb-blue-soft hover:bg-fb-blue/20 text-fb-blue font-semibold border border-fb-blue/30 transition truncate"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Chuẩn hóa văn phong</span>
              </button>
              <button
                onClick={() => handleSendAiPrompt('Tối ưu hóa 3 phương án gây nhiễu B, C, D có tính phân loại cao')}
                className="flex items-center gap-1.5 p-1.5 text-left rounded-lg bg-fb-blue-soft hover:bg-fb-blue/20 text-fb-blue font-semibold border border-fb-blue/30 transition truncate"
              >
                <Target className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Tối ưu đáp án nhiễu</span>
              </button>
              <button
                onClick={() => handleSendAiPrompt('Bổ sung lời giải thích chi tiết có trích dẫn giáo trình')}
                className="flex items-center gap-1.5 p-1.5 text-left rounded-lg bg-fb-blue-soft hover:bg-fb-blue/20 text-fb-blue font-semibold border border-fb-blue/30 transition truncate"
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Thêm giải thích chuẩn</span>
              </button>
              <button
                onClick={() => handleSendAiPrompt('Đơn giản hóa câu văn để sinh viên dễ hiểu')}
                className="flex items-center gap-1.5 p-1.5 text-left rounded-lg bg-fb-blue-soft hover:bg-fb-blue/20 text-fb-blue font-semibold border border-fb-blue/30 transition truncate"
              >
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Rút gọn súc tích</span>
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
                  className={`p-3 rounded-lg max-w-[90%] space-y-2 leading-relaxed ${
                    msg.sender === 'LECTURER'
                      ? 'bg-fb-blue text-white rounded-tr-xs shadow-xs'
                      : 'bg-fb-input text-fb-text rounded-tl-xs border border-fb-divider'
                  }`}
                >
                  <p className="text-xs">{msg.text}</p>

                  {/* AI Suggested Content & Apply Button */}
                  {msg.suggestedContent && (
                    <div className="mt-2 pt-2 border-t border-fb-blue/40 space-y-1.5 bg-fb-card/10 p-2 rounded-lg">
                      <span className="font-bold text-xs block text-fb-blue">
                        Bản đề xuất sửa đổi của AI:
                      </span>
                      <p className="text-xs italic font-medium">{msg.suggestedContent}</p>
                      <button
                        onClick={() => handleApplyAiSuggestion(msg)}
                        className="w-full mt-1 py-1.5 bg-fb-success hover:bg-fb-success/90 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1 shadow-xs"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Áp dụng vào câu hỏi này</span>
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-xs text-fb-text-3 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isAiThinking && (
              <div className="flex items-center gap-2 p-3 bg-fb-input rounded-lg text-fb-text-2 text-xs">
                <Sparkles className="w-4 h-4 text-fb-blue animate-spin" />
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
            className="pt-2 border-t border-fb-divider flex items-center gap-2"
          >
            <input
              type="text"
              value={aiInputPrompt}
              onChange={(e) => setAiInputPrompt(e.target.value)}
              placeholder="Gõ yêu cầu sửa câu hỏi (VD: làm rõ câu hỏi hơn)..."
              className="flex-1 px-3 py-2 rounded-lg bg-fb-input border border-fb-divider text-xs text-fb-text focus:outline-hidden focus:ring-2 focus:ring-fb-blue"
            />
            <button
              type="submit"
              disabled={!aiInputPrompt.trim() || isAiThinking}
              className={`p-2 rounded-lg text-white transition ${
                aiInputPrompt.trim() && !isAiThinking
                  ? 'bg-fb-blue hover:bg-fb-blue-hover shadow-xs'
                  : 'bg-fb-divider cursor-not-allowed'
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
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-fb-card rounded-lg shadow-2xl max-w-md w-full p-5 border border-fb-divider space-y-4">
            <h3 className="font-bold text-sm text-fb-text flex items-center gap-2">
              <XCircle className="w-5 h-5 text-fb-danger" />
              Quyết định loại câu hỏi khỏi kho đề
            </h3>

            <div className="p-3 bg-fb-warning-soft border border-fb-warning/30 rounded-lg text-xs text-fb-warning">
              <strong>Lưu ý quan trọng theo quy chế:</strong> Điểm cộng của sinh viên (
              {activeQuestion?.studentPointsReserved || 20} điểm) vẫn được chốt bảo lưu trọn vẹn, không bị thu hồi khi loại bỏ câu hỏi khỏi kho đề thi.
            </div>

            <div>
              <label className="block text-xs font-bold text-fb-text mb-1">
                Lý do loại câu hỏi:
              </label>
              <textarea
                rows={2}
                value={discardReason}
                onChange={(e) => setDiscardReason(e.target.value)}
                className="w-full p-2.5 text-xs border border-fb-divider rounded-lg bg-fb-input text-fb-text"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDiscardReasonModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDiscard}
                className="px-5 py-2 bg-fb-danger hover:bg-fb-danger/90 text-white rounded-lg text-xs font-bold shadow-md"
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
