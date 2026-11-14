import React from 'react';

/**
 * Skeleton loading dùng chung. Khối xám có ánh sáng chạy ngang (class
 * `.skeleton` trong index.css, tự tắt khi người dùng chọn giảm chuyển động).
 * Mỗi vùng đang tải bọc trong <SkeletonRegion> để trình đọc màn hình đọc
 * "Đang tải…" một lần thay vì đọc từng khối xám.
 */

export const Skeleton: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  // Bo góc mặc định, trừ khi className đã có rounded-* riêng.
  const rounded = /(^|\s)rounded(-|\s|$)/.test(className) ? '' : 'rounded-md ';
  return (
    <div aria-hidden="true" className={`skeleton ${rounded}${className}`} />
  );
};

export const SkeletonRegion: React.FC<{
  label?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label = 'Đang tải…', className, children }) => (
  <div role="status" aria-busy="true" aria-live="polite" className={className}>
    <span className="sr-only">{label}</span>
    {children}
  </div>
);

/** Vài dòng chữ, dòng cuối ngắn hơn cho tự nhiên. */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 2,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton
        key={i}
        className={`h-3 ${i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full'}`}
      />
    ))}
  </div>
);

/** Dòng danh sách: ô tròn/vuông + 2 dòng chữ (sidebar, bạn bè, bảng xếp hạng…). */
export const SkeletonRow: React.FC<{
  avatar?: 'circle' | 'square';
  className?: string;
}> = ({ avatar = 'circle', className = '' }) => (
  <div className={`flex items-center gap-3 p-2 ${className}`}>
    <Skeleton
      className={`h-9 w-9 shrink-0 ${avatar === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
    />
    <div className="min-w-0 flex-1 space-y-2">
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-2.5 w-2/5" />
    </div>
  </div>
);

export const SkeletonRows: React.FC<{
  count?: number;
  avatar?: 'circle' | 'square';
  label?: string;
  className?: string;
}> = ({ count = 3, avatar, label, className }) => (
  <SkeletonRegion label={label} className={className}>
    {Array.from({ length: count }, (_, i) => (
      <SkeletonRow key={i} avatar={avatar} />
    ))}
  </SkeletonRegion>
);

/** Thẻ bài viết kiểu bảng tin: avatar, tên, nội dung, hàng nút. */
export const PostCardSkeleton: React.FC = () => (
  <div className="rounded-lg bg-fb-card p-4 shadow-fb-card">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-2.5 w-24" />
      </div>
    </div>
    <SkeletonText lines={3} className="mt-4" />
    <Skeleton className="mt-4 h-48 w-full rounded-lg" />
    <div className="mt-4 flex gap-2 border-t border-fb-divider pt-3">
      <Skeleton className="h-8 flex-1" />
      <Skeleton className="h-8 flex-1" />
      <Skeleton className="h-8 flex-1" />
    </div>
  </div>
);

export const PostListSkeleton: React.FC<{ count?: number }> = ({
  count = 2,
}) => (
  <SkeletonRegion label="Đang tải bài viết…" className="space-y-3">
    {Array.from({ length: count }, (_, i) => (
      <PostCardSkeleton key={i} />
    ))}
  </SkeletonRegion>
);

/** Thẻ nội dung chung: nhãn, tiêu đề, mô tả, hàng thông tin + nút. */
export const CardSkeleton: React.FC<{ withAction?: boolean }> = ({
  withAction = true,
}) => (
  <div className="rounded-lg bg-fb-card p-4 shadow-fb-card">
    <Skeleton className="h-5 w-36 rounded-full" />
    <Skeleton className="mt-3 h-4 w-2/3" />
    <SkeletonText lines={2} className="mt-3" />
    <div className="mt-4 flex items-center justify-between gap-3">
      <div className="flex gap-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
      {withAction && <Skeleton className="h-9 w-32" />}
    </div>
  </div>
);

export const CardListSkeleton: React.FC<{
  count?: number;
  label?: string;
  className?: string;
  withAction?: boolean;
}> = ({ count = 3, label, className = 'space-y-3', withAction }) => (
  <SkeletonRegion label={label} className={className}>
    {Array.from({ length: count }, (_, i) => (
      <CardSkeleton key={i} withAction={withAction} />
    ))}
  </SkeletonRegion>
);

/** Cả trang 3 cột (khi đang tải mã màn hình). */
export const PageSkeleton: React.FC = () => (
  <SkeletonRegion
    label="Đang tải màn hình…"
    className="mx-auto flex w-full max-w-[1920px] items-start justify-between gap-4 px-2 py-4 sm:px-4 lg:px-6 xl:gap-6"
  >
    <div className="hidden w-[280px] shrink-0 space-y-1 rounded-lg bg-fb-card p-3 shadow-fb-card lg:block xl:w-[300px]">
      <Skeleton className="mb-3 h-7 w-40" />
      {Array.from({ length: 6 }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
    <div className="mx-auto min-w-0 max-w-[960px] flex-1 space-y-3">
      <CardSkeleton withAction={false} />
      <PostCardSkeleton />
    </div>
    <div className="hidden w-[300px] shrink-0 space-y-1 rounded-lg bg-fb-card p-3 shadow-fb-card xl:block">
      <Skeleton className="mb-3 h-5 w-32" />
      {Array.from({ length: 4 }, (_, i) => (
        <SkeletonRow key={i} avatar="square" />
      ))}
    </div>
  </SkeletonRegion>
);

/** Câu hỏi trắc nghiệm: đề bài + 4 phương án. */
export const QuestionCardSkeleton: React.FC = () => (
  <div className="rounded-lg bg-fb-card p-5 shadow-fb-card">
    <div className="flex items-center justify-between border-b border-fb-divider pb-3">
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
    <SkeletonText lines={2} className="mt-4" />
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  </div>
);

export const QuestionListSkeleton: React.FC<{
  count?: number;
  label?: string;
}> = ({ count = 2, label = 'Đang tải câu hỏi…' }) => (
  <SkeletonRegion label={label} className="space-y-3">
    {Array.from({ length: count }, (_, i) => (
      <QuestionCardSkeleton key={i} />
    ))}
  </SkeletonRegion>
);

/** Phòng thi toàn màn hình khi đang tải đề. */
export const ExamRoomSkeleton: React.FC = () => (
  <SkeletonRegion
    label="Đang chuẩn bị phòng thi…"
    className="fixed inset-0 z-[1000] flex flex-col bg-fb-canvas"
  >
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-fb-divider bg-fb-card px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-16" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-2.5 w-32" />
        </div>
      </div>
      <Skeleton className="h-8 w-28" />
    </div>
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 p-4 sm:p-6">
      <div className="min-w-0 flex-1 space-y-4">
        <QuestionCardSkeleton />
        <div className="flex justify-between">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="hidden w-72 shrink-0 rounded-lg bg-fb-card p-4 shadow-fb-card lg:block">
        <Skeleton className="h-4 w-32" />
        <div className="mt-4 grid grid-cols-5 gap-2">
          {Array.from({ length: 15 }, (_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="mt-6 h-10 w-full" />
      </div>
    </div>
  </SkeletonRegion>
);
