import { beforeEach, describe, expect, it } from 'vitest';
import {
  createDefaultPushPreferences,
  loadPushPreferences,
  pushNotificationTypes,
  savePushPreferences,
} from '../src/features/settings/pushPreferences';

const storedValues = new Map<string, string>();

beforeEach(() => {
  storedValues.clear();
  const storage: Storage = {
    get length() {
      return storedValues.size;
    },
    clear: () => storedValues.clear(),
    getItem: (key) => storedValues.get(key) ?? null,
    key: (index) => [...storedValues.keys()][index] ?? null,
    removeItem: (key) => storedValues.delete(key),
    setItem: (key, value) => storedValues.set(key, value),
  };
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });
});

describe('local push preferences', () => {
  it('enables all six requested notification types by default', () => {
    const preferences = createDefaultPushPreferences();
    expect(pushNotificationTypes).toHaveLength(6);
    expect(Object.values(preferences.notifications)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(preferences.enabled).toBe(true);
    expect(preferences.soundMode).toBe('DEFAULT');
  });

  it('saves and restores preferences per user', () => {
    const preferences = createDefaultPushPreferences();
    preferences.enabled = false;
    preferences.soundMode = 'VOICE';
    preferences.notifications.NEW_MESSAGE = false;
    savePushPreferences('student-1', preferences);

    expect(loadPushPreferences('student-1')).toEqual(preferences);
    expect(loadPushPreferences('student-2')).toEqual(
      createDefaultPushPreferences(),
    );
  });

  it('rejects malformed saved data instead of treating it as successfully loaded', () => {
    storedValues.set('sqb:push-preferences:student-1', '{');
    expect(() => loadPushPreferences('student-1')).toThrow();
  });
});
