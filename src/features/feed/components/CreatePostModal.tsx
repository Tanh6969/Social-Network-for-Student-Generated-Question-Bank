import { useEffect, useRef, useState } from 'react';
import { FileText, ImagePlus, Video, X } from 'lucide-react';
import { useApp } from '../../demo/context/AppContext';
import type { Post, PostDocument } from '../../demo/types';
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
  MAX_POST_DOCUMENTS,
  MAX_POST_IMAGES,
  readMediaFile,
  revokeMediaUrl,
  validateMediaFile,
  validateDocumentFile,
} from '../mediaUtils';
import { PostMediaGallery } from './PostMediaGallery';
import { PostDocuments } from './PostDocuments';

export function CreatePostModal() {
  const { isCreatePostModalOpen, editingPostId, composerMediaKind, posts } =
    useApp();
  if (!isCreatePostModalOpen) return null;
  const editingPost = posts.find((post) => post.id === editingPostId);
  return (
    <PostComposer
      key={`${editingPostId ?? 'new'}-${composerMediaKind ?? 'text'}`}
      editingPost={editingPost}
      initialMediaKind={composerMediaKind}
    />
  );
}

function PostComposer({
  editingPost,
  initialMediaKind,
}: {
  editingPost?: Post;
  initialMediaKind: 'image' | 'video' | 'document' | null;
}) {
  const { currentUser, createPost, updatePost, closePostComposer, showToast } =
    useApp();
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const documentInput = useRef<HTMLInputElement>(null);
  const newMediaUrls = useRef(new Set<string>());
  const composerClosed = useRef(false);
  const [content, setContent] = useState(editingPost?.content ?? '');
  const [limitIssue, setLimitIssue] = useState<PostContentIssue | null>(null);
  const privacy = editingPost?.privacy ?? 'PUBLIC';
  const [mediaUrls, setMediaUrls] = useState(editingPost?.mediaUrls ?? []);
  const [documents, setDocuments] = useState<PostDocument[]>(
    editingPost?.documents ?? [],
  );
  const [mediaType, setMediaType] = useState<'image' | 'video'>(
    editingPost?.type === 'VIDEO'
      ? 'video'
      : initialMediaKind === 'video'
        ? 'video'
        : 'image',
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const wordCount = countWords(content);
  const contentIssue = getPostContentIssue(content);
  const countIsRed =
    wordCount >= MAX_POST_WORDS || Boolean(contentIssue || limitIssue);
  const showImageAndDocumentActions = initialMediaKind !== 'video';
  const showVideoAction =
    initialMediaKind === null || initialMediaKind === 'video';

  useEffect(() => {
    const ownedUrls = newMediaUrls.current;
    composerClosed.current = false;
    return () => {
      composerClosed.current = true;
      ownedUrls.forEach(revokeMediaUrl);
      ownedUrls.clear();
    };
  }, []);

  useEffect(() => {
    if (editingPost || !initialMediaKind) return;
    const frame = requestAnimationFrame(() => {
      (initialMediaKind === 'image'
        ? imageInput
        : initialMediaKind === 'video'
          ? videoInput
          : documentInput
      ).current?.click();
    });
    return () => cancelAnimationFrame(frame);
  }, [editingPost, initialMediaKind]);

  const handleContentChange = (value: string) => {
    const limited = limitPostContent(value);
    setContent(limited.content);
    setLimitIssue(limited.issue);
  };

  const handleFiles = async (
    files: FileList | null,
    expectedKind: 'image' | 'video',
  ) => {
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
      selectedKind !== expectedKind ||
      selected.some((file) => getMediaKind(file.type) !== selectedKind) ||
      (mediaUrls.length > 0 && selectedKind !== mediaType)
    ) {
      setFileError(
        mediaUrls.length > 0 && selectedKind !== mediaType
          ? 'Gỡ media hiện tại trước khi đổi sang loại khác.'
          : expectedKind === 'image'
            ? 'Chỉ chọn tệp ảnh.'
            : 'Chỉ chọn tệp video.',
      );
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
        setMediaType(expectedKind);
      }
      if (results.some((result) => result.status === 'rejected'))
        setFileError('Không đọc được một số tệp đã chọn.');
    } catch {
      setFileError('Không đọc được tệp đã chọn. Hãy thử lại.');
    } finally {
      setIsReadingFiles(false);
    }
  };

  const handleDocuments = (files: FileList | null) => {
    if (!files?.length) return;
    setFileError(null);
    const selectedFiles = Array.from(files);
    const invalid = selectedFiles.map(validateDocumentFile).find(Boolean);
    if (invalid) {
      setFileError(invalid);
      showToast(invalid, 'warning');
    }
    const valid = selectedFiles.filter((file) => !validateDocumentFile(file));
    if (documents.length + valid.length > MAX_POST_DOCUMENTS) {
      setFileError(`Mỗi bài viết tối đa ${MAX_POST_DOCUMENTS} tài liệu.`);
      return;
    }
    const nextDocuments: PostDocument[] = [];
    try {
      valid.forEach((file) => {
        const url = URL.createObjectURL(file);
        newMediaUrls.current.add(url);
        nextDocuments.push({
          name: file.name,
          url,
          size: file.size,
          mimeType: file.type,
        });
      });
      setDocuments((current) => [...current, ...nextDocuments]);
    } catch {
      nextDocuments.forEach((document) => {
        newMediaUrls.current.delete(document.url);
        revokeMediaUrl(document.url);
      });
      setFileError('Không đọc được tài liệu đã chọn. Hãy thử lại.');
    }
  };

  const handleSave = () => {
    if (
      (!content.trim() && !mediaUrls.length && !documents.length) ||
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
        documents,
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
        mediaUrls,
        documents,
        type: mediaType === 'video' && mediaUrls.length ? 'VIDEO' : 'KNOWLEDGE',
      });
    }
    closePostComposer();
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-composer-title"
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#242526]"
      >
        <div className="relative flex items-center border-b border-gray-200 p-4 dark:border-gray-700">
          <h2
            id="post-composer-title"
            className="flex-1 text-center text-base font-bold text-fb-text"
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
            <p className="text-sm font-bold text-fb-text">
              {currentUser.name}
            </p>
          </div>
          <label htmlFor="post-content" className="sr-only">
            Nội dung bài viết
          </label>
          <div className="relative">
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
              className={`w-full resize-none rounded-lg bg-transparent pb-7 text-sm leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 ${contentIssue ? 'ring-1 ring-red-500' : ''}`}
            />
            <span
              aria-label={`${wordCount} trên ${MAX_POST_WORDS} từ`}
              className={`pointer-events-none absolute bottom-2 right-2 text-xs tabular-nums ${countIsRed ? 'font-semibold text-red-600 dark:text-red-400' : 'text-fb-text-2'}`}
            >
              {wordCount}/{MAX_POST_WORDS}
            </span>
          </div>
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
          <PostDocuments
            documents={documents}
            onRemove={(index) => {
              const removed = documents[index];
              if (removed && newMediaUrls.current.delete(removed.url))
                revokeMediaUrl(removed.url);
              setDocuments((current) =>
                current.filter((_, itemIndex) => itemIndex !== index),
              );
              setFileError(null);
            }}
          />
          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              void handleFiles(event.target.files, 'image');
              event.target.value = '';
            }}
          />
          <input
            ref={videoInput}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(event) => {
              void handleFiles(event.target.files, 'video');
              event.target.value = '';
            }}
          />
          <input
            ref={documentInput}
            type="file"
            accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            multiple
            className="hidden"
            onChange={(event) => {
              handleDocuments(event.target.files);
              event.target.value = '';
            }}
          />
          <div className="flex flex-wrap gap-2">
            {showImageAndDocumentActions &&
              (mediaUrls.length === 0 || mediaType === 'image') && (
                <button
                  type="button"
                  onClick={() => imageInput.current?.click()}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-fb-hover ${mediaType === 'image' && initialMediaKind === 'image' ? 'border-blue-500 text-blue-600' : 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-200'}`}
                >
                  <ImagePlus className="h-4 w-4 text-emerald-600" />
                  Thêm ảnh
                </button>
              )}
            {showVideoAction &&
              (mediaUrls.length === 0 || mediaType === 'video') && (
                <button
                  type="button"
                  onClick={() => videoInput.current?.click()}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-fb-hover ${mediaType === 'video' && initialMediaKind === 'video' ? 'border-blue-500 text-blue-600' : 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-200'}`}
                >
                  <Video className="h-4 w-4 text-blue-600" />
                  Thêm video
                </button>
              )}
            {showImageAndDocumentActions && (
              <button
                type="button"
                onClick={() => documentInput.current?.click()}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-fb-hover ${initialMediaKind === 'document' ? 'border-blue-500 text-blue-600' : 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-200'}`}
              >
                <FileText className="h-4 w-4 text-blue-600" />
                Thêm tài liệu
              </button>
            )}
          </div>
          {fileError && (
            <p
              role="alert"
              className="text-xs font-medium text-red-600 dark:text-red-400"
            >
              {fileError}
            </p>
          )}
        </div>
        <div className="border-t border-gray-100 p-4 dark:border-gray-700">
          <button
            type="button"
            onClick={handleSave}
            disabled={
              (!content.trim() && !mediaUrls.length && !documents.length) ||
              Boolean(contentIssue) ||
              isReadingFiles
            }
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-700"
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
