import { useRef } from 'react';
import { Maximize2 } from 'lucide-react';

export function PostMedia({
  url,
  isVideo = false,
  onOpen,
  isRemovable = false,
}: {
  url: string;
  isVideo?: boolean;
  onOpen?: () => void;
  isRemovable?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const video =
    isVideo || /^data:video\//u.test(url) || /\.(mp4|webm)(\?|$)/iu.test(url);
  return (
    <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-black">
      {video ? (
        <>
          <video
            ref={videoRef}
            src={url}
            controls
            playsInline
            preload="metadata"
            className="max-h-[28rem] w-full object-contain object-center"
          />
          {onOpen && (
            <button
              type="button"
              onClick={() => {
                videoRef.current?.pause();
                onOpen();
              }}
              aria-label="Mở video lớn"
              className={`absolute top-2 rounded-full bg-black/70 p-2 text-white hover:bg-black ${isRemovable ? 'left-2' : 'right-2'}`}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="block w-full cursor-zoom-in"
          aria-label="Mở ảnh lớn"
        >
          <img
            src={url}
            alt="Ảnh bài viết"
            loading="lazy"
            className="aspect-[4/3] max-h-[28rem] w-full object-cover object-center"
          />
        </button>
      )}
    </div>
  );
}
