import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpDown,
  BookOpen,
  ChevronDown,
  Calendar,
  CheckCircle2,
  Info,
  Library,
  MessageCircle,
  PlayCircle,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import { useApp } from '../../demo/context/AppContext';
import { errorMessage, type SubjectResponse } from '../../../api';
import {
  progressOf,
  type BankSet,
  type BankSetStats,
  type Progress,
} from '../bankGateway';
import { getSubjectTone } from '../subjectTone';
import {
  refreshSetStats,
  useBankSnapshot,
  type StatsState,
} from '../bankQuery';
import { ApiExamRoom } from './ApiExamRoom';
import {
  CardListSkeleton,
  Skeleton,
  SkeletonRegion,
  SkeletonRows,
} from '../../../shared/components/Skeleton';

type SortKey = 'NEWEST' | 'QUESTIONS' | 'RATINGS' | 'COMMENTS';
type ProgressFilter = 'ALL' | Progress;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'NEWEST', label: 'Mới nhất' },
  { value: 'QUESTIONS', label: 'Nhiều câu hỏi' },
  { value: 'RATINGS', label: 'Nhiều lượt đánh giá' },
  { value: 'COMMENTS', label: 'Nhiều bình luận' },
];

const PROGRESS_OPTIONS: { value: ProgressFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'NOT_STARTED', label: 'Chưa làm' },
  { value: 'IN_PROGRESS', label: 'Đang làm dở' },
  { value: 'DONE', label: 'Đã làm xong' },
];

const ALL = 'ALL';

const EMPTY_SUBJECTS: SubjectResponse[] = [];
const EMPTY_STATS: StatsState = {};

function byNewest(a: BankSet, b: BankSet) {
  return (
    new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );
}

/** Khoá lọc môn: ưu tiên subject_id, nếu thiếu thì dùng tên môn. */
function subjectKey(set: { subjectId?: number; subjectName: string }) {
  return set.subjectId !== undefined
    ? `id:${set.subjectId}`
    : `name:${set.subjectName}`;
}

const SubjectItem: React.FC<{
  label: string;
  count: number;
  tone?: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, count, tone, active, onClick }) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    title={label}
    className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${active ? 'bg-fb-blue-soft' : 'hover:bg-fb-hover'}`}
  >
    <span
      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${tone ?? 'bg-fb-blue text-white'}`}
    >
      <Library className="w-4 h-4" aria-hidden="true" />
    </span>
    <span
      className={`flex-1 min-w-0 truncate text-body font-medium ${active ? 'text-fb-blue' : 'text-fb-text'}`}
    >
      {label}
    </span>
    <span className="text-sm font-semibold text-fb-text-2">{count}</span>
  </button>
);

const ProgressBar: React.FC<{ value: number; max: number }> = ({
  value,
  max,
}) => (
  <div
    className="h-1.5 w-full overflow-hidden rounded-full bg-fb-input"
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={max}
    aria-valuenow={value}
  >
    <div
      className="h-full rounded-full bg-fb-success transition-[width]"
      style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }}
    />
  </div>
);

const Stat: React.FC<{
  icon: React.ReactNode;
  value: number | undefined;
  label: string;
}> = ({ icon, value, label }) => (
  <span className="flex items-center gap-1" title={label}>
    {icon}
    {value === undefined ? <Skeleton className="h-3 w-5" /> : value}
    <span className="sr-only sm:not-sr-only sm:ml-0.5">{label}</span>
  </span>
);

const SetCard: React.FC<{
  set: BankSet;
  stats: BankSetStats | 'error' | undefined;
  onPractice: () => void;
}> = ({ set, stats, onPractice }) => {
  const live = stats && stats !== 'error' ? stats : undefined;
  const questionCount = live?.questionCount ?? set.indexedQuestionCount;
  const progress = live ? progressOf(live) : 'NOT_STARTED';
  const actionLabel =
    progress === 'DONE'
      ? 'Làm lại'
      : progress === 'IN_PROGRESS'
        ? 'Làm tiếp'
        : 'Làm bài thi thử';

  return (
    <article className="bg-fb-card rounded-lg shadow-fb-card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${getSubjectTone(set.subjectName)}`}
        >
          {set.subjectName}
        </span>
        {progress === 'DONE' && (
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-fb-success">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Đã làm xong
          </span>
        )}
      </div>
      <h3 className="text-card-title font-bold text-fb-text [overflow-wrap:anywhere]">
        {set.title}
      </h3>
      {set.content && (
        <p className="line-clamp-2 text-body text-fb-text-2 [overflow-wrap:anywhere]">
          {set.content}
        </p>
      )}

      {live && progress === 'IN_PROGRESS' && (
        <div className="space-y-1">
          <p className="text-xs text-fb-text-2">
            Bạn đã làm {live.answeredCount}/{live.questionCount} câu
          </p>
          <ProgressBar value={live.answeredCount} max={live.questionCount} />
        </div>
      )}

      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm text-fb-text-2">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Stat
            icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
            value={questionCount}
            label="câu"
          />
          <Stat
            icon={<Star className="h-4 w-4" aria-hidden="true" />}
            value={live?.ratingCount}
            label="đánh giá"
          />
          <Stat
            icon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}
            value={live?.commentCount}
            label="bình luận"
          />
          {set.createdAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              {new Date(set.createdAt).toLocaleDateString('vi-VN')}
            </span>
          )}
          {stats === 'error' && (
            <span className="text-xs text-fb-danger">
              Không tải được số liệu
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={onPractice}
          disabled={questionCount === 0}
          className="flex items-center gap-1.5 rounded-md bg-fb-blue px-3 h-9 font-semibold text-white hover:bg-fb-blue-hover disabled:opacity-50 cursor-pointer"
        >
          {progress === 'DONE' ? (
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          ) : (
            <PlayCircle className="h-4 w-4" aria-hidden="true" />
          )}
          {actionLabel}
        </button>
      </div>
    </article>
  );
};

/** Một dòng bộ câu hỏi trong thanh bên phải. */
const SideSetItem: React.FC<{
  set: BankSet;
  meta: React.ReactNode;
  onClick: () => void;
}> = ({ set, meta, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-fb-hover text-left transition-colors cursor-pointer"
  >
    <span
      className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${getSubjectTone(set.subjectName)}`}
    >
      <BookOpen className="w-5 h-5" aria-hidden="true" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-body font-medium text-fb-text leading-snug line-clamp-2 [overflow-wrap:anywhere]">
        {set.title}
      </span>
      <span className="block text-sm text-fb-text-2">{meta}</span>
    </span>
  </button>
);

/**
 * /bank trong phiên thật: kho chung các bộ câu hỏi sinh viên đã đăng
 * (GET /search?type=SESSION), thống kê sống từ GET /sessions/{id}/questions.
 * Làm bài trong phòng thi toàn màn hình (ApiExamRoom), sau khi nộp thì chấm
 * sao và bình luận từng câu. Không hiển thị trạng thái duyệt.
 */
export const ApiBankView: React.FC = () => {
  const { setActiveTab, showToast, currentUser } = useApp();

  const queryClient = useQueryClient();
  const [subject, setSubject] = useState<string>(ALL);
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('NEWEST');
  const [practiceId, setPracticeId] = useState<number | null>(null);

  // Một lượt: danh sách + môn + thống kê mọi bộ; có cache (xem bankQuery.ts).
  const bank = useBankSnapshot(currentUser.id);
  const sets = bank.data?.sets ?? null;
  const subjects = bank.data?.subjects ?? EMPTY_SUBJECTS;
  const stats = bank.data?.stats ?? EMPTY_STATS;
  // Có dữ liệu cũ trong cache thì cứ hiện, chỉ báo lỗi khi chưa có gì.
  const error =
    bank.isError && !bank.data
      ? errorMessage(bank.error, 'Không tải được kho bộ câu hỏi.')
      : null;
  const load = () => void bank.refetch();

  const closeExamRoom = () => {
    const id = practiceId;
    setPracticeId(null);
    if (id === null) return;
    // Cập nhật số liệu của bộ vừa làm (đã làm / đánh giá / bình luận).
    refreshSetStats(queryClient, currentUser.id, id).catch(() => undefined);
  };

  const liveStats = useCallback(
    (id: number): BankSetStats | undefined => {
      const value = stats[id];
      return value && value !== 'error' ? value : undefined;
    },
    [stats],
  );

  const subjectOptions = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; count: number }
    >();
    for (const s of subjects) {
      if (s.subject_id === undefined || !s.name) continue;
      const key = `id:${s.subject_id}`;
      map.set(key, { key, label: s.name, count: 0 });
    }
    for (const set of sets ?? []) {
      const key = subjectKey(set);
      const entry = map.get(key) ?? { key, label: set.subjectName, count: 0 };
      entry.count += 1;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) =>
      a.label.localeCompare(b.label, 'vi'),
    );
  }, [subjects, sets]);

  // Bộ thuộc môn + từ khoá đang chọn (chưa lọc tiến độ) — dùng để đếm chip tiến độ.
  const subjectAndSearchSets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (sets ?? []).filter(
      (set) =>
        (subject === ALL || subjectKey(set) === subject) &&
        (!term ||
          set.title.toLowerCase().includes(term) ||
          set.subjectName.toLowerCase().includes(term) ||
          (set.content?.toLowerCase().includes(term) ?? false)),
    );
  }, [sets, subject, searchTerm]);

  const progressCounts = useMemo(() => {
    const counts: Record<ProgressFilter, number> = {
      ALL: subjectAndSearchSets.length,
      NOT_STARTED: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };
    for (const set of subjectAndSearchSets) {
      const s = liveStats(set.sessionId);
      if (s) counts[progressOf(s)] += 1;
    }
    return counts;
  }, [subjectAndSearchSets, liveStats]);

  const visibleSets = useMemo(() => {
    const metric = (set: BankSet): number => {
      const s = liveStats(set.sessionId);
      if (sortBy === 'QUESTIONS')
        return s?.questionCount ?? set.indexedQuestionCount;
      if (sortBy === 'RATINGS') return s?.ratingCount ?? 0;
      if (sortBy === 'COMMENTS') return s?.commentCount ?? 0;
      return 0;
    };
    return subjectAndSearchSets
      .filter((set) => {
        if (progressFilter === 'ALL') return true;
        const s = liveStats(set.sessionId);
        return s ? progressOf(s) === progressFilter : false;
      })
      .sort((a, b) => metric(b) - metric(a) || byNewest(a, b));
  }, [subjectAndSearchSets, progressFilter, sortBy, liveStats]);

  // ---- Thanh bên ----
  // Đã xong = có số liệu hoặc đã lỗi (bộ lỗi không làm "đang tải" kéo dài mãi).
  const statsSettled = (sets ?? []).filter(
    (s) => stats[s.sessionId] !== undefined,
  ).length;
  const statsPending = (sets?.length ?? 0) > 0 && statsSettled < sets!.length;

  // Tiến độ tính theo BỘ (không theo câu — bộ thật có thể tới hàng trăm câu).
  const myProgress = useMemo(() => {
    const result = {
      total: sets?.length ?? 0,
      done: 0,
      inProgress: 0,
      rated: 0,
    };
    for (const set of sets ?? []) {
      const s = liveStats(set.sessionId);
      if (!s) continue;
      const p = progressOf(s);
      if (p === 'DONE') result.done += 1;
      if (p === 'IN_PROGRESS') result.inProgress += 1;
      if (s.ratedCount > 0) result.rated += 1;
    }
    return result;
  }, [sets, liveStats]);

  const continueSets = useMemo(
    () =>
      (sets ?? [])
        .filter((set) => {
          const s = liveStats(set.sessionId);
          return s && progressOf(s) === 'IN_PROGRESS';
        })
        .slice(0, 4),
    [sets, liveStats],
  );

  const mostDiscussed = useMemo(
    () =>
      (sets ?? [])
        .map((set) => ({ set, s: liveStats(set.sessionId) }))
        .filter(({ s }) => s && s.ratingCount + s.commentCount > 0)
        .sort(
          (a, b) =>
            b.s!.ratingCount +
            b.s!.commentCount -
            (a.s!.ratingCount + a.s!.commentCount),
        )
        .slice(0, 5),
    [sets, liveStats],
  );

  const suggestions = useMemo(
    () =>
      [...(sets ?? [])]
        .filter((set) => {
          const s = liveStats(set.sessionId);
          return s && s.questionCount > 0 && progressOf(s) === 'NOT_STARTED';
        })
        .sort(byNewest)
        .slice(0, 3),
    [sets, liveStats],
  );

  const activeLabel =
    subject === ALL
      ? 'Tất cả môn học'
      : (subjectOptions.find((o) => o.key === subject)?.label ?? 'Môn học');

  const searchInput = (className: string) => (
    <div className={`relative ${className}`}>
      <Search
        className="w-4 h-4 text-fb-text-2 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        aria-label="Tìm bộ câu hỏi"
        placeholder="Tìm bộ câu hỏi, môn học"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full h-10 pl-9 pr-3 bg-fb-input rounded-full text-body text-fb-text placeholder:text-fb-text-2 outline-none focus:ring-2 focus:ring-fb-blue/40"
      />
    </div>
  );

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 py-4 flex justify-between items-start gap-4 xl:gap-6">
      {/* CỘT TRÁI: TÌM KIẾM, MÔN HỌC, TIẾN ĐỘ */}
      <aside className="scrollbar-hover hidden lg:block w-[280px] xl:w-[300px] shrink-0 sticky top-18 max-h-[calc(100vh-5rem)] overflow-y-auto select-none space-y-3">
        <div className="bg-fb-card rounded-lg shadow-fb-card p-3">
          <h1 className="px-1 text-2xl font-bold text-fb-text">Ngân hàng đề</h1>
          <p className="mt-1 flex items-start gap-1.5 px-1 text-xs leading-relaxed text-fb-text-2">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Bộ câu hỏi hiện ở đây sau khi giảng viên xem xét xong. Làm thử, chấm
            sao và bình luận để góp ý cho bạn học.
          </p>
          {searchInput('mt-3')}
          <button
            onClick={() => setActiveTab('propose')}
            className="mt-3 w-full h-10 rounded-md bg-fb-blue hover:bg-fb-blue-hover text-white text-body font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            Đề xuất bộ câu hỏi mới
          </button>

          <div className="my-3 border-t border-fb-divider" />

          {sets === null && !error ? (
            <SkeletonRows count={3} label="Đang tải môn học…" />
          ) : (
            <>
              <SubjectItem
                label="Tất cả môn học"
                count={sets?.length ?? 0}
                active={subject === ALL}
                onClick={() => setSubject(ALL)}
              />
              {subjectOptions.map((opt) => (
                <SubjectItem
                  key={opt.key}
                  label={opt.label}
                  count={opt.count}
                  tone={getSubjectTone(opt.label)}
                  active={subject === opt.key}
                  onClick={() => setSubject(opt.key)}
                />
              ))}
            </>
          )}
        </div>

        <section className="bg-fb-card rounded-lg shadow-fb-card p-3 space-y-3">
          <h2 className="px-1 text-card-title font-semibold text-fb-text">
            Tiến độ của bạn
          </h2>
          {statsPending || (sets === null && !error) ? (
            <SkeletonRegion
              label="Đang tải tiến độ…"
              className="space-y-3 px-1"
            >
              <div className="flex items-end justify-between">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
              <div className="space-y-3 pt-1">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
            </SkeletonRegion>
          ) : (
            <>
              <div className="space-y-2 px-1">
                <p className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-fb-text-2">
                    <span className="text-2xl font-bold text-fb-text tabular-nums">
                      {myProgress.done}
                    </span>
                    <span className="text-fb-text-2">/{myProgress.total}</span>{' '}
                    bộ đã làm xong
                  </span>
                  <span className="text-sm font-semibold text-fb-success tabular-nums">
                    {myProgress.total > 0
                      ? Math.round((myProgress.done / myProgress.total) * 100)
                      : 0}
                    %
                  </span>
                </p>
                <ProgressBar value={myProgress.done} max={myProgress.total} />
              </div>
              <dl className="divide-y divide-fb-divider px-1 text-sm">
                <div className="flex items-center justify-between py-2">
                  <dt className="flex items-center gap-2 text-fb-text-2">
                    <PlayCircle
                      className="h-4 w-4 text-fb-blue"
                      aria-hidden="true"
                    />
                    Đang làm dở
                  </dt>
                  <dd className="font-semibold text-fb-text tabular-nums">
                    {myProgress.inProgress} bộ
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="flex items-center gap-2 text-fb-text-2">
                    <Star
                      className="h-4 w-4 text-fb-warning"
                      aria-hidden="true"
                    />
                    Đã chấm sao
                  </dt>
                  <dd className="font-semibold text-fb-text tabular-nums">
                    {myProgress.rated} bộ
                  </dd>
                </div>
              </dl>
            </>
          )}
        </section>
      </aside>

      {/* CỘT GIỮA: DANH SÁCH BỘ CÂU HỎI */}
      <main className="flex-1 min-w-0 max-w-[960px] mx-auto space-y-3">
        <div className="bg-fb-card rounded-lg shadow-fb-card">
          {/* Tiêu đề + sắp xếp */}
          <div className="flex items-start justify-between gap-3 px-4 pt-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-fb-text truncate">
                {activeLabel}
              </h2>
              {sets ? (
                <p className="text-sm text-fb-text-2">
                  {visibleSets.length} bộ câu hỏi do sinh viên đóng góp
                </p>
              ) : (
                <Skeleton className="mt-1.5 h-3 w-56" />
              )}
            </div>
            <label className="relative shrink-0">
              <span className="sr-only">Sắp xếp bộ câu hỏi</span>
              <ArrowUpDown
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fb-text-2"
                aria-hidden="true"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="h-9 appearance-none rounded-md bg-fb-btn pl-9 pr-8 text-sm font-semibold text-fb-text hover:bg-fb-btn-hover cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-fb-blue/40"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fb-text-2"
                aria-hidden="true"
              />
            </label>
          </div>

          {/* Màn hình nhỏ: tìm kiếm + chọn môn (sidebar bị ẩn) */}
          <div className="mt-3 flex flex-col gap-2 px-4 sm:flex-row lg:hidden">
            {searchInput('flex-1')}
            <select
              aria-label="Chọn môn học"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-10 rounded-full bg-fb-input px-4 text-body text-fb-text sm:w-56"
            >
              <option value={ALL}>Tất cả môn học ({sets?.length ?? 0})</option>
              {subjectOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label} ({opt.count})
                </option>
              ))}
            </select>
          </div>

          {/* Tab tiến độ, gạch chân kiểu Facebook */}
          <div
            className="mt-3 flex overflow-x-auto border-t border-fb-divider px-2"
            role="tablist"
            aria-label="Lọc theo tiến độ"
          >
            {PROGRESS_OPTIONS.map((opt) => {
              const active = progressFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setProgressFilter(opt.value)}
                  className={`relative shrink-0 h-12 px-3 sm:px-4 text-body font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'text-fb-blue'
                      : 'text-fb-text-2 hover:text-fb-text'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {opt.label}
                    {(!sets || (statsPending && opt.value !== 'ALL')) && (
                      <Skeleton className="h-5 w-6 rounded-full" />
                    )}
                    {sets && !(statsPending && opt.value !== 'ALL') && (
                      <span
                        className={`min-w-5 rounded-full px-1.5 text-xs leading-5 tabular-nums ${
                          active
                            ? 'bg-fb-blue-soft text-fb-blue'
                            : 'bg-fb-input text-fb-text-2'
                        }`}
                      >
                        {progressCounts[opt.value]}
                      </span>
                    )}
                  </span>
                  {active && (
                    <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-fb-blue" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {sets === null && !error && (
          <CardListSkeleton count={4} label="Đang tải bộ câu hỏi…" />
        )}

        {error && (
          <div className="bg-fb-card rounded-lg shadow-fb-card p-8 text-center space-y-3">
            <p role="alert" className="text-body text-fb-danger">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="h-9 px-4 rounded-md bg-fb-blue hover:bg-fb-blue-hover text-white text-body font-semibold cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {sets &&
          visibleSets.map((set) => (
            <SetCard
              key={set.sessionId}
              set={set}
              stats={stats[set.sessionId]}
              onPractice={() => setPracticeId(set.sessionId)}
            />
          ))}

        {sets && visibleSets.length === 0 && (
          <div className="bg-fb-card rounded-lg shadow-fb-card p-8 text-center">
            <BookOpen
              className="w-10 h-10 text-fb-text-2 mx-auto"
              aria-hidden="true"
            />
            <p className="mt-2 text-card-title font-semibold text-fb-text">
              {sets.length === 0
                ? 'Chưa có bộ câu hỏi nào'
                : 'Chưa có bộ câu hỏi phù hợp'}
            </p>
            <p className="text-body text-fb-text-2">
              {sets.length === 0
                ? 'Bộ câu hỏi sẽ xuất hiện ở đây sau khi giảng viên xem xét xong.'
                : 'Thử đổi từ khoá, môn học hoặc bộ lọc tiến độ.'}
            </p>
            <button
              onClick={() => setActiveTab('propose')}
              className="mt-4 h-9 px-4 rounded-md bg-fb-blue hover:bg-fb-blue-hover text-white text-body font-semibold transition-colors cursor-pointer"
            >
              Đề xuất bộ câu hỏi
            </button>
          </div>
        )}
      </main>

      {/* CỘT PHẢI: LÀM TIẾP, THẢO LUẬN NHIỀU, GỢI Ý */}
      <aside className="scrollbar-hover hidden xl:block w-[300px] shrink-0 sticky top-18 max-h-[calc(100vh-5rem)] overflow-y-auto space-y-3">
        {continueSets.length > 0 && (
          <section className="bg-fb-card rounded-lg shadow-fb-card p-3">
            <h2 className="px-1 mb-1 text-card-title font-semibold text-fb-text">
              Làm tiếp
            </h2>
            {continueSets.map((set) => {
              const s = liveStats(set.sessionId)!;
              return (
                <SideSetItem
                  key={set.sessionId}
                  set={set}
                  onClick={() => setPracticeId(set.sessionId)}
                  meta={
                    <span className="mt-1 block space-y-1">
                      <span className="block">
                        Đã làm {s.answeredCount}/{s.questionCount} câu
                      </span>
                      <ProgressBar
                        value={s.answeredCount}
                        max={s.questionCount}
                      />
                    </span>
                  }
                />
              );
            })}
          </section>
        )}

        <section className="bg-fb-card rounded-lg shadow-fb-card p-3">
          <h2 className="px-1 mb-1 text-card-title font-semibold text-fb-text">
            Được thảo luận nhiều
          </h2>
          {(statsPending || (sets === null && !error)) &&
            mostDiscussed.length === 0 && (
              <SkeletonRows count={3} avatar="square" />
            )}
          {!statsPending && sets !== null && mostDiscussed.length === 0 && (
            <p className="px-1 py-2 text-sm text-fb-text-2">
              Chưa có bộ câu hỏi nào được đánh giá hay bình luận.
            </p>
          )}
          {mostDiscussed.map(({ set, s }) => (
            <SideSetItem
              key={set.sessionId}
              set={set}
              onClick={() => setPracticeId(set.sessionId)}
              meta={
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" aria-hidden="true" />
                    {s!.ratingCount} đánh giá
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    {s!.commentCount}
                  </span>
                </span>
              }
            />
          ))}
        </section>

        {suggestions.length > 0 && (
          <section className="bg-fb-card rounded-lg shadow-fb-card p-3">
            <h2 className="flex items-center gap-1.5 px-1 mb-1 text-card-title font-semibold text-fb-text">
              <Sparkles className="h-4 w-4 text-fb-blue" aria-hidden="true" />
              Bạn chưa làm
            </h2>
            {suggestions.map((set) => (
              <SideSetItem
                key={set.sessionId}
                set={set}
                onClick={() => setPracticeId(set.sessionId)}
                meta={`${set.subjectName} · ${liveStats(set.sessionId)?.questionCount ?? 0} câu`}
              />
            ))}
          </section>
        )}
      </aside>

      {practiceId !== null && (
        <ApiExamRoom
          sessionId={practiceId}
          currentUserId={currentUser.id}
          onClose={closeExamRoom}
          showToast={showToast}
        />
      )}
    </div>
  );
};
