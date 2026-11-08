/**
 * Đưa các bộ câu hỏi ĐÃ ĐƯỢC GIẢNG VIÊN XEM XÉT XONG (RESOLVED) trong kho demo
 * vào màn hình luyện tập của sinh viên (ProposeSession/Question).
 *
 * Quan trọng: lấy TOÀN BỘ câu của bộ, không lọc theo câu được chọn vào ngân
 * hàng đề — sinh viên không được biết câu nào được chọn (giữ bí mật đề thi và
 * phục vụ minigame). Mọi câu đều mang cùng một trạng thái hiển thị.
 */
import type { ProposeSession, Question, User } from '../demo/types';
import { mockCurrentUserStudent } from '../../mocks/mockData';
import { DEMO_SUBJECTS, loadDemoSessions, type DemoSession } from './demoStore';

/** Tiền tố id để nhận biết (và thay thế) dữ liệu lấy từ kho demo. */
export const DEMO_BANK_SESSION_PREFIX = 'dsess_';
export const DEMO_BANK_QUESTION_PREFIX = 'dq_';

type OptionId = Question['options'][number]['id'];
const OPTION_IDS: OptionId[] = ['A', 'B', 'C', 'D'];

function asOptionId(key: string | undefined): OptionId | null {
  return OPTION_IDS.find((id) => id === key) ?? null;
}

function toUser(session: DemoSession): User {
  if (session.mine) return mockCurrentUserStudent;
  return {
    id: `demo_user_${session.author.user_id ?? 0}`,
    name: session.author.full_name ?? 'Sinh viên',
    role: 'STUDENT',
    email: '',
    avatar: session.author.avatar_url ?? '',
    coverImage: '',
    bio: '',
    faculty: '',
    classOrTitle: '',
    points: 0,
    approvedQuestionsCount: 0,
    friendsCount: 0,
    followersCount: 0,
    isOnline: false,
  };
}

export function buildDemoBank(): {
  sessions: ProposeSession[];
  questions: Question[];
} {
  const sessions: ProposeSession[] = [];
  const questions: Question[] = [];

  loadDemoSessions().forEach((s) => {
    if (s.status !== 'RESOLVED' || s.questions.length === 0) return;
    const practiceQuestions = s.questions;

    const subject =
      DEMO_SUBJECTS.find((x) => x.subject_id === s.subject_id)?.name ??
      'Môn học';
    const creator = toUser(s);
    const sessionId = `${DEMO_BANK_SESSION_PREFIX}${s.session_id}`;

    practiceQuestions.forEach((q) => {
      // Ngân hàng hiện chỉ hiển thị câu 4 phương án A–D.
      const options = q.options
        .map((o) => ({ id: asOptionId(o.key), text: o.text ?? '' }))
        .filter((o): o is { id: OptionId; text: string } => o.id !== null);
      const correct = asOptionId(q.options.find((o) => o.is_correct)?.key);
      if (!correct || options.length < 2) return;
      questions.push({
        id: `${DEMO_BANK_QUESTION_PREFIX}${q.question_id}`,
        sessionId,
        subject,
        chapter: s.title,
        content: q.content,
        imageUrl: q.image_urls[0],
        options,
        correctAnswer: correct,
        explanation: q.explanation ?? '',
        difficulty: 'MEDIUM',
        // Trạng thái giống nhau cho mọi câu để không lộ câu nào được chọn.
        status: 'APPROVED',
        creatorId: creator.id,
        creatorName: creator.name,
        creatorAvatar: creator.avatar,
        ratingAverage: 0,
        ratingCount: 0,
        totalAttempts: 0,
        correctAttempts: 0,
      });
    });

    sessions.push({
      id: sessionId,
      title: s.title,
      subject,
      chapter: s.title,
      creator,
      status: 'COMPLETED',
      questions: [], // BankView lấy câu hỏi theo sessionId từ danh sách questions
      submittedAt: s.created_at,
      reviewedAt: s.reviewed_at,
    });
  });

  return { sessions, questions };
}

/**
 * Gộp dữ liệu kho demo vào state hiện có: thay toàn bộ phần tử có tiền tố demo,
 * nhưng giữ lại số liệu làm bài/đánh giá người dùng đã tạo trong phiên này.
 */
export function mergeDemoBank<T extends { id: string }>(
  current: T[],
  incoming: T[],
  prefix: string,
  keep?: (previous: T, next: T) => T,
): T[] {
  const previousById = new Map(
    current
      .filter((item) => item.id.startsWith(prefix))
      .map((item) => [item.id, item]),
  );
  const merged = incoming.map((next) => {
    const previous = previousById.get(next.id);
    return previous && keep ? keep(previous, next) : next;
  });
  return [...merged, ...current.filter((item) => !item.id.startsWith(prefix))];
}
