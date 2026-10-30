import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { useAuthSession } from '../../auth/useAuthSession';
import { useLocation, useNavigate } from 'react-router';
import { tabFromPath, tabPaths } from '../../../app/routes';
import {
  User,
  Role,
  MainTab,
  Post,
  Question,
  ProposeSession,
  Exam,
  Minigame,
  LeaderboardUser,
  CosmeticItem,
  Conversation,
  MessageItem,
  AppNotification,
  CommentItem,
  ApiCallLog,
} from '../types';
import type {
  FriendStatus,
  ImageCrop,
  ProfilePhotoHistoryItem,
  BlockedUserEntry,
} from '../types';
import {
  appendComment,
  getPostContentIssue,
  removeOwnedPost,
  updateOwnedPost,
} from '../../feed/postUtils';
import { revokeMediaUrl } from '../../feed/mediaUtils';
import {
  mockCurrentUserStudent,
  mockCurrentUserLecturer,
  mockOtherUsers,
  mockPosts,
  mockQuestions,
  mockProposeSessions,
  mockMinigames,
  mockLeaderboard,
  mockCosmetics,
  mockConversations,
  mockNotifications,
  mockExams,
} from '../../../mocks/mockData';
import {
  getFriendStatusesForAccount,
  getNotificationsForAccount,
  initialFriendStatusesByAccount,
  mockPeerFriendsMap,
  type FriendStatusesByAccount,
} from '../../friends/friendAccountData';
import {
  getConversationPartnerId,
  getConversationsForAccount,
} from '../../messenger/conversationAccess';
import {
  areConversationSnapshotsEqual,
  isSharedChatMessage,
} from '../../messenger/sharedChatSync';
import {
  arePostSnapshotsEqual,
  isSharedFeedMessage,
} from '../../feed/sharedFeedSync';

export interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  // Auth state
  isAuthenticated: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // User & Role
  currentUser: User;
  role: Role;
  switchRole: (newRole: Role) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  profilePhotoHistory: ProfilePhotoHistoryItem[];
  saveProfilePhoto: (
    kind: 'avatar' | 'cover',
    url: string,
    crop: ImageCrop,
  ) => void;
  viewingUserId: string | null;
  setViewingUserId: (id: string | null) => void;
  getUserById: (id: string) => User;

  // Navigation
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  selectedSubject: string;
  setSelectedSubject: (subject: string) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  savedSearches: string[];
  removeSavedSearch: (term: string) => void;
  clearAllSavedSearches: () => void;
  triggerSearch: (query: string) => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Posts & Social
  posts: Post[];
  createPost: (postData: Partial<Post>) => void;
  updatePost: (
    postId: string,
    updates: Pick<
      Post,
      'content' | 'privacy' | 'mediaUrls' | 'documents' | 'type'
    >,
  ) => void;
  toggleLikePost: (postId: string) => void;
  addComment: (postId: string, text: string, parentCommentId?: string) => void;
  deletePost: (postId: string) => void;
  addLecturerNote: (postId: string, note: string) => void;
  friendStatuses: Record<string, FriendStatus>;
  setFriendStatuses: React.Dispatch<
    React.SetStateAction<Record<string, FriendStatus>>
  >;
  allUsers: User[];
  friendsList: User[];
  getFriendsOfUser: (userId: string) => User[];
  getMutualFriendsCount: (userId: string) => number;
  sendFriendRequest: (userId: string) => void;
  cancelFriendRequest: (userId: string) => void;
  acceptFriendRequest: (userId: string) => void;
  declineFriendRequest: (userId: string) => void;
  unfriendUser: (userId: string) => void;
  followingIds: string[];
  toggleFollowUser: (userId: string) => void;
  dismissedSuggestionIds: string[];
  dismissSuggestion: (userId: string) => void;

  // Blocking System (Slide 24)
  blockedUsers: BlockedUserEntry[];
  blockedByOtherIds: string[];
  blockUser: (userId: string, reason?: string) => void;
  unblockUser: (userId: string) => void;
  toggleSimulatedBlockedByOther: (userId: string) => void;
  isBlockedByMe: (userId: string) => boolean;
  isBlockingMe: (userId: string) => boolean;
  isBlockedEitherWay: (userId: string) => boolean;
  filterVisibleComments: (comments?: CommentItem[]) => CommentItem[];

  // Questions & Bank
  questions: Question[];
  answerQuestion: (
    questionId: string,
    chosenOption: 'A' | 'B' | 'C' | 'D',
  ) => boolean;
  rateQuestion: (questionId: string, stars: number, comment?: string) => void;
  updateQuestion: (questionId: string, updates: Partial<Question>) => void;
  applyAIQuestionRefine: (
    questionId: string,
    newContent: string,
    newExplanation?: string,
  ) => void;

  // Propose Sessions (SV đề xuất -> GV duyệt) - Mapping chuẩn 6 API Swagger
  sessions: ProposeSession[];
  createProposeSession: (
    title: string,
    subject: string,
    chapter: string,
    newQuestions: Omit<
      Question,
      | 'id'
      | 'status'
      | 'creatorId'
      | 'creatorName'
      | 'creatorAvatar'
      | 'ratingAverage'
      | 'ratingCount'
      | 'totalAttempts'
      | 'correctAttempts'
    >[],
  ) => void;
  approveSession: (
    sessionId: string,
    selectedQuestionIds: string[],
    note?: string,
    autoPost?: boolean,
  ) => void;
  rejectSession: (
    sessionId: string,
    selectedQuestionIds: string[],
    reason: string,
  ) => void;

  // Specific Question Review APIs (18. Giảng viên Duyệt Câu hỏi)
  editQuestionByLecturer: (
    questionId: string,
    updates: Partial<Question>,
  ) => void; // PUT /questions/{questionId}
  approveQuestionsBulk: (
    sessionId: string,
    selectedQuestionIds: string[],
    targetBankName?: string,
    note?: string,
    autoPost?: boolean,
  ) => void; // POST /sessions/approve
  rejectQuestionsBulk: (
    sessionId: string,
    selectedQuestionIds: string[],
    reason: string,
  ) => void; // POST /sessions/reject
  completeReviewSession: (sessionId: string, finalFeedback?: string) => void; // POST /sessions/{sessionId}/complete-review
  decideKeepQuestion: (questionId: string, notes?: string) => void;
  decideDiscardQuestion: (questionId: string, reason?: string) => void;

  // API Call Monitor Logs
  apiLogs: ApiCallLog[];
  addApiLog: (log: Omit<ApiCallLog, 'id' | 'timestamp'>) => void;
  clearApiLogs: () => void;

  // Exams
  exams: Exam[];
  generateExam: (newExam: Omit<Exam, 'id' | 'createdAt' | 'creator'>) => Exam;

  // Minigames & Leaderboard
  minigames: Minigame[];
  submitGuess: (gameId: string, guess: number) => void;
  leaderboard: LeaderboardUser[];

  // Cosmetics
  cosmetics: CosmeticItem[];
  equipCosmetic: (itemId: string) => void;
  unequipCosmetic: (itemId: string) => void;

  // Messenger & Chat Dock
  conversations: Conversation[];
  openChatDock: (partnerUserId: string) => void;
  markConversationRead: (conversationId: string) => void;
  closeChatDock: (conversationId: string) => void;
  minimizeChatDock: (conversationId: string) => void;
  restoreChatDock: (conversationId: string) => void;
  activeDockIds: string[];
  minimizedDockIds: string[];
  sendMessage: (conversationId: string, text: string) => void;
  recallMessage: (conversationId: string, messageId: string) => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadNotificationsCount: number;

  // Modals & Popups
  activeQuizQuestion: Question | null;
  setActiveQuizQuestion: (q: Question | null) => void;
  activePostDetail: Post | null;
  setActivePostDetail: (p: Post | null, focusComment?: boolean) => void;
  activePostCommentFocus: boolean;
  activePostMediaIndex: number;
  openPostMedia: (post: Post, index: number) => void;
  isCreatePostModalOpen: boolean;
  setIsCreatePostModalOpen: (open: boolean) => void;
  editingPostId: string | null;
  composerMediaKind: 'image' | 'video' | 'document' | null;
  openPostComposer: (
    postId?: string,
    initialMediaKind?: 'image' | 'video' | 'document',
  ) => void;
  closePostComposer: () => void;
  isProposeSessionModalOpen: boolean;
  setIsProposeSessionModalOpen: (open: boolean) => void;
  activeAIRefineQuestion: Question | null;
  setActiveAIRefineQuestion: (q: Question | null) => void;
  isExamWizardOpen: boolean;
  setIsExamWizardOpen: (open: boolean) => void;
  isExportQuestionsOpen: boolean;
  setIsExportQuestionsOpen: (open: boolean) => void;
  isReportModalOpen: boolean;
  reportTarget: { type: string; id: string; title: string } | null;
  openReportModal: (type: string, id: string, title: string) => void;
  closeReportModal: () => void;
  isApiReferenceOpen: boolean;
  setIsApiReferenceOpen: (open: boolean) => void;
  isTourGuideOpen: boolean;
  setIsTourGuideOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  authModalMode: 'LOGIN' | 'REGISTER' | 'OTP' | 'SESSION_EXPIRED';
  openAuthModal: (
    mode?: 'LOGIN' | 'REGISTER' | 'OTP' | 'SESSION_EXPIRED',
  ) => void;
  closeAuthModal: () => void;

  // System states
  isOfflineSimulated: boolean;
  setIsOfflineSimulated: (offline: boolean) => void;
  toasts: Toast[];
  showToast: (
    message: string,
    type?: 'success' | 'info' | 'warning' | 'error',
  ) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const activeTab = tabFromPath(location.pathname) ?? 'feed';
  const setActiveTab = (tab: MainTab) => navigate(tabPaths[tab]);
  const [selectedSubject, setSelectedSubject] =
    useState<string>('Tất cả môn học');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('unisocial_theme') === 'dark';
    } catch {
      return false;
    }
  });

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSearches, setSavedSearches] = useState<string[]>([
    'Thuật toán Dijkstra cây AVL',
    'Chuẩn 3NF Cơ sở dữ liệu',
    'TS. Trần Minh Đức',
    'Giải tích 1 chuỗi số',
    'Đề thi Mạng máy tính K64',
  ]);

  // Data states
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const postsRef = useRef<Post[]>(mockPosts);
  const feedChannelRef = useRef<BroadcastChannel | null>(null);
  const initializedFeedSyncRef = useRef(false);
  const [profilePhotoHistory, setProfilePhotoHistory] = useState<
    ProfilePhotoHistoryItem[]
  >([]);
  const [friendStatusesByAccount, setFriendStatusesByAccount] =
    useState<FriendStatusesByAccount>(initialFriendStatusesByAccount);
  const [followingIdsByAccount, setFollowingIdsByAccount] = useState<
    Record<string, string[]>
  >({
    [mockCurrentUserStudent.id]: ['user_gv_01', 'user_gv_02'],
  });
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<
    string[]
  >([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserEntry[]>([]);
  const [blockedByOtherIds, setBlockedByOtherIds] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [sessions, setSessions] =
    useState<ProposeSession[]>(mockProposeSessions);
  const [exams, setExams] = useState<Exam[]>(mockExams);
  const [minigames, setMinigames] = useState<Minigame[]>(mockMinigames);
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardUser[]>(mockLeaderboard);
  const [cosmetics, setCosmetics] = useState<CosmeticItem[]>(mockCosmetics);
  const [conversationRecords, setConversationRecords] =
    useState<Conversation[]>(mockConversations);
  const conversationRecordsRef = useRef<Conversation[]>(mockConversations);
  const chatChannelRef = useRef<BroadcastChannel | null>(null);
  const initializedChatSyncRef = useRef(false);
  const [notificationsByAccount, setNotificationsByAccount] = useState<
    Record<string, AppNotification[]>
  >({ [mockCurrentUserStudent.id]: mockNotifications });

  // Chat dock
  const [activeDockIdsByAccount, setActiveDockIdsByAccount] = useState<
    Record<string, string[]>
  >({ [mockCurrentUserStudent.id]: ['conv_01'] });
  const [minimizedDockIdsByAccount, setMinimizedDockIdsByAccount] = useState<
    Record<string, string[]>
  >({});

  // Modals
  const [activeQuizQuestion, setActiveQuizQuestion] = useState<Question | null>(
    null,
  );
  const [activePostDetailId, setActivePostDetailId] = useState<string | null>(
    null,
  );
  const [activePostMediaIndex, setActivePostMediaIndex] = useState(0);
  const [activePostCommentFocus, setActivePostCommentFocus] = useState(false);
  const setActivePostDetail = (post: Post | null, focusComment = false) => {
    setActivePostMediaIndex(0);
    setActivePostCommentFocus(Boolean(post && focusComment));
    setActivePostDetailId(post?.id ?? null);
    if (
      !post &&
      location.pathname === '/feed' &&
      new URLSearchParams(location.search).has('post')
    )
      navigate('/feed', { replace: true });
  };
  const openPostMedia = (post: Post, index: number) => {
    setActivePostMediaIndex(index);
    setActivePostCommentFocus(false);
    setActivePostDetailId(post.id);
  };
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [composerMediaKind, setComposerMediaKind] = useState<
    'image' | 'video' | 'document' | null
  >(null);
  const openPostComposer = (
    postId?: string,
    initialMediaKind?: 'image' | 'video' | 'document',
  ) => {
    setEditingPostId(postId ?? null);
    setComposerMediaKind(postId ? null : (initialMediaKind ?? null));
    setIsCreatePostModalOpen(true);
  };
  const closePostComposer = () => {
    setIsCreatePostModalOpen(false);
    setEditingPostId(null);
    setComposerMediaKind(null);
  };
  const [isProposeSessionModalOpen, setIsProposeSessionModalOpen] =
    useState(false);
  const [activeAIRefineQuestion, setActiveAIRefineQuestion] =
    useState<Question | null>(null);
  const [isExamWizardOpen, setIsExamWizardOpen] = useState(false);
  const [isExportQuestionsOpen, setIsExportQuestionsOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: string;
    id: string;
    title: string;
  } | null>(null);
  const [isApiReferenceOpen, setIsApiReferenceOpen] = useState(false);
  const [isTourGuideOpen, setIsTourGuideOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<
    'LOGIN' | 'REGISTER' | 'OTP' | 'SESSION_EXPIRED'
  >('LOGIN');

  // System states
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'info',
  ) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const {
    isAuthenticated,
    sessionKind,
    currentUser: rawCurrentUser,
    setCurrentUser,
    role,
    loginWithCredentials,
    logout,
    switchRole,
    updateCurrentUser: updateAuthCurrentUser,
  } = useAuthSession(showToast);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  useEffect(() => {
    conversationRecordsRef.current = conversationRecords;
  }, [conversationRecords]);

  useEffect(() => {
    if (sessionKind !== 'demo' || typeof BroadcastChannel === 'undefined')
      return;

    const channel = new BroadcastChannel('sqb:shared-feed');
    feedChannelRef.current = channel;
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (!isSharedFeedMessage(event.data)) {
        console.error('Received an invalid shared-feed message.');
        return;
      }
      if (event.data.type === 'REQUEST_SNAPSHOT') {
        channel.postMessage({
          type: 'UPDATE_SNAPSHOT',
          posts: postsRef.current,
        });
        return;
      }
      setPosts((previous) =>
        arePostSnapshotsEqual(previous, event.data.posts)
          ? previous
          : event.data.posts,
      );
    };
    channel.postMessage({ type: 'REQUEST_SNAPSHOT' });

    return () => {
      channel.close();
      feedChannelRef.current = null;
    };
  }, [sessionKind]);

  useEffect(() => {
    if (!initializedFeedSyncRef.current) {
      initializedFeedSyncRef.current = true;
      return;
    }
    feedChannelRef.current?.postMessage({
      type: 'UPDATE_SNAPSHOT',
      posts,
    });
  }, [posts]);

  useEffect(() => {
    if (sessionKind !== 'demo' || typeof BroadcastChannel === 'undefined')
      return;

    const channel = new BroadcastChannel('sqb:shared-chat');
    chatChannelRef.current = channel;
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (!isSharedChatMessage(event.data)) {
        console.error('Received an invalid shared-chat message.');
        return;
      }
      if (event.data.type === 'REQUEST_SNAPSHOT') {
        channel.postMessage({
          type: 'UPDATE_SNAPSHOT',
          conversations: conversationRecordsRef.current,
        });
        return;
      }
      setConversationRecords((previous) =>
        areConversationSnapshotsEqual(previous, event.data.conversations)
          ? previous
          : event.data.conversations,
      );
    };
    channel.postMessage({ type: 'REQUEST_SNAPSHOT' });

    return () => {
      channel.close();
      chatChannelRef.current = null;
    };
  }, [sessionKind]);

  useEffect(() => {
    if (!initializedChatSyncRef.current) {
      initializedChatSyncRef.current = true;
      return;
    }
    chatChannelRef.current?.postMessage({
      type: 'UPDATE_SNAPSHOT',
      conversations: conversationRecords,
    });
  }, [conversationRecords]);

  const friendStatuses = getFriendStatusesForAccount(
    friendStatusesByAccount,
    rawCurrentUser.id,
  );
  const setFriendStatuses: React.Dispatch<
    React.SetStateAction<Record<string, FriendStatus>>
  > = (update) => {
    setFriendStatusesByAccount((previous) => {
      const current = getFriendStatusesForAccount(previous, rawCurrentUser.id);
      const next = typeof update === 'function' ? update(current) : update;
      return { ...previous, [rawCurrentUser.id]: next };
    });
  };
  const notifications = getNotificationsForAccount(
    notificationsByAccount[rawCurrentUser.id] ?? [],
    rawCurrentUser.id,
  );
  const setNotifications: React.Dispatch<
    React.SetStateAction<AppNotification[]>
  > = (update) => {
    updateNotificationsForAccount(rawCurrentUser.id, update);
  };
  const updateNotificationsForAccount = (
    accountId: string,
    update: React.SetStateAction<AppNotification[]>,
  ) => {
    setNotificationsByAccount((previous) => {
      const current = previous[accountId] ?? [];
      const next = typeof update === 'function' ? update(current) : update;
      return { ...previous, [accountId]: next };
    });
  };
  const removeFriendRequestNotification = (
    accountId: string,
    actorId: string,
  ) => {
    updateNotificationsForAccount(accountId, (previous) =>
      previous.filter(
        (notification) =>
          notification.type !== 'FRIEND_REQUEST' ||
          notification.actor?.id !== actorId,
      ),
    );
  };

  const blockedByMeSet = new Set(blockedUsers.map((b) => b.userId));
  const blockedByOtherSet = new Set(blockedByOtherIds);
  const isBlockedByMe = (userId: string) => blockedByMeSet.has(userId);
  const isBlockingMe = (userId: string) => blockedByOtherSet.has(userId);
  const isBlockedEitherWay = (userId: string) =>
    blockedByMeSet.has(userId) || blockedByOtherSet.has(userId);

  const allUsers: User[] = [
    ...mockOtherUsers,
    role === 'STUDENT' ? mockCurrentUserLecturer : mockCurrentUserStudent,
  ].filter(
    (u, idx, arr) =>
      u.id !== rawCurrentUser.id &&
      arr.findIndex((item) => item.id === u.id) === idx,
  );

  const friendsList: User[] = allUsers.filter(
    (u) => friendStatuses[u.id] === 'FRIEND' && !isBlockedEitherWay(u.id),
  );

  const currentUser: User = {
    ...rawCurrentUser,
    friendsCount: friendsList.length,
  };
  const followingIds = followingIdsByAccount[rawCurrentUser.id] ?? [];
  const setFollowingIds: React.Dispatch<React.SetStateAction<string[]>> = (
    update,
  ) => {
    setFollowingIdsByAccount((previous) => {
      const current = previous[rawCurrentUser.id] ?? [];
      const next = typeof update === 'function' ? update(current) : update;
      return { ...previous, [rawCurrentUser.id]: next };
    });
  };
  const activeDockIds = activeDockIdsByAccount[rawCurrentUser.id] ?? [];
  const setActiveDockIds: React.Dispatch<React.SetStateAction<string[]>> = (
    update,
  ) => {
    setActiveDockIdsByAccount((previous) => {
      const current = previous[rawCurrentUser.id] ?? [];
      const next = typeof update === 'function' ? update(current) : update;
      return { ...previous, [rawCurrentUser.id]: next };
    });
  };
  const minimizedDockIds = minimizedDockIdsByAccount[rawCurrentUser.id] ?? [];
  const setMinimizedDockIds: React.Dispatch<React.SetStateAction<string[]>> = (
    update,
  ) => {
    setMinimizedDockIdsByAccount((previous) => {
      const current = previous[rawCurrentUser.id] ?? [];
      const next = typeof update === 'function' ? update(current) : update;
      return { ...previous, [rawCurrentUser.id]: next };
    });
  };

  const updateFriendStatusesForBothAccounts = (
    userId: string,
    currentStatus: FriendStatus,
    otherStatus: FriendStatus,
  ) => {
    setFriendStatusesByAccount((previous) => ({
      ...previous,
      [currentUser.id]: {
        ...getFriendStatusesForAccount(previous, currentUser.id),
        [userId]: currentStatus,
      },
      [userId]: {
        ...getFriendStatusesForAccount(previous, userId),
        [currentUser.id]: otherStatus,
      },
    }));
  };

  // Mạng lưới bạn bè mặc định của các sinh viên khác trong hệ thống
  const findRawUserById = (id: string): User => {
    if (id === rawCurrentUser.id) return rawCurrentUser;
    if (id === mockCurrentUserStudent.id) return mockCurrentUserStudent;
    if (id === mockCurrentUserLecturer.id) return mockCurrentUserLecturer;
    const found = mockOtherUsers.find((u) => u.id === id);
    return found || mockCurrentUserStudent;
  };

  const conversations = getConversationsForAccount(
    conversationRecords,
    rawCurrentUser.id,
  ).map((conversation) => {
    const partnerId = getConversationPartnerId(conversation, rawCurrentUser.id);
    return {
      ...conversation,
      unreadCount:
        conversation.unreadCounts?.[rawCurrentUser.id] ??
        conversation.unreadCount,
      partner: partnerId ? findRawUserById(partnerId) : conversation.partner,
    };
  });

  const getFriendsOfUser = (userId: string): User[] => {
    if (userId === currentUser.id) return friendsList;
    const peerIds = mockPeerFriendsMap[userId] || [];
    const peerUsers = peerIds
      .filter((pid) => pid !== userId)
      .map((pid) => findRawUserById(pid));
    const isFriendWithMe =
      friendStatuses[userId] === 'FRIEND' && !isBlockedEitherWay(userId);
    const list = isFriendWithMe ? [currentUser, ...peerUsers] : peerUsers;
    // Khử trùng lặp
    return list.filter(
      (u, idx, arr) => arr.findIndex((item) => item.id === u.id) === idx,
    );
  };

  const getMutualFriendsCount = (userId: string): number => {
    if (userId === currentUser.id) return 0;
    const myFriendIds = new Set(friendsList.map((f) => f.id));
    const theirFriendIds = (mockPeerFriendsMap[userId] || []).filter(
      (id) => id !== currentUser.id,
    );
    return theirFriendIds.filter((id) => myFriendIds.has(id)).length;
  };

  const getUserById = (id: string): User => {
    if (id === currentUser.id) return currentUser;
    const raw = findRawUserById(id);
    const theirFriends = getFriendsOfUser(id);
    return {
      ...raw,
      friendsCount: theirFriends.length,
    };
  };

  // Actions quản lý bạn bè như thật
  const sendFriendRequest = (userId: string) => {
    if (userId === currentUser.id) return;
    if (isBlockedEitherWay(userId)) {
      showToast(
        'Không thể gửi lời mời kết bạn cho người đang trong danh sách chặn.',
        'error',
      );
      return;
    }
    const target = findRawUserById(userId);
    updateFriendStatusesForBothAccounts(
      userId,
      'REQUEST_SENT',
      'REQUEST_RECEIVED',
    );
    const notification: AppNotification = {
      id: `friend_request_${currentUser.id}_${Date.now()}`,
      recipientId: userId,
      title: 'Lời mời kết bạn mới',
      message: `${currentUser.name} đã gửi cho bạn một lời mời kết bạn.`,
      timestamp: 'Vừa xong',
      isRead: false,
      type: 'FRIEND_REQUEST',
      actor: currentUser,
    };
    updateNotificationsForAccount(userId, (previous) => [
      notification,
      ...previous.filter(
        (existing) =>
          existing.type !== 'FRIEND_REQUEST' ||
          existing.actor?.id !== currentUser.id,
      ),
    ]);
    showToast(`Đã gửi lời mời kết bạn tới ${target.name}!`, 'success');
  };

  const cancelFriendRequest = (userId: string) => {
    const target = findRawUserById(userId);
    updateFriendStatusesForBothAccounts(userId, 'NONE', 'NONE');
    removeFriendRequestNotification(userId, currentUser.id);
    showToast(`Đã hủy lời mời kết bạn với ${target.name}.`, 'info');
  };

  const acceptFriendRequest = (userId: string) => {
    if (isBlockedEitherWay(userId)) {
      showToast('Không thể kết bạn với người đang bị chặn.', 'error');
      return;
    }
    const target = findRawUserById(userId);
    updateFriendStatusesForBothAccounts(userId, 'FRIEND', 'FRIEND');
    removeFriendRequestNotification(currentUser.id, userId);
    showToast(`Bạn và ${target.name} đã trở thành bạn bè!`, 'success');
  };

  const declineFriendRequest = (userId: string) => {
    const target = findRawUserById(userId);
    updateFriendStatusesForBothAccounts(userId, 'NONE', 'NONE');
    removeFriendRequestNotification(currentUser.id, userId);
    showToast(`Đã xóa lời mời kết bạn từ ${target.name}.`, 'info');
  };

  const unfriendUser = (userId: string) => {
    const target = findRawUserById(userId);
    updateFriendStatusesForBothAccounts(userId, 'NONE', 'NONE');
    showToast(`Đã hủy kết bạn với ${target.name}.`, 'info');
  };

  const toggleFollowUser = (userId: string) => {
    if (isBlockedEitherWay(userId)) {
      showToast('Không thể theo dõi người dùng đang bị chặn.', 'error');
      return;
    }
    const target = findRawUserById(userId);
    setFollowingIds((prev) => {
      const exists = prev.includes(userId);
      if (exists) {
        showToast(`Đã bỏ theo dõi ${target.name}.`, 'info');
        return prev.filter((id) => id !== userId);
      } else {
        showToast(`Đang theo dõi ${target.name}!`, 'success');
        return [...prev, userId];
      }
    });
  };

  const dismissSuggestion = (userId: string) => {
    setDismissedSuggestionIds((prev) =>
      prev.includes(userId) ? prev : [...prev, userId],
    );
  };

  // Actions Chặn & Bỏ chặn theo đúng logic Slide 24:
  // - Chặn và bỏ chặn bất kỳ ai, chặn lại sau khi bỏ chặn KHÔNG bị giới hạn thời gian
  // - Chặn sẽ khiến người đó không còn là bạn bè của người thực hiện thao tác chặn
  // - Chặn KHÔNG xóa bình luận, like của người đó khỏi trang cá nhân (nhưng người chặn không thấy các bình luận này)
  // - Chặn khiến hai người không thể trao đổi tin nhắn với nhau được nữa
  // - Chặn khiến hai người không xem được trang cá nhân của nhau
  const blockUser = (userId: string, reason?: string) => {
    if (userId === currentUser.id) return;
    const target = findRawUserById(userId);
    const wasFriend = friendStatuses[userId] === 'FRIEND';

    // 1. Hủy kết bạn / hủy lời mời kết bạn ngay lập tức
    updateFriendStatusesForBothAccounts(userId, 'NONE', 'NONE');
    setFollowingIds((prev) => prev.filter((id) => id !== userId));

    // 2. Thêm vào danh sách chặn (không giới hạn thời gian kể cả vừa bỏ chặn xong)
    setBlockedUsers((prev) => {
      const filtered = prev.filter((item) => item.userId !== userId);
      return [
        {
          userId,
          blockedAt: new Date().toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          reason: reason?.trim() || 'Chặn bởi người dùng',
        },
        ...filtered,
      ];
    });

    showToast(
      wasFriend
        ? `Đã chặn ${target.name} và hủy kết bạn. Hai người sẽ không thể nhắn tin hoặc xem trang cá nhân của nhau.`
        : `Đã chặn ${target.name}. Hai người sẽ không thể nhắn tin hoặc xem trang cá nhân của nhau.`,
      'warning',
    );
  };

  const unblockUser = (userId: string) => {
    const target = findRawUserById(userId);
    setBlockedUsers((prev) => prev.filter((item) => item.userId !== userId));
    showToast(
      `Đã bỏ chặn ${target.name}. Bạn có thể xem lại trang cá nhân, nhắn tin hoặc chặn lại bất cứ lúc nào (không giới hạn thời gian).`,
      'success',
    );
  };

  const toggleSimulatedBlockedByOther = (userId: string) => {
    const target = findRawUserById(userId);
    setBlockedByOtherIds((prev) => {
      const exists = prev.includes(userId);
      if (exists) {
        showToast(`[Mô phỏng] ${target.name} đã bỏ chặn bạn.`, 'info');
        return prev.filter((id) => id !== userId);
      } else {
        // Khi người kia chặn mình, quan hệ bạn bè cũng tự động bị hủy
        updateFriendStatusesForBothAccounts(userId, 'NONE', 'NONE');
        showToast(
          `[Mô phỏng] ${target.name} vừa chặn bạn. Bạn không thể xem trang cá nhân hay nhắn tin cho người này.`,
          'warning',
        );
        return [...prev, userId];
      }
    });
  };

  // Lọc bình luận hiển thị (ẩn bình luận/phản hồi của người bị chặn nhưng KHÔNG xóa khỏi dữ liệu gốc)
  const filterVisibleComments = (comments?: CommentItem[]): CommentItem[] => {
    if (!comments) return [];
    return comments
      .filter((c) => !isBlockedEitherWay(c.author.id))
      .map((c) => ({
        ...c,
        replies: c.replies?.filter((r) => !isBlockedEitherWay(r.author.id)),
      }));
  };

  const sharedPostId =
    location.pathname === '/feed'
      ? new URLSearchParams(location.search).get('post')
      : null;
  const sharedPost = sharedPostId
    ? posts.find((post) => post.id === sharedPostId)
    : null;
  const canViewSharedPost =
    sharedPost &&
    !isBlockedEitherWay(sharedPost.author.id) &&
    (sharedPost.author.id === currentUser.id ||
      sharedPost.privacy === 'PUBLIC' ||
      (sharedPost.privacy === 'FRIENDS' &&
        friendStatuses[sharedPost.author.id] === 'FRIEND'));
  const activePostDetail = sharedPostId
    ? canViewSharedPost
      ? sharedPost
      : null
    : (posts.find((post) => post.id === activePostDetailId) ?? null);

  const updateCurrentUser = (updates: Partial<User>) => {
    updateAuthCurrentUser(updates);
    setPosts((previous) =>
      previous.map((post) => ({
        ...post,
        author:
          post.author.id === currentUser.id
            ? { ...post.author, ...updates }
            : post.author,
        comments: post.comments?.map((comment) => ({
          ...comment,
          author:
            comment.author.id === currentUser.id
              ? { ...comment.author, ...updates }
              : comment.author,
          replies: comment.replies?.map((reply) => ({
            ...reply,
            author:
              reply.author.id === currentUser.id
                ? { ...reply.author, ...updates }
                : reply.author,
          })),
        })),
      })),
    );
  };

  const saveProfilePhoto = (
    kind: 'avatar' | 'cover',
    url: string,
    crop: ImageCrop,
  ) => {
    const previousUrl =
      kind === 'avatar' ? currentUser.avatar : currentUser.coverImage;
    const previousCrop =
      kind === 'avatar' ? currentUser.avatarCrop : currentUser.coverCrop;
    if (previousUrl !== url) {
      setProfilePhotoHistory((history) => [
        {
          id: crypto.randomUUID(),
          userId: currentUser.id,
          kind,
          url: previousUrl,
          crop: previousCrop,
          savedAt: new Date().toISOString(),
        },
        ...history,
      ]);
    }
    updateCurrentUser(
      kind === 'avatar'
        ? { avatar: url, avatarCrop: crop }
        : { coverImage: url, coverCrop: crop },
    );
  };

  // Sync dark mode class on root
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark');
        localStorage.setItem('unisocial_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.remove('dark');
        localStorage.setItem('unisocial_theme', 'light');
      }
    } catch {
      // ignore
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Saved Searches
  const removeSavedSearch = (term: string) => {
    setSavedSearches((prev) => prev.filter((s) => s !== term));
  };

  const clearAllSavedSearches = () => {
    setSavedSearches([]);
    showToast('Đã xóa toàn bộ lịch sử tìm kiếm', 'info');
  };

  const triggerSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && !savedSearches.includes(query.trim())) {
      setSavedSearches((prev) => [query.trim(), ...prev.slice(0, 9)]);
    }
    setActiveTab('search');
  };

  // Posts
  const createPost = (postData: Partial<Post>) => {
    if (
      (!postData.content?.trim() &&
        !postData.mediaUrls?.length &&
        !postData.documents?.length) ||
      getPostContentIssue(postData.content ?? '')
    )
      return;
    const newPost: Post = {
      id: crypto.randomUUID(),
      author: currentUser,
      type: postData.type || 'KNOWLEDGE',
      content: postData.content || '',
      subjectTag: postData.subjectTag,
      mediaUrls: postData.mediaUrls,
      documents: postData.documents,
      videoUrl: postData.videoUrl,
      linkedQuestionId: postData.linkedQuestionId,
      likesCount: 0,
      isLiked: false,
      commentsCount: 0,
      sharesCount: 0,
      privacy: postData.privacy || 'PUBLIC',
      createdAt: new Date().toISOString(),
      comments: [],
    };
    setPosts((previous) => [newPost, ...previous]);
    showToast('Đã đăng bài viết mới thành công!', 'success');
  };

  const updatePost = (
    postId: string,
    updates: Pick<
      Post,
      'content' | 'privacy' | 'mediaUrls' | 'documents' | 'type'
    >,
  ) => {
    if (
      (!updates.content.trim() &&
        !updates.mediaUrls?.length &&
        !updates.documents?.length) ||
      getPostContentIssue(updates.content)
    )
      return;
    const oldPost = posts.find(
      (post) => post.id === postId && post.author.id === currentUser.id,
    );
    if (!oldPost) return;
    setPosts((previous) =>
      updateOwnedPost(previous, postId, currentUser.id, updates),
    );
    oldPost.mediaUrls
      ?.filter((url) => !updates.mediaUrls?.includes(url))
      .filter(
        (url) =>
          url !== currentUser.avatar &&
          url !== currentUser.coverImage &&
          !profilePhotoHistory.some((photo) => photo.url === url),
      )
      .forEach(revokeMediaUrl);
    oldPost.documents
      ?.filter(
        (document) =>
          !updates.documents?.some((item) => item.url === document.url),
      )
      .forEach((document) => revokeMediaUrl(document.url));
    showToast('Đã lưu thay đổi bài viết.', 'success');
  };

  const toggleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked
              ? p.likesCount + 1
              : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      }),
    );
  };

  const addComment = (
    postId: string,
    text: string,
    parentCommentId?: string,
  ) => {
    if (!text.trim()) return;
    const post = posts.find((item) => item.id === postId);
    if (
      !post ||
      (parentCommentId &&
        !post.comments?.some((item) => item.id === parentCommentId))
    )
      return;
    const newComment: CommentItem = {
      id: crypto.randomUUID(),
      author: currentUser,
      content: text.trim(),
      createdAt: new Date().toISOString(),
      likesCount: 0,
      isLiked: false,
    };

    setPosts((previous) =>
      appendComment(previous, postId, newComment, parentCommentId),
    );
    showToast('Đã gửi bình luận!', 'success');
  };

  const deletePost = (postId: string) => {
    const oldPost = posts.find(
      (post) => post.id === postId && post.author.id === currentUser.id,
    );
    if (!oldPost) return;
    setPosts((previous) => removeOwnedPost(previous, postId, currentUser.id));
    oldPost.mediaUrls
      ?.filter(
        (url) =>
          url !== currentUser.avatar &&
          url !== currentUser.coverImage &&
          !profilePhotoHistory.some((photo) => photo.url === url),
      )
      .forEach(revokeMediaUrl);
    oldPost.documents?.forEach((document) => revokeMediaUrl(document.url));
    if (activePostDetailId === postId) setActivePostDetailId(null);
    if (sharedPostId === postId) navigate('/feed', { replace: true });
    showToast('Đã xóa bài viết thành công!', 'info');
  };

  const addLecturerNote = (postId: string, note: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            lecturerNote: {
              lecturerName: currentUser.name,
              avatar: currentUser.avatar,
              note,
              createdAt: 'Vừa xong',
            },
          };
        }
        return p;
      }),
    );
    showToast('Đã ghim ghi chú giảng viên!', 'success');
  };

  // Questions
  const answerQuestion = (
    questionId: string,
    chosenOption: 'A' | 'B' | 'C' | 'D',
  ) => {
    const q = questions.find((item) => item.id === questionId);
    if (!q) return false;
    const isCorrect = q.correctAnswer === chosenOption;

    setQuestions((prev) =>
      prev.map((item) => {
        if (item.id === questionId) {
          const distribution = item.optionDistribution || {
            A: 0,
            B: 0,
            C: 0,
            D: 0,
          };
          return {
            ...item,
            totalAttempts: item.totalAttempts + 1,
            correctAttempts: isCorrect
              ? item.correctAttempts + 1
              : item.correctAttempts,
            optionDistribution: {
              ...distribution,
              [chosenOption]: (distribution[chosenOption] || 0) + 1,
            },
          };
        }
        return item;
      }),
    );

    if (isCorrect) {
      setCurrentUser((u) => ({ ...u, points: u.points + 10 }));
    }

    // Track API monitor log (Slide 1: POST /questions/{questionId}/answer)
    addApiLog({
      method: 'POST',
      endpoint: `/questions/${questionId}/answer`,
      title: 'Nộp câu trả lời (POST /questions/{id}/answer)',
      statusCode: 200,
      payload: { selected_option: chosenOption },
      response: {
        code: 'SUCCESS',
        message: isCorrect ? 'Đáp án chính xác' : 'Đáp án chưa chính xác',
        data: {
          is_correct: isCorrect ? 'true' : 'false',
          correct_answer: q.correctAnswer,
          explanation: q.explanation,
        },
      },
    });

    return isCorrect;
  };

  const rateQuestion = (
    questionId: string,
    stars: number,
    comment?: string,
  ) => {
    const clampedStars = Math.min(4, Math.max(0, stars));
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          const prevStars = q.userRatedStars || 0;
          let newCount = q.ratingCount;
          let newAvg = q.ratingAverage;

          if (clampedStars <= 0) {
            if (prevStars > 0) {
              newCount = Math.max(0, q.ratingCount - 1);
              newAvg =
                newCount > 0
                  ? Number(
                      (
                        (q.ratingAverage * q.ratingCount - prevStars) /
                        newCount
                      ).toFixed(1),
                    )
                  : 0;
            }
            return {
              ...q,
              userRatedStars: 0,
              userComment: undefined,
              ratingCount: newCount,
              ratingAverage: Math.min(4.0, newAvg),
            };
          }

          if (prevStars > 0) {
            newAvg = Number(
              (
                (q.ratingAverage * q.ratingCount - prevStars + clampedStars) /
                q.ratingCount
              ).toFixed(1),
            );
          } else {
            newCount = q.ratingCount + 1;
            newAvg = Number(
              (
                (q.ratingAverage * q.ratingCount + clampedStars) /
                newCount
              ).toFixed(1),
            );
          }

          newAvg = Math.min(4.0, Math.max(0, newAvg));

          return {
            ...q,
            userRatedStars: clampedStars,
            userComment: comment !== undefined ? comment : q.userComment,
            ratingCount: newCount,
            ratingAverage: newAvg,
          };
        }
        return q;
      }),
    );

    // Track API monitor log (Slide 4: POST /questions/{questionId}/rate)
    addApiLog({
      method: 'POST',
      endpoint: `/questions/${questionId}/rate`,
      title: 'Đánh giá câu hỏi 0-4 sao (POST /questions/{id}/rate)',
      statusCode: 200,
      payload: { rating: clampedStars.toString(), comment },
      response: {
        code: 'SUCCESS',
        message: 'Đánh giá thành công',
        data: { new_avg_rating: '3.8', new_rating_count: '15' },
      },
    });

    if (clampedStars <= 0) {
      showToast('Đã hủy đánh giá câu hỏi', 'info');
    } else if (comment) {
      showToast(
        `Đã lưu đánh giá ${clampedStars} sao và nhận xét của bạn!`,
        'success',
      );
    } else {
      showToast(`Đã gửi đánh giá ${clampedStars} sao cho câu hỏi!`, 'success');
    }
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, ...updates } : q)),
    );
  };

  const applyAIQuestionRefine = (
    questionId: string,
    newContent: string,
    newExplanation?: string,
  ) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            content: newContent,
            explanation: newExplanation || q.explanation,
            status: 'APPROVED',
          };
        }
        return q;
      }),
    );
    showToast('Đã áp dụng tinh chỉnh của AI thành công!', 'success');
  };

  // Sessions
  const createProposeSession = (
    title: string,
    subject: string,
    chapter: string,
    newQuestionsData: Omit<
      Question,
      | 'id'
      | 'status'
      | 'creatorId'
      | 'creatorName'
      | 'creatorAvatar'
      | 'ratingAverage'
      | 'ratingCount'
      | 'totalAttempts'
      | 'correctAttempts'
    >[],
  ) => {
    const sessionId = 'sess_' + Date.now();
    const createdQuestions: Question[] = newQuestionsData.map(
      (data, index) => ({
        ...data,
        id: `q_${Date.now()}_${index}`,
        sessionId,
        status: 'PENDING',
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        creatorAvatar: currentUser.avatar,
        ratingAverage: 0,
        ratingCount: 0,
        totalAttempts: 0,
        correctAttempts: 0,
      }),
    );

    const newSession: ProposeSession = {
      id: sessionId,
      title,
      subject,
      chapter,
      creator: currentUser,
      status: 'PENDING',
      questions: createdQuestions,
      submittedAt: 'Vừa xong',
    };

    setSessions([newSession, ...sessions]);
    setQuestions([...createdQuestions, ...questions]);
    showToast(
      `Đã gửi phiên "${title}" tới Giảng viên để kiểm duyệt!`,
      'success',
    );
  };

  // API logs state
  const [apiLogs, setApiLogs] = useState<ApiCallLog[]>([
    {
      id: 'log_init_01',
      method: 'GET',
      endpoint: '/sessions/pending',
      title: 'Lấy danh sách phiên đề xuất chờ duyệt',
      timestamp: 'Hôm nay lúc 09:30:15',
      statusCode: 200,
      response: {
        total: 2,
        sessions: [
          {
            id: 'sess_pending_01',
            title: 'Bộ câu hỏi trắc nghiệm Chuẩn hoá CSDL...',
            count: 4,
          },
          {
            id: 'sess_pending_02',
            title: 'Đề xuất trắc nghiệm Quản lý Bế tắc...',
            count: 2,
          },
        ],
      },
    },
  ]);

  const addApiLog = (logData: Omit<ApiCallLog, 'id' | 'timestamp'>) => {
    const newLog: ApiCallLog = {
      ...logData,
      id: 'log_' + Date.now(),
      timestamp: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
    setApiLogs((prev) => [newLog, ...prev.slice(0, 29)]);
  };

  const clearApiLogs = () => {
    setApiLogs([]);
  };

  // PUT /questions/{questionId} Giảng viên chỉnh sửa câu hỏi
  const editQuestionByLecturer = (
    questionId: string,
    updates: Partial<Question>,
  ) => {
    const updatedQuestionPayload = {
      ...updates,
      isEditedByLecturer: true,
      editedAt: 'Vừa xong',
    };

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, ...updatedQuestionPayload } : q,
      ),
    );

    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        questions: s.questions.map((q) =>
          q.id === questionId ? { ...q, ...updatedQuestionPayload } : q,
        ),
      })),
    );

    addApiLog({
      method: 'PUT',
      endpoint: `/questions/${questionId}`,
      title: 'Giảng viên chỉnh sửa câu hỏi',
      payload: updates,
      response: {
        success: true,
        message: 'Đã cập nhật nội dung câu hỏi thành công bởi Giảng viên',
        questionId,
      },
      statusCode: 200,
    });

    showToast('Đã lưu chỉnh sửa câu hỏi (PUT /questions/{id})!', 'success');
  };

  // POST /sessions/approve Phê duyệt danh sách câu hỏi -> Đưa vào ngân hàng đề GV trạng thái "Cần edit" & chốt bảo lưu điểm SV
  const approveQuestionsBulk = (
    sessionId: string,
    selectedQuestionIds: string[],
    targetBankName: string = 'Ngân hàng đề thi Giảng viên',
    note?: string,
    autoPost: boolean = true,
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        selectedQuestionIds.includes(q.id)
          ? {
              ...q,
              status: 'NEED_EDIT',
              inLecturerBank: true,
              studentPointsReserved: 20,
              targetBankCategory: targetBankName,
            }
          : q,
      ),
    );

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const updatedQs = s.questions.map((q) =>
            selectedQuestionIds.includes(q.id)
              ? {
                  ...q,
                  status: 'NEED_EDIT' as const,
                  inLecturerBank: true,
                  studentPointsReserved: 20,
                  targetBankCategory: targetBankName,
                }
              : q,
          );
          const allProcessed = updatedQs.every(
            (q) =>
              q.status === 'NEED_EDIT' ||
              q.status === 'APPROVED' ||
              q.status === 'REJECTED',
          );
          return {
            ...s,
            status: allProcessed ? 'APPROVED' : 'PARTIAL_APPROVED',
            questions: updatedQs,
            targetBankName,
          };
        }
        return s;
      }),
    );

    const targetSession = sessions.find((s) => s.id === sessionId);
    if (targetSession) {
      const pointsEarned = selectedQuestionIds.length * 20;
      const newNotif: AppNotification = {
        id: 'notif_' + Date.now(),
        recipientId: targetSession.creator.id,
        title: 'Câu hỏi được phê duyệt vào ngân hàng đề!',
        message: `Thầy/Cô đã phê duyệt ${selectedQuestionIds.length} câu hỏi trong phiên "${targetSession.title}". Bạn nhận được +${pointsEarned} điểm cống hiến!`,
        timestamp: 'Vừa xong',
        isRead: false,
        type: 'QUESTION_APPROVED',
        actor: currentUser,
        targetId: sessionId,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      if (autoPost) {
        createPost({
          type: 'QUESTION_APPROVED',
          content: `🎉 Chúc mừng ${targetSession.creator.name} đã được Giảng viên phê duyệt ${selectedQuestionIds.length} câu hỏi môn ${targetSession.subject} ("${targetSession.title}") nạp thẳng vào ${targetBankName}!`,
          subjectTag: targetSession.subject,
          privacy: 'PUBLIC',
        });
      }
    }

    addApiLog({
      method: 'POST',
      endpoint: '/sessions/approve',
      title: 'Phê duyệt danh sách câu hỏi vào ngân hàng',
      payload: {
        sessionId,
        questionIds: selectedQuestionIds,
        targetBankName,
        note,
        autoPost,
      },
      response: {
        success: true,
        approvedCount: selectedQuestionIds.length,
        bonusPointsAwarded: selectedQuestionIds.length * 20,
      },
      statusCode: 200,
    });

    showToast(
      `Đã phê duyệt ${selectedQuestionIds.length} câu hỏi vào ngân hàng đề (POST /sessions/approve)!`,
      'success',
    );
  };

  // POST /sessions/reject Từ chối danh sách câu hỏi
  const rejectQuestionsBulk = (
    sessionId: string,
    selectedQuestionIds: string[],
    reason: string,
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        selectedQuestionIds.includes(q.id)
          ? { ...q, status: 'REJECTED', rejectionReason: reason }
          : q,
      ),
    );

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const updatedQs = s.questions.map((q) =>
            selectedQuestionIds.includes(q.id)
              ? { ...q, status: 'REJECTED' as const, rejectionReason: reason }
              : q,
          );
          const allRejected = updatedQs.every((q) => q.status === 'REJECTED');
          return {
            ...s,
            status: allRejected ? 'REJECTED' : 'PARTIAL_APPROVED',
            questions: updatedQs,
            lecturerFeedback: reason,
          };
        }
        return s;
      }),
    );

    const targetSession = sessions.find((s) => s.id === sessionId);
    if (targetSession) {
      const newNotif: AppNotification = {
        id: 'notif_' + Date.now(),
        recipientId: targetSession.creator.id,
        title: 'Phản hồi phiên câu hỏi đề xuất',
        message: `Thầy/Cô đã từ chối ${selectedQuestionIds.length} câu hỏi trong phiên "${targetSession.title}". Lý do: "${reason}". Bạn có thể chỉnh sửa lại để nộp duyệt.`,
        timestamp: 'Vừa xong',
        isRead: false,
        type: 'QUESTION_REJECTED',
        actor: currentUser,
        targetId: sessionId,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }

    addApiLog({
      method: 'POST',
      endpoint: '/sessions/reject',
      title: 'Từ chối danh sách câu hỏi',
      payload: {
        sessionId,
        questionIds: selectedQuestionIds,
        reason,
      },
      response: {
        success: true,
        rejectedCount: selectedQuestionIds.length,
        reason,
      },
      statusCode: 200,
    });

    showToast(
      `Đã từ chối ${selectedQuestionIds.length} câu hỏi kèm lý do (POST /sessions/reject).`,
      'info',
    );
  };

  // POST /sessions/{sessionId}/complete-review Chốt hoàn tất duyệt phiên đề xuất
  const completeReviewSession = (sessionId: string, finalFeedback?: string) => {
    let approvedCount = 0;
    let rejectedCount = 0;

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          approvedCount = s.questions.filter(
            (q) => q.status === 'APPROVED',
          ).length;
          rejectedCount = s.questions.filter(
            (q) => q.status === 'REJECTED',
          ).length;
          return {
            ...s,
            status: 'COMPLETED',
            reviewedAt: 'Vừa xong',
            reviewer: currentUser,
            lecturerFeedback:
              finalFeedback ||
              s.lecturerFeedback ||
              'Đã hoàn tất đánh giá toàn bộ phiên đề xuất.',
          };
        }
        return s;
      }),
    );

    addApiLog({
      method: 'POST',
      endpoint: `/sessions/${sessionId}/complete-review`,
      title: 'Chốt hoàn tất duyệt phiên đề xuất',
      payload: {
        sessionId,
        finalFeedback,
      },
      response: {
        success: true,
        sessionStatus: 'COMPLETED',
        approvedQuestions: approvedCount,
        rejectedQuestions: rejectedCount,
        reviewedAt: new Date().toISOString(),
      },
      statusCode: 200,
    });

    showToast(
      'Đã chốt hoàn tất phiên đề xuất và lưu vào Lịch sử (POST /sessions/{id}/complete-review)!',
      'success',
    );
  };

  // Giảng viên quyết định Giữ & Chuẩn hóa câu hỏi từ "Cần edit" -> "APPROVED"
  const decideKeepQuestion = (questionId: string, notes?: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              status: 'APPROVED',
              inLecturerBank: true,
              isEditedByLecturer: true,
              editedAt: 'Vừa xong',
            }
          : q,
      ),
    );

    addApiLog({
      method: 'PUT',
      endpoint: `/questions/${questionId}`,
      title: 'Giảng viên quyết định giữ & chuẩn hóa câu hỏi vào kho thi',
      payload: { questionId, status: 'APPROVED', notes },
      response: {
        success: true,
        message: 'Câu hỏi đã được chuẩn hóa và sẵn sàng sinh đề thi',
      },
      statusCode: 200,
    });

    showToast(
      'Đã chuẩn hóa và giữ câu hỏi trong Ngân hàng đề thi chính thức!',
      'success',
    );
  };

  // Giảng viên quyết định Loại câu hỏi khỏi kho đề (Điểm cộng của SV vẫn được chốt bảo lưu trọn vẹn)
  const decideDiscardQuestion = (questionId: string, reason?: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              status: 'REJECTED',
              rejectionReason:
                reason || 'Giảng viên quyết định loại bỏ sau khi thẩm định.',
            }
          : q,
      ),
    );

    addApiLog({
      method: 'POST',
      endpoint: '/sessions/reject',
      title: 'Giảng viên quyết định loại câu hỏi khỏi kho đề (Bảo lưu điểm SV)',
      payload: { questionId, reason },
      response: {
        success: true,
        message:
          'Đã loại câu hỏi. Điểm cống hiến của sinh viên vẫn được bảo lưu trọn vẹn.',
      },
      statusCode: 200,
    });

    showToast(
      'Đã loại câu hỏi khỏi kho đề (Điểm cộng của SV vẫn được chốt bảo lưu trọn vẹn)!',
      'info',
    );
  };

  // Exams
  const generateExam = (
    newExamData: Omit<Exam, 'id' | 'createdAt' | 'creator'>,
  ): Exam => {
    const exam: Exam = {
      ...newExamData,
      id: 'exam_' + Date.now(),
      createdAt:
        'Hôm nay lúc ' +
        new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      creator: currentUser,
    };
    setExams([exam, ...exams]);
    showToast(
      `Đã sinh thành công đề thi "${exam.title}" (${exam.totalQuestions} câu)!`,
      'success',
    );
    return exam;
  };

  // Minigames
  const submitGuess = (gameId: string, guess: number) => {
    setMinigames((prev) =>
      prev.map((g) => {
        if (g.id === gameId) {
          return {
            ...g,
            userGuess: guess,
            hasUserGuessed: true,
          };
        }
        return g;
      }),
    );
    showToast(
      `Đã xác nhận dự đoán: ${guess}. Chờ công bố kết quả vào Chủ Nhật!`,
      'success',
    );
  };

  // Cosmetics
  const equipCosmetic = (itemId: string) => {
    const item = cosmetics.find((c) => c.id === itemId);
    if (!item) return;

    setCosmetics((prev) =>
      prev.map((c) => {
        if (c.type === item.type) {
          return { ...c, isEquipped: c.id === itemId };
        }
        return c;
      }),
    );

    if (item.type === 'AVATAR_FRAME') {
      setCurrentUser((u) => ({ ...u, equippedFrameId: itemId }));
    } else if (item.type === 'CHAT_EFFECT') {
      setCurrentUser((u) => ({ ...u, equippedChatEffectId: itemId }));
    }

    showToast(`Đã trang bị "${item.name}"!`, 'success');
  };

  const unequipCosmetic = (itemId: string) => {
    const item = cosmetics.find((c) => c.id === itemId);
    if (!item) return;

    setCosmetics((prev) =>
      prev.map((c) => (c.id === itemId ? { ...c, isEquipped: false } : c)),
    );

    if (item.type === 'AVATAR_FRAME') {
      setCurrentUser((u) => ({ ...u, equippedFrameId: undefined }));
    } else if (item.type === 'CHAT_EFFECT') {
      setCurrentUser((u) => ({ ...u, equippedChatEffectId: undefined }));
    }

    showToast(`Đã gỡ trang bị "${item.name}"!`, 'info');
  };

  // Chat dock
  const openChatDock = (partnerUserId: string) => {
    if (sessionKind !== 'demo') {
      showToast(
        'Trò chuyện bằng tài khoản API chưa được kết nối với máy chủ.',
        'warning',
      );
      return;
    }
    if (partnerUserId === currentUser.id) return;
    let conv = conversations.find((c) => c.partner.id === partnerUserId);
    if (!conv) {
      const partner = getUserById(partnerUserId);
      const newConv: Conversation = {
        id: 'conv_' + Date.now(),
        participantIds: [currentUser.id, partnerUserId],
        partner,
        lastMessage: 'Bắt đầu cuộc trò chuyện',
        lastMessageTime: 'Vừa xong',
        unreadCount: 0,
        messages: [],
      };
      setConversationRecords((previous) => [newConv, ...previous]);
      conv = newConv;
    } else {
      markConversationRead(conv.id);
    }

    if (!activeDockIds.includes(conv.id)) {
      setActiveDockIds((prev) => [...prev.slice(-2), conv!.id]); // max 3 windows
    }
    setMinimizedDockIds((prev) => prev.filter((id) => id !== conv!.id));
  };

  const closeChatDock = (conversationId: string) => {
    setActiveDockIds((prev) => prev.filter((id) => id !== conversationId));
    setMinimizedDockIds((prev) => prev.filter((id) => id !== conversationId));
  };

  const minimizeChatDock = (conversationId: string) => {
    setActiveDockIds((prev) => prev.filter((id) => id !== conversationId));
    if (!minimizedDockIds.includes(conversationId)) {
      setMinimizedDockIds((prev) => [...prev, conversationId]);
    }
  };

  const restoreChatDock = (conversationId: string) => {
    setMinimizedDockIds((prev) => prev.filter((id) => id !== conversationId));
    if (!activeDockIds.includes(conversationId)) {
      setActiveDockIds((prev) => [...prev.slice(-2), conversationId]);
    }
  };

  const markConversationRead = (conversationId: string) => {
    const conversation = conversations.find(
      (item) => item.id === conversationId,
    );
    if (!conversation || conversation.unreadCount === 0) return;
    setConversationRecords((previous) =>
      previous.map((item) =>
        item.id === conversationId
          ? {
              ...item,
              unreadCounts: {
                ...item.unreadCounts,
                [currentUser.id]: 0,
              },
            }
          : item,
      ),
    );
  };

  const sendMessage = (conversationId: string, text: string) => {
    if (!text.trim()) return;
    const targetConv = conversations.find((c) => c.id === conversationId);
    if (!targetConv) return;
    if (isBlockedEitherWay(targetConv.partner.id)) {
      showToast(
        'Không thể gửi tin nhắn vì hai người đang trong trạng thái chặn.',
        'error',
      );
      return;
    }
    const newMessage: MessageItem = {
      id: 'm_' + Date.now(),
      conversationId,
      senderId: currentUser.id,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'DELIVERED',
      effect: currentUser.equippedChatEffectId,
    };

    setConversationRecords((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessage: text,
            lastMessageTime: newMessage.timestamp,
            unreadCounts: {
              ...c.unreadCounts,
              [targetConv.partner.id]:
                (c.unreadCounts?.[targetConv.partner.id] ?? 0) + 1,
            },
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      }),
    );
  };

  const recallMessage = (conversationId: string, messageId: string) => {
    const conversation = conversations.find(
      (item) => item.id === conversationId,
    );
    if (
      !conversation ||
      !conversation.messages.some(
        (message) =>
          message.id === messageId && message.senderId === currentUser.id,
      )
    )
      return;
    setConversationRecords((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId
                ? { ...m, isRecalled: true, text: 'Tin nhắn đã được thu hồi' }
                : m,
            ),
          };
        }
        return c;
      }),
    );
    showToast('Đã thu hồi tin nhắn đối với mọi người.', 'info');
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('Đã đánh dấu tất cả thông báo là đã đọc', 'info');
  };

  const unreadNotificationsCount = notifications.filter(
    (n) => !n.isRead,
  ).length;

  const openReportModal = (type: string, id: string, title: string) => {
    setReportTarget({ type, id, title });
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setReportTarget(null);
  };

  const openAuthModal = (
    mode: 'LOGIN' | 'REGISTER' | 'OTP' | 'SESSION_EXPIRED' = 'LOGIN',
  ) => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        loginWithCredentials,
        logout,
        currentUser,
        role,
        switchRole,
        updateCurrentUser,
        profilePhotoHistory,
        saveProfilePhoto,
        viewingUserId,
        setViewingUserId,
        getUserById,
        activeTab,
        setActiveTab,
        selectedSubject,
        setSelectedSubject,
        searchQuery,
        setSearchQuery,
        savedSearches,
        removeSavedSearch,
        clearAllSavedSearches,
        triggerSearch,
        isDarkMode,
        toggleDarkMode,
        posts,
        createPost,
        updatePost,
        toggleLikePost,
        addComment,
        deletePost,
        addLecturerNote,
        friendStatuses,
        setFriendStatuses,
        allUsers,
        friendsList,
        getFriendsOfUser,
        getMutualFriendsCount,
        sendFriendRequest,
        cancelFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        unfriendUser,
        followingIds,
        toggleFollowUser,
        dismissedSuggestionIds,
        dismissSuggestion,
        blockedUsers,
        blockedByOtherIds,
        blockUser,
        unblockUser,
        toggleSimulatedBlockedByOther,
        isBlockedByMe,
        isBlockingMe,
        isBlockedEitherWay,
        filterVisibleComments,
        questions,
        answerQuestion,
        rateQuestion,
        updateQuestion,
        applyAIQuestionRefine,
        sessions,
        createProposeSession,
        approveSession: (sessionId, selectedQuestionIds, note, autoPost) =>
          approveQuestionsBulk(
            sessionId,
            selectedQuestionIds,
            undefined,
            note,
            autoPost,
          ),
        rejectSession: (sessionId, selectedQuestionIds, reason) =>
          rejectQuestionsBulk(sessionId, selectedQuestionIds, reason),
        editQuestionByLecturer,
        approveQuestionsBulk,
        rejectQuestionsBulk,
        completeReviewSession,
        decideKeepQuestion,
        decideDiscardQuestion,
        apiLogs,
        addApiLog,
        clearApiLogs,
        exams,
        generateExam,
        minigames,
        submitGuess,
        leaderboard,
        cosmetics,
        equipCosmetic,
        unequipCosmetic,
        conversations,
        openChatDock,
        markConversationRead,
        closeChatDock,
        minimizeChatDock,
        restoreChatDock,
        activeDockIds,
        minimizedDockIds,
        sendMessage,
        recallMessage,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadNotificationsCount,
        activeQuizQuestion,
        setActiveQuizQuestion,
        activePostDetail,
        setActivePostDetail,
        activePostCommentFocus,
        activePostMediaIndex,
        openPostMedia,
        isCreatePostModalOpen,
        setIsCreatePostModalOpen,
        editingPostId,
        composerMediaKind,
        openPostComposer,
        closePostComposer,
        isProposeSessionModalOpen,
        setIsProposeSessionModalOpen,
        activeAIRefineQuestion,
        setActiveAIRefineQuestion,
        isExamWizardOpen,
        setIsExamWizardOpen,
        isExportQuestionsOpen,
        setIsExportQuestionsOpen,
        isReportModalOpen,
        reportTarget,
        openReportModal,
        closeReportModal,
        isApiReferenceOpen,
        setIsApiReferenceOpen,
        isTourGuideOpen,
        setIsTourGuideOpen,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        isOfflineSimulated,
        setIsOfflineSimulated,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
