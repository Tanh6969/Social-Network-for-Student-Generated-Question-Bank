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
import { BookOpen, Library, Plus, Search, Star } from 'lucide-react';
import { getSubjectTone } from '../subjectTone';

type SortKey = 'NEWEST' | 'RATING' | 'ATTEMPTS' | 'QUESTIONS_COUNT';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'NEWEST', label: 'Mới nhất' },
  { value: 'RATING', label: 'Đánh giá cao' },
  { value: 'ATTEMPTS', label: 'Làm nhiều' },
  { value: 'QUESTIONS_COUNT', label: 'Nhiều câu' },
];

// Một dòng môn học trong sidebar: icon tròn màu theo môn + tên (+ số bộ đề)
const SubjectItem: React.FC<{
  label: string;
  count?: number;
  tone?: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, count, tone, active, onClick }) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${active ? 'bg-fb-blue-soft' : 'hover:bg-fb-hover'}`}
  >
    <span
      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${tone ?? 'bg-fb-blue text-white'}`}
    >
      {count === undefined ? (
        <BookOpen className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Library className="w-4 h-4" aria-hidden="true" />
      )}
    </span>
    <span
      className={`flex-1 min-w-0 truncate text-[15px] font-medium ${active ? 'text-fb-blue' : 'text-fb-text'}`}
    >
      {label}
    </span>
    {count !== undefined && (
      <span className="text-[13px] font-semibold text-fb-text-2">{count}</span>
    )}
  </button>
);

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
  const [sortBy, setSortBy] = useState<SortKey>('NEWEST');

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

  // Cột phải: bộ đề được đánh giá cao & người đóng góp nhiều nhất
  const featuredExams = useMemo(
    () =>
      [...allExamSets]
        .filter((e) => e.ratingCount >= 5)
        .sort((a, b) => b.ratingAverage - a.ratingAverage)
        .slice(0, 4),
    [allExamSets],
  );

  const topContributors = useMemo(() => {
    const byCreator = new Map<
      string,
      { user: StudentExamSet['creator']; count: number }
    >();
    allExamSets.forEach((e) => {
      const entry = byCreator.get(e.creator.id) ?? { user: e.creator, count: 0 };
      entry.count += 1;
      byCreator.set(e.creator.id, entry);
    });
    return [...byCreator.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allExamSets]);

  const openProfile = (userId: string) => {
    setViewingUserId(userId);
    setActiveTab('profile');
  };

  const selectSubject = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedExamId(null);
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 py-4 flex justify-between items-start gap-4 xl:gap-6">
      {/* ================= CỘT TRÁI: TÌM KIẾM & MÔN HỌC ================= */}
      <aside className="hidden lg:block w-[280px] xl:w-[300px] shrink-0 sticky top-18 max-h-[calc(100vh-5rem)] overflow-y-auto select-none">
        <div className="bg-fb-card rounded-lg shadow-fb-card p-3">
          <h1 className="px-1 text-2xl font-bold text-fb-text">Ngân hàng đề</h1>

          <div className="relative mt-3">
            <Search
              className="w-4 h-4 text-fb-text-2 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Tìm bộ đề"
              placeholder="Tìm bộ đề, môn học, tác giả"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 bg-fb-input rounded-full text-[15px] text-fb-text placeholder:text-fb-text-2 outline-none focus:ring-2 focus:ring-fb-blue/40"
            />
          </div>

          <button
            onClick={() => setActiveTab('propose')}
            className="mt-3 w-full h-10 rounded-md bg-fb-blue hover:bg-fb-blue-hover text-white text-[15px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            Đề xuất bộ đề mới
          </button>

          <div className="my-3 border-t border-fb-divider" />

          <SubjectItem
            label="Tất cả môn học"
            count={allExamSets.length}
            active={selectedSubject === 'Tất cả môn học'}
            onClick={() => selectSubject('Tất cả môn học')}
          />

          {mockSubjectsTree.map((group) => (
            <div key={group.name} className="mt-2">
              <p className="px-2 pt-1 pb-0.5 text-[13px] font-semibold text-fb-text-2">
                {group.name}
              </p>
              {group.subjects.map((sub) => (
                <SubjectItem
                  key={sub.id}
                  label={sub.name}
                  tone={getSubjectTone(sub.name)}
                  active={selectedSubject === sub.name}
                  onClick={() => selectSubject(sub.name)}
                />
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* ================= CỘT GIỮA: DANH SÁCH BỘ ĐỀ ================= */}
      <main className="flex-1 min-w-0 max-w-[760px] mx-auto space-y-3">
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
            onViewAuthorProfile={openProfile}
          />
        ) : (
          <>
            {/* Tiêu đề danh sách & sắp xếp */}
            <div className="bg-fb-card rounded-lg shadow-fb-card px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-bold text-fb-text truncate">
                  {selectedSubject}
                </h2>
                <span className="shrink-0 text-[15px] text-fb-text-2">
                  {filteredExamSets.length} bộ đề
                </span>
              </div>

              {/* Tìm kiếm cho màn hình nhỏ (sidebar bị ẩn) */}
              <div className="relative mt-3 lg:hidden">
                <Search
                  className="w-4 h-4 text-fb-text-2 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Tìm bộ đề"
                  placeholder="Tìm bộ đề, môn học, tác giả"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-fb-input rounded-full text-[15px] text-fb-text placeholder:text-fb-text-2 outline-none focus:ring-2 focus:ring-fb-blue/40"
                />
              </div>

              <div
                className="flex gap-2 mt-3 overflow-x-auto"
                role="group"
                aria-label="Sắp xếp bộ đề"
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    aria-pressed={sortBy === opt.value}
                    className={`shrink-0 h-9 px-4 rounded-full text-[15px] font-semibold transition-colors cursor-pointer ${
                      sortBy === opt.value
                        ? 'bg-fb-blue-soft text-fb-blue'
                        : 'bg-fb-btn text-fb-text hover:bg-fb-btn-hover'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DANH SÁCH BỘ ĐỀ */}
            {filteredExamSets.length > 0 ? (
              filteredExamSets.map((exam) => (
                <ExamSetCard
                  key={exam.id}
                  exam={exam}
                  onSelectExam={(e) => setSelectedExamId(e.id)}
                  onQuickPractice={(e) => setActivePracticeExam(e)}
                  onViewAuthorProfile={openProfile}
                />
              ))
            ) : (
              <div className="bg-fb-card rounded-lg shadow-fb-card p-8 text-center">
                <BookOpen
                  className="w-10 h-10 text-fb-text-2 mx-auto"
                  aria-hidden="true"
                />
                <p className="mt-2 text-[17px] font-semibold text-fb-text">
                  Chưa có bộ đề phù hợp
                </p>
                <p className="text-[15px] text-fb-text-2">
                  Thử đổi từ khoá hoặc chọn môn học khác.
                </p>
                <button
                  onClick={() => setActiveTab('propose')}
                  className="mt-4 h-9 px-4 rounded-md bg-fb-blue hover:bg-fb-blue-hover text-white text-[15px] font-semibold transition-colors cursor-pointer"
                >
                  Đề xuất bộ đề đầu tiên
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ================= CỘT PHẢI: NỔI BẬT & NGƯỜI ĐÓNG GÓP ================= */}
      <aside className="hidden xl:block w-[300px] shrink-0 sticky top-18 max-h-[calc(100vh-5rem)] overflow-y-auto space-y-3">
        <section className="bg-fb-card rounded-lg shadow-fb-card p-3">
          <h2 className="px-1 mb-1 text-[17px] font-semibold text-fb-text">
            Được đánh giá cao
          </h2>
          {featuredExams.map((exam) => (
            <button
              key={exam.id}
              onClick={() => setSelectedExamId(exam.id)}
              className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-fb-hover text-left transition-colors cursor-pointer"
            >
              <span
                className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${getSubjectTone(exam.subject)}`}
              >
                <BookOpen className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-medium text-fb-text leading-snug line-clamp-2">
                  {exam.title}
                </span>
                <span className="flex items-center gap-1 text-[13px] text-fb-text-2">
                  <Star
                    className="w-3.5 h-3.5 text-amber-500 fill-amber-500"
                    aria-hidden="true"
                  />
                  {exam.ratingAverage.toFixed(1)} · {exam.totalAttempts} lượt làm
                </span>
              </span>
            </button>
          ))}
        </section>

        <section className="bg-fb-card rounded-lg shadow-fb-card p-3">
          <h2 className="px-1 mb-1 text-[17px] font-semibold text-fb-text">
            Đóng góp nhiều nhất
          </h2>
          {topContributors.map(({ user, count }, index) => (
            <button
              key={user.id}
              onClick={() => openProfile(user.id)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-fb-hover text-left transition-colors cursor-pointer"
            >
              <span className="w-5 text-center text-[15px] font-bold text-fb-text-2">
                {index + 1}
              </span>
              <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
              <span className="flex-1 min-w-0 truncate text-[15px] font-medium text-fb-text">
                {user.name}
              </span>
              <span className="shrink-0 text-[13px] text-fb-text-2">{count} bộ đề</span>
            </button>
          ))}
        </section>
      </aside>

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
