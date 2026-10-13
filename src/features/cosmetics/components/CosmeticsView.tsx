import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import {
  Sparkles,
  Shield,
  Check,
  Lock,
  Crown,
  MessageCircle,
  Eye,
  AlertCircle
} from 'lucide-react';
import { CosmeticItem } from '../../demo/types';

export const CosmeticsView: React.FC = () => {
  const {
    cosmetics,
    equipCosmetic,
    unequipCosmetic,
    currentUser,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ALL' | 'AVATAR_FRAME' | 'CHAT_EFFECT'>('ALL');
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<CosmeticItem>(
    cosmetics[0]
  );

  const filteredCosmetics = cosmetics.filter(
    (c) => activeTab === 'ALL' || c.type === activeTab
  );

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY':
        return 'bg-amber-50 text-amber-800 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300';
      case 'EPIC':
        return 'bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300';
      case 'RARE':
        return 'bg-slate-100 text-slate-700 border-slate-200/70 dark:bg-slate-800 dark:text-slate-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-12 items-start justify-between">
      {/* ================= CỘT TRÁI (sticky sát lề trái): XEM TRƯỚC TRỰC TIẾP ================= */}
      <aside className="w-full lg:w-[340px] xl:w-[360px] shrink-0 space-y-4 select-none lg:sticky lg:top-18">
        <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-xs uppercase tracking-wider text-gray-500">
              Xem trước hiển thị trực tiếp
            </h3>
          </div>

          {/* Avatar Preview Box */}
          <div className="flex flex-col items-center justify-center p-6 bg-linear-to-b from-gray-50 to-gray-100 dark:from-[#18191A] dark:to-[#1E1F20] rounded-2xl border border-gray-200 dark:border-gray-700">
            <AvatarWithFrame user={currentUser} size="2xl" />
            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 mt-3">
              {currentUser.name}
            </h4>
            <p className="text-xs text-gray-500">{currentUser.classOrTitle}</p>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1">
              Khung đang dùng: {cosmetics.find((c) => c.id === currentUser.equippedFrameId)?.name || 'Mặc định (Không khung)'}
            </span>
          </div>

          {/* Sample Chat Bubble Preview */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs font-bold text-gray-500 block">
              Bong bóng chat mẫu trong Messenger:
            </span>
            <div className="flex justify-end">
              <div
                className={`p-3 rounded-2xl text-xs max-w-[85%] bg-blue-600 text-white rounded-br-xs shadow-xs ${
                  currentUser.equippedChatEffectId === 'effect_glow'
                    ? 'ring-2 ring-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                    : ''
                }`}
              >
                Xin chào các bạn, mình vừa đóng góp 3 câu hỏi mới vào ngân hàng đề thi!
              </div>
            </div>
          </div>
        </div>

        {/* Selected Item Details */}
        {selectedPreviewItem && (
          <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {selectedPreviewItem.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getRarityBadge(
                  selectedPreviewItem.rarity
                )}`}
              >
                {selectedPreviewItem.rarity}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300">{selectedPreviewItem.description}</p>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-[11px] text-gray-500 block">Điều kiện mở khóa:</span>
              <strong className="text-blue-600 dark:text-blue-400">
                {selectedPreviewItem.unlockCondition}
              </strong>
            </div>
          </div>
        )}
      </aside>

      {/* ================= CỘT PHẢI: Lưới vật phẩm (có khoảng trống 2 bên) ================= */}
      <main className="flex-1 max-w-[980px] mx-auto space-y-4">
        {/* Header banner - Tối giản, thanh lịch */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Kho Vật Phẩm Học Thuật & Khung Avatar</h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Mở khóa khung avatar và hiệu ứng đoạn chat thông qua việc đóng góp câu hỏi đạt chuẩn và bảng xếp hạng học tập.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 text-xs font-bold">
          {[
            { id: 'ALL', label: 'Tất cả vật phẩm' },
            { id: 'AVATAR_FRAME', label: 'Khung Avatar' },
            { id: 'CHAT_EFFECT', label: 'Hiệu ứng tin nhắn' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredCosmetics.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedPreviewItem(item)}
              className={`bg-white dark:bg-[#242526] rounded-2xl shadow-xs border p-4 space-y-3 cursor-pointer transition ${
                selectedPreviewItem.id === item.id
                  ? 'border-purple-600 ring-2 ring-purple-600/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getRarityBadge(
                      item.rarity
                    )}`}
                  >
                    {item.rarity}
                  </span>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {item.name}
                  </h4>
                </div>

                {item.isEquipped && (
                  <span className="text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200/50">
                    ✓ Đang dùng
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>

              {/* Progress or Unlock Status */}
              <div className="p-2.5 bg-gray-50 dark:bg-[#1E1F20] rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Điều kiện: {item.unlockCondition}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {item.progressCurrent} / {item.progressRequired}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (item.progressCurrent / item.progressRequired) * 100
                      )}%`
                    }}
                  />
                </div>
              </div>

              {/* Action buttons: Trang bị / Gỡ / Khóa */}
              <div className="pt-2 flex items-center justify-end gap-2">
                {item.isUnlocked ? (
                  item.isEquipped ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        unequipCosmetic(item.id);
                      }}
                      className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Gỡ bỏ
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        equipCosmetic(item.id);
                      }}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                      Trang bị ngay
                    </button>
                  )
                ) : (
                  <button
                    disabled
                    className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Chưa đủ điều kiện</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
