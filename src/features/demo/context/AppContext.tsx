import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
} from '../types';
import type {
  FriendStatus,
  ImageCrop,
  ProfilePhotoHistoryItem,
} from '../types';
import {
  appendComment,
  findPostComment,
  getPostContentIssue,
  removeOwnedComment,
  removeOwnedPost,
  updateOwnedComment,
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

export interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  // Auth state
  isAuthenticated: boolean;
  login: (asRole?: Role, customUser?: Partial<User>) => void;
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
  editComment: (postId: string, commentId: string, text: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  deletePost: (postId: string) => void;
  addLecturerNote: (postId: string, note: string) => void;
  friendStatuses: Record<string, FriendStatus>;
  setFriendStatuses: React.Dispatch<
    React.SetStateAction<Record<string, FriendStatus>>
  >;

  // Questions & Bank
  questions: Question[];
  answerQuestion: (
    questionId: string,
    chosenOption: 'A' | 'B' | 'C' | 'D',
  ) => boolean;
  rateQuestion: (questionId: string, stars: number) => void;
  updateQuestion: (questionId: string, updates: Partial<Question>) => void;
  applyAIQuestionRefine: (
    questionId: string,
    newContent: string,
    newExplanation?: string,
  ) => void;

  // Propose Sessions (SV đề xuất -> GV duyệt)
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
  const [profilePhotoHistory, setProfilePhotoHistory] = useState<
    ProfilePhotoHistoryItem[]
  >([]);
  const [friendStatuses, setFriendStatuses] = useState<
    Record<string, FriendStatus>
  >({
    user_sv_02: 'REQUEST_RECEIVED',
    user_sv_03: 'FRIEND',
    user_sv_04: 'NONE',
  });
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [sessions, setSessions] =
    useState<ProposeSession[]>(mockProposeSessions);
  const [exams, setExams] = useState<Exam[]>(mockExams);
  const [minigames, setMinigames] = useState<Minigame[]>(mockMinigames);
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardUser[]>(mockLeaderboard);
  const [cosmetics, setCosmetics] = useState<CosmeticItem[]>(mockCosmetics);
  const [conversations, setConversations] =
    useState<Conversation[]>(mockConversations);
  const [notifications, setNotifications] =
    useState<AppNotification[]>(mockNotifications);

  // Chat dock
  const [activeDockIds, setActiveDockIds] = useState<string[]>(['conv_01']);
  const [minimizedDockIds, setMinimizedDockIds] = useState<string[]>([]);

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
    currentUser,
    setCurrentUser,
    role,
    login,
    loginWithCredentials,
    logout,
    switchRole,
    updateCurrentUser: updateAuthCurrentUser,
  } = useAuthSession(showToast);

  const sharedPostId =
    location.pathname === '/feed'
      ? new URLSearchParams(location.search).get('post')
      : null;
  const sharedPost = sharedPostId
    ? posts.find((post) => post.id === sharedPostId)
    : null;
  const canViewSharedPost =
    sharedPost &&
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

  const getUserById = (id: string): User => {
    if (id === currentUser.id) return currentUser;
    if (id === mockCurrentUserStudent.id) return mockCurrentUserStudent;
    if (id === mockCurrentUserLecturer.id) return mockCurrentUserLecturer;
    const found = mockOtherUsers.find((u) => u.id === id);
    return found || mockCurrentUserStudent;
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

  const editComment = (postId: string, commentId: string, text: string) => {
    const post = posts.find((item) => item.id === postId);
    const comment = post && findPostComment(post, commentId);
    if (!text.trim() || comment?.author.id !== currentUser.id) return;
    setPosts((previous) =>
      updateOwnedComment(previous, postId, commentId, currentUser.id, text),
    );
    showToast('Đã sửa bình luận.', 'success');
  };

  const deleteComment = (postId: string, commentId: string) => {
    const post = posts.find((item) => item.id === postId);
    const comment = post && findPostComment(post, commentId);
    if (comment?.author.id !== currentUser.id) return;
    setPosts((previous) =>
      removeOwnedComment(previous, postId, commentId, currentUser.id),
    );
    showToast('Đã xóa bình luận.', 'info');
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
    return isCorrect;
  };

  const rateQuestion = (questionId: string, stars: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          const newCount = q.ratingCount + 1;
          const newAvg = Number(
            ((q.ratingAverage * q.ratingCount + stars) / newCount).toFixed(1),
          );
          return {
            ...q,
            userRatedStars: stars,
            ratingCount: newCount,
            ratingAverage: newAvg,
          };
        }
        return q;
      }),
    );
    showToast(`Đã gửi đánh giá ${stars} sao cho câu hỏi!`, 'success');
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

  const approveSession = (
    sessionId: string,
    selectedQuestionIds: string[],
    note?: string,
    autoPost: boolean = true,
  ) => {
    // Approve questions
    setQuestions((prev) =>
      prev.map((q) =>
        selectedQuestionIds.includes(q.id) ? { ...q, status: 'APPROVED' } : q,
      ),
    );

    // Update session
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            status: 'APPROVED',
            reviewedAt: 'Vừa xong',
            reviewer: currentUser,
            lecturerFeedback: note || 'Đạt chuẩn kiểm duyệt',
          };
        }
        return s;
      }),
    );

    // Award student points
    const currentSession = sessions.find((s) => s.id === sessionId);
    if (currentSession && autoPost) {
      createPost({
        type: 'QUESTION_APPROVED',
        content: `🎉 Chúc mừng ${currentSession.creator.name} đã được TS. Trần Minh Đức duyệt phiên câu hỏi môn ${currentSession.subject}: "${currentSession.title}" vào Ngân hàng đề thi chính thức!`,
        subjectTag: currentSession.subject,
        privacy: 'PUBLIC',
      });
    }

    showToast(
      'Đã phê duyệt câu hỏi thành công và thông báo cho sinh viên!',
      'success',
    );
  };

  const rejectSession = (
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
          return {
            ...s,
            status: 'REJECTED',
            reviewedAt: 'Vừa xong',
            reviewer: currentUser,
            lecturerFeedback: reason,
          };
        }
        return s;
      }),
    );

    showToast('Đã từ chối câu hỏi kèm lý do phản hồi cho sinh viên.', 'info');
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
    let conv = conversations.find((c) => c.partner.id === partnerUserId);
    if (!conv) {
      const partner = getUserById(partnerUserId);
      const newConv: Conversation = {
        id: 'conv_' + Date.now(),
        partner,
        lastMessage: 'Bắt đầu cuộc trò chuyện',
        lastMessageTime: 'Vừa xong',
        unreadCount: 0,
        messages: [],
      };
      setConversations([newConv, ...conversations]);
      conv = newConv;
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

  const sendMessage = (conversationId: string, text: string) => {
    if (!text.trim()) return;
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

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessage: text,
            lastMessageTime: newMessage.timestamp,
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      }),
    );
  };

  const recallMessage = (conversationId: string, messageId: string) => {
    setConversations((prev) =>
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
        login,
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
        editComment,
        deleteComment,
        deletePost,
        addLecturerNote,
        friendStatuses,
        setFriendStatuses,
        questions,
        answerQuestion,
        rateQuestion,
        updateQuestion,
        applyAIQuestionRefine,
        sessions,
        createProposeSession,
        approveSession,
        rejectSession,
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
