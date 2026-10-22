import type { MainTab } from '../features/demo/types';

export const tabPaths: Record<MainTab, string> = {
  feed: '/feed',
  bank: '/bank',
  'lecturer-bank': '/lecturer-bank',
  propose: '/propose',
  watch: '/watch',
  game: '/games',
  friends: '/friends',
  review: '/review',
  messenger: '/messages',
  profile: '/profile',
  cosmetics: '/cosmetics',
  settings: '/settings',
  exams: '/exams',
  search: '/search',
};

export function tabFromPath(pathname: string): MainTab | null {
  return (
    (Object.entries(tabPaths).find(
      ([, path]) => pathname === path,
    )?.[0] as MainTab) ?? null
  );
}
