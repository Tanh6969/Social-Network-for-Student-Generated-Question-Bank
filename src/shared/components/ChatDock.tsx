import React, { useEffect, useState } from 'react';
import { useApp } from '../../features/demo/context/AppContext';
import { AvatarWithFrame } from './AvatarWithFrame';
import { AutoScrollArea } from './AutoScrollArea';
import {
  X,
  Minus,
  Send,
  MoreVertical,
  Undo2,
  Trash2,
  Ban,
  Unlock,
} from 'lucide-react';

export const ChatDock: React.FC = () => {
  const {
    conversations,
    activeDockIds,
    minimizedDockIds,
    closeChatDock,
    minimizeChatDock,
    restoreChatDock,
    sendMessage,
    recallMessage,
    loadConversationMessages,
    sendTyping,
    currentUser,
    blockUser,
    unblockUser,
    isBlockedByMe,
    isBlockedEitherWay,
    isPresenceVisible,
    setViewingUserId,
    setActiveTab,
  } = useApp();

  const [inputTexts, setInputTexts] = useState<Record<string, string>>({});
  const [sendingIds, setSendingIds] = useState<string[]>([]);
  const [activeMessageMenu, setActiveMessageMenu] = useState<{
    convId: string;
    msgId: string;
  } | null>(null);

  const activeDockKey = activeDockIds.join(',');
  useEffect(() => {
    activeDockIds.forEach((convId) => {
      void loadConversationMessages(convId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDockKey]);

  const handleSend = async (convId: string) => {
    const text = inputTexts[convId] || '';
    if (!text.trim() || sendingIds.includes(convId)) return;
    setSendingIds((prev) => [...prev, convId]);
    try {
      const sent = await sendMessage(convId, text);
      if (sent) {
        sendTyping(convId, false);
        setInputTexts((prev) => ({ ...prev, [convId]: '' }));
      }
    } finally {
      setSendingIds((prev) => prev.filter((id) => id !== convId));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, convId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend(convId);
    }
  };

  return (
    <div className="fixed bottom-0 right-4 z-40 flex items-end gap-3 pointer-events-none">
      {/* Minimized Avatars Bubbles */}
      <div className="flex flex-col gap-2 pb-2 pointer-events-auto">
        {minimizedDockIds.map((convId) => {
          const conv = conversations.find((c) => c.id === convId);
          if (!conv) return null;
          return (
            <div
              key={convId}
              onClick={() => restoreChatDock(convId)}
              className="relative cursor-pointer group hover:scale-105 transition-transform"
              title={`Mở lại đoạn chat với ${conv.partner.name}`}
            >
              <AvatarWithFrame user={conv.partner} size="lg" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeChatDock(convId);
                }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-gray-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm text-xs"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Active Floating Chat Windows */}
      {activeDockIds.map((convId) => {
        const conv = conversations.find((c) => c.id === convId);
        if (!conv) return null;

        const isGroup = conv.type === 'GROUP';
        const isBlocked = !isGroup && isBlockedEitherWay(conv.partner.id);
        const blockedByMe = !isGroup && isBlockedByMe(conv.partner.id);

        return (
          <div
            key={convId}
            className="pointer-events-auto flex h-[420px] w-[328px] flex-col overflow-hidden rounded-t-xl border border-fb-divider bg-fb-card shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
          >
            {/* Header */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-fb-divider bg-fb-card px-3">
              <div
                onClick={() => {
                  if (!isGroup) {
                    setViewingUserId(conv.partner.id);
                    setActiveTab('profile');
                  }
                }}
                className="flex min-w-0 items-center gap-2 cursor-pointer"
              >
                <AvatarWithFrame user={conv.partner} size="md" />
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold leading-tight text-fb-text hover:underline">
                    {conv.partner.name}
                  </h4>
                  {isBlocked ? (
                    <span className="mt-0.5 block text-[11px] font-semibold text-fb-danger">
                      Không thể nhắn tin
                    </span>
                  ) : (
                    conv.partner.isOnline &&
                    isPresenceVisible(conv.partner.id) && (
                      <span className="mt-0.5 block text-[11px] font-medium text-fb-success">
                        Đang hoạt động
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="ml-2 flex shrink-0 items-center gap-0.5 text-fb-text-2">
                {!isBlocked && !isGroup && (
                  <button
                    onClick={() =>
                      blockUser(conv.partner.id, 'Chặn từ cửa sổ Chat Dock')
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-fb-hover hover:text-fb-danger transition"
                    title={`Chặn ${conv.partner.name}`}
                  >
                    <Ban className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => minimizeChatDock(convId)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-fb-hover transition"
                  title="Thu nhỏ"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => closeChatDock(convId)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-fb-hover transition"
                  title="Đóng chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Message Body */}
            <AutoScrollArea
              scrollKey={conv.id}
              latestKey={conv.messages[conv.messages.length - 1]?.id}
              followLatest={
                conv.messages[conv.messages.length - 1]?.senderId ===
                currentUser.id
              }
              className="flex-1 overflow-y-auto px-3 py-3 text-sm"
            >
              {conv.messages.map((msg) => {
                const isMine = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`group mb-2 flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`flex max-w-[82%] items-center gap-1 ${
                        isMine ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {!msg.isRecalled && (
                        <div className="relative shrink-0 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                          <button
                            onClick={() =>
                              setActiveMessageMenu(
                                activeMessageMenu?.msgId === msg.id
                                  ? null
                                  : { convId, msgId: msg.id },
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full text-fb-text-3 hover:bg-fb-hover"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {activeMessageMenu?.msgId === msg.id && (
                            <div
                              className={`absolute bottom-8 z-10 w-36 rounded-lg border border-fb-divider bg-fb-card py-1 shadow-lg ${
                                isMine ? 'right-0' : 'left-0'
                              }`}
                            >
                              {isMine && (
                                <button
                                  onClick={() => {
                                    recallMessage(
                                      convId,
                                      msg.id,
                                      'EVERYONE',
                                    );
                                    setActiveMessageMenu(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-fb-danger hover:bg-fb-danger-soft"
                                >
                                  <Undo2 className="h-3.5 w-3.5" /> Thu hồi tin
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  recallMessage(convId, msg.id, 'ME');
                                  setActiveMessageMenu(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-fb-text hover:bg-fb-hover"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Xóa ở phía tôi
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div
                        className={`max-w-full break-words px-3 py-2 leading-[1.35] ${
                          msg.isRecalled
                            ? 'rounded-2xl bg-fb-btn text-fb-text-2 italic'
                            : isMine
                              ? 'rounded-2xl rounded-br-md bg-fb-blue text-white'
                              : 'rounded-2xl rounded-bl-md bg-fb-btn text-fb-text'
                        } ${
                          msg.effect === 'effect_glow' && isMine
                            ? 'ring-1 ring-fb-blue/30 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                            : ''
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                    <span
                      className={`mt-1 px-1 text-[11px] leading-none text-fb-text-3 ${
                        isMine ? 'text-right' : 'text-left'
                      }`}
                    >
                      {msg.timestamp}
                      {isMine && !msg.isRecalled && ' · Đã gửi'}
                    </span>
                  </div>
                );
              })}
            </AutoScrollArea>

            {/* Input Bar hoặc Thông báo bị chặn (Slide 24) */}
            {isBlocked ? (
              <div className="p-2.5 bg-fb-danger-soft border-t border-fb-danger/30 text-xs text-fb-danger flex items-center justify-between gap-2">
                <span className="leading-tight">
                  {blockedByMe
                    ? `Đã chặn ${conv.partner.name}. Hai người không thể nhắn tin.`
                    : 'Không thể gửi tin nhắn cho người này.'}
                </span>
                {blockedByMe && (
                  <button
                    type="button"
                    onClick={() => unblockUser(conv.partner.id)}
                    className="px-2.5 py-1 bg-fb-blue hover:bg-fb-blue-hover text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                  >
                    <Unlock className="w-3 h-3" /> Bỏ chặn
                  </button>
                )}
              </div>
            ) : (
              <div className="flex shrink-0 items-center gap-2 border-t border-fb-divider bg-fb-card px-3 py-2">
                <input
                  type="text"
                  placeholder="Aa"
                  value={inputTexts[convId] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInputTexts((prev) => ({
                      ...prev,
                      [convId]: val,
                    }));
                    sendTyping(convId, val.trim().length > 0);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, convId)}
                  className="h-9 min-w-0 flex-1 rounded-full border-0 bg-fb-input px-3 text-sm text-fb-text outline-none placeholder:text-fb-text-2 focus:ring-1 focus:ring-fb-blue"
                />
                <button
                  onClick={() => void handleSend(convId)}
                  disabled={
                    !inputTexts[convId]?.trim() || sendingIds.includes(convId)
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-fb-blue transition hover:bg-fb-blue-soft disabled:text-fb-text-3 disabled:hover:bg-transparent"
                  aria-label="Gửi tin nhắn"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
