import React, { useState, useEffect } from 'react';
import { X, Edit3, HelpCircle, CheckCircle2 } from 'lucide-react';
import { SessionQuestionReviewDto, EditQuestionRequest, EditQuestionResponse, reviewApi } from '../../../api';

interface EditQuestionModalProps {
  question: any;
  sessionId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedQuestion: EditQuestionResponse, newContent: { content: string; options: any[]; explanation: string }) => void;
  showToast?: (message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  question,
  isOpen,
  onClose,
  onSaved,
  showToast,
}) => {
  const [content, setContent] = useState('');
  const [options, setOptions] = useState<{ key: string; text: string; is_correct: boolean }[]>([
    { key: 'A', text: '', is_correct: false },
    { key: 'B', text: '', is_correct: false },
    { key: 'C', text: '', is_correct: false },
    { key: 'D', text: '', is_correct: false },
  ]);
  const [explanation, setExplanation] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (question) {
      setContent(question.content || '');
      setExplanation(question.explanation || '');
      setAutoApprove(false);
      setValidationError(null);

      // Populate options from question
      if (question.options && question.options.length > 0) {
        setOptions(
          question.options.map((opt: any, idx: number) => {
            const key = opt.key || opt.id || String.fromCharCode(65 + idx);
            const isCorrect =
              opt.is_correct ?? (question.correct_answer === key || question.correctAnswer === key);
            return {
              key,
              text: opt.text || '',
              is_correct: !!isCorrect,
            };
          }),
        );
      } else {
        const correctKey = question.correct_answer || question.correctAnswer || 'A';
        setOptions([
          { key: 'A', text: '', is_correct: correctKey === 'A' },
          { key: 'B', text: '', is_correct: correctKey === 'B' },
          { key: 'C', text: '', is_correct: correctKey === 'C' },
          { key: 'D', text: '', is_correct: correctKey === 'D' },
        ]);
      }
    }
  }, [question, isOpen]);

  if (!isOpen || !question) return null;

  const handleOptionTextChange = (key: string, text: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.key === key ? { ...opt, text } : opt)),
    );
  };

  const handleSelectCorrect = (key: string) => {
    setOptions((prev) =>
      prev.map((opt) => ({
        ...opt,
        is_correct: opt.key === key,
      })),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!content.trim()) {
      setValidationError('Nội dung câu hỏi không được để trống.');
      return;
    }

    const emptyOpt = options.find((o) => !o.text.trim());
    if (emptyOpt) {
      setValidationError(`Phương án ${emptyOpt.key} chưa có nội dung.`);
      return;
    }

    const hasCorrect = options.some((o) => o.is_correct);
    if (!hasCorrect) {
      setValidationError('Vui lòng chọn 1 phương án làm đáp án đúng.');
      return;
    }

    const qId =
      question.question_id ??
      (typeof question.id === 'number' ? question.id : parseInt(question.id, 10));

    if (!qId || isNaN(qId)) {
      setValidationError('Không tìm thấy ID hợp lệ của câu hỏi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: EditQuestionRequest = {
        content: content.trim(),
        options: options.map((opt) => ({
          key: opt.key,
          text: opt.text.trim(),
          is_correct: opt.is_correct,
        })),
        explanation: explanation.trim() || undefined,
        auto_approve: autoApprove,
      };

      const res = await reviewApi.editQuestion(qId, payload);
      showToast?.('Đã lưu chỉnh sửa câu hỏi thành công', 'success');
      onSaved?.(res, {
        content: payload.content || '',
        options: payload.options || [],
        explanation: payload.explanation || '',
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu chỉnh sửa câu hỏi.';
      setValidationError(msg);
      showToast?.(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-150">
      <div className="bg-fb-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-fb-divider overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-fb-divider flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
              <Edit3 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-fb-text">
                Chỉnh sửa câu hỏi (ID: {question.question_id})
              </h3>
              <p className="text-xs text-fb-text-2">
                Biên tập lại nội dung, phương án và giải thích chi tiết
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {validationError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-medium">
              {validationError}
            </div>
          )}

          {/* Question Content */}
          <div>
            <label className="block text-xs font-bold text-fb-text mb-1.5">
              Nội dung câu hỏi <span className="text-red-500">*</span>:
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung câu hỏi..."
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-fb-card text-sm text-fb-text focus:border-blue-500 focus:outline-hidden resize-y break-words"
            />
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-fb-text">
              Các phương án đáp án (Tích chọn đáp án đúng) <span className="text-red-500">*</span>:
            </label>

            {options.map((opt) => (
              <div
                key={opt.key}
                className={`p-3 rounded-lg border transition flex items-start gap-3 ${
                  opt.is_correct
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-2xs'
                    : 'border-fb-divider bg-fb-input'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectCorrect(opt.key)}
                  className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-1 cursor-pointer transition ${
                    opt.is_correct
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'border border-gray-300 dark:border-gray-600 bg-fb-card text-fb-text hover:border-emerald-400'
                  }`}
                  title={opt.is_correct ? 'Đáp án đúng' : 'Bấm để chọn làm đáp án đúng'}
                >
                  {opt.key}
                </button>

                <div className="flex-1 min-w-0">
                  <textarea
                    rows={2}
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(opt.key, e.target.value)}
                    placeholder={`Nội dung đáp án ${opt.key}...`}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-fb-card text-xs text-fb-text focus:border-blue-500 focus:outline-hidden resize-y min-h-[42px] break-words leading-relaxed"
                  />
                </div>

                {opt.is_correct && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0 mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đúng</span>
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <label className="text-xs font-bold text-fb-text">
                Lời giải thích chi tiết:
              </label>
            </div>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Giải thích vì sao đáp án này đúng để hỗ trợ sinh viên khi ôn tập..."
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-fb-card text-xs text-fb-text focus:border-blue-500 focus:outline-hidden resize-y break-words"
            />
          </div>

          {/* Auto Approve Checkbox */}
          <div className="p-3.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="auto-approve-checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="auto-approve-checkbox"
              className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed cursor-pointer select-none"
            >
              <span className="font-bold block">Tự động phê duyệt vào ngân hàng đề (auto_approve)</span>
              <span>
                Nếu tích chọn, câu hỏi sẽ được phê duyệt ngay sau khi lưu thay vì giữ ở trạng thái chờ duyệt.
              </span>
            </label>
          </div>

          {/* Footer inside form */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-fb-divider">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold text-fb-text hover:bg-fb-hover transition cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-fb-blue hover:bg-fb-blue-hover text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>Lưu chỉnh sửa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
