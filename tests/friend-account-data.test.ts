import { describe, expect, it } from 'vitest';
import {
  getFriendStatusesForAccount,
  getNotificationsForAccount,
  initialFriendStatusesByAccount,
} from '../src/features/friends/friendAccountData';
import {
  mockCurrentUserStudent,
  mockNotifications,
  mockOtherUsers,
} from '../src/mocks/mockData';

describe('account-specific friend data', () => {
  it('initializes the Nam and Quang Huy friendship from both accounts', () => {
    const namStatuses = getFriendStatusesForAccount(
      initialFriendStatusesByAccount,
      mockCurrentUserStudent.id,
    );
    const quangHuy = mockOtherUsers.find((user) => user.id === 'user_sv_03')!;
    const quangHuyStatuses = getFriendStatusesForAccount(
      initialFriendStatusesByAccount,
      quangHuy.id,
    );

    expect(namStatuses[quangHuy.id]).toBe('FRIEND');
    expect(quangHuyStatuses[mockCurrentUserStudent.id]).toBe('FRIEND');
  });

  it('keeps every seeded friendship reciprocal across demo accounts', () => {
    for (const [accountId, relationships] of Object.entries(
      initialFriendStatusesByAccount,
    )) {
      for (const [otherAccountId, status] of Object.entries(relationships)) {
        if (status !== 'FRIEND') continue;
        expect(
          getFriendStatusesForAccount(
            initialFriendStatusesByAccount,
            otherAccountId,
          )[accountId],
        ).toBe('FRIEND');
      }
    }
  });

  it('keeps the seeded request as outgoing for its sender and received by Nam', () => {
    const namStatuses = getFriendStatusesForAccount(
      initialFriendStatusesByAccount,
      mockCurrentUserStudent.id,
    );
    const sender = mockOtherUsers[0];
    const senderStatuses = getFriendStatusesForAccount(
      initialFriendStatusesByAccount,
      sender.id,
    );
    expect(senderStatuses[mockCurrentUserStudent.id]).toBe('REQUEST_SENT');
    expect(namStatuses[sender.id]).toBe('REQUEST_RECEIVED');
  });

  it('only returns notifications for their recipient and hides self-sent items', () => {
    const sender = mockOtherUsers[0];
    const friendRequest = mockNotifications.find(
      (notification) => notification.type === 'FRIEND_REQUEST',
    )!;

    expect(
      getNotificationsForAccount(mockNotifications, mockCurrentUserStudent.id),
    ).toContain(friendRequest);
    expect(getNotificationsForAccount(mockNotifications, sender.id)).toEqual(
      [],
    );
    expect(
      getNotificationsForAccount(
        [{ ...friendRequest, recipientId: sender.id }],
        sender.id,
      ),
    ).toEqual([]);
  });
});
