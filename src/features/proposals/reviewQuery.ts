import { useQuery, type QueryClient } from '@tanstack/react-query';
import { proposalGateway } from './proposalGateway';
import type { PendingSessionItemDto } from './types';

export const reviewableSessionsQueryKey = (userId: string) =>
  ['lecturer-reviewable-sessions', userId] as const;

export function normalizedSessionStatus(
  status?: string | null,
): 'PENDING' | 'REVIEWING' | 'RESOLVED' {
  const value = status?.trim().toUpperCase();
  if (value === 'REVIEWING') return 'REVIEWING';
  if (value === 'RESOLVED') return 'RESOLVED';
  return 'PENDING';
}

export function countPendingReviewable(
  items?: PendingSessionItemDto[],
): number {
  if (!items) return 0;
  return items.filter((s) => normalizedSessionStatus(s.status) === 'PENDING')
    .length;
}

export function useReviewableSessions(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: reviewableSessionsQueryKey(userId),
    queryFn: () => proposalGateway.getPendingSessions(),
    enabled,
    staleTime: 30_000,
  });
}

export function invalidateReviewableSessions(client: QueryClient) {
  return client.invalidateQueries({
    queryKey: ['lecturer-reviewable-sessions'],
  });
}
