import type { components } from '../../api/generated/openapi';

export type {
  ApproveQuestionsResponse,
  CourseClassOption,
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
export type SessionQuestionsResponse =
  components['schemas']['SessionQuestionsResponse'];
export type PracticeQuestionDto = components['schemas']['PracticeQuestionDto'];
export type AnswerQuestionResponse =
  components['schemas']['AnswerQuestionResponse'];
export type RateQuestionRequest = components['schemas']['RateQuestionRequest'];
export type RateQuestionResponse =
  components['schemas']['RateQuestionResponse'];
export type AiRefineResponse = components['schemas']['AiRefineResponse'];
export type AiApplyResponse = components['schemas']['AiApplyResponse'];

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
