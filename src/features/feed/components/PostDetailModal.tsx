import { useEffect, useRef, useState } from 'react';

import { Flag, Send, ThumbsUp, X } from 'lucide-react';

import { useApp } from '../../demo/context/AppContext';
import type { CommentItem, Post } from '../../demo/types';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import { MediaLightbox } from '../../../shared/components/MediaLightbox';
import { CommentList } from './CommentList';
import { PostContent } from './PostContent';
import { PostDocuments } from './PostDocuments';
import { formatPostTime } from '../postUtils';

export function PostDetailModal() {
  const { activePostDetail, activePostMediaIndex, activePostCommentFocus } =
    useApp();
  if (!activePostDetail) return null;
  return (
    <PostDetail
      key={activePostDetail.id}
      post={activePostDetail}
      initialIndex={activePostMediaIndex}
      focusComment={activePostCommentFocus}
    />
  );
}

function PostDetail({
  post,
  initialIndex,
  focusComment,
}: {
  post: Post;
  initialIndex: number;
  focusComment: boolean;
}) {
  const {
    currentUser,
    setActivePostDetail,
    toggleLikePost,
    addComment,
    deletePost,
    openPostComposer,
    openReportModal,
    filterVisibleComments,
  } = useApp();
  const [commentInput, setCommentInput] = useState('');
  const [replyTarget, setReplyTarget] = useState<CommentItem | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focusComment) return;
    const frame = requestAnimationFrame(() => commentInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [focusComment]);

  const visibleComments = filterVisibleComments(post.comments);
  const visibleCommentsCount = visibleComments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length ?? 0),
    0,
  );

  const submitComment = () => {
    if (!commentInput.trim()) return;
    addComment(post.id, commentInput, replyTarget?.id);
    setCommentInput('');
    setReplyTarget(null);
  };

  const close = () => setActivePostDetail(null);
  const mediaUrls = post.mediaUrls ?? [];
  const sidebar = (
    <div className="flex h-full min-h-0 w-full flex-col bg-white dark:bg-[#242526]">
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex min-w-0 items-center gap-3">
          <AvatarWithFrame user={post.author} size="md" />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
              {post.author.name}
            </h3>
            <span className="text-xs text-gray-500">
              {formatPostTime(post.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.author.id === currentUser.id ? (
            <>
              <button
                type="button"
                onClick={() => {
                  close();
                  openPostComposer(post.id);
                }}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Xóa bài viết này?')) deletePost(post.id);
                }}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Xóa
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() =>
                openReportModal('BÀI VIẾT', post.id, post.content.slice(0, 40))
              }
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-600"
              title="Báo cáo bài viết"
            >
              <Flag className="h-3.5 w-3.5" />
              <span>Báo cáo</span>
            </button>
          )}
          {!mediaUrls.length && (
            <button
              type="button"
              onClick={close}
              aria-label="Đóng chi tiết"
              className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {post.content.trim() && <PostContent content={post.content} />}
        {post.documents?.length ? (
          <PostDocuments documents={post.documents} />
        ) : null}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs dark:border-gray-700">
          <button
            type="button"
            onClick={() => toggleLikePost(post.id)}
            className={`flex items-center gap-1.5 font-semibold ${post.isLiked ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <ThumbsUp className="h-4 w-4" />
            Thích
          </button>
          <div className="flex gap-3 text-gray-500">
            {post.likesCount > 0 && <span>{post.likesCount} lượt thích</span>}
            {visibleCommentsCount > 0 && (
              <span>{visibleCommentsCount} bình luận</span>
            )}
          </div>
        </div>
        {visibleComments.length ? (
          <CommentList
            comments={visibleComments}
            onReply={(comment) => {
              setReplyTarget(comment);
              commentInputRef.current?.focus();
            }}
          />
        ) : (
          <p className="py-6 text-center text-xs text-gray-500">
            Chưa có bình luận.
          </p>
        )}
      </div>
      {replyTarget && (
        <div className="flex items-center justify-between px-4 pb-1 text-xs text-blue-600">
          <span>Đang trả lời {replyTarget.author.name}</span>
          <button
            type="button"
            onClick={() => setReplyTarget(null)}
            className="hover:underline"
          >
            Hủy
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 border-t border-gray-200 p-3 dark:border-gray-700">
        <AvatarWithFrame user={currentUser} size="sm" />
        <input
          ref={commentInputRef}
          type="text"
          value={commentInput}
          onChange={(event) => setCommentInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitComment();
          }}
          placeholder={
            replyTarget
              ? `Trả lời ${replyTarget.author.name}...`
              : 'Viết bình luận...'
          }
          aria-label="Nội dung bình luận"
          className="min-w-0 flex-1 rounded-full bg-gray-100 px-3.5 py-2 text-xs dark:bg-[#3A3B3C]"
        />
        <button
          type="button"
          onClick={submitComment}
          disabled={!commentInput.trim()}
          aria-label="Gửi bình luận"
          className="p-2 text-blue-600 disabled:text-gray-300"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  if (mediaUrls.length)
    return (
      <MediaLightbox
        items={mediaUrls.map((src, index) => ({
          src,
          kind: post.type === 'VIDEO' ? 'video' : 'image',
          alt: `Ảnh bài viết ${index + 1}`,
        }))}
        initialIndex={initialIndex}
        onClose={close}
        sidebar={sidebar}
      />
    );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết bài viết"
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#242526]"
      >
        {sidebar}
      </div>
    </div>
  );
}
