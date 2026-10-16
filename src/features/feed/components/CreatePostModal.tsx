import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useApp } from '../../demo/context/AppContext';
import type { Post } from '../../demo/types';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import {
  countWords,
  getPostContentIssue,
  limitPostContent,
  MAX_POST_WORDS,
  type PostContentIssue,
} from '../postUtils';
import { PostMedia } from './PostMedia';

export function CreatePostModal() {
  const { isCreatePostModalOpen, editingPostId, posts } = useApp();
  if (!isCreatePostModalOpen) return null;
  const editingPost = posts.find((post) => post.id === editingPostId);
  return (
    <PostComposer key={editingPostId ?? 'new'} editingPost={editingPost} />
  );
}

function PostComposer({ editingPost }: { editingPost?: Post }) {
  const { currentUser, createPost, updatePost, closePostComposer, showToast } =
    useApp();
  const fileInput = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState(editingPost?.content ?? '');
  const [limitIssue, setLimitIssue] = useState<PostContentIssue | null>(null);
  const [privacy, setPrivacy] = useState<Post['privacy']>(
    editingPost?.privacy ?? 'PUBLIC',
  );
  const [subjectTag, setSubjectTag] = useState(
    editingPost?.subjectTag ?? 'Mạng máy tính',
  );
  const [mediaUrl, setMediaUrl] = useState(editingPost?.mediaUrls?.[0] ?? '');
  const [mediaType, setMediaType] = useState<'image' | 'video'>(
    editingPost?.type === 'VIDEO' ? 'video' : 'image',
  );
  const wordCount = countWords(content);
  const contentIssue = getPostContentIssue(content);
  const wordsRemaining = MAX_POST_WORDS - wordCount;
  const showRemaining =
    wordsRemaining <= 20 || Boolean(contentIssue || limitIssue);
  const ringIsRed = wordsRemaining <= 0 || Boolean(contentIssue || limitIssue);
  const ringIsAmber = !ringIsRed && wordsRemaining <= 20;
  const ringCircumference = 2 * Math.PI * 15;
  const ringProgress = Math.min(wordCount / MAX_POST_WORDS, 1);

  const handleContentChange = (value: string) => {
    const limited = limitPostContent(value);
    setContent(limited.content);
    setLimitIssue(limited.issue);
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      showToast('Chỉ hỗ trợ ảnh và video.', 'warning');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Media demo tối đa 10 MB.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMediaUrl(reader.result);
        setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      }
    };
    reader.onerror = () => showToast('Không đọc được tệp media.', 'error');
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!content.trim() || contentIssue) return;
    const mediaUrls = mediaUrl ? [mediaUrl] : [];
    if (editingPost) {
      updatePost(editingPost.id, {
        content: content.trim(),
        privacy,
        mediaUrls,
        type:
          editingPost.type === 'QUESTION_APPROVED'
            ? editingPost.type
            : mediaType === 'video' && mediaUrl
              ? 'VIDEO'
              : 'KNOWLEDGE',
      });
    } else {
      createPost({
        content: content.trim(),
        privacy,
        subjectTag,
        mediaUrls,
        type: mediaType === 'video' && mediaUrl ? 'VIDEO' : 'KNOWLEDGE',
      });
    }
    closePostComposer();
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-composer-title"
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#242526]"
      >
        <div className="relative flex items-center border-b border-gray-200 p-4 dark:border-gray-700">
          <h2
            id="post-composer-title"
            className="flex-1 text-center text-base font-bold text-gray-900 dark:text-gray-100"
          >
            {editingPost ? 'Chỉnh sửa bài viết' : 'Tạo bài viết'}
          </h2>
          <button
            type="button"
            onClick={closePostComposer}
            aria-label="Đóng"
            className="absolute right-3 rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[75vh] space-y-4 overflow-y-auto p-4">
          <div className="flex items-center gap-3">
            <AvatarWithFrame user={currentUser} size="md" />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {currentUser.name}
              </p>
              <select
                value={privacy}
                onChange={(event) =>
                  setPrivacy(event.target.value as Post['privacy'])
                }
                aria-label="Ai có thể xem bài viết"
                className="rounded-md bg-gray-100 px-2 py-1 text-xs dark:bg-[#3A3B3C]"
              >
                <option value="PUBLIC">Công khai</option>
                <option value="FRIENDS">Bạn bè</option>
                <option value="ONLY_ME">Chỉ mình tôi</option>
              </select>
            </div>
          </div>
          {!editingPost && (
            <select
              value={subjectTag}
              onChange={(event) => setSubjectTag(event.target.value)}
              aria-label="Môn học"
              className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            >
              <option>Mạng máy tính</option>
              <option>Cấu trúc dữ liệu & Giải thuật</option>
              <option>Cơ sở dữ liệu</option>
              <option>Giải tích 1</option>
            </select>
          )}
          <label htmlFor="post-content" className="sr-only">
            Nội dung bài viết
          </label>
          <textarea
            id="post-content"
            autoFocus
            rows={6}
            value={content}
            onChange={(event) => handleContentChange(event.target.value)}
            aria-describedby={
              contentIssue || limitIssue ? 'post-content-error' : undefined
            }
            aria-invalid={Boolean(limitIssue || contentIssue)}
            placeholder="Bạn muốn chia sẻ điều gì?"
            className={`w-full resize-none rounded-lg bg-transparent text-sm leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 ${contentIssue ? 'ring-1 ring-red-500' : ''}`}
          />
          {(contentIssue || limitIssue) && (
            <p
              id="post-content-error"
              role="alert"
              className="text-xs font-medium text-red-600 dark:text-red-400"
            >
              {contentIssue === 'words'
                ? 'Bài viết vượt giới hạn 500 từ. Hãy rút ngắn để đăng.'
                : contentIssue === 'wordLength' || limitIssue === 'wordLength'
                  ? 'Một từ quá dài. Phần vượt giới hạn đã được cắt.'
                  : 'Bài viết quá dài. Phần vượt giới hạn đã được cắt.'}
            </p>
          )}
          {mediaUrl && (
            <div className="relative">
              <PostMedia url={mediaUrl} isVideo={mediaType === 'video'} />
              <button
                type="button"
                onClick={() => setMediaUrl('')}
                aria-label="Gỡ media"
                className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-[#3A3B3C]"
          >
            <ImagePlus className="h-4 w-4 text-emerald-600" />
            {mediaUrl ? 'Thay ảnh/video' : 'Thêm ảnh/video'}
          </button>
        </div>
        <div className="flex items-center gap-4 border-t border-gray-100 p-4 dark:border-gray-700">
          <div
            className="relative h-10 w-10 shrink-0"
            role="img"
            aria-label={
              wordsRemaining < 0
                ? `Bài viết vượt giới hạn ${-wordsRemaining} từ`
                : `Còn ${wordsRemaining} từ trước giới hạn bài viết`
            }
          >
            <svg
              viewBox="0 0 40 40"
              className="h-full w-full -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="20"
                cy="20"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-200 dark:text-gray-600"
              />
              <circle
                cx="20"
                cy="20"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringCircumference * (1 - ringProgress)}
                className={
                  ringIsRed
                    ? 'text-red-500'
                    : ringIsAmber
                      ? 'text-amber-500'
                      : 'text-blue-500'
                }
              />
            </svg>
            {showRemaining && (
              <span
                className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${ringIsRed ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}
              >
                {contentIssue && contentIssue !== 'words'
                  ? '!'
                  : wordsRemaining}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!content.trim() || Boolean(contentIssue)}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-700"
          >
            {editingPost ? 'Lưu thay đổi' : 'Đăng bài viết'}
          </button>
        </div>
      </div>
    </div>
  );
}
