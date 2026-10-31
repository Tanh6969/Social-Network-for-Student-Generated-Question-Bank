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
  return (
    <div className="space-y-3">
      {visibleComments.map((comment) => (
        <CommentRow key={comment.id} comment={comment} onReply={onReply} />
      ))}
    </div>
  );
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
      className={`flex items-start gap-2.5 text-xs ${isReply ? 'mt-2 ml-4' : ''}`}
    >
      <AvatarWithFrame
        user={comment.author}
        size={isReply ? 'xs' : 'sm'}
        onClick={openAuthorProfile}
      />
      <div className="min-w-0 flex-1">
        <div className="rounded-lg bg-gray-100 px-3 py-2 dark:bg-[#3A3B3C]">
          <button
            type="button"
            onClick={openAuthorProfile}
            className="block text-left font-bold text-gray-900 hover:underline dark:text-gray-100"
          >
            {comment.author.name}
          </button>
          <p className="whitespace-pre-wrap wrap-break-word text-fb-text">
            {comment.content}
          </p>
        </div>
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
        {!isReply &&
          comment.replies?.map((reply) => (
            <CommentRow key={reply.id} comment={reply} isReply />
          ))}
      </div>
    </div>
  );
}
