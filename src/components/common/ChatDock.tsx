import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AvatarWithFrame } from './AvatarWithFrame';
import {
  X,
  Minus,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Undo2,
  AlertCircle
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
    currentUser
  } = useApp();

  const [inputTexts, setInputTexts] = useState<Record<string, string>>({});
  const [activeMessageMenu, setActiveMessageMenu] = useState<{ convId: string; msgId: string } | null>(null);

  const handleSend = (convId: string) => {
    const text = inputTexts[convId] || '';
    if (text.trim()) {
      sendMessage(convId, text);
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
                className="absolute -top-1 -right-1 w-4 h-4 bg-gray-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm text-[10px]"
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

        return (
          <div
            key={convId}
            className="w-80 sm:w-84 h-96 bg-white dark:bg-[#242526] rounded-t-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col pointer-events-auto overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
          >
            {/* Header */}
            <div className="px-3 py-2.5 bg-white dark:bg-[#242526] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2 truncate">
                <AvatarWithFrame user={conv.partner} size="sm" />
                <div className="truncate">
                  <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">
                    {conv.partner.name}
                  </h4>
                  <span className="text-[10px] text-emerald-500 font-medium">
                    {conv.partner.isOnline ? 'Đang hoạt động' : 'Hoạt động 10 phút trước'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-gray-500">
                <button
                  onClick={() => minimizeChatDock(convId)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-full transition"
                  title="Thu nhỏ"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => closeChatDock(convId)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-full transition"
                  title="Đóng chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs bg-[#F9FAFB] dark:bg-[#18191A]">
              {conv.messages.map((msg) => {
                const isMine = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1 max-w-[85%]">
                      {isMine && !msg.isRecalled && (
                        <div className="opacity-0 group-hover:opacity-100 transition relative">
                          <button
                            onClick={() =>
                              setActiveMessageMenu(
                                activeMessageMenu?.msgId === msg.id
                                  ? null
                                  : { convId, msgId: msg.id }
                              )
                            }
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                          {activeMessageMenu?.msgId === msg.id && (
                            <div className="absolute right-0 bottom-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 py-1 z-10 w-28">
                              <button
                                onClick={() => {
                                  recallMessage(convId, msg.id);
                                  setActiveMessageMenu(null);
                                }}
                                className="w-full text-left px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-1"
                              >
                                <Undo2 className="w-3 h-3" /> Thu hồi tin
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div
                        className={`p-2.5 rounded-2xl ${
                          msg.isRecalled
                            ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 italic'
                            : isMine
                            ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                            : 'bg-white dark:bg-[#242526] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-xs shadow-xs'
                        } ${
                          msg.effect === 'effect_glow' && isMine
                            ? 'ring-1 ring-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                            : ''
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-400 mt-0.5 px-1">
                      {msg.timestamp} {isMine && !msg.isRecalled && '✓'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <div className="p-2 bg-white dark:bg-[#242526] border-t border-gray-200 dark:border-gray-700 flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Aa (Gửi tin nhắn...)"
                value={inputTexts[convId] || ''}
                onChange={(e) =>
                  setInputTexts((prev) => ({ ...prev, [convId]: e.target.value }))
                }
                onKeyDown={(e) => handleKeyDown(e, convId)}
                className="flex-1 bg-gray-100 dark:bg-[#3A3B3C] text-xs px-3 py-2 rounded-full focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={() => handleSend(convId)}
                disabled={!inputTexts[convId]?.trim()}
                className="p-2 rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:text-gray-400 disabled:hover:bg-transparent transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
