import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const envelope = (data: unknown, status = 200, code = '1000') =>
  new Response(JSON.stringify({ code, message: 'SUCCESS', data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** sessionStorage giả (môi trường test là Node). */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
  };
}

let inFlight = 0;
let maxInFlight = 0;
const started: string[] = [];

beforeEach(() => {
  inFlight = 0;
  maxInFlight = 0;
  started.length = 0;
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost/api/v1');
  vi.stubGlobal('sessionStorage', memoryStorage());
  vi.resetModules();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request) => {
      const path = new URL(input.url).pathname.replace('/api/v1', '');
      started.push(path);
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      if (path === '/search') {
        return envelope({
          items: Array.from({ length: 20 }, (_, i) => ({
            session: {
              session_id: i + 1,
              title: `Bộ ${i + 1}`,
              subject_name: 'Web',
            },
          })),
          pagination: { has_next: false },
        });
      }
      if (path === '/subjects')
        return envelope([{ subject_id: 2, name: 'Web' }]);
      return envelope({
        questions: [{ question_id: 1, comment_count: 1, my_interaction: {} }],
      });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function load() {
  (await import('../src/api/token')).tokenStore.set('token');
  return import('../src/features/bank/bankQuery');
}

describe('/bank — tải một lượt, song song', () => {
  it('danh sách và môn học gọi cùng lúc, thống kê 8 yêu cầu song song', async () => {
    const { fetchBankSnapshot } = await load();
    const snap = await fetchBankSnapshot();

    expect(started.slice(0, 2).sort()).toEqual(['/search', '/subjects']);
    expect(snap.sets).toHaveLength(20);
    expect(snap.subjects).toHaveLength(1);
    expect(Object.keys(snap.stats)).toHaveLength(20);
    expect(maxInFlight).toBe(8);
  });
});

describe('/bank — cache sessionStorage theo tài khoản', () => {
  it('lưu rồi đọc lại; tài khoản khác không thấy', async () => {
    const { writeStoredSnapshot, readStoredSnapshot } = await load();
    const data = { sets: [], subjects: [], stats: {} };
    writeStoredSnapshot('144', data);
    expect(readStoredSnapshot('144')?.data).toEqual(data);
    expect(readStoredSnapshot('999')).toBeUndefined();
  });

  it('bản lưu quá 1 giờ bị bỏ', async () => {
    const { writeStoredSnapshot, readStoredSnapshot } = await load();
    vi.useFakeTimers();
    try {
      writeStoredSnapshot('144', { sets: [], subjects: [], stats: {} });
      vi.advanceTimersByTime(61 * 60 * 1000);
      expect(readStoredSnapshot('144')).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('đăng xuất xoá mọi bản lưu /bank, giữ khoá khác', async () => {
    const { writeStoredSnapshot, clearStoredSnapshots } = await load();
    writeStoredSnapshot('144', { sets: [], subjects: [], stats: {} });
    sessionStorage.setItem('other', 'x');
    clearStoredSnapshots();
    expect(sessionStorage.length).toBe(1);
    expect(sessionStorage.getItem('other')).toBe('x');
  });

  it('dữ liệu hỏng trong storage không làm hỏng trang', async () => {
    const { readStoredSnapshot } = await load();
    sessionStorage.setItem('sqb_bank_v1_144', '{not json');
    expect(readStoredSnapshot('144')).toBeUndefined();
  });
});
