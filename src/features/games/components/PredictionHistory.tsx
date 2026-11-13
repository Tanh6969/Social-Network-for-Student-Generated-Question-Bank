import React from 'react';
import { CheckCircle2, Clock, History, XCircle } from 'lucide-react';
import type { GamePredictionResponse } from '../../../api/games';
import { describeData, GAME_LABELS } from '../gameLabels';
import { SkeletonRows } from '../../../shared/components/Skeleton';

/** Lịch sử các lượt dự đoán (GET /games/my-predictions). */
export const PredictionHistory: React.FC<{
  predictions: GamePredictionResponse[] | null;
  error: string | null;
}> = ({ predictions, error }) => (
  <div className="space-y-3">
    <h2 className="flex items-center gap-2 font-bold text-fb-text">
      <History className="h-5 w-5 text-fb-blue" /> Lịch sử dự đoán
    </h2>
    {error && <p className="text-sm text-fb-danger">{error}</p>}
    {!predictions && !error && (
      <SkeletonRows count={3} avatar="square" label="Đang tải lịch sử dự đoán…" />
    )}
    {predictions?.length === 0 && (
      <p className="rounded-lg bg-fb-card p-8 text-center text-sm text-fb-text-2 shadow-fb-card">
        Bạn chưa tham gia trò chơi nào.
      </p>
    )}
    {predictions?.map((p) => {
      const resolved = p.status === 'RESOLVED';
      return (
        <article
          key={p.prediction_id}
          className="space-y-1.5 rounded-lg bg-fb-card p-4 shadow-fb-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-fb-text">
              {p.game_type ? GAME_LABELS[p.game_type] : 'Trò chơi'}
            </span>
            {!resolved ? (
              <span className="flex items-center gap-1 rounded-full bg-fb-warning-soft px-2.5 py-0.5 text-xs font-semibold text-fb-warning">
                <Clock className="h-3.5 w-3.5" /> Chờ tổng kết
              </span>
            ) : p.is_correct ? (
              <span className="flex items-center gap-1 rounded-full bg-fb-success-soft px-2.5 py-0.5 text-xs font-semibold text-fb-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Chính xác
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-fb-danger-soft px-2.5 py-0.5 text-xs font-semibold text-fb-danger">
                <XCircle className="h-3.5 w-3.5" /> Chưa chính xác
              </span>
            )}
          </div>
          <p className="text-sm text-fb-text">
            {describeData(p.prediction_data)}
          </p>
          {resolved && p.actual_data && (
            <p className="text-sm text-fb-text-2">
              Kết quả: {describeData(p.actual_data)}
            </p>
          )}
          <p className="text-xs text-fb-text-3">
            {p.created_at &&
              `Đặt lúc ${new Date(p.created_at).toLocaleString('vi-VN')}`}
            {p.resolved_at &&
              ` · Tổng kết ${new Date(p.resolved_at).toLocaleString('vi-VN')}`}
          </p>
        </article>
      );
    })}
  </div>
);
