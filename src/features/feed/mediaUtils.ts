export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
export const MAX_POST_IMAGES = 10;
export const MAX_POST_DOCUMENTS = 10;

const DOCUMENT_EXTENSION = /\.(pdf|txt|doc|docx|xls|xlsx|ppt|pptx)$/iu;

export function validateDocumentFile(
  file: Pick<File, 'name' | 'size'>,
): string | null {
  if (!DOCUMENT_EXTENSION.test(file.name))
    return 'Chỉ hỗ trợ tài liệu PDF, TXT, Word, Excel hoặc PowerPoint.';
  if (file.size > MAX_DOCUMENT_BYTES)
    return 'Tài liệu vượt quá 15 MB. Chọn tệp khác để tiếp tục.';
  return null;
}

export type MediaKind = 'image' | 'video';

export function getMediaKind(type: string): MediaKind | null {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  return null;
}

export function validateMediaFile(
  file: Pick<File, 'type' | 'size'>,
): string | null {
  const kind = getMediaKind(file.type);
  if (!kind) return 'Chỉ hỗ trợ tệp ảnh hoặc video.';
  if (kind === 'image' && file.size > MAX_IMAGE_BYTES)
    return 'Ảnh vượt quá 4 MB. Chọn ảnh khác để tiếp tục.';
  if (kind === 'video' && file.size > MAX_VIDEO_BYTES)
    return 'Video vượt quá 10 MB. Chọn video khác để tiếp tục.';
  return null;
}

export function readMediaFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    if (getMediaKind(file.type) === 'video') {
      resolve(url);
      return;
    }
    const image = new Image();
    image.onload = () => resolve(url);
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không đọc được ảnh đã chọn.'));
    };
    image.src = url;
  });
}

export function revokeMediaUrl(url: string): void {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url);
}
