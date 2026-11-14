import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import {
  Search,
  Send,
  Undo2,
  Shield,
  BellOff,
  Phone,
  Video,
  Ban,
  Unlock,
  User,
  Users,
  Plus,
  EyeOff,
  Eye,
  Lock,
  Trash2,
  LogOut,
  UserPlus,
  UserMinus,
  Crown,
  Edit3,
  X,
} from 'lucide-react';
import { Conversation } from '../../demo/types';
import { AutoScrollArea } from '../../../shared/components/AutoScrollArea';
import { chatStompClient, isApiSession } from '../../../api';

export const MessengerFullView: React.FC = () => {
  const {
    conversations,
    hiddenConversations,
    allUsers,
    currentUser,
    markConversationRead,
    sendMessage,
    recallMessage,
    loadConversationMessages,
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
    openReportModal,
    showToast,
    blockUser,
    unblockUser,
    isBlockedByMe,
    isBlockingMe,
    isBlockedEitherWay,
    isPresenceVisible,
    setViewingUserId,
    setActiveTab,
  } = useApp();

  const [activeConvId, setActiveConvId] = useState<string>(
    conversations[0]?.id || '',
  );
  const [inputText, setInputText] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD' | 'HIDDEN'>('ALL');
  const [searchPartner, setSearchPartner] = useState('');
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Modals for Group Chat & Hidden Chat PIN
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupTitleInput, setGroupTitleInput] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupTitle, setEditGroupTitle] = useState('');
  const [addMemberSelectId, setAddMemberSelectId] = useState('');

  const [showPinModal, setShowPinModal] = useState<'UNLOCK' | 'SET_PIN' | null>(
    null,
  );
  const [pinInput, setPinInput] = useState('');
  const [hiddenUnlocked, setHiddenUnlocked] = useState(false);

  const sourceList =
    filterTab === 'HIDDEN' ? hiddenConversations : conversations;

  const filteredConversations = sourceList.filter((c) => {
    if (filterTab === 'UNREAD' && c.unreadCount === 0) return false;
    if (
      searchPartner.trim() &&
      !c.partner.name.toLowerCase().includes(searchPartner.trim().toLowerCase())
    )
      return false;
    return true;
  });

  const activeConv: Conversation | undefined =
    sourceList.find((c) => c.id === activeConvId) ||
    conversations.find((c) => c.id === activeConvId) ||
    filteredConversations[0] ||
    conversations[0];
  const activeConvIdToRead = activeConv?.id;
  const isGroupConv = activeConv?.type === 'GROUP';

  useEffect(() => {
    if (!activeConvIdToRead) return;
    markConversationRead(activeConvIdToRead);
    void loadConversationMessages(activeConvIdToRead);
    if (activeConv?.type === 'GROUP') {
      void loadGroupMembers(activeConvIdToRead);
    }
    // Chỉ chạy khi đổi cuộc trò chuyện đang chọn, không gọi lại mỗi khi state hội thoại thay đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvIdToRead, activeConv?.type]);

  // Subscribe to realtime STOMP typing indicator for active conversation
  useEffect(() => {
    if (!activeConvIdToRead || !isApiSession()) {
      setTypingUserName(null);
      return;
    }
    const convNum = Number(activeConvIdToRead);
    if (!Number.isFinite(convNum) || convNum <= 0) return;

    const unsubscribe = chatStompClient.subscribeTyping(convNum, (evt) => {
      if (String(evt.user_id) === currentUser.id) return;
      if (evt.is_typing) {
        setTypingUserName(evt.full_name || evt.user_name || 'Ai đó');
      } else {
        setTypingUserName(null);
      }
    });
    return () => {
      unsubscribe();
      setTypingUserName(null);
    };
  }, [activeConvIdToRead, currentUser.id]);

  const isPartnerBlocked =
    activeConv && !isGroupConv
      ? isBlockedEitherWay(activeConv.partner.id)
      : false;
  const isPartnerBlockedByMe =
    activeConv && !isGroupConv ? isBlockedByMe(activeConv.partner.id) : false;
  const isPartnerBlockingMe =
    activeConv && !isGroupConv ? isBlockingMe(activeConv.partner.id) : false;

  const handleInputChange = (value: string) => {
    setInputText(value);
    if (!activeConv) return;
    sendTyping(activeConv.id, value.trim().length > 0);
    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      sendTyping(activeConv.id, false);
    }, 2000);
  };

  const handleSend = () => {
    if (inputText.trim() && activeConv && !isPartnerBlocked) {
      sendMessage(activeConv.id, inputText);
      sendTyping(activeConv.id, false);
      setInputText('');
    }
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitleInput.trim()) return;
    const created = await createGroupChat(groupTitleInput, selectedMemberIds);
    if (created) {
      setActiveConvId(created.id);
      setShowCreateGroupModal(false);
      setGroupTitleInput('');
      setSelectedMemberIds([]);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    if (showPinModal === 'SET_PIN') {
      const ok = await setHiddenChatPin(pinInput.trim());
      if (ok) {
        setShowPinModal(null);
        setPinInput('');
      }
    } else if (showPinModal === 'UNLOCK') {
      const ok = await unlockHiddenConversations(pinInput.trim());
      if (ok) {
        setHiddenUnlocked(true);
        setFilterTab('HIDDEN');
        setShowPinModal(null);
        setPinInput('');
      }
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 my-2">
      <div className="h-[calc(100vh-5rem)] flex bg-fb-card rounded-lg shadow-fb-card overflow-hidden">
        {/* ================= CỘT TRÁI (360px): Danh sách hội thoại ================= */}
        <aside className="w-80 md:w-90 shrink-0 border-r border-fb-divider flex flex-col select-none">
          <div className="p-4 border-b border-fb-divider space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-fb-text">Đoạn chat</h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(true)}
                  title="Tạo nhóm chat mới"
                  className="p-2 rounded-full bg-fb-input hover:bg-fb-btn-hover text-fb-text transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPinInput('');
                    setShowPinModal('SET_PIN');
                  }}
                  title="Thiết lập mã PIN ẩn đoạn chat"
                  className="p-2 rounded-full bg-fb-input hover:bg-fb-btn-hover text-fb-text transition"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-fb-text-3 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm kiếm trong Messenger..."
                value={searchPartner}
                onChange={(e) => setSearchPartner(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-fb-input rounded-full border border-fb-divider"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs font-bold">
              <button
                onClick={() => setFilterTab('ALL')}
                className={`px-3 py-1 rounded-full transition ${
                  filterTab === 'ALL'
                    ? 'bg-fb-blue text-white'
                    : 'bg-fb-input text-fb-text-2'
                }`}
              >
                Hộp thư
              </button>
              <button
                onClick={() => setFilterTab('UNREAD')}
                className={`px-3 py-1 rounded-full transition ${
                  filterTab === 'UNREAD'
                    ? 'bg-fb-blue text-white'
                    : 'bg-fb-input text-fb-text-2'
                }`}
              >
                Chưa đọc
              </button>
              <button
                onClick={() => {
                  if (!hiddenUnlocked && isApiSession()) {
                    setPinInput('');
                    setShowPinModal('UNLOCK');
                  } else {
                    setFilterTab('HIDDEN');
                  }
                }}
                className={`px-3 py-1 rounded-full transition flex items-center gap-1 ${
                  filterTab === 'HIDDEN'
                    ? 'bg-fb-blue text-white'
                    : 'bg-fb-input text-fb-text-2'
                }`}
              >
                <EyeOff className="w-3 h-3" />
                <span>Đã ẩn</span>
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-fb-divider p-2 space-y-1">
            {filteredConversations.map((conv) => {
              const blocked =
                conv.type !== 'GROUP' && isBlockedEitherWay(conv.partner.id);
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                    activeConv?.id === conv.id
                      ? 'bg-fb-blue-soft'
                      : 'hover:bg-fb-hover'
                  }`}
                >
                  <AvatarWithFrame user={conv.partner} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-bold text-xs text-fb-text truncate flex items-center gap-1.5">
                        <span>{conv.partner.name}</span>
                        {conv.type === 'GROUP' && (
                          <span className="text-[10px] bg-fb-blue-soft text-fb-blue px-1.5 py-0.2 rounded-full font-bold">
                            Nhóm
                          </span>
                        )}
                        {blocked && (
                          <span className="text-xs bg-fb-danger-soft text-fb-danger px-1.5 py-0.2 rounded-full font-bold">
                            Đã chặn
                          </span>
                        )}
                      </p>
                      <span className="text-xs text-fb-text-3">
                        {conv.lastMessageTime}
                      </span>
                    </div>
                    <p className="text-xs text-fb-text-2 truncate">
                      {blocked
                        ? 'Hai người hiện không thể nhắn tin cho nhau'
                        : conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-fb-blue text-white text-[10px] font-bold flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ================= CỘT GIỮA: Khung chat ================= */}
        <main className="flex-1 flex flex-col min-w-0 bg-fb-inset">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="h-16 px-4 bg-fb-card border-b border-fb-divider flex items-center justify-between shadow-2xs">
                <div
                  onClick={() => {
                    if (!isGroupConv) {
                      setViewingUserId(activeConv.partner.id);
                      setActiveTab('profile');
                    }
                  }}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <AvatarWithFrame user={activeConv.partner} size="md" />
                  <div>
                    <h3 className="font-bold text-sm text-fb-text hover:underline">
                      {activeConv.partner.name}
                    </h3>
                    {isPartnerBlocked ? (
                      <span className="text-xs text-fb-danger font-semibold">
                        Không thể liên lạc (Đang chặn)
                      </span>
                    ) : typingUserName ? (
                      <span className="text-xs text-fb-blue font-medium animate-pulse">
                        {typingUserName} đang nhập tin nhắn...
                      </span>
                    ) : isGroupConv ? (
                      <span className="text-xs text-fb-text-2">
                        {activeConv.members?.length || 1} thành viên
                      </span>
                    ) : (
                      activeConv.partner.isOnline &&
                      isPresenceVisible(activeConv.partner.id) && (
                        <span className="text-xs text-fb-success font-medium">
                          Đang hoạt động
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-fb-blue">
                  <button
                    disabled={isPartnerBlocked}
                    onClick={() =>
                      showToast('Tính năng gọi thoại đang kết nối...', 'info')
                    }
                    className="p-2 rounded-full hover:bg-fb-hover disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    disabled={isPartnerBlocked}
                    onClick={() =>
                      showToast('Tính năng gọi video đang kết nối...', 'info')
                    }
                    className="p-2 rounded-full hover:bg-fb-hover disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <AutoScrollArea
                scrollKey={activeConv.id}
                latestKey={
                  activeConv.messages[activeConv.messages.length - 1]?.id
                }
                followLatest={
                  activeConv.messages[activeConv.messages.length - 1]
                    ?.senderId === currentUser.id
                }
                className="flex-1 p-4 overflow-y-auto space-y-3 text-xs"
              >
                {activeConv.messages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 max-w-[70%]">
                        {!msg.isRecalled && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                            {isMine && (
                              <button
                                onClick={() =>
                                  recallMessage(
                                    activeConv.id,
                                    msg.id,
                                    'EVERYONE',
                                  )
                                }
                                className="text-fb-text-3 hover:text-fb-danger p-1"
                                title="Thu hồi với mọi người (EVERYONE)"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                recallMessage(activeConv.id, msg.id, 'ME')
                              }
                              className="text-fb-text-3 hover:text-fb-danger p-1"
                              title="Xóa ở phía tôi (ME)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div
                          className={`p-3 rounded-lg ${
                            msg.isRecalled
                              ? 'bg-fb-btn text-fb-text-2 italic'
                              : isMine
                                ? 'bg-fb-blue text-white rounded-br-xs shadow-fb-card'
                                : 'bg-fb-card text-fb-text rounded-bl-xs shadow-xs'
                          } ${
                            msg.effect === 'effect_glow' && isMine
                              ? 'ring-2 ring-fb-blue/30 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                              : ''
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                      <span className="text-xs text-fb-text-3 mt-0.5 px-1">
                        {msg.timestamp} {isMine && '✓'}
                      </span>
                    </div>
                  );
                })}
              </AutoScrollArea>

              {/* Input Footer hoặc Thông báo bị chặn */}
              {isPartnerBlocked ? (
                <div className="p-4 bg-fb-danger-soft/80 border-t border-fb-danger/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-fb-danger">
                    <Ban className="w-4 h-4 shrink-0" />
                    <span>
                      {isPartnerBlockedByMe
                        ? `Bạn đã chặn ${activeConv.partner.name}. Hai người không thể trao đổi tin nhắn hoặc xem trang cá nhân của nhau.`
                        : `Bạn hiện không thể gửi tin nhắn cho ${activeConv.partner.name} do người này đã chặn bạn.`}
                    </span>
                  </div>
                  {isPartnerBlockedByMe && (
                    <button
                      type="button"
                      onClick={() => unblockUser(activeConv.partner.id)}
                      className="px-3.5 py-1.5 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg font-bold shrink-0 flex items-center gap-1.5 transition"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Bỏ chặn</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-fb-card border-t border-fb-divider flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Aa (Nhập tin nhắn trao đổi bài học...)"
                    value={inputText}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSend();
                    }}
                    className="flex-1 bg-fb-input text-xs px-4 py-2.5 rounded-full border border-fb-divider"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className="p-2.5 rounded-full bg-fb-blue text-white disabled:bg-fb-divider transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-fb-text-3">
              Chọn một đoạn chat để bắt đầu trò chuyện
            </div>
          )}
        </main>

        {/* ================= CỘT PHẢI (320px): Thông tin hội thoại ================= */}
        <aside className="hidden lg:flex w-80 shrink-0 border-l border-fb-divider flex-col p-5 space-y-4 select-none bg-fb-card overflow-y-auto">
          {activeConv && (
            <>
              <div className="flex flex-col items-center text-center pb-4 border-b border-fb-divider">
                <AvatarWithFrame user={activeConv.partner} size="xl" />
                <h4 className="font-bold text-sm text-fb-text mt-2">
                  {activeConv.partner.name}
                </h4>
                <p className="text-xs text-fb-text-2">
                  {activeConv.partner.classOrTitle}
                </p>
                <p className="text-xs text-fb-text-3">
                  {activeConv.partner.faculty}
                </p>
              </div>

              <div className="space-y-2 text-xs font-semibold text-fb-text">
                {!isGroupConv && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewingUserId(activeConv.partner.id);
                      setActiveTab('profile');
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-fb-hover transition"
                  >
                    <User className="w-4 h-4 text-fb-text-2" />
                    <span>Xem trang cá nhân</span>
                  </button>
                )}

                {isGroupConv && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditGroupTitle(activeConv.partner.name);
                        setShowEditGroupModal(true);
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-fb-hover transition"
                    >
                      <Edit3 className="w-4 h-4 text-fb-text-2" />
                      <span>Đổi tên & Quản lý nhóm</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void leaveGroupChat(activeConv.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-fb-danger-soft text-fb-danger transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Rời nhóm chat</span>
                    </button>
                  </>
                )}

                {activeConv.isHidden ? (
                  <button
                    type="button"
                    onClick={() => void unhideChatConversation(activeConv.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-fb-hover transition"
                  >
                    <Eye className="w-4 h-4 text-fb-text-2" />
                    <span>Bỏ ẩn đoạn chat</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void hideChatConversation(activeConv.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-fb-hover transition"
                  >
                    <EyeOff className="w-4 h-4 text-fb-text-2" />
                    <span>Ẩn đoạn chat</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    showToast(
                      'Đã tắt thông báo đoạn chat này trong 8 giờ',
                      'info',
                    )
                  }
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-fb-hover transition"
                >
                  <BellOff className="w-4 h-4 text-fb-text-2" />
                  <span>Tắt thông báo</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openReportModal(
                      'ĐOẠN CHAT',
                      activeConv.id,
                      activeConv.partner.name,
                    )
                  }
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-fb-warning-soft text-fb-warning transition"
                >
                  <Shield className="w-4 h-4" />
                  <span>Báo cáo cuộc trò chuyện</span>
                </button>

                {!isGroupConv &&
                  (isPartnerBlockedByMe ? (
                    <button
                      type="button"
                      onClick={() => unblockUser(activeConv.partner.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg bg-fb-blue-soft text-fb-blue font-bold transition"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Bỏ chặn {activeConv.partner.name}</span>
                    </button>
                  ) : (
                    !isPartnerBlockingMe && (
                      <button
                        type="button"
                        onClick={() =>
                          blockUser(
                            activeConv.partner.id,
                            'Chặn từ khung chat Messenger',
                          )
                        }
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-fb-danger-soft text-fb-danger font-bold transition"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Chặn {activeConv.partner.name}</span>
                      </button>
                    )
                  ))}
              </div>

              {isGroupConv && activeConv.members && (
                <div className="pt-3 border-t border-fb-divider space-y-2 text-xs">
                  <p className="font-bold text-fb-text flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-fb-blue" />
                    <span>Thành viên nhóm ({activeConv.members.length})</span>
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {activeConv.members.map((m) => (
                      <div
                        key={m.userId}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-fb-inset"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-fb-text truncate">
                            {m.name}
                          </p>
                          <span className="text-[10px] text-fb-text-2">
                            {m.role}
                          </span>
                        </div>
                        {m.userId !== currentUser.id && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                void updateGroupMemberRole(
                                  activeConv.id,
                                  m.userId,
                                  m.role === 'VILLAGE_ELDER'
                                    ? 'VILLAGER'
                                    : 'VILLAGE_ELDER',
                                )
                              }
                              title="Đổi quyền Già làng / Dân làng"
                              className="p-1 rounded hover:bg-fb-hover text-fb-blue"
                            >
                              <Crown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void removeMemberFromGroup(
                                  activeConv.id,
                                  m.userId,
                                )
                              }
                              title="Xóa khỏi nhóm"
                              className="p-1 rounded hover:bg-fb-danger-soft text-fb-danger"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </aside>
      </div>

      {/* Modal Tạo Nhóm Chat */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-fb-card rounded-lg max-w-md w-full p-5 shadow-2xl border border-fb-divider space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-fb-divider pb-3">
              <h3 className="font-bold text-sm text-fb-text flex items-center gap-2">
                <Users className="w-4 h-4 text-fb-blue" />
                <span>Tạo nhóm học tập mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1 rounded-full hover:bg-fb-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => void handleCreateGroupSubmit(e)}
              className="space-y-3"
            >
              <div>
                <label className="block font-bold text-fb-text mb-1">
                  Tên nhóm chat:
                </label>
                <input
                  type="text"
                  value={groupTitleInput}
                  onChange={(e) => setGroupTitleInput(e.target.value)}
                  placeholder="VD: Ôn thi Giải tích 1..."
                  className="w-full p-2 rounded-lg bg-fb-input border border-fb-divider"
                />
              </div>

              <div>
                <label className="block font-bold text-fb-text mb-1">
                  Chọn thành viên ({selectedMemberIds.length}):
                </label>
                <div className="max-h-44 overflow-y-auto space-y-1 p-2 rounded-lg bg-fb-inset border border-fb-divider">
                  {allUsers.map((u) => {
                    const checked = selectedMemberIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-fb-hover cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setSelectedMemberIds((prev) =>
                              e.target.checked
                                ? [...prev, u.id]
                                : prev.filter((id) => id !== u.id),
                            )
                          }
                        />
                        <span className="font-semibold text-fb-text">
                          {u.name}
                        </span>
                        <span className="text-fb-text-2">
                          ({u.classOrTitle})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 rounded-lg bg-fb-input font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-fb-blue text-white font-bold"
                >
                  Tạo nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đổi tên & Thêm thành viên nhóm */}
      {showEditGroupModal && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-fb-card rounded-lg max-w-md w-full p-5 shadow-2xl border border-fb-divider space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-fb-divider pb-3">
              <h3 className="font-bold text-sm text-fb-text">
                Quản lý nhóm chat
              </h3>
              <button
                type="button"
                onClick={() => setShowEditGroupModal(false)}
                className="p-1 rounded-full hover:bg-fb-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-fb-text">
                Đổi tên nhóm:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editGroupTitle}
                  onChange={(e) => setEditGroupTitle(e.target.value)}
                  className="flex-1 p-2 rounded-lg bg-fb-input border border-fb-divider"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (editGroupTitle.trim()) {
                      void updateGroupChat(activeConv.id, {
                        name: editGroupTitle.trim(),
                      });
                      setShowEditGroupModal(false);
                    }
                  }}
                  className="px-3.5 py-2 rounded-lg bg-fb-blue text-white font-bold"
                >
                  Lưu
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-fb-divider">
              <label className="block font-bold text-fb-text">
                Thêm thành viên vào nhóm:
              </label>
              <div className="flex gap-2">
                <select
                  value={addMemberSelectId}
                  onChange={(e) => setAddMemberSelectId(e.target.value)}
                  className="flex-1 p-2 rounded-lg bg-fb-input border border-fb-divider"
                >
                  <option value="">-- Chọn người dùng --</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.classOrTitle})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!addMemberSelectId}
                  onClick={() => {
                    if (addMemberSelectId) {
                      void addMembersToGroup(activeConv.id, [
                        addMemberSelectId,
                      ]);
                      setAddMemberSelectId('');
                    }
                  }}
                  className="px-3.5 py-2 rounded-lg bg-fb-blue text-white font-bold disabled:opacity-50 flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal PIN Đoạn Chat Ẩn */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-fb-card rounded-lg max-w-sm w-full p-5 shadow-2xl border border-fb-divider space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-fb-divider pb-3">
              <h3 className="font-bold text-sm text-fb-text flex items-center gap-2">
                <Lock className="w-4 h-4 text-fb-blue" />
                <span>
                  {showPinModal === 'SET_PIN'
                    ? 'Thiết lập mã PIN đoạn chat ẩn'
                    : 'Mở khóa đoạn chat ẩn'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPinModal(null)}
                className="p-1 rounded-full hover:bg-fb-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => void handlePinSubmit(e)}
              className="space-y-3"
            >
              <div>
                <label className="block font-bold text-fb-text mb-1">
                  Nhập mã PIN (6 chữ số):
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="******"
                  className="w-full p-2.5 text-center tracking-widest text-sm rounded-lg bg-fb-input border border-fb-divider"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(null)}
                  className="px-4 py-2 rounded-lg bg-fb-input font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-fb-blue text-white font-bold"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
