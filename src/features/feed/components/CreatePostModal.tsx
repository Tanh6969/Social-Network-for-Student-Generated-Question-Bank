import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useApp } from '../../demo/context/AppContext';
import type { Post } from '../../demo/types';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import { MediaLightbox } from '../../../shared/components/MediaLightbox';
import {
  countWords,
  getPostContentIssue,
  limitPostContent,
  MAX_POST_WORDS,
  type PostContentIssue,
} from '../postUtils';
import {
  getMediaKind,
  MAX_POST_IMAGES,
  readMediaFile,
  revokeMediaUrl,
  validateMediaFile,
} from '../mediaUtils';
import { PostMediaGallery } from './PostMediaGallery';

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
  const newMediaUrls = useRef(new Set<string>());
  const composerClosed = useRef(false);
  const [content, setContent] = useState(editingPost?.content ?? '');
  const [limitIssue, setLimitIssue] = useState<PostContentIssue | null>(null);
  const [privacy, setPrivacy] = useState<Post['privacy']>(
    editingPost?.privacy ?? 'PUBLIC',
  );
  const [subjectTag, setSubjectTag] = useState(
    editingPost?.subjectTag ?? 'Mạng máy tính',
  );
  const [mediaUrls, setMediaUrls] = useState(editingPost?.mediaUrls ?? []);
  const [mediaType, setMediaType] = useState<'image' | 'video'>(
    editingPost?.type === 'VIDEO' ? 'video' : 'image',
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const wordCount = countWords(content);
  const contentIssue = getPostContentIssue(content);
  const wordsRemaining = MAX_POST_WORDS - wordCount;
  const showRemaining =
    wordsRemaining <= 20 || Boolean(contentIssue || limitIssue);
  const ringIsRed = wordsRemaining <= 0 || Boolean(contentIssue || limitIssue);
  const ringIsAmber = !ringIsRed && wordsRemaining <= 20;
  const ringCircumference = 2 * Math.PI * 15;
  const ringProgress = Math.min(wordCount / MAX_POST_WORDS, 1);

  useEffect(() => {
    const ownedUrls = newMediaUrls.current;
    composerClosed.current = false;
    return () => {
      composerClosed.current = true;
      ownedUrls.forEach(revokeMediaUrl);
      ownedUrls.clear();
    };
  }, []);

  const handleContentChange = (value: string) => {
    const limited = limitPostContent(value);
    setContent(limited.content);
    setLimitIssue(limited.issue);
  };

  const handleFiles = async (files?: FileList | null) => {
    if (!files?.length) return;
    setFileError(null);
    const selectedFiles = Array.from(files);
    const invalid = selectedFiles.map(validateMediaFile).find(Boolean);
    if (invalid) {
      setFileError(invalid);
      showToast(invalid, 'warning');
    }
    const selected = selectedFiles.filter((file) => !validateMediaFile(file));
    if (!selected.length) return;
    const selectedKind = getMediaKind(selected[0].type);
    if (
      selected.some((file) => getMediaKind(file.type) !== selectedKind) ||
      (mediaUrls.length > 0 && selectedKind !== mediaType)
    ) {
      setFileError('Chọn ảnh hoặc video riêng cho mỗi bài viết.');
      return;
    }
    if (
      selectedKind === 'video' &&
      (selected.length > 1 || mediaUrls.length > 0)
    ) {
      setFileError('Mỗi bài viết chỉ chứa một video.');
      return;
    }
    if (
      selectedKind === 'image' &&
      mediaUrls.length + selected.length > MAX_POST_IMAGES
    ) {
      setFileError(`Mỗi bài viết tối đa ${MAX_POST_IMAGES} ảnh.`);
      return;
    }
    setIsReadingFiles(true);
    try {
      const results = await Promise.allSettled(selected.map(readMediaFile));
      const nextUrls = results
        .filter(
          (result): result is PromiseFulfilledResult<string> =>
            result.status === 'fulfilled',
        )
        .map((result) => result.value);
      if (composerClosed.current) {
        nextUrls.forEach(revokeMediaUrl);
        return;
      }
      nextUrls.forEach((url) => newMediaUrls.current.add(url));
      if (nextUrls.length) {
        setMediaUrls((current) => [...current, ...nextUrls]);
        setMediaType(selectedKind ?? 'image');
      }
      if (results.some((result) => result.status === 'rejected'))
        setFileError('Không đọc được một số tệp đã chọn.');
    } catch {
      setFileError('Không đọc được tệp đã chọn. Hãy thử lại.');
    } finally {
      setIsReadingFiles(false);
    }
  };

  const handleSave = () => {
    if (
      (!content.trim() && !mediaUrls.length) ||
      contentIssue ||
      isReadingFiles
    )
      return;
    newMediaUrls.current.clear();
    if (editingPost) {
      updatePost(editingPost.id, {
        content: content.trim(),
        privacy,
        mediaUrls,
        type:
          editingPost.type === 'QUESTION_APPROVED'
            ? editingPost.type
            : mediaType === 'video' && mediaUrls.length
              ? 'VIDEO'
              : 'KNOWLEDGE',
      });
    } else {
      createPost({
        content: content.trim(),
        privacy,
        subjectTag,
        mediaUrls,
        type: mediaType === 'video' && mediaUrls.length ? 'VIDEO' : 'KNOWLEDGE',
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
          <PostMediaGallery
            urls={mediaUrls}
            isVideo={mediaType === 'video'}
            onOpen={setPreviewIndex}
            onRemove={(index) => {
              const removed = mediaUrls[index];
              if (removed && newMediaUrls.current.delete(removed))
                revokeMediaUrl(removed);
              setMediaUrls((current) =>
                current.filter((_, itemIndex) => itemIndex !== index),
              );
              setFileError(null);
            }}
          />
          <input
            ref={fileInput}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(event) => {
              void handleFiles(event.target.files);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-[#3A3B3C]"
          >
            <ImagePlus className="h-4 w-4 text-emerald-600" />
            Thêm ảnh/video
          </button>
          {fileError && (
            <p
              role="alert"
              className="text-xs font-medium text-red-600 dark:text-red-400"
            >
              {fileError}
            </p>
          )}
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
            disabled={
              (!content.trim() && !mediaUrls.length) ||
              Boolean(contentIssue) ||
              isReadingFiles
            }
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-700"
          >
            {editingPost ? 'Lưu thay đổi' : 'Đăng bài viết'}
          </button>
        </div>
      </div>
      {previewIndex !== null && mediaUrls.length > 0 && (
        <MediaLightbox
          items={mediaUrls.map((src, index) => ({
            src,
            kind: mediaType,
            alt: `Ảnh đã chọn ${index + 1}`,
          }))}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </div>
  );
}
