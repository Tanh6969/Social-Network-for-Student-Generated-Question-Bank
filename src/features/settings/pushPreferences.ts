export const pushNotificationTypes = [
  { id: 'POST_LIKE', label: 'Có người thích bài viết của bạn' },
  { id: 'POST_COMMENT', label: 'Có người bình luận bài viết của bạn' },
  { id: 'FRIEND_POST', label: 'Bạn bè đăng bài viết mới' },
  { id: 'NEW_MESSAGE', label: 'Có người gửi tin nhắn cho bạn' },
  { id: 'FRIEND_REQUEST', label: 'Có người muốn kết bạn với bạn' },
  { id: 'NEW_DEVICE_LOGIN', label: 'Tài khoản đăng nhập trên máy khác' },
] as const;

export type PushNotificationType = (typeof pushNotificationTypes)[number]['id'];
export type PushSoundMode = 'DEFAULT' | 'VOICE';

export interface LocalPushPreferences {
  enabled: boolean;
  soundMode: PushSoundMode;
  notifications: Record<PushNotificationType, boolean>;
}

const databaseName = 'sqb-local-settings';
const databaseVersion = 1;
const voiceStoreName = 'notification-voice-recordings';

export const createDefaultPushPreferences = (): LocalPushPreferences => ({
  enabled: true,
  soundMode: 'DEFAULT',
  notifications: {
    POST_LIKE: true,
    POST_COMMENT: true,
    FRIEND_POST: true,
    NEW_MESSAGE: true,
    FRIEND_REQUEST: true,
    NEW_DEVICE_LOGIN: true,
  },
});

export const loadPushPreferences = (userId: string): LocalPushPreferences => {
  const raw = localStorage.getItem(`sqb:push-preferences:${userId}`);
  if (!raw) return createDefaultPushPreferences();

  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Dữ liệu cài đặt thông báo không hợp lệ.');
  }

  const value = parsed as Partial<LocalPushPreferences>;
  const defaults = createDefaultPushPreferences();
  const notifications = { ...defaults.notifications };

  if (value.notifications && typeof value.notifications === 'object') {
    for (const { id } of pushNotificationTypes) {
      const enabled = value.notifications[id];
      if (typeof enabled === 'boolean') notifications[id] = enabled;
    }
  }

  return {
    enabled:
      typeof value.enabled === 'boolean' ? value.enabled : defaults.enabled,
    soundMode: value.soundMode === 'VOICE' ? 'VOICE' : defaults.soundMode,
    notifications,
  };
};

export const savePushPreferences = (
  userId: string,
  preferences: LocalPushPreferences,
): void => {
  localStorage.setItem(
    `sqb:push-preferences:${userId}`,
    JSON.stringify(preferences),
  );
};

const openVoiceDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(voiceStoreName)) {
        database.createObjectStore(voiceStoreName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Không thể mở kho lưu bản ghi.'));
  });

export const loadVoiceRecording = async (
  userId: string,
): Promise<Blob | undefined> => {
  const database = await openVoiceDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(voiceStoreName, 'readonly');
    const request = transaction.objectStore(voiceStoreName).get(userId);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () =>
      reject(request.error ?? new Error('Không thể đọc bản ghi giọng nói.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => database.close();
  });
};

export const saveVoiceRecording = async (
  userId: string,
  recording: Blob,
): Promise<void> => {
  const database = await openVoiceDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(voiceStoreName, 'readwrite');
    transaction.objectStore(voiceStoreName).put(recording, userId);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(
        transaction.error ?? new Error('Không thể lưu bản ghi giọng nói.'),
      );
    };
  });
};

export const deleteVoiceRecording = async (userId: string): Promise<void> => {
  const database = await openVoiceDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(voiceStoreName, 'readwrite');
    transaction.objectStore(voiceStoreName).delete(userId);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(
        transaction.error ?? new Error('Không thể xóa bản ghi giọng nói.'),
      );
    };
  });
};
