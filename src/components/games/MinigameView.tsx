import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AvatarWithFrame } from '../common/AvatarWithFrame';
import {
  Gamepad2,
  Trophy,
  Award,
  Crown,
  Sparkles,
  Clock,
  Send,
  CheckCircle2,
  TrendingUp,
  History,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';

export const MinigameView: React.FC = () => {
  const {
    minigames,
    submitGuess,
    leaderboard,
    currentUser,
    setViewingUserId,
    setActiveTab,
    showToast
  } = useApp();

  const [activeGameMenu, setActiveGameMenu] = useState<'CENTER' | 'LEADERBOARD' | 'BADGES' | 'HISTORY'>('CENTER');
  const [guessInputs, setGuessInputs] = useState<Record<string, number>>({
    game_01: 365,
    game_02: 135,
    game_03: 3520
  });

  const handleGuessSubmit = (gameId: string) => {
    const val = guessInputs[gameId];
    if (val !== undefined) {
      submitGuess(gameId, val);
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-12 items-start justify-between">
      {/* ================= CỘT TRÁI (sticky sát lề trái) ================= */}
      <aside className="w-full lg:w-[300px] xl:w-[320px] shrink-0 space-y-4 select-none lg:sticky lg:top-18">
        {/* Personal Points & Rank Card - Tối giản */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <AvatarWithFrame user={currentUser} size="lg" />
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Crown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Hạng 3 Tuần này</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Điểm cống hiến</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{currentUser.points} đ</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Huy hiệu đạt được</span>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">4 / 8</span>
            </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-2 space-y-1 text-xs font-medium text-gray-700 dark:text-gray-300">
          <button
            onClick={() => setActiveGameMenu('CENTER')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left ${
              activeGameMenu === 'CENTER'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-gray-500" />
            <span>Trung tâm Minigame dự đoán</span>
          </button>

          <button
            onClick={() => setActiveGameMenu('LEADERBOARD')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left ${
              activeGameMenu === 'LEADERBOARD'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
            }`}
          >
            <Trophy className="w-4 h-4 text-gray-500" />
            <span>Bảng vàng vinh danh (Top cống hiến)</span>
          </button>

          <button
            onClick={() => setActiveGameMenu('BADGES')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left ${
              activeGameMenu === 'BADGES'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
            }`}
          >
            <Award className="w-4 h-4 text-gray-500" />
            <span>Huy hiệu & Thành tích</span>
          </button>

          <button
            onClick={() => setActiveGameMenu('HISTORY')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left ${
              activeGameMenu === 'HISTORY'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
            }`}
          >
            <History className="w-4 h-4 text-gray-500" />
            <span>Lịch sử dự đoán của tôi</span>
          </button>
        </div>

        {/* Rule notes */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 text-xs text-gray-500 space-y-2">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" />
            Luật chơi Minigame
          </h4>
          <p>
            • Mỗi tuần hệ thống mở 3 minigame dự đoán. Kết quả chốt lúc 23h59 Chủ nhật hàng tuần.
          </p>
          <p>
            • Dự đoán chính xác nhất nhận +200 đến +500 điểm cống hiến và danh hiệu tuần!
          </p>
        </div>
      </aside>

      {/* ================= CỘT PHẢI: Nội dung chính (có khoảng trống 2 bên) ================= */}
      <main className="flex-1 max-w-[960px] mx-auto space-y-4">
        {activeGameMenu === 'CENTER' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-amber-500" />
                Các Minigame Đang Mở Bình Chọn
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Đặt dự đoán trước thời gian đóng cổng để nhận điểm thưởng và leo bảng xếp hạng!
              </p>
            </div>

            {/* Minigame Cards */}
            <div className="space-y-4">
              {minigames.map((game) => (
                <div
                  key={game.id}
                  className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-0.5 rounded-md">
                        Minigame Tuần #{game.id.split('_')[1]}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 mt-1">
                        {game.title}
                      </h3>
                      <p className="text-xs text-gray-500">{game.description}</p>
                    </div>

                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#3A3B3C] px-2.5 py-1 rounded-md flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      Còn {game.closesInHours} giờ
                    </span>
                  </div>

                  {/* Benchmark Comparison */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl text-xs">
                    <div>
                      <span className="text-gray-500 block">Kỳ trước đạt được:</span>
                      <strong className="text-gray-800 dark:text-gray-200 text-sm">
                        {game.previousValue}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Hiện tại đang ghi nhận:</span>
                      <strong className="text-blue-600 dark:text-blue-400 text-sm">
                        {game.currentValue}
                      </strong>
                    </div>
                  </div>

                  {/* Submit Guess input */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                        Con số dự đoán:
                      </label>
                      <input
                        type="number"
                        disabled={game.hasUserGuessed}
                        value={guessInputs[game.id] ?? game.currentValue}
                        onChange={(e) =>
                          setGuessInputs((prev) => ({
                            ...prev,
                            [game.id]: Number(e.target.value)
                          }))
                        }
                        className="w-28 px-3 py-1.5 text-xs font-bold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#242526] text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        Thưởng: +{game.rewardPoints} điểm
                      </span>

                      {game.hasUserGuessed ? (
                        <span className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs rounded-lg flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          Đã đặt: {game.userGuess}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleGuessSubmit(game.id)}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Gửi dự đoán</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEADERBOARD VIEW (GAME.07) */}
        {activeGameMenu === 'LEADERBOARD' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Bảng Vàng Cống Hiến Tri Thức Toàn Trường
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Tôn vinh các sinh viên và giảng viên có đóng góp nhiều câu hỏi đạt chuẩn nhất!
              </p>
            </div>

            {/* PODIUM TOP 3 (GAME.07) - Thiết kế tối giản, dịu mắt */}
            <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-6">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-lg mx-auto text-center pt-3 pb-2">
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-semibold text-gray-500 mb-1">HẠNG 2</span>
                  <div className="relative mb-2">
                    <AvatarWithFrame user={leaderboard[1].user} size="lg" />
                  </div>
                  <p className="font-semibold text-xs truncate max-w-[90px] text-gray-900 dark:text-gray-100">{leaderboard[1].user.name}</p>
                  <span className="text-[11px] text-gray-500 font-medium">{leaderboard[1].score} đ</span>
                  <div className="w-full h-16 bg-gray-100 dark:bg-[#3A3B3C] rounded-t-xl mt-2 flex items-center justify-center font-bold text-base text-gray-500">
                    2
                  </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center -mt-3">
                  <div className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
                    <Crown className="w-4 h-4" />
                    <span>QUÁN QUÂN</span>
                  </div>
                  <div className="relative mb-2">
                    <AvatarWithFrame user={leaderboard[0].user} size="xl" />
                  </div>
                  <p className="font-bold text-sm truncate max-w-[110px] text-gray-900 dark:text-gray-100">
                    {leaderboard[0].user.name}
                  </p>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">{leaderboard[0].score} đ</span>
                  <div className="w-full h-22 bg-blue-50 dark:bg-blue-950/40 border-t-2 border-blue-600 rounded-t-xl mt-2 flex items-center justify-center font-bold text-xl text-blue-600 dark:text-blue-400">
                    1
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-semibold text-gray-500 mb-1">HẠNG 3</span>
                  <div className="relative mb-2">
                    <AvatarWithFrame user={leaderboard[2].user} size="lg" />
                  </div>
                  <p className="font-semibold text-xs truncate max-w-[90px] text-gray-900 dark:text-gray-100">{leaderboard[2].user.name}</p>
                  <span className="text-[11px] text-gray-500 font-medium">{leaderboard[2].score} đ</span>
                  <div className="w-full h-12 bg-gray-100 dark:bg-[#3A3B3C] rounded-t-xl mt-2 flex items-center justify-center font-bold text-sm text-gray-400">
                    3
                  </div>
                </div>
              </div>
            </div>

            {/* List rank 4+ */}
            <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              {leaderboard.slice(3).map((lead) => (
                <div
                  key={lead.user.id}
                  onClick={() => {
                    setViewingUserId(lead.user.id);
                    setActiveTab('profile');
                  }}
                  className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#3A3B3C] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-bold text-xs text-gray-500 text-center">
                      #{lead.rank}
                    </span>
                    <AvatarWithFrame user={lead.user} size="md" />
                    <div>
                      <p className="font-bold text-xs text-gray-900 dark:text-gray-100">
                        {lead.user.name}
                      </p>
                      <p className="text-[10px] text-gray-400">{lead.badgeTitle}</p>
                    </div>
                  </div>

                  <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                    {lead.score} điểm
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BADGES VIEW (GAME.08) */}
        {activeGameMenu === 'BADGES' && (
          <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-500" />
              Bộ Sưu Tập Huy Hiệu Cống Hiến
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Tác giả Tích cực', desc: 'Có từ 10 câu hỏi được duyệt', unlocked: true, icon: '🌟' },
                { title: 'Chuyên gia Mạng máy tính', desc: 'Đạt tỉ lệ câu hỏi đúng > 90%', unlocked: true, icon: '🌐' },
                { title: 'Chiến thần Minigame', desc: 'Dự đoán chính xác 3 tuần liên tiếp', unlocked: false, icon: '🎯' },
                { title: 'Thủ khoa Đóng góp', desc: 'Đạt mốc 2,000 điểm cống hiến', unlocked: false, icon: '👑' },
              ].map((badge, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    badge.unlocked
                      ? 'border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-gray-200 opacity-60'
                  }`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100">
                      {badge.title}
                    </h4>
                    <p className="text-[11px] text-gray-500">{badge.desc}</p>
                    <span className="text-[10px] font-bold mt-1 inline-block text-indigo-600">
                      {badge.unlocked ? '✓ Đã đạt được' : '🔒 Đang tiến hành'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY VIEW */}
        {activeGameMenu === 'HISTORY' && (
          <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <History className="w-6 h-6 text-blue-500" />
              Lịch Sử Dự Đoán Minigame (GAME.06)
            </h2>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl flex items-center justify-between border">
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    Dự đoán số Sinh viên tham gia tuần trước
                  </p>
                  <span className="text-gray-500">Bạn đã đoán: 310 · Kết quả thực: 312</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  +200 điểm (Gần đúng)
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
