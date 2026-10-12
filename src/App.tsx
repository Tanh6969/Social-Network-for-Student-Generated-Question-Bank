import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { ChatDock } from './components/common/ChatDock';
import { ToastContainer } from './components/common/ToastContainer';

// Auth Page
import { AuthPage } from './components/auth/AuthPage';

// Views
import { FeedView } from './components/feed/FeedView';
import { BankView } from './components/bank/BankView';
import { VideoWatchView } from './components/watch/VideoWatchView';
import { MinigameView } from './components/games/MinigameView';
import { FriendsView } from './components/friends/FriendsView';
import { ReviewDashboardView } from './components/lecturer/ReviewDashboardView';
import { MessengerFullView } from './components/messenger/MessengerFullView';
import { ProfileView } from './components/profile/ProfileView';
import { CosmeticsView } from './components/cosmetics/CosmeticsView';
import { SettingsView } from './components/settings/SettingsView';
import { ExamsView } from './components/lecturer/ExamsView';
import { SearchResultsView } from './components/search/SearchResultsView';

// Modals
import { CreatePostModal } from './components/feed/CreatePostModal';
import { PostDetailModal } from './components/feed/PostDetailModal';
import { ProposeSessionModal } from './components/bank/ProposeSessionModal';
import { QuestionQuizModal } from './components/bank/QuestionQuizModal';
import { AIRefineModal } from './components/lecturer/AIRefineModal';
import { ExamGeneratorWizard } from './components/lecturer/ExamGeneratorWizard';
import { ExportQuestionsModal } from './components/lecturer/ExportQuestionsModal';
import { ReportModal } from './components/modals/ReportModal';
import { TourGuideModal } from './components/modals/TourGuideModal';

import { WifiOff } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    isAuthenticated,
    activeTab,
    isOfflineSimulated
  } = useApp();

  // If not logged in, show dedicated AuthPage (Đăng nhập / Đăng ký)
  if (!isAuthenticated) {
    return (
      <>
        <AuthPage />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#18191A] text-[#050505] dark:text-[#E4E6EB] transition-colors duration-200 flex flex-col pt-14">
      {/* Top Fixed Navbar */}
      <Navbar />

      {/* Offline Alert Bar (SYS.01) */}
      {isOfflineSimulated && (
        <div className="bg-gray-800 text-gray-200 text-xs font-medium py-2 px-4 text-center flex items-center justify-center gap-2 border-b border-gray-700">
          <WifiOff className="w-4 h-4 text-gray-400" />
          <span>Mất kết nối Internet - Đang hiển thị bản lưu ngoại tuyến (Offline cache mode)</span>
        </div>
      )}

      {/* Main Tab Router */}
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
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
