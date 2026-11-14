import { useEffect } from 'react';

/**
 * Khoá cuộn trang khi mở lớp phủ toàn màn hình (phòng thi, lightbox…).
 *
 * Phải khoá cả <html>: CSS chung đặt `overflow-x: clip` cho html nên
 * `overflow: hidden` của <body> không còn được áp lên khung nhìn — trang vẫn
 * cuộn phía sau và hiện 2 thanh cuộn sát nhau. Đếm số lớp đang khoá để các
 * lớp phủ lồng nhau không mở khoá sớm.
 */
let locks = 0;
let saved: { html: string; body: string } | null = null;

export function lockPageScroll(): () => void {
  if (locks === 0) {
    saved = {
      html: document.documentElement.style.overflow,
      body: document.body.style.overflow,
    };
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  locks += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0 && saved) {
      document.documentElement.style.overflow = saved.html;
      document.body.style.overflow = saved.body;
      saved = null;
    }
  };
}

export function useLockPageScroll(active = true): void {
  useEffect(() => (active ? lockPageScroll() : undefined), [active]);
}
