import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  RefreshCw,
  LogOut,
  KeyRound,
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
import {
  authApi,
  devicesApi,
  getDeviceId,
  isApiSession,
  type DeviceInfoDto,
} from '../../../api';

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

  // Security: Change password & Refresh Token
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);

  // Devices management
  const [devices, setDevices] = useState<DeviceInfoDto[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [fidInput, setFidInput] = useState('');
  const [isSyncingFid, setIsSyncingFid] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);
  const voicePreviewUrlRef = useRef<string | null>(null);

  const loadDevices = useCallback(async () => {
    if (!isApiSession()) return;
    setIsLoadingDevices(true);
    try {
      const list = await devicesApi.getMyDevices();
      setDevices(list);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Không thể tải danh sách thiết bị.',
        'error',
      );
    } finally {
      setIsLoadingDevices(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === 'DEVICES' && isApiSession()) {
      void loadDevices();
    }
  }, [activeTab, loadDevices]);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp.', 'error');
      return;
    }
    if (!isApiSession()) {
      showToast('Đã cập nhật mật khẩu (chế độ Demo).', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      return;
    }
    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      showToast('Đổi mật khẩu thành công!', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Không thể đổi mật khẩu.',
        'error',
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRefreshToken = async () => {
    if (!isApiSession()) {
      showToast('Phiên Demo không sử dụng JWT Refresh Token.', 'info');
      return;
    }
    setIsRefreshingToken(true);
    try {
      const ok = await authApi.refresh();
      if (ok) {
        showToast('Đã làm mới phiên đăng nhập (Access Token) thành công!', 'success');
      } else {
        showToast('Không thể làm mới token. Vui lòng đăng nhập lại.', 'error');
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Lỗi khi làm mới token.',
        'error',
      );
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const handleSyncFid = async () => {
    const trimmed = fidInput.trim();
    if (!trimmed) {
      showToast('Vui lòng nhập Firebase Installation ID (FID).', 'warning');
      return;
    }
    if (!isApiSession()) {
      showToast('Đã đồng bộ FID (chế độ Demo).', 'success');
      return;
    }
    setIsSyncingFid(true);
    try {
      await devicesApi.syncFid({ fid: trimmed });
      showToast('Đã đồng bộ FID cho thiết bị hiện tại.', 'success');
      setFidInput('');
      await loadDevices();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Không thể đồng bộ FID.',
        'error',
      );
    } finally {
      setIsSyncingFid(false);
    }
  };

  const handleUnregisterFid = async () => {
    if (!isApiSession()) {
      showToast('Đã hủy đăng ký FID (chế độ Demo).', 'info');
      return;
    }
    setIsSyncingFid(true);
    try {
      await devicesApi.unregisterFid();
      showToast('Đã hủy đăng ký nhận thông báo đẩy (FID) trên thiết bị này.', 'info');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Không thể hủy đăng ký FID.',
        'error',
      );
    } finally {
      setIsSyncingFid(false);
    }
  };

  const handleLogoutDevice = async (deviceId: string) => {
    if (!isApiSession()) return;
    try {
      await devicesApi.logoutDevice(deviceId);
      showToast('Đã đăng xuất thiết bị.', 'info');
      await loadDevices();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Không thể đăng xuất thiết bị.',
        'error',
      );
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!isApiSession()) return;
    try {
      await devicesApi.deleteDevice(deviceId);
      setDevices((prev) => prev.filter((d) => d.device_id !== deviceId));
      showToast('Đã xóa thiết bị khỏi danh sách.', 'info');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Không thể xóa thiết bị.',
        'error',
      );
    }
  };

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
        <h2 className="text-xl font-bold text-fb-text px-2 mb-3">
          Cài đặt & Quyền riêng tư
        </h2>

        <div className="bg-fb-card rounded-lg shadow-fb-card p-2 space-y-1 text-xs font-semibold text-fb-text">
          <button
            onClick={() => setActiveTab('ACCOUNT')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left ${
              activeTab === 'ACCOUNT'
                ? 'bg-fb-blue-soft text-fb-blue font-bold'
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
                ? 'bg-fb-danger-soft text-fb-danger font-bold'
                : 'hover:bg-fb-hover'
            }`}
          >
            <div className="flex items-center gap-3">
              <Ban className="w-4 h-4 text-fb-danger" />
              <span>Quản lý chặn người dùng</span>
            </div>
            <span className="text-xs bg-fb-input px-2 py-0.5 rounded-full font-bold">
              {blockedUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left ${
              activeTab === 'SECURITY'
                ? 'bg-fb-blue-soft text-fb-blue font-bold'
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
                ? 'bg-fb-blue-soft text-fb-blue font-bold'
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
                ? 'bg-fb-blue-soft text-fb-blue font-bold'
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
            <span className="text-fb-text-3 font-normal">
              {isDarkMode ? 'Bật' : 'Tắt'}
            </span>
          </button>

          <div className="pt-2 border-t border-fb-divider">
            <button
              onClick={() => setActiveTab('DELETE')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left text-fb-danger ${
                activeTab === 'DELETE'
                  ? 'bg-fb-danger-soft font-bold'
                  : 'hover:bg-fb-danger-soft'
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
              <label className="block text-fb-text-2 mb-1">Họ và tên</label>
              <input
                type="text"
                disabled
                value={currentUser.name}
                className="w-full p-2.5 bg-fb-input rounded-lg border text-fb-text"
              />
            </div>

            <div>
              <label className="block text-fb-text-2 mb-1">
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
              <label className="block text-fb-text-2 mb-1">
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
              <p className="text-fb-text-2 mt-2 leading-relaxed">
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
                  className="px-4 py-2.5 bg-fb-danger hover:bg-fb-danger/90 disabled:bg-fb-divider text-white rounded-lg font-bold shrink-0"
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
                <div className="py-8 text-center text-fb-text-3 border border-dashed border-fb-divider rounded-lg">
                  <Shield className="w-8 h-8 mx-auto mb-1 opacity-60" />
                  <p>Chưa có người dùng nào trong danh sách chặn.</p>
                </div>
              ) : (
                <div className="divide-y divide-fb-divider border border-fb-divider rounded-lg px-4">
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
                            <p className="text-xs text-fb-text-2 flex items-center gap-1">
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
          <div className="space-y-6 text-xs">
            <div>
              <h3 className="font-bold text-base text-fb-text pb-2 border-b border-fb-divider">
                Mật khẩu & Bảo mật
              </h3>
              <p className="text-fb-text-2 mt-2">
                Tài khoản của bạn đang được bảo vệ bởi xác thực trường học. Bạn
                có thể đổi mật khẩu hoặc làm mới phiên đăng nhập tại đây.
              </p>
            </div>

            <form
              onSubmit={(e) => void handleChangePassword(e)}
              className="space-y-3 max-w-md p-4 rounded-lg bg-fb-inset border border-fb-divider"
            >
              <h4 className="font-bold text-sm text-fb-text flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-fb-blue" />
                <span>Đổi mật khẩu</span>
              </h4>

              <div>
                <label className="block text-fb-text-2 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  className="w-full p-2.5 bg-fb-card rounded-lg border border-fb-divider text-fb-text"
                />
              </div>

              <div>
                <label className="block text-fb-text-2 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full p-2.5 bg-fb-card rounded-lg border border-fb-divider text-fb-text"
                />
              </div>

              <div>
                <label className="block text-fb-text-2 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full p-2.5 bg-fb-card rounded-lg border border-fb-divider text-fb-text"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-4 py-2 bg-fb-blue hover:bg-fb-blue-hover disabled:opacity-60 text-white rounded-lg font-bold"
              >
                {isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </form>

            <div className="p-4 rounded-lg bg-fb-inset border border-fb-divider flex items-center justify-between gap-4 max-w-md">
              <div>
                <p className="font-bold text-fb-text">
                  Làm mới phiên đăng nhập (Refresh Token)
                </p>
                <p className="text-fb-text-2 mt-0.5">
                  Cấp mới Access Token cho thiết bị hiện tại (`{getDeviceId()}`).
                </p>
              </div>
              <button
                type="button"
                disabled={isRefreshingToken}
                onClick={() => void handleRefreshToken()}
                className="px-3.5 py-2 bg-fb-btn hover:bg-fb-btn-hover text-fb-text rounded-lg font-bold shrink-0 flex items-center gap-1.5"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshingToken ? 'animate-spin' : ''}`}
                />
                <span>Làm mới</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'PUSH' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-base text-fb-text pb-2 border-b border-fb-divider">
              Cài đặt thông báo đẩy (Push Notifications)
            </h3>

            <p className="rounded-lg border border-fb-warning/30 bg-fb-warning-soft p-3 text-fb-warning">
              Các lựa chọn và bản ghi được lưu riêng trên trình duyệt này.
              Backend chưa kết nối nhận thông báo đẩy, nên thay đổi tại đây chưa
              bật/tắt thông báo thật trên thiết bị.
            </p>

            {settingsError && (
              <p
                role="alert"
                className="rounded-lg border border-fb-danger/30 bg-fb-danger-soft p-3 text-fb-danger"
              >
                {settingsError}
              </p>
            )}

            <label className="flex items-center justify-between gap-4 rounded-lg bg-fb-inset p-3">
              <span>
                <span className="block font-bold text-fb-text">
                  Bật thông báo đẩy
                </span>
                <span className="text-xs text-fb-text-2">
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
                className="h-4 w-4 rounded text-fb-blue"
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
                  className="flex items-center justify-between gap-4 rounded-lg bg-fb-inset p-3"
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
                    className="h-4 w-4 rounded text-fb-blue"
                  />
                </label>
              ))}

              <fieldset className="space-y-3 rounded-lg border border-fb-divider p-3">
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
                  className="rounded-lg border border-fb-divider px-3 py-1.5 font-semibold hover:bg-fb-hover disabled:cursor-not-allowed"
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
                  <div className="space-y-3 rounded-lg bg-fb-inset p-3">
                    <p className="text-fb-text-2">
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
                            ? 'bg-fb-danger hover:bg-fb-danger/90'
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
                          className="rounded-lg border border-fb-divider px-3 py-2 font-semibold hover:bg-fb-hover"
                        >
                          Xóa bản ghi
                        </button>
                      )}
                    </div>
                    {isLoadingVoice ? (
                      <p role="status" className="text-fb-text-2">
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
                      <p className="text-fb-text-2">
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
            <div className="flex items-center justify-between pb-2 border-b border-fb-divider">
              <h3 className="font-bold text-base text-fb-text">
                Quản lý thiết bị đã đăng nhập (NOTI.06)
              </h3>
              {isApiSession() && (
                <button
                  type="button"
                  onClick={() => void loadDevices()}
                  disabled={isLoadingDevices}
                  className="px-3 py-1.5 rounded-lg bg-fb-input hover:bg-fb-btn-hover font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isLoadingDevices ? 'animate-spin' : ''}`}
                  />
                  <span>Tải lại</span>
                </button>
              )}
            </div>

            <div className="p-4 rounded-lg bg-fb-inset border border-fb-divider space-y-2">
              <p className="font-bold text-fb-text">
                Đồng bộ Firebase Installation ID (FID) cho thông báo đẩy
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={fidInput}
                  onChange={(e) => setFidInput(e.target.value)}
                  placeholder="Nhập mã FID thiết bị..."
                  className="flex-1 p-2 bg-fb-card rounded-lg border border-fb-divider text-fb-text"
                />
                <button
                  type="button"
                  disabled={isSyncingFid}
                  onClick={() => void handleSyncFid()}
                  className="px-3.5 py-2 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg font-bold shrink-0"
                >
                  Đồng bộ FID
                </button>
                <button
                  type="button"
                  disabled={isSyncingFid}
                  onClick={() => void handleUnregisterFid()}
                  className="px-3.5 py-2 bg-fb-btn hover:bg-fb-btn-hover text-fb-text rounded-lg font-semibold shrink-0"
                >
                  Hủy FID
                </button>
              </div>
            </div>

            {devices.length > 0 ? (
              <div className="space-y-2">
                {devices.map((device) => {
                  const devId = device.device_id || '';
                  return (
                    <div
                      key={devId || device.user_device_id}
                      className="p-3 bg-fb-input rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-fb-divider"
                    >
                      <div>
                        <p className="font-bold text-fb-text flex items-center gap-2">
                          <span>{device.device_name || devId}</span>
                          {device.is_current_device && (
                            <span className="text-xs bg-fb-blue-soft text-fb-blue px-2 py-0.5 rounded-full font-bold">
                              Thiết bị hiện tại
                            </span>
                          )}
                        </p>
                        <p className="text-fb-text-2 mt-0.5">
                          Nền tảng: {device.platform || 'WEB'} · Hoạt động:{' '}
                          {device.last_active_at
                            ? new Date(device.last_active_at).toLocaleString('vi-VN')
                            : 'Vừa xong'}
                        </p>
                        <span
                          className={`font-semibold ${
                            device.is_active ? 'text-fb-success' : 'text-fb-text-3'
                          }`}
                        >
                          {device.is_active ? 'Đang hoạt động' : 'Đã đăng xuất'}
                        </span>
                      </div>

                      {!device.is_current_device && devId && (
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {device.is_active && (
                            <button
                              type="button"
                              onClick={() => void handleLogoutDevice(devId)}
                              className="px-3 py-1.5 rounded-lg bg-fb-btn hover:bg-fb-btn-hover text-fb-text font-semibold flex items-center gap-1"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Đăng xuất</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleDeleteDevice(devId)}
                            className="px-3 py-1.5 rounded-lg bg-fb-danger-soft hover:bg-fb-danger hover:text-white text-fb-danger font-semibold flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-fb-input rounded-lg flex items-center justify-between border border-fb-divider">
                <div>
                  <p className="font-bold text-fb-text">
                    Trình duyệt hiện tại ({getDeviceId()}) · Thiết bị hiện tại
                  </p>
                  <span className="text-fb-success font-semibold">
                    Đang hoạt động
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'DELETE' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-fb-danger-soft border border-fb-danger/30 rounded-lg space-y-2">
              <h4 className="font-bold text-fb-danger flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Cảnh báo xóa tài khoản
              </h4>
              <p className="text-fb-danger">
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
                className="mt-2 px-4 py-2 bg-fb-danger hover:bg-fb-danger/90 text-white rounded-lg font-bold"
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
