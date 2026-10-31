import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import {
  User,
  Lock,
  Bell,
  Smartphone,
  Moon,
  Trash2,
  AlertTriangle,
  Ban,
  Unlock,
  Clock,
  Shield,
} from 'lucide-react';
import {
  createDefaultPushPreferences,
  deleteVoiceRecording,
  loadPushPreferences,
  loadVoiceRecording,
  pushNotificationTypes,
  savePushPreferences,
  saveVoiceRecording,
  type LocalPushPreferences,
} from '../pushPreferences';

export const SettingsView: React.FC = () => {
  const { currentUser } = useApp();
  return <SettingsContent key={currentUser.id} />;
};

const SettingsContent: React.FC = () => {
  const {
    currentUser,
    allUsers,
    blockedUsers,
    blockUser,
    unblockUser,
    isBlockedByMe,
    isDarkMode,
    toggleDarkMode,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'ACCOUNT' | 'BLOCKING' | 'SECURITY' | 'PUSH' | 'DEVICES' | 'DELETE'
  >('ACCOUNT');
  const [initialPushSettings] = useState(() => {
    try {
      return {
        preferences: loadPushPreferences(currentUser.id),
        error: null,
      };
    } catch (error) {
      return {
        preferences: createDefaultPushPreferences(),
        error:
          error instanceof Error
            ? error.message
            : 'Không thể đọc cài đặt thông báo đã lưu.',
      };
    }
  });
  const [pushPreferences, setPushPreferences] = useState(
    initialPushSettings.preferences,
  );
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isStartingVoiceRecording, setIsStartingVoiceRecording] =
    useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(
    initialPushSettings.error,
  );
  const [selectedBlockUserId, setSelectedBlockUserId] = useState('');
  const [blockReasonInput, setBlockReasonInput] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);
  const voicePreviewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void loadVoiceRecording(currentUser.id)
      .then((recording) => {
        if (isMounted && recording) {
          const previewUrl = URL.createObjectURL(recording);
          voicePreviewUrlRef.current = previewUrl;
          setVoicePreviewUrl(previewUrl);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setSettingsError(
            error instanceof Error
              ? error.message
              : 'Không thể tải bản ghi giọng nói đã lưu.',
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingVoice(false);
      });

    return () => {
      isMounted = false;
      if (recordingTimeoutRef.current !== null) {
        window.clearTimeout(recordingTimeoutRef.current);
      }
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.onerror = null;
        mediaRecorderRef.current.stop();
      }
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (voicePreviewUrlRef.current) {
        URL.revokeObjectURL(voicePreviewUrlRef.current);
        voicePreviewUrlRef.current = null;
      }
    };
  }, [currentUser.id]);

  const updatePushPreferences = (next: LocalPushPreferences) => {
    try {
      savePushPreferences(currentUser.id, next);
      setPushPreferences(next);
      setSettingsError(null);
      showToast('Đã lưu cài đặt trên trình duyệt này', 'success');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Không thể lưu cài đặt thông báo.';
      setSettingsError(message);
      showToast(message, 'error');
    }
  };

  const setVoicePreview = (recording: Blob | null) => {
    if (voicePreviewUrlRef.current) {
      URL.revokeObjectURL(voicePreviewUrlRef.current);
      voicePreviewUrlRef.current = null;
    }

    if (!recording) {
      setVoicePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(recording);
    voicePreviewUrlRef.current = previewUrl;
    setVoicePreviewUrl(previewUrl);
  };

  const startVoiceRecording = async () => {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      showToast('Trình duyệt này không hỗ trợ ghi âm bằng micro.', 'error');
      return;
    }

    let acquiredStream: MediaStream | null = null;
    setIsStartingVoiceRecording(true);
    try {
      acquiredStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const stream = acquiredStream;
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => {
        if (recordingTimeoutRef.current !== null) {
          window.clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        showToast('Đã xảy ra lỗi khi ghi âm. Vui lòng thử lại.', 'error');
        recorder.onstop = null;
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecordingVoice(false);
        setIsStartingVoiceRecording(false);
      };
      recorder.onstop = () => {
        if (recordingTimeoutRef.current !== null) {
          window.clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecordingVoice(false);
        setIsStartingVoiceRecording(false);

        if (chunks.length === 0) {
          showToast('Không có âm thanh được ghi. Hãy thử ghi lại.', 'warning');
          return;
        }

        const recording = new Blob(chunks, {
          type: recorder.mimeType || 'audio/webm',
        });
        void saveVoiceRecording(currentUser.id, recording)
          .then(() => {
            setVoicePreview(recording);
            setSettingsError(null);
            showToast(
              'Đã lưu bản ghi giọng nói trên trình duyệt này',
              'success',
            );
          })
          .catch((error: unknown) => {
            const message =
              error instanceof Error
                ? error.message
                : 'Không thể lưu bản ghi giọng nói.';
            setSettingsError(message);
            showToast(message, 'error');
          });
      };

      recordingStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingVoice(true);
      setIsStartingVoiceRecording(false);
      recordingTimeoutRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 30_000);
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Bạn cần cấp quyền dùng micro để ghi âm.'
          : 'Không thể bắt đầu ghi âm. Hãy kiểm tra micro và thử lại.';
      acquiredStream?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
      mediaRecorderRef.current = null;
      setIsStartingVoiceRecording(false);
      showToast(message, 'error');
    }
  };

  const stopVoiceRecording = () => {
    if (recordingTimeoutRef.current !== null) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const removeVoiceRecording = async () => {
    try {
      await deleteVoiceRecording(currentUser.id);
      setVoicePreview(null);
      setSettingsError(null);
      showToast('Đã xóa bản ghi giọng nói', 'success');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Không thể xóa bản ghi giọng nói.';
      setSettingsError(message);
      showToast(message, 'error');
    }
  };

  const previewDefaultSound = () => {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.12, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.35,
      );
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.onended = () => void audioContext.close();
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.35);
    } catch {
      showToast('Không thể phát âm thanh thử trên trình duyệt này.', 'error');
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex flex-col md:flex-row gap-6 lg:gap-8 xl:gap-10 items-start">
      {/* CỘT TRÁI: Menu Cài đặt (sticky sát lề trái) */}
      <aside className="w-full md:w-80 shrink-0 space-y-2 select-none md:sticky md:top-18">
        <h2 className="text-xl font-black text-fb-text px-2 mb-3">
          Cài đặt & Quyền riêng tư
        </h2>

        <div className="bg-fb-card rounded-lg shadow-fb-card p-2 space-y-1 text-xs font-semibold text-fb-text">
          <button
            onClick={() => setActiveTab('ACCOUNT')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left ${
              activeTab === 'ACCOUNT'
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold'
                : 'hover:bg-fb-hover'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông tin tài khoản</span>
          </button>

          <button
            onClick={() => setActiveTab('BLOCKING')}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg transition text-left ${
              activeTab === 'BLOCKING'
                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 font-bold'
                : 'hover:bg-fb-hover'
            }`}
          >
            <div className="flex items-center gap-3">
              <Ban className="w-4 h-4 text-red-500" />
              <span>Quản lý chặn người dùng</span>
            </div>
            <span className="text-[10px] bg-fb-input px-2 py-0.5 rounded-full font-bold">
              {blockedUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left ${
              activeTab === 'SECURITY'
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold'
                : 'hover:bg-fb-hover'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Mật khẩu & Bảo mật</span>
          </button>

          <button
            onClick={() => setActiveTab('PUSH')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left ${
              activeTab === 'PUSH'
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold'
                : 'hover:bg-fb-hover'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Thông báo đẩy (NOTI.05)</span>
          </button>

          <button
            onClick={() => setActiveTab('DEVICES')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left ${
              activeTab === 'DEVICES'
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold'
                : 'hover:bg-fb-hover'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Quản lý thiết bị đăng nhập</span>
          </button>

          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-fb-hover transition text-left"
          >
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4" />
              <span>Chế độ tối (Dark mode)</span>
            </div>
            <span className="text-gray-400 font-normal">
              {isDarkMode ? 'Bật' : 'Tắt'}
            </span>
          </button>

          <div className="pt-2 border-t border-fb-divider">
            <button
              onClick={() => setActiveTab('DELETE')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left text-red-600 ${
                activeTab === 'DELETE'
                  ? 'bg-red-50 dark:bg-red-950/40 font-bold'
                  : 'hover:bg-red-50'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa tài khoản (USER.05)</span>
            </button>
          </div>
        </div>
      </aside>

      {/* CỘT PHẢI: Nội dung chi tiết */}
      <main className="flex-1 bg-fb-card rounded-lg shadow-fb-card p-6">
        {activeTab === 'ACCOUNT' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-base text-fb-text pb-2 border-b border-fb-divider">
              Thông tin tài khoản trường
            </h3>

            <div>
              <label className="block text-gray-500 mb-1">Họ và tên</label>
              <input
                type="text"
                disabled
                value={currentUser.name}
                className="w-full p-2.5 bg-fb-input rounded-lg border text-fb-text"
              />
            </div>

            <div>
              <label className="block text-gray-500 mb-1">
                Email trường (@truong.edu.vn)
              </label>
              <input
                type="text"
                disabled
                value={currentUser.email}
                className="w-full p-2.5 bg-fb-input rounded-lg border text-fb-text"
              />
            </div>

            <div>
              <label className="block text-gray-500 mb-1">
                Khoa / Viện đào tạo
              </label>
              <input
                type="text"
                disabled
                value={currentUser.faculty}
                className="w-full p-2.5 bg-fb-input rounded-lg border text-fb-text"
              />
            </div>
          </div>
        )}

        {activeTab === 'BLOCKING' && (
          <div className="space-y-5 text-xs">
            <div>
              <h3 className="font-bold text-base text-fb-text pb-2 border-b border-fb-divider">
                Quản lý danh sách chặn (Block / Unblock)
              </h3>
              <p className="text-gray-500 mt-2 leading-relaxed">
                Khi bạn chặn một người: người đó sẽ không còn là bạn bè của bạn,
                hai người không thể nhắn tin hoặc xem trang cá nhân của nhau, và
                bình luận của người đó sẽ được ẩn khỏi tầm nhìn của bạn (nhưng
                bình luận & like không bị xóa khỏi bài viết). Việc chặn lại sau
                khi bỏ chặn không bị giới hạn thời gian chờ.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-fb-input border border-fb-divider space-y-3">
              <label className="font-bold text-fb-text block">
                Thêm người vào danh sách chặn
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedBlockUserId}
                  onChange={(e) => setSelectedBlockUserId(e.target.value)}
                  className="flex-1 p-2.5 rounded-lg bg-fb-card border border-fb-divider"
                >
                  <option value="">-- Chọn người dùng cần chặn --</option>
                  {allUsers
                    .filter((u) => !isBlockedByMe(u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.classOrTitle})
                      </option>
                    ))}
                </select>
                <input
                  type="text"
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  placeholder="Lý do chặn (tùy chọn)..."
                  className="flex-1 p-2.5 rounded-lg bg-fb-card border border-fb-divider"
                />
                <button
                  type="button"
                  disabled={!selectedBlockUserId}
                  onClick={() => {
                    blockUser(selectedBlockUserId, blockReasonInput);
                    setSelectedBlockUserId('');
                    setBlockReasonInput('');
                  }}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-bold shrink-0"
                >
                  Chặn ngay
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-fb-text">
                Danh sách đối tượng đang bị chặn ({blockedUsers.length})
              </h4>
              {blockedUsers.length === 0 ? (
                <div className="py-8 text-center text-gray-400 border border-dashed border-fb-divider rounded-lg">
                  <Shield className="w-8 h-8 mx-auto mb-1 opacity-60" />
                  <p>Chưa có người dùng nào trong danh sách chặn.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-fb-divider rounded-lg px-4">
                  {blockedUsers.map((entry) => {
                    const u = allUsers.find((item) => item.id === entry.userId);
                    if (!u) return null;
                    return (
                      <div
                        key={entry.userId}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover grayscale"
                          />
                          <div>
                            <p className="font-bold text-fb-text">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {entry.blockedAt}
                              {entry.reason ? ` · ${entry.reason}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => unblockUser(u.id)}
                          className="px-3.5 py-1.5 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg font-bold flex items-center gap-1.5"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Bỏ chặn</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'SECURITY' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-base text-fb-text pb-2 border-b border-fb-divider">
              Mật khẩu & Bảo mật
            </h3>
            <p className="text-gray-500">
              Tài khoản của bạn đang được bảo vệ bởi xác thực trường học
              (@truong.edu.vn).
            </p>
          </div>
        )}

        {activeTab === 'PUSH' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-base text-fb-text pb-2 border-b border-fb-divider">
              Cài đặt thông báo đẩy (Push Notifications)
            </h3>

            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              Các lựa chọn và bản ghi được lưu riêng trên trình duyệt này.
              Backend chưa kết nối nhận thông báo đẩy, nên thay đổi tại đây chưa
              bật/tắt thông báo thật trên thiết bị.
            </p>

            {settingsError && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
              >
                {settingsError}
              </p>
            )}

            <label className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-3 dark:bg-[#1E1F20]">
              <span>
                <span className="block font-bold text-fb-text">
                  Bật thông báo đẩy
                </span>
                <span className="text-[11px] text-gray-500">
                  Tắt để lưu lựa chọn nhưng không muốn nhận thông báo.
                </span>
              </span>
              <input
                type="checkbox"
                checked={pushPreferences.enabled}
                onChange={(event) =>
                  updatePushPreferences({
                    ...pushPreferences,
                    enabled: event.target.checked,
                  })
                }
                className="h-4 w-4 rounded text-blue-600"
              />
            </label>

            <fieldset
              disabled={!pushPreferences.enabled}
              className="space-y-3 disabled:opacity-50"
            >
              <legend className="mb-2 font-bold text-fb-text">
                Loại thông báo
              </legend>
              {pushNotificationTypes.map(({ id, label }) => (
                <label
                  key={id}
                  className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-3 dark:bg-[#1E1F20]"
                >
                  <span className="font-semibold text-fb-text">
                    {label}
                  </span>
                  <input
                    type="checkbox"
                    checked={pushPreferences.notifications[id]}
                    onChange={(event) =>
                      updatePushPreferences({
                        ...pushPreferences,
                        notifications: {
                          ...pushPreferences.notifications,
                          [id]: event.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded text-blue-600"
                  />
                </label>
              ))}

              <fieldset className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <legend className="px-1 font-bold text-fb-text">
                  Âm thanh thông báo
                </legend>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="push-sound-mode"
                    checked={pushPreferences.soundMode === 'DEFAULT'}
                    onChange={() =>
                      updatePushPreferences({
                        ...pushPreferences,
                        soundMode: 'DEFAULT',
                      })
                    }
                  />
                  <span>Âm thanh mặc định</span>
                </label>
                <button
                  type="button"
                  onClick={previewDefaultSound}
                  disabled={!pushPreferences.enabled}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold hover:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-[#3A3B3C]"
                >
                  Nghe thử âm mặc định
                </button>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="push-sound-mode"
                    checked={pushPreferences.soundMode === 'VOICE'}
                    onChange={() =>
                      updatePushPreferences({
                        ...pushPreferences,
                        soundMode: 'VOICE',
                      })
                    }
                  />
                  <span>Âm thanh bằng giọng nói của bạn</span>
                </label>
                {pushPreferences.soundMode === 'VOICE' && (
                  <div className="space-y-3 rounded-lg bg-gray-50 p-3 dark:bg-[#1E1F20]">
                    <p className="text-gray-500">
                      Ghi âm tối đa 30 giây. Bản ghi được lưu riêng trên trình
                      duyệt này và chưa được phát cùng thông báo đẩy.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={
                          isRecordingVoice
                            ? stopVoiceRecording
                            : () => void startVoiceRecording()
                        }
                        disabled={isStartingVoiceRecording}
                        className={`rounded-lg px-3 py-2 font-bold text-white ${
                          isRecordingVoice
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-fb-blue hover:bg-fb-blue-hover'
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {isStartingVoiceRecording
                          ? 'Đang xin quyền micro…'
                          : isRecordingVoice
                            ? 'Dừng ghi âm'
                            : 'Ghi âm giọng nói'}
                      </button>
                      {voicePreviewUrl && (
                        <button
                          type="button"
                          onClick={() => void removeVoiceRecording()}
                          className="rounded-lg border border-gray-300 px-3 py-2 font-semibold hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-[#3A3B3C]"
                        >
                          Xóa bản ghi
                        </button>
                      )}
                    </div>
                    {isLoadingVoice ? (
                      <p role="status" className="text-gray-500">
                        Đang tải bản ghi đã lưu…
                      </p>
                    ) : voicePreviewUrl ? (
                      <audio
                        controls
                        src={voicePreviewUrl}
                        className="w-full"
                        aria-label="Nghe thử bản ghi giọng nói"
                      />
                    ) : (
                      <p className="text-gray-500">
                        Bạn chưa có bản ghi. Cho phép sử dụng micro khi trình
                        duyệt yêu cầu.
                      </p>
                    )}
                  </div>
                )}
              </fieldset>
            </fieldset>
          </div>
        )}

        {activeTab === 'DEVICES' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-base text-fb-text pb-2 border-b border-fb-divider">
              Quản lý thiết bị đã đăng nhập (NOTI.06)
            </h3>
            <div className="p-3 bg-fb-input rounded-lg flex items-center justify-between border">
              <div>
                <p className="font-bold text-fb-text">
                  Chrome trên macOS · Thiết bị hiện tại
                </p>
                <span className="text-emerald-600 font-semibold">
                  Đang hoạt động
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'DELETE' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-lg space-y-2">
              <h4 className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Cảnh báo xóa tài khoản
              </h4>
              <p className="text-red-800 dark:text-red-200">
                Khi xóa tài khoản, mọi câu hỏi đã được phê duyệt sẽ được chuyển
                giao sang tài sản chung của Viện đào tạo. Tài khoản sẽ có 30
                ngày để hủy yêu cầu xóa.
              </p>
              <button
                onClick={() =>
                  showToast(
                    'Đã ghi nhận yêu cầu xóa tài khoản sau 30 ngày.',
                    'warning',
                  )
                }
                className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
              >
                Xác nhận yêu cầu xóa tài khoản
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
