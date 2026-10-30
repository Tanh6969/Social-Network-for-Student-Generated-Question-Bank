import { describe, expect, it } from 'vitest';
import {
  areConversationSnapshotsEqual,
  isSharedChatMessage,
} from '../src/features/messenger/sharedChatSync';
import { mockConversations } from '../src/mocks/mockData';

describe('shared chat synchronization', () => {
  it('accepts snapshot requests and valid conversation updates only', () => {
    expect(isSharedChatMessage({ type: 'REQUEST_SNAPSHOT' })).toBe(true);
    expect(
      isSharedChatMessage({
        type: 'UPDATE_SNAPSHOT',
        conversations: [mockConversations[0]],
      }),
    ).toBe(true);
    expect(
      isSharedChatMessage({
        type: 'UPDATE_SNAPSHOT',
        conversations: [{ id: 'bad' }],
      }),
    ).toBe(false);
    expect(isSharedChatMessage(null)).toBe(false);
  });

  it('detects identical conversation snapshots', () => {
    expect(
      areConversationSnapshotsEqual(mockConversations, [...mockConversations]),
    ).toBe(true);
    expect(areConversationSnapshotsEqual(mockConversations, [])).toBe(false);
  });
});
