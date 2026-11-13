import React, { useEffect, useState } from 'react';
import { BookOpen, Calendar, Info, PlayCircle } from 'lucide-react';
import { errorMessage } from '../../../api';
import {
  practiceGateway,
  type ProfileOwner,
} from '../../proposals/practiceGateway';
import type { SubmissionSessionSummary } from '../../proposals/types';
import { PracticeSessionModal } from '../../practice/components/PracticeSessionModal';
import { CardListSkeleton } from '../../../shared/components/Skeleton';

interface ProfileQuestionSetsProps {
  owner: ProfileOwner;
  isMe: boolean;
  showToast: (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error',
  ) => void;
}

/**
 * Tab "Bộ câu hỏi" trên trang cá nhân (GET /users/{userId}/sessions).
 * Người khác chỉ thấy các bộ đã được giảng viên xem xét xong, và có thể luyện tập.
 */
export const ProfileQuestionSets: React.FC<ProfileQuestionSetsProps> = ({
  owner,
  isMe,
  showToast,
}) => {
  // undefined = đang tải; null = người dùng không có trên hệ thống thật
  const [sessions, setSessions] = useState<
    SubmissionSessionSummary[] | null | undefined
  >(undefined);
  const [error, setError] = useState<string | null>(null);
  const [practiceId, setPracticeId] = useState<number | null>(null);

  const { id: ownerId, name: ownerName } = owner;
  useEffect(() => {
    let cancelled = false;
    setSessions(undefined);
    setError(null);
    practiceGateway
      .getUserSessions({ id: ownerId, name: ownerName }, isMe)
      .then((list) => !cancelled && setSessions(list))
      .catch((err: unknown) => {
        if (!cancelled)
          setError(errorMessage(err, 'Không tải được bộ câu hỏi.'));
      });
    return () => {
      cancelled = true;
    };
  }, [ownerId, ownerName, isMe]);

  return (
    <div className="mt-4 space-y-3 px-2 sm:px-0">
      <p className="flex items-start gap-2 px-1 text-sm text-fb-text-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-fb-blue" />
        {isMe
          ? 'Các bộ câu hỏi bạn đã đăng. Người khác chỉ thấy những bộ đã được giảng viên xem xét xong.'
          : 'Các bộ câu hỏi đã được giảng viên xem xét xong. Chọn một bộ để luyện tập.'}
      </p>

      {sessions === undefined && !error && (
        <CardListSkeleton
          count={2}
          label="Đang tải bộ câu hỏi…"
          className="grid grid-cols-1 gap-3 md:grid-cols-2"
        />
      )}
      {error && (
        <p className="py-8 text-center text-sm text-fb-danger">{error}</p>
      )}
      {sessions === null && (
        <p className="py-8 text-center text-sm text-fb-text-2">
          Người dùng này không có trên hệ thống nên không xem được bộ câu hỏi.
        </p>
      )}
      {sessions && sessions.length === 0 && (
        <div className="rounded-lg bg-fb-card p-10 text-center text-sm text-fb-text-2 shadow-fb-card">
          Chưa có bộ câu hỏi nào.
        </div>
      )}

      {sessions && sessions.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {sessions.map((s) => (
            <article
              key={s.session_id}
              className="flex flex-col gap-2 rounded-lg bg-fb-card p-4 shadow-fb-card"
            >
              <span className="w-fit rounded-full bg-fb-blue-soft px-2.5 py-0.5 text-xs font-semibold text-fb-blue">
                {s.subject_code ? `${s.subject_code} · ` : ''}
                {s.subject_name}
              </span>
              <h4 className="font-bold text-fb-text [overflow-wrap:anywhere]">
                {s.title}
              </h4>
              {s.content && (
                <p className="line-clamp-2 text-sm text-fb-text-2">
                  {s.content}
                </p>
              )}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-fb-text-2">
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />{' '}
                    {s.question_counts ?? 0} câu
                  </span>
                  {s.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(s.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </span>
                {s.session_id && (
                  <button
                    type="button"
                    onClick={() => setPracticeId(s.session_id!)}
                    className="flex items-center gap-1.5 rounded-lg bg-fb-blue px-3 py-1.5 font-semibold text-white hover:bg-fb-blue-hover"
                  >
                    <PlayCircle className="h-4 w-4" /> Luyện tập
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {practiceId !== null && (
        <PracticeSessionModal
          sessionId={practiceId}
          onClose={() => setPracticeId(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
};
