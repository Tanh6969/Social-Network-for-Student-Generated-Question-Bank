import React, { useState, useEffect } from 'react';
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
  sessionsApi,
  SubjectResponse,
  UpdateSubmissionSessionRequest,
  MySubmissionDetail,
} from '../../../api';

interface EditSubmissionModalProps {
  sessionId: number | null;
  enrolledSubjects: SubjectResponse[];
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

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
  enrolledSubjects,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [subjectId, setSubjectId] = useState<number>(0);
  const [questions, setQuestions] = useState<EditQuestionItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    sessionsApi
      .getMySubmissionDetail(sessionId)
      .then((detail: MySubmissionDetail) => {
        setTitle(detail.title || '');
        setContent(detail.content || '');
        setSubjectId(detail.subject_id || (enrolledSubjects[0]?.subject_id ?? 0));

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
      })
      .catch((err) => {
        showToast(err?.message || 'Không thể tải chi tiết phiên cần sửa', 'error');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [sessionId, enrolledSubjects, showToast, onClose]);

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
    if (!subjectId) {
      showToast('Vui lòng chọn môn học hợp lệ', 'warning');
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
        subject_id: subjectId,
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
          llm_generated: q.llm_generated,
          confidence: q.confidence,
        })),
      };

      await sessionsApi.updateMySubmission(sessionId, payload);
      showToast('Cập nhật phiên đề xuất thành công!', 'success');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật phiên đề xuất';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-[#1E1F20]">
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
              Chỉnh sửa phiên đề xuất (ID: {sessionId})
            </h3>
            <p className="text-xs text-gray-500">
              Chỉ có thể chỉnh sửa khi phiên đang ở trạng thái Chờ duyệt (PENDING)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20 text-gray-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Đang tải dữ liệu để chỉnh sửa...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Top fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Tiêu đề phiên đề xuất *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Môn học *
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {enrolledSubjects.map((sub) => (
                      <option key={sub.subject_id} value={sub.subject_id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Mô tả / ghi chú nội dung
                  </label>
                  <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Mô tả tóm tắt nội dung câu hỏi..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    URL tài liệu tham khảo (source_url)
                  </label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Question list tabs */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    {questions.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                          idx === activeIdx
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        Câu {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu</span>
                  </button>
                </div>

                {/* Active Question Editor */}
                {currentQ && (
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-[#1E1F20] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                        Nội dung Câu hỏi {activeIdx + 1}
                      </span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(activeIdx)}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
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
                      className="w-full p-3 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#242526] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Options A, B, C, D */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400">
                        Đáp án lựa chọn (chọn nút tròn để đánh dấu đáp án đúng):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {currentQ.options.map((opt) => (
                          <div
                            key={opt.key}
                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition ${
                              opt.is_correct
                                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#242526]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSetCorrectOption(opt.key)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer ${
                                opt.is_correct
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                              }`}
                            >
                              {opt.key}
                            </button>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleUpdateOption(opt.key, e.target.value)}
                              placeholder={`Nội dung phương án ${opt.key}...`}
                              className="flex-1 bg-transparent text-xs sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-hidden"
                            />
                            {opt.is_correct && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                        Giải thích chi tiết đáp án
                      </label>
                      <textarea
                        rows={2}
                        value={currentQ.explanation}
                        onChange={(e) =>
                          handleUpdateQuestion({ explanation: e.target.value })
                        }
                        placeholder="Giải thích vì sao đáp án này đúng..."
                        className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#242526] text-gray-900 dark:text-gray-100 focus:outline-hidden"
                      />
                    </div>

                    {/* Additional attributes */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={currentQ.llm_generated}
                          onChange={(e) =>
                            handleUpdateQuestion({ llm_generated: e.target.checked })
                          }
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          Do AI/LLM hỗ trợ sinh
                        </span>
                      </label>

                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium">Độ tự tin:</span>
                        <select
                          value={currentQ.confidence}
                          onChange={(e) =>
                            handleUpdateQuestion({ confidence: Number(e.target.value) })
                          }
                          className="px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#242526] text-xs font-semibold"
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
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 bg-gray-50 dark:bg-[#1E1F20]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
