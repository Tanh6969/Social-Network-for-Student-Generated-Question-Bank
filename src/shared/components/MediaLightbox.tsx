import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';

export interface LightboxItem {
  src: string;
  kind: 'image' | 'video';
  alt: string;
}

export function MediaLightbox({
  items,
  initialIndex = 0,
  onClose,
  sidebar,
}: {
  items: LightboxItem[];
  initialIndex?: number;
  onClose: () => void;
  sidebar?: ReactNode;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const safeIndex = Math.min(index, items.length - 1);
  const item = items[safeIndex];

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const focusable = dialog.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled])',
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      if (
        (event.target as HTMLElement).closest(
          'input, textarea, [contenteditable="true"]',
        )
      )
        return;
      if (event.key === 'ArrowLeft' && items.length > 1) {
        setZoomed(false);
        setIndex((current) => (current - 1 + items.length) % items.length);
      }
      if (event.key === 'ArrowRight' && items.length > 1) {
        setZoomed(false);
        setIndex((current) => (current + 1) % items.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [items.length, onClose]);

  if (!item) return null;
  const goTo = (next: number) => {
    setZoomed(false);
    setIndex((next + items.length) % items.length);
  };

  return createPortal(
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh và video"
      className="fixed inset-0 z-[300] flex flex-col bg-black text-white md:flex-row"
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-3">
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label="Đóng trình xem"
            className="rounded-full bg-black/40 p-2 hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            {items.length > 1 && (
              <span className="text-sm">
                {safeIndex + 1} / {items.length}
              </span>
            )}
            {item.kind === 'image' && (
              <button
                type="button"
                onClick={() => setZoomed((value) => !value)}
                aria-label={zoomed ? 'Thu nhỏ ảnh' : 'Phóng to ảnh'}
                className="rounded-full bg-black/40 p-2 hover:bg-white/20"
              >
                {zoomed ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>
        <div
          className="flex min-h-[45vh] flex-1 items-center justify-center overflow-auto p-3 pt-14 md:min-h-0"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
          onTouchStart={(event) => {
            touchStartX.current = event.changedTouches[0]?.screenX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = touchStartX.current;
            const end = event.changedTouches[0]?.screenX;
            touchStartX.current = null;
            if (
              start !== null &&
              end !== undefined &&
              Math.abs(end - start) > 60 &&
              items.length > 1 &&
              item.kind === 'image' &&
              !zoomed
            )
              goTo(safeIndex + (end < start ? 1 : -1));
          }}
        >
          {item.kind === 'video' ? (
            <video
              key={item.src}
              src={item.src}
              controls
              playsInline
              preload="metadata"
              className="max-h-[55vh] max-w-full object-contain object-center md:max-h-[85vh]"
            />
          ) : (
            <img
              key={item.src}
              src={item.src}
              alt={item.alt}
              onDoubleClick={() => setZoomed((value) => !value)}
              className={`max-h-[55vh] max-w-full object-contain object-center transition-transform md:max-h-[85vh] ${zoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
            />
          )}
        </div>
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(safeIndex - 1)}
              aria-label="Ảnh trước"
              className="absolute left-3 top-1/2 rounded-full bg-black/55 p-2 hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => goTo(safeIndex + 1)}
              aria-label="Ảnh tiếp theo"
              className="absolute right-3 top-1/2 rounded-full bg-black/55 p-2 hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
      {sidebar && (
        <aside className="max-h-[40vh] w-full overflow-y-auto bg-white text-gray-900 dark:bg-[#242526] dark:text-gray-100 md:max-h-none md:w-[400px]">
          {sidebar}
        </aside>
      )}
    </div>,
    document.body,
  );
}
