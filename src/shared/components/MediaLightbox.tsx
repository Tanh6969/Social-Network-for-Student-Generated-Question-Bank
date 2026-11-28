import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { lockPageScroll } from '../lockPageScroll';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export interface LightboxItem {
  src: string;
  kind: 'image' | 'video';
  alt: string;
}

const ZOOM_STEPS = [1, 1.25, 1.5, 2, 2.5];

export function MediaLightbox({
  items,
  initialIndex = 0,
  onClose,
  onLogoClick,
  sidebar,
}: {
  items: LightboxItem[];
  initialIndex?: number;
  onClose: () => void;
  onLogoClick?: () => void;
  sidebar?: ReactNode;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [zoomStepIndex, setZoomStepIndex] = useState(0);
  const [isStageExpanded, setIsStageExpanded] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const safeIndex = Math.min(index, items.length - 1);
  const item = items[safeIndex];
  const zoomScale = ZOOM_STEPS[zoomStepIndex] ?? 1;
  const zoomed = zoomScale > 1;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const unlockScroll = lockPageScroll();
    closeButton.current?.focus();
    return () => {
      unlockScroll();
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
        setZoomStepIndex(0);
        setIndex((current) => (current - 1 + items.length) % items.length);
      }
      if (event.key === 'ArrowRight' && items.length > 1) {
        setZoomStepIndex(0);
        setIndex((current) => (current + 1) % items.length);
      }
      if ((event.key === '+' || event.key === '=') && item?.kind === 'image') {
        setZoomStepIndex((prev) => Math.min(prev + 1, ZOOM_STEPS.length - 1));
      }
      if (event.key === '-' && item?.kind === 'image') {
        setZoomStepIndex((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [items.length, item?.kind, onClose]);

  if (!item) return null;
  const goTo = (next: number) => {
    setZoomStepIndex(0);
    setIndex((next + items.length) % items.length);
  };

  const handleZoomIn = () => {
    setZoomStepIndex((prev) => Math.min(prev + 1, ZOOM_STEPS.length - 1));
  };

  const handleZoomOut = () => {
    setZoomStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleToggleDoubleClickZoom = () => {
    setZoomStepIndex((prev) => (prev > 0 ? 0 : 2));
  };

  return createPortal(
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh và video"
      className="fixed inset-0 z-[300] flex flex-col bg-black text-white md:flex-row"
    >
      {/* Left Black Media Stage (Facebook style) */}
      <div className="relative flex min-h-0 flex-1 flex-col bg-black select-none">
        {/* Top Overlay Bar: Left (Close + Brand Logo) & Right (Zoom In, Zoom Out, Expand) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-3">
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              ref={closeButton}
              type="button"
              onClick={onClose}
              aria-label="Đóng trình xem"
              title="Đóng (Esc)"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800/80 text-white shadow-md transition hover:bg-neutral-700 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onLogoClick ?? onClose}
              aria-label="Về trang chủ UniSocial"
              title="UniSocial"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-fb-blue text-white shadow-md transition hover:brightness-110 cursor-pointer"
            >
              <span className="text-xl font-bold tracking-tighter">U</span>
            </button>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            {items.length > 1 && (
              <span className="mr-1 rounded-full bg-neutral-800/80 px-2.5 py-1 text-xs font-medium text-neutral-200">
                {safeIndex + 1} / {items.length}
              </span>
            )}
            {item.kind === 'image' && (
              <>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomStepIndex >= ZOOM_STEPS.length - 1}
                  aria-label="Phóng to ảnh"
                  title="Phóng to"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800/80 text-white shadow-md transition hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ZoomIn className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomStepIndex <= 0}
                  aria-label="Thu nhỏ ảnh"
                  title="Thu nhỏ"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800/80 text-white shadow-md transition hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ZoomOut className="h-4.5 w-4.5" />
                </button>
              </>
            )}
            {sidebar && (
              <button
                type="button"
                onClick={() => setIsStageExpanded((prev) => !prev)}
                aria-label={
                  isStageExpanded ? 'Thu nhỏ khung xem' : 'Mở rộng toàn màn hình'
                }
                title={
                  isStageExpanded ? 'Hiện cột bình luận' : 'Xem toàn màn hình'
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800/80 text-white shadow-md transition hover:bg-neutral-700 cursor-pointer"
              >
                {isStageExpanded ? (
                  <Minimize2 className="h-4.5 w-4.5" />
                ) : (
                  <Maximize2 className="h-4.5 w-4.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Center Media Container */}
        <div
          className="flex min-h-[52vh] flex-1 items-center justify-center overflow-auto md:min-h-0 md:h-full"
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
              className="max-h-full max-w-full object-contain object-center"
            />
          ) : (
            <img
              key={item.src}
              src={item.src}
              alt={item.alt}
              onDoubleClick={handleToggleDoubleClickZoom}
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'center center',
              }}
              className={`max-h-[60vh] md:max-h-screen w-auto max-w-full object-contain object-center transition-transform duration-200 ${
                zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            />
          )}
        </div>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(safeIndex - 1)}
              aria-label="Ảnh trước"
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800/75 text-white shadow-lg transition hover:bg-neutral-700 hover:scale-105 cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => goTo(safeIndex + 1)}
              aria-label="Ảnh tiếp theo"
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800/75 text-white shadow-lg transition hover:bg-neutral-700 hover:scale-105 cursor-pointer"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {sidebar && !isStageExpanded && (
        <aside className="max-h-[45vh] w-full overflow-y-auto border-l border-fb-divider bg-fb-card text-fb-text md:max-h-none md:h-screen md:w-[360px] lg:w-[380px] shrink-0">
          {sidebar}
        </aside>
      )}
    </div>,
    document.body,
  );
}
