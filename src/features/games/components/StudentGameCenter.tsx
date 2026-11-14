import React, { useEffect, useState } from 'react';
import {
  Brain,
  CalendarCheck,
  CheckCircle2,
  Flag,
  Flame,
  Gauge,
  Library,
  Send,
  Users,
} from 'lucide-react';
import { errorMessage, type SubjectResponse } from '../../../api';
import type {
  CheckInStatusResponse,
  Game1ClassDto,
  Game6ActiveSessionResponse,
  GamePredictionResponse,
} from '../../../api/games';
import { proposalGateway } from '../../proposals/proposalGateway';
import type { SubmissionWithStatus } from '../../proposals/types';
import { describeData, findPrediction } from '../gameLabels';
import { gamesGateway } from '../gamesGateway';
import { GameSelectorBar, type GameId } from './GameSelectorBar';
import { QuestionListSkeleton, SkeletonRows } from '../../../shared/components/Skeleton';

type Toast = (
  message: string,
  type: 'success' | 'info' | 'warning' | 'error',
) => void;

interface CenterProps {
  predictions: GamePredictionResponse[];
  onPredicted: () => void;
  showToast: Toast;
  onOpenPropose: () => void;
  onOpenMyQuestionSets: () => void;
  onCheckInChanged?: (status: CheckInStatusResponse) => void;
}

function GameCard({
  icon: Icon,
  title,
  rule,
  children,
}: {
  icon: React.ElementType;
  title: string;
  rule: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-lg bg-fb-card p-4 shadow-fb-card">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-fb-blue-soft p-2 text-fb-blue">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-bold text-fb-text">{title}</h3>
          <p className="text-sm text-fb-text-2">{rule}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

const inputClass =
  'w-28 rounded-lg border border-fb-divider bg-fb-input px-3 py-1.5 text-sm text-fb-text';
const buttonClass =
  'inline-flex items-center gap-1.5 rounded-lg bg-fb-blue px-3 py-1.5 text-sm font-semibold text-white hover:bg-fb-blue-hover disabled:opacity-50';

function Submitted({ prediction }: { prediction: GamePredictionResponse }) {
  return (
    <p className="flex items-center gap-1.5 text-sm font-semibold text-fb-success">
      <CheckCircle2 className="h-4 w-4" /> Đã dự đoán ·{' '}
      {describeData(prediction.prediction_data)}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Điểm danh
// ---------------------------------------------------------------------------
export const CheckInCard: React.FC<{
  showToast: Toast;
  onChanged?: (s: CheckInStatusResponse) => void;
}> = ({ showToast, onChanged }) => {
  const [status, setStatus] = useState<CheckInStatusResponse | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    gamesGateway
      .getCheckInStatus()
      .then((s) => {
        setStatus(s);
        onChanged?.(s);
      })
      .catch(() => setStatus(null));
    // chỉ tải một lần khi mở
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkIn = async () => {
    setBusy(true);
    try {
      const res = await gamesGateway.checkIn();
      const next = {
        ...status,
        has_checked_in_today: true,
        current_streak: res.current_streak,
      };
      setStatus(next);
      onChanged?.(next);
      showToast(
        res.message ?? `Điểm danh thành công! +${res.coin_earned ?? 1} xu`,
        'success',
      );
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Không điểm danh được.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-fb-card p-4 shadow-fb-card">
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-fb-warning-soft p-2 text-fb-warning">
          <Flame className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-bold text-fb-text">Điểm danh hằng ngày</h3>
          <p className="text-sm text-fb-text-2">
            Chuỗi hiện tại: <b>{status?.current_streak ?? 0}</b> ngày liên tiếp
            · mỗi lần +1 xu
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void checkIn()}
        disabled={busy || !status || status.has_checked_in_today}
        className={buttonClass}
      >
        <CalendarCheck className="h-4 w-4" />
        {status?.has_checked_in_today ? 'Đã điểm danh hôm nay' : 'Điểm danh'}
      </button>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Game 1 — theo lớp học phần
// ---------------------------------------------------------------------------
const Game1Card: React.FC<CenterProps> = ({ onPredicted, showToast }) => {
  const [classes, setClasses] = useState<Game1ClassDto[] | null>(null);
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () =>
    gamesGateway
      .getGame1Classes()
      .then(setClasses)
      .catch((err: unknown) => {
        setClasses([]);
        showToast(
          errorMessage(err, 'Không tải được lớp học phần cho Game 1.'),
          'error',
        );
      });
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (c: Game1ClassDto) => {
    const value = Number(inputs[c.course_class_id!]);
    if (!Number.isInteger(value) || value < 1) {
      showToast('Nhập số sinh viên từ 1 trở lên.', 'warning');
      return;
    }
    setBusyId(c.course_class_id!);
    try {
      await gamesGateway.predictParticipants(c.course_class_id!, value);
      showToast(
        `Đã dự đoán ${value} sinh viên cho lớp ${c.class_code}.`,
        'success',
      );
      await load();
      onPredicted();
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Không gửi được dự đoán.'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <GameCard
      icon={Users}
      title="Game 1 · Bao nhiêu bạn trong lớp sẽ nộp câu hỏi ngày mai?"
      rule="Dự đoán cho từng lớp học phần bạn đang học. Chốt trước 22:00 mỗi ngày."
    >
      {!classes && <SkeletonRows count={2} avatar="square" />}
      {classes?.length === 0 && (
        <p className="text-sm text-fb-text-2">
          Bạn chưa thuộc lớp học phần nào.
        </p>
      )}
      <ul className="space-y-2">
        {classes?.map((c) => (
          <li
            key={c.course_class_id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-fb-divider p-3"
          >
            <span className="text-sm">
              <b className="text-fb-text">{c.class_code}</b>
              <span className="text-fb-text-2">
                {' '}
                · {c.subject_name} · {c.lecturer_name}
              </span>
            </span>
            {c.already_predicted ? (
              <span className="flex items-center gap-1 text-sm font-semibold text-fb-success">
                <CheckCircle2 className="h-4 w-4" /> Đã dự đoán{' '}
                {c.predicted_count} bạn
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={inputs[c.course_class_id!] ?? ''}
                  onChange={(e) =>
                    setInputs((p) => ({
                      ...p,
                      [c.course_class_id!]: e.target.value,
                    }))
                  }
                  aria-label={`Dự đoán cho lớp ${c.class_code}`}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => void submit(c)}
                  disabled={busyId === c.course_class_id}
                  className={buttonClass}
                >
                  <Send className="h-4 w-4" /> Gửi
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </GameCard>
  );
};

// ---------------------------------------------------------------------------
// Game 2 — tác giả đoán số câu của bộ mình được chọn (tách AI / tự làm)
// ---------------------------------------------------------------------------
const Game2Card: React.FC<CenterProps> = ({
  predictions,
  onPredicted,
  showToast,
}) => {
  const [sessions, setSessions] = useState<SubmissionWithStatus[] | null>(null);
  const [sessionId, setSessionId] = useState<number | undefined>(undefined);
  const [counts, setCounts] = useState<{ llm: number; human: number } | null>(
    null,
  );
  const [llm, setLlm] = useState('');
  const [human, setHuman] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Chỉ dự đoán được khi bộ chưa xem xét xong.
    Promise.all([
      proposalGateway.getMySubmissions({ status: 'PENDING' }),
      proposalGateway.getMySubmissions({ status: 'REVIEWING' }),
    ])
      .then(([a, b]) => setSessions([...a, ...b]))
      .catch(() => setSessions([]));
  }, []);

  useEffect(() => {
    setCounts(null);
    if (!sessionId) return;
    proposalGateway
      .getMySubmissionDetail(sessionId)
      .then((d) => {
        const qs = d.questions ?? [];
        const llmTotal = qs.filter((q) => q.source === 'LLM').length;
        setCounts({ llm: llmTotal, human: qs.length - llmTotal });
      })
      .catch(() => setCounts(null));
  }, [sessionId]);

  const existing = findPrediction(
    predictions,
    'GAME_2_APPROVED_QUESTIONS',
    sessionId,
  );

  const submit = async () => {
    if (!sessionId || !counts) return;
    const l = Number(llm || 0);
    const h = Number(human || 0);
    if (l < 0 || h < 0 || l > counts.llm || h > counts.human) {
      showToast(
        `Bộ này có ${counts.llm} câu AI và ${counts.human} câu tự làm.`,
        'warning',
      );
      return;
    }
    setBusy(true);
    try {
      await gamesGateway.predictApprovedQuestions(sessionId, l, h);
      showToast('Đã gửi dự đoán Game 2.', 'success');
      onPredicted();
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Không gửi được dự đoán.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <GameCard
      icon={Gauge}
      title="Game 2 · Bộ câu hỏi của bạn sẽ có bao nhiêu câu được chọn?"
      rule="Dự đoán riêng số câu do AI tạo và số câu bạn tự làm sẽ được giảng viên chọn vào ngân hàng đề. Kết quả công bố sau khi tổng kết, không cho biết là câu nào."
    >
      {!sessions && <SkeletonRows count={2} avatar="square" />}
      {sessions?.length === 0 && (
        <p className="text-sm text-fb-text-2">
          Bạn không có bộ câu hỏi nào đang chờ xem xét.
        </p>
      )}
      {sessions && sessions.length > 0 && (
        <div className="space-y-2">
          <select
            value={sessionId ?? ''}
            onChange={(e) =>
              setSessionId(e.target.value ? Number(e.target.value) : undefined)
            }
            aria-label="Bộ câu hỏi"
            className="w-full rounded-lg border border-fb-divider bg-fb-input px-3 py-2 text-sm text-fb-text"
          >
            <option value="">Chọn bộ câu hỏi của bạn…</option>
            {sessions.map((s) => (
              <option key={s.session_id} value={s.session_id}>
                {s.title} ({s.question_counts} câu)
              </option>
            ))}
          </select>
          {existing && <Submitted prediction={existing} />}
          {sessionId && !existing && counts && (
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm text-fb-text-2">
                Câu AI được chọn (tối đa {counts.llm})
                <input
                  type="number"
                  min={0}
                  max={counts.llm}
                  value={llm}
                  onChange={(e) => setLlm(e.target.value)}
                  className={`${inputClass} mt-1 block`}
                />
              </label>
              <label className="text-sm text-fb-text-2">
                Câu tự làm được chọn (tối đa {counts.human})
                <input
                  type="number"
                  min={0}
                  max={counts.human}
                  value={human}
                  onChange={(e) => setHuman(e.target.value)}
                  className={`${inputClass} mt-1 block`}
                />
              </label>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy}
                className={buttonClass}
              >
                <Send className="h-4 w-4" /> Gửi dự đoán
              </button>
            </div>
          )}
        </div>
      )}
    </GameCard>
  );
};

// ---------------------------------------------------------------------------
// Game 4 — quy mô ngân hàng cuối kỳ của môn (mỗi môn một lần)
// ---------------------------------------------------------------------------
const Game4Card: React.FC<CenterProps> = ({
  predictions,
  onPredicted,
  showToast,
}) => {
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  const [size, setSize] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    proposalGateway
      .getEnrolledSubjects()
      .then((list) => {
        setSubjects(list);
        setSubjectId(list[0]?.subject_id);
      })
      .catch(() => setSubjects([]));
  }, []);

  const existing = findPrediction(
    predictions,
    'GAME_4_SUBJECT_BANK_SIZE',
    subjectId,
  );

  const submit = async () => {
    const value = Number(size);
    if (!subjectId || !Number.isInteger(value) || value < 0) {
      showToast('Nhập quy mô là số nguyên không âm.', 'warning');
      return;
    }
    setBusy(true);
    try {
      await gamesGateway.predictBankSize(subjectId, value);
      showToast('Đã gửi dự đoán Game 4.', 'success');
      setSize('');
      onPredicted();
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Không gửi được dự đoán.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <GameCard
      icon={Library}
      title="Game 4 · Cuối kỳ ngân hàng đề của môn sẽ có bao nhiêu câu?"
      rule="Mỗi môn chỉ được dự đoán một lần. Top 3 người đoán sát nhất nhận giải khi chốt học kỳ."
    >
      {subjects.length === 0 ? (
        <p className="text-sm text-fb-text-2">Bạn chưa tham gia môn học nào.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
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
          {existing ? (
            <Submitted prediction={existing} />
          ) : (
            <>
              <input
                type="number"
                min={0}
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="Số câu"
                aria-label="Quy mô dự đoán"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy}
                className={buttonClass}
              >
                <Send className="h-4 w-4" /> Gửi (chỉ một lần)
              </button>
            </>
          )}
        </div>
      )}
    </GameCard>
  );
};

// ---------------------------------------------------------------------------
// Game 6 — chọn các câu nghi do AI tạo trong phiên Thứ 7
// ---------------------------------------------------------------------------
const Game6Card: React.FC<CenterProps> = ({
  predictions,
  onPredicted,
  showToast,
}) => {
  const [session, setSession] = useState<
    Game6ActiveSessionResponse | null | undefined
  >(undefined);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    gamesGateway
      .getGame6ActiveSession()
      .then(setSession)
      .catch((err: unknown) => {
        setSession(null);
        showToast(errorMessage(err, 'Không tải được phiên Game 6.'), 'error');
      });
  }, [showToast]);

  const existing = findPrediction(
    predictions,
    'GAME_6_LLM_IDENTIFICATION',
    session?.session_id,
  );
  const toggle = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const submit = async () => {
    if (!session?.session_id) return;
    if (
      !window.confirm(
        `Nộp ${selected.length} câu bạn cho là do AI tạo? Mỗi phiên chỉ nộp một lần.`,
      )
    )
      return;
    setBusy(true);
    try {
      await gamesGateway.submitGame6(session.session_id, selected);
      showToast('Đã nộp bài Game 6.', 'success');
      onPredicted();
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Không nộp được bài.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <GameCard
      icon={Brain}
      title="Game 6 · Câu nào do AI tạo?"
      rule="Mở vào Thứ 7 hằng tuần. Đánh dấu những câu bạn cho là do AI tạo; các câu còn lại được tính là do người viết."
    >
      {session === undefined && <QuestionListSkeleton count={1} />}
      {session === null && (
        <p className="text-sm text-fb-text-2">
          Hiện chưa có phiên nào mở. Quay lại vào Thứ 7 nhé!
        </p>
      )}
      {session && (
        <div className="space-y-2">
          <p className="text-xs text-fb-text-3">
            Tuần {session.week_number}/{session.year}
            {session.end_time &&
              ` · đóng lúc ${new Date(session.end_time).toLocaleString('vi-VN')}`}
          </p>
          {existing ? (
            <Submitted prediction={existing} />
          ) : (
            <>
              <ol className="space-y-2">
                {session.questions?.map((q, i) => (
                  <li
                    key={q.question_id}
                    className="rounded-lg border border-fb-divider p-3"
                  >
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(q.question_id!)}
                        onChange={() => toggle(q.question_id!)}
                        className="mt-1"
                      />
                      <span className="flex-1 space-y-1">
                        <span className="block text-sm font-medium text-fb-text">
                          {i + 1}. {q.content}
                        </span>
                        <span className="block text-xs text-fb-text-2">
                          {q.options
                            ?.map((o) => `${o.key}. ${o.text}`)
                            .join('   ')}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-fb-blue">
                        Do AI tạo?
                      </span>
                    </label>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy}
                className={buttonClass}
              >
                <Send className="h-4 w-4" /> Nộp bài ({selected.length} câu chọn
                là AI)
              </button>
            </>
          )}
        </div>
      )}
    </GameCard>
  );
};

// ---------------------------------------------------------------------------
// Trung tâm
// ---------------------------------------------------------------------------
/** Lượt dự đoán còn chờ tổng kết của mỗi game → nhãn trên ô chọn game. */
const GAME_TYPE_BY_ID: Partial<
  Record<GameId, GamePredictionResponse['game_type']>
> = {
  1: 'GAME_1_PARTICIPANTS',
  2: 'GAME_2_APPROVED_QUESTIONS',
  4: 'GAME_4_SUBJECT_BANK_SIZE',
  6: 'GAME_6_LLM_IDENTIFICATION',
};

export const StudentGameCenter: React.FC<CenterProps> = (props) => {
  const [active, setActive] = useState<GameId>(1);
  const badges: Partial<Record<GameId, string>> = {};
  (
    Object.entries(GAME_TYPE_BY_ID) as [
      string,
      GamePredictionResponse['game_type'],
    ][]
  ).forEach(([id, type]) => {
    if (
      props.predictions.some(
        (p) => p.game_type === type && p.status === 'PENDING',
      )
    ) {
      badges[Number(id) as GameId] = 'Chờ tổng kết';
    }
  });

  return (
    <div className="space-y-4">
      <CheckInCard
        showToast={props.showToast}
        onChanged={props.onCheckInChanged}
      />
      <GameSelectorBar active={active} onSelect={setActive} badges={badges} />
      {active === 1 && <Game1Card {...props} />}
      {active === 2 && <Game2Card {...props} />}
      {active === 3 && (
        <GameCard
          icon={Gauge}
          title="Game 3 · Mức tự tin của tác giả"
          rule="Không cần đặt cược riêng: mức tự tin (0–4) bạn chọn cho từng câu khi đăng bộ câu hỏi chính là lượt chơi Game 3. Kết quả hiện trong Lịch sử dự đoán."
        >
          <button
            type="button"
            onClick={props.onOpenPropose}
            className={buttonClass}
          >
            Đăng bộ câu hỏi
          </button>
        </GameCard>
      )}
      {active === 4 && <Game4Card {...props} />}
      {active === 5 && (
        <GameCard
          icon={Flag}
          title="Game 5 · Săn lỗi câu hỏi"
          rule="Khi luyện tập, nếu phát hiện đề hoặc đáp án sai, hãy chọn “Báo lỗi”. Giảng viên thẩm định; điểm thưởng được công bố gần cuối kỳ."
        >
          <button
            type="button"
            onClick={props.onOpenMyQuestionSets}
            className={buttonClass}
          >
            Đi luyện tập
          </button>
        </GameCard>
      )}
      {active === 6 && <Game6Card {...props} />}
    </div>
  );
};
