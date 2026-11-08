/**
 * Điểm vào duy nhất cho màn hình đề xuất / kiểm duyệt.
 *
 * - Phiên đăng nhập thật: CHỈ gọi API; lỗi được ném nguyên vẹn để giao diện
 *   hiển thị (không âm thầm chuyển sang dữ liệu giả, không báo thành công sai).
 * - Phiên demo: CHỈ dùng kho demo dùng chung (demoStore).
 */
import { isApiSession } from '../../api/session-mode';
import { reviewApi } from '../../api/review';
import { sessionsApi } from '../../api/sessions';
import { questionsApi } from '../../api/questions';
import { demoProposalStore, type DemoBankQuestion } from './demoStore';
import type {
  AiApplyResponse,
  AiRefineResponse,
  ApproveQuestionsResponse,
  EditQuestionRequest,
  EditQuestionResponse,
  MySubmissionDetail,
  PendingSessionItemDto,
  ProposeSessionRequest,
  SessionDetailReviewResponse,
  SessionStatus,
  SubjectResponse,
  SubmissionWithStatus,
  UpdateSubmissionSessionRequest,
} from './types';

/** Giới hạn tối đa mỗi trang của các endpoint danh sách phiên. */
export const PAGE_LIMIT = 50;
/** Chặn vòng lặp nếu backend trả con trỏ sai. */
const MAX_PAGES = 20;

export const SESSION_STATUSES: SessionStatus[] = [
  'PENDING',
  'REVIEWING',
  'RESOLVED',
];

interface CursorPage<T> {
  items: T[];
  hasNext: boolean;
  after?: number;
}

/** Đọc lần lượt mọi trang theo con trỏ `after` cho tới khi has_next = false. */
export async function collectAllPages<T>(
  fetchPage: (after: number | undefined) => Promise<CursorPage<T>>,
): Promise<T[]> {
  const all: T[] = [];
  let after: number | undefined;
  for (let i = 0; i < MAX_PAGES; i += 1) {
    const page = await fetchPage(after);
    all.push(...page.items);
    if (!page.hasNext || page.after === undefined || page.after === after)
      break;
    after = page.after;
  }
  return all;
}

function newestFirst(a: { created_at?: string }, b: { created_at?: string }) {
  return (
    new Date(b.created_at ?? 0).getTime() -
    new Date(a.created_at ?? 0).getTime()
  );
}

async function fetchSubmissionsByStatus(
  status: SessionStatus,
  subjectId?: number,
): Promise<SubmissionWithStatus[]> {
  const items = await collectAllPages(async (after) => {
    const query = { status, subject_id: subjectId, limit: PAGE_LIMIT, after };
    const res = isApiSession()
      ? await sessionsApi.getMySubmissions(query)
      : demoProposalStore.listMySubmissions(query);
    return {
      items: res.contents ?? [],
      hasNext: res.pagination?.has_next ?? false,
      after: res.pagination?.after,
    };
  });
  return items.map((item) => ({ ...item, status }));
}

export const proposalGateway = {
  async getEnrolledSubjects(): Promise<SubjectResponse[]> {
    return isApiSession()
      ? sessionsApi.getMyEnrolledSubjects()
      : demoProposalStore.listEnrolledSubjects();
  },

  async getAllSubjects(): Promise<SubjectResponse[]> {
    return isApiSession()
      ? sessionsApi.getAllSubjects()
      : demoProposalStore.listSubjects();
  },

  /**
   * Phiên đề xuất của tôi kèm trạng thái. Swagger không trả trạng thái trong
   * từng phần tử, nên khi không lọc theo trạng thái ta gọi riêng từng trạng thái.
   */
  async getMySubmissions(filter: {
    status?: SessionStatus;
    subject_id?: number;
  }): Promise<SubmissionWithStatus[]> {
    const statuses = filter.status ? [filter.status] : SESSION_STATUSES;
    const groups = await Promise.all(
      statuses.map((status) =>
        fetchSubmissionsByStatus(status, filter.subject_id),
      ),
    );
    return groups.flat().sort(newestFirst);
  },

  async getMySubmissionDetail(sessionId: number): Promise<MySubmissionDetail> {
    return isApiSession()
      ? sessionsApi.getMySubmissionDetail(sessionId)
      : demoProposalStore.getMySubmissionDetail(sessionId);
  },

  async proposeSession(body: ProposeSessionRequest): Promise<void> {
    if (isApiSession()) await sessionsApi.proposeSession(body);
    else demoProposalStore.propose(body);
  },

  async updateMySubmission(
    sessionId: number,
    body: UpdateSubmissionSessionRequest,
  ): Promise<void> {
    if (isApiSession()) await sessionsApi.updateMySubmission(sessionId, body);
    else demoProposalStore.updateMySubmission(sessionId, body);
  },

  async deleteMySubmission(sessionId: number): Promise<void> {
    if (isApiSession()) await sessionsApi.deleteMySubmission(sessionId);
    else demoProposalStore.deleteMySubmission(sessionId);
  },

  /** Toàn bộ phiên PENDING/REVIEWING (đọc hết các trang theo con trỏ). */
  async getPendingSessions(
    subjectId?: number,
  ): Promise<PendingSessionItemDto[]> {
    return collectAllPages(async (after) => {
      const query = { subject_id: subjectId, limit: PAGE_LIMIT, after };
      const res = isApiSession()
        ? await reviewApi.getPendingSessions(query)
        : demoProposalStore.listPendingSessions(query);
      return {
        items: res.items ?? [],
        hasNext: res.pagination?.has_next ?? false,
        after: res.pagination?.after,
      };
    });
  },

  /**
   * Lịch sử phiên đã duyệt. Swagger chưa có endpoint này nên phiên thật trả
   * danh sách rỗng (màn hình chỉ giữ các phiên vừa chốt trong lần mở hiện tại).
   */
  async getReviewHistory(): Promise<PendingSessionItemDto[]> {
    return isApiSession() ? [] : demoProposalStore.listResolvedSessions();
  },

  /** Số phiên chờ duyệt cho huy hiệu trên thanh điều hướng; null nếu không biết. */
  countPendingSessions(): number | null {
    return isApiSession() ? null : demoProposalStore.countPendingSessions();
  },

  async getSessionDetailForReview(
    sessionId: number,
  ): Promise<SessionDetailReviewResponse> {
    return isApiSession()
      ? reviewApi.getSessionDetailForReview(sessionId)
      : demoProposalStore.getSessionDetailForReview(sessionId);
  },

  async approveQuestions(
    questionIds: number[],
  ): Promise<ApproveQuestionsResponse> {
    return isApiSession()
      ? reviewApi.approveQuestions(questionIds)
      : demoProposalStore.approve(questionIds);
  },

  async rejectQuestions(questionIds: number[], reason?: string): Promise<void> {
    if (isApiSession()) await reviewApi.rejectQuestions(questionIds, reason);
    else demoProposalStore.reject(questionIds, reason);
  },

  async editQuestion(
    questionId: number,
    body: EditQuestionRequest,
  ): Promise<EditQuestionResponse> {
    return isApiSession()
      ? reviewApi.editQuestion(questionId, body)
      : demoProposalStore.editQuestion(questionId, body);
  },

  async completeSessionReview(sessionId: number): Promise<void> {
    if (isApiSession()) await reviewApi.completeSessionReview(sessionId);
    else demoProposalStore.completeReview(sessionId);
  },

  /** AI đề xuất bản tinh chỉnh câu hỏi (chưa ghi đè cho tới khi aiApply). */
  async aiRefine(
    questionId: number,
    prompt: string,
  ): Promise<AiRefineResponse> {
    return isApiSession()
      ? questionsApi.aiRefine(questionId, prompt)
      : demoProposalStore.aiRefine(questionId, prompt);
  },

  /** Áp dụng (approve = true) hoặc loại bỏ bản AI đã đề xuất. */
  async aiApply(
    questionId: number,
    editLogId: number,
    approve: boolean,
  ): Promise<AiApplyResponse> {
    return isApiSession()
      ? questionsApi.aiApply(questionId, editLogId, approve)
      : demoProposalStore.aiApply(questionId, editLogId, approve);
  },

  /**
   * Câu hỏi trong ngân hàng đề của môn. Swagger KHÔNG có endpoint liệt kê
   * dạng JSON (chỉ xuất file), nên phiên thật trả null = không xem được.
   */
  listBankQuestions(subjectId?: number): DemoBankQuestion[] | null {
    return isApiSession()
      ? null
      : demoProposalStore.listBankQuestions(subjectId);
  },
};
