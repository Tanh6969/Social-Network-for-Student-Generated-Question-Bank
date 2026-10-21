import { describe, expect, it } from 'vitest';
import {
  getMediaKind,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  validateMediaFile,
} from '../src/features/feed/mediaUtils';

describe('post media validation', () => {
  it('accepts an image at 4 MB and rejects one byte above the limit', () => {
    expect(
      validateMediaFile({ type: 'image/jpeg', size: MAX_IMAGE_BYTES }),
    ).toBeNull();
    expect(
      validateMediaFile({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 }),
    ).toContain('4 MB');
  });

  it('keeps the image limit separate from the video limit', () => {
    expect(getMediaKind('video/mp4')).toBe('video');
    expect(
      validateMediaFile({ type: 'video/mp4', size: MAX_IMAGE_BYTES + 1 }),
    ).toBeNull();
    expect(
      validateMediaFile({ type: 'video/mp4', size: MAX_VIDEO_BYTES + 1 }),
    ).toContain('10 MB');
    expect(validateMediaFile({ type: 'application/pdf', size: 1 })).toContain(
      'ảnh hoặc video',
    );
  });
});
