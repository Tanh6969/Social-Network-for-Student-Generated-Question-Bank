import { describe, expect, it } from 'vitest';
import {
  arePostSnapshotsEqual,
  isSharedFeedMessage,
} from '../src/features/feed/sharedFeedSync';
import { mockPosts } from '../src/mocks/mockData';

describe('shared feed synchronization', () => {
  it('accepts snapshot requests and valid post updates only', () => {
    expect(isSharedFeedMessage({ type: 'REQUEST_SNAPSHOT' })).toBe(true);
    expect(
      isSharedFeedMessage({
        type: 'UPDATE_SNAPSHOT',
        posts: [mockPosts[0]],
      }),
    ).toBe(true);
    expect(
      isSharedFeedMessage({ type: 'UPDATE_SNAPSHOT', posts: [{ id: 'bad' }] }),
    ).toBe(false);
    expect(isSharedFeedMessage(null)).toBe(false);
  });

  it('detects identical snapshots without replacing unchanged feed state', () => {
    expect(arePostSnapshotsEqual(mockPosts, [...mockPosts])).toBe(true);
    expect(arePostSnapshotsEqual(mockPosts, [])).toBe(false);
  });
});
