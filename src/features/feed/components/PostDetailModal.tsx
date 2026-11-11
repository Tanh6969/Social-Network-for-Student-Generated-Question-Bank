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
    openReportModal,
    filterVisibleComments,
    loadPostComments,
  } = useApp();
  const [commentInput, setCommentInput] = useState('');
  const [replyTarget, setReplyTarget] = useState<CommentItem | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Phiên thật: bình luận chỉ được tải khi mở chi tiết bài.
  const commentsLoaded = Boolean(post.comments);
  useEffect(() => {
    if (!commentsLoaded) loadPostComments(post.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, commentsLoaded]);

  useEffect(() => {
    if (!focusComment) return;
    const frame = requestAnimationFrame(() => commentInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [focusComment]);

  const visibleComments = filterVisibleComments(post.comments);
  // Bình luận chưa tải (phiên thật) thì dùng số đếm từ máy chủ.
  const visibleCommentsCount = post.comments
    ? visibleComments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0)
    : post.commentsCount;

  const submitComment = () => {
    if (!commentInput.trim()) return;
    addComment(post.id, commentInput, replyTarget?.id);
    setCommentInput('');
    setReplyTarget(null);
  };

  const close = () => setActivePostDetail(null);
  const mediaUrls = post.mediaUrls ?? [];
  const sidebar = (
    <div className="flex h-full min-h-0 w-full flex-col bg-fb-card">
      <div className="flex items-center justify-between border-b border-fb-divider p-4">
        <div className="flex min-w-0 items-center gap-3">
          <AvatarWithFrame user={post.author} size="md" />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-fb-text">
              {post.author.name}
            </h3>
            <span className="text-xs text-fb-text-2">
              {formatPostTime(post.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.author.id !== currentUser.id && (
            <button
              type="button"
              onClick={() =>
                openReportModal('BÀI VIẾT', post.id, post.content.slice(0, 40))
              }
              className="flex items-center gap-1 text-xs font-semibold text-fb-text-2 hover:text-fb-danger"
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
              className="rounded-full p-1.5 text-fb-text-2 hover:bg-fb-hover"
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
        <div className="flex items-center justify-between border-t border-fb-divider pt-3 text-xs">
          <button
            type="button"
            onClick={() => toggleLikePost(post.id)}
            className={`flex items-center gap-1.5 font-semibold ${post.isLiked ? 'text-fb-blue' : 'text-fb-text-2'}`}
          >
            <ThumbsUp className="h-4 w-4" />
            Thích
          </button>
          <div className="flex gap-3 text-fb-text-2">
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
          <p className="py-6 text-center text-xs text-fb-text-2">
            Chưa có bình luận.
          </p>
        )}
      </div>
      {replyTarget && (
        <div className="flex items-center justify-between px-4 pb-1 text-xs text-fb-blue">
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
      <div className="flex items-center gap-2 border-t border-fb-divider p-3">
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
          className="min-w-0 flex-1 rounded-full bg-fb-input px-3.5 py-2 text-xs"
        />
        <button
          type="button"
          onClick={submitComment}
          disabled={!commentInput.trim()}
          aria-label="Gửi bình luận"
          className="p-2 text-fb-blue disabled:text-fb-text-3"
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
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-fb-divider bg-fb-card shadow-2xl"
      >
        {sidebar}
      </div>
    </div>
  );
}
