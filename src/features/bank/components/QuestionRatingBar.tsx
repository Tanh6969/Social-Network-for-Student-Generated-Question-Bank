import React, { useState } from 'react';
import { Flag, Star } from 'lucide-react';

/** Lý do báo lỗi chọn nhanh — ghép thành mô tả gửi PUT /questions/{id}/report. */
export const ERROR_REASONS = [
  'Sai đáp án',
  'Nhiều đáp án đúng',
  'Không có đáp án đúng',
  'Đề không rõ ràng',
  'Lỗi chính tả / định dạng',
];

/** Mô tả báo lỗi tối đa 500 ký tự (giới hạn của PUT /questions/{id}/report). */
export function buildErrorDescription(reasons: string[], note: string): string {
  return [reasons.join(', '), note.trim()]
    .filter(Boolean)
    .join('. ')
    .slice(0, 500);
}

const STAR_LABELS = ['', 'Chưa tốt', 'Tạm được', 'Tốt', 'Rất hay'];

interface QuestionRatingBarProps {
  /** Mức đã đánh giá: 0 = báo câu lỗi, 1–4 = sao; undefined = chưa đánh giá. */
  value?: number;
  /** Chấm chất lượng 1–4 sao (POST /rate). */
  onRate: (rating: number) => void | Promise<void>;
  /** 0 sao = câu bị lỗi: gửi mô tả để giảng viên thẩm định (Minigame 5). */
  onReportError: (description: string) => void | Promise<void>;
  /** Tác giả không tự đánh giá câu của mình. */
  disabled?: boolean;
  /** Mở sẵn form báo lỗi (câu đã được gắn cờ khi làm bài). */
  startInReport?: boolean;
  size?: 'md' | 'lg';
}

/**
 * Thang theo mô tả Minigame 5: 1–4 sao chấm chất lượng, "0 sao" là báo câu lỗi
 * kèm mô tả. Không có thao tác huỷ đánh giá (API không hỗ trợ). Không hiển thị
 * kết quả thẩm định — chỉ thông báo gần cuối kỳ.
 */
export const QuestionRatingBar: React.FC<QuestionRatingBarProps> = ({
  value,
  onRate,
  onReportError,
  disabled,
  startInReport = false,
  size = 'md',
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [reporting, setReporting] = useState(startInReport && value !== 0);
  const [reasons, setReasons] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  // Câu được chấm sao ở nơi khác (vd. Đánh giá nhanh) → đóng form báo lỗi.
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    if (value !== undefined && value > 0) setReporting(false);
  }

  const starSize = size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';
  const shown = hovered ?? (value && value > 0 ? value : 0);
  const description = buildErrorDescription(reasons, note);

  if (disabled) {
    return (
      <p className="text-xs text-fb-text-3">
        Bạn là tác giả nên không tự đánh giá câu này.
      </p>
    );
  }

  const run = async (task: () => void | Promise<void>) => {
    setBusy(true);
    try {
      await task();
    } finally {
      setBusy(false);
    }
  };

  const submitReport = () =>
    run(async () => {
      try {
        await onReportError(description);
        setReporting(false);
      } catch {
        // Lỗi đã được báo (toast); giữ form để người dùng gửi lại.
      }
    });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div
          className="flex items-center gap-0.5"
          role="radiogroup"
          aria-label="Chấm chất lượng câu hỏi"
          onMouseLeave={() => setHovered(null)}
        >
          {[1, 2, 3, 4].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} sao · ${STAR_LABELS[star]}`}
              title={`${star} sao · ${STAR_LABELS[star]}`}
              disabled={busy}
              onMouseEnter={() => setHovered(star)}
              onClick={() =>
                run(async () => {
                  setReporting(false);
                  await onRate(star);
                })
              }
              className="p-0.5 transition hover:scale-110 disabled:opacity-50 cursor-pointer"
            >
              <Star
                className={`${starSize} transition-colors ${
                  star <= shown
                    ? 'fill-amber-400 text-fb-warning'
                    : 'text-fb-text-3'
                }`}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={busy}
          aria-pressed={value === 0 || reporting}
          onClick={() => setReporting((open) => !open)}
          aria-label="Báo câu lỗi (0 sao)"
          title="Báo câu lỗi (0 sao)"
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition cursor-pointer ${
            value === 0 || reporting
              ? 'border-fb-danger bg-fb-danger-soft text-fb-danger'
              : 'border-fb-divider text-fb-text-2 hover:border-fb-danger hover:text-fb-danger'
          }`}
        >
          <Flag
            className={`h-4 w-4 ${value === 0 ? 'fill-current' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {reporting && (
        <div className="space-y-2 rounded-lg border border-fb-danger/40 bg-fb-danger-soft/40 p-3">
          <div className="flex flex-wrap gap-1.5">
            {ERROR_REASONS.map((reason) => {
              const active = reasons.includes(reason);
              return (
                <button
                  key={reason}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setReasons((prev) =>
                      active
                        ? prev.filter((r) => r !== reason)
                        : [...prev, reason],
                    )
                  }
                  className={`rounded-full border px-2.5 py-1 text-xs transition cursor-pointer ${
                    active
                      ? 'border-fb-danger bg-fb-danger text-white'
                      : 'border-fb-divider bg-fb-card text-fb-text hover:border-fb-danger'
                  }`}
                >
                  {reason}
                </button>
              );
            })}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 450))}
            rows={2}
            placeholder="Ghi chú (không bắt buộc)"
            className="w-full rounded-lg border border-fb-divider bg-fb-card px-3 py-2 text-sm text-fb-text"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReporting(false)}
              className="h-8 rounded-md px-3 text-xs font-semibold text-fb-text hover:bg-fb-hover cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="button"
              disabled={!description || busy}
              onClick={() => void submitReport()}
              className="h-8 rounded-md bg-fb-danger px-3 text-xs font-bold text-white hover:bg-fb-danger/90 disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Đang gửi…' : 'Gửi'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
