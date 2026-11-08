import { useEffect, useRef } from 'react';
import type { CommentItem } from '../../demo/types';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import { formatPostTime } from '../postUtils';

export function CommentList({
  comments,
  onReply,
  limit,
}: {
  comments: CommentItem[];
  onReply: (comment: CommentItem) => void;
  limit?: number;
}) {
  const { filterVisibleComments } = useApp();
  const unblockedComments = filterVisibleComments(comments);
  const visibleComments = limit
    ? unblockedComments.slice(-limit)
    : unblockedComments;
  const listRef = useScrollToNewComment(visibleComments);
  return (
    <div ref={listRef} className="space-y-3">
      {visibleComments.map((comment) => (
        <CommentRow key={comment.id} comment={comment} onReply={onReply} />
      ))}
    </div>
  );
}

function collectIds(comments: CommentItem[]): string[] {
  return comments.flatMap((c) => [c.id, ...(c.replies ?? []).map((r) => r.id)]);
}

/**
 * Khi có bình luận/trả lời mới (kể cả trả lời nằm giữa danh sách), cuộn khung
 * chứa tới đúng bình luận đó. Lần hiển thị đầu không cuộn để người dùng đọc
 * nội dung bài viết trước.
 */
function useScrollToNewComment(comments: CommentItem[]) {
  const listRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string> | null>(null);
  const ids = collectIds(comments);
  const idsKey = ids.join('|');

  useEffect(() => {
    const previous = knownIds.current;
    knownIds.current = new Set(ids);
    if (!previous) return;
    const added = ids.filter((id) => !previous.has(id));
    const newest = added[added.length - 1];
    if (!newest) return;
    const row = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[data-comment-id]') ?? [],
    ).find((el) => el.dataset.commentId === newest);
    row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // idsKey đại diện cho danh sách ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return listRef;
}

function CommentRow({
  comment,
  onReply,
  isReply = false,
}: {
  comment: CommentItem;
  onReply?: (comment: CommentItem) => void;
  isReply?: boolean;
}) {
  const { setViewingUserId, setActiveTab } = useApp();
  const openAuthorProfile = () => {
    setViewingUserId(comment.author.id);
    setActiveTab('profile');
  };

  return (
    <div
      data-comment-id={comment.id}
      className={`flex items-start gap-2.5 text-xs ${isReply ? 'mt-2 ml-4' : ''}`}
    >
      <AvatarWithFrame
        user={comment.author}
        size={isReply ? 'xs' : 'sm'}
        onClick={openAuthorProfile}
      />
      <div className="min-w-0 flex-1">
        <div className="rounded-lg bg-fb-input px-3 py-2">
          <button
            type="button"
            onClick={openAuthorProfile}
            className="block text-left font-bold text-fb-text hover:underline"
          >
            {comment.author.name}
          </button>
          <p className="whitespace-pre-wrap wrap-break-word text-fb-text">
            {comment.content}
          </p>
        </div>
        <div className="flex items-center gap-3 px-2 pt-1 text-xs text-fb-text-2">
          <span>{formatPostTime(comment.createdAt)}</span>
          {onReply && (
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="font-semibold hover:underline"
            >
              Trả lời
            </button>
          )}
        </div>
        {!isReply &&
          comment.replies?.map((reply) => (
            <CommentRow key={reply.id} comment={reply} isReply />
          ))}
      </div>
    </div>
  );
}
