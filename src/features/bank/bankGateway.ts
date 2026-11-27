/**
 * /bank của sinh viên = kho chung các bộ câu hỏi đã được giảng viên xem xét xong
 * (RESOLVED), để cùng luyện tập, chấm sao và bình luận. Đây KHÔNG phải ngân hàng
 * đề dùng để sinh đề thi của giảng viên.
 *
 * Danh sách: GET /sessions/practice-catalog (backend chỉ trả các phiên đã chốt
 * RESOLVED, không lộ danh tính người nộp hay kết quả duyệt).
 *
 * Số liệu tương tác: thống kê sống lấy từ GET /sessions/{id}/questions.
 */
import { sessionsApi, type PracticeSetDto } from '../../api/sessions';
import { type SessionSearchResultDto } from '../../api/search';
import { collectAllPages, PAGE_LIMIT } from '../proposals/proposalGateway';
import { practiceGateway } from '../proposals/practiceGateway';
import type { SessionQuestionsResponse } from '../proposals/types';

export interface BankSet {
  sessionId: number;
  title: string;
  content?: string;
  subjectId?: number;
  subjectCode?: string;
  subjectName: string;
  /** Số câu theo danh mục — chỉ dùng khi chưa có thống kê sống. */
  indexedQuestionCount: number;
  createdAt?: string;
}

/** Thống kê sống của một bộ, tính từ GET /sessions/{id}/questions. */
export interface BankSetStats {
  questionCount: number;
  /** Tổng lượt chấm sao của các câu. */
  ratingCount: number;
  /** Tổng bình luận trên các câu. */
  commentCount: number;
  /** Số câu bạn đã trả lời / đã chấm sao. */
  answeredCount: number;
  ratedCount: number;
}

export type Progress = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';

export function progressOf(stats: BankSetStats): Progress {
  if (stats.answeredCount === 0) return 'NOT_STARTED';
  return stats.answeredCount >= stats.questionCount ? 'DONE' : 'IN_PROGRESS';
}

/** Chuyển mục danh mục luyện tập (đã chốt RESOLVED) thành bộ câu hỏi. */
export function bankSetFromPractice(dto: PracticeSetDto): BankSet | null {
  if (dto.session_id === undefined) return null;
  return {
    sessionId: dto.session_id,
    title: dto.title?.trim() || `Bộ câu hỏi #${dto.session_id}`,
    content: dto.content || undefined,
    subjectCode: dto.subject_code || undefined,
    subjectName: dto.subject_name || 'Chưa rõ môn học',
    indexedQuestionCount: dto.question_counts ?? 0,
    createdAt: dto.created_at,
  };
}

/** Chuyển kết quả tìm kiếm thành bộ câu hỏi; lọc chỉ giữ phiên đã chốt RESOLVED và cố ý bỏ `status`. */
export function bankSetFromSearch(dto: SessionSearchResultDto): BankSet | null {
  if (dto.session_id === undefined) return null;
  if (dto.status && dto.status.toUpperCase() !== 'RESOLVED') return null;
  return {
    sessionId: dto.session_id,
    title: dto.title?.trim() || `Bộ câu hỏi #${dto.session_id}`,
    content: dto.content || undefined,
    subjectId: dto.subject_id,
    subjectName: dto.subject_name || 'Chưa rõ môn học',
    indexedQuestionCount: dto.question_count ?? 0,
    createdAt: dto.created_at,
  };
}

export function statsFromSession(data: SessionQuestionsResponse): BankSetStats {
  const questions = data.questions ?? [];
  let ratingCount = 0;
  let commentCount = 0;
  let answeredCount = 0;
  let ratedCount = 0;
  for (const q of questions) {
    ratingCount += q.rating_count ?? 0;
    commentCount += q.comment_count ?? 0;
    if (q.my_interaction?.answered) answeredCount += 1;
    if (q.my_interaction?.rated) ratedCount += 1;
  }
  return {
    questionCount: questions.length,
    ratingCount,
    commentCount,
    answeredCount,
    ratedCount,
  };
}

/** Chạy `task` cho từng phần tử, tối đa `limit` yêu cầu song song. */
async function forEachLimited<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const item = items[next];
        next += 1;
        await task(item);
      }
    },
  );
  await Promise.all(workers);
}

export const bankGateway = {
  /** Đọc hết các trang GET /sessions/practice-catalog (chỉ các phiên đã chốt RESOLVED). */
  async loadSets(): Promise<BankSet[]> {
    const items = await collectAllPages(async (after) => {
      const page = await sessionsApi.getPracticeCatalog({
        after,
        limit: PAGE_LIMIT,
      });
      return {
        items: page.contents ?? [],
        hasNext: page.pagination?.has_next ?? false,
        after: page.pagination?.after ?? undefined,
      };
    });

    const seen = new Set<number>();
    const sets: BankSet[] = [];
    for (const item of items) {
      const set = bankSetFromPractice(item);
      if (set && !seen.has(set.sessionId)) {
        seen.add(set.sessionId);
        sets.push(set);
      }
    }
    return sets;
  },

  async loadStats(sessionId: number): Promise<BankSetStats> {
    return statsFromSession(
      await practiceGateway.getSessionQuestions(sessionId),
    );
  },

  /**
   * Tải thống kê sống cho nhiều bộ (tối đa 8 yêu cầu song song), báo về
   * từng bộ ngay khi có. Bộ lỗi được báo qua `onError`, không làm hỏng bộ khác.
   */
  async loadAllStats(
    sessionIds: number[],
    onStats: (sessionId: number, stats: BankSetStats) => void,
    onError: (sessionId: number) => void,
    isCancelled: () => boolean = () => false,
  ): Promise<void> {
    await forEachLimited(sessionIds, 8, async (id) => {
      if (isCancelled()) return;
      try {
        const stats = await bankGateway.loadStats(id);
        if (!isCancelled()) onStats(id, stats);
      } catch {
        if (!isCancelled()) onError(id);
      }
    });
  },
};
