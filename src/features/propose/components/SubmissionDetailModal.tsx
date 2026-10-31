import React, { useEffect, useState } from 'react';
import {
  X,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck,
  HelpCircle,
  Sparkles,
  MessageSquare,
  Heart,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { sessionsApi, MySubmissionDetail } from '../../../api';
import { getStoredSubmissionDetail } from '../mockSessions';

interface SubmissionDetailModalProps {
  sessionId: number | null;
  onClose: () => void;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  sessionId,
  onClose,
}) => {
  if (!sessionId) return null;
  return <SubmissionDetailContent key={sessionId} sessionId={sessionId} onClose={onClose} />;
};

const SubmissionDetailContent: React.FC<{ sessionId: number; onClose: () => void }> = ({
  sessionId,
  onClose,
}) => {
  const [detail, setDetail] = useState<MySubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    sessionsApi
      .getMySubmissionDetail(sessionId)
      .then((data) => {
        if (isMounted) setDetail(data);
      })
      .catch((err) => {
        if (isMounted) {
          // Fallback to local stored/mock session details
          const fallback = getStoredSubmissionDetail(sessionId);
          if (fallback) {
            setDetail(fallback);
          } else {
            setError(err?.message || 'Không thể tải thông tin chi tiết phiên đề xuất.');
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200">
      <div className="bg-fb-card rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-fb-divider">
        {/* Header */}
        <div className="p-4 border-b border-fb-divider flex items-center justify-between bg-fb-input">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-fb-text truncate">
                  Chi tiết phiên đề xuất
                </h3>
              </div>
              <p className="text-xs text-gray-500 truncate">
                Môn:{' '}
                <span className="font-semibold text-fb-text">
                  {detail?.subject_name || 'Đang tải...'} ({detail?.subject_code || ''})
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Đang tải dữ liệu phiên đề xuất...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Lỗi tải dữ liệu</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && detail && (
            <>
              {/* Meta information card */}
              <div className="bg-fb-input rounded-lg p-4 border border-fb-divider space-y-3">
                <h4 className="font-bold text-lg text-fb-text">
                  {detail.title}
                </h4>
                {detail.content && (
                  <p className="text-sm text-fb-text-2 whitespace-pre-line">
                    {detail.content}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-fb-text-2 pt-2 border-t border-fb-divider">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      Tạo lúc:{' '}
                      {detail.created_at
                        ? new Date(detail.created_at).toLocaleString('vi-VN')
                        : '---'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>{detail.react_count || 0} lượt thích</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span>{detail.comment_count || 0} bình luận</span>
                  </div>

                  {detail.reviewed_by_lecturer && (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <UserCheck className="w-4 h-4" />
                      <span>
                        Duyệt bởi: {detail.reviewed_by_lecturer}
                        {detail.reviewed_at &&
                          ` (${new Date(detail.reviewed_at).toLocaleDateString('vi-VN')})`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Questions list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-fb-text">
                    Danh sách câu hỏi ({detail.questions?.length || 0})
                  </h4>
                </div>

                {detail.questions && detail.questions.length > 0 ? (
                  detail.questions.map((q, qIndex) => (
                    <div
                      key={q.question_id || qIndex}
                      className="p-4 sm:p-5 rounded-lg bg-fb-card space-y-3 shadow-fb-card"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {qIndex + 1}
                          </span>
                          <span className="font-semibold text-sm text-fb-text">
                            Câu hỏi {qIndex + 1}
                          </span>
                        </div>

                        {q.confidence_score !== undefined && (
                          <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Độ tự tin: {q.confidence_score}/4</span>
                          </div>
                        )}
                      </div>

                      {/* Question content */}
                      <p className="text-sm sm:text-base text-fb-text leading-relaxed font-medium">
                        {q.content}
                      </p>

                      {/* Image URLs if any */}
                      {q.image_urls && q.image_urls.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {q.image_urls.map((url, imgIdx) => (
                            <img
                              key={imgIdx}
                              src={url}
                              alt={`Minh họa câu hỏi ${qIndex + 1}`}
                              className="max-h-48 rounded-lg border border-fb-divider object-cover"
                            />
                          ))}
                        </div>
                      )}

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {q.options?.map((opt) => (
                          <div
                            key={opt.key}
                            className={`p-3 rounded-lg border text-xs sm:text-sm flex items-start gap-2.5 transition ${
                              opt.is_correct
                                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold'
                                : 'border-fb-divider bg-gray-50/60 dark:bg-[#1E1F20] text-gray-800 dark:text-gray-300'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                opt.is_correct
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-fb-text'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="break-words whitespace-pre-wrap leading-relaxed">{opt.text}</span>
                              {opt.media_url && (
                                <img
                                  src={opt.media_url}
                                  alt={`Đáp án ${opt.key}`}
                                  className="mt-2 max-h-24 rounded border border-fb-divider object-cover"
                                />
                              )}
                            </div>
                            {opt.is_correct && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="mt-3 p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block mb-0.5">Giải thích đáp án:</span>
                            <span>{q.explanation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">
                    Phiên chưa có câu hỏi nào.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-fb-divider flex justify-end bg-fb-input">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-200 dark:bg-gray-700 text-fb-text hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
