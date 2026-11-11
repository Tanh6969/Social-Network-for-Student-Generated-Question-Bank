import { useApp } from '../../demo/context/AppContext';

export function ApiProfileView() {
  const { currentUser } = useApp();

  return (
    <main className="mx-auto w-full max-w-4xl px-3 py-5 sm:px-4">
      <section className="overflow-hidden rounded-lg border border-fb-divider bg-fb-card shadow-sm">
        <div className="h-48 bg-fb-inset sm:h-64">
          <img
            src={currentUser.coverImage}
            alt="Ảnh bìa"
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="flex flex-wrap items-end gap-4 px-5 pb-5">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="-mt-12 h-24 w-24 rounded-full border-4 border-fb-card bg-fb-card object-cover sm:h-32 sm:w-32"
          />
          <div className="min-w-0 pb-1">
            <h1 className="text-2xl font-bold text-fb-text">
              {currentUser.name}
            </h1>
            <p className="text-sm text-fb-text-2">{currentUser.classOrTitle}</p>
          </div>
        </div>
        <div className="space-y-3 border-t border-fb-divider px-5 py-5 text-sm text-fb-text">
          {currentUser.bio && (
            <p className="whitespace-pre-wrap">{currentUser.bio}</p>
          )}
          {currentUser.faculty && <p>Khoa/viện: {currentUser.faculty}</p>}
          <p>Email: {currentUser.email}</p>
          <div className="flex flex-wrap gap-5 text-fb-text-2">
            <span>{currentUser.friendsCount} bạn bè</span>
            <span>{currentUser.followersCount} người theo dõi</span>
            <span>{currentUser.points} điểm</span>
          </div>
        </div>
      </section>
    </main>
  );
}
