import type { MainTab, Role } from '../features/demo/types';

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

export function postLoginDestination(search: string): string {
  const next = new URLSearchParams(search).get('next');
  if (!next || !next.startsWith('/') || next.startsWith('//'))
    return tabPaths.feed;
  const pathname = next.split(/[?#]/u)[0];
  return tabFromPath(pathname) ? next : tabPaths.feed;
}

export function canAccessTab(role: Role, tab: MainTab): boolean {
  const lecturerOnlyTabs: MainTab[] = ['review', 'lecturer-bank', 'exams'];
  return role === 'LECTURER' || !lecturerOnlyTabs.includes(tab);
}
