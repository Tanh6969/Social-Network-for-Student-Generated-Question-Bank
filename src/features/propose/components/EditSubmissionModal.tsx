import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  HelpCircle,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  errorMessage,
  CourseClassOption,
  UpdateSubmissionSessionRequest,
  MySubmissionDetail,
} from '../../../api';
import { proposalGateway } from '../../proposals/proposalGateway';

interface EditSubmissionModalProps {
  sessionId: number | null;
  /** Lớp học phần được phép đề xuất (can_propose). */
  courseClasses: CourseClassOption[];
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

/** Ô nhập tự cao theo nội dung, kể cả khi đổi giá trị hoặc đổi chiều rộng. */
const AutoGrowTextarea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = (props) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const fitContent = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useLayoutEffect(fitContent, [props.value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lastWidth = el.offsetWidth;
    const observer = new ResizeObserver(() => {
      if (el.offsetWidth === lastWidth) return;
      lastWidth = el.offsetWidth;
      fitContent();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <textarea ref={ref} {...props} />;
};

interface EditQuestionItem {
  question_id?: number;
  content: string;
  image_urls: string[];
  options: {
    key: string;
    text: string;
    is_correct: boolean;
    media_url?: string;
  }[];
  explanation: string;
  llm_generated: boolean;
  confidence: number;
}

export const EditSubmissionModal: React.FC<EditSubmissionModalProps> = ({
  sessionId,
  ...props
}) => {
  if (!sessionId) return null;
  return <EditSubmissionContent key={sessionId} sessionId={sessionId} {...props} />;
};

const EditSubmissionContent: React.FC<Omit<EditSubmissionModalProps, 'sessionId'> & { sessionId: number }> = ({
  sessionId,
  courseClasses,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [courseClassId, setCourseClassId] = useState<number>(0);
  const [questions, setQuestions] = useState<EditQuestionItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);

    const applyDetail = (detail: MySubmissionDetail) => {
      setTitle(detail.title || '');
      setContent(detail.content || '');
      setSourceUrl((detail as { source_url?: string }).source_url || '');
      setCourseClassId(
        detail.course_class_id || (courseClasses[0]?.course_class_id ?? 0),
      );

      if (detail.questions && detail.questions.length > 0) {
        const mapped: EditQuestionItem[] = detail.questions.map((q) => ({
          question_id: q.question_id,
          content: q.content || '',
          image_urls: q.image_urls || [],
          options: (q.options || []).map((opt) => ({
            key: opt.key || 'A',
            text: opt.text || '',
            is_correct: Boolean(opt.is_correct),
            media_url: opt.media_url,
          })),
          explanation: q.explanation || '',
          llm_generated: Boolean(q.source && q.source !== 'HOMO_SAPIENS'),
          confidence: q.confidence_score ?? 3.5,
        }));
        setQuestions(mapped);
      } else {
        setQuestions([
          {
            content: '',
            image_urls: [],
            options: [
              { key: 'A', text: '', is_correct: true },
              { key: 'B', text: '', is_correct: false },
              { key: 'C', text: '', is_correct: false },
              { key: 'D', text: '', is_correct: false },
            ],
            explanation: '',
            llm_generated: false,
            confidence: 3.5,
          },
        ]);
      }
    };

    proposalGateway
      .getMySubmissionDetail(sessionId)
      .then((detail: MySubmissionDetail) => {
        applyDetail(detail);
      })
      .catch((err: unknown) => {
        showToast(errorMessage(err, 'Không tải được dữ liệu phiên cần sửa'), 'error');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [sessionId, courseClasses]);

  if (!sessionId) return null;

  const currentQ = questions[activeIdx] || questions[0];

  const handleUpdateQuestion = (updates: Partial<EditQuestionItem>) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === activeIdx ? { ...q, ...updates } : q))
    );
  };

  const handleUpdateOption = (optKey: string, text: string) => {
    if (!currentQ) return;
    const updatedOptions = currentQ.options.map((opt) =>
      opt.key === optKey ? { ...opt, text } : opt
    );
    handleUpdateQuestion({ options: updatedOptions });
  };

  const handleSetCorrectOption = (optKey: string) => {
    if (!currentQ) return;
    const updatedOptions = currentQ.options.map((opt) => ({
      ...opt,
      is_correct: opt.key === optKey,
    }));
    handleUpdateQuestion({ options: updatedOptions });
  };

  const handleAddQuestion = () => {
    const newQ: EditQuestionItem = {
      content: '',
      image_urls: [],
      options: [
        { key: 'A', text: '', is_correct: true },
        { key: 'B', text: '', is_correct: false },
        { key: 'C', text: '', is_correct: false },
        { key: 'D', text: '', is_correct: false },
      ],
      explanation: '',
      llm_generated: false,
      confidence: 3.5,
    };
    setQuestions([...questions, newQ]);
    setActiveIdx(questions.length);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      showToast('Phiên đề xuất cần tối thiểu 1 câu hỏi', 'warning');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
    setActiveIdx(Math.max(0, activeIdx - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Vui lòng nhập tiêu đề cho phiên đề xuất', 'warning');
      return;
    }
    if (!courseClassId) {
      showToast('Vui lòng chọn lớp học phần hợp lệ', 'warning');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) {
        showToast(`Vui lòng nhập nội dung cho câu hỏi ${i + 1}`, 'warning');
        return;
      }
      const hasCorrect = q.options.some((opt) => opt.is_correct);
      if (!hasCorrect) {
        showToast(`Câu hỏi ${i + 1} chưa chọn đáp án đúng`, 'warning');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: UpdateSubmissionSessionRequest = {
        title: title.trim(),
        content: content.trim(),
        source_url: sourceUrl.trim() || undefined,
        course_class_id: courseClassId,
        questions: questions.map((q) => ({
          question_id: q.question_id,
          content: q.content,
          media_urls: q.image_urls,
          options: q.options.map((opt) => ({
            key: opt.key,
            text: opt.text,
            is_correct: opt.is_correct,
            media_url: opt.media_url,
          })),
          explanation: q.explanation,
          source: (q.llm_generated ? 'LLM' : 'HOMO_SAPIENS') as 'LLM' | 'HOMO_SAPIENS',
          confidence: q.confidence,
        })),
      };

      // Backend từ chối (ví dụ phiên đã chuyển sang REVIEWING) → rơi xuống catch.
      await proposalGateway.updateMySubmission(sessionId, payload);

      showToast('Cập nhật phiên đề xuất thành công!', 'success');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Lỗi cập nhật phiên đề xuất'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200">
      <div className="bg-fb-card rounded-lg shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-fb-divider">
        {/* Header */}
        <div className="p-4 border-b border-fb-divider flex items-center justify-between bg-fb-input">
          <div>
            <h3 className="text-xl font-bold text-fb-text">
              Chỉnh sửa phiên đề xuất
            </h3>
            <p className="text-sm text-fb-text-2">
              Chỉ có thể chỉnh sửa khi bộ câu hỏi đang chờ giảng viên xem xét
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-fb-btn-hover text-fb-text-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20 text-fb-text-2">
            <div className="w-8 h-8 border-3 border-fb-blue border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-body">Đang tải dữ liệu để chỉnh sửa...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Top fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body font-semibold text-fb-text mb-1">
                    Tiêu đề phiên đề xuất *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-body rounded-lg border border-fb-divider bg-fb-card text-fb-text focus:outline-hidden focus:ring-2 focus:ring-fb-blue"
                  />
                </div>

                <div>
                  <label className="block text-body font-semibold text-fb-text mb-1">
                    Lớp học phần *
                  </label>
                  <select
                    value={courseClassId}
                    onChange={(e) => setCourseClassId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-body rounded-lg border border-fb-divider bg-fb-card text-fb-text focus:outline-hidden focus:ring-2 focus:ring-fb-blue"
                  >
                    {courseClassId > 0 &&
                      !courseClasses.some((c) => c.course_class_id === courseClassId) && (
                        // Lớp cũ của phiên (ví dụ học kỳ trước) vẫn hiển thị để không đổi ngầm.
                        <option value={courseClassId}>Lớp hiện tại của phiên</option>
                      )}
                    {courseClasses.map((c) => (
                      <option key={c.course_class_id} value={c.course_class_id}>
                        {c.subject_name} ({c.subject_code}) · Lớp {c.class_code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body font-semibold text-fb-text mb-1">
                    Mô tả / ghi chú nội dung
                  </label>
                  <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Mô tả tóm tắt nội dung câu hỏi..."
                    className="w-full px-3 py-2 text-body rounded-lg border border-fb-divider bg-fb-card text-fb-text focus:outline-hidden focus:ring-2 focus:ring-fb-blue"
                  />
                </div>

                <div>
                  <label className="block text-body font-semibold text-fb-text mb-1">
                    URL tài liệu tham khảo (source_url)
                  </label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-body rounded-lg border border-fb-divider bg-fb-card text-fb-text focus:outline-hidden focus:ring-2 focus:ring-fb-blue"
                  />
                </div>
              </div>

              {/* Question list tabs */}
              <div className="pt-2 border-t border-fb-divider">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    {questions.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                          idx === activeIdx
                            ? 'bg-fb-blue text-white'
                            : 'bg-fb-input text-fb-text hover:bg-fb-btn-hover'
                        }`}
                      >
                        Câu {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-2.5 py-1.5 text-sm font-semibold rounded-lg bg-fb-success-soft text-fb-success border border-fb-success/30 hover:bg-fb-success/20 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu</span>
                  </button>
                </div>

                {/* Active Question Editor */}
                {currentQ && (
                  <div className="p-4 rounded-lg border border-fb-divider bg-fb-inset/70 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-card-title font-semibold text-fb-text">
                        Nội dung Câu hỏi {activeIdx + 1}
                      </span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(activeIdx)}
                          className="text-sm text-fb-danger hover:text-fb-danger flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa câu hỏi này</span>
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={3}
                      value={currentQ.content}
                      onChange={(e) => handleUpdateQuestion({ content: e.target.value })}
                      placeholder="Nhập nội dung đề bài câu hỏi trắc nghiệm..."
                      className="w-full p-3 text-body rounded-lg border border-fb-divider bg-fb-card text-fb-text focus:outline-hidden focus:ring-2 focus:ring-fb-blue"
                    />

                    {/* Options A, B, C, D */}
                    <div className="space-y-2">
                      <label className="block text-body font-semibold text-fb-text-2">
                        Đáp án lựa chọn (bấm nút tròn để đánh dấu đáp án đúng, tự động xuống dòng khi nhập dài):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentQ.options.map((opt) => (
                          <div
                            key={opt.key}
                            className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition ${
                              opt.is_correct
                                ? 'border-fb-success bg-fb-success-soft/60'
                                : 'border-fb-divider bg-fb-card'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSetCorrectOption(opt.key)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 cursor-pointer mt-0.5 transition ${
                                opt.is_correct
                                  ? 'bg-fb-success text-white shadow-xs scale-105'
                                  : 'bg-fb-btn text-fb-text hover:bg-fb-btn-hover'
                              }`}
                              title={opt.is_correct ? 'Đáp án đúng' : 'Bấm để đặt làm đáp án đúng'}
                            >
                              {opt.key}
                            </button>
                            <AutoGrowTextarea
                              rows={2}
                              value={opt.text}
                              onChange={(e) => handleUpdateOption(opt.key, e.target.value)}
                              placeholder={`Nội dung phương án ${opt.key}...`}
                              className="flex-1 min-w-0 bg-transparent text-body text-fb-text focus:outline-hidden resize-none overflow-hidden min-h-[44px] break-words leading-relaxed"
                            />
                            {opt.is_correct && (
                              <CheckCircle2 className="w-4 h-4 text-fb-success shrink-0 mt-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="block text-body font-semibold text-fb-text-2 mb-1">
                        Giải thích chi tiết đáp án
                      </label>
                      <textarea
                        rows={2}
                        value={currentQ.explanation}
                        onChange={(e) =>
                          handleUpdateQuestion({ explanation: e.target.value })
                        }
                        placeholder="Giải thích vì sao đáp án này đúng..."
                        className="w-full p-2.5 text-body rounded-lg border border-fb-divider bg-fb-card text-fb-text focus:outline-hidden"
                      />
                    </div>

                    {/* Additional attributes */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={currentQ.llm_generated}
                          onChange={(e) =>
                            handleUpdateQuestion({ llm_generated: e.target.checked })
                          }
                          className="w-4 h-4 text-fb-blue rounded"
                        />
                        <span className="text-fb-text font-medium">
                          Do AI/LLM hỗ trợ sinh
                        </span>
                      </label>

                      <div className="flex items-center gap-2">
                        <span className="text-fb-text-2 font-medium">Độ tự tin:</span>
                        <select
                          value={currentQ.confidence}
                          onChange={(e) =>
                            handleUpdateQuestion({ confidence: Number(e.target.value) })
                          }
                          className="px-2 py-1 rounded-lg border border-fb-divider bg-fb-card text-sm font-semibold"
                        >
                          <option value={4}>4.0 - Câu hỏi hay</option>
                          <option value={3.5}>3.5 - Cơ bản / Tốt</option>
                          <option value={2}>2.0 - Chưa nắm vững</option>
                          <option value={1}>1.0 - Cần kiểm tra</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-fb-divider flex justify-end gap-2 bg-fb-input">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-body font-semibold rounded-lg bg-fb-btn text-fb-text hover:bg-fb-btn-hover transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-body font-semibold rounded-lg bg-fb-blue text-white hover:bg-fb-blue-hover transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-fb-card border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
