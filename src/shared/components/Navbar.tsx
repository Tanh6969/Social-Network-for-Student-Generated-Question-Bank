import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../features/demo/context/AppContext';
import { AvatarWithFrame } from './AvatarWithFrame';
import {
  Search,
  Home,
  BookOpen,
  Tv,
  Gamepad2,
  Users,
  CheckSquare,
  Grid,
  MessageCircle,
  Bell,
  Moon,
  Sun,
  User as UserIcon,
  Settings,
  Sparkles,
  HelpCircle,
  LogOut,
  X,
  FileCode,
  FilePlus,
  Database
} from 'lucide-react';
import { MainTab } from '../../features/demo/types';
import { loadStoredMockSessions } from '../../features/lecturer/mockReviewData';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    role,
    activeTab,
    setActiveTab,
    setViewingUserId,
    isDarkMode,
    toggleDarkMode,
    searchQuery,
    setSearchQuery,
    savedSearches,
    removeSavedSearch,
    clearAllSavedSearches,
    triggerSearch,
    conversations,
    openChatDock,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadNotificationsCount,
    sessions,
    questions,
    setIsTourGuideOpen,
    switchRole,
    logout
  } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const messengerRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const gridMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (messengerRef.current && !messengerRef.current.contains(e.target as Node)) {
        setIsMessengerOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (gridMenuRef.current && !gridMenuRef.current.contains(e.target as Node)) {
        setIsGridMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mockPendingCount = loadStoredMockSessions().filter((s) => s.status === 'PENDING').length;
  const pendingSessionsCount = Math.max(sessions.filter((s) => s.status === 'PENDING').length, mockPendingCount);
  const needEditCount = questions.filter((q) => q.status === 'NEED_EDIT').length;
  const unreadMessagesCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const closeAllDropdowns = () => {
    setIsSearchOpen(false);
    setIsMessengerOpen(false);
    setIsNotificationsOpen(false);
    setIsUserMenuOpen(false);
    setIsGridMenuOpen(false);
  };

  const toggleSearch = (open: boolean) => {
    if (open) {
      setIsMessengerOpen(false);
      setIsNotificationsOpen(false);
      setIsUserMenuOpen(false);
      setIsGridMenuOpen(false);
    }
    setIsSearchOpen(open);
  };

  const toggleGridMenu = () => {
    const next = !isGridMenuOpen;
    if (next) {
      setIsMessengerOpen(false);
      setIsNotificationsOpen(false);
      setIsUserMenuOpen(false);
      setIsSearchOpen(false);
    }
    setIsGridMenuOpen(next);
  };

  const toggleMessenger = () => {
    const next = !isMessengerOpen;
    if (next) {
      setIsGridMenuOpen(false);
      setIsNotificationsOpen(false);
      setIsUserMenuOpen(false);
      setIsSearchOpen(false);
    }
    setIsMessengerOpen(next);
  };

  const toggleNotifications = () => {
    const next = !isNotificationsOpen;
    if (next) {
      setIsGridMenuOpen(false);
      setIsMessengerOpen(false);
      setIsUserMenuOpen(false);
      setIsSearchOpen(false);
    }
    setIsNotificationsOpen(next);
  };

  const toggleUserMenu = () => {
    const next = !isUserMenuOpen;
    if (next) {
      setIsGridMenuOpen(false);
      setIsMessengerOpen(false);
      setIsNotificationsOpen(false);
      setIsSearchOpen(false);
    }
    setIsUserMenuOpen(next);
  };

  const handleTabClick = (tab: MainTab) => {
    closeAllDropdowns();
    setViewingUserId(null);
    setActiveTab(tab);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      triggerSearch(searchQuery);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] h-14 bg-white dark:bg-[#242526] border-b border-[#E4E6EB] dark:border-[#3E4042] px-4 flex items-center justify-between shadow-xs select-none">
      {/* LEFT: Logo & Search */}
      <div className="flex items-center gap-2 min-w-[280px]">
        <div
          onClick={() => handleTabClick('feed')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
            <span className="font-black text-xl tracking-tighter">U</span>
          </div>
          <span className="hidden sm:inline font-bold text-lg text-gray-900 dark:text-gray-100 tracking-tight">
            Uni<span className="text-blue-600">Social</span>
          </span>
        </div>

        {/* Search bar with dropdown */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-[260px]">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm môn học, bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => toggleSearch(true)}
              className="w-full h-10 pl-9 pr-8 rounded-full bg-[#F0F2F5] dark:bg-[#3A3B3C] text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Search Dropdown (SOC.14) */}
          {isSearchOpen && (
            <div className="absolute top-12 left-0 w-80 bg-white dark:bg-[#242526] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-[110] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-2 mb-2">
                <span>TÌM KIẾM GẦN ĐÂY</span>
                {savedSearches.length > 0 && (
                  <button
                    onClick={clearAllSavedSearches}
                    className="text-blue-600 hover:underline"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {savedSearches.length > 0 ? (
                <div className="space-y-1 mb-3">
                  {savedSearches.map((term, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3A3B3C] cursor-pointer text-sm text-gray-800 dark:text-gray-200"
                      onClick={() => {
                        triggerSearch(term);
                        setIsSearchOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{term}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSavedSearch(term);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 px-2 py-1">Chưa có lịch sử tìm kiếm</p>
              )}

              <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                <span className="text-xs text-gray-500 font-semibold px-2 block mb-1.5">
                  XU HƯỚNG ÔN THI
                </span>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {['TCP/IP', 'Cây AVL', 'Chuẩn 3NF', 'Giải tích 1', 'Đề thi 2026'].map((trend) => (
                    <button
                      key={trend}
                      onClick={() => {
                        triggerSearch(trend);
                        setIsSearchOpen(false);
                      }}
                      className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition"
                    >
                      {trend}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER: Big Tab Icons with Facebook Underline */}
      <nav className="hidden md:flex items-center justify-center flex-1 max-w-[680px] h-full">
        {/* Trang chủ */}
        <button
          onClick={() => handleTabClick('feed')}
          className={`relative flex items-center justify-center flex-1 h-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-none transition-colors ${
            activeTab === 'feed'
              ? 'text-blue-600 dark:text-blue-400 border-b-[3px] border-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          title="Trang chủ"
        >
          <Home className={`w-6 h-6 ${activeTab === 'feed' ? 'stroke-[2.5]' : ''}`} />
        </button>

        {/* NẾU LÀ GIẢNG VIÊN: ĐƯA 2 TAB KIỂM DUYỆT CÂU HỎI & NGÂN HÀNG ĐỀ LÊN TRƯỚC */}
        {role === 'LECTURER' ? (
          <>
            {/* Kiểm duyệt câu hỏi */}
            <button
              onClick={() => handleTabClick('review')}
              className={`relative flex items-center justify-center flex-1 h-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-none transition-colors ${
                activeTab === 'review'
                  ? 'text-purple-600 dark:text-purple-400 border-b-[3px] border-purple-600 font-bold'
                  : 'text-purple-600/80 dark:text-purple-400/80'
              }`}
              title="Kiểm duyệt câu hỏi"
            >
              <CheckSquare className={`w-6 h-6 ${activeTab === 'review' ? 'stroke-[2.5]' : ''}`} />
              {pendingSessionsCount > 0 && (
                <span className="absolute top-2 right-3 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full animate-pulse-subtle">
                  {pendingSessionsCount}
                </span>
              )}
            </button>

            {/* Ngân hàng đề của Giảng viên */}
            <button
              onClick={() => handleTabClick('lecturer-bank')}
              className={`relative flex items-center justify-center flex-1 h-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-none transition-colors ${
                activeTab === 'lecturer-bank'
                  ? 'text-purple-600 dark:text-purple-400 border-b-[3px] border-purple-600 font-bold'
                  : 'text-purple-600/80 dark:text-purple-400/80'
              }`}
              title="Ngân hàng đề"
            >
              <Database className={`w-6 h-6 ${activeTab === 'lecturer-bank' ? 'stroke-[2.5]' : ''}`} />
              {needEditCount > 0 && (
                <span className="absolute top-2 right-3 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                  {needEditCount}
                </span>
              )}
            </button>

            {/* Đề xuất câu hỏi */}
            <button
              onClick={() => handleTabClick('propose')}
              className={`relative flex items-center justify-center flex-1 h-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-none transition-colors ${
                activeTab === 'propose'
                  ? 'text-blue-600 dark:text-blue-400 border-b-[3px] border-blue-600'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              title="Đề xuất phiên câu hỏi thi (Sessions)"
            >
              <FilePlus className={`w-6 h-6 ${activeTab === 'propose' ? 'stroke-[2.5]' : ''}`} />
            </button>

            {/* Ngân hàng đề chung & Làm thử */}
            <button
              onClick={() => handleTabClick('bank')}
              className={`relative flex items-center justify-center flex-1 h-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-none transition-colors ${
                activeTab === 'bank'
                  ? 'text-blue-600 dark:text-blue-400 border-b-[3px] border-blue-600'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              title="Ngân hàng đề chung & Làm thử"
            >
              <BookOpen className={`w-6 h-6 ${activeTab === 'bank' ? 'stroke-[2.5]' : ''}`} />
              <span className="absolute top-1 right-3 text-[10px] font-bold bg-blue-600 text-white px-1 rounded-full">
                Đề
              </span>
            </button>
          </>
        ) : (
          <>
            {/* Đề xuất câu hỏi */}
            <button
              onClick={() => handleTabClick('propose')}
              className={`relative flex items-center justify-center flex-1 h-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-none transition-colors ${
                activeTab === 'propose'
                  ? 'text-blue-600 dark:text-blue-400 border-b-[3px] border-blue-600'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              title="Đề xuất phiên câu hỏi thi (Sessions)"
            >
              <FilePlus className={`w-6 h-6 ${activeTab === 'propose' ? 'stroke-[2.5]' : ''}`} />
            </button>

            {/* Ngân hàng đề */}
            <button
              onClick={() => handleTabClick('bank')}
              className={`relative flex items-center justify-center flex-1 h-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-none transition-colors ${
                activeTab === 'bank'
                  ? 'text-blue-600 dark:text-blue-400 border-b-[3px] border-blue-600'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              title="Ngân hàng đề & Làm thử"
            >
              <BookOpen className={`w-6 h-6 ${activeTab === 'bank' ? 'stroke-[2.5]' : ''}`} />
              <span className="absolute top-1 right-3 text-[10px] font-bold bg-blue-600 text-white px-1 rounded-full">
                Đề
              </span>
            </button>
          </>
        )}

        {/* Video học tập */}
        <button
          onClick={() => handleTabClick('watch')}
          className={`relative flex items-center justify-center flex-1 h-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-none transition-colors ${
            activeTab === 'watch'
              ? 'text-blue-600 dark:text-blue-400 border-b-[3px] border-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          title="Video học tập (Watch)"
        >
          <Tv className={`w-6 h-6 ${activeTab === 'watch' ? 'stroke-[2.5]' : ''}`} />
        </button>

        {/* Minigame */}
        <button
          onClick={() => handleTabClick('game')}
          className={`relative flex items-center justify-center flex-1 h-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-none transition-colors ${
            activeTab === 'game'
              ? 'text-blue-600 dark:text-blue-400 border-b-[3px] border-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          title="Minigame dự đoán & Bảng xếp hạng"
        >
          <Gamepad2 className={`w-6 h-6 ${activeTab === 'game' ? 'stroke-[2.5]' : ''}`} />
        </button>

        {/* Bạn bè */}
        <button
          onClick={() => handleTabClick('friends')}
          className={`relative flex items-center justify-center flex-1 h-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-none transition-colors ${
            activeTab === 'friends'
              ? 'text-blue-600 dark:text-blue-400 border-b-[3px] border-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          title="Bạn bè & Giảng viên"
        >
          <Users className={`w-6 h-6 ${activeTab === 'friends' ? 'stroke-[2.5]' : ''}`} />
        </button>
      </nav>

      {/* RIGHT: Action Round Buttons */}
      <div className="flex items-center gap-2">
        {/* Quick Dark/Light Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-10 h-10 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] flex items-center justify-center text-gray-800 dark:text-gray-200 transition cursor-pointer"
          title={isDarkMode ? 'Chuyển sang Chế độ sáng' : 'Chuyển sang Chế độ tối'}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700" />
          )}
        </button>

        {/* 9-dot Menu */}
        <div ref={gridMenuRef} className="relative">
          <button
            onClick={toggleGridMenu}
            className="w-10 h-10 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] flex items-center justify-center text-gray-800 dark:text-gray-200 transition cursor-pointer"
            title="Menu Chức năng"
          >
            <Grid className="w-5 h-5" />
          </button>

          {isGridMenuOpen && (
            <div className="fixed top-14 right-1 sm:right-2 w-[calc(100vw-0.5rem)] sm:w-80 max-w-xs sm:max-w-sm bg-white dark:bg-[#242526] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 z-[120] animate-in fade-in slide-in-from-top-2 duration-150">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 px-2 mb-2 text-sm">
                Tính năng hệ thống
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    handleTabClick('bank');
                    setIsGridMenuOpen(false);
                  }}
                  className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition"
                >
                  <BookOpen className="w-5 h-5 text-blue-600 mb-1" />
                  <span className="font-semibold block text-gray-800 dark:text-gray-200">Ngân hàng đề</span>
                  <span className="text-[10px] text-gray-500">Đóng góp & ôn tập</span>
                </button>

                <button
                  onClick={() => {
                    handleTabClick('propose');
                    setIsGridMenuOpen(false);
                  }}
                  className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition"
                >
                  <FilePlus className="w-5 h-5 text-emerald-600 mb-1" />
                  <span className="font-semibold block text-gray-800 dark:text-gray-200">Đề xuất câu hỏi</span>
                  <span className="text-[10px] text-gray-500">Biên soạn & duyệt</span>
                </button>

                <button
                  onClick={() => {
                    handleTabClick('exams');
                    setIsGridMenuOpen(false);
                  }}
                  className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition"
                >
                  <FileCode className="w-5 h-5 text-purple-600 mb-1" />
                  <span className="font-semibold block text-gray-800 dark:text-gray-200">Sinh đề thi</span>
                  <span className="text-[10px] text-gray-500">Ma trận ma mã đề</span>
                </button>

                <button
                  onClick={() => {
                    handleTabClick('cosmetics');
                    setIsGridMenuOpen(false);
                  }}
                  className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] hover:bg-amber-50 dark:hover:bg-amber-950/40 text-left transition"
                >
                  <Sparkles className="w-5 h-5 text-amber-500 mb-1" />
                  <span className="font-semibold block text-gray-800 dark:text-gray-200">Kho vật phẩm</span>
                  <span className="text-[10px] text-gray-500">Khung & hiệu ứng</span>
                </button>

                <button
                  onClick={() => {
                    handleTabClick('game');
                    setIsGridMenuOpen(false);
                  }}
                  className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#3A3B3C] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition"
                >
                  <Gamepad2 className="w-5 h-5 text-emerald-600 mb-1" />
                  <span className="font-semibold block text-gray-800 dark:text-gray-200">Minigame tuần</span>
                  <span className="text-[10px] text-gray-500">Dự đoán & Bảng vàng</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Messenger Icon & Dropdown (MSG.01) */}
        <div ref={messengerRef} className="relative">
          <button
            onClick={toggleMessenger}
            className="relative w-10 h-10 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] flex items-center justify-center text-gray-800 dark:text-gray-200 transition cursor-pointer"
            title="Messenger"
          >
            <MessageCircle className="w-5 h-5" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold bg-red-500 text-white rounded-full">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          {isMessengerOpen && (
            <div className="fixed top-14 right-1 sm:right-2 w-[calc(100vw-0.5rem)] sm:w-96 max-w-sm sm:max-w-md bg-white dark:bg-[#242526] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 z-[120] animate-in fade-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-4.5rem)] flex flex-col">
              <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Đoạn chat</h3>
                <button
                  onClick={() => {
                    handleTabClick('messenger');
                    setIsMessengerOpen(false);
                  }}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Xem tất cả trong Messenger
                </button>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800 overflow-y-auto max-h-[60vh] flex-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      openChatDock(conv.partner.id);
                      setIsMessengerOpen(false);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#3A3B3C] cursor-pointer transition"
                  >
                    <AvatarWithFrame user={conv.partner} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                          {conv.partner.name}
                        </p>
                        <span className="text-[10px] text-gray-400">{conv.lastMessageTime}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Icon & Dropdown (NOTI.01) */}
        <div ref={notifRef} className="relative">
          <button
            onClick={toggleNotifications}
            className="relative w-10 h-10 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] flex items-center justify-center text-gray-800 dark:text-gray-200 transition cursor-pointer"
            title="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold bg-red-500 text-white rounded-full">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="fixed top-14 right-1 sm:right-2 w-[calc(100vw-0.5rem)] sm:w-96 max-w-sm sm:max-w-md bg-white dark:bg-[#242526] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 z-[120] animate-in fade-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-4.5rem)] flex flex-col">
              <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Thông báo</h3>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Đọc tất cả
                  </button>
                )}
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800 overflow-y-auto max-h-[60vh] flex-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markNotificationAsRead(notif.id);
                      if (notif.type === 'QUESTION_APPROVED') {
                        handleTabClick('bank');
                      } else if (notif.type === 'FRIEND_REQUEST') {
                        handleTabClick('friends');
                      } else if (notif.type === 'MINIGAME_WIN') {
                        handleTabClick('game');
                      } else if (notif.type === 'LECTURER_NOTE') {
                        handleTabClick('feed');
                      }
                      setIsNotificationsOpen(false);
                    }}
                    className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition ${
                      notif.isRead
                        ? 'hover:bg-gray-50 dark:hover:bg-[#3A3B3C]/50 opacity-80'
                        : 'bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/60 font-medium'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {notif.timestamp}
                      </span>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Menu (USER.06) */}
        <div ref={userMenuRef} className="relative">
          <AvatarWithFrame
            user={currentUser}
            size="md"
            onClick={toggleUserMenu}
          />

          {isUserMenuOpen && (
            <div className="fixed top-14 right-1 sm:right-2 w-[calc(100vw-0.5rem)] sm:w-80 max-w-xs sm:max-w-sm bg-white dark:bg-[#242526] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 z-[120] animate-in fade-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-4.5rem)] flex flex-col">
              {/* Profile Card */}
              <div
                onClick={() => {
                  setViewingUserId(currentUser.id);
                  setActiveTab('profile');
                  setIsUserMenuOpen(false);
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#3A3B3C] cursor-pointer transition border-b border-gray-100 dark:border-gray-700 pb-3 shrink-0"
              >
                <AvatarWithFrame user={currentUser} size="lg" />
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {currentUser.classOrTitle}
                  </p>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    Xem hồ sơ của bạn
                  </span>
                </div>
              </div>

              <div className="py-2 space-y-1 text-sm text-gray-700 dark:text-gray-200 overflow-y-auto max-h-[60vh] flex-1">
                <button
                  onClick={() => {
                    handleTabClick('cosmetics');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition text-left"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Kho vật phẩm & Khung avatar</span>
                </button>

                <button
                  onClick={() => {
                    handleTabClick('settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition text-left"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span>Cài đặt & Quyền riêng tư</span>
                </button>

                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition text-left"
                >
                  <div className="flex items-center gap-3">
                    {isDarkMode ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-gray-500" />
                    )}
                    <span>Chế độ tối (Dark mode)</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">
                    {isDarkMode ? 'Bật' : 'Tắt'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsTourGuideOpen(true);
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition text-left"
                >
                  <HelpCircle className="w-4 h-4 text-blue-500" />
                  <span>Hướng dẫn sử dụng (Tour)</span>
                </button>

                {role === 'LECTURER' && (
                  <button
                    onClick={() => {
                      handleTabClick('lecturer-bank');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-purple-600" />
                      <span>Ngân hàng đề của Giảng viên</span>
                    </div>
                    {needEditCount > 0 && (
                      <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                        {needEditCount} Cần edit
                      </span>
                    )}
                  </button>
                )}

                <div className="border-t border-gray-100 dark:border-gray-700 pt-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
