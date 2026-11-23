import { describe, expect, it } from 'vitest';
import {
  canAccessTab,
  postLoginDestination,
  profilePath,
  profileUserIdFromPath,
  tabFromPath,
} from '../src/app/routes';

describe('profile routes', () => {
  it('encodes the user ID in the profile URL and restores it from the path', () => {
    expect(profilePath('student/42')).toBe('/profile/student%2F42');
    expect(profileUserIdFromPath('/profile/student%2F42')).toBe('student/42');
    expect(tabFromPath('/profile/student%2F42')).toBe('profile');
  });

  it('keeps the legacy profile path for the signed-in user', () => {
    expect(profilePath(null)).toBe('/profile');
    expect(profileUserIdFromPath('/profile')).toBeNull();
    expect(tabFromPath('/profile')).toBe('profile');
    expect(profileUserIdFromPath('/profile/user/extra')).toBeNull();
  });
});

describe('post-login navigation', () => {
  it('returns to an internal post link after login', () => {
    expect(postLoginDestination('?next=%2Ffeed%3Fpost%3Dpost_01')).toBe(
      '/feed?post=post_01',
    );
  });

  it('falls back to Feed for external or unknown destinations', () => {
    expect(postLoginDestination('?next=%2F%2Fevil.example')).toBe('/feed');
    expect(postLoginDestination('?next=%2Funknown')).toBe('/feed');
  });

  it('limits lecturer-only tabs to lecturer accounts', () => {
    expect(canAccessTab('STUDENT', 'review')).toBe(false);
    expect(canAccessTab('STUDENT', 'lecturer-bank')).toBe(false);
    expect(canAccessTab('STUDENT', 'exams')).toBe(false);
    expect(canAccessTab('LECTURER', 'review')).toBe(true);
    expect(canAccessTab('LECTURER', 'lecturer-bank')).toBe(true);
    expect(canAccessTab('LECTURER', 'exams')).toBe(true);
    expect(canAccessTab('STUDENT', 'friends')).toBe(true);
  });
});
