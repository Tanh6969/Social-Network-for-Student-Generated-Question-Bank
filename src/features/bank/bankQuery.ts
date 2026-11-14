/**
 * Dữ liệu /bank qua React Query: tải một lượt, cache, tải trước.
 *
 * Backend trả `Cache-Control: no-store` và mỗi yêu cầu mất ~0,7 s, nên:
 * - Danh sách bộ + danh mục môn gọi song song, rồi thống kê mọi bộ gọi song
 *   song (8 yêu cầu cùng lúc). Trang hiện MỘT lần khi đủ dữ liệu, không nhảy
 *   số lần lượt.
 * - Kết quả được cache trong bộ nhớ (quay lại /bank là có ngay, cập nhật ngầm)
 *   và trong sessionStorage theo tài khoản (đăng nhập lại cùng tab vẫn có ngay).
 */
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { examsApi, type SubjectResponse } from '../../api';
import { bankGateway, type BankSet, type BankSetStats } from './bankGateway';

export type StatsState = Record<number, BankSetStats | 'error'>;

export interface BankSnapshot {
  sets: BankSet[];
  subjects: SubjectResponse[];
  stats: StatsState;
}

/** Dữ liệu được coi là mới trong 1 phút; sau đó hiện bản cũ và tải lại ngầm. */
const STALE_MS = 60_000;
/** Giữ trong bộ nhớ 30 phút sau khi rời trang. */
const GC_MS = 30 * 60_000;
/** Bản lưu trong sessionStorage quá 1 giờ thì bỏ. */
const STORAGE_MAX_AGE_MS = 60 * 60_000;
const STORAGE_PREFIX = 'sqb_bank_v1_';

export const bankQueryKey = (userId: string) => ['bank', userId] as const;

export async function fetchBankSnapshot(): Promise<BankSnapshot> {
  const [sets, subjects] = await Promise.all([
    bankGateway.loadSets(),
    // Danh mục môn chỉ để hiện cả môn chưa có bộ nào: lỗi thì bỏ qua.
    examsApi.getAllSubjects().catch(() => [] as SubjectResponse[]),
  ]);
  const stats: StatsState = {};
  await bankGateway.loadAllStats(
    sets.map((s) => s.sessionId),
    (id, value) => {
      stats[id] = value;
    },
    (id) => {
      stats[id] = 'error';
    },
  );
  return { sets, subjects, stats };
}

// ---- sessionStorage (mỗi tab, theo tài khoản) ----

interface Stored {
  savedAt: number;
  data: BankSnapshot;
}

function storageKey(userId: string) {
  return STORAGE_PREFIX + userId;
}

export function readStoredSnapshot(
  userId: string,
): { data: BankSnapshot; savedAt: number } | undefined {
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    if (!raw) return undefined;
    const stored = JSON.parse(raw) as Stored;
    if (
      !stored?.data?.sets ||
      Date.now() - stored.savedAt > STORAGE_MAX_AGE_MS
    ) {
      return undefined;
    }
    return { data: stored.data, savedAt: stored.savedAt };
  } catch {
    return undefined;
  }
}

export function writeStoredSnapshot(userId: string, data: BankSnapshot) {
  try {
    const stored: Stored = { savedAt: Date.now(), data };
    sessionStorage.setItem(storageKey(userId), JSON.stringify(stored));
  } catch {
    // Hết dung lượng / bị chặn: chỉ mất cache, trang vẫn chạy.
  }
}

/** Xoá cache /bank đã lưu (gọi khi đăng xuất). */
export function clearStoredSnapshots() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

function queryOptions(userId: string) {
  const stored = readStoredSnapshot(userId);
  return {
    queryKey: bankQueryKey(userId),
    queryFn: async () => {
      const data = await fetchBankSnapshot();
      writeStoredSnapshot(userId, data);
      return data;
    },
    staleTime: STALE_MS,
    gcTime: GC_MS,
    initialData: stored?.data,
    initialDataUpdatedAt: stored?.savedAt,
  };
}

export function useBankSnapshot(userId: string, enabled = true) {
  return useQuery({ ...queryOptions(userId), enabled });
}

/** Tải trước khi rê chuột vào mục Ngân hàng đề (bỏ qua nếu cache còn mới). */
export function prefetchBank(client: QueryClient, userId: string) {
  return client.prefetchQuery(queryOptions(userId));
}

/** Cập nhật số liệu một bộ trong cache (sau khi làm bài / đánh giá). */
export async function refreshSetStats(
  client: QueryClient,
  userId: string,
  sessionId: number,
) {
  const value = await bankGateway.loadStats(sessionId);
  client.setQueryData<BankSnapshot>(bankQueryKey(userId), (prev) => {
    if (!prev) return prev;
    const next = { ...prev, stats: { ...prev.stats, [sessionId]: value } };
    writeStoredSnapshot(userId, next);
    return next;
  });
}
