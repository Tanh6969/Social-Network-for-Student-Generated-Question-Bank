import React, { useState } from 'react';
import {
  BarChart2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Flag,
  MessageSquare,
  Search,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';
import type { StudentExamSet } from '../studentBankData';
import type { Question } from '../../demo/types';
import {
  countQuestionComments,
  useQuestionComments,
} from '../questionComments';

type StatsTab = 'ACCURACY' | 'COMMENTS';
type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';
type SortOrder = 'ORDER' | 'HARDEST' | 'EASIEST';

const ACCURACY_PAGE_SIZE = 20;

const DIFFICULTY: Record<
  DifficultyLevel,
  { label: string; range: string; bar: string; text: string }
> = {
  EASY: {
    label: 'Dễ',
    range: '≥ 80%',
    bar: 'bg-fb-success',
    text: 'text-fb-success',
  },
  MEDIUM: {
    label: 'Trung bình',
    range: '50–79%',
    bar: 'bg-fb-warning',
    text: 'text-fb-warning',
  },
  HARD: {
    label: 'Khó',
    range: '< 50%',
    bar: 'bg-fb-danger',
    text: 'text-fb-danger',
  },
};
const DIFFICULTY_LEVELS: DifficultyLevel[] = ['EASY', 'MEDIUM', 'HARD'];

const getDifficulty = (pct: number): DifficultyLevel =>
  pct >= 80 ? 'EASY' : pct >= 50 ? 'MEDIUM' : 'HARD';

/** Tìm theo số câu ("12", "câu 12") hoặc theo nội dung câu hỏi. */
const matchesQuestionSearch = (
  search: string,
  question: Question,
  idx: number,
) => {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  const numberQuery = query.replace(/^câu\s*/, '');
  return /^\d+$/.test(numberQuery)
    ? String(idx + 1).startsWith(numberQuery)
    : question.content.toLowerCase().includes(query);
};

const SearchBox: React.FC<{
  value: string;
  onChange: (value: string) => void;
  className?: string;
}> = ({ value, onChange, className = '' }) => (
  <div className={`relative ${className}`}>
    <Search
      className="w-4 h-4 text-fb-text-2 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
      aria-hidden="true"
    />
    <input
      type="search"
      aria-label="Tìm câu hỏi"
      placeholder="Tìm số câu hoặc nội dung"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 pl-8 pr-2 bg-fb-input rounded-full text-sm text-fb-text placeholder:text-fb-text-2 outline-none focus:ring-2 focus:ring-fb-blue/40"
    />
  </div>
);

const UserAvatar: React.FC<{ name: string; src?: string }> = ({ name, src }) =>
  src ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="w-8 h-8 rounded-full object-cover shrink-0"
    />
  ) : (
    <span className="w-8 h-8 rounded-full bg-fb-btn text-fb-text-2 text-sm font-semibold flex items-center justify-center shrink-0">
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );

// ---------------------------------------------------------------------------
// Cột phải tab Nhận xét: một câu hỏi + nhận xét của nó (key theo question.id)
// ---------------------------------------------------------------------------
const QuestionCommentsPanel: React.FC<{
  question: Question;
  questionIdx: number;
}> = ({ question, questionIdx }) => {
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const { comments, hasMore, isLoading, isError, loadMore, retry } =
    useQuestionComments(question, questionIdx);

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      <div className="pb-3 border-b border-fb-divider">
        <h4 className="text-card-title font-semibold text-fb-text">
          Câu {questionIdx + 1}
        </h4>
        <p
          className={`mt-1 text-body text-fb-text [overflow-wrap:anywhere] ${
            showAnswerKey ? '' : 'line-clamp-3'
          }`}
        >
          {question.content}
        </p>
        <button
          type="button"
          onClick={() => setShowAnswerKey(!showAnswerKey)}
          aria-expanded={showAnswerKey}
          className="mt-1.5 text-sm font-semibold text-fb-blue hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{showAnswerKey ? 'Ẩn đáp án' : 'Xem đáp án'}</span>
          {showAnswerKey ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showAnswerKey && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
            {question.options.map((opt) => {
              const isCorrect = opt.id === question.correctAnswer;
              return (
                <div
                  key={opt.id}
                  className={`px-2.5 py-1.5 rounded-md text-sm border [overflow-wrap:anywhere] ${
                    isCorrect
                      ? 'bg-fb-success-soft border-fb-success/30 text-fb-success font-semibold'
                      : 'bg-fb-card border-fb-divider text-fb-text-2'
                  }`}
                >
                  <span className="font-semibold mr-1">{opt.id}.</span>
                  {opt.text}
                  {isCorrect && ' ✓'}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 sm:overflow-y-auto pt-3 sm:pr-1 space-y-3">
        {comments.map((item) => (
          <article key={item.id} className="flex gap-2">
            <UserAvatar name={item.userName} src={item.userAvatar} />
            <div className="flex-1 min-w-0">
              <div className="bg-fb-input rounded-2xl px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-fb-text truncate">
                    {item.userName}
                  </span>
                  <span
                    className="flex items-center gap-1 text-sm font-semibold text-fb-warning shrink-0"
                    title={`Đánh giá ${item.rating} / 4`}
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-fb-warning" />
                    {item.rating}/4
                  </span>
                </div>
                {item.comment ? (
                  <p className="mt-0.5 text-body text-fb-text [overflow-wrap:anywhere]">
                    {item.comment}
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm italic text-fb-text-2">
                    Chỉ chấm điểm, không để lại nhận xét
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 px-3 mt-0.5 text-xs text-fb-text-3">
                <span>{item.createdAt}</span>
                {item.isError && (
                  <span className="flex items-center gap-1 font-semibold text-fb-danger">
                    <Flag className="w-3 h-3" /> Báo lỗi nội dung
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}

        {isLoading && (
          <p className="py-6 text-center text-sm text-fb-text-2" role="status">
            Đang tải nhận xét...
          </p>
        )}

        {isError && (
          <div className="py-6 text-center space-y-2">
            <p className="text-sm text-fb-danger">Không tải được nhận xét.</p>
            <button
              type="button"
              onClick={retry}
              className="h-9 px-4 rounded-md bg-fb-btn hover:bg-fb-btn-hover text-sm font-semibold text-fb-text transition cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {!isLoading && !isError && comments.length === 0 && (
          <div className="py-10 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-fb-text-3 mx-auto" />
            <p className="text-body text-fb-text-2">
              Chưa có nhận xét nào cho Câu {questionIdx + 1}.
            </p>
          </div>
        )}

        {hasMore && !isLoading && !isError && (
          <button
            type="button"
            onClick={loadMore}
            className="w-full h-9 rounded-md bg-fb-btn hover:bg-fb-btn-hover text-sm font-semibold text-fb-text transition cursor-pointer"
          >
            Xem thêm nhận xét
          </button>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
interface ExamStatsModalProps {
  exam: StudentExamSet;
  questions: Question[];
  examCorrectRate: number;
  examRatingAverage: number;
  onClose: () => void;
}

export const ExamStatsModal: React.FC<ExamStatsModalProps> = ({
  exam,
  questions,
  examCorrectRate,
  examRatingAverage,
  onClose,
}) => {
  const [tab, setTab] = useState<StatsTab>('ACCURACY');

  // Tab Tỷ lệ đúng
  const [difficultyFilter, setDifficultyFilter] = useState<
    DifficultyLevel | 'ALL'
  >('ALL');
  const [sortOrder, setSortOrder] = useState<SortOrder>('ORDER');
  const [accuracySearch, setAccuracySearch] = useState('');
  const [accuracyVisible, setAccuracyVisible] = useState(ACCURACY_PAGE_SIZE);

  // Tab Nhận xét
  const [selectedCommentQ, setSelectedCommentQ] = useState<number | null>(null);
  const [questionScope, setQuestionScope] = useState<'WITH' | 'ALL'>('WITH');
  const [commentSearch, setCommentSearch] = useState('');

  const questionStats = questions.map((q, idx) => {
    const attempts = q.totalAttempts || 80;
    const correct = q.correctAttempts || Math.round(attempts * 0.75);
    const pct = Math.round((correct / (attempts || 1)) * 100);
    return { q, idx, attempts, pct, level: getDifficulty(pct) };
  });
  const levelCounts = DIFFICULTY_LEVELS.reduce(
    (acc, level) => ({
      ...acc,
      [level]: questionStats.filter((s) => s.level === level).length,
    }),
    {} as Record<DifficultyLevel, number>,
  );
  const filteredStats = questionStats
    .filter(
      (s) =>
        (difficultyFilter === 'ALL' || s.level === difficultyFilter) &&
        matchesQuestionSearch(accuracySearch, s.q, s.idx),
    )
    .sort((a, b) =>
      sortOrder === 'HARDEST'
        ? a.pct - b.pct || a.idx - b.idx
        : sortOrder === 'EASIEST'
          ? b.pct - a.pct || a.idx - b.idx
          : a.idx - b.idx,
    );
  const resetAccuracyPaging = () => setAccuracyVisible(ACCURACY_PAGE_SIZE);

  const commentCounts = questions.map((q, idx) =>
    countQuestionComments(q, idx),
  );
  const totalComments = commentCounts.reduce((sum, count) => sum + count, 0);
  const questionsWithComments = commentCounts.filter(
    (count) => count > 0,
  ).length;
  const pickerQuestions = questions
    .map((q, idx) => ({ q, idx }))
    .filter(
      ({ q, idx }) =>
        (questionScope === 'ALL' || commentCounts[idx] > 0) &&
        matchesQuestionSearch(commentSearch, q, idx),
    );
  const firstWithComments = commentCounts.findIndex((count) => count > 0);
  const activeCommentQ =
    selectedCommentQ ?? (firstWithComments >= 0 ? firstWithComments : 0);
  const activeQuestion = questions[activeCommentQ];

  const openQuestionComments = (idx: number) => {
    setSelectedCommentQ(idx);
    if (commentCounts[idx] === 0) setQuestionScope('ALL');
    setTab('COMMENTS');
  };

  const tabClass = (active: boolean) =>
    `py-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
      active
        ? 'border-fb-blue text-fb-blue'
        : 'border-transparent text-fb-text-2 hover:text-fb-text'
    }`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Thống kê & Đánh giá bộ đề thi"
        className="bg-fb-card rounded-lg shadow-2xl max-w-3xl w-full h-[min(88vh,760px)] overflow-hidden flex flex-col border border-fb-divider animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 border-b border-fb-divider flex items-center justify-between gap-3 bg-fb-input">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-fb-blue-soft text-fb-blue flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-fb-text">
                Thống kê & Đánh giá bộ đề thi
              </h3>
              <p className="text-sm text-fb-text-2 truncate">
                {exam.title} ({exam.courseCode})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-full hover:bg-fb-btn-hover text-fb-text-3 hover:text-fb-text-2 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto [scrollbar-width:none] border-b border-fb-divider px-4 bg-fb-card text-body font-semibold">
          <button
            type="button"
            onClick={() => setTab('ACCURACY')}
            className={tabClass(tab === 'ACCURACY')}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Tỷ lệ đúng & Độ khó</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('COMMENTS')}
            className={tabClass(tab === 'COMMENTS')}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Nhận xét các câu hỏi</span>
            <span className="ml-1 px-1.5 rounded-full text-xs bg-fb-blue-soft text-fb-blue font-semibold">
              {totalComments}
            </span>
          </button>
        </div>

        {/* Body */}
        <div
          className={`flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto ${
            tab === 'COMMENTS' ? 'sm:overflow-hidden' : ''
          }`}
        >
          {tab === 'ACCURACY' ? (
            <div className="space-y-4">
              {/* Tổng quan */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-lg bg-fb-blue-soft/70 border border-fb-blue/60 text-center">
                  <span className="text-xl font-bold text-fb-blue block">
                    {exam.totalAttempts ?? 0}
                  </span>
                  <span className="text-sm text-fb-text-2">Lượt làm đề</span>
                </div>
                <div className="p-3 rounded-lg bg-fb-success-soft/70 border border-fb-success/60 text-center">
                  <span className="text-xl font-bold text-fb-success block">
                    {examCorrectRate}%
                  </span>
                  <span className="text-sm text-fb-text-2">
                    Đúng trung bình
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-fb-warning-soft/70 border border-fb-warning/60 text-center">
                  <span className="text-xl font-bold text-fb-warning block">
                    {examRatingAverage > 0 ? examRatingAverage.toFixed(1) : '—'}
                  </span>
                  <span className="text-sm text-fb-text-2">Điểm sao / 4.0</span>
                </div>
              </div>

              {/* Phân bố độ khó: nhìn tổng thể cả đề, bấm để lọc */}
              <div className="space-y-2">
                <h4 className="text-card-title font-semibold text-fb-text">
                  Phân bố độ khó ({questions.length} câu)
                </h4>
                <div
                  className="flex h-2.5 rounded-full overflow-hidden bg-fb-btn"
                  aria-hidden="true"
                >
                  {DIFFICULTY_LEVELS.map((level) =>
                    levelCounts[level] > 0 ? (
                      <div
                        key={level}
                        className={DIFFICULTY[level].bar}
                        style={{
                          width: `${(levelCounts[level] / (questions.length || 1)) * 100}%`,
                        }}
                      />
                    ) : null,
                  )}
                </div>
                <div
                  className="flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Lọc theo độ khó"
                >
                  {(['ALL', ...DIFFICULTY_LEVELS] as const).map((level) => {
                    const isActive = difficultyFilter === level;
                    const count =
                      level === 'ALL' ? questions.length : levelCounts[level];
                    return (
                      <button
                        key={level}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => {
                          setDifficultyFilter(level);
                          resetAccuracyPaging();
                        }}
                        className={`h-8 px-3 rounded-full text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                          isActive
                            ? 'bg-fb-blue-soft text-fb-blue'
                            : 'bg-fb-btn text-fb-text hover:bg-fb-btn-hover'
                        }`}
                      >
                        {level !== 'ALL' && (
                          <span
                            className={`w-2 h-2 rounded-full ${DIFFICULTY[level].bar}`}
                          />
                        )}
                        {level === 'ALL' ? 'Tất cả' : DIFFICULTY[level].label}
                        {level !== 'ALL' && (
                          <span className="font-normal text-fb-text-2">
                            {DIFFICULTY[level].range}
                          </span>
                        )}
                        <span className="font-normal text-fb-text-2">
                          · {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tìm + sắp xếp */}
              <div className="flex flex-col sm:flex-row gap-2">
                <SearchBox
                  value={accuracySearch}
                  onChange={(value) => {
                    setAccuracySearch(value);
                    resetAccuracyPaging();
                  }}
                  className="flex-1"
                />
                <select
                  value={sortOrder}
                  aria-label="Sắp xếp câu hỏi"
                  onChange={(e) => {
                    setSortOrder(e.target.value as SortOrder);
                    resetAccuracyPaging();
                  }}
                  className="h-9 px-3 rounded-full bg-fb-input text-sm font-semibold text-fb-text cursor-pointer outline-none focus:ring-2 focus:ring-fb-blue/40"
                >
                  <option value="ORDER">Theo thứ tự câu</option>
                  <option value="HARDEST">Khó nhất trước</option>
                  <option value="EASIEST">Dễ nhất trước</option>
                </select>
              </div>

              {/* Danh sách câu (phân trang) */}
              {filteredStats.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-sm text-fb-text-2">
                    Hiển thị {Math.min(accuracyVisible, filteredStats.length)} /{' '}
                    {filteredStats.length} câu · bấm vào câu để xem nhận xét
                  </p>
                  {filteredStats
                    .slice(0, accuracyVisible)
                    .map(({ q, idx, attempts, pct, level }) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => openQuestionComments(idx)}
                        className="w-full text-left p-2.5 rounded-lg border border-fb-divider hover:bg-fb-hover transition cursor-pointer flex items-center gap-3"
                      >
                        <span className="w-16 shrink-0 text-sm font-semibold text-fb-text">
                          Câu {idx + 1}
                        </span>
                        <span className="flex-1 min-w-0 space-y-1">
                          <span className="block text-sm text-fb-text-2 truncate">
                            {q.content}
                          </span>
                          <span className="block h-2 rounded-full bg-fb-btn overflow-hidden">
                            <span
                              className={`block h-full rounded-full ${DIFFICULTY[level].bar}`}
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                        </span>
                        <span className="w-16 shrink-0 text-right">
                          <span
                            className={`block text-sm font-semibold ${DIFFICULTY[level].text}`}
                          >
                            {pct}%
                          </span>
                          <span className="block text-xs text-fb-text-3">
                            {attempts} lượt
                          </span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-fb-text-3 shrink-0" />
                      </button>
                    ))}
                  {filteredStats.length > accuracyVisible && (
                    <button
                      type="button"
                      onClick={() =>
                        setAccuracyVisible(accuracyVisible + ACCURACY_PAGE_SIZE)
                      }
                      className="w-full h-9 rounded-md bg-fb-btn hover:bg-fb-btn-hover text-sm font-semibold text-fb-text transition cursor-pointer"
                    >
                      Xem thêm{' '}
                      {Math.min(
                        ACCURACY_PAGE_SIZE,
                        filteredStats.length - accuracyVisible,
                      )}{' '}
                      câu
                    </button>
                  )}
                </div>
              ) : (
                <p className="py-8 text-center text-body text-fb-text-2">
                  Không có câu hỏi nào khớp bộ lọc.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 sm:h-full sm:min-h-0">
              {/* Cột trái: chọn câu hỏi */}
              <div className="sm:w-64 shrink-0 flex flex-col min-h-0 max-h-64 sm:max-h-none rounded-lg border border-fb-divider">
                <div className="p-2 space-y-2 border-b border-fb-divider">
                  <SearchBox
                    value={commentSearch}
                    onChange={setCommentSearch}
                  />
                  <div
                    className="grid grid-cols-2 gap-1 p-0.5 bg-fb-input rounded-md text-sm font-semibold"
                    role="group"
                    aria-label="Phạm vi câu hỏi"
                  >
                    {(
                      [
                        ['WITH', `Có nhận xét (${questionsWithComments})`],
                        ['ALL', `Tất cả (${questions.length})`],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={questionScope === value}
                        onClick={() => setQuestionScope(value)}
                        className={`h-8 px-1 rounded truncate transition cursor-pointer ${
                          questionScope === value
                            ? 'bg-fb-card text-fb-text shadow-xs'
                            : 'text-fb-text-2 hover:text-fb-text'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-1">
                  {pickerQuestions.length > 0 ? (
                    pickerQuestions.map(({ q, idx }) => {
                      const count = commentCounts[idx];
                      const isActive = idx === activeCommentQ;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setSelectedCommentQ(idx)}
                          aria-current={isActive ? 'true' : undefined}
                          className={`w-full text-left px-2.5 py-2 rounded-md transition cursor-pointer ${
                            isActive ? 'bg-fb-blue-soft' : 'hover:bg-fb-hover'
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                isActive ? 'text-fb-blue' : 'text-fb-text'
                              }`}
                            >
                              Câu {idx + 1}
                            </span>
                            <span
                              className={`text-xs shrink-0 ${
                                count > 0 ? 'text-fb-text-2' : 'text-fb-text-3'
                              }`}
                            >
                              {count > 0 ? `${count} nhận xét` : 'Chưa có'}
                            </span>
                          </span>
                          <span className="block text-sm text-fb-text-2 truncate">
                            {q.content}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="p-4 text-center text-sm text-fb-text-2">
                      Không tìm thấy câu hỏi phù hợp
                    </p>
                  )}
                </div>
              </div>

              {/* Cột phải: câu đang chọn + nhận xét (tải theo từng câu) */}
              {activeQuestion && (
                <QuestionCommentsPanel
                  key={activeQuestion.id}
                  question={activeQuestion}
                  questionIdx={activeCommentQ}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-fb-divider bg-fb-input flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-fb-btn hover:bg-fb-btn-hover text-fb-text text-body font-semibold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
