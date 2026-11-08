import React, { useEffect, useLayoutEffect, useRef } from 'react';

/** Cách đáy bao nhiêu px thì vẫn coi như người dùng đang ở cuối cuộc trò chuyện. */
const NEAR_BOTTOM_PX = 120;

interface AutoScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Đổi giá trị (ví dụ id cuộc trò chuyện) → nhảy thẳng xuống tin mới nhất. */
  scrollKey: string | number | undefined;
  /** Id của tin cuối cùng; đổi giá trị nghĩa là có tin mới. */
  latestKey: string | number | undefined;
  /** Tin mới do chính mình gửi: luôn cuộn xuống dù đang xem tin cũ. */
  followLatest?: boolean;
}

/**
 * Vùng cuộn cho khung chat: mở cuộc trò chuyện thì ở ngay tin mới nhất; có tin
 * mới thì cuộn mượt xuống — trừ khi người dùng đang kéo lên đọc tin cũ (khi đó
 * chỉ tin của chính họ mới kéo xuống), để không bị giật mất chỗ đang đọc.
 */
export function AutoScrollArea({
  scrollKey,
  latestKey,
  followLatest = false,
  onScroll,
  children,
  ...rest
}: AutoScrollAreaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    atBottom.current = true;
  }, [scrollKey]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !(atBottom.current || followLatest)) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    atBottom.current = true;
    // Chỉ chạy khi có tin mới; followLatest đi kèm chính tin đó.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestKey]);

  // Ảnh trong tin nhắn tải xong làm khung cao thêm: giữ ở đáy nếu đang ở đáy.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const keepAtBottom = () => {
      if (atBottom.current) el.scrollTop = el.scrollHeight;
    };
    el.addEventListener('load', keepAtBottom, true);
    return () => el.removeEventListener('load', keepAtBottom, true);
  }, []);

  return (
    <div
      ref={ref}
      onScroll={(event) => {
        const el = event.currentTarget;
        atBottom.current =
          el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
        onScroll?.(event);
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
