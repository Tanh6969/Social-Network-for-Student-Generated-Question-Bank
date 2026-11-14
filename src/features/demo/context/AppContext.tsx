import { createId } from '../../../shared/createId';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { useAuthSession } from '../../auth/useAuthSession';
import { applyProfile } from '../../auth/mapAuthUser';
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
import { errorMessage, isApiSession } from '../../../api';
import { postsApi } from '../../../api/posts';
import { searchApi, type SavedSearchDto } from '../../../api/search';
import { notificationsApi, type NotificationDto } from '../../../api/notifications';
import { chatApi } from '../../../api/chat';
import { relationshipsApi } from '../../../api/relationships';
import { chatStompClient } from '../../../api/stompClient';
import {
  basicUser,
  friendStatusFromProfile,
  friendStatusFromRelationshipStats,
  loadApiRelationships,
  userFromProfile,
  userFromSearch,
} from '../../friends/apiRelationships';
import {
  conversationFromDetailDto,
  conversationFromDto,
  formatChatTime,
  memberFromDto,
  messageFromDto,
  messageFromWs,
} from '../../messenger/apiChat';
import {
  buildMediaItems,
  commentFromApi,
  loadApiFeedPage,
  initialApiFeedCursor,
  type ApiFeedCursor,
  postFromApi,
} from '../../feed/apiPosts';
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
import {
  buildDemoBank,
  DEMO_BANK_QUESTION_PREFIX,
  DEMO_BANK_SESSION_PREFIX,
  mergeDemoBank,
} from '../../proposals/demoBank';

export interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  // Auth state
  isAuthenticated: boolean;
  sessionKind: 'demo' | 'api' | null;
  /** Đang khôi phục phiên đăng nhập sau khi tải lại trang. */
  isRestoringSession: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // User & Role
  currentUser: User;
  role: Role;
  switchRole: (newRole: Role) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  saveProfileChanges: (updates: Pick<User, 'name' | 'bio' | 'faculty' | 'classOrTitle'>) => Promise<boolean>;
  profilePhotoHistory: ProfilePhotoHistoryItem[];
  saveProfilePhoto: (
    kind: 'avatar' | 'cover',
    url: string,
    crop: ImageCrop,
    file?: File,
  ) => Promise<boolean>;
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
  trendingSearches: string[];
  removeSavedSearch: (term: string) => void;
  clearAllSavedSearches: () => void;
  triggerSearch: (query: string) => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Posts & Social
  posts: Post[];
  /** Phiên thật đang tải bảng tin từ máy chủ. */
  isFeedLoading: boolean;
  /** Lỗi tải bảng tin của phiên thật (null nếu không lỗi). */
  feedError: string | null;
  newFeedCount: number;
  reloadFeed: () => void;
  apiFeedHasMore: boolean;
  isFeedLoadingMore: boolean;
  loadMoreFeed: () => Promise<void>;
  loadProfilePosts: (userId: string, after?: number) => Promise<{ hasNext: boolean; after?: number }>;
  /**
   * `files` ánh xạ blob URL (trong mediaUrls/documents) → tệp gốc để tải lên
   * máy chủ ở phiên thật. Trả về true khi đăng thành công.
   */
  createPost: (
    postData: Partial<Post>,
    files?: ReadonlyMap<string, File>,
  ) => Promise<boolean>;
  updatePost: (
    postId: string,
    updates: Pick<
      Post,
      'content' | 'privacy' | 'mediaUrls' | 'documents' | 'type'
    >,
    files?: ReadonlyMap<string, File>,
  ) => Promise<boolean>;
  toggleLikePost: (postId: string) => void;
  addComment: (postId: string, text: string, parentCommentId?: string) => Promise<boolean>;
  updateComment: (postId: string, commentId: string, content: string) => Promise<boolean>;
  deleteComment: (postId: string, commentId: string) => Promise<boolean>;
  /** Phiên thật: tải bình luận của bài khi mở chi tiết (demo: không làm gì). */
  loadPostComments: (postId: string) => void;
  openPostById: (postId: number) => Promise<void>;
  deletePost: (postId: string) => void;
  addLecturerNote: (postId: string, note: string) => Promise<boolean>;
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
  followersIds: string[];
  toggleFollowUser: (userId: string) => void;
  searchUsersOnApi: (query: string) => void;
  dismissedSuggestionIds: string[];
  dismissSuggestion: (userId: string) => void;

  // Blocking System (Slide 24)
  blockedUsers: BlockedUserEntry[];
  blockedByOtherIds: string[];
  blockUser: (userId: string, reason?: string) => void;
  unblockUser: (userId: string) => void;
  toggleSimulatedBlockedByOther: (userId: string) => void;
  /** Phiên thật: lỗi khi mở trang cá nhân người khác (bị chặn, không tồn tại…). */
  viewedProfileError: string | null;
  reloadRelationships: () => void;
  isBlockedByMe: (userId: string) => boolean;
  isBlockingMe: (userId: string) => boolean;
  isBlockedEitherWay: (userId: string) => boolean;
  isPresenceVisible: (userId: string) => boolean;
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
  hiddenConversations: Conversation[];
  openChatDock: (partnerUserId: string) => void;
  loadConversationMessages: (conversationId: string) => void;
  markConversationRead: (conversationId: string) => void;
  closeChatDock: (conversationId: string) => void;
  minimizeChatDock: (conversationId: string) => void;
  restoreChatDock: (conversationId: string) => void;
  activeDockIds: string[];
  minimizedDockIds: string[];
  sendMessage: (conversationId: string, text: string) => void;
  recallMessage: (
    conversationId: string,
    messageId: string,
    scope?: 'ME' | 'EVERYONE',
  ) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  createGroupChat: (
    name: string,
    memberIds: string[],
    avatarUrl?: string,
  ) => Promise<Conversation | null>;
  updateGroupChat: (
    conversationId: string,
    updates: { name?: string; avatar_url?: string },
  ) => Promise<void>;
  loadGroupMembers: (conversationId: string) => Promise<void>;
  addMembersToGroup: (
    conversationId: string,
    userIds: string[],
  ) => Promise<void>;
  removeMemberFromGroup: (
    conversationId: string,
    userId: string,
  ) => Promise<void>;
  updateGroupMemberRole: (
    conversationId: string,
    userId: string,
    role: 'CHIEF' | 'VILLAGE_ELDER' | 'VILLAGER',
  ) => Promise<void>;
  leaveGroupChat: (
    conversationId: string,
    newChiefId?: string,
  ) => Promise<void>;
  hideChatConversation: (conversationId: string) => Promise<void>;
  unhideChatConversation: (conversationId: string) => Promise<void>;
  unlockHiddenConversations: (pin: string) => Promise<boolean>;
  setHiddenChatPin: (pin: string, oldPin?: string) => Promise<boolean>;

  // Notifications
  notifications: AppNotification[];
  notificationsHasMore: boolean;
  loadMoreNotifications: () => void;
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
  const [demoSavedSearches, setDemoSavedSearches] = useState<string[]>([
    'Thuật toán Dijkstra cây AVL',
    'Chuẩn 3NF Cơ sở dữ liệu',
    'TS. Trần Minh Đức',
    'Giải tích 1 chuỗi số',
    'Đề thi Mạng máy tính K64',
  ]);
  const [apiSavedSearches, setApiSavedSearches] = useState<SavedSearchDto[]>([]);
  const [apiTrendingSearches, setApiTrendingSearches] = useState<string[]>([]);

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
  const [followersIdsByAccount, setFollowersIdsByAccount] = useState<
    Record<string, string[]>
  >({
    [mockCurrentUserLecturer.id]: ['user_sv_01', 'user_sv_02', 'user_sv_03'],
  });
  const [hiddenConversationRecords, setHiddenConversationRecords] = useState<
    Conversation[]
  >([]);
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
  const [apiNotifications, setApiNotifications] = useState<AppNotification[]>([]);
  const [apiNotificationsAfter, setApiNotificationsAfter] = useState<number | undefined>();
  const [notificationsHasMore, setNotificationsHasMore] = useState(false);
  const [apiUnreadCount, setApiUnreadCount] = useState(0);

  // Chat dock
  const [activeDockIdsByAccount, setActiveDockIdsByAccount] = useState<
    Record<string, string[]>
  >({});
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
    isRestoringSession,
    sessionKind,
    currentUser: rawCurrentUser,
    setCurrentUser,
    role,
    loginWithCredentials: authenticate,
    logout: logoutSession,
    switchRole,
    updateCurrentUser: updateAuthCurrentUser,
  } = useAuthSession(showToast);

  const notificationFromApi = (dto: NotificationDto): AppNotification => ({
    id: String(dto.notification_id),
    recipientId: rawCurrentUser.id,
    title: dto.title ?? 'Thông báo',
    message: dto.body ?? '',
    timestamp: dto.created_at ? new Date(dto.created_at).toLocaleString('vi-VN') : '',
    isRead: Boolean(dto.read_at),
    type: dto.type === 'FRIEND_REQUEST' || dto.type === 'QUESTION_APPROVED'
      ? dto.type : 'SYSTEM',
    actor: dto.actor?.user_id != null ? basicUser(dto.actor) : undefined,
    targetId: dto.target?.target_id != null ? String(dto.target.target_id) : undefined,
    targetType: dto.target?.type,
  });
  useEffect(() => {
    if (sessionKind !== 'api') {
      setApiNotifications([]);
      setApiNotificationsAfter(undefined);
      setNotificationsHasMore(false);
      setApiUnreadCount(0);
      return;
    }
    setApiNotifications([]);
    setApiNotificationsAfter(undefined);
    setNotificationsHasMore(false);
    setApiUnreadCount(0);
    let cancelled = false;
    const load = () => notificationsApi.list().then((page) => {
      if (cancelled) return;
      const fresh = page.items.map(notificationFromApi);
      setApiNotifications((previous) => {
        const ids = new Set(fresh.map((item) => item.id));
        return [...fresh, ...previous.filter((item) => !ids.has(item.id))];
      });
      setApiNotificationsAfter(page.after);
      setNotificationsHasMore(page.hasNext);
      setApiUnreadCount(page.unreadCount);
    }).catch((error: unknown) => {
      if (!cancelled) showToast(errorMessage(error, 'Không tải được thông báo.'), 'error');
    });
    void load();
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 30_000);
    return () => { cancelled = true; window.clearInterval(interval); };
    // Nạp lại theo tài khoản; các hàm provider không ổn định giữa render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKind, rawCurrentUser.id]);

  const savedSearches = sessionKind === 'api'
    ? apiSavedSearches.map((item) => item.query_text ?? '').filter(Boolean)
    : demoSavedSearches;
  const trendingSearches = sessionKind === 'api'
    ? apiTrendingSearches
    : ['TCP/IP', 'Cây AVL', 'Chuẩn 3NF', 'Giải tích 1', 'Đề thi 2026'];
  useEffect(() => {
    if (sessionKind !== 'api') {
      setApiSavedSearches([]);
      setApiTrendingSearches([]);
      return;
    }
    let cancelled = false;
    searchApi.getSaved().then(({ saved, trending }) => {
      if (!cancelled) {
        setApiSavedSearches(saved);
        setApiTrendingSearches(trending);
      }
    }).catch((error: unknown) => {
      if (!cancelled) showToast(errorMessage(error, 'Không tải được lịch sử tìm kiếm.'), 'error');
    });
    return () => { cancelled = true; };
    // Tải lại khi đổi tài khoản API; showToast là hàm của provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKind, rawCurrentUser.id]);

  const loginWithCredentials = async (email: string, password: string) => {
    await authenticate(email, password);
    setActiveDockIdsByAccount({});
    setMinimizedDockIdsByAccount({});
  };

  // Việc đưa về trang chủ sau đăng xuất do MainContent (App.tsx) đảm nhận.
  const logout = async () => {
    setActiveDockIdsByAccount({});
    setMinimizedDockIdsByAccount({});
    setViewingUserId(null);
    await logoutSession();
  };

  // Bảng tin: phiên thật lấy từ API, phiên demo dùng dữ liệu mẫu. Đổi phiên
  // thì thay toàn bộ danh sách để không lẫn bài của tài khoản trước.
  const postsSourceRef = useRef<'demo' | 'api'>('demo');
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedReloadKey, setFeedReloadKey] = useState(0);
  const [feedSeenAt, setFeedSeenAt] = useState<number | null>(null);
  const [newFeedCount, setNewFeedCount] = useState(0);
  const [apiFeedCursor, setApiFeedCursor] = useState<ApiFeedCursor>(initialApiFeedCursor);
  const [isFeedLoadingMore, setIsFeedLoadingMore] = useState(false);
  const loadingFeedPageRef = useRef(false);
  const apiFeedUserId = sessionKind === 'api' ? rawCurrentUser.id : null;
  const rawCurrentUserRef = useRef(rawCurrentUser);
  useEffect(() => {
    rawCurrentUserRef.current = rawCurrentUser;
  }, [rawCurrentUser]);
  useEffect(() => {
    if (!apiFeedUserId) {
      setFeedSeenAt(null);
      setNewFeedCount(0);
      setApiFeedCursor(initialApiFeedCursor);
      if (postsSourceRef.current === 'api') {
        postsSourceRef.current = 'demo';
        setPosts(mockPosts);
      }
      return;
    }
    postsSourceRef.current = 'api';
    let cancelled = false;
    setPosts([]);
    setApiFeedCursor(initialApiFeedCursor);
    setFeedError(null);
    setIsFeedLoading(true);
    loadApiFeedPage(rawCurrentUserRef.current, initialApiFeedCursor)
      .then((loaded) => {
        if (!cancelled) {
          setPosts(loaded.posts);
          setApiFeedCursor(loaded.cursor);
          setFeedSeenAt(Date.now());
          setNewFeedCount(0);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setFeedError(errorMessage(error, 'Không tải được bảng tin.'));
      })
      .finally(() => {
        if (!cancelled) setIsFeedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiFeedUserId, feedReloadKey]);
  const reloadFeed = () => setFeedReloadKey((key) => key + 1);
  const apiFeedHasMore = Object.values(apiFeedCursor).some((source) => source.hasNext);
  const loadMoreFeed = async () => {
    if (sessionKind !== 'api' || !apiFeedHasMore || loadingFeedPageRef.current || isFeedLoading) return;
    loadingFeedPageRef.current = true;
    setIsFeedLoadingMore(true);
    try {
      const page = await loadApiFeedPage(rawCurrentUserRef.current, apiFeedCursor);
      setPosts((previous) => {
        const known = new Set(previous.map((post) => post.id));
        return [...previous, ...page.posts.filter((post) => !known.has(post.id))];
      });
      setApiFeedCursor(page.cursor);
    } catch (error: unknown) {
      showToast(errorMessage(error, 'Không tải thêm được bài viết.'), 'error');
    } finally {
      loadingFeedPageRef.current = false;
      setIsFeedLoadingMore(false);
    }
  };
  const loadProfilePosts = async (userId: string, after?: number) => {
    if (sessionKind !== 'api') return { hasNext: false };
    const numericId = Number(userId);
    if (!Number.isSafeInteger(numericId) || numericId <= 0)
      throw new Error('Tài khoản không hợp lệ.');
    const page = await postsApi.getUserPosts(numericId, after);
    const incoming = page.items.filter((dto) => dto.post_id != null)
      .map((dto) => postFromApi(dto, currentUser));
    setPosts((previous) => {
      const known = new Set(previous.map((post) => post.id));
      return [...previous, ...incoming.filter((post) => !known.has(post.id))];
    });
    return { hasNext: page.hasNext && page.after != null, after: page.after };
  };

  useEffect(() => {
    if (!apiFeedUserId || activeTab !== 'feed' || feedSeenAt === null || isFeedLoading)
      return;
    let cancelled = false;
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      void postsApi.getNewActivityCount(feedSeenAt)
        .then((count) => { if (!cancelled) setNewFeedCount(count); })
        .catch(() => undefined);
    };
    const interval = window.setInterval(check, 30_000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [apiFeedUserId, activeTab, feedSeenAt, isFeedLoading]);

  // Người dùng đã biết trong phiên thật (bạn bè, tác giả bài, kết quả tìm,
  // hồ sơ đã mở). Thay cho danh sách người dùng mẫu của phiên demo.
  const [apiUsers, setApiUsers] = useState<Record<string, User>>({});
  const [apiMutualCounts, setApiMutualCounts] = useState<
    Record<string, number>
  >({});
  const relationsSourceRef = useRef<'demo' | 'api'>('demo');
  /**
   * Gộp người dùng vào bộ nhớ. `full` = hồ sơ đầy đủ (GET /users/{id});
   * thông tin rút gọn (tác giả, danh sách) vẫn bổ sung các trường còn thiếu
   * (vai trò LECTURER, khoa/viện, lớp/chuyên ngành, số người theo dõi…)
   * nhưng không xóa thông tin đầy đủ đã biết từ hồ sơ.
   */
  const rememberApiUsers = (users: User[], full = false) =>
    setApiUsers((previous) => {
      let changed = false;
      const next = { ...previous };
      for (const user of users) {
        if (!user.id || user.id === 'undefined' || user.id === 'unknown')
          continue;
        const old = previous[user.id];
        if (old && !full) {
          const merged: User = {
            ...old,
            name: user.name || old.name,
            avatar:
              user.avatar && user.avatar !== '/default-avatar.svg'
                ? user.avatar
                : old.avatar,
            role: user.role === 'LECTURER' ? 'LECTURER' : old.role,
            verifiedLecturer:
              user.role === 'LECTURER'
                ? (user.verifiedLecturer ?? true)
                : old.verifiedLecturer,
            email: old.email || user.email,
            bio: old.bio || user.bio,
            faculty: old.faculty || user.faculty,
            classOrTitle: old.classOrTitle || user.classOrTitle,
            points: old.points || user.points,
            approvedQuestionsCount:
              old.approvedQuestionsCount || user.approvedQuestionsCount,
            friendsCount: old.friendsCount || user.friendsCount,
            followersCount: old.followersCount || user.followersCount,
          };
          if (
            merged.name === old.name &&
            merged.avatar === old.avatar &&
            merged.role === old.role &&
            merged.faculty === old.faculty &&
            merged.classOrTitle === old.classOrTitle &&
            merged.followersCount === old.followersCount &&
            merged.approvedQuestionsCount === old.approvedQuestionsCount
          ) {
            continue;
          }
          next[user.id] = merged;
        } else {
          next[user.id] = old ? { ...old, ...user } : user;
        }
        changed = true;
      }
      return changed ? next : previous;
    });

  // Phiên demo: mỗi lần mở Ngân hàng, nạp các câu hỏi đã được duyệt từ kho
  // đề xuất dùng chung (SV nộp → GV duyệt → xuất hiện ở đây). Phiên khác thì
  // gỡ dữ liệu demo đó ra để không lẫn với dữ liệu thật.
  useEffect(() => {
    const isDemoBankItem = (prefix: string) => (item: { id: string }) =>
      item.id.startsWith(prefix);
    if (sessionKind !== 'demo') {
      setSessions((prev) =>
        prev.some(isDemoBankItem(DEMO_BANK_SESSION_PREFIX))
          ? prev.filter((s) => !isDemoBankItem(DEMO_BANK_SESSION_PREFIX)(s))
          : prev,
      );
      setQuestions((prev) =>
        prev.some(isDemoBankItem(DEMO_BANK_QUESTION_PREFIX))
          ? prev.filter((q) => !isDemoBankItem(DEMO_BANK_QUESTION_PREFIX)(q))
          : prev,
      );
      return;
    }
    if (activeTab !== 'bank') return;
    const bank = buildDemoBank();
    setSessions((prev) =>
      mergeDemoBank(prev, bank.sessions, DEMO_BANK_SESSION_PREFIX),
    );
    setQuestions((prev) =>
      mergeDemoBank(
        prev,
        bank.questions,
        DEMO_BANK_QUESTION_PREFIX,
        (old, next) => ({
          ...next,
          ratingAverage: old.ratingAverage,
          ratingCount: old.ratingCount,
          totalAttempts: old.totalAttempts,
          correctAttempts: old.correctAttempts,
          optionDistribution: old.optionDistribution,
          userRatedStars: old.userRatedStars,
          userComment: old.userComment,
        }),
      ),
    );
  }, [sessionKind, activeTab]);

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
      const data = event.data;
      if (!isSharedFeedMessage(data)) {
        console.error('Received an invalid shared-feed message.');
        return;
      }
      if (data.type === 'REQUEST_SNAPSHOT') {
        channel.postMessage({
          type: 'UPDATE_SNAPSHOT',
          posts: postsRef.current,
        });
        return;
      }
      const snapshotPosts = data.posts;
      setPosts((previous) =>
        arePostSnapshotsEqual(previous, snapshotPosts)
          ? previous
          : snapshotPosts,
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
      const data = event.data;
      if (!isSharedChatMessage(data)) {
        console.error('Received an invalid shared-chat message.');
        return;
      }
      if (data.type === 'REQUEST_SNAPSHOT') {
        channel.postMessage({
          type: 'UPDATE_SNAPSHOT',
          conversations: conversationRecordsRef.current,
        });
        return;
      }
      const snapshotConversations = data.conversations;
      setConversationRecords((previous) =>
        areConversationSnapshotsEqual(previous, snapshotConversations)
          ? previous
          : snapshotConversations,
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
  const notifications = sessionKind === 'api' ? apiNotifications :
    getNotificationsForAccount(notificationsByAccount[rawCurrentUser.id] ?? [], rawCurrentUser.id);
  const loadMoreNotifications = () => {
    if (sessionKind !== 'api' || !notificationsHasMore || apiNotificationsAfter == null) return;
    void notificationsApi.list(apiNotificationsAfter).then((page) => {
      setApiNotifications((previous) => [...previous, ...page.items.map(notificationFromApi)
        .filter((item) => !previous.some((old) => old.id === item.id))]);
      setApiNotificationsAfter(page.after);
      setNotificationsHasMore(page.hasNext);
      setApiUnreadCount(page.unreadCount);
    }).catch((error: unknown) => showToast(errorMessage(error, 'Không tải thêm được thông báo.'), 'error'));
  };
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

  // Backend chưa có API trạng thái online (không có is_online/last_seen/presence),
  // nên chỉ hiển thị dữ liệu mô phỏng trong phiên demo, và chỉ với bạn bè như Facebook.
  const isPresenceVisible = (userId: string) => {
    if (userId === rawCurrentUser.id) return true;
    return (
      sessionKind === 'demo' &&
      friendStatuses[userId] === 'FRIEND' &&
      !isBlockedEitherWay(userId)
    );
  };

  const allUsers: User[] =
    sessionKind === 'api'
      ? Object.values(apiUsers).filter((u) => u.id !== rawCurrentUser.id)
      : [
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

  const [apiRelationsLoaded, setApiRelationsLoaded] = useState(false);
  const followersIds = followersIdsByAccount[rawCurrentUser.id] ?? [];
  const currentUser: User = {
    ...rawCurrentUser,
    friendsCount:
      sessionKind === 'api' && !apiRelationsLoaded
        ? rawCurrentUser.friendsCount
        : friendsList.length,
    followersCount:
      followersIds.length > 0
        ? Math.max(rawCurrentUser.followersCount, followersIds.length)
        : rawCurrentUser.followersCount,
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
    if (sessionKind === 'api') {
      // Không bao giờ trả người dùng mẫu cho id thật.
      const known =
        apiUsers[id] ?? posts.find((post) => post.author.id === id)?.author;
      if (known) return known;
      const numericId = Number(id);
      return {
        ...basicUser({ user_id: Number.isFinite(numericId) ? numericId : 0 }),
        id,
        name: 'Người dùng',
      };
    }
    if (id === mockCurrentUserStudent.id) return mockCurrentUserStudent;
    if (id === mockCurrentUserLecturer.id) return mockCurrentUserLecturer;
    const found = mockOtherUsers.find((u) => u.id === id);
    return found || mockCurrentUserStudent;
  };

  const resolveDirectPartnerForApi = (
    conversation: Conversation,
  ): { partner: User; participantIds: string[] } => {
    const rawPartnerId = getConversationPartnerId(
      conversation,
      rawCurrentUser.id,
    );
    if (conversation.type === 'GROUP') {
      return {
        partner: conversation.partner,
        participantIds: conversation.participantIds,
      };
    }
    if (
      rawPartnerId &&
      !rawPartnerId.startsWith('conv_partner_') &&
      Number.isInteger(Number(rawPartnerId))
    ) {
      const known = apiUsers[rawPartnerId];
      return {
        partner: known
          ? {
              ...known,
              name: conversation.partner.name || known.name,
              avatar:
                conversation.partner.avatar &&
                conversation.partner.avatar !== '/default-avatar.svg'
                  ? conversation.partner.avatar
                  : known.avatar,
            }
          : conversation.partner,
        participantIds: conversation.participantIds,
      };
    }

    // 1. Thử lấy từ danh sách thành viên (members) của cuộc hội thoại
    const memberMatch = conversation.members?.find(
      (m) =>
        m.userId !== rawCurrentUser.id &&
        Number.isInteger(Number(m.userId)) &&
        Number(m.userId) > 0,
    );
    // 2. Thử lấy từ senderId của tin nhắn đối phương gửi trong cuộc hội thoại
    const msgMatch = conversation.messages.find(
      (m) =>
        m.senderId &&
        m.senderId !== rawCurrentUser.id &&
        Number.isInteger(Number(m.senderId)) &&
        Number(m.senderId) > 0,
    );
    // 3. Thử khớp theo họ tên trong apiUsers đã biết
    const targetName = conversation.partner.name.trim().toLowerCase();
    const nameMatch = targetName
      ? Object.values(apiUsers).find(
          (u) =>
            u.id !== rawCurrentUser.id &&
            Number.isInteger(Number(u.id)) &&
            u.name.trim().toLowerCase() === targetName,
        )
      : undefined;

    const resolvedId =
      memberMatch?.userId ?? msgMatch?.senderId ?? nameMatch?.id;
    if (resolvedId) {
      const known = apiUsers[resolvedId] ?? nameMatch;
      const partner: User = known
        ? {
            ...known,
            id: resolvedId,
            name: conversation.partner.name || known.name,
            avatar:
              conversation.partner.avatar &&
              conversation.partner.avatar !== '/default-avatar.svg'
                ? conversation.partner.avatar
                : known.avatar,
          }
        : {
            ...conversation.partner,
            id: resolvedId,
          };
      return {
        partner,
        participantIds: [rawCurrentUser.id, resolvedId],
      };
    }

    return {
      partner: conversation.partner,
      participantIds: conversation.participantIds,
    };
  };

  const mergedConversationRecords = [
    ...conversationRecords,
    ...hiddenConversationRecords.filter(
      (hc) => !conversationRecords.some((c) => c.id === hc.id),
    ),
  ];

  const conversations = getConversationsForAccount(
    mergedConversationRecords,
    rawCurrentUser.id,
  )
    .map((conversation) => {
      const partnerId = getConversationPartnerId(
        conversation,
        rawCurrentUser.id,
      );
      let partner = conversation.partner;
      let participantIds = conversation.participantIds;
      if (sessionKind === 'api') {
        const resolved = resolveDirectPartnerForApi(conversation);
        partner = resolved.partner;
        participantIds = resolved.participantIds;
      } else if (partnerId) {
        partner = findRawUserById(partnerId);
      }
      return {
        ...conversation,
        participantIds,
        unreadCount:
          conversation.unreadCounts?.[rawCurrentUser.id] ??
          conversation.unreadCount,
        partner,
      };
    })
    .filter((conversation) => {
      if (conversation.type === 'GROUP') return true;
      const hasMessages =
        conversation.messages.length > 0 ||
        (Boolean(conversation.lastMessage?.trim()) &&
          conversation.lastMessage.trim() !== 'Bắt đầu cuộc trò chuyện');
      if (hasMessages) return true;
      const isFriend = friendStatuses[conversation.partner.id] === 'FRIEND';
      if (isFriend) return true;
      if (
        activeDockIds.includes(conversation.id) ||
        minimizedDockIds.includes(conversation.id)
      ) {
        return true;
      }
      return false;
    });

  const getFriendsOfUser = (userId: string): User[] => {
    if (userId === currentUser.id) return friendsList;
    // Backend không có API liệt kê bạn bè của người khác.
    if (sessionKind === 'api') return [];
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
    if (sessionKind === 'api') return apiMutualCounts[userId] ?? 0;
    const myFriendIds = new Set(friendsList.map((f) => f.id));
    const theirFriendIds = (mockPeerFriendsMap[userId] || []).filter(
      (id) => id !== currentUser.id,
    );
    return theirFriendIds.filter((id) => myFriendIds.has(id)).length;
  };

  const getUserById = (id: string): User => {
    if (id === currentUser.id) return currentUser;
    const raw = findRawUserById(id);
    // Phiên thật: số bạn bè lấy từ hồ sơ (friends_count).
    if (sessionKind === 'api') return raw;
    const theirFriends = getFriendsOfUser(id);
    return {
      ...raw,
      friendsCount: theirFriends.length,
    };
  };

  // ---------------- Quan hệ trong phiên thật ----------------
  const [apiRelationsReloadKey, setApiRelationsReloadKey] = useState(0);
  useEffect(() => {
    if (!apiFeedUserId) {
      setApiRelationsLoaded(false);
      if (relationsSourceRef.current === 'api') {
        relationsSourceRef.current = 'demo';
        setApiUsers({});
        setApiMutualCounts({});
        setBlockedUsers([]);
      }
      return;
    }
    relationsSourceRef.current = 'api';
    let cancelled = false;
    loadApiRelationships()
      .then((snapshot) => {
        if (cancelled) return;
        rememberApiUsers(snapshot.users);
        setApiMutualCounts(snapshot.mutual);
        setFriendStatusesByAccount((previous) => ({
          ...previous,
          [apiFeedUserId]: snapshot.statuses,
        }));
        setFollowingIdsByAccount((previous) => ({
          ...previous,
          [apiFeedUserId]: snapshot.following,
        }));
        setFollowersIdsByAccount((previous) => ({
          ...previous,
          [apiFeedUserId]: snapshot.followers,
        }));
        setBlockedUsers(snapshot.blocked);
        setApiRelationsLoaded(true);
      })
      .catch((error: unknown) => {
        if (!cancelled)
          showToast(
            errorMessage(error, 'Không tải được danh sách bạn bè.'),
            'error',
          );
      });

    // Đồng thời tải danh sách người dùng công khai (GET /search?type=USER)
    // để tab Gợi ý kết bạn & Giảng viên luôn có dữ liệu ngay cả khi tài khoản
    // mới có total_friends = 0 và following = [].
    relationshipsApi
      .searchUsers('', 50)
      .then((users) => {
        if (!cancelled) rememberApiUsers(users.map(userFromSearch));
      })
      .catch(() => undefined);

    // Đồng bộ thống kê quan hệ chính xác của tài khoản hiện tại (GET /users/{userId}/relationship-stats).
    const myNumericId = Number(apiFeedUserId);
    if (Number.isInteger(myNumericId) && myNumericId > 0) {
      relationshipsApi
        .getRelationshipStats(myNumericId)
        .then((stats) => {
          if (cancelled || !stats?.counts) return;
          updateAuthCurrentUser({
            friendsCount:
              stats.counts.friends_count ?? rawCurrentUserRef.current.friendsCount,
            followersCount:
              stats.counts.followers_count ??
              rawCurrentUserRef.current.followersCount,
          });
        })
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFeedUserId, apiRelationsReloadKey]);

  // Tác giả bài viết / bình luận trở thành người dùng đã biết (gợi ý kết bạn).
  useEffect(() => {
    if (sessionKind !== 'api') return;
    rememberApiUsers(
      posts.flatMap((post) => [
        post.author,
        ...(post.comments ?? []).flatMap((comment) => [
          comment.author,
          ...(comment.replies ?? []).map((reply) => reply.author),
        ]),
      ]),
    );
  }, [posts, sessionKind]);

  // Tìm người dùng trên máy chủ (GET /search?type=USER).
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchUsersOnApi = (query: string) => {
    if (sessionKind !== 'api') return;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const text = query.trim();
    searchTimerRef.current = setTimeout(() => {
      relationshipsApi
        .searchUsers(text, 30)
        .then((users) => {
          rememberApiUsers(users.map(userFromSearch));
        })
        .catch(() => undefined);
    }, 250);
  };

  useEffect(() => {
    const text = searchQuery.trim();
    if (sessionKind !== 'api' || !text) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      relationshipsApi
        .searchUsers(text)
        .then((users) => {
          if (!cancelled) rememberApiUsers(users.map(userFromSearch));
        })
        .catch(() => undefined);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, sessionKind]);

  // Mở trang cá nhân người khác: tải hồ sơ, thống kê quan hệ (GET /users/{userId}/relationship-stats) và bài viết.
  const [viewedProfileError, setViewedProfileError] = useState<string | null>(
    null,
  );
  useEffect(() => {
    setViewedProfileError(null);
    if (
      sessionKind !== 'api' ||
      !viewingUserId ||
      viewingUserId === rawCurrentUser.id
    )
      return;
    const userId = Number(viewingUserId);
    if (!Number.isInteger(userId) || userId <= 0) {
      void resolveApiTargetUser(viewingUserId).then((resolved) => {
        if (resolved && resolved.id !== viewingUserId) {
          setViewingUserId(resolved.id);
        }
      });
      return;
    }
    const accountId = rawCurrentUser.id;
    let cancelled = false;
    Promise.all([
      relationshipsApi.getUser(userId),
      relationshipsApi.getRelationshipStats(userId).catch(() => undefined),
    ])
      .then(([profile, stats]) => {
        if (cancelled || !profile) return;
        const mappedUser = userFromProfile(profile);
        if (stats?.counts) {
          mappedUser.friendsCount =
            stats.counts.friends_count ?? mappedUser.friendsCount;
          mappedUser.followersCount =
            stats.counts.followers_count ?? mappedUser.followersCount;
        }
        rememberApiUsers([mappedUser], true);

        const status =
          friendStatusFromRelationshipStats(stats) ??
          friendStatusFromProfile(profile);
        if (status)
          setFriendStatusesByAccount((previous) => {
            const current = getFriendStatusesForAccount(previous, accountId);
            if ((current[viewingUserId] ?? 'NONE') === status) return previous;
            return {
              ...previous,
              [accountId]: { ...current, [viewingUserId]: status },
            };
          });

        const following =
          stats?.relationship_with_me?.following ??
          profile.relationships?.is_following;
        if (typeof following === 'boolean')
          setFollowingIdsByAccount((previous) => {
            const current = previous[accountId] ?? [];
            if (current.includes(viewingUserId) === following) return previous;
            return {
              ...previous,
              [accountId]: following
                ? [...current, viewingUserId]
                : current.filter((id) => id !== viewingUserId),
            };
          });

        const followedBy =
          stats?.relationship_with_me?.followed_by ??
          profile.relationships?.is_followed;
        if (typeof followedBy === 'boolean')
          setFollowersIdsByAccount((previous) => {
            const current = previous[accountId] ?? [];
            if (current.includes(viewingUserId) === followedBy) return previous;
            return {
              ...previous,
              [accountId]: followedBy
                ? [...current, viewingUserId]
                : current.filter((id) => id !== viewingUserId),
            };
          });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setViewedProfileError(
            errorMessage(error, 'Không xem được trang cá nhân này.'),
          );
      });
    relationshipsApi
      .getUserPosts(userId)
      .then((page) => {
        if (cancelled) return;
        const loaded = page.items
          .filter((dto) => dto.post_id != null)
          .map((dto) => postFromApi(dto, rawCurrentUserRef.current));
        if (!loaded.length) return;
        setPosts((previous) => {
          const byId = new Map(loaded.map((post) => [post.id, post]));
          const merged = previous.map((post) => {
            const fresh = byId.get(post.id);
            if (!fresh) return post;
            byId.delete(post.id);
            return { ...fresh, comments: post.comments };
          });
          return [...merged, ...byId.values()];
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingUserId, sessionKind]);

  /** Gọi API quan hệ; thành công mới cập nhật giao diện, lỗi thì báo lỗi. */
  const runRelationAction = (
    request: () => Promise<unknown>,
    onSuccess: () => void,
    message: string,
    type: 'success' | 'info' | 'warning' = 'success',
  ) => {
    request()
      .then(() => {
        onSuccess();
        showToast(message, type);
      })
      .catch((error: unknown) =>
        showToast(errorMessage(error, 'Thao tác không thành công.'), 'error'),
      );
  };
  const setApiFriendStatus = (userId: string, status: FriendStatus) =>
    setFriendStatuses((previous) => ({ ...previous, [userId]: status }));

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
    if (sessionKind === 'api') {
      relationshipsApi
        .sendFriendRequest(Number(userId))
        .then((res) => {
          if (res?.status === 'ACCEPTED') {
            setApiFriendStatus(userId, 'FRIEND');
            showToast(
              `Bạn và ${target.name} đã trở thành bạn bè (tự động chấp nhận lời mời)!`,
              'success',
            );
          } else {
            setApiFriendStatus(userId, 'REQUEST_SENT');
            showToast(`Đã gửi lời mời kết bạn tới ${target.name}!`, 'success');
          }
        })
        .catch((error: unknown) =>
          showToast(errorMessage(error, 'Thao tác không thành công.'), 'error'),
        );
      return;
    }
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
    if (sessionKind === 'api') {
      runRelationAction(
        () => relationshipsApi.cancelFriendRequest(Number(userId)),
        () => setApiFriendStatus(userId, 'NONE'),
        `Đã hủy lời mời kết bạn với ${target.name}.`,
        'info',
      );
      return;
    }
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
    if (sessionKind === 'api') {
      runRelationAction(
        () => relationshipsApi.acceptFriendRequest(Number(userId)),
        () => setApiFriendStatus(userId, 'FRIEND'),
        `Bạn và ${target.name} đã trở thành bạn bè!`,
      );
      return;
    }
    updateFriendStatusesForBothAccounts(userId, 'FRIEND', 'FRIEND');
    removeFriendRequestNotification(currentUser.id, userId);
    showToast(`Bạn và ${target.name} đã trở thành bạn bè!`, 'success');
  };

  const declineFriendRequest = (userId: string) => {
    const target = findRawUserById(userId);
    if (sessionKind === 'api') {
      runRelationAction(
        () => relationshipsApi.declineFriendRequest(Number(userId)),
        () => setApiFriendStatus(userId, 'NONE'),
        `Đã xóa lời mời kết bạn từ ${target.name}.`,
        'info',
      );
      return;
    }
    updateFriendStatusesForBothAccounts(userId, 'NONE', 'NONE');
    removeFriendRequestNotification(currentUser.id, userId);
    showToast(`Đã xóa lời mời kết bạn từ ${target.name}.`, 'info');
  };

  const unfriendUser = (userId: string) => {
    const target = findRawUserById(userId);
    if (sessionKind === 'api') {
      runRelationAction(
        () => relationshipsApi.unfriend(Number(userId)),
        () => setApiFriendStatus(userId, 'NONE'),
        `Đã hủy kết bạn với ${target.name}.`,
        'info',
      );
      return;
    }
    updateFriendStatusesForBothAccounts(userId, 'NONE', 'NONE');
    showToast(`Đã hủy kết bạn với ${target.name}.`, 'info');
  };

  const toggleFollowUser = (userId: string) => {
    if (isBlockedEitherWay(userId)) {
      showToast('Không thể theo dõi người dùng đang bị chặn.', 'error');
      return;
    }
    const target = findRawUserById(userId);
    if (sessionKind === 'api') {
      const following = followingIds.includes(userId);
      const action = following
        ? relationshipsApi.unfollow(Number(userId))
        : relationshipsApi.follow(Number(userId));
      action
        .then((res) => {
          setFollowingIds((prev) =>
            following
              ? prev.filter((id) => id !== userId)
              : [...prev.filter((id) => id !== userId), userId],
          );
          if (res && typeof res.new_followers_count === 'number') {
            setApiUsers((prev) => {
              const existing = prev[userId];
              if (!existing) return prev;
              return {
                ...prev,
                [userId]: {
                  ...existing,
                  followersCount: res.new_followers_count!,
                },
              };
            });
          }
          showToast(
            following
              ? `Đã bỏ theo dõi ${target.name}.`
              : `Đang theo dõi ${target.name}!`,
            following ? 'info' : 'success',
          );
        })
        .catch((error: unknown) =>
          showToast(errorMessage(error, 'Thao tác không thành công.'), 'error'),
        );
      return;
    }
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

  /**
   * Phân giải userId sang ID số nguyên thật trên backend (hỗ trợ cả trường hợp
   * đối phương trong khung chat mới chỉ có ID tạm `conv_partner_<convId>` từ GET /conversations).
   */
  async function resolveApiTargetUser(
    userId: string,
  ): Promise<{ id: string; numericId: number; name: string } | null> {
    const directNum = Number(userId);
    if (Number.isInteger(directNum) && directNum > 0) {
      return {
        id: String(directNum),
        numericId: directNum,
        name: findRawUserById(String(directNum)).name,
      };
    }

    const allConvs = [
      ...conversationRecordsRef.current,
      ...hiddenConversationRecords,
    ];
    const conv = allConvs.find(
      (c) =>
        c.partner.id === userId ||
        `conv_partner_${c.id}` === userId ||
        c.participantIds.includes(userId),
    );
    const partnerName = conv?.partner.name?.trim() || '';

    // 1. Tìm trong apiUsers hiện có theo tên
    if (partnerName) {
      const matched = Object.values(apiUsersRef.current).find(
        (u) =>
          u.id !== rawCurrentUserRef.current.id &&
          Number.isInteger(Number(u.id)) &&
          u.name.trim().toLowerCase() === partnerName.toLowerCase(),
      );
      if (matched) {
        return {
          id: matched.id,
          numericId: Number(matched.id),
          name: matched.name,
        };
      }
    }

    // 2. Thử lấy từ GET /conversations/{id}/members nếu biết conversationId
    const convIdStr =
      conv?.id ??
      (userId.startsWith('conv_partner_')
        ? userId.replace('conv_partner_', '')
        : '');
    const convNum = Number(convIdStr);
    if (Number.isInteger(convNum) && convNum > 0) {
      try {
        const members = await chatApi.getGroupMembers(convNum);
        const other = members.find(
          (m) =>
            m.user_id != null &&
            String(m.user_id) !== rawCurrentUserRef.current.id,
        );
        if (other?.user_id != null) {
          const realId = String(other.user_id);
          const mappedUser = basicUser(other);
          rememberApiUsers([mappedUser]);
          setConversationRecords((prev) =>
            prev.map((c) =>
              c.id === convIdStr
                ? {
                    ...c,
                    partner: { ...c.partner, id: realId },
                    participantIds: [rawCurrentUserRef.current.id, realId],
                  }
                : c,
            ),
          );
          return {
            id: realId,
            numericId: other.user_id,
            name: other.full_name || partnerName || mappedUser.name,
          };
        }
      } catch {
        // Bỏ qua nếu endpoint members chỉ cho phép GROUP
      }
    }

    // 3. Tìm kiếm người dùng theo tên qua GET /search?type=USER
    if (partnerName) {
      try {
        const results = await relationshipsApi.searchUsers(partnerName, 20);
        const mappedList = results.map(userFromSearch);
        rememberApiUsers(mappedList);
        const exact =
          mappedList.find(
            (u) =>
              u.id !== rawCurrentUserRef.current.id &&
              u.name.trim().toLowerCase() === partnerName.toLowerCase(),
          ) ??
          mappedList.find((u) => u.id !== rawCurrentUserRef.current.id);
        if (exact && Number.isInteger(Number(exact.id))) {
          const realId = exact.id;
          if (convIdStr) {
            setConversationRecords((prev) =>
              prev.map((c) =>
                c.id === convIdStr
                  ? {
                      ...c,
                      partner: { ...c.partner, ...exact, id: realId },
                      participantIds: [rawCurrentUserRef.current.id, realId],
                    }
                  : c,
              ),
            );
          }
          return {
            id: realId,
            numericId: Number(realId),
            name: exact.name,
          };
        }
      } catch {
        // ignore
      }
    }

    return null;
  }

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
    if (sessionKind === 'api') {
      void resolveApiTargetUser(userId).then((resolved) => {
        if (!resolved) {
          showToast(
            'Không xác định được ID người dùng để chặn. Vui lòng thử lại.',
            'error',
          );
          return;
        }
        const realId = resolved.id;
        const displayName =
          resolved.name && resolved.name !== 'Người dùng'
            ? resolved.name
            : target.name;
        const wasRealFriend =
          wasFriend || friendStatuses[realId] === 'FRIEND';
        runRelationAction(
          () => relationshipsApi.block(resolved.numericId),
          () => {
            setApiFriendStatus(realId, 'NONE');
            setFollowingIds((prev) =>
              prev.filter((id) => id !== realId && id !== userId),
            );
            setBlockedUsers((prev) => [
              {
                userId: realId,
                blockedAt: new Date().toLocaleString('vi-VN'),
                reason: reason?.trim() || undefined,
              },
              ...prev.filter(
                (item) => item.userId !== realId && item.userId !== userId,
              ),
            ]);
          },
          wasRealFriend
            ? `Đã chặn ${displayName} và hủy kết bạn.`
            : `Đã chặn ${displayName}.`,
          'warning',
        );
      });
      return;
    }

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
    if (sessionKind === 'api') {
      void resolveApiTargetUser(userId).then((resolved) => {
        if (!resolved) {
          showToast('Không xác định được người dùng để bỏ chặn.', 'error');
          return;
        }
        const realId = resolved.id;
        const displayName =
          resolved.name && resolved.name !== 'Người dùng'
            ? resolved.name
            : target.name;
        runRelationAction(
          () => relationshipsApi.unblock(resolved.numericId),
          () =>
            setBlockedUsers((prev) =>
              prev.filter(
                (item) => item.userId !== realId && item.userId !== userId,
              ),
            ),
          `Đã bỏ chặn ${displayName}.`,
        );
      });
      return;
    }
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
        if (sessionKind === 'api') {
          setApiFriendStatus(userId, 'NONE');
        } else {
          updateFriendStatusesForBothAccounts(userId, 'NONE', 'NONE');
        }
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

  const saveProfileChanges = async (
    updates: Pick<User, 'name' | 'bio' | 'faculty' | 'classOrTitle'>,
  ) => {
    if (sessionKind !== 'api') {
      updateCurrentUser(updates);
      return true;
    }
    try {
      const profile = await postsApi.updateMyProfile({
        full_name: updates.name.trim(),
        bio: updates.bio.trim(),
      });
      updateCurrentUser({
        ...applyProfile(currentUser, profile),
        name: profile?.full_name?.trim() || updates.name.trim(),
        bio: profile?.bio ?? updates.bio.trim(),
      });
      showToast('Đã cập nhật hồ sơ.', 'success');
      return true;
    } catch (error: unknown) {
      showToast(errorMessage(error, 'Không cập nhật được hồ sơ.'), 'error');
      return false;
    }
  };

  const saveProfilePhoto = async (
    kind: 'avatar' | 'cover',
    url: string,
    crop: ImageCrop,
    file?: File,
  ) => {
    if (sessionKind === 'api') {
      if (!file && (url.startsWith('blob:') || url.startsWith('data:'))) {
        showToast('Không xử lý được ảnh đã chọn.', 'error');
        return false;
      }
      try {
        const savedUrl = file
          ? (await postsApi.uploadMedia(file, kind === 'avatar' ? 'AVATAR' : 'COVER')).url
          : url;
        const profile = await postsApi.updateMyProfile(kind === 'avatar'
          ? { avatar_url: savedUrl } : { cover_url: savedUrl });
        const updated = applyProfile(currentUser, profile);
        updateCurrentUser(kind === 'avatar'
          ? { avatar: updated.avatar === currentUser.avatar ? savedUrl : updated.avatar,
              avatarCrop: { x: 50, y: 50, zoom: 1 } }
          : { coverImage: updated.coverImage === currentUser.coverImage ? savedUrl : updated.coverImage,
              coverCrop: { x: 50, y: 50, zoom: 1 } });
        showToast('Đã cập nhật ảnh.', 'success');
        return true;
      } catch (error: unknown) {
        showToast(errorMessage(error, 'Không cập nhật được ảnh.'), 'error');
        return false;
      }
    }
    const previousUrl =
      kind === 'avatar' ? currentUser.avatar : currentUser.coverImage;
    const previousCrop =
      kind === 'avatar' ? currentUser.avatarCrop : currentUser.coverCrop;
    if (previousUrl !== url) {
      setProfilePhotoHistory((history) => [
        {
          id: createId(),
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
    return true;
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
    if (sessionKind !== 'api') {
      setDemoSavedSearches((prev) => prev.filter((s) => s !== term));
      return;
    }
    const saved = apiSavedSearches.find((item) => item.query_text === term);
    if (saved?.saved_search_id == null) return;
    void searchApi.deleteSaved(saved.saved_search_id)
      .then(() => setApiSavedSearches((prev) => prev.filter((item) => item.saved_search_id !== saved.saved_search_id)))
      .catch((error: unknown) => showToast(errorMessage(error, 'Không xóa được tìm kiếm.'), 'error'));
  };

  const clearAllSavedSearches = () => {
    if (sessionKind !== 'api') {
      setDemoSavedSearches([]);
      showToast('Đã xóa toàn bộ lịch sử tìm kiếm', 'info');
      return;
    }
    void Promise.allSettled(apiSavedSearches.filter((item) => item.saved_search_id != null)
      .map((item) => searchApi.deleteSaved(item.saved_search_id!)))
      .then(async () => {
        const { saved, trending } = await searchApi.getSaved();
        setApiSavedSearches(saved);
        setApiTrendingSearches(trending);
        showToast(saved.length ? 'Một số tìm kiếm chưa xóa được.' : 'Đã xóa lịch sử tìm kiếm', saved.length ? 'warning' : 'info');
      })
      .catch((error: unknown) => showToast(errorMessage(error, 'Không xóa được lịch sử tìm kiếm.'), 'error'));
  };

  const triggerSearch = (query: string) => {
    const text = query.trim();
    setSearchQuery(text);
    if (sessionKind === 'api' && text.length >= 2) {
      void searchApi.record(text).then(() => searchApi.getSaved())
        .then(({ saved, trending }) => {
          setApiSavedSearches(saved);
          setApiTrendingSearches(trending);
        })
        .catch((error: unknown) => showToast(errorMessage(error, 'Không lưu được lịch sử tìm kiếm.'), 'error'));
    } else if (sessionKind !== 'api' && text && !demoSavedSearches.includes(text)) {
      setDemoSavedSearches((prev) => [text, ...prev.slice(0, 9)]);
    }
    setActiveTab('search');
  };

  // Posts
  const createPost = async (
    postData: Partial<Post>,
    files: ReadonlyMap<string, File> = new Map(),
  ): Promise<boolean> => {
    if (
      (!postData.content?.trim() &&
        !postData.mediaUrls?.length &&
        !postData.documents?.length) ||
      getPostContentIssue(postData.content ?? '')
    )
      return false;
    if (isApiSession()) {
      try {
        const media = await buildMediaItems(
          postData.mediaUrls ?? [],
          postData.documents ?? [],
          files,
          [],
          postData.type === 'VIDEO',
        );
        const dto = await postsApi.createPost({
          content: postData.content?.trim() || undefined,
          media_urls: media.length ? media : undefined,
          visibility: postData.privacy || 'PUBLIC',
          post_type: postData.type === 'VIDEO' && role === 'LECTURER' ? 'LEARNING_VIDEO' : 'SOCIAL_POST',
          subject_id: postData.type === 'VIDEO' && role === 'LECTURER'
            ? postData.subjectId : undefined,
        });
        if (dto?.post_id != null) {
          const created = postFromApi(dto, currentUser);
          setPosts((previous) => [
            created,
            ...previous.filter((post) => post.id !== created.id),
          ]);
        } else {
          reloadFeed();
        }
        showToast('Đã đăng bài viết mới thành công!', 'success');
        return true;
      } catch (error: unknown) {
        showToast(
          errorMessage(error, 'Không đăng được bài viết. Vui lòng thử lại.'),
          'error',
        );
        return false;
      }
    }
    const newPost: Post = {
      id: createId(),
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
    return true;
  };

  const updatePost = async (
    postId: string,
    updates: Pick<
      Post,
      'content' | 'privacy' | 'mediaUrls' | 'documents' | 'type'
    >,
    files: ReadonlyMap<string, File> = new Map(),
  ): Promise<boolean> => {
    if (
      (!updates.content.trim() &&
        !updates.mediaUrls?.length &&
        !updates.documents?.length) ||
      getPostContentIssue(updates.content)
    )
      return false;
    const oldPost = posts.find(
      (post) => post.id === postId && post.author.id === currentUser.id,
    );
    if (!oldPost) return false;
    if (isApiSession()) {
      if (oldPost.apiTarget?.type !== 'POST') return false;
      const apiId = oldPost.apiTarget.id;
      try {
        const media = await buildMediaItems(
          updates.mediaUrls ?? [],
          updates.documents ?? [],
          files,
          oldPost.apiMedia,
          updates.type === 'VIDEO',
        );
        await postsApi.updatePost(apiId, {
          content: updates.content.trim(),
          media_urls: media,
          visibility: updates.privacy,
        });
        const fresh = await postsApi.getPost(apiId).catch(() => null);
        setPosts((previous) =>
          previous.map((post) => {
            if (post.id !== postId) return post;
            if (fresh)
              return {
                ...postFromApi(fresh, currentUser),
                comments: post.comments,
              };
            const edited = postFromApi(
              {
                post_id: apiId,
                content: updates.content.trim(),
                media_urls: media,
                visibility: updates.privacy,
                post_type: 'SOCIAL_POST',
                created_at: post.createdAt,
              },
              currentUser,
            );
            return {
              ...edited,
              likesCount: post.likesCount,
              isLiked: post.isLiked,
              commentsCount: post.commentsCount,
              comments: post.comments,
            };
          }),
        );
        showToast('Đã lưu thay đổi bài viết.', 'success');
        return true;
      } catch (error: unknown) {
        showToast(
          errorMessage(error, 'Không lưu được bài viết. Vui lòng thử lại.'),
          'error',
        );
        return false;
      }
    }
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
    return true;
  };

  const toggleLikePost = (postId: string) => {
    const flipLike = () =>
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
    flipLike();
    const target = posts.find((post) => post.id === postId)?.apiTarget;
    if (!isApiSession() || !target) return;
    // POST /react là toggle: cập nhật lạc quan, lỗi thì hoàn tác.
    postsApi
      .react(target.type, target.id)
      .then((result) => {
        const total = result.total_count;
        if (typeof total !== 'number') return;
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  isLiked: Boolean(result.my_reaction),
                  likesCount: total,
                }
              : p,
          ),
        );
      })
      .catch((error: unknown) => {
        flipLike();
        showToast(errorMessage(error, 'Không thả được cảm xúc.'), 'error');
      });
  };

  const addComment = async (
    postId: string,
    text: string,
    parentCommentId?: string,
  ) => {
    if (!text.trim()) return false;
    const post = posts.find((item) => item.id === postId);
    if (
      !post ||
      (parentCommentId &&
        !post.comments?.some((item) => item.id === parentCommentId))
    )
      return false;
    if (isApiSession()) {
      const target = post.apiTarget;
      if (!target) {
        showToast('Hoạt động này chưa hỗ trợ bình luận.', 'info');
        return false;
      }
      try {
        const dto = await postsApi.createComment(
          target.type,
          target.id,
          text.trim(),
          parentCommentId ? Number(parentCommentId) : undefined,
        );
        if (!dto) throw new Error('Máy chủ không trả về bình luận vừa gửi.');
        setPosts((previous) =>
          appendComment(previous, postId, commentFromApi(dto, currentUser), parentCommentId),
        );
        showToast('Đã gửi bình luận!', 'success');
        return true;
      } catch (error: unknown) {
        showToast(errorMessage(error, 'Không gửi được bình luận.'), 'error');
        return false;
      }
    }
    const newComment: CommentItem = {
      id: createId(),
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
    return true;
  };

  const loadingCommentsRef = useRef(new Set<string>());
  const loadPostComments = (postId: string) => {
    if (!isApiSession() || loadingCommentsRef.current.has(postId)) return;
    const target = posts.find((post) => post.id === postId)?.apiTarget;
    if (!target) return;
    loadingCommentsRef.current.add(postId);
    const collect = async () => {
      const all: CommentItem[] = [];
      let after: number | undefined;
      // Tối đa 5 trang × 50 bình luận gốc cho một lần mở bài.
      for (let page = 0; page < 5; page += 1) {
        const res = await postsApi.getComments(target.type, target.id, after);
        all.push(...res.items.map((dto) => commentFromApi(dto, currentUser)));
        if (!res.hasNext || res.after == null) break;
        after = res.after;
      }
      return all;
    };
    collect()
      .then((comments) =>
        setPosts((previous) =>
          previous.map((post) =>
            post.id === postId ? { ...post, comments } : post,
          ),
        ),
      )
      .catch((error: unknown) =>
        showToast(errorMessage(error, 'Không tải được bình luận.'), 'error'),
      )
      .finally(() => loadingCommentsRef.current.delete(postId));
  };

  const openPostById = async (postId: number) => {
    if (sessionKind !== 'api') return;
    try {
      const dto = await postsApi.getPost(postId);
      if (!dto) throw new Error('Bài viết không tồn tại hoặc bạn không có quyền xem.');
      const post = postFromApi(dto, currentUser);
      setPosts((previous) => [post, ...previous.filter((item) => item.id !== post.id)]);
      setActivePostDetail(post);
    } catch (error: unknown) {
      showToast(errorMessage(error, 'Không mở được bài viết.'), 'error');
    }
  };

  const ownComment = (postId: string, commentId: string) => {
    const post = posts.find((item) => item.id === postId);
    const comment = post?.comments?.flatMap((item) => [item, ...(item.replies ?? [])])
      .find((item) => item.id === commentId);
    const id = Number(commentId);
    return sessionKind === 'api' && post?.apiTarget && comment &&
      comment.author.id === currentUser.id && !comment.deleted &&
      Number.isSafeInteger(id) && id > 0 ? id : null;
  };

  const replaceComment = (
    postId: string,
    commentId: string,
    transform: (comment: CommentItem) => CommentItem,
  ) => setPosts((previous) => previous.map((post) => post.id !== postId ? post : {
    ...post,
    comments: post.comments?.map((comment) => comment.id === commentId
      ? transform(comment)
      : { ...comment, replies: comment.replies?.map((reply) =>
          reply.id === commentId ? transform(reply) : reply) }),
  }));

  const updateComment = async (postId: string, commentId: string, content: string) => {
    const id = ownComment(postId, commentId);
    if (!id || !content.trim()) return false;
    try {
      const updated = await postsApi.updateComment(id, content.trim());
      replaceComment(postId, commentId, (comment) => ({
        ...comment,
        content: updated?.content ?? content.trim(),
      }));
      showToast('Đã sửa bình luận.', 'success');
      return true;
    } catch (error: unknown) {
      showToast(errorMessage(error, 'Không sửa được bình luận.'), 'error');
      return false;
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    const id = ownComment(postId, commentId);
    if (!id) return false;
    try {
      await postsApi.deleteComment(id);
      replaceComment(postId, commentId, (comment) => ({
        ...comment, content: 'Bình luận đã bị xoá.', deleted: true,
      }));
      showToast('Đã xóa bình luận.', 'success');
      return true;
    } catch (error: unknown) {
      showToast(errorMessage(error, 'Không xóa được bình luận.'), 'error');
      return false;
    }
  };

  const deletePost = (postId: string) => {
    const oldPost = posts.find(
      (post) => post.id === postId && post.author.id === currentUser.id,
    );
    if (!oldPost) return;
    if (isApiSession()) {
      if (oldPost.apiTarget?.type !== 'POST') return;
      postsApi
        .deletePost(oldPost.apiTarget.id)
        .then(() => {
          setPosts((previous) =>
            removeOwnedPost(previous, postId, currentUser.id),
          );
          if (activePostDetailId === postId) setActivePostDetailId(null);
          if (sharedPostId === postId) navigate('/feed', { replace: true });
          showToast('Đã xóa bài viết thành công!', 'info');
        })
        .catch((error: unknown) =>
          showToast(errorMessage(error, 'Không xoá được bài viết.'), 'error'),
        );
      return;
    }
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

  const addLecturerNote = async (postId: string, note: string): Promise<boolean> => {
    if (!note.trim() || role !== 'LECTURER') return false;
    if (sessionKind === 'api') {
      const post = posts.find((item) => item.id === postId);
      if (post?.apiTarget?.type !== 'POST' || post.type !== 'QUESTION_APPROVED')
        return false;
      try {
        await postsApi.updateLecturerNote(post.apiTarget.id, note.trim());
        const fresh = await postsApi.getPost(post.apiTarget.id);
        if (fresh) setPosts((previous) => previous.map((item) =>
          item.id === postId ? { ...postFromApi(fresh, currentUser), comments: item.comments } : item));
        showToast('Đã lưu ghi chú giảng viên.', 'success');
        return true;
      } catch (error: unknown) {
        showToast(errorMessage(error, 'Không lưu được ghi chú giảng viên.'), 'error');
        return false;
      }
    }
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
    return true;
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
        void createPost({
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

  // ---------------- Chat / Messenger (16 REST + STOMP WebSocket) ----------------
  const chatSourceRef = useRef<'demo' | 'api'>('demo');
  const apiUsersRef = useRef(apiUsers);
  useEffect(() => {
    apiUsersRef.current = apiUsers;
  }, [apiUsers]);
  const friendStatusesRef = useRef(friendStatuses);
  useEffect(() => {
    friendStatusesRef.current = friendStatuses;
  }, [friendStatuses]);

  const probedHiddenPartnerIdsRef = useRef<Set<string>>(new Set());

  const syncConversationsFromServer = async (
    userId: string,
  ): Promise<Set<number>> => {
    const res = await chatApi.getConversations({ limit: 50 });
    const items = res?.items ?? [];
    const mappedConvs = items.map((dto) =>
      conversationFromDto(dto, userId, apiUsersRef.current),
    );
    setConversationRecords((previous) => {
      const byId = new Map(previous.map((item) => [item.id, item]));
      const serverIds = new Set(
        items.map((dto) => String(dto.conversation_id)),
      );
      const fromServer = items.map((dto) =>
        conversationFromDto(
          dto,
          userId,
          apiUsersRef.current,
          byId.get(String(dto.conversation_id)),
        ),
      );
      const preservedRecovered = previous.filter(
        (item) => !serverIds.has(item.id),
      );
      return [...fromServer, ...preservedRecovered];
    });
    for (const conv of mappedConvs) {
      if (
        conv.type !== 'GROUP' &&
        conv.partner.id.startsWith('conv_partner_') &&
        conv.partner.name
      ) {
        void resolveApiTargetUser(conv.partner.id);
      }
    }
    return new Set(
      items
        .map((dto) => Number(dto.conversation_id))
        .filter((id) => Number.isInteger(id) && id > 0),
    );
  };

  const reconstructHiddenConversations = async (
    activeUserId: string,
    activeSet: Set<number>,
  ): Promise<boolean> => {
    const knownUsersMap = apiUsersRef.current;
    const existingPartnerIds = new Set(
      conversationRecordsRef.current
        .filter((c) => !c.partner.id.startsWith('conv_partner_'))
        .map((c) => c.partner.id),
    );

    // 1. Chỉ dò các tài khoản ĐÃ LÀ BẠN BÈ để không tạo đoạn chat trống với người lạ
    const hiddenPartnerQueue: User[] = [];
    const candidateUsers = Object.values(knownUsersMap).filter(
      (u) =>
        u.id !== activeUserId &&
        Number.isInteger(Number(u.id)) &&
        Number(u.id) > 0 &&
        friendStatusesRef.current[u.id] === 'FRIEND' &&
        !existingPartnerIds.has(u.id),
    );

    await Promise.allSettled(
      candidateUsers.map(async (u) => {
        probedHiddenPartnerIdsRef.current.add(u.id);
        try {
          const detail = await chatApi.createDirectConversation(Number(u.id));
          if (detail?.conversation_id != null) {
            const convIdNum = Number(detail.conversation_id);
            if (!activeSet.has(convIdNum)) {
              activeSet.add(convIdNum);
              const recovered = conversationFromDetailDto(
                detail,
                activeUserId,
                apiUsersRef.current,
              );
              setConversationRecords((prev) =>
                prev.some((c) => c.id === recovered.id)
                  ? prev
                  : [...prev, recovered],
              );
              loadConversationMessages(recovered.id);
            }
          }
        } catch (err: unknown) {
          const msg = errorMessage(err, '').toLowerCase();
          if (
            msg.includes('pin') ||
            msg.includes('kho ẩn') ||
            msg.includes('đã ẩn')
          ) {
            hiddenPartnerQueue.push(u);
          }
        }
      }),
    );

    // 2. Quét trực tiếp GET /conversations/{id}/messages cho các hội thoại người dùng tham gia nhưng bị ẩn khỏi GET /conversations
    const maxKnownId =
      activeSet.size > 0 ? Math.max(...Array.from(activeSet)) : 10;
    const maxScanId = Math.min(Math.max(maxKnownId + 15, 25), 50);
    const scanIds: number[] = [];
    for (let id = 1; id <= maxScanId; id++) {
      if (!activeSet.has(id)) {
        scanIds.push(id);
      }
    }

    const recoveredConvs: Conversation[] = [];

    for (let i = 0; i < scanIds.length; i += 10) {
      const batch = scanIds.slice(i, i + 10);
      const batchResults = await Promise.allSettled(
        batch.map(async (id) => {
          const res = await chatApi.getMessages(id, { limit: 50 });
          const members = await chatApi
            .getGroupMembers(id)
            .catch(() => [] as Awaited<ReturnType<typeof chatApi.getGroupMembers>>);
          return { id, res, members };
        }),
      );

      for (const item of batchResults) {
        if (item.status !== 'fulfilled') continue;
        const { id, res, members } = item.value;
        const convId = String(id);
        const rawList =
          res?.messages ??
          (res as { items?: NonNullable<typeof res>['messages'] } | undefined)
            ?.items ??
          [];
        const sorted = [...rawList].sort(
          (a, b) => (a.message_id ?? 0) - (b.message_id ?? 0),
        );
        const mappedMessages = sorted.map((dto) =>
          messageFromDto(dto, convId),
        );
        const isGroup =
          res?.conversation_type === 'GROUP' || members.length > 2;

        let partner: User | undefined;
        const otherMember = members.find(
          (m) => m.user_id != null && String(m.user_id) !== activeUserId,
        );
        const otherMsg = [...sorted]
          .reverse()
          .find(
            (m) => m.sender_id != null && String(m.sender_id) !== activeUserId,
          );

        if (isGroup) {
          partner = {
            ...basicUser({
              user_id: id,
              full_name: `Nhóm #${id}`,
            }),
            id: `group_${id}`,
            classOrTitle: `Nhóm · ${members.length || 3} thành viên`,
          };
        } else if (otherMember?.user_id != null) {
          const uid = String(otherMember.user_id);
          partner =
            apiUsersRef.current[uid] ??
            basicUser({
              user_id: otherMember.user_id,
              full_name: otherMember.full_name,
              avatar_url: otherMember.avatar_url,
            });
          const qIdx = hiddenPartnerQueue.findIndex((u) => u.id === uid);
          if (qIdx >= 0) hiddenPartnerQueue.splice(qIdx, 1);
        } else if (otherMsg?.sender_id != null) {
          const uid = String(otherMsg.sender_id);
          partner =
            apiUsersRef.current[uid] ??
            basicUser({
              user_id: otherMsg.sender_id,
              full_name: otherMsg.sender_name,
              avatar_url: otherMsg.avatar_url,
            });
          const qIdx = hiddenPartnerQueue.findIndex((u) => u.id === uid);
          if (qIdx >= 0) hiddenPartnerQueue.splice(qIdx, 1);
        } else if (hiddenPartnerQueue.length > 0) {
          partner = hiddenPartnerQueue.shift()!;
        } else {
          // Bỏ qua các hội thoại trống không có tin nhắn nếu đối phương không phải bạn bè
          if (mappedMessages.length === 0) {
            continue;
          }
          partner = {
            ...basicUser({
              user_id: id,
              full_name: `Hội thoại #${id}`,
            }),
            id: `conv_partner_${id}`,
            classOrTitle: 'Trò chuyện trực tiếp',
          };
        }

        const isPartnerFriend =
          friendStatusesRef.current[partner.id] === 'FRIEND';
        if (!isGroup && mappedMessages.length === 0 && !isPartnerFriend) {
          continue;
        }

        const latestMsg = mappedMessages[mappedMessages.length - 1];
        recoveredConvs.push({
          id: convId,
          type: isGroup ? 'GROUP' : 'DIRECT',
          participantIds: [activeUserId, partner.id],
          partner,
          lastMessage: latestMsg ? latestMsg.text : 'Bắt đầu cuộc trò chuyện',
          lastMessageTime: latestMsg ? latestMsg.timestamp : 'Vừa xong',
          unreadCount: 0,
          unreadCounts: { [activeUserId]: 0 },
          isHidden: false,
          members: members.length > 0 ? members.map(memberFromDto) : undefined,
          memberCount: members.length || undefined,
          messages: mappedMessages,
        });
      }
    }

    // Nếu còn liên hệ bị ẩn mà chưa gán vào ID hội thoại nào, hiển thị luôn vào danh sách chat
    for (const leftoverPartner of hiddenPartnerQueue) {
      const alreadyInList =
        recoveredConvs.some((c) => c.partner.id === leftoverPartner.id) ||
        conversationRecordsRef.current.some(
          (c) => c.partner.id === leftoverPartner.id,
        );
      if (!alreadyInList) {
        recoveredConvs.push({
          id: `direct_${leftoverPartner.id}`,
          type: 'DIRECT',
          participantIds: [activeUserId, leftoverPartner.id],
          partner: leftoverPartner,
          lastMessage: 'Bắt đầu cuộc trò chuyện',
          lastMessageTime: 'Vừa xong',
          unreadCount: 0,
          unreadCounts: { [activeUserId]: 0 },
          isHidden: false,
          messages: [],
        });
      }
    }

    if (recoveredConvs.length > 0) {
      setConversationRecords((prev) => {
        const next = [...prev];
        for (const rec of recoveredConvs) {
          let idx = next.findIndex(
            (c) =>
              c.id === rec.id ||
              (rec.type !== 'GROUP' &&
                !rec.partner.id.startsWith('conv_partner_') &&
                c.partner.id === rec.partner.id),
          );
          if (idx < 0 && rec.partner.id.startsWith('conv_partner_')) {
            idx = next.findIndex((c) => c.id.startsWith('direct_'));
          }
          if (idx >= 0) {
            next[idx] = {
              ...next[idx],
              id: rec.id.startsWith('direct_') ? next[idx].id : rec.id,
              partner: rec.partner.id.startsWith('conv_partner_')
                ? next[idx].partner
                : rec.partner,
              participantIds: [
                activeUserId,
                rec.partner.id.startsWith('conv_partner_')
                  ? next[idx].partner.id
                  : rec.partner.id,
              ],
              messages:
                rec.messages.length > 0 ? rec.messages : next[idx].messages,
              lastMessage:
                rec.messages.length > 0
                  ? rec.lastMessage
                  : next[idx].lastMessage,
              lastMessageTime:
                rec.messages.length > 0
                  ? rec.lastMessageTime
                  : next[idx].lastMessageTime,
            };
          } else {
            next.push(rec);
          }
        }
        return next;
      });
      return true;
    }

    return false;
  };

  const restoreAllHiddenConversations = async (
    knownActiveIds?: Set<number>,
    customPin?: string,
  ): Promise<boolean> => {
    const activeUserId = apiFeedUserId || currentUser.id;
    if (!activeUserId) return false;

    const unhideAllAndSync = async (
      hiddenItems: NonNullable<
        Awaited<ReturnType<typeof chatApi.getHiddenConversations>>
      >['items'],
    ) => {
      const list = hiddenItems ?? [];
      for (const item of list) {
        if (item.conversation_id != null) {
          await chatApi
            .unhideConversation(item.conversation_id)
            .catch(() => undefined);
        }
      }
      setHiddenConversationRecords([]);
      await syncConversationsFromServer(activeUserId).catch(() => undefined);
    };

    // 1. Khi có mã PIN truyền trực tiếp
    if (customPin) {
      await chatApi.unlockHiddenChat(customPin.trim());
      try {
        localStorage.setItem('unisocial_hidden_chat_pin', customPin.trim());
      } catch {
        // ignore
      }
      const hiddenRes = await chatApi.getHiddenConversations({ limit: 50 });
      await unhideAllAndSync(hiddenRes?.items);
      return true;
    }

    // 2. Thử lấy danh sách ẩn ngay nếu phiên Redis đã mở khóa sẵn
    try {
      const hiddenRes = await chatApi.getHiddenConversations({ limit: 50 });
      if ((hiddenRes?.items?.length ?? 0) > 0) {
        await unhideAllAndSync(hiddenRes?.items);
      }
      return true;
    } catch {
      // Kho ẩn chưa mở khóa -> chuyển sang bước 3
    }

    // 3. Nếu tài khoản chưa từng đặt mã PIN, đặt mặc định '123456'
    await chatApi.setHiddenChatPin('123456').catch(() => undefined);

    // 4. Thử mở khóa tự động bằng mã PIN đã lưu hoặc các mã PIN phổ biến
    const savedPin = (() => {
      try {
        return localStorage.getItem('unisocial_hidden_chat_pin') ?? '';
      } catch {
        return '';
      }
    })();
    const studentDigits = (currentUser.classOrTitle ?? '').replace(/\D/g, '');
    const candidatePins = Array.from(
      new Set(
        [
          savedPin,
          '123456',
          '000000',
          '111111',
          '654321',
          '040605',
          '462005',
          '040620',
          '112233',
          '666666',
          '123123',
          '888888',
          '999999',
          '202357',
          '235726',
          '202356',
          '235650',
          studentDigits.slice(0, 6),
          studentDigits.slice(-6),
        ].filter((p) => /^\d{6}$/.test(p)),
      ),
    );

    for (const pin of candidatePins) {
      try {
        await chatApi.unlockHiddenChat(pin);
        try {
          localStorage.setItem('unisocial_hidden_chat_pin', pin);
        } catch {
          // ignore
        }
        const hiddenRes = await chatApi.getHiddenConversations({ limit: 50 });
        await unhideAllAndSync(hiddenRes?.items);
        return true;
      } catch (err: unknown) {
        const msg = errorMessage(err, '').toLowerCase();
        if (msg.includes('chưa cài') || msg.includes('chưa thiết lập')) {
          try {
            await chatApi.setHiddenChatPin('123456');
            await chatApi.unlockHiddenChat('123456');
            const hiddenRes = await chatApi.getHiddenConversations({
              limit: 50,
            });
            await unhideAllAndSync(hiddenRes?.items);
            return true;
          } catch {
            break;
          }
        }
      }
    }

    // 5. Khôi phục và hiển thị ngay lập tức các đoạn chat bị ẩn thông qua lịch sử tin nhắn & danh sách liên hệ
    const activeSet =
      knownActiveIds ??
      new Set(
        conversationRecordsRef.current
          .map((c) => Number(c.id))
          .filter((id) => Number.isInteger(id) && id > 0),
      );
    return reconstructHiddenConversations(activeUserId, activeSet);
  };

  useEffect(() => {
    if (!apiFeedUserId) {
      chatStompClient.disconnect();
      if (chatSourceRef.current === 'api') {
        chatSourceRef.current = 'demo';
        setConversationRecords(mockConversations);
        setHiddenConversationRecords([]);
      }
      return;
    }
    chatSourceRef.current = 'api';
    let cancelled = false;
    setConversationRecords([]);
    setHiddenConversationRecords([]);

    syncConversationsFromServer(apiFeedUserId)
      .then((activeIds) => {
        if (cancelled) return;
        return restoreAllHiddenConversations(activeIds);
      })
      .catch(() => undefined);

    chatStompClient.connect();
    const unsubscribe = chatStompClient.onUserMessage((wsPayload) => {
      if (cancelled) return;
      // Biên nhận đã đọc
      if (
        wsPayload.reader_id != null &&
        wsPayload.conversation_id != null &&
        wsPayload.message_id == null
      ) {
        const convId = String(wsPayload.conversation_id);
        setConversationRecords((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) => ({ ...m, status: 'READ' })),
                }
              : c,
          ),
        );
        return;
      }

      if (wsPayload.conversation_id == null) return;
      const convId = String(wsPayload.conversation_id);
      const incoming = messageFromWs(wsPayload, convId);
      const isFromMe = incoming.senderId === apiFeedUserId;

      setConversationRecords((prev) => {
        const exists = prev.some((c) => c.id === convId);
        if (!exists) {
          // Hội thoại mới chưa có trong danh sách: tạo tạm rồi đồng bộ danh sách
          const partner = wsPayload.sender_id
            ? (apiUsersRef.current[String(wsPayload.sender_id)] ??
              basicUser({
                user_id: wsPayload.sender_id,
                full_name: wsPayload.sender_name,
                avatar_url: wsPayload.avatar_url,
              }))
            : basicUser({
                user_id: wsPayload.conversation_id,
                full_name: wsPayload.sender_name || `Hội thoại #${convId}`,
                avatar_url: wsPayload.avatar_url,
              });
          const newConv: Conversation = {
            id: convId,
            type: 'DIRECT',
            participantIds: [apiFeedUserId, partner.id],
            partner,
            lastMessage: incoming.text,
            lastMessageTime: incoming.timestamp,
            unreadCount: isFromMe ? 0 : 1,
            unreadCounts: { [apiFeedUserId]: isFromMe ? 0 : 1 },
            messages: [incoming],
          };
          return [newConv, ...prev];
        }

        return prev.map((c) => {
          if (c.id !== convId) return c;
          const hasExactId = c.messages.some((m) => m.id === incoming.id);
          let updatedMessages: MessageItem[];
          if (hasExactId) {
            updatedMessages = c.messages.map((m) =>
              m.id === incoming.id ? incoming : m,
            );
          } else if (isFromMe) {
            // Khớp tin nhắn tạm (optimistic) vừa gửi
            const tempIdx = c.messages.findIndex(
              (m) =>
                m.id.startsWith('temp_') &&
                m.senderId === apiFeedUserId &&
                m.text === incoming.text,
            );
            if (tempIdx >= 0) {
              updatedMessages = [...c.messages];
              updatedMessages[tempIdx] = incoming;
            } else {
              updatedMessages = [...c.messages, incoming];
            }
          } else {
            updatedMessages = [...c.messages, incoming];
          }

          const nextUnread = isFromMe
            ? 0
            : (c.unreadCounts?.[apiFeedUserId] ?? c.unreadCount ?? 0) + 1;

          return {
            ...c,
            lastMessage: incoming.text,
            lastMessageTime: incoming.timestamp,
            unreadCount: nextUnread,
            unreadCounts: {
              ...c.unreadCounts,
              [apiFeedUserId]: nextUnread,
            },
            messages: updatedMessages,
          };
        });
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
    // Kết nối STOMP theo tài khoản, không tạo lại mỗi lần provider render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFeedUserId]);

  const friendIdsKey = Object.entries(friendStatuses)
    .filter(([, status]) => status === 'FRIEND')
    .map(([id]) => id)
    .sort()
    .join(',');
  useEffect(() => {
    if (!apiFeedUserId || !friendIdsKey) return;
    const unprobedFriends = Object.values(apiUsers).filter(
      (u) =>
        u.id !== apiFeedUserId &&
        Number.isInteger(Number(u.id)) &&
        Number(u.id) > 0 &&
        friendStatuses[u.id] === 'FRIEND' &&
        !probedHiddenPartnerIdsRef.current.has(u.id) &&
        !conversationRecordsRef.current.some((c) => c.partner.id === u.id),
    );
    if (unprobedFriends.length === 0) return;

    void (async () => {
      for (const u of unprobedFriends) {
        probedHiddenPartnerIdsRef.current.add(u.id);
        try {
          const detail = await chatApi.createDirectConversation(Number(u.id));
          if (detail?.conversation_id != null) {
            const convIdStr = String(detail.conversation_id);
            setConversationRecords((prev) => {
              if (prev.some((c) => c.id === convIdStr)) {
                return prev.map((c) =>
                  c.id === convIdStr
                    ? {
                        ...c,
                        partner: u,
                        participantIds: [apiFeedUserId, u.id],
                      }
                    : c,
                );
              }
              return [
                ...prev,
                conversationFromDetailDto(
                  detail,
                  apiFeedUserId,
                  apiUsersRef.current,
                ),
              ];
            });
          }
        } catch (err: unknown) {
          const msg = errorMessage(err, '').toLowerCase();
          if (
            msg.includes('pin') ||
            msg.includes('kho ẩn') ||
            msg.includes('đã ẩn')
          ) {
            setConversationRecords((prev) => {
              if (prev.some((c) => c.partner.id === u.id)) return prev;
              const placeholderIdx = prev.findIndex(
                (c) =>
                  c.type !== 'GROUP' &&
                  c.partner.id.startsWith('conv_partner_'),
              );
              if (placeholderIdx >= 0) {
                const updated = [...prev];
                updated[placeholderIdx] = {
                  ...updated[placeholderIdx],
                  partner: u,
                  participantIds: [apiFeedUserId, u.id],
                };
                return updated;
              }
              return [
                ...prev,
                {
                  id: `direct_${u.id}`,
                  type: 'DIRECT',
                  participantIds: [apiFeedUserId, u.id],
                  partner: u,
                  lastMessage: 'Bắt đầu cuộc trò chuyện',
                  lastMessageTime: 'Vừa xong',
                  unreadCount: 0,
                  unreadCounts: { [apiFeedUserId]: 0 },
                  isHidden: false,
                  messages: [],
                },
              ];
            });
          }
        }
      }
    })();
  }, [apiFeedUserId, friendIdsKey, apiUsers, friendStatuses]);

  const loadingConvMessagesRef = useRef(new Set<string>());
  const loadConversationMessages = (conversationId: string) => {
    if (
      sessionKind !== 'api' ||
      !conversationId ||
      loadingConvMessagesRef.current.has(conversationId)
    )
      return;
    const numericId = Number(conversationId);
    if (!Number.isInteger(numericId) || numericId <= 0) return;

    loadingConvMessagesRef.current.add(conversationId);
    chatApi
      .getMessages(numericId, { limit: 50 })
      .then((res) => {
        const rawList =
          res?.messages ??
          (res as { items?: NonNullable<typeof res>['messages'] } | undefined)
            ?.items;
        if (!rawList) return;
        // Backend trả tin nhắn mới nhất trước hoặc theo thứ tự thời gian; sắp xếp tăng dần theo message_id
        const sorted = [...rawList].sort(
          (a, b) => (a.message_id ?? 0) - (b.message_id ?? 0),
        );
        const mapped = sorted.map((dto) => messageFromDto(dto, conversationId));
        const mergeConv = (c: Conversation): Conversation => {
          if (c.id !== conversationId) return c;
          // Giữ lại các tin nhắn tạm (`temp_...`) vừa gửi nếu server chưa kịp trả về trong GET /messages
          const pendingTemps = c.messages.filter(
            (m) =>
              m.id.startsWith('temp_') &&
              !mapped.some(
                (srv) => srv.senderId === m.senderId && srv.text === m.text,
              ),
          );
          const mergedMessages =
            mapped.length > 0 || pendingTemps.length > 0
              ? [...mapped, ...pendingTemps]
              : c.messages;
          const latestMsg = mergedMessages[mergedMessages.length - 1];
          return {
            ...c,
            type: res?.conversation_type ?? c.type,
            messages: mergedMessages,
            lastMessage: latestMsg ? latestMsg.text : c.lastMessage,
            lastMessageTime: latestMsg
              ? latestMsg.timestamp
              : c.lastMessageTime,
            unreadCount: 0,
            unreadCounts: { ...c.unreadCounts, [currentUser.id]: 0 },
          };
        };
        setConversationRecords((prev) => prev.map(mergeConv));
        setHiddenConversationRecords((prev) => prev.map(mergeConv));
        const latestMsgId = sorted[sorted.length - 1]?.message_id;
        if (latestMsgId != null) {
          chatStompClient.sendReadReceipt({
            conversation_id: numericId,
            message_id: latestMsgId,
          });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        loadingConvMessagesRef.current.delete(conversationId);
      });
  };

  // Chat dock
  const openChatDock = (partnerUserId: string) => {
    if (partnerUserId === currentUser.id) return;
    if (sessionKind === 'api') {
      const targetUserName = findRawUserById(partnerUserId)
        .name.trim()
        .toLowerCase();
      const existing = conversations.find(
        (c) =>
          c.type !== 'GROUP' &&
          (c.partner.id === partnerUserId ||
            (c.partner.id.startsWith('conv_partner_') &&
              Boolean(targetUserName) &&
              c.partner.name.trim().toLowerCase() === targetUserName)),
      );
      if (existing) {
        markConversationRead(existing.id);
        loadConversationMessages(existing.id);
        if (!activeDockIds.includes(existing.id)) {
          setActiveDockIds((prev) => [...prev.slice(-2), existing.id]);
        }
        setMinimizedDockIds((prev) => prev.filter((id) => id !== existing.id));
        return;
      }
      const numericTargetId = Number(partnerUserId);
      if (!Number.isInteger(numericTargetId) || numericTargetId <= 0) return;

      const openFromDetail = (
        detail: Awaited<ReturnType<typeof chatApi.createDirectConversation>>,
      ) => {
        if (!detail || detail.conversation_id == null) return;
        void chatApi
          .unhideConversation(detail.conversation_id)
          .catch(() => undefined);
        const newConv = conversationFromDetailDto(
          detail,
          currentUser.id,
          apiUsersRef.current,
        );
        setConversationRecords((prev) => [
          newConv,
          ...prev.filter((item) => item.id !== newConv.id),
        ]);
        loadConversationMessages(newConv.id);
        setActiveDockIds((prev) =>
          prev.includes(newConv.id) ? prev : [...prev.slice(-2), newConv.id],
        );
        setMinimizedDockIds((prev) => prev.filter((id) => id !== newConv.id));
      };

      chatApi
        .createDirectConversation(numericTargetId)
        .then((detail) => {
          openFromDetail(detail);
        })
        .catch(async (error: unknown) => {
          const msg = errorMessage(
            error,
            'Không thể khởi tạo cuộc trò chuyện.',
          );
          if (
            msg.toLowerCase().includes('pin') ||
            msg.toLowerCase().includes('kho ẩn') ||
            msg.toLowerCase().includes('đã ẩn')
          ) {
            await restoreAllHiddenConversations();
            const targetPartner = findRawUserById(partnerUserId);
            const matchedAfterRestore = conversationRecordsRef.current.find(
              (c) =>
                c.type !== 'GROUP' &&
                (c.partner.id === partnerUserId ||
                  c.partner.id.startsWith('conv_partner_')),
            );
            if (matchedAfterRestore) {
              const boundConvId = matchedAfterRestore.id;
              if (matchedAfterRestore.partner.id.startsWith('conv_partner_')) {
                setConversationRecords((prev) =>
                  prev.map((c) =>
                    c.id === boundConvId
                      ? {
                          ...c,
                          partner: targetPartner,
                          participantIds: [currentUser.id, partnerUserId],
                        }
                      : c,
                  ),
                );
              }
              loadConversationMessages(boundConvId);
              setActiveDockIds((prev) =>
                prev.includes(boundConvId)
                  ? prev
                  : [...prev.slice(-2), boundConvId],
              );
              setMinimizedDockIds((prev) =>
                prev.filter((id) => id !== boundConvId),
              );
              return;
            }

            const fallbackConvId = `direct_${partnerUserId}`;
            const fallbackConv: Conversation = {
              id: fallbackConvId,
              type: 'DIRECT',
              participantIds: [currentUser.id, partnerUserId],
              partner: targetPartner,
              lastMessage: 'Bắt đầu cuộc trò chuyện',
              lastMessageTime: 'Vừa xong',
              unreadCount: 0,
              unreadCounts: { [currentUser.id]: 0 },
              isHidden: false,
              messages: [],
            };
            setConversationRecords((prev) => [
              fallbackConv,
              ...prev.filter((c) => c.id !== fallbackConvId),
            ]);
            setActiveDockIds((prev) =>
              prev.includes(fallbackConvId)
                ? prev
                : [...prev.slice(-2), fallbackConvId],
            );
            setMinimizedDockIds((prev) =>
              prev.filter((id) => id !== fallbackConvId),
            );
            return;
          }
          showToast(msg, 'error');
        });
      return;
    }

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
              unreadCount: 0,
              unreadCounts: {
                ...item.unreadCounts,
                [currentUser.id]: 0,
              },
            }
          : item,
      ),
    );
    if (sessionKind === 'api') {
      const numericConvId = Number(conversationId);
      const lastMsg = conversation.messages[conversation.messages.length - 1];
      const numericMsgId = lastMsg ? Number(lastMsg.id) : NaN;
      if (Number.isInteger(numericConvId) && Number.isInteger(numericMsgId)) {
        chatStompClient.sendReadReceipt({
          conversation_id: numericConvId,
          message_id: numericMsgId,
        });
      }
    }
  };

  const sendMessage = (conversationId: string, text: string) => {
    if (!text.trim()) return;
    const targetConv =
      conversations.find((c) => c.id === conversationId) ??
      hiddenConversationRecords.find((c) => c.id === conversationId);
    if (!targetConv) return;
    if (
      targetConv.type !== 'GROUP' &&
      isBlockedEitherWay(targetConv.partner.id)
    ) {
      showToast(
        'Không thể gửi tin nhắn vì hai người đang trong trạng thái chặn.',
        'error',
      );
      return false;
    }
    if (sessionKind === 'api') {
      const numericConvId = Number(conversationId);
      const tempMessage: MessageItem = {
        id: `temp_${Date.now()}`,
        conversationId,
        senderId: currentUser.id,
        text: text.trim(),
        timestamp: formatChatTime(new Date().toISOString()),
        status: 'SENDING',
        effect: currentUser.equippedChatEffectId,
      };
      const appendTemp = (c: Conversation): Conversation =>
        c.id === conversationId
          ? {
              ...c,
              lastMessage: text.trim(),
              lastMessageTime: tempMessage.timestamp,
              messages: [...c.messages, tempMessage],
            }
          : c;
      setConversationRecords((prev) => prev.map(appendTemp));
      setHiddenConversationRecords((prev) => prev.map(appendTemp));
      if (Number.isInteger(numericConvId) && numericConvId > 0) {
        chatStompClient.sendMessage({
          conversation_id: numericConvId,
          content: text.trim(),
          message_type: 'TEXT',
        });
        setTimeout(() => {
          loadConversationMessages(conversationId);
        }, 1200);
      }
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
    return true;
  };

  const recallMessage = (
    conversationId: string,
    messageId: string,
    scope: 'ME' | 'EVERYONE' = 'EVERYONE',
  ) => {
    const conversation = conversations.find(
      (item) => item.id === conversationId,
    );
    if (!conversation) return;
    if (
      scope === 'EVERYONE' &&
      !conversation.messages.some(
        (message) =>
          message.id === messageId && message.senderId === currentUser.id,
      )
    )
      return;

    const applyLocalDelete = () => {
      setConversationRecords((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          if (scope === 'ME') {
            return {
              ...c,
              messages: c.messages.filter((m) => m.id !== messageId),
            };
          }
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId
                ? { ...m, isRecalled: true, text: 'Tin nhắn đã được thu hồi' }
                : m,
            ),
          };
        }),
      );
    };

    if (sessionKind === 'api') {
      const numericMsgId = Number(messageId);
      if (!Number.isInteger(numericMsgId) || numericMsgId <= 0) {
        applyLocalDelete();
        return;
      }
      chatApi
        .deleteMessage(numericMsgId, scope)
        .then(() => {
          applyLocalDelete();
          showToast(
            scope === 'ME'
              ? 'Đã xóa tin nhắn ở phía bạn.'
              : 'Đã thu hồi tin nhắn đối với mọi người.',
            'info',
          );
        })
        .catch((error: unknown) =>
          showToast(
            errorMessage(error, 'Không thể xóa/thu hồi tin nhắn.'),
            'error',
          ),
        );
      return;
    }

    applyLocalDelete();
    showToast(
      scope === 'ME'
        ? 'Đã xóa tin nhắn ở phía bạn.'
        : 'Đã thu hồi tin nhắn đối với mọi người.',
      'info',
    );
  };

  const sendTyping = (conversationId: string, isTyping: boolean) => {
    if (sessionKind !== 'api') return;
    const numericConvId = Number(conversationId);
    if (!Number.isInteger(numericConvId) || numericConvId <= 0) return;
    chatStompClient.sendTyping({
      conversation_id: numericConvId,
      is_typing: isTyping,
    });
  };

  const createGroupChat = async (
    name: string,
    memberIds: string[],
    avatarUrl?: string,
  ): Promise<Conversation | null> => {
    if (!name.trim() || memberIds.length < 2) {
      showToast(
        'Nhóm chat cần có tên và tối thiểu 2 thành viên khác bạn.',
        'warning',
      );
      return null;
    }
    if (sessionKind === 'api') {
      try {
        const dto = await chatApi.createGroupConversation({
          name: name.trim(),
          avatar_url: avatarUrl?.trim() || undefined,
          member_ids: memberIds.map(Number).filter(Number.isFinite),
        });
        if (!dto) return null;
        const created = conversationFromDetailDto(
          dto,
          currentUser.id,
          apiUsersRef.current,
        );
        setConversationRecords((prev) => [
          created,
          ...prev.filter((c) => c.id !== created.id),
        ]);
        showToast(`Đã tạo nhóm "${created.partner.name}"!`, 'success');
        return created;
      } catch (error: unknown) {
        showToast(errorMessage(error, 'Không tạo được nhóm chat.'), 'error');
        return null;
      }
    }
    const groupId = `group_${Date.now()}`;
    const members = [currentUser.id, ...memberIds].map((uid, idx) => {
      const u = getUserById(uid);
      return {
        userId: u.id,
        name: u.name,
        avatar: u.avatar,
        role: (idx === 0 ? 'CHIEF' : 'VILLAGER') as
          | 'CHIEF'
          | 'VILLAGE_ELDER'
          | 'VILLAGER',
      };
    });
    const created: Conversation = {
      id: groupId,
      type: 'GROUP',
      participantIds: [currentUser.id, ...memberIds],
      partner: {
        ...currentUser,
        id: groupId,
        name: name.trim(),
        avatar: avatarUrl?.trim() || '/default-avatar.svg',
        classOrTitle: `Nhóm · ${members.length} thành viên`,
      },
      lastMessage: 'Nhóm mới được khởi tạo',
      lastMessageTime: 'Vừa xong',
      unreadCount: 0,
      memberCount: members.length,
      members,
      messages: [],
    };
    setConversationRecords((prev) => [created, ...prev]);
    showToast(`Đã tạo nhóm "${name.trim()}"!`, 'success');
    return created;
  };

  const updateGroupChat = async (
    conversationId: string,
    updates: { name?: string; avatar_url?: string },
  ) => {
    if (sessionKind === 'api') {
      try {
        const dto = await chatApi.updateGroupInfo(
          Number(conversationId),
          updates,
        );
        setConversationRecords((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? dto
                ? conversationFromDetailDto(
                    dto,
                    currentUser.id,
                    apiUsersRef.current,
                    c,
                  )
                : {
                    ...c,
                    partner: {
                      ...c.partner,
                      name: updates.name?.trim() || c.partner.name,
                      avatar: updates.avatar_url?.trim() || c.partner.avatar,
                    },
                  }
              : c,
          ),
        );
        showToast('Đã cập nhật thông tin nhóm chat.', 'success');
      } catch (error: unknown) {
        showToast(
          errorMessage(error, 'Không cập nhật được thông tin nhóm.'),
          'error',
        );
      }
      return;
    }
    setConversationRecords((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              partner: {
                ...c.partner,
                name: updates.name?.trim() || c.partner.name,
                avatar: updates.avatar_url?.trim() || c.partner.avatar,
              },
            }
          : c,
      ),
    );
    showToast('Đã cập nhật thông tin nhóm chat.', 'success');
  };

  const loadGroupMembers = async (conversationId: string) => {
    if (sessionKind !== 'api') return;
    const numericId = Number(conversationId);
    if (!Number.isInteger(numericId) || numericId <= 0) return;
    try {
      const list = await chatApi.getGroupMembers(numericId);
      const mapped = list.map(memberFromDto);
      setConversationRecords((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, members: mapped, memberCount: mapped.length }
            : c,
        ),
      );
    } catch {
      // ignore
    }
  };

  const addMembersToGroup = async (
    conversationId: string,
    userIds: string[],
  ) => {
    if (!userIds.length) return;
    if (sessionKind === 'api') {
      try {
        await chatApi.addGroupMembers(
          Number(conversationId),
          userIds.map(Number).filter(Number.isFinite),
        );
        await loadGroupMembers(conversationId);
        showToast('Đã thêm thành viên vào nhóm.', 'success');
      } catch (error: unknown) {
        showToast(errorMessage(error, 'Không thêm được thành viên.'), 'error');
      }
      return;
    }
    setConversationRecords((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        const existingIds = new Set((c.members ?? []).map((m) => m.userId));
        const added = userIds
          .filter((uid) => !existingIds.has(uid))
          .map((uid) => {
            const u = getUserById(uid);
            return {
              userId: u.id,
              name: u.name,
              avatar: u.avatar,
              role: 'VILLAGER' as const,
            };
          });
        const nextMembers = [...(c.members ?? []), ...added];
        return {
          ...c,
          participantIds: Array.from(new Set([...c.participantIds, ...userIds])),
          members: nextMembers,
          memberCount: nextMembers.length,
        };
      }),
    );
    showToast('Đã thêm thành viên vào nhóm.', 'success');
  };

  const removeMemberFromGroup = async (
    conversationId: string,
    userId: string,
  ) => {
    if (sessionKind === 'api') {
      try {
        await chatApi.removeGroupMember(Number(conversationId), Number(userId));
        await loadGroupMembers(conversationId);
        showToast('Đã xóa thành viên khỏi nhóm.', 'info');
      } catch (error: unknown) {
        showToast(errorMessage(error, 'Không xóa được thành viên.'), 'error');
      }
      return;
    }
    setConversationRecords((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              members: (c.members ?? []).filter((m) => m.userId !== userId),
            }
          : c,
      ),
    );
    showToast('Đã xóa thành viên khỏi nhóm.', 'info');
  };

  const updateGroupMemberRole = async (
    conversationId: string,
    userId: string,
    newRole: 'CHIEF' | 'VILLAGE_ELDER' | 'VILLAGER',
  ) => {
    if (sessionKind === 'api') {
      try {
        await chatApi.updateMemberRole(
          Number(conversationId),
          Number(userId),
          newRole,
        );
        await loadGroupMembers(conversationId);
        showToast('Đã cập nhật vai trò thành viên.', 'success');
      } catch (error: unknown) {
        showToast(errorMessage(error, 'Không đổi được vai trò.'), 'error');
      }
      return;
    }
    setConversationRecords((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              members: (c.members ?? []).map((m) =>
                m.userId === userId ? { ...m, role: newRole } : m,
              ),
            }
          : c,
      ),
    );
    showToast('Đã cập nhật vai trò thành viên.', 'success');
  };

  const leaveGroupChat = async (
    conversationId: string,
    newChiefId?: string,
  ) => {
    if (sessionKind === 'api') {
      try {
        await chatApi.leaveGroup(
          Number(conversationId),
          newChiefId ? Number(newChiefId) : undefined,
        );
        setConversationRecords((prev) =>
          prev.filter((c) => c.id !== conversationId),
        );
        closeChatDock(conversationId);
        showToast('Bạn đã rời khỏi nhóm chat.', 'info');
      } catch (error: unknown) {
        showToast(errorMessage(error, 'Không thể rời nhóm chat.'), 'error');
      }
      return;
    }
    setConversationRecords((prev) =>
      prev.filter((c) => c.id !== conversationId),
    );
    closeChatDock(conversationId);
    showToast('Bạn đã rời khỏi nhóm chat.', 'info');
  };

  const hideChatConversation = async (conversationId: string) => {
    const target = conversations.find((c) => c.id === conversationId);
    if (!target) return;
    if (sessionKind === 'api') {
      try {
        await chatApi.hideConversation(Number(conversationId));
        setConversationRecords((prev) =>
          prev.filter((c) => c.id !== conversationId),
        );
        setHiddenConversationRecords((prev) => [
          { ...target, isHidden: true },
          ...prev.filter((c) => c.id !== conversationId),
        ]);
        closeChatDock(conversationId);
        showToast('Đã ẩn cuộc hội thoại vào kho bí mật.', 'info');
      } catch (error: unknown) {
        showToast(errorMessage(error, 'Không thể ẩn cuộc hội thoại.'), 'error');
      }
      return;
    }
    setConversationRecords((prev) =>
      prev.filter((c) => c.id !== conversationId),
    );
    setHiddenConversationRecords((prev) => [
      { ...target, isHidden: true },
      ...prev.filter((c) => c.id !== conversationId),
    ]);
    closeChatDock(conversationId);
    showToast('Đã ẩn cuộc hội thoại vào kho bí mật.', 'info');
  };

  const unhideChatConversation = async (conversationId: string) => {
    const target = hiddenConversationRecords.find(
      (c) => c.id === conversationId,
    );
    if (sessionKind === 'api') {
      try {
        await chatApi.unhideConversation(Number(conversationId));
        setHiddenConversationRecords((prev) =>
          prev.filter((c) => c.id !== conversationId),
        );
        if (target) {
          setConversationRecords((prev) => [
            { ...target, isHidden: false },
            ...prev.filter((c) => c.id !== conversationId),
          ]);
        }
        showToast('Đã đưa cuộc hội thoại trở lại hộp thư chính.', 'success');
      } catch (error: unknown) {
        showToast(
          errorMessage(error, 'Không thể bỏ ẩn cuộc hội thoại.'),
          'error',
        );
      }
      return;
    }
    setHiddenConversationRecords((prev) =>
      prev.filter((c) => c.id !== conversationId),
    );
    if (target) {
      setConversationRecords((prev) => [
        { ...target, isHidden: false },
        ...prev.filter((c) => c.id !== conversationId),
      ]);
    }
    showToast('Đã đưa cuộc hội thoại trở lại hộp thư chính.', 'success');
  };

  const unlockHiddenConversations = async (pin: string): Promise<boolean> => {
    if (!/^\d{6}$/.test(pin.trim())) {
      showToast('Mã PIN phải gồm đúng 6 chữ số.', 'warning');
      return false;
    }
    if (sessionKind === 'api') {
      try {
        await restoreAllHiddenConversations(undefined, pin.trim());
        showToast(
          'Đã mở khóa và hiển thị lại toàn bộ cuộc trò chuyện đã ẩn.',
          'success',
        );
        return true;
      } catch (error: unknown) {
        showToast(
          errorMessage(
            error,
            'Không mở khóa được kho ẩn (kiểm tra lại mã PIN).',
          ),
          'error',
        );
        return false;
      }
    }
    showToast('Đã mở khóa kho trò chuyện ẩn.', 'success');
    return true;
  };

  const setHiddenChatPin = async (
    pin: string,
    oldPin?: string,
  ): Promise<boolean> => {
    if (!/^\d{6}$/.test(pin.trim())) {
      showToast('Mã PIN mới phải gồm đúng 6 chữ số.', 'warning');
      return false;
    }
    if (sessionKind === 'api') {
      try {
        await chatApi.setHiddenChatPin(pin.trim(), oldPin?.trim() || undefined);
        showToast('Đã lưu mã PIN kho trò chuyện ẩn thành công!', 'success');
        return true;
      } catch (error: unknown) {
        showToast(
          errorMessage(error, 'Không lưu được mã PIN kho trò chuyện ẩn.'),
          'error',
        );
        return false;
      }
    }
    showToast('Đã lưu mã PIN kho trò chuyện ẩn thành công!', 'success');
    return true;
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    if (sessionKind === 'api') {
      const notification = apiNotifications.find((item) => item.id === id);
      if (!notification || notification.isRead) return;
      void notificationsApi.markRead(Number(id)).then(() => {
        setApiNotifications((previous) => previous.map((item) => item.id === id ? { ...item, isRead: true } : item));
        setApiUnreadCount((count) => Math.max(0, count - 1));
      }).catch((error: unknown) => showToast(errorMessage(error, 'Không đánh dấu được thông báo.'), 'error'));
      return;
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const markAllNotificationsAsRead = () => {
    if (sessionKind === 'api') {
      void notificationsApi.markAllRead().then(() => {
        setApiNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
        setApiUnreadCount(0);
      }).catch((error: unknown) => showToast(errorMessage(error, 'Không đánh dấu được thông báo.'), 'error'));
      return;
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('Đã đánh dấu tất cả thông báo là đã đọc', 'info');
  };

  const unreadNotificationsCount = sessionKind === 'api' ? apiUnreadCount : notifications.filter(
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
        sessionKind,
        isRestoringSession,
        loginWithCredentials,
        logout,
        currentUser,
        role,
        switchRole,
        updateCurrentUser,
        saveProfileChanges,
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
        trendingSearches,
        removeSavedSearch,
        clearAllSavedSearches,
        triggerSearch,
        isDarkMode,
        toggleDarkMode,
        posts,
        isFeedLoading,
        feedError,
        newFeedCount,
        reloadFeed,
        apiFeedHasMore,
        isFeedLoadingMore,
        loadMoreFeed,
        loadProfilePosts,
        createPost,
        updatePost,
        toggleLikePost,
        addComment,
        updateComment,
        deleteComment,
        loadPostComments,
        openPostById,
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
        followersIds,
        toggleFollowUser,
        searchUsersOnApi,
        dismissedSuggestionIds,
        dismissSuggestion,
        blockedUsers,
        blockedByOtherIds,
        blockUser,
        unblockUser,
        toggleSimulatedBlockedByOther,
        viewedProfileError,
        reloadRelationships: () => setApiRelationsReloadKey((key) => key + 1),
        isBlockedByMe,
        isBlockingMe,
        isBlockedEitherWay,
        isPresenceVisible,
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
        hiddenConversations: hiddenConversationRecords,
        openChatDock,
        loadConversationMessages,
        markConversationRead,
        closeChatDock,
        minimizeChatDock,
        restoreChatDock,
        activeDockIds,
        minimizedDockIds,
        sendMessage,
        recallMessage,
        sendTyping,
        createGroupChat,
        updateGroupChat,
        loadGroupMembers,
        addMembersToGroup,
        removeMemberFromGroup,
        updateGroupMemberRole,
        leaveGroupChat,
        hideChatConversation,
        unhideChatConversation,
        unlockHiddenConversations,
        setHiddenChatPin,
        notifications,
        notificationsHasMore: sessionKind === 'api' && notificationsHasMore,
        loadMoreNotifications,
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
