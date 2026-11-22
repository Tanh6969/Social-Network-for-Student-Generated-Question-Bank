import React from 'react';
import { Brain, Flag, Gauge, Library, ListChecks, Users } from 'lucide-react';

export type GameId = 1 | 2 | 3 | 4 | 5 | 6;

/** 6 trò chơi theo enum game_type của Swagger. */
export const GAME_TILES: {
  id: GameId;
  icon: React.ElementType;
  title: string;
  short: string;
}[] = [
  {
    id: 1,
    icon: Users,
    title: 'Đoán số người nộp',
    short: 'Theo lớp, chốt 22:00',
  },
  {
    id: 2,
    icon: Gauge,
    title: 'Đoán số câu được chọn',
    short: 'Bộ câu hỏi của bạn',
  },
  {
    id: 3,
    icon: ListChecks,
    title: 'Mức tự tin tác giả',
    short: 'Khai khi đăng câu hỏi',
  },
  { id: 4, icon: Library, title: 'Quy mô ngân hàng', short: 'Mỗi môn một lần' },
  {
    id: 5,
    icon: Flag,
    title: 'Săn lỗi câu hỏi',
    short: 'Báo lỗi khi luyện tập',
  },
  { id: 6, icon: Brain, title: 'Câu nào do AI tạo?', short: 'Thứ 7 hằng tuần' },
];

interface GameSelectorBarProps {
  active: GameId;
  onSelect: (id: GameId) => void;
  /** Nhãn phụ cho từng ô (ví dụ “Đã dự đoán”, “Cần thẩm định”). */
  badges?: Partial<Record<GameId, string>>;
}

/** 6 ô trò chơi; bấm ô nào thì hiện trò chơi đó. */
export const GameSelectorBar: React.FC<GameSelectorBarProps> = ({
  active,
  onSelect,
  badges,
}) => (
  <div
    role="tablist"
    aria-label="Chọn trò chơi"
    className="grid select-none grid-cols-2 gap-2 sm:grid-cols-3"
  >
    {GAME_TILES.map(({ id, icon: Icon, title, short }) => {
      const selected = id === active;
      return (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => onSelect(id)}
          className={`flex min-h-28 flex-col justify-between rounded-xl border px-3.5 py-3 text-left transition-colors ${
            selected
              ? 'border-fb-blue bg-fb-blue-soft text-fb-blue ring-1 ring-fb-blue/20'
              : 'border-fb-divider bg-fb-card text-fb-text hover:border-fb-blue/40 hover:bg-fb-hover'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide opacity-70">
              Game {id}
            </span>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                selected ? 'bg-white/70' : 'bg-fb-input'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2.5">
            <h4 className="line-clamp-2 text-sm font-bold leading-snug">{title}</h4>
            <p className="mt-0.5 text-xs opacity-80">{short}</p>
            {badges?.[id] && (
              <span className="mt-1.5 inline-block rounded-full bg-fb-card px-2 py-0.5 text-xs font-semibold text-fb-blue">
                {badges[id]}
              </span>
            )}
          </div>
        </button>
      );
    })}
  </div>
);
