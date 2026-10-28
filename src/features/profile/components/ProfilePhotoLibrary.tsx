import { ImagePlus, Images } from 'lucide-react';
import type { Post } from '../../demo/types';
import type { PhotoOption } from './ProfilePhotoEditor';

interface PostPhoto extends PhotoOption {
  post: Post;
  index: number;
}

export function ProfilePhotoLibrary({
  avatarPhotos,
  coverPhotos,
  postPhotos,
  canAdd,
  onAdd,
  onOpenProfilePhoto,
  onOpenPostPhoto,
}: {
  avatarPhotos: PhotoOption[];
  coverPhotos: PhotoOption[];
  postPhotos: PostPhoto[];
  canAdd: boolean;
  onAdd: () => void;
  onOpenProfilePhoto: (kind: 'avatar' | 'cover', index: number) => void;
  onOpenPostPhoto: (post: Post, index: number) => void;
}) {
  return (
    <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-[#242526]">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Images className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Ảnh
          </h2>
        </div>
        {canAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
          >
            <ImagePlus className="h-4 w-4" />
            Thêm ảnh
          </button>
        )}
      </div>
      <PhotoSection
        title="Ảnh từ bài viết"
        photos={postPhotos}
        onOpen={(index) => {
          const photo = postPhotos[index];
          onOpenPostPhoto(photo.post, photo.index);
        }}
        empty="Chưa có ảnh trong bài viết."
      />
      <PhotoSection
        title="Ảnh đại diện"
        photos={avatarPhotos}
        onOpen={(index) => onOpenProfilePhoto('avatar', index)}
      />
      <PhotoSection
        title="Ảnh bìa"
        photos={coverPhotos}
        onOpen={(index) => onOpenProfilePhoto('cover', index)}
      />
    </section>
  );
}

function PhotoSection({
  title,
  photos,
  onOpen,
  empty,
}: {
  title: string;
  photos: PhotoOption[];
  onOpen: (index: number) => void;
  empty?: string;
}) {
  return (
    <div className="pt-5">
      <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {photos.length ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => onOpen(index)}
              aria-label={`Xem ${photo.alt}`}
              className="aspect-square overflow-hidden rounded-lg bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:bg-gray-800"
            >
              <img
                src={photo.url}
                alt={photo.alt}
                loading="lazy"
                className="h-full w-full object-cover transition hover:scale-105"
                style={{
                  objectPosition: `${photo.crop?.x ?? 50}% ${photo.crop?.y ?? 50}%`,
                }}
              />
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500 dark:bg-[#3A3B3C]">
          {empty ?? 'Chưa có ảnh.'}
        </p>
      )}
    </div>
  );
}
