import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { mockSubjectsTree } from '../../../mocks/mockData';
import {
  BookOpen,
  Search,
  Filter,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Users,
  Award,
  ChevronRight,
  TrendingUp,
  FileCode,
  Sparkles,
  CheckSquare,
  Database
} from 'lucide-react';
import { QuestionDifficulty, QuestionStatus } from '../../demo/types';

export const BankView: React.FC = () => {
  const {
    questions,
    selectedSubject,
    setSelectedSubject,
    setActiveQuizQuestion,
    setIsProposeSessionModalOpen,
    currentUser,
    role,
    setActiveTab
  } = useApp();

  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'ALL_QUESTIONS' | 'MY_SUBMISSIONS'>('ALL_QUESTIONS');

  const filteredQuestions = questions.filter((q) => {
    const matchesSubject =
      selectedSubject === 'Tất cả môn học' || q.subject === selectedSubject;
    const matchesDiff =
      difficultyFilter === 'ALL' || q.difficulty === difficultyFilter;
    const matchesSearch =
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.chapter.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesDiff && q.status === 'APPROVED';
  });

  const totalApproved = questions.filter((q) => q.status === 'APPROVED').length;

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex justify-between items-start gap-4 lg:gap-8 xl:gap-12 2xl:gap-16">
      {/* ================= CỘT TRÁI (sticky sát lề trái) ================= */}
      <aside className="hidden lg:block w-[280px] xl:w-[300px] 2xl:w-[320px] shrink-0 sticky top-18 h-[calc(100vh-5rem)] overflow-y-auto space-y-4 select-none pr-2">
        {/* Action Button: Propose Session */}
        <button
          onClick={() => setActiveTab('propose')}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          <span>Đề xuất phiên câu hỏi</span>
        </button>

        {/* Tree of Subjects */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 px-2">
            Môn học kiểm định
          </h3>

          <div
            onClick={() => setSelectedSubject('Tất cả môn học')}
            className={`p-2 rounded-lg cursor-pointer text-xs font-semibold flex items-center justify-between transition ${
              selectedSubject === 'Tất cả môn học'
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold'
                : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-700 dark:text-gray-300'
            }`}
          >
            <span>Tất cả môn học</span>
            <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
              {totalApproved}
            </span>
          </div>

          <div className="mt-2 space-y-3">
            {mockSubjectsTree.map((group, gIdx) => (
              <div key={gIdx}>
                <span className="text-[11px] font-bold text-gray-400 px-2 block mb-1">
                  {group.name}
                </span>
                <div className="space-y-0.5">
                  {group.subjects.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubject(sub.name)}
                      className={`p-2 rounded-lg cursor-pointer text-xs flex items-center justify-between transition ${
                        selectedSubject === sub.name
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold'
                          : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="truncate">{sub.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 px-2">
            Độ khó câu hỏi
          </h3>
          <div className="space-y-1 text-xs font-semibold">
            {[
              { id: 'ALL', label: 'Tất cả độ khó' },
              { id: 'EASY', label: 'Dễ (Nhận biết / Thông hiểu)' },
              { id: 'MEDIUM', label: 'Trung bình (Vận dụng)' },
              { id: 'HARD', label: 'Khó (Vận dụng cao)' }
            ].map((diff) => (
              <button
                key={diff.id}
                onClick={() => setDifficultyFilter(diff.id)}
                className={`w-full text-left p-2 rounded-lg transition ${
                  difficultyFilter === diff.id
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-700 dark:text-gray-300'
                }`}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ================= CỘT GIỮA (có khoảng trống 2 bên) ================= */}
      <main className="flex-1 max-w-[680px] mx-auto space-y-4 px-1 sm:px-2">
        {/* Top Metrics Banner - Tối giản, không chói mắt */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-5">
          <div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              Ngân hàng đề thi Đại học
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 mb-1">
              {selectedSubject}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Biên soạn bởi Sinh viên và phê chuẩn bởi Hội đồng Giảng viên các Viện & Khoa.
            </p>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{totalApproved}</p>
                <p className="text-[11px] text-gray-500">Câu đạt chuẩn</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">1,420+</p>
                <p className="text-[11px] text-gray-500">Lượt làm thử</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">94.5%</p>
                <p className="text-[11px] text-gray-500">Độ tin cậy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Review & Lecturer Bank Navigation Banner */}
        <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
              <Database className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-purple-950 dark:text-purple-200">
                  Khu vực Giảng viên: Ngân hàng đề riêng & Kiểm duyệt
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-200/60 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold">
                  Kho thẩm định
                </span>
              </div>
              <p className="text-[11px] text-purple-700 dark:text-purple-300">
                Câu hỏi tiềm năng sau khi duyệt sẽ vào trạng thái "Cần edit" (bảo lưu điểm SV), chỉnh sửa (PUT), chat AI và sinh đề thi.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('lecturer-bank')}
              className="flex-1 sm:flex-none px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
            >
              <span>Ngân hàng đề GV</span>
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-white dark:bg-[#3A3B3C] border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-50 transition cursor-pointer"
            >
              <span>Duyệt câu hỏi</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Subtabs */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-3">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo từ khóa câu hỏi, chương, nội dung bài học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-[#3A3B3C] rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
            <button
              onClick={() => setActiveSubTab('ALL_QUESTIONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'ALL_QUESTIONS'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              Câu hỏi chính thức ({filteredQuestions.length})
            </button>
            <button
              onClick={() => setActiveTab('propose')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition flex items-center gap-1.5 ml-auto cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Gửi câu hỏi mới</span>
            </button>
          </div>
        </div>

        {/* Questions Cards List */}
        {filteredQuestions.length > 0 ? (
          <div className="space-y-3">
            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-400 transition"
              >
                {/* Meta top */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                      {question.subject}
                    </span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500 truncate max-w-[200px]">
                      {question.chapter}
                    </span>
                  </div>

                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/50"
                  >
                    {question.difficulty === 'EASY' ? 'Độ khó: Dễ' : question.difficulty === 'MEDIUM' ? 'Độ khó: TB' : 'Độ khó: Khó'}
                  </span>
                </div>

                {/* Question Content */}
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 leading-relaxed">
                  {question.content}
                </h4>

                {/* Options Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs">
                  {question.options.map((opt) => (
                    <div
                      key={opt.id}
                      className="p-2 bg-gray-50 dark:bg-[#3A3B3C]/50 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 flex items-start gap-2"
                    >
                      <span className="font-bold text-blue-600">{opt.id}.</span>
                      <span className="truncate">{opt.text}</span>
                    </div>
                  ))}
                </div>

                {/* Footer action: Làm thử */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <strong className="text-gray-800 dark:text-gray-200">
                        {question.ratingAverage}
                      </strong>{' '}
                      ({question.ratingCount})
                    </span>
                    <span>{question.totalAttempts} lượt làm</span>
                    <span className="hidden sm:inline">
                      Đóng góp bởi: <strong>{question.creatorName}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveQuizQuestion(question)}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition flex items-center gap-1.5"
                  >
                    <span>Làm thử</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#242526] rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700 space-y-2">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">
              Không tìm thấy câu hỏi phù hợp
            </h4>
            <p className="text-xs text-gray-400">
              Hãy thử chọn môn học khác hoặc đóng góp câu hỏi đầu tiên cho chủ đề này!
            </p>
            <button
              onClick={() => setActiveTab('propose')}
              className="mt-2 px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-lg cursor-pointer"
            >
              Đề xuất câu hỏi ngay
            </button>
          </div>
        )}
      </main>

      {/* ================= CỘT PHẢI (sticky sát lề phải) ================= */}
      <aside className="hidden xl:block w-[300px] xl:w-[320px] 2xl:w-[340px] shrink-0 sticky top-18 h-[calc(100vh-5rem)] overflow-y-auto space-y-4 select-none pl-1">
        {/* Personal Stats Card */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-blue-600" />
            Hồ sơ đóng góp của bạn
          </h3>

          <div className="flex items-center gap-3 mb-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-bold text-xs text-gray-900 dark:text-gray-100">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-gray-500">{currentUser.classOrTitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
              <span className="font-black text-lg text-blue-600 block">
                {currentUser.approvedQuestionsCount}
              </span>
              <span className="text-[11px] text-gray-500">Câu được duyệt</span>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
              <span className="font-black text-lg text-amber-600 block">
                {currentUser.points}
              </span>
              <span className="text-[11px] text-gray-500">Điểm cống hiến</span>
            </div>
          </div>
        </div>

        {/* Generate Exam shortcut */}
        <div className="bg-linear-to-br from-indigo-900 to-purple-900 text-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileCode className="w-5 h-5 text-indigo-300" />
            <h4 className="font-bold text-sm">Công cụ Sinh Đề Thi</h4>
          </div>
          <p className="text-xs text-indigo-200 mb-3">
            Bốc ngẫu nhiên câu hỏi theo ma trận độ khó, tạo nhiều mã đề kèm file đáp án tự động.
          </p>
          <button
            onClick={() => setActiveTab('exams')}
            className="w-full py-2 bg-white text-indigo-900 font-bold text-xs rounded-lg hover:bg-indigo-50 transition"
          >
            Mở bộ sinh đề thi
          </button>
        </div>
      </aside>
    </div>
  );
};
