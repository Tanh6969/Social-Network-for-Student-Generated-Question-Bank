import { useCallback, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { errorMessage } from '../../../api';
import { cosmeticsApi, type InventoryItemDto, type ShopItemDto } from '../../../api/cosmetics';
import { SkeletonRows } from '../../../shared/components/Skeleton';
import { postsApi } from '../../../api/posts';
import { applyProfile } from '../../auth/mapAuthUser';
import { useApp } from '../../demo/context/AppContext';

export function ApiCosmeticsView() {
  const { currentUser, updateCurrentUser } = useApp();
  const [shop, setShop] = useState<ShopItemDto[]>([]);
  const [inventory, setInventory] = useState<InventoryItemDto[]>([]);
  const [equipped, setEquipped] = useState<Record<string, number>>({});
  const [coins, setCoins] = useState<number | null>(null);
  const [shopAfter, setShopAfter] = useState<number | undefined>();
  const [inventoryAfter, setInventoryAfter] = useState<number | undefined>();
  const [shopMore, setShopMore] = useState(false);
  const [inventoryMore, setInventoryMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [confirmBuy, setConfirmBuy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [shopPage, bagPage] = await Promise.all([
      cosmeticsApi.getShop(), cosmeticsApi.getInventory(),
    ]);
    setShop(shopPage?.items ?? []);
    setCoins(shopPage?.user_points ?? null);
    setShopAfter(shopPage?.pagination?.after);
    setShopMore(shopPage?.pagination?.has_next ?? false);
    setInventory(bagPage?.inventory ?? []);
    setInventoryAfter(bagPage?.pagination?.after);
    setInventoryMore(bagPage?.pagination?.has_next ?? false);
    setEquipped(Object.fromEntries(Object.entries(bagPage?.currently_equipped ?? {})
      .filter((entry) => entry[1]?.cosmetic_id != null)
      .map(([slot, item]) => [slot, item.cosmetic_id!] as const)));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void reload().catch((cause: unknown) => {
      if (!cancelled) setError(errorMessage(cause, 'Không tải được kho vật phẩm.'));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reload]);

  const act = async (id: number, action: 'buy' | 'equip' | 'unequip') => {
    setBusy(id);
    setError(null);
    try {
      await cosmeticsApi[action](id);
      await reload();
      if (action !== 'buy') {
        const profile = await postsApi.getMyProfile();
        updateCurrentUser({ frameUrl: applyProfile(currentUser, profile).frameUrl });
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
      const page = await cosmeticsApi.getShop(shopAfter);
      setShop((previous) => [...previous, ...(page?.items ?? []).filter((item) =>
        !previous.some((old) => old.cosmetic_id === item.cosmetic_id))]);
      setShopAfter(page?.pagination?.after);
      setShopMore(page?.pagination?.has_next ?? false);
    } catch (cause: unknown) { setError(errorMessage(cause, 'Không tải thêm được vật phẩm.')); }
  };
  const loadInventoryMore = async () => {
    if (inventoryAfter == null) return;
    try {
      const page = await cosmeticsApi.getInventory(inventoryAfter);
      setInventory((previous) => [...previous, ...(page?.inventory ?? []).filter((item) =>
        !previous.some((old) => old.cosmetic_id === item.cosmetic_id))]);
      setInventoryAfter(page?.pagination?.after);
      setInventoryMore(page?.pagination?.has_next ?? false);
    } catch (cause: unknown) { setError(errorMessage(cause, 'Không tải thêm được túi đồ.')); }
  };

  return <main className="mx-auto max-w-5xl space-y-6 px-3 py-5 sm:px-6">
    <header className="rounded-lg bg-fb-card p-5 shadow-fb-card">
      <h1 className="flex items-center gap-2 text-xl font-bold text-fb-text"><Sparkles className="h-5 w-5" />Kho vật phẩm</h1>
      {coins != null && <p className="mt-1 text-sm text-fb-text-2">SQB Coins: {coins}</p>}
    </header>
    {error && <p role="alert" className="rounded-lg bg-fb-card p-4 text-sm text-fb-danger">{error}</p>}
    {loading && <SkeletonRows count={3} label="Đang tải vật phẩm…" />}
    {!loading && <>
      <section className="space-y-3"><h2 className="font-bold text-fb-text">Túi đồ của tôi</h2>
        {inventory.length === 0 && <p className="text-sm text-fb-text-2">Bạn chưa có vật phẩm.</p>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{inventory.map((item) =>
          <div key={item.cosmetic_id} className="rounded-lg bg-fb-card p-4 shadow-fb-card">
            {item.asset_url && <img src={item.asset_url} alt="" className="mb-3 h-16 w-16 object-contain" />}
            <p className="font-semibold text-fb-text">{item.name}</p>
            <p className="text-xs text-fb-text-2">{item.description}</p>
            <p className="mt-2 text-xs text-fb-text-2">{item.rarity} · {item.type === 'CHAT_BUBBLE' ? 'Bong bóng chat' : 'Khung ảnh'}</p>
            {item.cosmetic_id != null && <button type="button" disabled={busy === item.cosmetic_id}
              onClick={() => void act(item.cosmetic_id!, equipped[item.type ?? ''] === item.cosmetic_id ? 'unequip' : 'equip')}
              className="mt-3 rounded-lg bg-fb-blue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              {equipped[item.type ?? ''] === item.cosmetic_id ? 'Gỡ bỏ' : 'Trang bị'}
            </button>}
          </div>)}</div>
        {inventoryMore && <button type="button" onClick={() => void loadInventoryMore()} className="text-sm font-semibold text-fb-blue">Xem thêm túi đồ</button>}
      </section>
      <section className="space-y-3"><h2 className="font-bold text-fb-text">Cửa hàng</h2>
        {shop.length === 0 && <p className="text-sm text-fb-text-2">Chưa có vật phẩm đang bán.</p>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{shop.map((item) =>
          <div key={item.cosmetic_id} className="rounded-lg bg-fb-card p-4 shadow-fb-card">
            {item.asset_url && <img src={item.asset_url} alt="" className="mb-3 h-16 w-16 object-contain" />}
            <p className="font-semibold text-fb-text">{item.name}</p>
            <p className="text-xs text-fb-text-2">{item.description}</p>
            <p className="mt-2 text-sm text-fb-text">{item.price ?? 0} SQB Coins</p>
            {item.owned ? <p className="mt-3 text-xs text-fb-text-2">Đã sở hữu</p> : item.cosmetic_id != null &&
              (confirmBuy === item.cosmetic_id ? <div className="mt-3 flex gap-3 text-xs">
                <span>Xác nhận mua?</span>
                <button type="button" disabled={busy === item.cosmetic_id} onClick={() => void act(item.cosmetic_id!, 'buy')} className="font-semibold text-fb-blue">Mua</button>
                <button type="button" onClick={() => setConfirmBuy(null)}>Hủy</button>
              </div> : <button type="button" onClick={() => setConfirmBuy(item.cosmetic_id!)} className="mt-3 rounded-lg bg-fb-blue px-3 py-1.5 text-xs font-semibold text-white">Mua vật phẩm</button>)}
          </div>)}</div>
        {shopMore && <button type="button" onClick={() => void loadShopMore()} className="text-sm font-semibold text-fb-blue">Xem thêm cửa hàng</button>}
      </section>
    </>}
  </main>;
}
