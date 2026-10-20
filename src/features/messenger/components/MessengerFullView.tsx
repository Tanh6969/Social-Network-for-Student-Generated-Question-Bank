import React, { useState } from 'react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';
import {
  Search,
  Send,
  MoreVertical,
  Undo2,
  Paperclip,
  Smile,
  Shield,
  BellOff,
  Trash2,
  Image,
  ChevronRight,
  Phone,
  Video
} from 'lucide-react';
import { Conversation } from '../../demo/types';

export const MessengerFullView: React.FC = () => {
  const {
    conversations,
    currentUser,
    sendMessage,
    recallMessage,
    openReportModal,
    showToast
  } = useApp();

  const [activeConvId, setActiveConvId] = useState<string>(conversations[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [searchPartner, setSearchPartner] = useState('');

  const activeConv: Conversation | undefined =
    conversations.find((c) => c.id === activeConvId) || conversations[0];

  const handleSend = () => {
    if (inputText.trim() && activeConv) {
      sendMessage(activeConv.id, inputText);
      setInputText('');
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 my-2">
      <div className="h-[calc(100vh-5rem)] flex bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* ================= CỘT TRÁI (360px): Danh sách hội thoại ================= */}
      <aside className="w-80 md:w-90 shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col select-none">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Đoạn chat</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm trong Messenger..."
              value={searchPartner}
              onChange={(e) => setSearchPartner(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-100 dark:bg-[#3A3B3C] rounded-full border border-gray-200 dark:border-gray-700"
            />
          </div>

          <div className="flex gap-2 text-xs font-bold">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1 rounded-full transition ${
                filterTab === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-300'
              }`}
            >
              Hộp thư
            </button>
            <button
              onClick={() => setFilterTab('UNREAD')}
              className={`px-3 py-1 rounded-full transition ${
                filterTab === 'UNREAD'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-[#3A3B3C] text-gray-600 dark:text-gray-300'
              }`}
            >
              Chưa đọc
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 p-2 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                activeConv?.id === conv.id
                  ? 'bg-blue-50 dark:bg-blue-950/40'
                  : 'hover:bg-gray-50 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              <AvatarWithFrame user={conv.partner} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">
                    {conv.partner.name}
                  </p>
                  <span className="text-[10px] text-gray-400">{conv.lastMessageTime}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {conv.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ================= CỘT GIỮA: Khung chat ================= */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F9FAFB] dark:bg-[#18191A]">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="h-16 px-4 bg-white dark:bg-[#242526] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <AvatarWithFrame user={activeConv.partner} size="md" />
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    {activeConv.partner.name}
                  </h3>
                  <span className="text-[10px] text-emerald-500 font-medium">
                    {activeConv.partner.isOnline ? 'Đang hoạt động' : 'Hoạt động 10 phút trước'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-blue-600">
                <button
                  onClick={() => showToast('Tính năng gọi thoại đang kết nối...', 'info')}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => showToast('Tính năng gọi video đang kết nối...', 'info')}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
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
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
                          title="Thu hồi tin nhắn"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div
                        className={`p-3 rounded-2xl ${
                          msg.isRecalled
                            ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 italic'
                            : isMine
                            ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                            : 'bg-white dark:bg-[#242526] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-xs shadow-xs'
                        } ${
                          msg.effect === 'effect_glow' && isMine
                            ? 'ring-2 ring-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                            : ''
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                      {msg.timestamp} {isMine && '✓'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-white dark:bg-[#242526] border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <input
                type="text"
                placeholder="Aa (Nhập tin nhắn trao đổi bài học...)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                className="flex-1 bg-gray-100 dark:bg-[#3A3B3C] text-xs px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="p-2.5 rounded-full bg-blue-600 text-white disabled:bg-gray-300 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Chọn một đoạn chat để bắt đầu trò chuyện
          </div>
        )}
      </main>

      {/* ================= CỘT PHẢI (320px): Thông tin hội thoại ================= */}
      <aside className="hidden lg:flex w-80 shrink-0 border-l border-gray-200 dark:border-gray-700 flex-col p-5 space-y-4 select-none bg-white dark:bg-[#242526]">
        {activeConv && (
          <>
            <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100 dark:border-gray-700">
              <AvatarWithFrame user={activeConv.partner} size="xl" />
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 mt-2">
                {activeConv.partner.name}
              </h4>
              <p className="text-xs text-gray-500">{activeConv.partner.classOrTitle}</p>
              <p className="text-[11px] text-gray-400">{activeConv.partner.faculty}</p>
            </div>

            <div className="space-y-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
              <button
                onClick={() => showToast('Đã tắt thông báo đoạn chat này trong 8 giờ', 'info')}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition"
              >
                <BellOff className="w-4 h-4 text-gray-500" />
                <span>Tắt thông báo</span>
              </button>

              <button
                onClick={() =>
                  openReportModal('ĐOẠN CHAT', activeConv.id, activeConv.partner.name)
                }
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition"
              >
                <Shield className="w-4 h-4" />
                <span>Báo cáo cuộc trò chuyện</span>
              </button>
            </div>
          </>
        )}
      </aside>
      </div>
    </div>
  );
};
