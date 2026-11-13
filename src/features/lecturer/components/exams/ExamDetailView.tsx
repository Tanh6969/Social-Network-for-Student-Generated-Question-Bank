import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  BookOpen,
  Eye,
  EyeOff,
  AlertCircle,
  FileCode,
  Tag,
  HelpCircle,
} from 'lucide-react';
import { examsApi, ExamDetailResponse } from '../../../../api';
import { ExamExportModal } from './ExamExportModal';
import { QuestionListSkeleton } from '../../../../shared/components/Skeleton';

interface ExamDetailViewProps {
  examId: number;
  initialData?: ExamDetailResponse | null;
  onBack: () => void;
  showToast: (message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ExamDetailView: React.FC<ExamDetailViewProps> = ({
  examId,
  initialData,
  onBack,
  showToast,
}) => {
  const [exam, setExam] = useState<ExamDetailResponse | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Toggle answer display for lecturer
  const [showAnswers, setShowAnswers] = useState<boolean>(false);

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await examsApi.getExamDetail(examId);
        if (isMounted) {
          setExam(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Không thể tải chi tiết đề thi.';
          setError(msg);
          showToast(msg, 'error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [examId, showToast]);

  return (
    <div className="space-y-4">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-fb-card rounded-lg shadow-fb-card p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-fb-hover text-fb-text-2 transition cursor-pointer"
            title="Quay lại danh sách đề thi"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-fb-blue">
                Chi tiết đề thi
              </span>
              {exam?.exam_id && (
                <span className="text-xs tabular-nums text-fb-text-3 bg-fb-input px-2 py-0.5 rounded-md">
                  Mã đề: #{exam.exam_id}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-fb-text leading-tight">
              {exam?.title || `Đề thi #${examId}`}
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowAnswers(!showAnswers)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
              showAnswers
                ? 'bg-fb-blue-soft text-fb-blue border-fb-blue/30'
                : 'bg-fb-card text-fb-text border-fb-divider hover:bg-fb-hover'
            }`}
          >
            {showAnswers ? (
              <>
                <EyeOff className="w-4 h-4 text-fb-blue" />
                <span>Ẩn đáp án đúng</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>Hiện đáp án đúng</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-fb-blue hover:bg-fb-blue-hover text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất file (PDF / Excel)</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <QuestionListSkeleton count={3} label="Đang tải chi tiết đề thi…" />
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 rounded-lg bg-fb-danger-soft border border-fb-danger/30 text-fb-danger text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-lg bg-fb-danger text-white text-xs font-semibold hover:bg-fb-danger/90"
          >
            Quay lại
          </button>
        </div>
      )}

      {/* Content Area */}
      {!loading && !error && exam && (
        <div className="space-y-4">
          {/* Metadata & Difficulty Matrix Summary Card */}
          <div className="bg-fb-card rounded-lg shadow-fb-card p-5 space-y-4 text-xs">
            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-4 text-fb-text-2">
              {exam.subject_name && (
                <div className="flex items-center gap-1.5 font-semibold">
                  <BookOpen className="w-4 h-4 text-fb-blue" />
                  <span>Môn học: <strong className="text-fb-text">{exam.subject_name}</strong></span>
                </div>
              )}
              {exam.question_count !== undefined && (
                <div className="flex items-center gap-1.5 font-semibold">
                  <Layers className="w-4 h-4 text-fb-blue" />
                  <span>Tổng số câu hỏi: <strong className="text-fb-text">{exam.question_count} câu</strong></span>
                </div>
              )}
              {exam.created_at && (
                <div className="flex items-center gap-1.5 text-fb-text-2">
                  <Calendar className="w-4 h-4 text-fb-text-3" />
                  <span>Tạo lúc: {new Date(exam.created_at).toLocaleString('vi-VN')}</span>
                </div>
              )}
            </div>

            {/* Difficulty Matrix Statistic */}
            {exam.statistic && (
              <div className="pt-3 border-t border-fb-divider">
                <span className="font-bold text-fb-text-2 block mb-2 text-xs">
                  Phân bố ma trận độ khó:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-fb-success-soft/70 border border-fb-success/30">
                    <span className="text-xs font-semibold text-fb-success block">
                      Dễ
                    </span>
                    <strong className="text-base text-fb-success">
                      {exam.statistic.easy_count ?? 0} câu
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-fb-warning-soft/70 border border-fb-warning/30">
                    <span className="text-xs font-semibold text-fb-warning block">
                      Trung bình
                    </span>
                    <strong className="text-base text-fb-warning">
                      {exam.statistic.medium_count ?? 0} câu
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-fb-danger-soft/70 border border-fb-danger/30">
                    <span className="text-xs font-semibold text-fb-danger block">
                      Khó
                    </span>
                    <strong className="text-base text-fb-danger">
                      {exam.statistic.hard_count ?? 0} câu
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-fb-input border border-fb-divider">
                    <span className="text-xs font-semibold text-fb-text-2 block">
                      Chưa phân loại
                    </span>
                    <strong className="text-base text-fb-text">
                      {exam.statistic.unclassified_count ?? 0} câu
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Question List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-fb-text-2 px-1">
              <span className="font-bold text-fb-text">
                Danh sách câu hỏi trong đề ({exam.questions?.length || 0} câu)
              </span>
              <span>Theo đúng thứ tự trích xuất từ đề thi</span>
            </div>

            {(!exam.questions || exam.questions.length === 0) ? (
              <div className="bg-fb-card rounded-lg border border-fb-divider p-12 text-center text-xs text-fb-text-2">
                Chưa có câu hỏi nào trong đề thi này.
              </div>
            ) : (
              <div className="space-y-4">
                {exam.questions.map((q, idx) => {
                  const orderNumber = q.order !== undefined ? q.order : idx + 1;

                  return (
                    <div
                      key={q.question_id || idx}
                      className="bg-fb-card rounded-lg shadow-fb-card p-5 space-y-4 transition"
                    >
                      {/* Header of Question */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-lg bg-fb-blue-soft text-fb-blue text-xs font-bold">
                            Câu {orderNumber}
                          </span>
                          {q.question_id && (
                            <span className="text-xs text-fb-text-3 tabular-nums">
                              ID: #{q.question_id}
                            </span>
                          )}
                        </div>

                        {/* Badges for Topic & Difficulty */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          {q.topic && (
                            <span className="px-2.5 py-0.5 rounded-full bg-fb-blue-soft text-fb-blue font-semibold border border-fb-blue/30 text-xs flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              <span>{q.topic}</span>
                            </span>
                          )}
                          {q.difficulty && (
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold border text-xs ${
                                q.difficulty === 'EASY'
                                  ? 'bg-fb-success-soft text-fb-success border-fb-success/30'
                                  : q.difficulty === 'MEDIUM'
                                  ? 'bg-fb-warning-soft text-fb-warning border-fb-warning/30'
                                  : q.difficulty === 'HARD'
                                  ? 'bg-fb-danger-soft text-fb-danger border-fb-danger/30'
                                  : 'bg-fb-input text-fb-text-2 border-fb-divider'
                              }`}
                            >
                              {q.difficulty === 'EASY'
                                ? 'Dễ'
                                : q.difficulty === 'MEDIUM'
                                ? 'Trung bình'
                                : q.difficulty === 'HARD'
                                ? 'Khó'
                                : 'Chưa phân loại'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="text-sm font-medium text-fb-text whitespace-pre-wrap break-words leading-relaxed">
                        {q.content}
                      </div>

                      {/* Question Images */}
                      {q.image_urls && q.image_urls.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {q.image_urls.map((imgUrl, imgIdx) => (
                            <a
                              key={imgIdx}
                              href={imgUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block relative rounded-lg overflow-hidden border border-fb-divider hover:opacity-90"
                            >
                              <img
                                src={imgUrl}
                                alt={`Minh họa câu hỏi ${orderNumber}`}
                                className="max-h-48 max-w-xs object-cover rounded-lg"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Options List */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const optionKey = opt.key || String.fromCharCode(65 + optIdx);
                            const isCorrect = !!opt.is_correct;
                            const highlightCorrect = showAnswers && isCorrect;

                            return (
                              <div
                                key={optionKey}
                                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition ${
                                  highlightCorrect
                                    ? 'border-fb-success bg-fb-success-soft/80 text-fb-success font-semibold ring-1 ring-fb-success'
                                    : 'border-fb-divider/80 bg-fb-inset/70 text-fb-text'
                                }`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold shrink-0 text-xs ${
                                    highlightCorrect
                                      ? 'bg-fb-success text-white'
                                      : 'bg-fb-card border border-fb-divider text-fb-text'
                                  }`}
                                >
                                  {optionKey}
                                </span>
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="break-words leading-relaxed">
                                    {opt.text}
                                  </div>
                                  {opt.media_url && (
                                    <img
                                      src={opt.media_url}
                                      alt={`Hình ảnh phương án ${optionKey}`}
                                      className="max-h-28 rounded-lg border border-fb-divider mt-1 object-cover"
                                    />
                                  )}
                                  {highlightCorrect && (
                                    <span className="inline-flex items-center gap-1 text-xs text-fb-success font-bold pt-0.5">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Đáp án chính xác</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exam && (
        <ExamExportModal
          isOpen={isExportModalOpen}
          examId={examId}
          examTitle={exam.title}
          onClose={() => setIsExportModalOpen(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
};
