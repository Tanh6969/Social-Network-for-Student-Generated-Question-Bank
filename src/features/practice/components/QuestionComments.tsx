import React, { useCallback, useEffect, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { errorMessage } from '../../../api';
import { postsApi, type CommentResponseDto } from '../../../api/posts';
import { SkeletonRows } from '../../../shared/components/Skeleton';

interface QuestionCommentsProps {
  questionId: number;
  showToast: (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error',
  ) => void;
}

const MAX_LENGTH = 1000;

function formatTime(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
}

const CommentRow: React.FC<{
  comment: CommentResponseDto;
  nested?: boolean;
}> = ({ comment, nested }) => {
  const name = comment.author?.full_name || 'Người dùng';
  return (
    <li className={nested ? 'ml-9' : ''}>
      <div className="flex items-start gap-2">
        {comment.author?.avatar_url ? (
          <img
            src={comment.author.avatar_url}
            alt=""
            className="h-7 w-7 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fb-blue-soft text-xs font-bold text-fb-blue">
            {name.trim().charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-fb-input px-3 py-1.5">
            <p className="text-xs font-semibold text-fb-text">{name}</p>
            <p className="whitespace-pre-wrap text-sm text-fb-text [overflow-wrap:anywhere]">
              {comment.deleted ? (
                <span className="italic text-fb-text-3">
                  Bình luận đã bị xoá
                </span>
              ) : (
                comment.content
              )}
            </p>
          </div>
          <p className="px-3 pt-0.5 text-[11px] text-fb-text-3">
            {formatTime(comment.created_at)}
          </p>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <ul className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentRow key={reply.comment_id} comment={reply} nested />
          ))}
        </ul>
      )}
    </li>
  );
};

/**
 * Bình luận về một câu hỏi: GET/POST /comments với target_type=QUESTION.
 * Chỉ dùng trong phiên thật (API).
 */
export const QuestionComments: React.FC<QuestionCommentsProps> = ({
  questionId,
  showToast,
}) => {
  const [comments, setComments] = useState<CommentResponseDto[] | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [after, setAfter] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setComments(null);
    try {
      const page = await postsApi.getComments('QUESTION', questionId);
      setComments(page.items);
      setHasNext(page.hasNext);
      setAfter(page.after);
    } catch (err: unknown) {
      setError(errorMessage(err, 'Không tải được bình luận.'));
    }
  }, [questionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = async () => {
    if (after === undefined) return;
    setLoadingMore(true);
    try {
      const page = await postsApi.getComments('QUESTION', questionId, after);
      setComments((prev) => [...(prev ?? []), ...page.items]);
      setHasNext(page.hasNext);
      setAfter(page.after);
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Không tải thêm được bình luận.'), 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const created = await postsApi.createComment(
        'QUESTION',
        questionId,
        content,
      );
      setDraft('');
      if (created) setComments((prev) => [...(prev ?? []), created]);
      else await load();
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Không gửi được bình luận.'), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-3 rounded-lg border border-fb-divider p-3">
      <h4 className="flex items-center gap-1.5 text-sm font-semibold text-fb-text">
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Bình luận
        {comments && comments.length > 0 && (
          <span className="font-normal text-fb-text-2">
            ({comments.length})
          </span>
        )}
      </h4>

      {comments === null && !error && (
        <SkeletonRows count={2} label="Đang tải bình luận…" />
      )}
      {error && (
        <p role="alert" className="text-sm text-fb-danger">
          {error}{' '}
          <button
            type="button"
            onClick={() => void load()}
            className="font-semibold underline"
          >
            Thử lại
          </button>
        </p>
      )}
      {comments && comments.length === 0 && (
        <p className="text-sm text-fb-text-2">
          Chưa có bình luận nào. Hãy là người đầu tiên góp ý cho câu hỏi này.
        </p>
      )}
      {comments && comments.length > 0 && (
        <ul className="space-y-2">
          {comments.map((c) => (
            <CommentRow key={c.comment_id} comment={c} />
          ))}
        </ul>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loadingMore}
          className="text-sm font-semibold text-fb-blue hover:underline disabled:opacity-50"
        >
          {loadingMore ? 'Đang tải…' : 'Xem thêm bình luận'}
        </button>
      )}

      <form onSubmit={(e) => void submit(e)} className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
          rows={1}
          aria-label="Viết bình luận"
          placeholder="Viết bình luận…"
          className="min-h-9 flex-1 resize-y rounded-2xl border border-fb-divider bg-fb-input px-3 py-2 text-sm text-fb-text"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          aria-label="Gửi bình luận"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fb-blue text-white hover:bg-fb-blue-hover disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
};
