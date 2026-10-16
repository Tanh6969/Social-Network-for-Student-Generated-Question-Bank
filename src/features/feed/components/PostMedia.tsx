export function PostMedia({
  url,
  isVideo = false,
}: {
  url: string;
  isVideo?: boolean;
}) {
  const video =
    isVideo || /^data:video\//u.test(url) || /\.(mp4|webm)(\?|$)/iu.test(url);
  return (
    <div className="overflow-hidden rounded-lg bg-gray-100 dark:bg-black">
      {video ? (
        <video src={url} controls className="max-h-96 w-full object-contain" />
      ) : (
        <img
          src={url}
          alt="Media bài viết"
          className="max-h-96 w-full object-contain"
        />
      )}
    </div>
  );
}
