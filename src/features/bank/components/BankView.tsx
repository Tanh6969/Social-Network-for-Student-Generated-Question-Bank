import React, { useMemo, useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { mockSubjectsTree } from '../../../mocks/mockData';
import {
  COURSE_CATALOG,
  getCourseCode,
  StudentExamSet,
  initialStudentExamSets,
} from '../studentBankData';
import { ExamSetCard } from './ExamSetCard';
import { ExamDetailView } from './ExamDetailView';
import { StarRating } from './StarRating';
import {
  BookOpen,
  Search,
  Filter,
  PlusCircle,
  Star,
  ChevronRight,
  Award,
  FileCode,
  Layers,
  ArrowUpDown,
  Sparkles,
  HelpCircle,
  FileText,
  CheckCircle2,
  Share2,
} from 'lucide-react';

export const BankView: React.FC = () => {
  const {
    questions,
    sessions,
    selectedSubject,
    setSelectedSubject,
    setActiveQuizQuestion,
    currentUser,
    setActiveTab,
    setViewingUserId,
    rateQuestion,
  } = useApp();

  // Selected Exam for Drilldown Detail View
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'EXAMS' | 'QUESTIONS'>('EXAMS');
  const [sortBy, setSortBy] = useState<
    'NEWEST' | 'RATING' | 'ATTEMPTS' | 'QUESTIONS_COUNT'
  >('NEWEST');

  // Unified Exam Sets (Combining predefined + student proposed sessions)
  const allExamSets: StudentExamSet[] = useMemo(() => {
    const sessionExams: StudentExamSet[] = sessions.map((sess) => {
      // Calculate rating from questions
      const validQuestions = sess.questions && sess.questions.length > 0
        ? sess.questions
        : questions.filter((q) => q.sessionId === sess.id);

      const rCount = validQuestions.reduce((acc, q) => acc + (q.ratingCount || 0), 0);
      const rSum = validQuestions.reduce(
        (acc, q) => acc + (q.ratingAverage || 0) * (q.ratingCount || 0),
        0,
      );
      const rAvg = rCount > 0 ? Number((rSum / rCount).toFixed(1)) : 4.8;

      return {
        id: sess.id,
        code: sess.id.replace('sess_', 'SV-').toUpperCase(),
        title: sess.title,
        courseCode: getCourseCode(sess.subject),
        subject: sess.subject,
        chapter: sess.chapter,
        creator: sess.creator,
        createdAt: sess.submittedAt || 'Vừa xong',
        difficulty: 'MEDIUM',
        description:
          sess.lecturerFeedback ||
          `Bộ đề đóng góp cho môn ${sess.subject} bởi sinh viên ${sess.creator.name}.`,
        questions: validQuestions,
        totalAttempts: 45,
        ratingAverage: rAvg,
        ratingCount: rCount || 12,
        tags: [sess.subject, 'SV đóng góp'],
      };
    });

    // Merge without duplicates by ID
    const combined = [...initialStudentExamSets];
    sessionExams.forEach((sExam) => {
      if (!combined.some((item) => item.id === sExam.id)) {
        combined.unshift(sExam);
      }
    });
    return combined;
  }, [sessions, questions]);

  // Selected Exam object (if in detail mode)
  const activeExam = useMemo(() => {
    if (!selectedExamId) return null;
    return allExamSets.find((e) => e.id === selectedExamId) || null;
  }, [selectedExamId, allExamSets]);

  // Filtered Exam Sets
  const filteredExamSets = useMemo(() => {
    return allExamSets
      .filter((exam) => {
        // Subject filter
        const matchesSubject =
          selectedSubject === 'Tất cả môn học' ||
          exam.subject === selectedSubject ||
          exam.courseCode === selectedSubject;

        // Difficulty filter
        const matchesDiff =
          difficultyFilter === 'ALL' || exam.difficulty === difficultyFilter;

        // Search term
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !term ||
          exam.title.toLowerCase().includes(term) ||
          exam.courseCode.toLowerCase().includes(term) ||
          exam.subject.toLowerCase().includes(term) ||
          exam.creator.name.toLowerCase().includes(term) ||
          (exam.chapter && exam.chapter.toLowerCase().includes(term));

        return matchesSubject && matchesDiff && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'RATING') return b.ratingAverage - a.ratingAverage;
        if (sortBy === 'ATTEMPTS') return b.totalAttempts - a.totalAttempts;
        if (sortBy === 'QUESTIONS_COUNT')
          return b.questions.length - a.questions.length;
        return 0; // default order
      });
  }, [allExamSets, selectedSubject, difficultyFilter, searchTerm, sortBy]);

  // Filtered Single Questions (for single-question browse mode)
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSubject =
        selectedSubject === 'Tất cả môn học' || q.subject === selectedSubject;
      const matchesDiff =
        difficultyFilter === 'ALL' || q.difficulty === difficultyFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        q.content.toLowerCase().includes(term) ||
        q.chapter.toLowerCase().includes(term) ||
        q.creatorName.toLowerCase().includes(term);
      return matchesSubject && matchesDiff && matchesSearch;
    });
  }, [questions, selectedSubject, difficultyFilter, searchTerm]);

  // Aggregated metrics
  const totalExamsCount = allExamSets.length;
  const totalQuestionsCount = questions.length;

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex justify-between items-start gap-4 lg:gap-8 xl:gap-12 2xl:gap-16">
      {/* ================= CỘT TRÁI: BỘ LỌC MÔN HỌC & MÃ MÔN ================= */}
      <aside className="hidden lg:block w-[280px] xl:w-[300px] 2xl:w-[320px] shrink-0 sticky top-18 h-[calc(100vh-5rem)] overflow-y-auto space-y-4 select-none pr-2">
        {/* Nút Đăng đề thi mới */}
        <button
          onClick={() => setActiveTab('propose')}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          <span>Đăng bộ đề mới</span>
        </button>

        {/* Danh mục Môn học & Mã môn */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500">
              Môn học & Mã môn
            </h3>
            <span className="text-[11px] text-gray-400 font-mono">
              {COURSE_CATALOG.length} môn
            </span>
          </div>

          {/* Tất cả môn học */}
          <div
            onClick={() => {
              setSelectedSubject('Tất cả môn học');
              setSelectedExamId(null);
            }}
            className={`p-2 rounded-lg cursor-pointer text-xs font-semibold flex items-center justify-between transition ${
              selectedSubject === 'Tất cả môn học'
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold'
                : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Tất cả môn học</span>
            </div>
            <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full font-bold">
              {totalExamsCount} đề
            </span>
          </div>

          {/* Danh mục môn theo khoa */}
          <div className="mt-3 space-y-3">
            {mockSubjectsTree.map((group, gIdx) => (
              <div key={gIdx}>
                <span className="text-[11px] font-bold text-gray-400 px-2 block mb-1">
                  {group.name}
                </span>
                <div className="space-y-0.5">
                  {group.subjects.map((sub) => {
                    const cCode = getCourseCode(sub.name);
                    const subjectExamCount = allExamSets.filter(
                      (e) => e.subject === sub.name,
                    ).length;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedSubject(sub.name);
                          setSelectedExamId(null);
                        }}
                        className={`p-2 rounded-lg cursor-pointer text-xs flex items-center justify-between transition ${
                          selectedSubject === sub.name
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold'
                            : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#3A3B3C] text-blue-600 dark:text-blue-400">
                            {cCode}
                          </span>
                          <span className="truncate">{sub.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                          {subjectExamCount} đề
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bộ lọc độ khó */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 px-2">
            Độ khó đề thi
          </h3>
          <div className="space-y-1 text-xs font-semibold">
            {[
              { id: 'ALL', label: 'Tất cả độ khó' },
              { id: 'EASY', label: 'Dễ (Nhận biết / Thông hiểu)' },
              { id: 'MEDIUM', label: 'Trung bình (Vận dụng)' },
              { id: 'HARD', label: 'Khó (Vận dụng cao)' },
              { id: 'MIXED', label: 'Tổng hợp nhiều mức độ' },
            ].map((diff) => (
              <button
                key={diff.id}
                onClick={() => setDifficultyFilter(diff.id)}
                className={`w-full text-left p-2 rounded-lg transition cursor-pointer ${
                  difficultyFilter === diff.id
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold'
                    : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-700 dark:text-gray-300'
                }`}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ================= CỘT GIỮA: KHO ĐỀ CHUNG & CHI TIẾT ĐỀ ================= */}
      <main className="flex-1 max-w-[720px] mx-auto space-y-4 px-1 sm:px-2">
        {/* Nếu đang xem chi tiết một bộ đề -> Hiển thị ExamDetailView */}
        {activeExam ? (
          <ExamDetailView
            exam={activeExam}
            liveQuestions={questions}
            currentUserId={currentUser.id}
            onBack={() => setSelectedExamId(null)}
            onRateQuestion={(qId, stars) => rateQuestion(qId, stars)}
            onPracticeQuestion={(q) => setActiveQuizQuestion(q)}
            onViewAuthorProfile={(userId) => {
              setViewingUserId(userId);
              setActiveTab('profile');
            }}
          />
        ) : (
          <>
            {/* Header Kho Đề Chung Sinh Viên */}
            <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Kho Đề Thi Chung Sinh Viên
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                      Cộng đồng mở
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 mt-1">
                    {selectedSubject}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Nơi sinh viên chia sẻ các bộ đề ôn tập, làm thử trắc nghiệm và đánh giá chất lượng câu hỏi từ 0 đến 5 sao theo từng mã môn học.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('propose')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Đóng góp đề mới</span>
                </button>
              </div>

              {/* Metrics Banner */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-center">
                <div>
                  <p className="text-lg font-black text-gray-900 dark:text-gray-100">
                    {filteredExamSets.length}
                  </p>
                  <p className="text-[11px] text-gray-500">Bộ đề sẵn có</p>
                </div>
                <div>
                  <p className="text-lg font-black text-gray-900 dark:text-gray-100">
                    {totalQuestionsCount}+
                  </p>
                  <p className="text-[11px] text-gray-500">Câu hỏi trắc nghiệm</p>
                </div>
                <div>
                  <p className="text-lg font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    4.8
                  </p>
                  <p className="text-[11px] text-gray-500">Đánh giá trung bình</p>
                </div>
              </div>
            </div>

            {/* Thanh Tìm kiếm & Lọc */}
            <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-3 space-y-3">
              {/* Ô tìm kiếm */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm theo mã môn (IT3080), tên môn, tiêu đề đề thi, tên sinh viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-[#3A3B3C] rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Controls: Chuyển chế độ xem & Sắp xếp */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-700/80">
                {/* Switch view mode */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#3A3B3C] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setViewMode('EXAMS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'EXAMS'
                        ? 'bg-white dark:bg-[#242526] text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Bộ đề thi ({filteredExamSets.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('QUESTIONS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'QUESTIONS'
                        ? 'bg-white dark:bg-[#242526] text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Tất cả câu hỏi ({filteredQuestions.length})</span>
                  </button>
                </div>

                {/* Sắp xếp */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  <span className="hidden sm:inline">Sắp xếp:</span>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as
                          | 'NEWEST'
                          | 'RATING'
                          | 'ATTEMPTS'
                          | 'QUESTIONS_COUNT',
                      )
                    }
                    className="bg-gray-100 dark:bg-[#3A3B3C] text-gray-800 dark:text-gray-200 text-xs font-semibold py-1 px-2 rounded-lg border-0 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="NEWEST">Mới nhất</option>
                    <option value="RATING">Đánh giá sao cao nhất ⭐</option>
                    <option value="ATTEMPTS">Lượt làm nhiều nhất</option>
                    <option value="QUESTIONS_COUNT">Nhiều câu hỏi nhất</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CHẾ ĐỘ 1: DANH SÁCH CÁC BỘ ĐỀ THI DO SINH VIÊN ĐĂNG */}
            {viewMode === 'EXAMS' && (
              <>
                {filteredExamSets.length > 0 ? (
                  <div className="space-y-3.5">
                    {filteredExamSets.map((exam) => (
                      <ExamSetCard
                        key={exam.id}
                        exam={exam}
                        onSelectExam={(e) => setSelectedExamId(e.id)}
                        onQuickPractice={(e) => {
                          if (e.questions.length > 0) {
                            setActiveQuizQuestion(e.questions[0]);
                          }
                        }}
                        onViewAuthorProfile={(userId) => {
                          setViewingUserId(userId);
                          setActiveTab('profile');
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#242526] rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 space-y-3">
                    <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
                    <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">
                      Không tìm thấy bộ đề phù hợp
                    </h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      Hiện tại chưa có bộ đề nào khớp với bộ lọc. Bạn hãy là người đầu tiên đăng tải bộ đề ôn tập cho môn học này!
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('propose')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Đăng bộ đề ngay
                    </button>
                  </div>
                )}
              </>
            )}

            {/* CHẾ ĐỘ 2: DANH SÁCH CÂU HỎI LẺ KÈM BỘ CHẤM SAO TRỰC TIẾP */}
            {viewMode === 'QUESTIONS' && (
              <>
                {filteredQuestions.length > 0 ? (
                  <div className="space-y-3.5">
                    {filteredQuestions.map((question) => {
                      const isAuthor = question.creatorId === currentUser.id;
                      return (
                        <div
                          key={question.id}
                          className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:border-blue-400 transition space-y-3"
                        >
                          {/* Meta top */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                                {getCourseCode(question.subject)}
                              </span>
                              <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {question.subject}
                              </span>
                              <span className="text-gray-400">·</span>
                              <span className="text-gray-500 truncate max-w-[200px]">
                                {question.chapter}
                              </span>
                            </div>

                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300">
                              {question.difficulty === 'EASY'
                                ? 'Độ khó: Dễ'
                                : question.difficulty === 'MEDIUM'
                                ? 'Độ khó: TB'
                                : 'Độ khó: Khó'}
                            </span>
                          </div>

                          {/* Question Content */}
                          <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 leading-relaxed">
                            {question.content}
                          </h4>

                          {/* Options Preview */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {question.options.map((opt) => (
                              <div
                                key={opt.id}
                                className="p-2.5 bg-gray-50 dark:bg-[#3A3B3C]/50 rounded-xl border border-gray-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-300 flex items-start gap-2"
                              >
                                <span className="font-bold text-blue-600">
                                  {opt.id}.
                                </span>
                                <span className="truncate leading-tight">
                                  {opt.text}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Star Rating Section */}
                          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                            <StarRating
                              ratingAverage={question.ratingAverage || 0}
                              ratingCount={question.ratingCount || 0}
                              userRatedStars={question.userRatedStars || 0}
                              onRate={(stars) =>
                                rateQuestion(question.id, stars)
                              }
                              isAuthor={isAuthor}
                              size="md"
                            />
                          </div>

                          {/* Footer Action */}
                          <div className="flex items-center justify-between text-xs pt-1 text-gray-500">
                            <span>
                              Đóng góp bởi:{' '}
                              <strong className="text-gray-800 dark:text-gray-200">
                                {question.creatorName}
                              </strong>
                            </span>

                            <button
                              type="button"
                              onClick={() => setActiveQuizQuestion(question)}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>Làm thử câu này</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#242526] rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700 space-y-2">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
                    <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">
                      Không tìm thấy câu hỏi phù hợp
                    </h4>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* ================= CỘT PHẢI: HỒ SƠ ĐÓNG GÓP & CÔNG CỤ ================= */}
      <aside className="hidden xl:block w-[300px] xl:w-[320px] 2xl:w-[340px] shrink-0 sticky top-18 h-[calc(100vh-5rem)] overflow-y-auto space-y-4 select-none pl-1">
        {/* Hồ sơ đóng góp cá nhân */}
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
              <p className="text-[11px] text-gray-500">
                {currentUser.classOrTitle}
              </p>
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

        {/* Khối mời gọi đăng đề mới */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h4 className="font-bold text-sm">Chia sẻ đề thi của bạn</h4>
          </div>
          <p className="text-xs text-blue-100 leading-relaxed">
            Đăng bộ đề bạn đã biên soạn để bạn bè làm thử và cùng đánh giá sao chất lượng câu hỏi!
          </p>
          <button
            onClick={() => setActiveTab('propose')}
            className="w-full py-2 bg-white text-blue-700 font-bold text-xs rounded-lg hover:bg-blue-50 transition cursor-pointer shadow-xs"
          >
            Tạo đề thi mới ngay
          </button>
        </div>

        {/* Công cụ Sinh Đề Thi */}
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
            className="w-full py-2 bg-white text-indigo-900 font-bold text-xs rounded-lg hover:bg-indigo-50 transition cursor-pointer"
          >
            Mở bộ sinh đề thi
          </button>
        </div>
      </aside>
    </div>
  );
};
