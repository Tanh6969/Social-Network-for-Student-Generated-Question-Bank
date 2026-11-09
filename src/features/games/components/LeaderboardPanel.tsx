import React, { useEffect, useState } from 'react';
import { Crown, Trophy } from 'lucide-react';
import { errorMessage, type SubjectResponse } from '../../../api';
import type {
  LeaderboardEntryDto,
  LeaderboardPeriod,
  LeaderboardResponse,
} from '../../../api/games';
import { proposalGateway } from '../../proposals/proposalGateway';
import { gamesGateway } from '../gamesGateway';

interface LeaderboardPanelProps {
  /** Bấm vào một người; không truyền thì danh sách chỉ để xem. */
  onOpenEntry?: (entry: LeaderboardEntryDto) => void;
  canOpenEntry?: (entry: LeaderboardEntryDto) => boolean;
}

function Avatar({
  entry,
  size,
}: {
  entry: { avatar_url?: string; full_name?: string };
  size: string;
}) {
  return entry.avatar_url ? (
    <img
      src={entry.avatar_url}
      alt=""
      className={`${size} rounded-full object-cover`}
    />
  ) : (
    <span
      className={`${size} flex items-center justify-center rounded-full bg-fb-blue-soft font-bold text-fb-blue`}
    >
      {(entry.full_name ?? '?').charAt(0)}
    </span>
  );
}

/** Bảng xếp hạng theo học kỳ hoặc theo môn (GET /games/leaderboard). */
export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  onOpenEntry,
  canOpenEntry,
}) => {
  const [period, setPeriod] = useState<LeaderboardPeriod>('SEMESTER');
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    proposalGateway
      .getAllSubjects()
      .then((list) => {
        setSubjects(list);
        setSubjectId((current) => current ?? list[0]?.subject_id);
      })
      .catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    if (period === 'SUBJECT' && !subjectId) return;
    let cancelled = false;
    setData(null);
    setError(null);
    gamesGateway
      .getLeaderboard({
        period,
        subject_id: period === 'SUBJECT' ? subjectId : undefined,
        limit: 50,
      })
      .then((res) => !cancelled && setData(res))
      .catch((err: unknown) => {
        if (!cancelled)
          setError(errorMessage(err, 'Không tải được bảng xếp hạng.'));
      });
    return () => {
      cancelled = true;
    };
  }, [period, subjectId]);

  const entries = data?.entries ?? [];
  const podium = [entries[1], entries[0], entries[2]];
  const clickable = (e: LeaderboardEntryDto) =>
    Boolean(onOpenEntry && (canOpenEntry?.(e) ?? true));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-fb-card p-3 shadow-fb-card">
        <h2 className="mr-auto flex items-center gap-2 font-bold text-fb-text">
          <Trophy className="h-5 w-5 text-fb-warning" /> Bảng xếp hạng
        </h2>
        {(['SEMESTER', 'SUBJECT'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              period === p
                ? 'bg-fb-blue text-white'
                : 'bg-fb-input text-fb-text hover:bg-fb-hover'
            }`}
          >
            {p === 'SEMESTER' ? 'Cả học kỳ' : 'Theo môn'}
          </button>
        ))}
        {period === 'SUBJECT' && (
          <select
            value={subjectId ?? ''}
            onChange={(e) => setSubjectId(Number(e.target.value))}
            aria-label="Môn học"
            className="rounded-lg border border-fb-divider bg-fb-input px-3 py-1.5 text-sm text-fb-text"
          >
            {subjects.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="text-sm text-fb-danger">{error}</p>}
      {!data && !error && (
        <p className="py-6 text-center text-sm text-fb-text-2">Đang tải…</p>
      )}

      {data?.my_rank && (data.my_rank.rank ?? 0) > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-fb-blue/30 bg-fb-blue-soft p-3 text-sm text-fb-blue">
          <Avatar entry={data.my_rank} size="h-9 w-9" />
          <span>
            Bạn đang hạng <b>#{data.my_rank.rank}</b> với{' '}
            <b>{data.my_rank.total_points}</b> điểm
            {data.my_rank.top_percent !== undefined &&
              ` · Top ${data.my_rank.top_percent}%`}
            {data.my_rank.total_participants !== undefined &&
              ` trên ${data.my_rank.total_participants} người`}
          </span>
        </div>
      )}

      {data && entries.length === 0 && (
        <p className="rounded-lg bg-fb-card p-8 text-center text-sm text-fb-text-2 shadow-fb-card">
          Chưa có ai trên bảng xếp hạng.
        </p>
      )}

      {entries.length >= 3 && (
        <div className="grid grid-cols-3 items-end gap-3 rounded-lg bg-fb-card p-4 shadow-fb-card">
          {podium.map((e, i) =>
            e ? (
              <button
                key={e.user_id}
                type="button"
                disabled={!clickable(e)}
                onClick={() => onOpenEntry?.(e)}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 text-center disabled:cursor-default ${
                  i === 1 ? 'pb-6' : ''
                } ${clickable(e) ? 'hover:bg-fb-hover' : ''}`}
              >
                {e.rank === 1 && <Crown className="h-5 w-5 text-fb-warning" />}
                <Avatar
                  entry={e}
                  size={e.rank === 1 ? 'h-16 w-16' : 'h-12 w-12'}
                />
                <span className="line-clamp-1 text-sm font-semibold text-fb-text">
                  {e.full_name}
                </span>
                <span className="text-xs text-fb-text-2">
                  #{e.rank} · {e.total_points} điểm
                </span>
              </button>
            ) : (
              <span key={i} />
            ),
          )}
        </div>
      )}

      {entries.length > 0 && (
        <ol className="divide-y divide-fb-divider rounded-lg bg-fb-card shadow-fb-card">
          {entries.slice(entries.length >= 3 ? 3 : 0).map((e) => (
            <li key={e.user_id}>
              <button
                type="button"
                disabled={!clickable(e)}
                onClick={() => onOpenEntry?.(e)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm disabled:cursor-default ${
                  e.is_current_user ? 'bg-fb-blue-soft/60' : ''
                } ${clickable(e) ? 'hover:bg-fb-hover' : ''}`}
              >
                <span className="w-8 font-bold tabular-nums text-fb-text-2">
                  #{e.rank}
                </span>
                <Avatar entry={e} size="h-8 w-8" />
                <span className="flex-1">
                  <span className="font-semibold text-fb-text">
                    {e.full_name}
                  </span>
                  {e.user_code && (
                    <span className="ml-2 text-xs text-fb-text-3">
                      {e.user_code}
                    </span>
                  )}
                </span>
                <span className="font-semibold tabular-nums text-fb-text">
                  {e.total_points}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
