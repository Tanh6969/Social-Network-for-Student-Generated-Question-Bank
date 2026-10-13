import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import {
  User,
  Shield,
  Lock,
  Bell,
  Smartphone,
  Moon,
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    isDarkMode,
    toggleDarkMode,
    showToast,
    openAuthModal
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ACCOUNT' | 'SECURITY' | 'PUSH' | 'DEVICES' | 'DELETE'>('ACCOUNT');
  const [notifyMsg, setNotifyMsg] = useState(true);
  const [notifyReview, setNotifyReview] = useState(true);
  const [notifyMinigame, setNotifyMinigame] = useState(true);

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 flex flex-col md:flex-row gap-6 lg:gap-8 xl:gap-10 items-start">
      {/* CỘT TRÁI: Menu Cài đặt (sticky sát lề trái) */}
      <aside className="w-full md:w-80 shrink-0 space-y-2 select-none md:sticky md:top-18">
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 px-2 mb-3">
          Cài đặt & Quyền riêng tư
        </h2>

        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-2 space-y-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <button
            onClick={() => setActiveTab('ACCOUNT')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left ${
              activeTab === 'ACCOUNT'
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold'
                : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông tin tài khoản</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left ${
              activeTab === 'SECURITY'
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold'
                : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
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
                : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
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
                : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Quản lý thiết bị đăng nhập</span>
          </button>

          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition text-left"
          >
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4" />
              <span>Chế độ tối (Dark mode)</span>
            </div>
            <span className="text-gray-400 font-normal">{isDarkMode ? 'Bật' : 'Tắt'}</span>
          </button>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('DELETE')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left text-red-600 ${
                activeTab === 'DELETE' ? 'bg-red-50 dark:bg-red-950/40 font-bold' : 'hover:bg-red-50'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa tài khoản (USER.05)</span>
            </button>
          </div>
        </div>
      </aside>

      {/* CỘT PHẢI: Nội dung chi tiết */}
      <main className="flex-1 bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === 'ACCOUNT' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-100 dark:border-gray-700">
              Thông tin tài khoản trường
            </h3>

            <div>
              <label className="block text-gray-500 mb-1">Họ và tên</label>
              <input
                type="text"
                disabled
                value={currentUser.name}
                className="w-full p-2.5 bg-gray-100 dark:bg-[#3A3B3C] rounded-lg border text-gray-700 dark:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-gray-500 mb-1">Email trường (@truong.edu.vn)</label>
              <input
                type="text"
                disabled
                value={currentUser.email}
                className="w-full p-2.5 bg-gray-100 dark:bg-[#3A3B3C] rounded-lg border text-gray-700 dark:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-gray-500 mb-1">Khoa / Viện đào tạo</label>
              <input
                type="text"
                disabled
                value={currentUser.faculty}
                className="w-full p-2.5 bg-gray-100 dark:bg-[#3A3B3C] rounded-lg border text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>
        )}

        {activeTab === 'PUSH' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-100 dark:border-gray-700">
              Cài đặt thông báo đẩy (Push Notifications)
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl cursor-pointer">
                <div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 block">Tin nhắn mới</span>
                  <span className="text-[11px] text-gray-400">Nhận thông báo khi có bạn bè hoặc GV gửi tin nhắn</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyMsg}
                  onChange={(e) => {
                    setNotifyMsg(e.target.checked);
                    showToast('Đã lưu cấu hình thông báo', 'info');
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl cursor-pointer">
                <div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 block">Kết quả duyệt câu hỏi</span>
                  <span className="text-[11px] text-gray-400">Thông báo ngay khi Giảng viên phê duyệt hoặc từ chối phiên</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyReview}
                  onChange={(e) => {
                    setNotifyReview(e.target.checked);
                    showToast('Đã lưu cấu hình thông báo', 'info');
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl cursor-pointer">
                <div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 block">Minigame & Bảng xếp hạng</span>
                  <span className="text-[11px] text-gray-400">Nhắc nhở đóng cổng dự đoán vào Chủ nhật</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyMinigame}
                  onChange={(e) => {
                    setNotifyMinigame(e.target.checked);
                    showToast('Đã lưu cấu hình thông báo', 'info');
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>
          </div>
        )}

        {activeTab === 'DEVICES' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-100 dark:border-gray-700">
              Quản lý thiết bị đã đăng nhập (NOTI.06)
            </h3>
            <div className="p-3 bg-gray-50 dark:bg-[#1E1F20] rounded-xl flex items-center justify-between border">
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">Chrome trên macOS · Thiết bị hiện tại</p>
                <span className="text-emerald-600 font-semibold">Đang hoạt động</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'DELETE' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-xl space-y-2">
              <h4 className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Cảnh báo xóa tài khoản
              </h4>
              <p className="text-red-800 dark:text-red-200">
                Khi xóa tài khoản, mọi câu hỏi đã được phê duyệt sẽ được chuyển giao sang tài sản chung của Viện đào tạo. Tài khoản sẽ có 30 ngày để hủy yêu cầu xóa.
              </p>
              <button
                onClick={() => showToast('Đã ghi nhận yêu cầu xóa tài khoản sau 30 ngày.', 'warning')}
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
