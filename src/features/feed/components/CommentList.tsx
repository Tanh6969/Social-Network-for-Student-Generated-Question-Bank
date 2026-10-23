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
  const { filterVisibleComments, setViewingUserId, setActiveTab } = useApp();
  const unblockedComments = filterVisibleComments(comments);
  const visibleComments = limit
    ? unblockedComments.slice(-limit)
    : unblockedComments;

  const openAuthorProfile = (userId: string) => {
    setViewingUserId(userId);
    setActiveTab('profile');
  };

  return (
    <div className="space-y-3">
      {visibleComments.map((comment) => (
        <div key={comment.id} className="flex items-start gap-2.5 text-xs">
          <AvatarWithFrame
            user={comment.author}
            size="sm"
            onClick={() => openAuthorProfile(comment.author.id)}
          />
          <div className="min-w-0 flex-1">
            <div className="rounded-2xl bg-gray-100 dark:bg-[#3A3B3C] px-3 py-2">
              <span
                onClick={() => openAuthorProfile(comment.author.id)}
                className="block font-bold text-gray-900 dark:text-gray-100 hover:underline cursor-pointer"
              >
                {comment.author.name}
              </span>
              <p className="whitespace-pre-wrap wrap-break-word text-gray-800 dark:text-gray-200">
                {comment.content}
              </p>
            </div>
            <div className="flex items-center gap-3 px-2 pt-1 text-[11px] text-gray-500">
              <span>{formatPostTime(comment.createdAt)}</span>
              <button
                type="button"
                onClick={() => onReply(comment)}
                className="font-semibold hover:underline"
              >
                Trả lời
              </button>
            </div>
            {comment.replies?.map((reply) => (
              <div key={reply.id} className="mt-2 ml-4 flex items-start gap-2">
                <AvatarWithFrame
                  user={reply.author}
                  size="xs"
                  onClick={() => openAuthorProfile(reply.author.id)}
                />
                <div className="min-w-0 flex-1 rounded-2xl bg-gray-100 dark:bg-[#3A3B3C] px-3 py-2">
                  <span
                    onClick={() => openAuthorProfile(reply.author.id)}
                    className="block font-bold text-gray-900 dark:text-gray-100 hover:underline cursor-pointer"
                  >
                    {reply.author.name}
                  </span>
                  <p className="whitespace-pre-wrap wrap-break-word text-gray-800 dark:text-gray-200">
                    {reply.content}
                  </p>
                  <span className="text-[10px] text-gray-500">
                    {formatPostTime(reply.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
