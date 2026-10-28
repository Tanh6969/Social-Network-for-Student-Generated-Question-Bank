import { X } from 'lucide-react';
import { PostMedia } from './PostMedia';

export function PostMediaGallery({
  urls,
  isVideo = false,
  onOpen,
  onRemove,
}: {
  urls: string[];
  isVideo?: boolean;
  onOpen?: (index: number) => void;
  onRemove?: (index: number) => void;
}) {
  if (!urls.length) return null;
  if (isVideo || urls.length === 1)
    return (
      <div className="relative">
        <PostMedia
          url={urls[0]}
          isVideo={isVideo}
          onOpen={onOpen ? () => onOpen(0) : undefined}
          isRemovable={Boolean(onRemove)}
        />
        {onRemove && <RemoveMediaButton onClick={() => onRemove(0)} />}
      </div>
    );

  return (
    <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-lg bg-gray-100 dark:bg-black">
      {(onRemove ? urls : urls.slice(0, 4)).map((url, index) => (
        <div
          key={`${index}-${url.slice(0, 32)}`}
          className={`relative aspect-square overflow-hidden ${urls.length === 3 && index === 0 ? 'col-span-2 aspect-[2/1]' : ''}`}
        >
          <button
            type="button"
            onClick={() => onOpen?.(index)}
            className="relative h-full w-full cursor-zoom-in"
            aria-label={`Xem ảnh ${index + 1} trong ${urls.length} ảnh`}
          >
            <img
              src={url}
              alt={`Ảnh bài viết ${index + 1}`}
              loading="lazy"
              className="h-full w-full object-cover object-center"
            />
            {!onRemove && index === 3 && urls.length > 4 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-3xl font-semibold text-white">
                +{urls.length - 4}
              </span>
            )}
          </button>
          {onRemove && <RemoveMediaButton onClick={() => onRemove(index)} />}
        </div>
      ))}
    </div>
  );
}

function RemoveMediaButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Gỡ ảnh hoặc video"
      className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-1 text-white hover:bg-black"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
