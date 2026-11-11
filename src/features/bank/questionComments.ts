import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { questionsApi, type RatingItemDto } from '../../api';
import { tokenStore } from '../../api/token';
import type { Question } from '../demo/types';

/** Khớp mặc định phân trang của GET /questions/{questionId}/ratings. */
export const COMMENT_PAGE_SIZE = 10;

export interface QuestionComment {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  /** Người đánh giá có gắn cờ báo lỗi nội dung câu hỏi (is_error). */
  isError?: boolean;
}

/**
 * Chỉ gọi API khi đã đăng nhập bằng tài khoản thật và câu hỏi có ID số từ backend.
 * Dữ liệu ngân hàng đề demo dùng ID dạng chuỗi ("q_01") nên tiếp tục dùng dữ liệu mẫu.
 */
export const getApiQuestionId = (question: Question): number | null =>
  tokenStore.get() && /^\d+$/.test(question.id) ? Number(question.id) : null;

// ---------------------------------------------------------------------------
// Dữ liệu mẫu cho phiên demo (trước đây ghi cứng trong ExamDetailView)
// ---------------------------------------------------------------------------
const mockCommunityComments: QuestionComment[][] = [
  [
    {
      id: 'c_0_1',
      userName: 'Trần Minh Đức',
      userAvatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      rating: 4,
      comment:
        'Phần khai triển Maclaurin này rất hay ra trong đề thi giữa kỳ, cần cẩn thận dấu trừ!',
      createdAt: '1 giờ trước',
    },
    {
      id: 'c_0_2',
      userName: 'Lê Thị Thu',
      userAvatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      rating: 4,
      comment: 'Giải thích chi tiết và trực quan. 10 điểm cho tác giả!',
      createdAt: '3 giờ trước',
    },
  ],
  [
    {
      id: 'c_1_1',
      userName: 'Phạm Quang Huy',
      userAvatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      rating: 3,
      comment:
        'Cần chú ý điều kiện xác định trước khi tính tích phân suy rộng.',
      createdAt: 'Hôm qua',
    },
  ],
  [
    {
      id: 'c_2_1',
      userName: 'Hoàng Mai Anh',
      userAvatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      rating: 4,
      comment: 'Bám sát đề thi giữa kỳ của thầy cô viện Toán.',
      createdAt: '2 ngày trước',
    },
  ],
  [
    {
      id: 'c_3_1',
      userName: 'Vũ Quốc Bảo',
      userAvatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      rating: 4,
      comment: 'Câu hỏi phân loại khá tốt cho sinh viên ôn điểm A.',
      createdAt: '3 ngày trước',
    },
  ],
];

export function buildMockComments(
  question: Question,
  questionIdx: number,
): QuestionComment[] {
  const list = (mockCommunityComments[questionIdx % 4] || []).map((item) => ({
    ...item,
    id: `${item.id}_${question.id}`,
  }));
  if (question.userComment) {
    list.unshift({
      id: `user_c_${question.id}`,
      userName: 'Bạn (Sinh viên)',
      userAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      rating: question.userRatedStars || 4,
      comment: question.userComment,
      createdAt: 'Vừa xong',
    });
  }
  return list;
}

/** Số nhận xét hiển thị ở danh sách câu: API dùng ratingCount của câu, demo đếm dữ liệu mẫu. */
export function countQuestionComments(
  question: Question,
  questionIdx: number,
): number {
  return getApiQuestionId(question) !== null
    ? question.ratingCount || 0
    : buildMockComments(question, questionIdx).length;
}

// ---------------------------------------------------------------------------
// Chuyển dữ liệu API sang dạng hiển thị
// ---------------------------------------------------------------------------
const formatRatingTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
};

async function mapRatings(items: RatingItemDto[]): Promise<QuestionComment[]> {
  const userIds = [
    ...new Set(
      items
        .map((item) => item.user_id)
        .filter((id): id is number => typeof id === 'number'),
    ),
  ];
  const profiles = new Map(
    await Promise.all(
      userIds.map(
        async (id) => [id, await questionsApi.getUserProfile(id)] as const,
      ),
    ),
  );

  return items.map((item, index) => {
    const profile =
      item.user_id !== undefined ? profiles.get(item.user_id) : null;
    return {
      id: `rating_${item.user_id ?? 'x'}_${item.created_at ?? index}`,
      userName:
        profile?.full_name ||
        (item.user_id !== undefined
          ? `Người dùng #${item.user_id}`
          : 'Người dùng'),
      userAvatar: profile?.avatar_url,
      rating: item.rating ?? 0,
      comment: item.comment?.trim() ?? '',
      createdAt: formatRatingTime(item.created_at),
    };
  });
}

/** Một trang nhận xét từ API, đã kèm tên/avatar người đánh giá và cursor trang sau. */
export async function fetchQuestionCommentsPage(
  questionId: number,
  after?: number,
  signal?: AbortSignal,
): Promise<{
  comments: QuestionComment[];
  nextCursor?: number;
  hasMore: boolean;
}> {
  const page = await questionsApi.getRatings(
    questionId,
    { after, limit: COMMENT_PAGE_SIZE },
    signal,
  );
  const items = page.items ?? [];
  return {
    comments: await mapRatings(items),
    nextCursor: page.pagination?.after ?? items[items.length - 1]?.user_id,
    hasMore: Boolean(page.pagination?.has_next),
  };
}

// ---------------------------------------------------------------------------
// Hook: nhận xét của MỘT câu hỏi. Component dùng hook nên được key theo question.id
// để trạng thái tự làm mới khi đổi câu.
// ---------------------------------------------------------------------------
export function useQuestionComments(question: Question, questionIdx: number) {
  const apiQuestionId = getApiQuestionId(question);
  const mockComments = useMemo(
    () => buildMockComments(question, questionIdx),
    [question, questionIdx],
  );
  const [mockVisible, setMockVisible] = useState(COMMENT_PAGE_SIZE);

  const [apiItems, setApiItems] = useState<QuestionComment[]>([]);
  const [cursor, setCursor] = useState<number | undefined>();
  const [hasMoreApi, setHasMoreApi] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>(
    apiQuestionId !== null ? 'loading' : 'idle',
  );
  const abortRef = useRef<AbortController | null>(null);

  const loadPage = useCallback(
    async (after?: number) => {
      if (apiQuestionId === null) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      if (after !== undefined) setStatus('loading');

      try {
        const page = await fetchQuestionCommentsPage(
          apiQuestionId,
          after,
          controller.signal,
        );
        if (controller.signal.aborted) return;

        setApiItems((prev) =>
          after === undefined ? page.comments : [...prev, ...page.comments],
        );
        setCursor(page.nextCursor);
        setHasMoreApi(page.hasMore);
        setStatus('idle');
      } catch {
        if (!controller.signal.aborted) setStatus('error');
      }
    },
    [apiQuestionId],
  );

  useEffect(() => {
    void loadPage();
    return () => abortRef.current?.abort();
  }, [loadPage]);

  if (apiQuestionId === null) {
    return {
      comments: mockComments.slice(0, mockVisible),
      hasMore: mockComments.length > mockVisible,
      isLoading: false,
      isError: false,
      loadMore: () => setMockVisible((count) => count + COMMENT_PAGE_SIZE),
      retry: () => {},
    };
  }

  return {
    comments: apiItems,
    hasMore: hasMoreApi,
    isLoading: status === 'loading',
    isError: status === 'error',
    loadMore: () => void loadPage(cursor),
    retry: () => {
      setStatus('loading');
      void loadPage(apiItems.length > 0 ? cursor : undefined);
    },
  };
}
