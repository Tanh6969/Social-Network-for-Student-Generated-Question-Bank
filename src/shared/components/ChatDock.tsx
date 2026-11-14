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

  const handleSend = (convId: string) => {
    const text = inputTexts[convId] || '';
    if (text.trim()) {
      sendMessage(convId, text);
      sendTyping(convId, false);
      setInputTexts((prev) => ({ ...prev, [convId]: '' }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, convId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(convId);
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
            className="w-80 sm:w-84 h-96 bg-fb-card rounded-t-2xl shadow-2xl border border-fb-divider flex flex-col pointer-events-auto overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
          >
            {/* Header */}
            <div className="px-3 py-2.5 bg-fb-card border-b border-fb-divider flex items-center justify-between shadow-2xs">
              <div
                onClick={() => {
                  if (!isGroup) {
                    setViewingUserId(conv.partner.id);
                    setActiveTab('profile');
                  }
                }}
                className="flex items-center gap-2 truncate cursor-pointer"
              >
                <AvatarWithFrame user={conv.partner} size="sm" />
                <div className="truncate">
                  <h4 className="font-bold text-xs text-fb-text hover:underline truncate">
                    {conv.partner.name}
                  </h4>
                  {isBlocked ? (
                    <span className="text-xs text-fb-danger font-semibold">
                      Không thể nhắn tin
                    </span>
                  ) : (
                    conv.partner.isOnline &&
                    isPresenceVisible(conv.partner.id) && (
                      <span className="text-xs text-fb-success font-medium">
                        Đang hoạt động
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 text-fb-text-2">
                {!isBlocked && !isGroup && (
                  <button
                    onClick={() =>
                      blockUser(conv.partner.id, 'Chặn từ cửa sổ Chat Dock')
                    }
                    className="p-1 hover:bg-fb-danger-soft hover:text-fb-danger rounded-full transition"
                    title={`Chặn ${conv.partner.name}`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => minimizeChatDock(convId)}
                  className="p-1 hover:bg-fb-hover rounded-full transition"
                  title="Thu nhỏ"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => closeChatDock(convId)}
                  className="p-1 hover:bg-fb-hover rounded-full transition"
                  title="Đóng chat"
                >
                  <X className="w-4 h-4" />
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
              className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs bg-fb-inset"
            >
              {conv.messages.map((msg) => {
                const isMine = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1 max-w-[85%]">
                      {!msg.isRecalled && (
                        <div className="opacity-0 group-hover:opacity-100 transition relative">
                          <button
                            onClick={() =>
                              setActiveMessageMenu(
                                activeMessageMenu?.msgId === msg.id
                                  ? null
                                  : { convId, msgId: msg.id },
                              )
                            }
                            className="p-1 hover:bg-fb-btn-hover rounded-full text-fb-text-3"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                          {activeMessageMenu?.msgId === msg.id && (
                            <div className="absolute right-0 bottom-6 bg-fb-card shadow-lg rounded-lg border border-fb-divider py-1 z-10 w-32">
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
                                  className="w-full text-left px-2 py-1 text-xs text-fb-danger hover:bg-fb-danger-soft flex items-center gap-1"
                                >
                                  <Undo2 className="w-3 h-3" /> Thu hồi tin
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  recallMessage(convId, msg.id, 'ME');
                                  setActiveMessageMenu(null);
                                }}
                                className="w-full text-left px-2 py-1 text-xs text-fb-text hover:bg-fb-hover flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Xóa ở phía tôi
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div
                        className={`p-2.5 rounded-lg ${
                          msg.isRecalled
                            ? 'bg-fb-btn text-fb-text-2 italic'
                            : isMine
                              ? 'bg-fb-blue text-white rounded-br-xs shadow-fb-card'
                              : 'bg-fb-card text-fb-text rounded-bl-xs shadow-xs'
                        } ${
                          msg.effect === 'effect_glow' && isMine
                            ? 'ring-1 ring-fb-blue/30 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                            : ''
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                    <span className="text-xs text-fb-text-3 mt-0.5 px-1">
                      {msg.timestamp} {isMine && !msg.isRecalled && '✓'}
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
              <div className="p-2 bg-fb-card border-t border-fb-divider flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Aa (Gửi tin nhắn...)"
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
                  className="flex-1 bg-fb-input text-xs px-3 py-2 rounded-full focus:outline-hidden focus:ring-1 focus:ring-fb-blue text-fb-text"
                />
                <button
                  onClick={() => handleSend(convId)}
                  disabled={!inputTexts[convId]?.trim()}
                  className="p-2 rounded-full text-fb-blue hover:bg-fb-blue-soft disabled:text-fb-text-3 disabled:hover:bg-transparent transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
