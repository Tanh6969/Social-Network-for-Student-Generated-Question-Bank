import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShoppingBasket,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';

/** Một câu hỏi giảng viên đã tích chọn (có thể đến từ nhiều bộ câu hỏi khác nhau). */
export interface BasketItem {
  question_id: number;
  content: string;
  session_id: number;
  session_title: string;
  topic?: string;
}

interface ReviewBasketBarProps {
  items: BasketItem[];
  busy: boolean;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onRemove: (questionId: number) => void;
  onClear: () => void;
}

/**
 * Giỏ câu hỏi: gom câu từ nhiều bộ của nhiều sinh viên rồi chọn vào ngân hàng
 * đề trong một lần (POST /sessions/approve nhận question_ids không gắn với phiên).
 */
export const ReviewBasketBar: React.FC<ReviewBasketBarProps> = ({
  items,
  busy,
  onApproveAll,
  onRejectAll,
  onRemove,
  onClear,
}) => {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;

  const sessionCount = new Set(items.map((i) => i.session_id)).size;
  const subjects = Array.from(
    new Set(items.map((i) => i.topic).filter(Boolean)),
  );

  return (
    <div className="sticky top-18 z-20 rounded-lg border border-fb-blue/40 bg-fb-card shadow-fb-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 text-xs">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 font-semibold text-fb-text"
          aria-expanded={expanded}
        >
          <ShoppingBasket className="h-4 w-4 text-fb-blue" />
          <span>
            Giỏ câu hỏi: <b>{items.length}</b> câu từ <b>{sessionCount}</b> bộ
            {subjects.length > 0 && ` · ${subjects.join(', ')}`}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold text-fb-text-2 hover:bg-fb-hover disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Xoá giỏ
          </button>
          <button
            type="button"
            onClick={onRejectAll}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg border border-fb-danger/30 bg-fb-danger-soft px-3 py-1.5 font-semibold text-fb-danger hover:bg-fb-danger/20 disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" /> Không chọn ({items.length})
          </button>
          <button
            type="button"
            onClick={onApproveAll}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg bg-fb-success px-3.5 py-1.5 font-bold text-white hover:bg-fb-success/90 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Chọn {items.length} câu vào
            ngân hàng đề
          </button>
        </div>
      </div>
      {expanded && (
        <ul className="max-h-64 divide-y divide-fb-divider overflow-y-auto border-t border-fb-divider">
          {items.map((item) => (
            <li
              key={item.question_id}
              className="flex items-start gap-3 px-3 py-2 text-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-fb-text [overflow-wrap:anywhere]">
                  {item.content}
                </p>
                <p className="mt-0.5 text-fb-text-3">
                  {item.session_title}
                  {item.topic ? ` · ${item.topic}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.question_id)}
                disabled={busy}
                aria-label="Bỏ khỏi giỏ"
                className="rounded-full p-1 text-fb-text-2 hover:bg-fb-hover disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
