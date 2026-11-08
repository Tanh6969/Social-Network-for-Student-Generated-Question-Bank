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
import { errorMessage, MySubmissionDetail } from '../../../api';
import { proposalGateway } from '../../proposals/proposalGateway';

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
    proposalGateway
      .getMySubmissionDetail(sessionId)
      .then((data) => {
        if (isMounted) setDetail(data);
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(errorMessage(err, 'Không thể tải thông tin chi tiết phiên đề xuất.'));
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
            <div className="w-10 h-10 rounded-lg bg-fb-blue-soft text-fb-blue flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-fb-text truncate">
                  Chi tiết phiên đề xuất
                </h3>
              </div>
              <p className="text-sm text-fb-text-2 truncate">
                Môn:{' '}
                <span className="font-semibold text-fb-text">
                  {detail?.subject_name || 'Đang tải...'} ({detail?.subject_code || ''})
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-fb-btn-hover text-fb-text-2 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-fb-text-2">
              <div className="w-8 h-8 border-3 border-fb-blue border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-body">Đang tải dữ liệu phiên đề xuất...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-fb-danger-soft border border-fb-danger/30 text-fb-danger flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-body">Lỗi tải dữ liệu</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && detail && (
            <>
              {/* Meta information card */}
              <div className="bg-fb-input rounded-lg p-4 border border-fb-divider space-y-3">
                <h4 className="text-card-title font-semibold text-fb-text [overflow-wrap:anywhere]">
                  {detail.title}
                </h4>
                {detail.content && (
                  <p className="text-body text-fb-text-2 whitespace-pre-line [overflow-wrap:anywhere]">
                    {detail.content}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-fb-text-2 pt-2 border-t border-fb-divider">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-fb-text-3" />
                    <span>
                      Tạo lúc:{' '}
                      {detail.created_at
                        ? new Date(detail.created_at).toLocaleString('vi-VN')
                        : '---'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-fb-danger" />
                    <span>{detail.react_count || 0} lượt thích</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-fb-blue" />
                    <span>{detail.comment_count || 0} bình luận</span>
                  </div>

                  {detail.reviewed_by_lecturer && (
                    <div className="flex items-center gap-1.5 text-fb-success font-medium">
                      <UserCheck className="w-4 h-4" />
                      <span>
                        Đã xem xét bởi: {detail.reviewed_by_lecturer}
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
                  <h4 className="text-card-title font-semibold text-fb-text">
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
                          <span className="w-6 h-6 rounded-full bg-fb-blue text-white font-semibold text-xs flex items-center justify-center shrink-0">
                            {qIndex + 1}
                          </span>
                          <span className="font-semibold text-body text-fb-text">
                            Câu hỏi {qIndex + 1}
                          </span>
                        </div>

                        {q.confidence_score !== undefined && (
                          <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-fb-warning-soft text-fb-warning border border-fb-warning/30">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Độ tự tin: {q.confidence_score}/4</span>
                          </div>
                        )}
                      </div>

                      {/* Question content */}
                      <p className="text-body text-fb-text leading-relaxed font-medium [overflow-wrap:anywhere]">
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
                            className={`p-3 rounded-lg border text-body flex items-start gap-2.5 transition ${
                              opt.is_correct
                                ? 'border-fb-success bg-fb-success-soft/70 text-fb-success font-semibold'
                                : 'border-fb-divider bg-fb-inset/60 text-fb-text'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                                opt.is_correct
                                  ? 'bg-fb-success text-white'
                                  : 'bg-fb-btn text-fb-text'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="[overflow-wrap:anywhere] whitespace-pre-wrap leading-relaxed">{opt.text}</span>
                              {opt.media_url && (
                                <img
                                  src={opt.media_url}
                                  alt={`Đáp án ${opt.key}`}
                                  className="mt-2 max-h-24 rounded border border-fb-divider object-cover"
                                />
                              )}
                            </div>
                            {opt.is_correct && (
                              <CheckCircle2 className="w-4 h-4 text-fb-success shrink-0 mt-0.5" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="mt-3 p-3 rounded-lg bg-fb-blue-soft/70 border border-fb-blue/30 text-sm text-fb-blue flex items-start gap-2">
                          <HelpCircle className="w-4 h-4 text-fb-blue shrink-0 mt-0.5" />
                          <div className="min-w-0 [overflow-wrap:anywhere]">
                            <span className="font-semibold block mb-0.5">Giải thích đáp án:</span>
                            <span>{q.explanation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-fb-text-2 text-center py-4">
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
            className="px-4 py-2 text-body font-semibold rounded-lg bg-fb-btn text-fb-text hover:bg-fb-btn-hover transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
