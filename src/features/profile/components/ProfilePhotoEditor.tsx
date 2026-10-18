import { useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, X } from 'lucide-react';
import type { ImageCrop } from '../../demo/types';
import {
  getMediaKind,
  readMediaFile,
  revokeMediaUrl,
  validateMediaFile,
} from '../../feed/mediaUtils';

export interface PhotoOption {
  id: string;
  url: string;
  alt: string;
  crop?: ImageCrop;
}

const CENTER: ImageCrop = { x: 50, y: 50, zoom: 1 };

export function ProfilePhotoEditor({
  kind,
  initialUrl,
  initialCrop,
  options,
  onSave,
  onClose,
}: {
  kind: 'avatar' | 'cover';
  initialUrl: string;
  initialCrop?: ImageCrop;
  options: PhotoOption[];
  onSave: (url: string, crop: ImageCrop) => void;
  onClose: () => void;
}) {
  const [selectedUrl, setSelectedUrl] = useState(initialUrl);
  const [crop, setCrop] = useState<ImageCrop>(initialCrop ?? CENTER);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{
    clientX: number;
    clientY: number;
    crop: ImageCrop;
  } | null>(null);
  const ownedUrls = useRef(new Set<string>());
  const closed = useRef(false);
  const changed =
    selectedUrl !== initialUrl ||
    crop.x !== (initialCrop?.x ?? 50) ||
    crop.y !== (initialCrop?.y ?? 50) ||
    crop.zoom !== (initialCrop?.zoom ?? 1);

  useEffect(() => {
    const urls = ownedUrls.current;
    const previousOverflow = document.body.style.overflow;
    closed.current = false;
    document.body.style.overflow = 'hidden';
    return () => {
      closed.current = true;
      document.body.style.overflow = previousOverflow;
      urls.forEach(revokeMediaUrl);
      urls.clear();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const chooseUrl = (url: string) => {
    if (ownedUrls.current.has(selectedUrl)) {
      ownedUrls.current.delete(selectedUrl);
      revokeMediaUrl(selectedUrl);
    }
    setSelectedUrl(url);
    setCrop(CENTER);
    setError(null);
  };

  const chooseFile = async (file?: File) => {
    if (!file) return;
    const issue = validateMediaFile(file);
    if (getMediaKind(file.type) !== 'image' || issue) {
      setError(issue ?? 'Chỉ chọn tệp ảnh.');
      return;
    }
    setReading(true);
    setError(null);
    try {
      const url = await readMediaFile(file);
      if (closed.current) {
        revokeMediaUrl(url);
        return;
      }
      chooseUrl(url);
      ownedUrls.current.add(url);
    } catch {
      setError('Không đọc được ảnh đã chọn. Hãy thử ảnh khác.');
    } finally {
      setReading(false);
    }
  };

  const save = () => {
    if (!changed || reading) return;
    ownedUrls.current.delete(selectedUrl);
    onSave(selectedUrl, crop);
  };

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-photo-editor-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#242526]"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h2
            id="profile-photo-editor-title"
            className="font-bold text-gray-900 dark:text-gray-100"
          >
            {kind === 'avatar' ? 'Cập nhật ảnh đại diện' : 'Cập nhật ảnh bìa'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng trình chỉnh ảnh"
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 overflow-y-auto p-5">
          <div className="flex justify-center bg-gray-100 p-5 dark:bg-[#18191A]">
            <div
              ref={previewRef}
              onPointerDown={(event) => {
                dragStart.current = {
                  clientX: event.clientX,
                  clientY: event.clientY,
                  crop,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const start = dragStart.current;
                const bounds = previewRef.current?.getBoundingClientRect();
                if (!start || !bounds) return;
                setCrop((current) => ({
                  ...current,
                  x: Math.max(
                    0,
                    Math.min(
                      100,
                      start.crop.x -
                        ((event.clientX - start.clientX) / bounds.width) * 100,
                    ),
                  ),
                  y: Math.max(
                    0,
                    Math.min(
                      100,
                      start.crop.y -
                        ((event.clientY - start.clientY) / bounds.height) * 100,
                    ),
                  ),
                }));
              }}
              onPointerUp={() => {
                dragStart.current = null;
              }}
              onPointerCancel={() => {
                dragStart.current = null;
              }}
              className={`relative cursor-grab touch-none overflow-hidden bg-gray-200 active:cursor-grabbing ${kind === 'avatar' ? 'h-56 w-56 rounded-full' : 'aspect-[2.7/1] w-full max-w-2xl rounded-xl'}`}
              aria-label="Kéo ảnh để căn vị trí"
            >
              <img
                src={selectedUrl}
                alt="Xem trước ảnh"
                draggable={false}
                className="h-full w-full select-none object-cover"
                style={{
                  objectPosition: `${crop.x}% ${crop.y}%`,
                  transform: `scale(${crop.zoom})`,
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label
              htmlFor="profile-photo-zoom"
              className="shrink-0 text-sm text-gray-600 dark:text-gray-300"
            >
              Thu phóng
            </label>
            <input
              id="profile-photo-zoom"
              type="range"
              min="1"
              max="2"
              step="0.05"
              value={crop.zoom}
              onChange={(event) =>
                setCrop((current) => ({
                  ...current,
                  zoom: Number(event.target.value),
                }))
              }
              className="w-full accent-blue-600"
            />
            <button
              type="button"
              onClick={() => setCrop(CENTER)}
              aria-label="Đặt ảnh về giữa"
              className="rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void chooseFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={reading}
              className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
            >
              <Camera className="h-4 w-4" />
              Tải ảnh từ máy
            </button>
            {reading && (
              <span className="text-sm text-gray-500">Đang đọc ảnh…</span>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          {options.length > 0 && (
            <section aria-label="Ảnh của bạn" className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Ảnh của bạn
              </h3>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => chooseUrl(option.url)}
                    aria-label={`Chọn ${option.alt}`}
                    aria-pressed={selectedUrl === option.url}
                    className={`aspect-square overflow-hidden rounded-lg border-2 ${selectedUrl === option.url ? 'border-blue-600' : 'border-transparent'}`}
                  >
                    <img
                      src={option.url}
                      alt={option.alt}
                      className="h-full w-full object-cover object-center"
                    />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!changed || reading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            Lưu ảnh
          </button>
        </div>
      </div>
    </div>
  );
}
