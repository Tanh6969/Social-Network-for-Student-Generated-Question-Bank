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
    <section className="mt-4 rounded-lg border border-fb-divider bg-fb-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-fb-divider pb-4">
        <div className="flex items-center gap-2">
          <Images className="h-5 w-5 text-fb-blue" />
          <h2 className="text-lg font-bold text-fb-text">
            Ảnh
          </h2>
        </div>
        {canAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-lg bg-fb-blue-soft px-3 py-2 text-sm font-semibold text-fb-blue hover:bg-fb-blue/20"
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
      <h3 className="mb-3 text-sm font-bold text-fb-text">
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
              className="aspect-square overflow-hidden rounded-lg bg-fb-input focus-visible:outline-2 focus-visible:outline-blue-600"
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
        <p className="rounded-lg bg-fb-inset p-6 text-center text-sm text-fb-text-2">
          {empty ?? 'Chưa có ảnh.'}
        </p>
      )}
    </div>
  );
}
