import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { CommentItem } from '../../demo/types';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import { formatPostTime } from '../postUtils';

export function CommentList({
  postId,
  comments,
  onReply,
  limit,
}: {
  postId: string;
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
        <CommentRow key={comment.id} postId={postId} comment={comment} onReply={onReply} />
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
  postId,
  comment,
  onReply,
  isReply = false,
}: {
  postId: string;
  comment: CommentItem;
  onReply?: (comment: CommentItem) => void;
  isReply?: boolean;
}) {
  const {
    setViewingUserId,
    setActiveTab,
    setActivePostDetail,
    currentUser,
    sessionKind,
    updateComment,
    deleteComment,
  } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const canManage = !comment.deleted &&
    comment.author.id === currentUser.id &&
    (sessionKind !== 'api' ||
      Number.isSafeInteger(Number(comment.id)));
  const save = async () => {
    if (!draft.trim() || draft.trim() === comment.content) {
      setEditing(false);
      return;
    }
    setBusy(true);
    if (await updateComment(postId, comment.id, draft)) setEditing(false);
    setBusy(false);
  };
  const remove = async () => {
    setBusy(true);
    if (await deleteComment(postId, comment.id)) setConfirmDelete(false);
    setBusy(false);
  };
  const openAuthorProfile = () => {
    setActivePostDetail(null);
    setViewingUserId(
      comment.author.id === currentUser.id ? null : comment.author.id,
    );
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
          {editing ? (
            <textarea
              aria-label="Sửa bình luận"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={2}
              className="mt-1 w-full resize-y rounded-md bg-fb-card p-2 text-fb-text"
            />
          ) : (
            <p className="whitespace-pre-wrap wrap-break-word text-fb-text">
              {comment.content}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 px-2 pt-1 text-xs text-fb-text-2">
          <span>{formatPostTime(comment.createdAt)}</span>
          {onReply && !comment.deleted && (
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="font-semibold hover:underline"
            >
              Trả lời
            </button>
          )}
          {canManage && !editing && (
            <>
              <button
                type="button"
                onClick={() => {
                  setDraft(comment.content);
                  setEditing(true);
                }}
                className="font-semibold hover:underline cursor-pointer"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="font-semibold hover:underline cursor-pointer"
              >
                Xóa
              </button>
            </>
          )}
          {editing && (
            <>
              <button
                type="button"
                disabled={busy || !draft.trim()}
                onClick={() => void save()}
                className="font-semibold text-fb-blue disabled:opacity-50 cursor-pointer"
              >
                Lưu
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(false)}
                className="hover:underline cursor-pointer"
              >
                Hủy
              </button>
            </>
          )}
        </div>
        {confirmDelete &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Xóa bình luận?"
              onClick={(event) => {
                if (!busy && event.target === event.currentTarget) {
                  setConfirmDelete(false);
                }
              }}
              className="fixed inset-0 z-[400] flex items-center justify-center bg-black/65 p-4 animate-in fade-in duration-150"
            >
              <div className="w-full max-w-[500px] overflow-hidden rounded-xl border border-fb-divider bg-fb-card text-fb-text shadow-2xl">
                <div className="relative flex items-center justify-center border-b border-fb-divider px-4 py-4">
                  <h3 className="text-lg font-bold text-fb-text">
                    Xóa bình luận?
                  </h3>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmDelete(false)}
                    aria-label="Đóng"
                    className="absolute right-4 flex h-9 w-9 items-center justify-center rounded-full bg-fb-btn text-fb-text-2 transition hover:bg-fb-btn-hover hover:text-fb-text cursor-pointer disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="px-4 py-4 text-sm text-fb-text">
                  Bạn có chắc chắn muốn xóa bình luận này không?
                </div>
                <div className="flex items-center justify-end gap-2 px-4 pb-4 pt-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-fb-blue transition hover:bg-fb-hover cursor-pointer disabled:opacity-50"
                  >
                    Không
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void remove()}
                    className="rounded-lg bg-fb-blue px-6 py-2 text-sm font-semibold text-white transition hover:bg-fb-blue-hover cursor-pointer disabled:opacity-50"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}
        {!isReply &&
          comment.replies?.map((reply) => (
            <CommentRow key={reply.id} postId={postId} comment={reply} isReply />
          ))}
      </div>
    </div>
  );
}
