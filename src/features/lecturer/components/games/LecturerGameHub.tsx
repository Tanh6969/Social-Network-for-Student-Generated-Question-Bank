import React, { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Flag,
  Gamepad2,
  Search,
  Trophy,
  XCircle,
} from 'lucide-react';
import { errorMessage, isApiSession } from '../../../../api';
import { useApp } from '../../../demo/context/AppContext';
import { LeaderboardPanel } from '../../../games/components/LeaderboardPanel';
import { gamesGateway, type ErrorReport } from '../../../games/gamesGateway';
import {
  GAME_TILES,
  GameSelectorBar,
  type GameId,
} from '../../../games/components/GameSelectorBar';
import { CardListSkeleton } from '../../../../shared/components/Skeleton';

/** Vai trò của giảng viên trong từng trò chơi, đúng theo những gì Swagger cung cấp. */
const GAME_GUIDE = [
  {
    game: 'Game 1',
    name: 'Số sinh viên nộp câu hỏi ngày mai',
    play: 'Sinh viên đoán theo lớp học phần, chốt 22:00 mỗi ngày',
    score: 'Hệ thống tự đối chiếu số người nộp thực tế',
  },
  {
    game: 'Game 2',
    name: 'Số câu được chọn vào ngân hàng',
    play: 'Tác giả đoán cho bộ của mình (tách câu AI / tự làm)',
    score: 'Tự tính từ các câu giảng viên chọn khi xem xét bộ câu hỏi',
  },
  {
    game: 'Game 3',
    name: 'Mức tự tin của tác giả',
    play: 'Tác giả khai báo mức tự tin khi đăng câu hỏi',
    score: 'Hệ thống tự tổng kết',
  },
  {
    game: 'Game 4',
    name: 'Quy mô ngân hàng cuối kỳ',
    play: 'Sinh viên đoán một lần cho mỗi môn',
    score: 'Tổng kết Top 3 khi Quản trị viên chốt sổ học kỳ',
  },
  {
    game: 'Game 5',
    name: 'Báo lỗi câu hỏi',
    play: 'Sinh viên báo lỗi khi luyện tập',
    score: 'Giảng viên thẩm định ở tab “Thẩm định báo lỗi”',
  },
  {
    game: 'Game 6',
    name: 'Nhận diện câu do AI tạo',
    play: 'Phiên Thứ 7 hằng tuần, 7 câu',
    score: 'Hệ thống đối chiếu với nguồn gốc tác giả đã khai báo',
  },
];

function ReportCard({
  report,
  onReviewed,
}: {
  report: ErrorReport;
  onReviewed: (
    report: ErrorReport,
    confirmed: boolean,
    notes: string,
  ) => Promise<void>;
}) {
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const decide = async (confirmed: boolean) => {
    setBusy(true);
    try {
      await onReviewed(report, confirmed, notes);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="space-y-3 rounded-lg bg-fb-card p-4 shadow-fb-card">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-fb-text-2">
        <span>
          Câu hỏi{' '}
          <b className="tabular-nums text-fb-text">#{report.question_id}</b> ·
          báo bởi <b className="text-fb-text">{report.reporter_name}</b>
          {report.created_at &&
            ` · ${new Date(report.created_at).toLocaleString('vi-VN')}`}
        </span>
        {report.review && (
          <span
            className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${
              report.review.is_confirmed
                ? 'bg-fb-success-soft text-fb-success'
                : 'bg-fb-input text-fb-text-2'
            }`}
          >
            {report.review.is_confirmed ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            {report.review.is_confirmed ? 'Đã xác nhận có lỗi' : 'Đã bác bỏ'}
          </span>
        )}
      </div>
      {report.content && (
        <div className="space-y-2">
          <p className="whitespace-pre-wrap text-sm font-medium text-fb-text">
            {report.content}
          </p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {report.options?.map((o) => (
              <span
                key={o.key}
                className={`rounded-md border px-2.5 py-1.5 text-sm ${
                  o.is_correct
                    ? 'border-fb-success bg-fb-success-soft font-semibold text-fb-success'
                    : 'border-fb-divider text-fb-text'
                }`}
              >
                {o.key}. {o.text}
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="flex items-start gap-2 rounded-lg bg-fb-danger-soft p-3 text-sm text-fb-danger">
        <Flag className="mt-0.5 h-4 w-4 shrink-0" />
        {report.comment || 'Sinh viên không ghi mô tả lỗi.'}
      </p>
      {!report.review && (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ghi chú thẩm định (không bắt buộc)"
            className="w-full rounded-lg border border-fb-divider bg-fb-input px-3 py-2 text-sm text-fb-text"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => void decide(false)}
              disabled={busy}
              className="rounded-lg border border-fb-divider px-3 py-1.5 text-sm font-semibold text-fb-text hover:bg-fb-hover disabled:opacity-50"
            >
              Bác bỏ báo lỗi
            </button>
            <button
              type="button"
              onClick={() => void decide(true)}
              disabled={busy}
              className="rounded-lg bg-fb-danger px-3 py-1.5 text-sm font-semibold text-white hover:bg-fb-danger/90 disabled:opacity-50"
            >
              Xác nhận câu hỏi có lỗi
            </button>
          </div>
          <p className="text-xs text-fb-text-3">
            Xác nhận lỗi: người báo được cộng điểm, tác giả bị trừ điểm (theo hệ
            thống).
          </p>
        </div>
      )}
    </article>
  );
}

function ErrorReviewPanel() {
  const { showToast } = useApp();
  const apiMode = isApiSession();
  const [reports, setReports] = useState<ErrorReport[] | null>(
    apiMode ? [] : null,
  );
  const [questionIdInput, setQuestionIdInput] = useState('');
  const [searched, setSearched] = useState(false);
  const [reviewed, setReviewed] = useState<
    Record<string, ErrorReport['review']>
  >({});

  const load = useCallback(
    async (questionId?: number) => {
      setReports(null);
      try {
        setReports(await gamesGateway.getErrorReports(questionId));
      } catch (err: unknown) {
        setReports([]);
        showToast(errorMessage(err, 'Không tải được báo lỗi.'), 'error');
      }
    },
    [showToast],
  );

  useEffect(() => {
    if (!apiMode) void load();
  }, [apiMode, load]);

  const search = () => {
    const id = Number(questionIdInput);
    if (!Number.isInteger(id) || id <= 0) {
      showToast('Nhập ID câu hỏi là số nguyên dương.', 'warning');
      return;
    }
    setSearched(true);
    void load(id);
  };

  const onReviewed = async (
    report: ErrorReport,
    confirmed: boolean,
    notes: string,
  ) => {
    try {
      const message = await gamesGateway.reviewError(
        report.question_id,
        report.rating_user_id,
        confirmed,
        notes,
      );
      setReviewed((prev) => ({
        ...prev,
        [`${report.question_id}:${report.rating_user_id}`]: {
          is_confirmed: confirmed,
          notes,
        },
      }));
      showToast(
        message ||
          (confirmed ? 'Đã xác nhận câu hỏi có lỗi.' : 'Đã bác bỏ báo lỗi.'),
        'success',
      );
    } catch (err: unknown) {
      showToast(
        errorMessage(err, 'Không gửi được kết quả thẩm định.'),
        'error',
      );
    }
  };

  const shown = (reports ?? []).map((r) => ({
    ...r,
    review: reviewed[`${r.question_id}:${r.rating_user_id}`] ?? r.review,
  }));
  const pending = shown.filter((r) => !r.review);
  const done = shown.filter((r) => r.review);

  return (
    <div className="space-y-4">
      {apiMode && (
        <div className="space-y-2 rounded-lg bg-fb-card p-4 shadow-fb-card">
          <p className="text-sm text-fb-text-2">
            Hệ thống chưa có API liệt kê toàn bộ báo lỗi. Nhập ID câu hỏi (ví dụ
            từ thông báo hoặc file xuất ngân hàng) để xem các báo lỗi của câu
            đó.
          </p>
          <div className="flex gap-2">
            <input
              value={questionIdInput}
              onChange={(e) => setQuestionIdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="ID câu hỏi"
              inputMode="numeric"
              className="w-40 rounded-lg border border-fb-divider bg-fb-input px-3 py-1.5 text-sm text-fb-text"
            />
            <button
              type="button"
              onClick={search}
              className="flex items-center gap-1.5 rounded-lg bg-fb-blue px-3 py-1.5 text-sm font-semibold text-white"
            >
              <Search className="h-4 w-4" /> Tra cứu
            </button>
          </div>
        </div>
      )}
      {reports === null && (
        <CardListSkeleton count={2} label="Đang tải báo lỗi…" />
      )}
      {reports !== null && pending.length === 0 && (!apiMode || searched) && (
        <p className="rounded-lg bg-fb-card p-8 text-center text-sm text-fb-text-2 shadow-fb-card">
          Không có báo lỗi nào cần thẩm định.
        </p>
      )}
      {pending.map((r) => (
        <ReportCard
          key={`${r.question_id}:${r.rating_user_id}`}
          report={r}
          onReviewed={onReviewed}
        />
      ))}
      {done.length > 0 && (
        <>
          <h3 className="pt-2 text-sm font-bold text-fb-text-2">
            Đã thẩm định
          </h3>
          {done.map((r) => (
            <ReportCard
              key={`${r.question_id}:${r.rating_user_id}`}
              report={r}
              onReviewed={onReviewed}
            />
          ))}
        </>
      )}
    </div>
  );
}

/** Trò chơi không cần giảng viên thao tác: hiện cách chơi và cách hệ thống chấm. */
function GameInfoPanel({ id }: { id: GameId }) {
  const tile = GAME_TILES.find((g) => g.id === id)!;
  const guide = GAME_GUIDE[id - 1];
  return (
    <section className="space-y-3 rounded-lg bg-fb-card p-5 shadow-fb-card">
      <h2 className="flex items-center gap-2 text-lg font-bold text-fb-text">
        <tile.icon className="h-5 w-5 text-fb-blue" />
        Game {id} · {guide.name}
      </h2>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-fb-input p-3">
          <dt className="font-semibold text-fb-text">Sinh viên chơi thế nào</dt>
          <dd className="mt-1 text-fb-text-2">{guide.play}</dd>
        </div>
        <div className="rounded-lg bg-fb-input p-3">
          <dt className="font-semibold text-fb-text">Chấm điểm</dt>
          <dd className="mt-1 text-fb-text-2">{guide.score}</dd>
        </div>
      </dl>
      <p className="flex items-start gap-2 rounded-lg border border-fb-blue/30 bg-fb-blue-soft p-3 text-sm text-fb-blue">
        <Bot className="mt-0.5 h-4 w-4 shrink-0" />
        Trò chơi này do hệ thống tự chấm, giảng viên không cần thao tác. Kết quả
        của sinh viên được cộng vào bảng xếp hạng.
      </p>
    </section>
  );
}

/**
 * Trò chơi phía giảng viên: cùng hàng 6 ô như sinh viên. Theo Swagger, giảng
 * viên chỉ trực tiếp thẩm định Game 5; các game khác do hệ thống tự chấm.
 */
export const LecturerGameHub: React.FC = () => {
  const [active, setActive] = useState<GameId>(5);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-lg bg-fb-card p-5 shadow-fb-card sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-bold text-fb-text sm:text-2xl">
            <span className="rounded-lg bg-fb-blue p-2.5 text-white">
              <Gamepad2 className="h-5 w-5" />
            </span>
            Trò chơi học tập
          </h1>
          <p className="mt-1 text-sm text-fb-text-2">
            Chọn một trò chơi để xem. Giảng viên thẩm định báo lỗi câu hỏi ở
            Game 5; các trò chơi khác do hệ thống tự chấm.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowLeaderboard((v) => !v)}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold ${
            showLeaderboard
              ? 'bg-fb-blue text-white'
              : 'border border-fb-divider text-fb-text hover:bg-fb-hover'
          }`}
        >
          <Trophy className="h-4 w-4" /> Bảng xếp hạng
        </button>
      </div>

      {showLeaderboard ? (
        <LeaderboardPanel />
      ) : (
        <>
          <GameSelectorBar
            active={active}
            onSelect={setActive}
            badges={{ 5: 'Giảng viên thẩm định' }}
          />
          {active === 5 ? (
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-fb-text">
                <Flag className="h-5 w-5 text-fb-danger" /> Game 5 · Thẩm định
                báo lỗi câu hỏi
              </h2>
              <ErrorReviewPanel />
            </div>
          ) : (
            <GameInfoPanel id={active} />
          )}
        </>
      )}
    </div>
  );
};
