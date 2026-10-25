import React, { Suspense } from 'react';
import { Navigate, useLocation } from 'react-router';
import { postLoginDestination, tabFromPath } from './routes';
import { useApp } from '../features/demo/context/AppContext';
import { Navbar } from '../shared/components/Navbar';
import { ChatDock } from '../shared/components/ChatDock';
import { ToastContainer } from '../shared/components/ToastContainer';

// Auth Page
import { AuthPage } from '../features/auth/components/AuthPage';

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
const VideoWatchView = React.lazy(() =>
  import('../features/watch/components/VideoWatchView').then((module) => ({
    default: module.VideoWatchView,
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
import { AIRefineModal } from '../features/lecturer/components/AIRefineModal';
import { ExamGeneratorWizard } from '../features/lecturer/components/ExamGeneratorWizard';
import { ExportQuestionsModal } from '../features/lecturer/components/ExportQuestionsModal';
import { ReportModal } from '../features/demo/components/modals/ReportModal';
import { TourGuideModal } from '../features/demo/components/modals/TourGuideModal';

import { WifiOff } from 'lucide-react';

const MainContent: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, activeTab, isOfflineSimulated } = useApp();

  // Authentication and the local demo entry points share the login screen.
  if (!isAuthenticated) {
    return (
      <>
        {location.pathname !== '/login' && (
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

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#18191A] text-[#050505] dark:text-[#E4E6EB] transition-colors duration-200 flex flex-col pt-14">
      {/* Top Fixed Navbar */}
      <Navbar />

      {/* Offline Alert Bar (SYS.01) */}
      {isOfflineSimulated && (
        <div className="bg-gray-800 text-gray-200 text-xs font-medium py-2 px-4 text-center flex items-center justify-center gap-2 border-b border-gray-700">
          <WifiOff className="w-4 h-4 text-gray-400" />
          <span>
            Mất kết nối Internet - Đang hiển thị bản lưu ngoại tuyến (Offline
            cache mode)
          </span>
        </div>
      )}

      <Suspense
        fallback={
          <div className="flex-1 p-8 text-center text-sm">
            Đang tải màn hình...
          </div>
        }
      >
        <div className="flex-1">
          {activeTab === 'feed' && <FeedView />}
          {activeTab === 'bank' && <BankView />}
          {activeTab === 'watch' && <VideoWatchView />}
          {activeTab === 'game' && <MinigameView />}
          {activeTab === 'friends' && <FriendsView />}
          {activeTab === 'review' && <ReviewDashboardView />}
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
      <AIRefineModal />
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
