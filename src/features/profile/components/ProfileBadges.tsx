import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { errorMessage } from '../../../api';
import { badgesApi, type BadgeResponseDto, type UserBadgeResponseDto } from '../../../api/badges';
import { useApp } from '../../demo/context/AppContext';
import { SkeletonRows } from '../../../shared/components/Skeleton';

export function ProfileBadges({ userId, isMe }: { userId: string; isMe: boolean }) {
  const { sessionKind } = useApp();
  const [earned, setEarned] = useState<UserBadgeResponseDto[] | null>(null);
  const [catalog, setCatalog] = useState<BadgeResponseDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionKind !== 'api' || !Number.isSafeInteger(Number(userId))) return;
    let cancelled = false;
    Promise.all([badgesApi.getUserBadges(Number(userId)), badgesApi.getCatalog()])
      .then(([userBadges, allBadges]) => {
        if (!cancelled) { setEarned(userBadges); setCatalog(allBadges); }
      }).catch((cause: unknown) => {
        if (!cancelled) setError(errorMessage(cause, 'Không tải được huy hiệu.'));
      });
    return () => { cancelled = true; };
  }, [sessionKind, userId]);

  if (sessionKind !== 'api') return <section className="mt-4 rounded-lg bg-fb-card p-6 text-sm text-fb-text-2">Huy hiệu demo được hiển thị trong mục Minigame.</section>;
  return <section className="mt-4 space-y-5 rounded-lg bg-fb-card p-5 shadow-fb-card">
    <h2 className="flex items-center gap-2 text-lg font-bold text-fb-text"><Award className="h-5 w-5" />Huy hiệu</h2>
    {error && <p role="alert" className="text-sm text-fb-danger">{error}</p>}
    {!earned && !error && <SkeletonRows count={3} label="Đang tải huy hiệu…" />}
    {earned && <>
      <h3 className="font-semibold text-fb-text">Đã đạt ({earned.length})</h3>
      {earned.length === 0 && <p className="text-sm text-fb-text-2">Chưa có huy hiệu.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {earned.map((badge) => <div key={badge.badge_id} className="rounded-lg border border-fb-divider p-3 text-center">
          {badge.icon_url ? <img src={badge.icon_url} alt="" className="mx-auto h-12 w-12 object-contain" /> : <Award className="mx-auto h-12 w-12 text-fb-blue" />}
          <p className="mt-2 font-semibold text-fb-text">{badge.name}</p>
          <p className="text-xs text-fb-text-2">{badge.description}</p>
        </div>)}
      </div>
      {isMe && <>
        <h3 className="font-semibold text-fb-text">Danh mục huy hiệu</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {catalog.filter((badge) => !earned.some((item) => item.badge_id === badge.badge_id))
            .map((badge) => <div key={badge.badge_id} className="rounded-lg border border-fb-divider p-3 opacity-65">
              <p className="font-semibold text-fb-text">{badge.name}</p>
              <p className="text-xs text-fb-text-2">{badge.description}</p>
            </div>)}
        </div>
      </>}
    </>}
  </section>;
}
