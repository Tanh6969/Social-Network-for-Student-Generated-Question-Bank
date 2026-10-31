import { useEffect, useRef, useState } from 'react';
import { Link2, Share2 } from 'lucide-react';
import { mockPosts } from '../../../mocks/mockData';

const shareableDemoPostIds = new Set(mockPosts.map((post) => post.id));

export function PostShareButton({
  postId,
  showToast,
}: {
  postId: string;
  showToast: (message: string, type: 'success' | 'error') => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      )
        setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  const copyLink = async () => {
    setMenuOpen(false);
    if (!shareableDemoPostIds.has(postId)) {
      showToast(
        'Bài viết mới chỉ lưu trong phiên demo, chưa thể chia sẻ liên kết.',
        'error',
      );
      return;
    }
    try {
      const url = new URL('/feed', window.location.origin);
      url.searchParams.set('post', postId);
      await navigator.clipboard.writeText(url.toString());
      showToast('Đã sao chép liên kết bài viết.', 'success');
    } catch {
      showToast('Không sao chép được liên kết. Hãy thử lại.', 'error');
    }
  };

  return (
    <div ref={menuRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="flex w-full items-center justify-center gap-2 rounded-lg py-2 transition hover:bg-fb-hover"
      >
        <Share2 className="h-4 w-4" />
        <span>Chia sẻ</span>
      </button>
      {menuOpen && (
        <div
          role="menu"
          className="absolute bottom-full right-0 z-30 mb-1 w-48 rounded-lg border border-gray-200 bg-white p-1 text-xs shadow-lg dark:border-gray-700 dark:bg-[#242526]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => void copyLink()}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-fb-hover"
          >
            <Link2 className="h-4 w-4" />
            Sao chép liên kết
          </button>
        </div>
      )}
    </div>
  );
}
