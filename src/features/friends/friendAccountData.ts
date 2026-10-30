import type { AppNotification, FriendStatus } from '../demo/types';
import { mockCurrentUserStudent } from '../../mocks/mockData';

export type FriendStatusesByAccount = Record<
  string,
  Record<string, FriendStatus>
>;

export const mockPeerFriendsMap: Record<string, string[]> = {
  user_sv_02: ['user_sv_03', 'user_sv_04', 'user_sv_07'],
  user_sv_03: ['user_sv_02', 'user_sv_05', 'user_sv_06'],
  user_sv_04: ['user_sv_02', 'user_sv_08', 'user_sv_09'],
  user_sv_05: ['user_sv_03', 'user_sv_06', 'user_sv_08'],
  user_sv_06: ['user_sv_03', 'user_sv_05', 'user_sv_07'],
  user_sv_07: ['user_sv_02', 'user_sv_06', 'user_sv_09'],
  user_sv_08: ['user_sv_04', 'user_sv_05'],
  user_sv_09: ['user_sv_04', 'user_sv_07'],
  user_gv_01: ['user_gv_02'],
  user_gv_02: ['user_gv_01'],
};

function reciprocalStatus(status: FriendStatus): FriendStatus {
  if (status === 'REQUEST_SENT') return 'REQUEST_RECEIVED';
  if (status === 'REQUEST_RECEIVED') return 'REQUEST_SENT';
  return status;
}

const initialAccountFriendStatuses: FriendStatusesByAccount = {
  [mockCurrentUserStudent.id]: {
    user_sv_02: 'REQUEST_RECEIVED',
    user_sv_03: 'FRIEND',
    user_sv_04: 'NONE',
    user_sv_05: 'FRIEND',
    user_sv_06: 'FRIEND',
    user_sv_07: 'FRIEND',
    user_sv_08: 'REQUEST_RECEIVED',
    user_sv_09: 'NONE',
  },
};

function createInitialFriendStatuses(): FriendStatusesByAccount {
  const statuses: FriendStatusesByAccount = {};
  const setRelationship = (
    accountId: string,
    otherAccountId: string,
    status: FriendStatus,
  ) => {
    statuses[accountId] = {
      ...statuses[accountId],
      [otherAccountId]: status,
    };
    statuses[otherAccountId] = {
      ...statuses[otherAccountId],
      [accountId]: reciprocalStatus(status),
    };
  };

  for (const [accountId, friendIds] of Object.entries(mockPeerFriendsMap)) {
    for (const friendId of friendIds) {
      setRelationship(accountId, friendId, 'FRIEND');
    }
  }

  for (const [accountId, relationships] of Object.entries(
    initialAccountFriendStatuses,
  )) {
    for (const [otherAccountId, status] of Object.entries(relationships)) {
      setRelationship(accountId, otherAccountId, status);
    }
  }

  return statuses;
}

export const initialFriendStatusesByAccount = createInitialFriendStatuses();

export function getFriendStatusesForAccount(
  statusesByAccount: FriendStatusesByAccount,
  accountId: string,
): Record<string, FriendStatus> {
  return statusesByAccount[accountId] ?? {};
}

export function getNotificationsForAccount(
  notifications: AppNotification[],
  accountId: string,
): AppNotification[] {
  return notifications.filter(
    (notification) =>
      notification.recipientId === accountId &&
      notification.actor?.id !== accountId,
  );
}
