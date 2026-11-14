import React, { useCallback, useEffect, useState } from 'react';
import { Award, Crown, Flame, Gamepad2, History, Trophy } from 'lucide-react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import { errorMessage, isApiSession } from '../../../api';
import type {
  CheckInStatusResponse,
  GamePredictionResponse,
  LeaderboardEntryDto,
  MyRankDto,
  UserBadgeResponseDto,
} from '../../../api/games';
import { LecturerGameHub } from '../../lecturer/components/games/LecturerGameHub';
import { demoProfileIdForUser } from '../demoGameStore';
import { gamesGateway } from '../gamesGateway';
import { LeaderboardPanel } from './LeaderboardPanel';
import { PredictionHistory } from './PredictionHistory';
import { StudentGameCenter } from './StudentGameCenter';
import { CardListSkeleton, SkeletonRows } from '../../../shared/components/Skeleton';

type StudentMenu = 'CENTER' | 'LEADERBOARD' | 'BADGES' | 'HISTORY';

const MENU: { id: StudentMenu; label: string; icon: React.ElementType }[] = [
  { id: 'CENTER', label: 'Trung tâm trò chơi', icon: Gamepad2 },
  { id: 'LEADERBOARD', label: 'Bảng xếp hạng', icon: Trophy },
  { id: 'BADGES', label: 'Huy hiệu của tôi', icon: Award },
  { id: 'HISTORY', label: 'Lịch sử dự đoán', icon: History },
];

function BadgesPanel({
  badges,
  error,
}: {
  badges: UserBadgeResponseDto[] | null;
  error: string | null;
}) {
  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-2 font-bold text-fb-text">
        <Award className="h-5 w-5 text-fb-warning" /> Huy hiệu của tôi
      </h2>
      {error && <p className="text-sm text-fb-danger">{error}</p>}
      {!badges && !error && (
        <SkeletonRows count={3} label="Đang tải huy hiệu…" />
      )}
      {badges?.length === 0 && (
        <p className="rounded-lg bg-fb-card p-8 text-center text-sm text-fb-text-2 shadow-fb-card">
          Bạn chưa có huy hiệu nào.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {badges?.map((b) => (
          <article
            key={b.badge_id}
            className="flex items-start gap-3 rounded-lg bg-fb-card p-4 shadow-fb-card"
          >
            {b.icon_url ? (
              <img
                src={b.icon_url}
                alt=""
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <span className="rounded-lg bg-fb-warning-soft p-2.5 text-fb-warning">
                <Award className="h-5 w-5" />
              </span>
            )}
            <div>
              <h3 className="font-semibold text-fb-text">
                {b.name}
                {b.badge_tier && (
                  <span className="ml-2 text-xs text-fb-text-3">
                    {b.badge_tier}
                  </span>
                )}
              </h3>
              <p className="text-sm text-fb-text-2">{b.description}</p>
              {b.earned_at && (
                <p className="text-xs text-fb-text-3">
                  Đạt ngày {new Date(b.earned_at).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/**
 * Trò chơi học tập. Sinh viên: điểm danh, Game 1/2/4/6, hướng dẫn Game 3/5,
 * bảng xếp hạng, huy hiệu, lịch sử. Giảng viên: LecturerGameHub.
 */
export const MinigameView: React.FC = () => {
  const { role, currentUser, setViewingUserId, setActiveTab, showToast } =
    useApp();
  const [menu, setMenu] = useState<StudentMenu>('CENTER');
  const [predictions, setPredictions] = useState<
    GamePredictionResponse[] | null
  >(null);
  const [predictionsError, setPredictionsError] = useState<string | null>(null);
  const [badges, setBadges] = useState<UserBadgeResponseDto[] | null>(null);
  const [badgesError, setBadgesError] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<MyRankDto | null>(null);
  const [checkIn, setCheckIn] = useState<CheckInStatusResponse | null>(null);
  const isStudent = role !== 'LECTURER';

  const loadPredictions = useCallback(() => {
    gamesGateway
      .getMyPredictions()
      .then((list) => {
        setPredictions(list);
        setPredictionsError(null);
      })
      .catch((err: unknown) => {
        setPredictions([]);
        setPredictionsError(
          errorMessage(err, 'Không tải được lịch sử dự đoán.'),
        );
      });
  }, []);

  useEffect(() => {
    if (!isStudent) return;
    loadPredictions();
    gamesGateway
      .getMyBadges()
      .then(setBadges)
      .catch((err: unknown) =>
        setBadgesError(errorMessage(err, 'Không tải được huy hiệu.')),
      );
    gamesGateway
      .getLeaderboard({ period: 'SEMESTER', limit: 1 })
      .then((res) => setMyRank(res.my_rank ?? null))
      .catch(() => setMyRank(null));
    gamesGateway
      .getCheckInStatus()
      .then(setCheckIn)
      .catch(() => setCheckIn(null));
  }, [isStudent, loadPredictions]);

  if (!isStudent) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-3 py-5 sm:px-6 lg:px-8">
        <LecturerGameHub />
      </div>
    );
  }

  // Mở hồ sơ từ bảng xếp hạng: demo ánh xạ sang người dùng mẫu; phiên thật chỉ
  // mở được hồ sơ của chính mình (chưa có dữ liệu hồ sơ người khác trên giao diện).
  const canOpenEntry = (e: LeaderboardEntryDto) =>
    Boolean(e.is_current_user) ||
    (!isApiSession() && demoProfileIdForUser(e.user_id) !== null);
  const openEntry = (e: LeaderboardEntryDto) => {
    setViewingUserId(
      e.is_current_user ? null : demoProfileIdForUser(e.user_id),
    );
    setActiveTab('profile');
  };

  return (
    <div className="mx-auto w-full max-w-[1920px] px-2 py-4 sm:px-4 lg:px-6">
      <div className="flex flex-col items-start gap-4 lg:flex-row lg:gap-6">
        <aside className="w-full shrink-0 space-y-3 lg:sticky lg:top-18 lg:w-[280px] xl:w-[300px]">
          <div className="rounded-lg bg-fb-card p-4 shadow-fb-card">
            <div className="flex items-center gap-3">
              <AvatarWithFrame user={currentUser} size="lg" />
              <div>
                <p className="font-semibold text-fb-text">{currentUser.name}</p>
                <p className="flex items-center gap-1.5 text-sm text-fb-text-2">
                  <Crown className="h-3.5 w-3.5 text-fb-blue" />
                  {myRank?.rank
                    ? `Hạng #${myRank.rank} học kỳ`
                    : 'Chưa có hạng'}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-fb-divider pt-3 text-center">
              <div>
                <span className="block text-lg font-bold text-fb-blue">
                  {myRank?.total_points ?? 0}
                </span>
                <span className="text-xs text-fb-text-2">Điểm</span>
              </div>
              <div>
                <span className="flex items-center justify-center gap-1 text-lg font-bold text-fb-warning">
                  <Flame className="h-4 w-4" />
                  {checkIn?.current_streak ?? 0}
                </span>
                <span className="text-xs text-fb-text-2">Ngày liên tiếp</span>
              </div>
              <div>
                <span className="block text-lg font-bold text-fb-text">
                  {badges?.length ?? 0}
                </span>
                <span className="text-xs text-fb-text-2">Huy hiệu</span>
              </div>
            </div>
          </div>

          <nav className="space-y-1 rounded-lg bg-fb-card p-2 text-sm font-medium text-fb-text shadow-fb-card">
            {MENU.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMenu(id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                  menu === id
                    ? 'bg-fb-blue-soft font-semibold text-fb-blue'
                    : 'hover:bg-fb-hover'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="w-full min-w-0 flex-1">
          {menu === 'CENTER' &&
            (predictions === null ? (
              <CardListSkeleton count={3} withAction={false} />
            ) : (
              <StudentGameCenter
                predictions={predictions}
                onPredicted={loadPredictions}
                showToast={showToast}
                onCheckInChanged={setCheckIn}
                onOpenPropose={() => setActiveTab('propose')}
                onOpenMyQuestionSets={() => {
                  setViewingUserId(null);
                  setActiveTab('profile');
                }}
              />
            ))}
          {menu === 'LEADERBOARD' && (
            <LeaderboardPanel
              onOpenEntry={openEntry}
              canOpenEntry={canOpenEntry}
            />
          )}
          {menu === 'BADGES' && (
            <BadgesPanel badges={badges} error={badgesError} />
          )}
          {menu === 'HISTORY' && (
            <PredictionHistory
              predictions={predictions}
              error={predictionsError}
            />
          )}
        </main>
      </div>
    </div>
  );
};
