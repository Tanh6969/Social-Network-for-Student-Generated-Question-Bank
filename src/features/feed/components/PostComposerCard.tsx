import { useEffect, useRef, useState } from 'react';
import { FileText, HelpCircle, Image, Video } from 'lucide-react';
import { useApp } from '../../demo/context/AppContext';
import { AvatarWithFrame } from '../../../shared/components/AvatarWithFrame';

export function PostComposerCard() {
  const { currentUser, openPostComposer, setActiveTab } = useApp();
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAttachmentMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !attachmentMenuRef.current?.contains(event.target)
      )
        setIsAttachmentMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAttachmentMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isAttachmentMenuOpen]);

  return (
    <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
        <AvatarWithFrame user={currentUser} size="md" />
        <button
          type="button"
          onClick={() => openPostComposer()}
          className="flex-1 bg-[#F0F2F5] dark:bg-[#3A3B3C] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50] text-gray-500 dark:text-gray-300 text-sm font-medium py-2.5 px-4 rounded-full text-left transition"
        >
          {currentUser.name.split(' ').slice(-1)[0]} ơi, bạn đang nghiên cứu gì
          thế?
        </button>
      </div>

      <div className="flex items-center justify-between pt-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
        <div ref={attachmentMenuRef} className="relative flex-1">
          <button
            type="button"
            onClick={() => setIsAttachmentMenuOpen((open) => !open)}
            aria-expanded={isAttachmentMenuOpen}
            aria-haspopup="menu"
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 transition hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
          >
            <Image className="w-4.5 h-4.5 shrink-0 text-gray-500 dark:text-gray-400" />
            <span>Ảnh/Tài liệu</span>
          </button>
          {isAttachmentMenuOpen && (
            <div
              role="menu"
              className="absolute left-0 top-full z-30 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-[#242526]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsAttachmentMenuOpen(false);
                  openPostComposer(undefined, 'image');
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
              >
                <Image className="h-4 w-4" />
                Chọn ảnh
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsAttachmentMenuOpen(false);
                  openPostComposer(undefined, 'document');
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
              >
                <FileText className="h-4 w-4" />
                Chọn tài liệu
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => openPostComposer(undefined, 'video')}
          className="flex items-center justify-center gap-2 flex-1 py-2 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-lg transition"
        >
          <Video className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" />
          <span>Video học tập</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('propose')}
          className="flex items-center justify-center gap-2 flex-1 py-2 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-lg transition text-blue-600 dark:text-blue-400 font-semibold cursor-pointer"
        >
          <HelpCircle className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
          <span>Đề xuất câu hỏi</span>
        </button>
      </div>
    </div>
  );
}
