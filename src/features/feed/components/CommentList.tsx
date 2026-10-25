import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { CommentItem } from '../../demo/types';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import { formatPostTime } from '../postUtils';

interface CommentActions {
  currentUserId: string;
  onEdit: (comment: CommentItem, text: string) => void;
  onDelete: (comment: CommentItem) => void;
}

export function CommentList({
  comments,
  onReply,
  ...actions
}: {
  comments: CommentItem[];
  onReply: (comment: CommentItem) => void;
} & CommentActions) {
  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <CommentRow
          key={comment.id}
          comment={comment}
          onReply={onReply}
          {...actions}
        />
      ))}
    </div>
  );
}

function CommentRow({
  comment,
  onReply,
  isReply = false,
  currentUserId,
  onEdit,
  onDelete,
}: {
  comment: CommentItem;
  onReply?: (comment: CommentItem) => void;
  isReply?: boolean;
} & CommentActions) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = comment.author.id === currentUserId;

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      )
        setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  const save = () => {
    if (!draft.trim()) return;
    if (draft.trim() !== comment.content) onEdit(comment, draft);
    setEditing(false);
  };

  return (
    <div
      className={`flex items-start gap-2.5 text-xs ${isReply ? 'mt-2 ml-4' : ''}`}
    >
      <AvatarWithFrame user={comment.author} size={isReply ? 'xs' : 'sm'} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1">
          <div className="min-w-0 flex-1 rounded-2xl bg-gray-100 px-3 py-2 dark:bg-[#3A3B3C]">
            <span className="block font-bold text-gray-900 dark:text-gray-100">
              {comment.author.name}
            </span>
            {editing ? (
              <textarea
                autoFocus
                aria-label="Sửa bình luận"
                rows={2}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setEditing(false);
                  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey))
                    save();
                }}
                className="mt-1 w-full resize-y rounded-lg border border-blue-400 bg-white p-2 text-xs text-gray-900 outline-none dark:bg-[#242526] dark:text-gray-100"
              />
            ) : (
              <p className="whitespace-pre-wrap wrap-break-word text-gray-800 dark:text-gray-200">
                {comment.content}
              </p>
            )}
          </div>
          {isOwner && !editing && (
            <div ref={menuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={`Tùy chọn bình luận của ${comment.author.name}`}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 w-32 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-[#242526]"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setDraft(comment.content);
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                    className="w-full rounded-md px-3 py-2 text-left text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      if (
                        window.confirm(
                          comment.replies?.length
                            ? 'Xóa bình luận này và các câu trả lời?'
                            : 'Xóa bình luận này?',
                        )
                      )
                        onDelete(comment);
                    }}
                    className="w-full rounded-md px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {editing ? (
          <div className="flex justify-end gap-3 px-2 pt-1 font-semibold">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-gray-500 hover:underline"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!draft.trim()}
              className="text-blue-600 hover:underline disabled:text-gray-400"
            >
              Lưu
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 pt-1 text-[11px] text-gray-500">
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
        )}
        {!isReply &&
          comment.replies?.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              isReply
              currentUserId={currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
      </div>
    </div>
  );
}
