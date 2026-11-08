/**
 * Kho dữ liệu DEMO duy nhất cho luồng "sinh viên đề xuất → giảng viên duyệt".
 *
 * Cả màn hình sinh viên lẫn giảng viên đọc/ghi cùng một danh sách phiên, nên
 * trong phiên demo: SV nộp → GV thấy trong hàng chờ → duyệt → câu hỏi vào
 * ngân hàng. Mỗi hàm trả về đúng hình dạng DTO của Swagger và mô phỏng các
 * quy tắc mà mô tả Swagger nêu (chỉ sửa/xoá khi PENDING, mở phiên chuyển sang
 * REVIEWING, duyệt hết thì tự hoàn tất, chốt phiên thì câu còn PENDING bị từ chối).
 *
 * Chỉ dùng khi KHÔNG có phiên đăng nhập thật — xem proposalGateway.
 */
import { ApiError } from '../../api/client';
import type {
  ApproveQuestionsResponse,
  AuthorDto,
  DuplicateWarning,
  EditQuestionRequest,
  EditQuestionResponse,
  MySubmissionDetail,
  PendingSessionItemDto,
  PendingSessionsResponse,
  ProposeSessionRequest,
  QuestionOption,
  SessionDetailReviewResponse,
  SubjectResponse,
  SubmissionsResponse,
  UpdateSubmissionSessionRequest,
} from './types';
import type { SessionStatus } from './types';
import {
  INITIAL_MOCK_REVIEW_SESSIONS,
  INITIAL_MOCK_SESSION_DETAILS,
} from '../lecturer/mockReviewData';
import {
  INITIAL_MOCK_DETAILS,
  INITIAL_MOCK_SUMMARIES,
} from '../propose/mockSessions';
import { mockCurrentUserStudent } from '../../mocks/mockData';

export type DemoQuestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DemoQuestion {
  question_id: number;
  content: string;
  image_urls: string[];
  options: QuestionOption[];
  explanation?: string;
  source: 'LLM' | 'HOMO_SAPIENS';
  confidence_score?: number;
  status: DemoQuestionStatus;
  reject_reason?: string;
  edited_by_lecturer?: boolean;
}

export interface DemoSession {
  session_id: number;
  session_code: string;
  title: string;
  content?: string;
  source_url?: string;
  subject_id: number;
  /** true nếu phiên do sinh viên demo đang đăng nhập đề xuất. */
  mine: boolean;
  author: AuthorDto;
  status: SessionStatus;
  created_at: string;
  reviewed_at?: string;
  reviewed_by_lecturer?: string;
  react_count: number;
  comment_count: number;
  questions: DemoQuestion[];
  duplicate_warnings: DuplicateWarning[];
}

/** Danh mục môn học demo; tên trùng với `topic` trong dữ liệu mẫu giảng viên. */
export const DEMO_SUBJECTS: SubjectResponse[] = [
  { subject_id: 10, code: 'IT3180', name: 'Công nghệ phần mềm' },
  { subject_id: 11, code: 'IT3080', name: 'Mạng máy tính' },
  { subject_id: 12, code: 'IT3011', name: 'Cấu trúc dữ liệu và giải thuật' },
  { subject_id: 13, code: 'IT3070', name: 'Hệ điều hành' },
  { subject_id: 14, code: 'IT3090', name: 'Cơ sở dữ liệu' },
  { subject_id: 15, code: 'IT3030', name: 'Kiến trúc máy tính' },
  { subject_id: 16, code: 'IT3160', name: 'Trí tuệ nhân tạo' },
  { subject_id: 17, code: 'IT3100', name: 'Lập trình Hướng đối tượng' },
  { subject_id: 18, code: 'IT4015', name: 'An toàn thông tin' },
  { subject_id: 19, code: 'IT4409', name: 'Lập trình Web' },
  { subject_id: 20, code: 'IT3190', name: 'Học máy (Machine Learning)' },
];

/** Các môn sinh viên demo đang học (mô phỏng GET /sessions/my-enrolled-subjects). */
const DEMO_ENROLLED_SUBJECT_IDS = [10, 11, 12, 13, 14];

/** user_id số của sinh viên demo (AuthorDto yêu cầu số). */
export const DEMO_STUDENT_USER_ID = 9001;
const DEMO_LECTURER_NAME = 'TS. Trần Minh Đức';

const STORAGE_KEY = 'sqb_demo_proposal_sessions_v3';
// Các khoá cũ của hai kho tách rời trước đây — xoá để không còn dữ liệu lệch.
const LEGACY_KEYS = [
  'sqb_mock_review_sessions_v2',
  'sqb_mock_review_details_v2',
  'sn_propose_submissions_summaries_v2',
];

function subjectOf(subjectId: number | undefined): SubjectResponse {
  return (
    DEMO_SUBJECTS.find((s) => s.subject_id === subjectId) ?? {
      subject_id: subjectId,
      code: `MH${subjectId ?? ''}`,
      name: `Môn học #${subjectId ?? '?'}`,
    }
  );
}

function subjectIdByName(name: string | undefined): number {
  return DEMO_SUBJECTS.find((s) => s.name === name)?.subject_id ?? 10;
}

function placeholderQuestions(
  sessionId: number,
  title: string,
  status: DemoQuestionStatus,
): DemoQuestion[] {
  return [1, 2].map((n) => ({
    question_id: sessionId * 100 + n,
    content: `Câu hỏi mẫu ${n} của phiên "${title}"`,
    image_urls: [],
    options: ['A', 'B', 'C', 'D'].map((key) => ({
      key,
      text: key === 'A' ? 'Phương án A (đáp án đúng)' : `Phương án ${key}`,
      is_correct: key === 'A',
    })),
    explanation: 'Lời giải mẫu cho dữ liệu demo.',
    source: 'HOMO_SAPIENS',
    confidence_score: 3.5,
    status,
  }));
}

function asQuestionStatus(value: string | undefined): DemoQuestionStatus {
  return value === 'APPROVED' || value === 'REJECTED' ? value : 'PENDING';
}

function asSessionStatus(value: string | undefined): SessionStatus {
  return value === 'REVIEWING' || value === 'RESOLVED' ? value : 'PENDING';
}

/** Ghép hai bộ dữ liệu mẫu cũ thành một danh sách phiên thống nhất. */
export function buildSeedSessions(): DemoSession[] {
  const lecturerSeeds: DemoSession[] = INITIAL_MOCK_REVIEW_SESSIONS.map((s) => {
    const id = s.session_id!;
    const status = asSessionStatus(s.status);
    const detail = INITIAL_MOCK_SESSION_DETAILS[id];
    const subject = subjectOf(subjectIdByName(s.topic));
    const fallbackStatus: DemoQuestionStatus =
      status === 'RESOLVED' ? 'APPROVED' : 'PENDING';
    return {
      session_id: id,
      session_code: `${subject.code}_${id}`,
      title: s.title ?? `Phiên #${id}`,
      content: s.content,
      subject_id: subject.subject_id!,
      mine: false,
      author: s.author ?? { user_id: 0, full_name: 'Sinh viên' },
      status,
      created_at: s.created_at ?? new Date().toISOString(),
      reviewed_by_lecturer:
        status === 'RESOLVED' ? DEMO_LECTURER_NAME : undefined,
      react_count: 0,
      comment_count: 0,
      questions: detail?.items?.length
        ? detail.items.map((q) => ({
            question_id: q.question_id!,
            content: q.content ?? '',
            image_urls: q.image_urls ?? [],
            options: q.options ?? [],
            explanation: q.explanation,
            source: 'HOMO_SAPIENS' as const,
            status:
              status === 'RESOLVED' && asQuestionStatus(q.status) === 'PENDING'
                ? 'APPROVED'
                : asQuestionStatus(q.status),
          }))
        : placeholderQuestions(id, s.title ?? '', fallbackStatus),
      duplicate_warnings: detail?.duplicate_warnings ?? [],
    };
  });

  // Phiên của chính SV demo: đổi id sang 2xx để không trùng dữ liệu giảng viên.
  const me: AuthorDto = {
    user_id: DEMO_STUDENT_USER_ID,
    full_name: mockCurrentUserStudent.name,
    avatar_url: mockCurrentUserStudent.avatar,
  };
  const studentSeeds: DemoSession[] = INITIAL_MOCK_SUMMARIES.map((s) => {
    const id = s.session_id! + 100;
    const status = asSessionStatus(s.status);
    const detail = INITIAL_MOCK_DETAILS[s.session_id!];
    const questionStatus: DemoQuestionStatus =
      status === 'RESOLVED' ? 'APPROVED' : 'PENDING';
    const subject = subjectOf(s.subject_id);
    return {
      session_id: id,
      session_code: `${subject.code}_${id}`,
      title: s.title ?? `Phiên #${id}`,
      content: s.content,
      subject_id: subject.subject_id!,
      mine: true,
      author: me,
      status,
      created_at: s.created_at ?? new Date().toISOString(),
      reviewed_by_lecturer:
        status === 'RESOLVED' ? DEMO_LECTURER_NAME : undefined,
      react_count: s.react_count ?? 0,
      comment_count: s.comment_count ?? 0,
      questions: detail?.questions?.length
        ? detail.questions.map((q, i) => ({
            question_id: id * 100 + i + 1,
            content: q.content ?? '',
            image_urls: q.image_urls ?? [],
            options: q.options ?? [],
            explanation: q.explanation,
            source:
              q.source === 'LLM' ? ('LLM' as const) : ('HOMO_SAPIENS' as const),
            confidence_score: q.confidence_score,
            status: questionStatus,
          }))
        : placeholderQuestions(id, s.title ?? '', questionStatus),
      duplicate_warnings: [],
    };
  });

  return [...studentSeeds, ...lecturerSeeds];
}

// ---------------------------------------------------------------------------
// Lưu trữ: localStorage nếu có, luôn giữ bản trong bộ nhớ (Node test, chế độ riêng tư).
// ---------------------------------------------------------------------------
let memory: DemoSession[] | null = null;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadDemoSessions(): DemoSession[] {
  const store = storage();
  if (store) {
    try {
      const raw = store.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return (memory = parsed);
      }
    } catch {
      // Dữ liệu hỏng: dựng lại từ dữ liệu mẫu bên dưới.
    }
  }
  if (!memory) {
    memory = buildSeedSessions();
    saveDemoSessions(memory);
  }
  return memory;
}

function saveDemoSessions(sessions: DemoSession[]): void {
  memory = sessions;
  const store = storage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(sessions));
    LEGACY_KEYS.forEach((key) => store.removeItem(key));
  } catch {
    // Hết dung lượng hoặc bị chặn: vẫn còn bản trong bộ nhớ.
  }
}

/** Đưa kho demo về dữ liệu mẫu ban đầu (dùng cho test và nút đặt lại demo). */
export function resetDemoSessions(): void {
  memory = null;
  storage()?.removeItem(STORAGE_KEY);
}

function update(mutator: (sessions: DemoSession[]) => DemoSession[]): void {
  saveDemoSessions(mutator(loadDemoSessions()));
}

function findSession(sessionId: number): DemoSession {
  const found = loadDemoSessions().find((s) => s.session_id === sessionId);
  if (!found) throw new ApiError('Không tìm thấy phiên đề xuất.', 404);
  return found;
}

function newestFirst(a: DemoSession, b: DemoSession): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

/** Phân trang con trỏ giống backend: `after` là id của phần tử cuối trang trước. */
function paginate<T>(
  items: T[],
  idOf: (item: T) => number,
  after?: number,
  limit = 10,
) {
  const start =
    after === undefined ? 0 : items.findIndex((i) => idOf(i) === after) + 1;
  const page = items.slice(start, start + limit);
  const hasNext = start + limit < items.length;
  return {
    page,
    pagination: {
      has_prev: start > 0,
      has_next: hasNext,
      after: hasNext && page.length ? idOf(page[page.length - 1]) : undefined,
    },
  };
}

function correctKey(options: QuestionOption[]): string | undefined {
  return options.find((o) => o.is_correct)?.key;
}

function assertValidQuestions(
  questions: { content?: string; options?: QuestionOption[] }[] | undefined,
) {
  if (!questions?.length)
    throw new ApiError('Phiên đề xuất cần ít nhất 1 câu hỏi.', 400);
  questions.forEach((q, i) => {
    if (!q.content?.trim())
      throw new ApiError(`Câu hỏi ${i + 1} chưa có nội dung.`, 400);
    if (!q.options?.some((o) => o.is_correct))
      throw new ApiError(`Câu hỏi ${i + 1} chưa có đáp án đúng.`, 400);
  });
}

function assertEnrolled(subjectId: number | undefined) {
  if (!subjectId || !DEMO_ENROLLED_SUBJECT_IDS.includes(subjectId)) {
    throw new ApiError('Bạn chưa tham gia lớp học phần của môn học này.', 403);
  }
}

function toSummary(s: DemoSession) {
  const subject = subjectOf(s.subject_id);
  return {
    session_id: s.session_id,
    session_code: s.session_code,
    title: s.title,
    content: s.content,
    subject_id: s.subject_id,
    subject_name: subject.name,
    subject_code: subject.code,
    question_counts: s.questions.length,
    created_at: s.created_at,
    react_count: s.react_count,
    comment_count: s.comment_count,
  };
}

function toPendingItem(s: DemoSession): PendingSessionItemDto {
  return {
    session_id: s.session_id,
    topic: subjectOf(s.subject_id).name,
    title: s.title,
    content: s.content,
    author: s.author,
    status: s.status,
    created_at: s.created_at,
  };
}

// ---------------------------------------------------------------------------
// Các thao tác mô phỏng endpoint (cùng tên tham số / DTO với Swagger)
// ---------------------------------------------------------------------------
export const demoProposalStore = {
  listSubjects(): SubjectResponse[] {
    return DEMO_SUBJECTS;
  },

  listEnrolledSubjects(): SubjectResponse[] {
    return DEMO_SUBJECTS.filter((s) =>
      DEMO_ENROLLED_SUBJECT_IDS.includes(s.subject_id!),
    );
  },

  listMySubmissions(params: {
    status?: SessionStatus;
    subject_id?: number;
    after?: number;
    limit?: number;
  }): SubmissionsResponse {
    const items = loadDemoSessions()
      .filter((s) => s.mine)
      .filter((s) => !params.status || s.status === params.status)
      .filter((s) => !params.subject_id || s.subject_id === params.subject_id)
      .sort(newestFirst);
    const { page, pagination } = paginate(
      items,
      (s) => s.session_id,
      params.after,
      params.limit,
    );
    return { contents: page.map(toSummary), pagination };
  },

  getMySubmissionDetail(sessionId: number): MySubmissionDetail {
    const s = findSession(sessionId);
    if (!s.mine)
      throw new ApiError('Bạn không phải tác giả của phiên này.', 403);
    return {
      ...toSummary(s),
      reviewed_by_lecturer: s.reviewed_by_lecturer,
      reviewed_at: s.reviewed_at,
      questions: s.questions.map((q) => ({
        question_id: q.question_id,
        content: q.content,
        image_urls: q.image_urls,
        options: q.options,
        explanation: q.explanation,
        source: q.source,
        confidence_score: q.confidence_score,
      })),
    };
  },

  propose(body: ProposeSessionRequest): void {
    if (!body.title?.trim()) throw new ApiError('Vui lòng nhập tiêu đề.', 400);
    assertEnrolled(body.subject_id);
    assertValidQuestions(body.questions);
    const id = Date.now();
    const subject = subjectOf(body.subject_id);
    const session: DemoSession = {
      session_id: id,
      session_code: `${subject.code}_${id}`,
      title: body.title.trim(),
      content: body.content,
      source_url: body.source_url,
      subject_id: body.subject_id!,
      mine: true,
      author: {
        user_id: DEMO_STUDENT_USER_ID,
        full_name: mockCurrentUserStudent.name,
        avatar_url: mockCurrentUserStudent.avatar,
      },
      status: 'PENDING',
      created_at: new Date().toISOString(),
      react_count: 0,
      comment_count: 0,
      questions: (body.questions ?? []).map((q, i) => ({
        question_id: id * 10 + i + 1,
        content: q.content ?? '',
        image_urls: q.media_urls ?? [],
        options: q.options ?? [],
        explanation: q.explanation,
        source: q.llm_generated ? 'LLM' : 'HOMO_SAPIENS',
        confidence_score: q.confidence,
        status: 'PENDING',
      })),
      duplicate_warnings: [],
    };
    update((all) => [session, ...all]);
  },

  updateMySubmission(
    sessionId: number,
    body: UpdateSubmissionSessionRequest,
  ): void {
    const current = findSession(sessionId);
    if (!current.mine)
      throw new ApiError('Bạn không phải tác giả của phiên này.', 403);
    if (current.status !== 'PENDING')
      throw new ApiError('Chỉ được chỉnh sửa phiên khi đang chờ duyệt.', 400);
    if (!body.title?.trim()) throw new ApiError('Vui lòng nhập tiêu đề.', 400);
    assertEnrolled(body.subject_id);
    assertValidQuestions(body.questions);
    const newIdBase = Date.now() * 10;
    update((all) =>
      all.map((s) =>
        s.session_id !== sessionId
          ? s
          : {
              ...s,
              title: body.title!.trim(),
              content: body.content,
              source_url: body.source_url,
              subject_id: body.subject_id!,
              questions: (body.questions ?? []).map((q, i) => ({
                question_id: q.question_id ?? newIdBase + i,
                content: q.content ?? '',
                image_urls: q.media_urls ?? [],
                options: q.options ?? [],
                explanation: q.explanation,
                source: q.source === 'LLM' ? 'LLM' : 'HOMO_SAPIENS',
                confidence_score: q.confidence,
                status: 'PENDING',
              })),
            },
      ),
    );
  },

  deleteMySubmission(sessionId: number): void {
    const current = findSession(sessionId);
    if (!current.mine)
      throw new ApiError('Bạn không phải tác giả của phiên này.', 403);
    if (current.status !== 'PENDING')
      throw new ApiError('Chỉ được xoá phiên khi đang chờ duyệt.', 400);
    update((all) => all.filter((s) => s.session_id !== sessionId));
  },

  listPendingSessions(params: {
    subject_id?: number;
    after?: number;
    limit?: number;
  }): PendingSessionsResponse {
    const items = loadDemoSessions()
      .filter((s) => s.status === 'PENDING' || s.status === 'REVIEWING')
      .filter((s) => !params.subject_id || s.subject_id === params.subject_id)
      .sort(newestFirst);
    const { page, pagination } = paginate(
      items,
      (s) => s.session_id,
      params.after,
      params.limit,
    );
    return { items: page.map(toPendingItem), pagination };
  },

  /** Chỉ có ở demo: Swagger chưa có endpoint lịch sử phiên đã duyệt. */
  listResolvedSessions(): PendingSessionItemDto[] {
    return loadDemoSessions()
      .filter((s) => s.status === 'RESOLVED')
      .sort(newestFirst)
      .map(toPendingItem);
  },

  countPendingSessions(): number {
    return loadDemoSessions().filter((s) => s.status === 'PENDING').length;
  },

  getSessionDetailForReview(sessionId: number): SessionDetailReviewResponse {
    const s = findSession(sessionId);
    if (s.status === 'PENDING') {
      update((all) =>
        all.map((x) =>
          x.session_id === sessionId ? { ...x, status: 'REVIEWING' } : x,
        ),
      );
    }
    return {
      items: s.questions.map((q) => ({
        question_id: q.question_id,
        content: q.content,
        image_urls: q.image_urls,
        options: q.options,
        correct_answer: correctKey(q.options),
        explanation: q.explanation,
        status: q.status,
      })),
      duplicate_warnings: s.duplicate_warnings,
    };
  },

  approve(questionIds: number[]): ApproveQuestionsResponse {
    let approved = 0;
    update((all) =>
      all.map((s) => {
        if (!s.questions.some((q) => questionIds.includes(q.question_id)))
          return s;
        const questions = s.questions.map((q) => {
          if (!questionIds.includes(q.question_id) || q.status !== 'PENDING')
            return q;
          approved += 1;
          return { ...q, status: 'APPROVED' as const };
        });
        // Swagger: tự động hoàn tất phiên nếu mọi câu hỏi đã được xử lý.
        const done = questions.every((q) => q.status !== 'PENDING');
        return done
          ? {
              ...s,
              questions,
              status: 'RESOLVED' as const,
              reviewed_at: new Date().toISOString(),
              reviewed_by_lecturer: DEMO_LECTURER_NAME,
            }
          : { ...s, questions };
      }),
    );
    if (approved === 0)
      throw new ApiError('Không có câu hỏi nào ở trạng thái chờ duyệt.', 400);
    return { points_earned: approved * 10 };
  },

  reject(questionIds: number[], reason?: string): void {
    let rejected = 0;
    update((all) =>
      all.map((s) => ({
        ...s,
        questions: s.questions.map((q) => {
          if (!questionIds.includes(q.question_id) || q.status !== 'PENDING')
            return q;
          rejected += 1;
          return {
            ...q,
            status: 'REJECTED' as const,
            reject_reason: reason?.trim() || undefined,
          };
        }),
      })),
    );
    if (rejected === 0)
      throw new ApiError('Không có câu hỏi nào ở trạng thái chờ duyệt.', 400);
  },

  editQuestion(
    questionId: number,
    body: EditQuestionRequest,
  ): EditQuestionResponse {
    let found = false;
    let status: DemoQuestionStatus = 'PENDING';
    update((all) =>
      all.map((s) => ({
        ...s,
        questions: s.questions.map((q) => {
          if (q.question_id !== questionId) return q;
          found = true;
          status = body.auto_approve ? 'APPROVED' : q.status;
          return {
            ...q,
            content: body.content ?? q.content,
            options: body.options ?? q.options,
            explanation: body.explanation ?? q.explanation,
            status,
            edited_by_lecturer: true,
          };
        }),
      })),
    );
    if (!found) throw new ApiError('Không tìm thấy câu hỏi.', 404);
    return {
      question_id: questionId,
      status,
      reviewed_at: new Date().toISOString(),
    };
  },

  completeReview(sessionId: number): void {
    findSession(sessionId);
    update((all) =>
      all.map((s) =>
        s.session_id !== sessionId
          ? s
          : {
              ...s,
              status: 'RESOLVED',
              reviewed_at: new Date().toISOString(),
              reviewed_by_lecturer: DEMO_LECTURER_NAME,
              // Swagger: câu còn PENDING tự động bị từ chối khi chốt phiên.
              questions: s.questions.map((q) =>
                q.status === 'PENDING'
                  ? { ...q, status: 'REJECTED' as const }
                  : q,
              ),
            },
      ),
    );
  },
};
