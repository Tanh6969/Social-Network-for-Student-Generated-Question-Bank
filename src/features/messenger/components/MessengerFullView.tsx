import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { Conversation } from '../../demo/types';
import { AutoScrollArea } from '../../../shared/components/AutoScrollArea';

export const MessengerFullView: React.FC = () => {
  const {
    conversations,
    currentUser,
    markConversationRead,
    sendMessage,
    sessionKind,
    chatConnectionError,
    loadChatMessages,
    loadOlderChatMessages,
    olderChatMessagesAvailable,
    loadMoreConversations,
    moreConversationsAvailable,
    recallMessage,
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
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [searchPartner, setSearchPartner] = useState('');

  const filteredConversations = conversations.filter((c) => {
    if (filterTab === 'UNREAD' && c.unreadCount === 0) return false;
    if (
      searchPartner.trim() &&
      !c.partner.name.toLowerCase().includes(searchPartner.trim().toLowerCase())
    )
      return false;
    return true;
  });

  const activeConv: Conversation | undefined =
    conversations.find((c) => c.id === activeConvId) ||
    filteredConversations[0] ||
    conversations[0];
  const activeConvIdToRead = activeConv?.id;

  useEffect(() => {
    if (activeConvIdToRead) markConversationRead(activeConvIdToRead);
  }, [activeConvIdToRead, markConversationRead]);

  useEffect(() => {
    if (sessionKind === 'api' && activeConvIdToRead) loadChatMessages(activeConvIdToRead);
    // Chỉ tải khi đổi hội thoại, không tải lặp theo mỗi lần context render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKind, activeConvIdToRead]);

  const isPartnerBlocked = activeConv
    ? isBlockedEitherWay(activeConv.partner.id)
    : false;
  const isPartnerBlockedByMe = activeConv
    ? isBlockedByMe(activeConv.partner.id)
    : false;
  const isPartnerBlockingMe = activeConv
    ? isBlockingMe(activeConv.partner.id)
    : false;

  const handleSend = async () => {
    if (inputText.trim() && activeConv && !isPartnerBlocked) {
      if (await sendMessage(activeConv.id, inputText)) setInputText('');
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 my-2">
      <div className="h-[calc(100vh-5rem)] flex bg-fb-card rounded-lg shadow-fb-card overflow-hidden">
        {/* ================= CỘT TRÁI (360px): Danh sách hội thoại ================= */}
        <aside className="w-80 md:w-90 shrink-0 border-r border-fb-divider flex flex-col select-none">
          <div className="p-4 border-b border-fb-divider space-y-3">
            <h2 className="text-xl font-bold text-fb-text">
              Đoạn chat
            </h2>
            {chatConnectionError && sessionKind === 'api' &&
              <p role="alert" className="text-xs text-fb-danger">{chatConnectionError}</p>}
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

            <div className="flex gap-2 text-xs font-bold">
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
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-fb-divider p-2 space-y-1">
            {filteredConversations.map((conv) => {
              const blocked = isBlockedEitherWay(conv.partner.id);
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
                </div>
              );
            })}
            {moreConversationsAvailable && <button type="button" onClick={loadMoreConversations}
              className="w-full p-3 text-center text-xs font-semibold text-fb-blue">Xem thêm hội thoại</button>}
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
                    if (activeConv.isGroup) return;
                    setViewingUserId(activeConv.partner.id);
                    setActiveTab('profile');
                  }}
                  className={`flex items-center gap-3 ${activeConv.isGroup ? '' : 'cursor-pointer'}`}
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
                  {sessionKind !== 'api' && <button
                    disabled={isPartnerBlocked}
                    onClick={() =>
                      showToast('Tính năng gọi thoại đang kết nối...', 'info')
                    }
                    className="p-2 rounded-full hover:bg-fb-hover disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Phone className="w-4 h-4" />
                  </button>}
                  {sessionKind !== 'api' && <button
                    disabled={isPartnerBlocked}
                    onClick={() =>
                      showToast('Tính năng gọi video đang kết nối...', 'info')
                    }
                    className="p-2 rounded-full hover:bg-fb-hover disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Video className="w-4 h-4" />
                  </button>}
                </div>
              </div>

              {/* Messages Body */}
              <AutoScrollArea
                scrollKey={activeConv.id}
                latestKey={activeConv.messages[activeConv.messages.length - 1]?.id}
                followLatest={activeConv.messages[activeConv.messages.length - 1]?.senderId === currentUser.id}
                className="flex-1 p-4 overflow-y-auto space-y-3 text-xs"
              >
                {olderChatMessagesAvailable[activeConv.id] &&
                  <button type="button" onClick={() => loadOlderChatMessages(activeConv.id)}
                    className="block w-full py-2 text-center font-semibold text-fb-blue">Xem tin nhắn cũ hơn</button>}
                {activeConv.messages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 max-w-[70%]">
                        {isMine && !msg.isRecalled && (
                          <button
                            onClick={() => recallMessage(activeConv.id, msg.id)}
                            className="opacity-0 group-hover:opacity-100 text-fb-text-3 hover:text-fb-danger p-1"
                            title="Thu hồi tin nhắn"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
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

              {/* Input Footer hoặc Thông báo bị chặn (Slide 24: hai người không thể trao đổi tin nhắn với nhau được nữa) */}
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
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleSend();
                    }}
                    className="flex-1 bg-fb-input text-xs px-4 py-2.5 rounded-full border border-fb-divider"
                  />
                  <button
                    onClick={() => void handleSend()}
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
        <aside className="hidden lg:flex w-80 shrink-0 border-l border-fb-divider flex-col p-5 space-y-4 select-none bg-fb-card">
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
                {!activeConv.isGroup && <button
                  type="button"
                  onClick={() => {
                    setViewingUserId(activeConv.partner.id);
                    setActiveTab('profile');
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-fb-hover transition"
                >
                  <User className="w-4 h-4 text-fb-text-2" />
                  <span>Xem trang cá nhân</span>
                </button>}

                {sessionKind !== 'api' && <button
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
                </button>}

                {sessionKind !== 'api' && <button
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
                </button>}

                {activeConv.isGroup ? null : isPartnerBlockedByMe ? (
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
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};
