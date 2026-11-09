import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
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
  /** Môn học của bộ câu hỏi = ngân hàng đề đích khi được chọn. */
  topic?: string;
}

export interface BankGroup {
  bank: string;
  items: BasketItem[];
}

const UNKNOWN_BANK = 'Môn chưa xác định';

/**
 * Nhóm câu trong giỏ theo ngân hàng đích. Swagger không cho chọn ngân hàng khi
 * duyệt: câu vào ngân hàng đề của môn mà sinh viên đã chọn khi đăng bộ.
 */
export function groupByBank(items: BasketItem[]): BankGroup[] {
  const groups = new Map<string, BasketItem[]>();
  items.forEach((item) => {
    const bank = item.topic || UNKNOWN_BANK;
    groups.set(bank, [...(groups.get(bank) ?? []), item]);
  });
  return Array.from(groups, ([bank, list]) => ({ bank, items: list }));
}

/** "3 câu vào ngân hàng đề Hệ điều hành, 2 câu vào Cấu trúc dữ liệu" */
export function describeBankGroups(groups: BankGroup[]): string {
  return groups
    .map(
      (g, i) =>
        `${g.items.length} câu vào ${i === 0 ? 'ngân hàng đề ' : ''}${g.bank}`,
    )
    .join(', ');
}

interface ReviewBasketBarProps {
  items: BasketItem[];
  busy: boolean;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onRemove: (questionId: number) => void;
  onClear: () => void;
}

/** Hộp xác nhận: liệt kê từng ngân hàng đích và số câu trước khi chọn. */
function ConfirmBanksModal({
  groups,
  busy,
  onCancel,
  onConfirm,
}: {
  groups: BankGroup[];
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const total = groups.reduce((sum, g) => sum + g.items.length, 0);
  return createPortal(
    <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-banks-title"
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-fb-divider bg-fb-card shadow-2xl"
      >
        <div className="border-b border-fb-divider bg-fb-input p-4">
          <h3
            id="confirm-banks-title"
            className="flex items-center gap-2 font-bold text-fb-text"
          >
            <Database className="h-5 w-5 text-fb-blue" />
            Chọn {total} câu vào ngân hàng đề
          </h3>
          <p className="mt-1 text-sm text-fb-text-2">
            Mỗi câu vào ngân hàng đề của môn mà sinh viên đã chọn khi đăng bộ
            câu hỏi.
          </p>
        </div>
        <ul className="flex-1 space-y-3 overflow-y-auto p-4">
          {groups.map((g) => (
            <li
              key={g.bank}
              className="rounded-lg border border-fb-divider p-3"
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-fb-text">
                <ArrowRight className="h-4 w-4 text-fb-success" />
                Ngân hàng đề {g.bank}
                <span className="ml-auto rounded-full bg-fb-success-soft px-2 py-0.5 text-xs text-fb-success">
                  {g.items.length} câu
                </span>
              </p>
              <ul className="mt-2 space-y-1 pl-6 text-xs text-fb-text-2">
                {g.items.map((item) => (
                  <li key={item.question_id} className="line-clamp-1">
                    {item.content}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2 border-t border-fb-divider p-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-fb-text-2 hover:bg-fb-hover disabled:opacity-50"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg bg-fb-success px-4 py-2 text-sm font-bold text-white hover:bg-fb-success/90 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" /> Xác nhận chọn
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Giỏ câu hỏi: gom câu từ nhiều bộ của nhiều sinh viên rồi chọn vào ngân hàng
 * đề trong một lần (POST /sessions/approve nhận question_ids không gắn với phiên).
 * Câu được nhóm theo ngân hàng đích để giảng viên biết câu sẽ vào đâu.
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
  const [confirming, setConfirming] = useState(false);
  if (items.length === 0) return null;

  const groups = groupByBank(items);

  return (
    <div className="sticky top-18 z-20 rounded-lg border border-fb-blue/40 bg-fb-card shadow-fb-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 text-xs">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 items-center gap-2 text-left font-semibold text-fb-text"
          aria-expanded={expanded}
        >
          <ShoppingBasket className="h-4 w-4 shrink-0 text-fb-blue" />
          <span>
            Giỏ câu hỏi: <b>{items.length}</b> câu
            <span className="ml-1 font-normal text-fb-text-2">
              {groups.map((g) => ` → ${g.bank}: ${g.items.length}`).join(' ·')}
            </span>
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0" />
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
            onClick={() => setConfirming(true)}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg bg-fb-success px-3.5 py-1.5 font-bold text-white hover:bg-fb-success/90 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Chọn {items.length} câu vào
            ngân hàng đề
          </button>
        </div>
      </div>

      {expanded && (
        <div className="max-h-72 overflow-y-auto border-t border-fb-divider">
          {groups.map((g) => (
            <section key={g.bank}>
              <h4 className="sticky top-0 flex items-center gap-1.5 bg-fb-input px-3 py-1.5 text-xs font-bold text-fb-text">
                <ArrowRight className="h-3.5 w-3.5 text-fb-success" />
                Ngân hàng đề {g.bank} · {g.items.length} câu
              </h4>
              <ul className="divide-y divide-fb-divider">
                {g.items.map((item) => (
                  <li
                    key={item.question_id}
                    className="flex items-start gap-3 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-fb-text [overflow-wrap:anywhere]">
                        {item.content}
                      </p>
                      <p className="mt-0.5 text-fb-text-3">
                        Từ bộ “{item.session_title}”
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
            </section>
          ))}
        </div>
      )}

      {confirming && (
        <ConfirmBanksModal
          groups={groups}
          busy={busy}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            onApproveAll();
          }}
        />
      )}
    </div>
  );
};
