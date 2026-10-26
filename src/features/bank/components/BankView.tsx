import React, { useMemo, useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { mockSubjectsTree } from '../../../mocks/mockData';
import {
  getCourseCode,
  StudentExamSet,
  initialStudentExamSets,
} from '../studentBankData';
import { ExamSetCard } from './ExamSetCard';
import { ExamDetailView } from './ExamDetailView';
import { ExamTestFullscreenModal } from './ExamTestFullscreenModal';
import {
  BookOpen,
  Search,
  PlusCircle,
  ChevronRight,
  ArrowUpDown,
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

  // Fullscreen Exam Practice Modal
  const [activePracticeExam, setActivePracticeExam] =
    useState<StudentExamSet | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<
    'NEWEST' | 'RATING' | 'ATTEMPTS' | 'QUESTIONS_COUNT'
  >('NEWEST');

  // Unified Exam Sets (Combining predefined + student proposed sessions)
  const allExamSets: StudentExamSet[] = useMemo(() => {
    const sessionExams: StudentExamSet[] = sessions.map((sess) => {
      const validQuestions =
        sess.questions && sess.questions.length > 0
          ? sess.questions
          : questions.filter((q) => q.sessionId === sess.id);

      const rCount = validQuestions.reduce(
        (acc, q) => acc + (q.ratingCount || 0),
        0,
      );
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
          `Bộ đề môn ${sess.subject} do ${sess.creator.name} đóng góp.`,
        questions: validQuestions,
        totalAttempts: 35,
        ratingAverage: rAvg,
        ratingCount: rCount || 8,
        tags: [sess.subject],
      };
    });

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
        const matchesSubject =
          selectedSubject === 'Tất cả môn học' ||
          exam.subject === selectedSubject ||
          exam.courseCode === selectedSubject;

        const term = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !term ||
          exam.title.toLowerCase().includes(term) ||
          exam.courseCode.toLowerCase().includes(term) ||
          exam.subject.toLowerCase().includes(term) ||
          exam.creator.name.toLowerCase().includes(term) ||
          (exam.chapter && exam.chapter.toLowerCase().includes(term));

        return matchesSubject && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'RATING') return b.ratingAverage - a.ratingAverage;
        if (sortBy === 'ATTEMPTS') return b.totalAttempts - a.totalAttempts;
        if (sortBy === 'QUESTIONS_COUNT')
          return b.questions.length - a.questions.length;
        return 0;
      });
  }, [allExamSets, selectedSubject, searchTerm, sortBy]);

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex items-start gap-4 lg:gap-8 xl:gap-12">
      {/* ================= CỘT TRÁI: MÔN HỌC KIỂM ĐỊNH (GIỮ NGUYÊN BỘ LỌC CHUẨN) ================= */}
      <aside className="hidden lg:block w-[280px] xl:w-[300px] 2xl:w-[320px] shrink-0 sticky top-18 h-[calc(100vh-5rem)] overflow-y-auto space-y-4 select-none pr-2">
        {/* Nút Đăng bộ đề mới */}
        <button
          onClick={() => setActiveTab('propose')}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          <span>Đề xuất bộ đề mới</span>
        </button>

        {/* Tree of Subjects */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 px-2">
            Môn học kiểm định
          </h3>

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
            <span>Tất cả môn học</span>
            <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full font-bold">
              {allExamSets.length}
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
                      <span className="truncate">{sub.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ================= CỘT CHÍNH: DANH SÁCH BỘ ĐỀ RỘNG RÃI & GỌN GÀNG ================= */}
      <main className="flex-1 max-w-[960px] space-y-3">
        {/* Nếu đang xem chi tiết một bộ đề -> Hiển thị ExamDetailView */}
        {activeExam ? (
          <ExamDetailView
            exam={activeExam}
            liveQuestions={questions}
            currentUserId={currentUser.id}
            onBack={() => setSelectedExamId(null)}
            onRateQuestion={(qId, stars, comment) =>
              rateQuestion(qId, stars, comment)
            }
            onPracticeQuestion={(q) => setActiveQuizQuestion(q)}
            onStartPracticeExam={() => setActivePracticeExam(activeExam)}
            onViewAuthorProfile={(userId) => {
              setViewingUserId(userId);
              setActiveTab('profile');
            }}
          />
        ) : (
          <>
            {/* Thanh Tìm kiếm & Sắp xếp thống nhất */}
            <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-3 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm theo mã môn (IT3080), tên môn, tiêu đề đề thi, tác giả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-[#3A3B3C] rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-700/80 text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {selectedSubject} ({filteredExamSets.length} bộ đề)
                </span>

                {/* Sắp xếp */}
                <div className="flex items-center gap-1 text-gray-400">
                  <ArrowUpDown className="w-3.5 h-3.5" />
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
                    className="bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 text-xs font-medium py-1 px-2 rounded-lg border-0 cursor-pointer"
                  >
                    <option value="NEWEST">Mới nhất</option>
                    <option value="RATING">Đánh giá cao nhất</option>
                    <option value="ATTEMPTS">Lượt làm nhiều nhất</option>
                    <option value="QUESTIONS_COUNT">Nhiều câu nhất</option>
                  </select>
                </div>
              </div>
            </div>

            {/* DANH SÁCH BỘ ĐỀ */}
            {filteredExamSets.length > 0 ? (
              <div className="space-y-3">
                {filteredExamSets.map((exam) => (
                  <ExamSetCard
                    key={exam.id}
                    exam={exam}
                    onSelectExam={(e) => setSelectedExamId(e.id)}
                    onQuickPractice={(e) => setActivePracticeExam(e)}
                    onViewAuthorProfile={(userId) => {
                      setViewingUserId(userId);
                      setActiveTab('profile');
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#242526] rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700 space-y-2">
                <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
                <h4 className="font-bold text-xs text-gray-700 dark:text-gray-300">
                  Không tìm thấy bộ đề phù hợp
                </h4>
              </div>
            )}
          </>
        )}
      </main>

      {/* ================= MODAL LÀM THI THỬ TOÀN MÀN HÌNH ================= */}
      {activePracticeExam && (
        <ExamTestFullscreenModal
          exam={activePracticeExam}
          onClose={() => setActivePracticeExam(null)}
          onRateQuestion={(qId, stars, comment) =>
            rateQuestion(qId, stars, comment)
          }
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
};
