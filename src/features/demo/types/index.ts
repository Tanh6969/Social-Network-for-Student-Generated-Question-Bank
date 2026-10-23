export type Role = 'STUDENT' | 'LECTURER';
export type FriendStatus =
  'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';

export interface ImageCrop {
  x: number;
  y: number;
  zoom: number;
}

export interface ProfilePhotoHistoryItem {
  id: string;
  userId: string;
  kind: 'avatar' | 'cover';
  url: string;
  crop?: ImageCrop;
  savedAt: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  avatar: string;
  coverImage: string;
  avatarCrop?: ImageCrop;
  coverCrop?: ImageCrop;
  bio: string;
  faculty: string; // Khoa CNTT, v.v.
  classOrTitle: string; // K64 CNTT1 hoặc TS. Trưởng bộ môn
  points: number;
  approvedQuestionsCount: number;
  friendsCount: number;
  followersCount: number;
  isOnline: boolean;
  equippedFrameId?: string;
  equippedChatEffectId?: string;
  verifiedLecturer?: boolean;
}

export type PostType = 'KNOWLEDGE' | 'VIDEO' | 'QUESTION_APPROVED';

export interface PostDocument {
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface Post {
  id: string;
  author: User;
  type: PostType;
  content: string;
  subjectTag?: string;
  mediaUrls?: string[];
  documents?: PostDocument[];
  videoUrl?: string;
  linkedQuestionId?: string;
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  sharesCount: number;
  privacy: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';
  createdAt: string;
  lecturerNote?: {
    lecturerName: string;
    avatar: string;
    note: string;
    createdAt: string;
  };
  comments?: CommentItem[];
}

export interface CommentItem {
  id: string;
  author: User;
  content: string;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
  replies?: CommentItem[];
}

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionStatus = 'DRAFT' | 'PENDING' | 'NEED_EDIT' | 'APPROVED' | 'REJECTED' | 'AI_MODIFIED';

export interface Question {
  id: string;
  sessionId?: string;
  subject: string;
  chapter: string;
  content: string;
  imageUrl?: string;
  options: {
    id: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: QuestionDifficulty;
  status: QuestionStatus;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  rejectionReason?: string;
  isEditedByLecturer?: boolean;
  editedAt?: string;
  targetBankCategory?: string;
  studentPointsReserved?: number;
  inLecturerBank?: boolean;
  aiSuggestedChanges?: {
    originalContent: string;
    revisedContent: string;
    reason: string;
  };
  ratingAverage: number;
  ratingCount: number;
  totalAttempts: number;
  correctAttempts: number;
  optionDistribution?: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
  userRatedStars?: number;
}

export interface ProposeSession {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  creator: User;
  status: 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'PARTIAL_APPROVED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  questions: Question[];
  submittedAt: string;
  reviewedAt?: string;
  reviewer?: User;
  lecturerFeedback?: string;
  targetBankName?: string;
}

export interface ApiCallLog {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  title: string;
  timestamp: string;
  payload?: any;
  response?: any;
  statusCode: number;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  examCodes: string[]; // ['Mã đề 101', 'Mã đề 102']
  totalQuestions: number;
  durationMinutes: number;
  difficultyMatrix: {
    easy: number;
    medium: number;
    hard: number;
  };
  questions: Question[];
  createdAt: string;
  creator: User;
}

export interface Minigame {
  id: string;
  type: 'PARTICIPANTS' | 'APPROVED_QUESTIONS' | 'BANK_SIZE';
  title: string;
  description: string;
  currentValue: number;
  previousValue: number;
  status: 'OPEN' | 'CLOSED' | 'RESOLVED';
  closesInHours: number;
  rewardPoints: number;
  userGuess?: number;
  actualResult?: number;
  hasUserGuessed: boolean;
}

export interface LeaderboardUser {
  rank: number;
  user: User;
  score: number;
  weekContribution: number;
  badgeTitle: string;
}

export interface CosmeticItem {
  id: string;
  name: string;
  type: 'AVATAR_FRAME' | 'CHAT_EFFECT' | 'BADGE';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  description: string;
  borderStyle?: string;
  previewClass?: string;
  unlockCondition: string;
  progressCurrent: number;
  progressRequired: number;
  isUnlocked: boolean;
  isEquipped: boolean;
}

export interface FriendRelation {
  user: User;
  status: 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'FOLLOWING' | 'NONE';
  mutualFriendsCount: number;
}

export interface BlockedUserEntry {
  userId: string;
  blockedAt: string;
  reason?: string;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ';
  isRecalled?: boolean;
  effect?: string;
  attachmentUrl?: string;
}

export interface Conversation {
  id: string;
  partner: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isTyping?: boolean;
  messages: MessageItem[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type:
    | 'FRIEND_REQUEST'
    | 'QUESTION_APPROVED'
    | 'QUESTION_REJECTED'
    | 'LECTURER_NOTE'
    | 'MINIGAME_WIN'
    | 'POST_REACT'
    | 'SYSTEM';
  actor?: User;
  targetId?: string;
}

export type MainTab =
  | 'feed'
  | 'bank'
  | 'lecturer-bank'
  | 'propose'
  | 'watch'
  | 'game'
  | 'friends'
  | 'review'
  | 'messenger'
  | 'profile'
  | 'cosmetics'
  | 'settings'
  | 'exams'
  | 'search';
