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
    <div className="bg-fb-card rounded-lg shadow-fb-card p-4">
      <div className="flex items-center gap-3 pb-3 border-b border-fb-divider">
        <AvatarWithFrame user={currentUser} size="md" />
        <button
          type="button"
          onClick={() => openPostComposer()}
          className="flex-1 bg-fb-input hover:bg-fb-btn-hover text-gray-500 dark:text-gray-300 text-sm font-medium py-2.5 px-4 rounded-full text-left transition"
        >
          {currentUser.name.split(' ').slice(-1)[0]} ơi, bạn đang nghiên cứu gì
          thế?
        </button>
      </div>

      <div className="flex items-center justify-between pt-3 text-xs sm:text-sm font-medium text-fb-text-2">
        <div ref={attachmentMenuRef} className="relative flex-1">
          <button
            type="button"
            onClick={() => setIsAttachmentMenuOpen((open) => !open)}
            aria-expanded={isAttachmentMenuOpen}
            aria-haspopup="menu"
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 transition hover:bg-fb-hover"
          >
            <Image className="w-4.5 h-4.5 shrink-0 text-fb-text-2" />
            <span>Ảnh/Tài liệu</span>
          </button>
          {isAttachmentMenuOpen && (
            <div
              role="menu"
              className="absolute left-0 top-full z-30 mt-2 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-[#242526]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsAttachmentMenuOpen(false);
                  openPostComposer(undefined, 'image');
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-fb-hover"
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
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-fb-hover"
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
          className="flex items-center justify-center gap-2 flex-1 py-2 hover:bg-fb-hover rounded-lg transition"
        >
          <Video className="w-4.5 h-4.5 text-fb-text-2" />
          <span>Video học tập</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('propose')}
          className="flex items-center justify-center gap-2 flex-1 py-2 hover:bg-fb-hover rounded-lg transition text-fb-blue font-semibold cursor-pointer"
        >
          <HelpCircle className="w-4.5 h-4.5 text-fb-blue" />
          <span>Đề xuất câu hỏi</span>
        </button>
      </div>
    </div>
  );
}
