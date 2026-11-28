import { useEffect, useRef, useState } from 'react';

import {
  Bell,
  Flag,
  Globe,
  Grid,
  MessageCircle,
  Send,
  ThumbsUp,
  X,
} from 'lucide-react';

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
    addLecturerNote,
    role,
    sessionKind,
    conversations,
    openChatDock,
    unreadNotificationsCount,
    setActiveTab,
    setViewingUserId,
  } = useApp();
  const [commentInput, setCommentInput] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [replyTarget, setReplyTarget] = useState<CommentItem | null>(null);
  const [noteDraft, setNoteDraft] = useState(post.lecturerNote?.note ?? '');
  const [noteEditing, setNoteEditing] = useState(false);
  const [noteBusy, setNoteBusy] = useState(false);
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const messengerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMessengerOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        messengerRef.current &&
        !messengerRef.current.contains(event.target as Node)
      ) {
        setIsMessengerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMessengerOpen]);

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

  const submitComment = async () => {
    if (!commentInput.trim() || commentBusy) return;
    setCommentBusy(true);
    try {
      if (await addComment(post.id, commentInput, replyTarget?.id)) {
        setCommentInput('');
        setReplyTarget(null);
      }
    } finally {
      setCommentBusy(false);
    }
  };

  const close = () => setActivePostDetail(null);
  const mediaUrls = post.mediaUrls ?? [];
  const unreadMessagesCount = conversations.reduce(
    (sum, conv) => sum + (conv.unreadCount || 0),
    0,
  );

  const sidebar = (
    <div className="flex h-full min-h-0 w-full flex-col bg-fb-card">
      {/* Facebook-style Right Top Header Buttons when viewing photo/video */}
      {mediaUrls.length > 0 && (
        <div className="flex h-14 shrink-0 items-center justify-end gap-2 border-b border-fb-divider bg-fb-card px-4">
          <button
            type="button"
            onClick={() => {
              close();
              setViewingUserId(null);
              setActiveTab('bank');
            }}
            title="Menu Chức năng"
            aria-label="Menu Chức năng"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-fb-btn text-fb-text transition hover:bg-fb-btn-hover cursor-pointer"
          >
            <Grid className="h-5 w-5" />
          </button>
          <div ref={messengerRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMessengerOpen((prev) => !prev)}
              title="Messenger"
              aria-label="Messenger"
              className={`relative flex h-10 w-10 items-center justify-center rounded-full transition cursor-pointer ${
                isMessengerOpen
                  ? 'bg-fb-blue-soft text-fb-blue'
                  : 'bg-fb-btn text-fb-text hover:bg-fb-btn-hover'
              }`}
            >
              <MessageCircle className="h-5 w-5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-fb-danger px-1.5 py-0.2 text-[11px] font-bold text-white">
                  {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                </span>
              )}
            </button>

            {isMessengerOpen && (
              <div className="fixed top-14 right-1 sm:right-2 w-[calc(100vw-0.5rem)] sm:w-90 max-w-sm bg-fb-card rounded-xl shadow-2xl border border-fb-divider p-3 z-[360] animate-in fade-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-4.5rem)] flex flex-col">
                <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                  <h3 className="font-bold text-fb-text text-lg">Đoạn chat</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMessengerOpen(false);
                      close();
                      setViewingUserId(null);
                      setActiveTab('messenger');
                    }}
                    className="text-xs text-fb-blue hover:underline font-semibold cursor-pointer"
                  >
                    Xem tất cả trong Messenger
                  </button>
                </div>

                <div className="divide-y divide-fb-divider overflow-y-auto max-h-[60vh] flex-1">
                  {conversations.length > 0 ? (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => {
                          openChatDock(conv.partner.id);
                          setIsMessengerOpen(false);
                        }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-fb-hover cursor-pointer transition"
                      >
                        <AvatarWithFrame user={conv.partner} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline gap-2">
                            <p className="font-semibold text-sm text-fb-text truncate">
                              {conv.partner.name}
                            </p>
                            <span className="text-xs text-fb-text-3 shrink-0">
                              {conv.lastMessageTime}
                            </span>
                          </div>
                          <p className="text-xs text-fb-text-2 truncate">
                            {conv.lastMessage}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="w-2.5 h-2.5 rounded-full bg-fb-blue shrink-0" />
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="py-6 text-center text-xs text-fb-text-2">
                      Chưa có cuộc trò chuyện nào.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              close();
              setViewingUserId(null);
              setActiveTab('feed');
            }}
            title="Thông báo"
            aria-label="Thông báo"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-fb-btn text-fb-text transition hover:bg-fb-btn-hover cursor-pointer"
          >
            <Bell className="h-5 w-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-fb-danger px-1.5 py-0.2 text-[11px] font-bold text-white">
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </span>
            )}
          </button>
          <div
            onClick={() => {
              close();
              setViewingUserId(null);
              setActiveTab('profile');
            }}
            title={currentUser.name}
            className="cursor-pointer transition hover:opacity-90"
          >
            <AvatarWithFrame user={currentUser} size="md" />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-fb-divider p-4">
        <div
          onClick={() => {
            close();
            setViewingUserId(
              post.author.id === currentUser.id ? null : post.author.id,
            );
            setActiveTab('profile');
          }}
          className="flex min-w-0 items-center gap-3 cursor-pointer"
        >
          <AvatarWithFrame user={post.author} size="md" />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-fb-text hover:underline">
              {post.author.name}
            </h3>
            <span className="flex items-center gap-1 text-xs text-fb-text-2">
              <span>{formatPostTime(post.createdAt)}</span>
              <span>·</span>
              <Globe className="h-3 w-3" />
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
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-fb-text-2 transition hover:bg-fb-hover hover:text-fb-danger cursor-pointer"
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
              className="rounded-full p-1.5 text-fb-text-2 hover:bg-fb-hover cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {post.content.trim() && <PostContent content={post.content} />}
        {post.lecturerNote && (
          <div className="rounded-lg bg-fb-blue-soft p-3 text-xs text-fb-text">
            <p className="font-semibold">Ghi chú của {post.lecturerNote.lecturerName}</p>
            <p className="mt-1 whitespace-pre-wrap">{post.lecturerNote.note}</p>
          </div>
        )}
        {sessionKind === 'api' && role === 'LECTURER' &&
          post.type === 'QUESTION_APPROVED' && post.apiTarget?.type === 'POST' && (
          <div className="space-y-2 text-xs">
            {noteEditing ? (
              <>
                <textarea aria-label="Ghi chú giảng viên" value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)} rows={3}
                  className="w-full rounded-lg border border-fb-divider bg-fb-input p-3 text-fb-text" />
                <div className="flex gap-3">
                  <button type="button" disabled={noteBusy || !noteDraft.trim()}
                    onClick={() => { setNoteBusy(true); void addLecturerNote(post.id, noteDraft)
                      .then((saved) => { if (saved) setNoteEditing(false); })
                      .finally(() => setNoteBusy(false)); }}
                    className="font-semibold text-fb-blue disabled:opacity-50">Lưu ghi chú</button>
                  <button type="button" disabled={noteBusy} onClick={() => setNoteEditing(false)}>Hủy</button>
                </div>
              </>
            ) : (
              <button type="button" onClick={() => { setNoteDraft(post.lecturerNote?.note ?? ''); setNoteEditing(true); }}
                className="font-semibold text-fb-blue hover:underline">
                {post.lecturerNote ? 'Sửa ghi chú' : 'Thêm ghi chú giảng viên'}
              </button>
            )}
          </div>
        )}
        {post.documents?.length ? (
          <PostDocuments documents={post.documents} />
        ) : null}
        {(post.likesCount > 0 || visibleCommentsCount > 0) && (
          <div className="flex items-center justify-between border-t border-fb-divider pt-2.5 text-xs text-fb-text-2">
            <div className="flex items-center gap-1.5">
              {post.likesCount > 0 && (
                <>
                  <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-fb-blue text-white">
                    <ThumbsUp className="h-2.5 w-2.5 fill-current" />
                  </span>
                  <span>{post.likesCount} lượt thích</span>
                </>
              )}
            </div>
            {visibleCommentsCount > 0 && (
              <span>{visibleCommentsCount} bình luận</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1 border-y border-fb-divider py-1 text-xs">
          <button
            type="button"
            onClick={() => toggleLikePost(post.id)}
            className={`group flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 font-semibold transition-all duration-150 cursor-pointer ${
              post.isLiked
                ? 'bg-fb-blue-soft/75 text-fb-blue hover:bg-fb-blue/25 hover:text-fb-blue hover:shadow-[0_0_12px_rgba(24,119,242,0.35)] hover:brightness-110'
                : 'text-fb-text-2 hover:bg-fb-blue-soft hover:text-fb-blue hover:shadow-[0_0_12px_rgba(24,119,242,0.22)]'
            }`}
          >
            <ThumbsUp
              className={`h-4 w-4 transition-transform duration-150 group-hover:scale-115 group-hover:-rotate-6 ${
                post.isLiked
                  ? 'fill-current text-fb-blue'
                  : 'group-hover:text-fb-blue'
              }`}
            />
            <span>Thích</span>
          </button>
          <button
            type="button"
            onClick={() => commentInputRef.current?.focus()}
            className="group flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 font-semibold text-fb-text-2 transition-all duration-150 hover:bg-fb-hover hover:text-fb-text cursor-pointer"
          >
            <MessageCircle className="h-4 w-4 transition-transform duration-150 group-hover:scale-110" />
            <span>Bình luận</span>
          </button>
        </div>
        {visibleComments.length ? (
          <CommentList
            postId={post.id}
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
            if (event.key === 'Enter') void submitComment();
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
          onClick={() => void submitComment()}
          disabled={!commentInput.trim() || commentBusy}
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
