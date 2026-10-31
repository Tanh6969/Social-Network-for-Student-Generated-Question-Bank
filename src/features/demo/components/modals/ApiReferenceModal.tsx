import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Search, CheckCircle2, ExternalLink } from 'lucide-react';
import { MainTab } from '../../types';

export const ApiReferenceModal: React.FC = () => {
  const {
    isApiReferenceOpen,
    setIsApiReferenceOpen,
    setActiveTab,
    setIsProposeSessionModalOpen,
    setIsExamWizardOpen,
    setIsExportQuestionsOpen,
    openAuthModal,
    switchRole
  } = useApp();

  const [filterSearch, setFilterSearch] = useState('');

  if (!isApiReferenceOpen) return null;

  interface ApiItem {
    api: string;
    screen: string;
    tab?: MainTab | 'auth';
    action?: () => void;
  }

  const apiMapping: ApiItem[] = [
    { api: 'POST /auth/register', screen: 'AUTH.02 Đăng ký modal', tab: 'auth', action: () => openAuthModal('REGISTER') },
    { api: 'POST /auth/verify, /resend-verify', screen: 'AUTH.03 Xác thực OTP', tab: 'auth', action: () => openAuthModal('OTP') },
    { api: '(1) POST /auth/login', screen: 'AUTH.01 Đăng nhập Split 2 cột', tab: 'auth', action: () => openAuthModal('LOGIN') },
    { api: '(2) POST /auth/logout', screen: 'AUTH.07 Dialog đăng xuất', tab: 'auth', action: () => openAuthModal('LOGIN') },
    { api: '(3) POST /auth/change-password', screen: 'AUTH.06 / USER.07 Cài đặt mật khẩu', tab: 'settings' },
    { api: '(4) POST /auth/refresh', screen: 'AUTH.05 Modal phiên hết hạn', tab: 'auth', action: () => openAuthModal('LOGIN') },
    { api: '(5) GET /users/me', screen: 'USER.01 Hồ sơ cá nhân (Header 2 cột)', tab: 'profile' },
    { api: '(6) GET /users/{userId}', screen: 'USER.03 Hồ sơ người khác', tab: 'profile' },
    { api: '(7) PUT /users/me', screen: 'USER.02 Chỉnh sửa hồ sơ', tab: 'profile' },
    { api: '(8) DELETE /users/me', screen: 'USER.05 Yêu cầu xóa tài khoản', tab: 'settings' },
    { api: '(9)(10) /devices/register', screen: 'AUTH.08, NOTI.06 Quản lý thiết bị', tab: 'settings' },
    { api: '(11) POST /sessions/propose', screen: 'BANK.02 Đề xuất phiên câu hỏi', tab: 'bank', action: () => setIsProposeSessionModalOpen(true) },
    { api: '(12) GET /sessions/my-submissions', screen: 'BANK.03 Danh sách phiên của tôi', tab: 'bank' },
    { api: '(13) GET /sessions/my-submissions/{id}', screen: 'BANK.04 Chi tiết phiên', tab: 'bank' },
    { api: '(16) GET /users/{userId}/questions', screen: 'USER.04 Tab câu hỏi người dùng', tab: 'profile' },
    { api: '(17) POST /questions/{id}/answer', screen: 'BANK.07 Làm thử & chấm tự động', tab: 'bank' },
    { api: '(18) GET /questions/{id}/statistics', screen: 'BANK.08 Thống kê câu hỏi', tab: 'bank' },
    { api: '(19) POST /questions/{id}/rate', screen: 'BANK.09 Đánh giá 0–4 sao', tab: 'bank' },
    { api: '(20) GET /questions/{id}/ratings', screen: 'BANK.10 Danh sách đánh giá', tab: 'bank' },
    { api: '(21) GET /sessions/pending', screen: 'REVIEW.02 Hàng chờ kiểm duyệt GV', tab: 'review', action: () => switchRole('LECTURER') },
    { api: '(22) GET /sessions/{sessionId}', screen: 'REVIEW.03 Chi tiết 3-panel', tab: 'review', action: () => switchRole('LECTURER') },
    { api: '(23) POST /sessions/approve', screen: 'REVIEW.04 Phê duyệt câu hỏi', tab: 'review', action: () => switchRole('LECTURER') },
    { api: '(24) POST /sessions/reject', screen: 'REVIEW.05 Từ chối kèm lý do', tab: 'review', action: () => switchRole('LECTURER') },
    { api: '(26)(27) AI refine / apply', screen: 'AI.01–AI.03 AI tinh chỉnh câu hỏi', tab: 'review', action: () => switchRole('LECTURER') },
    { api: '(28)(29)(30) Minigame 1/2/4', screen: 'GAME.02–GAME.04 Minigame dự đoán', tab: 'game' },
    { api: '(31) GET /games/my-predictions', screen: 'GAME.06 Lịch sử dự đoán', tab: 'game' },
    { api: '(32) GET /games/leaderboard', screen: 'GAME.07 Bảng xếp hạng Podium', tab: 'game' },
    { api: '(33) GET /questions/export', screen: 'EXPORT.01 Xuất file Excel/Word/PDF', tab: 'bank', action: () => setIsExportQuestionsOpen(true) },
    { api: '(34) POST /exams/generate', screen: 'EXAM.01 Sinh đề thi Wizard 2 cột', tab: 'exams', action: () => setIsExamWizardOpen(true) },
    { api: '(38) POST /posts', screen: 'SOC.02 Tạo bài viết mới', tab: 'feed' },
    { api: '(39) GET /posts/{id}', screen: 'SOC.04 Chi tiết bài viết Theater', tab: 'feed' },
    { api: '(41) PUT /posts/{id}/lecturer-notes', screen: 'SOC.06 Ghi chú của giảng viên', tab: 'feed' },
    { api: '(44)(45) comments', screen: 'SOC.09–SOC.12 Bình luận lồng cấp', tab: 'feed' },
    { api: '(48) POST /react', screen: 'SOC.13 Thích bài viết', tab: 'feed' },
    { api: '(49)(50) activity-feeds', screen: 'SOC.01 Bảng tin 3 cột Facebook', tab: 'feed' },
    { api: '(51) GET /search', screen: 'SOC.15 Kết quả tìm kiếm 2 cột', tab: 'search' },
    { api: '(52)(53) search/saved', screen: 'SOC.14 Lịch sử tìm kiếm gần đây', tab: 'feed' },
    { api: '(56)–(62) friendships', screen: 'REL.01–REL.06 Bạn bè 2 cột', tab: 'friends' },
    { api: '(63)–(66) follows', screen: 'REL.07–REL.09 Theo dõi Giảng viên', tab: 'friends' },
    { api: '(71) POST /report', screen: 'REL.13 Báo cáo vi phạm', tab: 'feed' },
    { api: '(72)–(76) conversations', screen: 'MSG.01–MSG.06 Messenger & Chat Dock', tab: 'messenger' },
    { api: '(82)(83) notifications', screen: 'NOTI.01–NOTI.03 Chuông thông báo', tab: 'feed' },
    { api: 'Cosmetics (4 API)', screen: 'COS.01–COS.06 Kho vật phẩm & Khung', tab: 'cosmetics' },
  ];

  const filtered = apiMapping.filter(
    (item) =>
      item.api.toLowerCase().includes(filterSearch.toLowerCase()) ||
      item.screen.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/70 animate-in fade-in duration-200">
      <div className="bg-fb-card rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-fb-divider">
        {/* Header */}
        <div className="p-4 border-b border-fb-divider flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Bảng Đối Chiếu API ↔ Màn Hình (PHẦN 10)
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Kiểm tra tính đầy đủ của toàn bộ 85+ API endpoints và các màn hình giao diện tương ứng
            </p>
          </div>

          <button
            onClick={() => setIsApiReferenceOpen(false)}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-fb-divider bg-fb-input">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Lọc theo tên API hoặc mã màn hình..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-fb-card text-fb-text"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-fb-divider text-gray-500 font-bold">
                <th className="py-2 px-3">API Endpoint</th>
                <th className="py-2 px-3">Màn hình tương ứng</th>
                <th className="py-2 px-3 text-right">Thao tác thử</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((item, idx) => (
                <tr key={idx} className="hover:bg-fb-hover/50 transition">
                  <td className="py-2.5 px-3 font-mono font-semibold text-fb-blue">
                    {item.api}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-fb-text">
                    {item.screen}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => {
                        if (item.action) {
                          item.action();
                        } else if (item.tab !== 'auth') {
                          setActiveTab(item.tab as MainTab);
                        }
                        setIsApiReferenceOpen(false);
                      }}
                      className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-fb-blue hover:bg-blue-100 rounded-md font-bold text-[11px] inline-flex items-center gap-1"
                    >
                      <span>Xem màn</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
