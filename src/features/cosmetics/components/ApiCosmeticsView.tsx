import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Clock3,
  Coins,
  Gem,
  PackageOpen,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { errorMessage } from '../../../api';
import {
  cosmeticsApi,
  type CosmeticRarity,
  type CosmeticType,
  type CosmeticSummaryDto,
  type InventoryItemDto,
  type ShopItemDto,
  type ShopSortBy,
} from '../../../api/cosmetics';
import { SkeletonRows } from '../../../shared/components/Skeleton';
import { postsApi } from '../../../api/posts';
import { applyProfile } from '../../auth/mapAuthUser';
import { useApp } from '../../demo/context/AppContext';

const cosmeticTypes: { value: CosmeticType; label: string }[] = [
  { value: 'AVATAR_FRAME', label: 'Khung ảnh' },
  { value: 'CHAT_BUBBLE', label: 'Bong bóng chat' },
];
const rarities: CosmeticRarity[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];
const sortOptions: { value: ShopSortBy; label: string }[] = [
  { value: 'NEWEST', label: 'Mới nhất' },
  { value: 'PRICE_ASC', label: 'Giá tăng dần' },
  { value: 'PRICE_DESC', label: 'Giá giảm dần' },
  { value: 'RARITY', label: 'Độ hiếm' },
];

function cosmeticTypeLabel(type?: string) {
  return cosmeticTypes.find((option) => option.value === type)?.label ?? type ?? '';
}

function dateLabel(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('vi-VN');
}

function rarityStyle(rarity?: string) {
  switch (rarity) {
    case 'LEGENDARY':
      return 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
    case 'EPIC':
      return 'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300';
    case 'RARE':
      return 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300';
    default:
      return 'border-fb-divider bg-fb-inset text-fb-text-2';
  }
}

export function ApiCosmeticsView() {
  const { currentUser, updateCurrentUser } = useApp();
  const [shop, setShop] = useState<ShopItemDto[]>([]);
  const [inventory, setInventory] = useState<InventoryItemDto[]>([]);
  const [summary, setSummary] = useState<CosmeticSummaryDto>();
  const [equipped, setEquipped] = useState<Record<string, number>>({});
  const [coins, setCoins] = useState<number | null>(null);
  const [shopAfter, setShopAfter] = useState<number | undefined>();
  const [inventoryAfter, setInventoryAfter] = useState<number | undefined>();
  const [shopType, setShopType] = useState<CosmeticType | ''>('');
  const [shopSort, setShopSort] = useState<ShopSortBy>('NEWEST');
  const [inventoryType, setInventoryType] = useState<CosmeticType | ''>('');
  const [inventoryRarity, setInventoryRarity] = useState<CosmeticRarity | ''>('');
  const [onlyUnlocked, setOnlyUnlocked] = useState(false);
  const [shopMore, setShopMore] = useState(false);
  const [inventoryMore, setInventoryMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [confirmBuy, setConfirmBuy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [shopPage, bagPage] = await Promise.all([
      cosmeticsApi.getShop({
        type: shopType || undefined,
        sort_by: shopSort,
        limit: 20,
      }),
      cosmeticsApi.getInventory({
        type: inventoryType || undefined,
        rarity: inventoryRarity || undefined,
        only_unlocked: onlyUnlocked ? true : undefined,
        limit: 20,
      }),
    ]);
    setShop(shopPage?.items ?? []);
    setCoins(shopPage?.user_points ?? null);
    setShopAfter(shopPage?.pagination?.after);
    setShopMore(shopPage?.pagination?.has_next ?? false);
    setInventory(bagPage?.inventory ?? []);
    setSummary(bagPage?.summary);
    setInventoryAfter(bagPage?.pagination?.after);
    setInventoryMore(bagPage?.pagination?.has_next ?? false);
    setEquipped(Object.fromEntries(Object.entries(bagPage?.currently_equipped ?? {})
      .filter((entry) => entry[1]?.cosmetic_id != null)
      .map(([slot, item]) => [slot, item.cosmetic_id!] as const)));
  }, [inventoryRarity, inventoryType, onlyUnlocked, shopSort, shopType]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void reload().catch((cause: unknown) => {
      if (!cancelled) setError(errorMessage(cause, 'Không tải được kho vật phẩm.'));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reload]);

  const act = async (id: number, action: 'buy' | 'equip' | 'unequip') => {
    setBusy(id);
    setError(null);
    try {
      let profileUpdated: Record<string, string | null> | undefined;
      if (action === 'buy') {
        await cosmeticsApi.buy(id);
      } else if (action === 'equip') {
        profileUpdated = (await cosmeticsApi.equip(id))?.profile_updated;
      } else {
        profileUpdated = (await cosmeticsApi.unequip(id))?.profile_updated;
      }
      await reload();
      if (action !== 'buy') {
        if (profileUpdated && 'avatar_frame_url' in profileUpdated) {
          updateCurrentUser({ frameUrl: profileUpdated.avatar_frame_url ?? undefined });
        } else {
          const profile = await postsApi.getMyProfile();
          updateCurrentUser({ frameUrl: applyProfile(currentUser, profile).frameUrl });
        }
      }
      setConfirmBuy(null);
    } catch (cause: unknown) {
      setError(errorMessage(cause, 'Không thực hiện được thao tác.'));
    } finally {
      setBusy(null);
    }
  };

  const loadShopMore = async () => {
    if (shopAfter == null) return;
    try {
      const page = await cosmeticsApi.getShop({
        after: shopAfter,
        type: shopType || undefined,
        sort_by: shopSort,
        limit: 20,
      });
      setShop((previous) => [...previous, ...(page?.items ?? []).filter((item) =>
        !previous.some((old) => old.cosmetic_id === item.cosmetic_id))]);
      setShopAfter(page?.pagination?.after);
      setShopMore(page?.pagination?.has_next ?? false);
    } catch (cause: unknown) { setError(errorMessage(cause, 'Không tải thêm được vật phẩm.')); }
  };
  const loadInventoryMore = async () => {
    if (inventoryAfter == null) return;
    try {
      const page = await cosmeticsApi.getInventory({
        after: inventoryAfter,
        type: inventoryType || undefined,
        rarity: inventoryRarity || undefined,
        only_unlocked: onlyUnlocked ? true : undefined,
        limit: 20,
      });
      setInventory((previous) => [...previous, ...(page?.inventory ?? []).filter((item) =>
        !previous.some((old) => old.cosmetic_id === item.cosmetic_id))]);
      setInventoryAfter(page?.pagination?.after);
      setInventoryMore(page?.pagination?.has_next ?? false);
    } catch (cause: unknown) { setError(errorMessage(cause, 'Không tải thêm được túi đồ.')); }
  };

  const currency = new Intl.NumberFormat('vi-VN');
  const selectClassName = 'mt-1.5 min-h-11 w-full rounded-xl border border-fb-divider bg-fb-card px-3 text-sm text-fb-text outline-none transition focus:border-fb-blue focus:ring-2 focus:ring-fb-blue/20';
  const sectionClassName = 'overflow-hidden rounded-2xl border border-fb-divider/70 bg-fb-card shadow-fb-card';
  const emptyState = (title: string, description: string, icon: typeof PackageOpen) => {
    const Icon = icon;
    return <div className="flex flex-col items-center rounded-2xl border border-dashed border-fb-divider bg-fb-inset/70 px-5 py-10 text-center sm:py-12">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-fb-blue-soft text-fb-blue">
        <Icon aria-hidden="true" className="h-7 w-7" />
      </span>
      <h3 className="font-semibold text-fb-text">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-fb-text-2">{description}</p>
    </div>;
  };

  return <main className="mx-auto max-w-6xl space-y-7 px-3 py-6 sm:px-6 lg:py-8">
    <header className="relative isolate overflow-hidden rounded-3xl border border-fb-blue/15 bg-fb-card shadow-fb-card">
      <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 w-2/3 bg-gradient-to-l from-fb-blue-soft/80 to-transparent" />
      <div className="flex flex-col gap-6 p-5 sm:p-7 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-fb-blue text-white shadow-lg shadow-fb-blue/20">
            <Sparkles aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-fb-blue">UniSocial collection</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-fb-text sm:text-3xl">Kho vật phẩm</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-fb-text-2">
              Sưu tầm khung ảnh và bong bóng chat để tạo dấu ấn riêng cho hồ sơ của bạn.
            </p>
          </div>
        </div>
        <div className="flex min-w-48 items-center gap-3 rounded-2xl border border-fb-divider/70 bg-fb-card/90 px-4 py-3 shadow-sm">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <Coins aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-fb-text-2">Số dư của bạn</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-fb-text">
              {coins == null ? '—' : currency.format(coins)}
              <span className="ml-1.5 text-xs font-semibold text-fb-text-2">SQB Coins</span>
            </p>
          </div>
        </div>
      </div>
    </header>

    {error && <div role="alert" className="rounded-xl border border-fb-danger/20 bg-fb-danger-soft px-4 py-3 text-sm text-fb-danger">{error}</div>}
    {loading && <div className="rounded-2xl border border-fb-divider/70 bg-fb-card p-5 shadow-fb-card"><SkeletonRows count={3} label="Đang tải vật phẩm…" /></div>}

    {!loading && <>
      {summary && <section aria-label="Thống kê bộ sưu tập">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-fb-text">Bộ sưu tập của bạn</h2>
            <p className="mt-0.5 text-xs text-fb-text-2">Tiến độ mở khóa các vật phẩm trang trí</p>
          </div>
          <Gem aria-hidden="true" className="h-5 w-5 text-fb-blue" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-fb-blue/20 bg-fb-blue-soft/60 p-4">
            <p className="text-xs font-medium leading-5 text-fb-text-2">Đã mở khóa</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-fb-text">{summary.total_unlocked ?? 0}</p>
            <p className="mt-1 text-[11px] text-fb-text-2">vật phẩm</p>
          </div>
          <div className="rounded-2xl border border-fb-divider/70 bg-fb-card p-4">
            <p className="text-xs font-medium leading-5 text-fb-text-2">Hoàn thành</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-fb-text">{summary.collection_completion_percent ?? 0}%</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fb-inset">
              <div className="h-full rounded-full bg-fb-blue transition-[width]" style={{ width: `${Math.min(100, Math.max(0, summary.collection_completion_percent ?? 0))}%` }} />
            </div>
          </div>
          {rarities.map((rarity) => <div key={rarity} className="rounded-2xl border border-fb-divider/70 bg-fb-card p-4">
            <p className="text-[11px] font-semibold tracking-wide text-fb-text-2">{rarity}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-fb-text">{summary.by_rarity?.[rarity] ?? 0}</p>
            <p className="mt-1 text-[11px] text-fb-text-2">vật phẩm</p>
          </div>)}
        </div>
      </section>}

      <section className={sectionClassName}>
        <div className="flex flex-col gap-4 border-b border-fb-divider/70 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-fb-blue-soft text-fb-blue">
              <PackageOpen aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-fb-text">Túi đồ của tôi</h2>
              <p className="text-xs text-fb-text-2">{summary?.total_unlocked ?? inventory.length} vật phẩm đã sưu tầm</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-end">
            <label className="min-w-40 text-xs font-semibold text-fb-text-2">
              Loại vật phẩm
              <select aria-label="Lọc túi đồ theo loại" value={inventoryType}
                onChange={(event) => setInventoryType(event.target.value as CosmeticType | '')}
                className={selectClassName}>
                <option value="">Tất cả loại</option>
                {cosmeticTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="min-w-36 text-xs font-semibold text-fb-text-2">
              Độ hiếm
              <select aria-label="Lọc túi đồ theo độ hiếm" value={inventoryRarity}
                onChange={(event) => setInventoryRarity(event.target.value as CosmeticRarity | '')}
                className={selectClassName}>
                <option value="">Tất cả độ hiếm</option>
                {rarities.map((rarity) => <option key={rarity} value={rarity}>{rarity}</option>)}
              </select>
            </label>
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-fb-divider/70 bg-fb-inset px-3 text-xs font-medium text-fb-text-2 sm:col-span-2 lg:mb-0.5">
              <input type="checkbox" checked={onlyUnlocked} onChange={(event) => setOnlyUnlocked(event.target.checked)}
                className="h-4 w-4 accent-fb-blue" />
              Chỉ vật phẩm đã mở khóa
            </label>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          {inventory.length === 0
            ? emptyState(
              onlyUnlocked ? 'Chưa có vật phẩm khớp bộ lọc' : 'Túi đồ đang chờ bạn khám phá',
              onlyUnlocked
                ? 'Thử đổi loại vật phẩm hoặc độ hiếm để xem thêm kết quả.'
                : 'Những vật phẩm bạn sở hữu sẽ xuất hiện ở đây. Ghé cửa hàng để chọn món đầu tiên nhé.',
              PackageOpen,
            )
            : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{inventory.map((item) => {
              const isEquipped = item.cosmetic_id != null && equipped[item.type ?? ''] === item.cosmetic_id;
              return <article key={item.cosmetic_id} className="group flex flex-col overflow-hidden rounded-2xl border border-fb-divider/70 bg-fb-card transition duration-200 hover:-translate-y-0.5 hover:border-fb-blue/40 hover:shadow-lg">
                <div className="relative grid h-40 place-items-center overflow-hidden bg-gradient-to-br from-fb-blue-soft via-fb-inset to-fb-blue-soft/40">
                  {item.asset_url
                    ? <img src={item.asset_url} alt={item.name ?? 'Vật phẩm trang trí'} loading="lazy" className="h-28 w-28 object-contain drop-shadow-md transition duration-200 group-hover:scale-105" />
                    : <Sparkles aria-hidden="true" className="h-12 w-12 text-fb-blue/60" />}
                  <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${rarityStyle(item.rarity)}`}>{item.rarity ?? 'COMMON'}</span>
                  {isEquipped && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-fb-success-soft px-2.5 py-1 text-[10px] font-bold text-fb-success"><Check aria-hidden="true" className="h-3.5 w-3.5" />Đang dùng</span>}
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-fb-text-2">{cosmeticTypeLabel(item.type)}</p>
                    <h3 className="mt-1 font-bold text-fb-text">{item.name}</h3>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-fb-text-2">{item.description}</p>
                  </div>
                  <div className="flex min-h-5 items-center gap-1.5 text-xs text-fb-text-2">
                    {item.available_until && <><Clock3 aria-hidden="true" className="h-3.5 w-3.5" />Sở hữu đến {dateLabel(item.available_until)}</>}
                  </div>
                  {item.cosmetic_id != null && <button type="button" disabled={busy === item.cosmetic_id}
                    onClick={() => void act(item.cosmetic_id!, isEquipped ? 'unequip' : 'equip')}
                    className={`min-h-11 w-full rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fb-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isEquipped ? 'border border-fb-divider bg-fb-inset text-fb-text hover:bg-fb-hover' : 'bg-fb-blue text-white hover:bg-fb-blue-hover'}`}>
                    {busy === item.cosmetic_id ? 'Đang cập nhật…' : isEquipped ? 'Gỡ khỏi hồ sơ' : 'Trang bị vật phẩm'}
                  </button>}
                </div>
              </article>;
            })}</div>}
          {inventoryMore && <div className="mt-5 text-center">
            <button type="button" onClick={() => void loadInventoryMore()} className="min-h-11 rounded-xl border border-fb-divider bg-fb-card px-5 text-sm font-semibold text-fb-text transition hover:bg-fb-hover">Xem thêm vật phẩm</button>
          </div>}
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="flex flex-col gap-4 border-b border-fb-divider/70 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <ShoppingBag aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-fb-text">Cửa hàng vật phẩm</h2>
              <p className="text-xs text-fb-text-2">Dùng SQB Coins để mở khóa phong cách mới</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-end">
            <label className="min-w-40 text-xs font-semibold text-fb-text-2">
              Loại vật phẩm
              <select aria-label="Lọc cửa hàng theo loại" value={shopType}
                onChange={(event) => setShopType(event.target.value as CosmeticType | '')}
                className={selectClassName}>
                <option value="">Tất cả loại</option>
                {cosmeticTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="min-w-36 text-xs font-semibold text-fb-text-2">
              Sắp xếp
              <select aria-label="Sắp xếp cửa hàng" value={shopSort}
                onChange={(event) => setShopSort(event.target.value as ShopSortBy)}
                className={selectClassName}>
                {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          {shop.length === 0
            ? emptyState(
              shopType ? 'Chưa có vật phẩm thuộc danh mục này' : 'Cửa hàng đang chuẩn bị bộ sưu tập mới',
              'Hiện chưa có vật phẩm phù hợp để trưng bày. Hãy quay lại sau nhé.',
              ShoppingBag,
            )
            : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{shop.map((item) =>
              <article key={item.cosmetic_id} className="group flex flex-col overflow-hidden rounded-2xl border border-fb-divider/70 bg-fb-card transition duration-200 hover:-translate-y-0.5 hover:border-fb-blue/40 hover:shadow-lg">
                <div className="relative grid h-44 place-items-center overflow-hidden bg-gradient-to-br from-amber-50 via-fb-inset to-fb-blue-soft/70 dark:from-amber-950/30 dark:via-fb-inset dark:to-fb-blue-soft/40">
                  {item.asset_url
                    ? <img src={item.asset_url} alt={item.name ?? 'Vật phẩm trang trí'} loading="lazy" className="h-32 w-32 object-contain drop-shadow-md transition duration-200 group-hover:scale-105" />
                    : <Sparkles aria-hidden="true" className="h-12 w-12 text-fb-blue/60" />}
                  <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${rarityStyle(item.rarity)}`}>{item.rarity ?? 'COMMON'}</span>
                  {item.owned && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-fb-success-soft px-2.5 py-1 text-[10px] font-bold text-fb-success"><Check aria-hidden="true" className="h-3.5 w-3.5" />Đã sở hữu</span>}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fb-text-2">{cosmeticTypeLabel(item.type)}</p>
                  <h3 className="mt-1 font-bold text-fb-text">{item.name}</h3>
                  <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-fb-text-2">{item.description}</p>
                  <div className="mt-4 flex min-h-12 items-center justify-between gap-2 border-t border-fb-divider/70 pt-3">
                    <div>
                      <p className="flex items-center gap-1.5 font-bold tabular-nums text-fb-text">
                        <Coins aria-hidden="true" className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                        {currency.format(item.price ?? 0)}
                      </p>
                      {item.original_price != null && item.original_price > (item.price ?? 0) &&
                        <p className="pl-5 text-xs tabular-nums text-fb-text-2 line-through">{currency.format(item.original_price)} Coins</p>}
                    </div>
                    {item.available_until && <span className="text-right text-[11px] text-fb-text-2">Đến<br />{dateLabel(item.available_until)}</span>}
                  </div>
                  <div className="mt-3">
                    {item.owned ? <div className="flex min-h-11 items-center justify-center rounded-xl bg-fb-success-soft text-sm font-semibold text-fb-success">
                      <Check aria-hidden="true" className="mr-1.5 h-4 w-4" />Bạn đã sở hữu
                    </div> : item.cosmetic_id != null && (confirmBuy === item.cosmetic_id
                      ? <div className="grid min-h-11 grid-cols-2 gap-2">
                        <button type="button" disabled={busy === item.cosmetic_id} onClick={() => void act(item.cosmetic_id!, 'buy')}
                          className="rounded-xl bg-fb-blue px-3 text-sm font-semibold text-white transition hover:bg-fb-blue-hover disabled:opacity-50">
                          {busy === item.cosmetic_id ? 'Đang mua…' : 'Xác nhận mua'}
                        </button>
                        <button type="button" onClick={() => setConfirmBuy(null)} className="rounded-xl border border-fb-divider px-3 text-sm font-semibold text-fb-text transition hover:bg-fb-hover">Hủy</button>
                      </div>
                      : <button type="button" onClick={() => setConfirmBuy(item.cosmetic_id!)}
                        className="min-h-11 w-full rounded-xl bg-fb-blue px-4 text-sm font-semibold text-white transition hover:bg-fb-blue-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fb-blue focus-visible:ring-offset-2">
                        Mua vật phẩm
                      </button>)}
                  </div>
                </div>
              </article>)}</div>}
          {shopMore && <div className="mt-5 text-center">
            <button type="button" onClick={() => void loadShopMore()} className="min-h-11 rounded-xl border border-fb-divider bg-fb-card px-5 text-sm font-semibold text-fb-text transition hover:bg-fb-hover">Xem thêm vật phẩm</button>
          </div>}
        </div>
      </section>
    </>}
  </main>;
}
