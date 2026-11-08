import type { components } from '../../api/generated/openapi';

export type {
  ApproveQuestionsResponse,
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
  SubmissionSessionSummary,
  SubmissionsResponse,
  UpdateSubmissionSessionRequest,
} from '../../api';

export type AuthorDto = components['schemas']['AuthorDto'];

/** Trạng thái phiên theo Swagger (tham số `status` của GET /sessions/my-submissions). */
export type SessionStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED';

/**
 * SubmissionSessionSummaryDto của Swagger KHÔNG có trường trạng thái; FE gắn
 * thêm `status` dựa trên bộ lọc đã dùng khi gọi API.
 */
export type SubmissionWithStatus =
  components['schemas']['SubmissionSessionSummaryDto'] & {
    status: SessionStatus;
  };
