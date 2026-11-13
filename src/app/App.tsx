import React, { Suspense, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { canAccessTab, postLoginDestination, tabFromPath } from './routes';
import { useApp } from '../features/demo/context/AppContext';
import { Navbar } from '../shared/components/Navbar';
import { ChatDock } from '../shared/components/ChatDock';
import { ToastContainer } from '../shared/components/ToastContainer';

// Auth Page
import { AuthPage } from '../features/auth/components/AuthPage';
import { PageSkeleton, Skeleton } from '../shared/components/Skeleton';

// Split screens by route while preserving the existing demo components.
const FeedView = React.lazy(() =>
  import('../features/feed/components/FeedView').then((module) => ({
    default: module.FeedView,
  })),
);
const BankView = React.lazy(() =>
  import('../features/bank/components/BankView').then((module) => ({
    default: module.BankView,
  })),
);
const ProposeView = React.lazy(() =>
  import('../features/propose/components/ProposeView').then((module) => ({
    default: module.ProposeView,
  })),
);
const MinigameView = React.lazy(() =>
  import('../features/games/components/MinigameView').then((module) => ({
    default: module.MinigameView,
  })),
);
const FriendsView = React.lazy(() =>
  import('../features/friends/components/FriendsView').then((module) => ({
    default: module.FriendsView,
  })),
);
const ReviewDashboardView = React.lazy(() =>
  import('../features/lecturer/components/ReviewDashboardView').then(
    (module) => ({ default: module.ReviewDashboardView }),
  ),
);
const LecturerBankView = React.lazy(() =>
  import('../features/lecturer/components/LecturerBankView').then((module) => ({
    default: module.LecturerBankView,
  })),
);
const MessengerFullView = React.lazy(() =>
  import('../features/messenger/components/MessengerFullView').then(
    (module) => ({ default: module.MessengerFullView }),
  ),
);
const ProfileView = React.lazy(() =>
  import('../features/profile/components/ProfileView').then((module) => ({
    default: module.ProfileView,
  })),
);
const CosmeticsView = React.lazy(() =>
  import('../features/cosmetics/components/CosmeticsView').then((module) => ({
    default: module.CosmeticsView,
  })),
);
const SettingsView = React.lazy(() =>
  import('../features/settings/components/SettingsView').then((module) => ({
    default: module.SettingsView,
  })),
);
const ExamsView = React.lazy(() =>
  import('../features/lecturer/components/ExamsView').then((module) => ({
    default: module.ExamsView,
  })),
);
const SearchResultsView = React.lazy(() =>
  import('../features/search/components/SearchResultsView').then((module) => ({
    default: module.SearchResultsView,
  })),
);

// Modals
import { CreatePostModal } from '../features/feed/components/CreatePostModal';
import { PostDetailModal } from '../features/feed/components/PostDetailModal';
import { ProposeSessionModal } from '../features/bank/components/ProposeSessionModal';
import { QuestionQuizModal } from '../features/bank/components/QuestionQuizModal';
import { ExamGeneratorWizard } from '../features/lecturer/components/ExamGeneratorWizard';
import { ExportQuestionsModal } from '../features/lecturer/components/ExportQuestionsModal';
import { ReportModal } from '../features/demo/components/modals/ReportModal';
import { TourGuideModal } from '../features/demo/components/modals/TourGuideModal';

import { WifiOff } from 'lucide-react';

const MainContent: React.FC = () => {
  const location = useLocation();
  const {
    isAuthenticated,
    isRestoringSession,
    activeTab,
    isOfflineSimulated,
    role,
  } = useApp();
  // Chỉ đăng xuất mới chuyển từ đã đăng nhập sang chưa đăng nhập. Khi đó không
  // giữ trang cũ trong `next`, để lần đăng nhập sau (có thể là tài khoản khác)
  // luôn mở trang chủ MXH.
  const [prevAuthenticated, setPrevAuthenticated] = useState(isAuthenticated);
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  if (prevAuthenticated !== isAuthenticated) {
    setPrevAuthenticated(isAuthenticated);
    setJustLoggedOut(!isAuthenticated);
  }

  // Tải lại trang: đang khôi phục phiên từ cookie → giữ nguyên đường dẫn,
  // hiện khung trang thay vì nháy qua màn đăng nhập.
  if (isRestoringSession && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-fb-canvas pt-14">
        <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-fb-divider bg-fb-card px-4">
          <Skeleton className="h-10 w-40 rounded-full" />
          <Skeleton className="hidden h-8 w-80 md:block" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <PageSkeleton />
      </div>
    );
  }

  // Authentication and the local demo entry points share the login screen.
  if (!isAuthenticated) {
    return (
      <>
        {justLoggedOut
          ? location.pathname !== '/login' && <Navigate to="/login" replace />
          : location.pathname !== '/login' && (
              <Navigate
                to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
                replace
              />
            )}
        <AuthPage />
        <ToastContainer />
      </>
    );
  }

  if (!tabFromPath(location.pathname))
    return <Navigate to={postLoginDestination(location.search)} replace />;

  if (!canAccessTab(role, activeTab)) return <Navigate to="/feed" replace />;

  return (
    <div className="min-h-screen bg-fb-canvas text-fb-text transition-colors duration-200 flex flex-col pt-14">
      {/* Top Fixed Navbar */}
      <Navbar />

      {/* Offline Alert Bar (SYS.01) */}
      {isOfflineSimulated && (
        <div className="bg-gray-800 text-gray-200 text-xs font-medium py-2 px-4 text-center flex items-center justify-center gap-2 border-b border-gray-700">
          <WifiOff className="w-4 h-4 text-fb-text-3" />
          <span>
            Mất kết nối Internet - Đang hiển thị bản lưu ngoại tuyến (Offline
            cache mode)
          </span>
        </div>
      )}

      <Suspense fallback={<PageSkeleton />}>
        <div className="flex-1">
          {activeTab === 'feed' && <FeedView />}
          {activeTab === 'bank' && <BankView />}
          {activeTab === 'propose' && <ProposeView />}
          {activeTab === 'game' && <MinigameView />}
          {activeTab === 'friends' && <FriendsView />}
          {activeTab === 'review' &&
            (role === 'LECTURER' ? <ReviewDashboardView /> : <FeedView />)}
          {activeTab === 'lecturer-bank' &&
            (role === 'LECTURER' ? <LecturerBankView /> : <FeedView />)}
          {activeTab === 'messenger' && <MessengerFullView />}
          {activeTab === 'profile' && <ProfileView />}
          {activeTab === 'cosmetics' && <CosmeticsView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'exams' && <ExamsView />}
          {activeTab === 'search' && <SearchResultsView />}
        </div>
      </Suspense>

      {/* Floating Messenger Chat Dock (MSG.05) */}
      <ChatDock />

      {/* Modals */}
      <CreatePostModal />
      <PostDetailModal />
      <ProposeSessionModal />
      <QuestionQuizModal />
      <ExamGeneratorWizard />
      <ExportQuestionsModal />
      <ReportModal />
      <TourGuideModal />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return <MainContent />;
}
