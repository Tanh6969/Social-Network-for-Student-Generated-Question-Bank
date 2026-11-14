import type { ImageCrop } from '../demo/types';

/** Xuất chính vùng đang xem trước thành ảnh để vị trí cắt được lưu trên server. */
export async function cropProfilePhoto(
  url: string,
  crop: ImageCrop,
  kind: 'avatar' | 'cover',
): Promise<File> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;
  await image.decode();

  const width = kind === 'avatar' ? 512 : 1350;
  const height = kind === 'avatar' ? 512 : 500;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');

  const zoom = Math.max(1, Math.min(2, crop.zoom));
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * zoom;
  const drawnWidth = image.naturalWidth * scale;
  const drawnHeight = image.naturalHeight * scale;
  const x = ((width - drawnWidth) * crop.x) / 100;
  const y = ((height - drawnHeight) * crop.y) / 100;
  context.drawImage(image, x, y, drawnWidth, drawnHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((result) => result
        ? resolve(result)
        : reject(new Error('Không xuất được ảnh đã cắt.')), 'image/jpeg', 0.88);
    } catch (error) {
      reject(error);
    }
  });
  return new File([blob], `${kind}.jpg`, { type: 'image/jpeg' });
}
