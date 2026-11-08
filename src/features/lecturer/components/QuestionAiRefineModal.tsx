import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, ShieldCheck, Sparkles, X } from 'lucide-react';
import { errorMessage, type QuestionOption } from '../../../api';
import { proposalGateway } from '../../proposals/proposalGateway';
import type { AiRefineResponse } from '../../proposals/types';

export interface RefinableQuestion {
  question_id: number;
  content: string;
  options: QuestionOption[];
  explanation?: string;
}

export interface RefinedContent {
  content: string;
  options: QuestionOption[];
  explanation: string;
}

interface QuestionAiRefineModalProps {
  question: RefinableQuestion;
  onClose: () => void;
  /** Gọi sau khi giảng viên áp dụng bản AI (ai-apply approve = true). */
  onApplied: (updated: RefinedContent) => void;
  showToast: (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error',
  ) => void;
}

const PRESET_PROMPTS = [
  'Làm rõ đề bài, sửa văn phong cho dễ hiểu và chặt chẽ',
  'Điều chỉnh các phương án nhiễu cho hợp lý và có tính phân loại',
  'Viết lại lời giải chi tiết, phân tích từng phương án',
  'Kiểm tra lại tính chính xác của đáp án đúng',
];

function OptionList({ options }: { options: QuestionOption[] }) {
  return (
    <ul className="space-y-1">
      {options.map((o) => (
        <li
          key={o.key}
          className={`rounded-md border px-2.5 py-1.5 text-sm [overflow-wrap:anywhere] ${
            o.is_correct
              ? 'border-fb-success/40 bg-fb-success-soft text-fb-success font-semibold'
              : 'border-fb-divider text-fb-text'
          }`}
        >
          <span className="mr-1 font-semibold">{o.key}.</span>
          {o.text}
        </li>
      ))}
    </ul>
  );
}

function QuestionColumn({
  title,
  content,
  options,
  explanation,
  highlight,
}: RefinedContent & { title: string; highlight?: boolean }) {
  return (
    <div
      className={`space-y-2 rounded-lg border p-3 ${
        highlight ? 'border-fb-blue/40 bg-fb-blue-soft/40' : 'border-fb-divider'
      }`}
    >
      <h4 className="text-xs font-bold uppercase text-fb-text-2">{title}</h4>
      <p className="whitespace-pre-wrap text-sm text-fb-text [overflow-wrap:anywhere]">
        {content}
      </p>
      <OptionList options={options} />
      <div>
        <span className="text-xs font-semibold text-fb-text-2">Lời giải</span>
        <p className="whitespace-pre-wrap text-sm text-fb-text [overflow-wrap:anywhere]">
          {explanation || '—'}
        </p>
      </div>
    </div>
  );
}

/**
 * Giảng viên nhờ AI tinh chỉnh một câu hỏi:
 * POST /questions/{id}/ai-refine (đề xuất + kiểm định ảo giác Btprop) →
 * POST /questions/{id}/ai-apply (áp dụng hoặc loại bỏ).
 */
export const QuestionAiRefineModal: React.FC<QuestionAiRefineModalProps> = ({
  question,
  onClose,
  onApplied,
  showToast,
}) => {
  const [prompt, setPrompt] = useState(PRESET_PROMPTS[0]);
  const [result, setResult] = useState<AiRefineResponse | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [isDeciding, setIsDeciding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestion = result?.suggested_question;
  const audit = result?.hallucination_audit;
  const refusal = suggestion?.refusal_reason;
  const canApply = Boolean(result?.edit_log_id && suggestion && !refusal);

  const requestRefine = async () => {
    if (!prompt.trim()) return;
    setIsRefining(true);
    setError(null);
    try {
      setResult(
        await proposalGateway.aiRefine(question.question_id, prompt.trim()),
      );
    } catch (err: unknown) {
      setError(errorMessage(err, 'AI chưa thể tinh chỉnh câu hỏi này.'));
    } finally {
      setIsRefining(false);
    }
  };

  const decide = async (approve: boolean) => {
    if (!result?.edit_log_id) return;
    setIsDeciding(true);
    try {
      await proposalGateway.aiApply(
        question.question_id,
        result.edit_log_id,
        approve,
      );
      if (approve && suggestion) {
        onApplied({
          content: suggestion.content ?? question.content,
          options: suggestion.options ?? question.options,
          explanation: suggestion.explanation ?? question.explanation ?? '',
        });
        showToast('Đã áp dụng bản tinh chỉnh của AI vào câu hỏi.', 'success');
        onClose();
      } else {
        showToast('Đã loại bỏ đề xuất của AI.', 'info');
        setResult(null);
      }
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Không thể xử lý đề xuất của AI.'), 'error');
    } finally {
      setIsDeciding(false);
    }
  };

  // Đóng khi còn đề xuất chưa quyết định: loại bỏ để không treo nhật ký chỉnh sửa.
  const close = () => {
    if (result?.edit_log_id && !isDeciding) {
      void proposalGateway
        .aiApply(question.question_id, result.edit_log_id, false)
        .catch(() => undefined);
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-fb-divider bg-fb-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-fb-divider bg-fb-input p-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-fb-text">
            <Sparkles className="h-5 w-5 text-fb-blue" />
            AI tinh chỉnh câu hỏi
          </h3>
          <button
            type="button"
            onClick={close}
            aria-label="Đóng"
            className="rounded-full p-1.5 text-fb-text-2 hover:bg-fb-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="space-y-2">
            <label
              htmlFor="ai-refine-prompt"
              className="text-sm font-semibold text-fb-text"
            >
              Yêu cầu cho AI
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROMPTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPrompt(preset)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    prompt === preset
                      ? 'border-fb-blue bg-fb-blue-soft text-fb-blue'
                      : 'border-fb-divider text-fb-text-2 hover:bg-fb-hover'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              id="ai-refine-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder="Ví dụ: viết lại đề cho ngắn gọn, thêm ví dụ minh họa trong lời giải…"
              className="w-full rounded-lg border border-fb-divider bg-fb-input px-3 py-2 text-sm text-fb-text"
            />
            <button
              type="button"
              onClick={() => void requestRefine()}
              disabled={isRefining || isDeciding || !prompt.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-fb-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-fb-blue-hover disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {isRefining
                ? 'AI đang phân tích…'
                : result
                  ? 'Gửi lại yêu cầu'
                  : 'Nhờ AI đề xuất'}
            </button>
            {error && <p className="text-sm text-fb-danger">{error}</p>}
          </div>

          {refusal && (
            <div className="flex items-start gap-2 rounded-lg border border-fb-warning/40 bg-fb-warning-soft p-3 text-sm text-fb-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>AI từ chối yêu cầu: {refusal}</span>
            </div>
          )}

          {suggestion && !refusal && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <QuestionColumn
                  title="Bản hiện tại"
                  content={question.content}
                  options={question.options}
                  explanation={question.explanation ?? ''}
                />
                <QuestionColumn
                  title="Bản AI đề xuất"
                  content={suggestion.content ?? ''}
                  options={suggestion.options ?? []}
                  explanation={suggestion.explanation ?? ''}
                  highlight
                />
              </div>

              {audit && (
                <div
                  className={`space-y-1.5 rounded-lg border p-3 text-sm ${
                    audit.is_hallucinated
                      ? 'border-fb-danger/40 bg-fb-danger-soft text-fb-danger'
                      : 'border-fb-success/40 bg-fb-success-soft text-fb-success'
                  }`}
                >
                  <p className="flex items-center gap-2 font-semibold">
                    {audit.is_hallucinated ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    {audit.is_hallucinated
                      ? 'Kiểm định phát hiện nguy cơ ảo giác — hãy đọc kỹ trước khi áp dụng'
                      : 'Kiểm định ảo giác: không phát hiện vấn đề'}
                    {audit.confidence_score !== undefined &&
                      ` · độ tin cậy ${Math.round(audit.confidence_score * 100)}%`}
                  </p>
                  {audit.violations?.map((v, i) => (
                    <p key={i} className="text-xs">
                      [{v.severity ?? '—'}] {v.detail ?? v.type}
                      {v.node_statement ? ` — ${v.node_statement}` : ''}
                    </p>
                  ))}
                </div>
              )}

              {result?.ai_metadata?.model && (
                <p className="text-xs text-fb-text-3">
                  Mô hình: {result.ai_metadata.model}
                  {result.ai_metadata.tokens_used
                    ? ` · ${result.ai_metadata.tokens_used} tokens`
                    : ''}
                  {result.ai_metadata.processing_time_ms
                    ? ` · ${(result.ai_metadata.processing_time_ms / 1000).toFixed(1)} giây`
                    : ''}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-fb-divider p-3">
          {result?.edit_log_id ? (
            <>
              <button
                type="button"
                onClick={() => void decide(false)}
                disabled={isDeciding}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-fb-text-2 hover:bg-fb-hover disabled:opacity-50"
              >
                Loại bỏ đề xuất
              </button>
              <button
                type="button"
                onClick={() => void decide(true)}
                disabled={isDeciding || !canApply}
                className="inline-flex items-center gap-2 rounded-lg bg-fb-blue px-4 py-2 text-sm font-semibold text-white hover:bg-fb-blue-hover disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Áp dụng bản AI
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-fb-text-2 hover:bg-fb-hover"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
