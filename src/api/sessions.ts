import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

export type SubjectResponse = components['schemas']['SubjectResponse'];
export type CourseClassOption =
  components['schemas']['CourseClassOptionResponse'];
export type SubmissionSessionSummary =
  components['schemas']['SubmissionSessionSummaryDto'];
export type SubmissionsResponse = components['schemas']['SubmissionsResponse'];
export type MySubmissionDetail =
  components['schemas']['MySubmissionDetailResponse'];
export type ProposeSessionRequest =
  components['schemas']['ProposeSessionRequest'];
export type UpdateSubmissionSessionRequest =
  components['schemas']['UpdateSubmissionSessionRequest'];
export type QuestionProposeDto = components['schemas']['QuestionProposeDto'];
export type QuestionOption = components['schemas']['QuestionOption'];
export type PracticeSetDto = components['schemas']['PracticeSetDto'];
export type PracticeCatalogResponse =
  components['schemas']['PracticeCatalogResponse'];
export type TopicResponse = components['schemas']['TopicResponse'];

export interface PracticeCatalogParams {
  after?: number;
  limit?: number;
  subject_id?: number;
  q?: string;
}

export interface MySubmissionsParams {
  after?: number;
  limit?: number;
  subject_id?: number;
  status?: 'PENDING' | 'REVIEWING' | 'RESOLVED';
}

export const sessionsApi = {
  /** GET /subjects — toàn bộ môn học (mọi vai trò đã đăng nhập). */
  async getAllSubjects(): Promise<SubjectResponse[]> {
    const result = await api.GET('/subjects');
    return expectEnvelope(result).data ?? [];
  },

  /** GET /subjects/{subjectId}/topics — danh sách chủ đề đang hoạt động của môn học. */
  async getSubjectTopics(subjectId: number): Promise<TopicResponse[]> {
    const result = await api.GET('/subjects/{subjectId}/topics', {
      params: { path: { subjectId } },
    });
    return expectEnvelope(result).data ?? [];
  },

  /**
   * GET /sessions/my-enrolled-course-classes — lớp học phần đang/đã tham gia.
   * Chỉ lớp thuộc học kỳ hiện tại có can_propose=true.
   */
  async getMyEnrolledCourseClasses(): Promise<CourseClassOption[]> {
    const result = await api.GET('/sessions/my-enrolled-course-classes');
    return expectEnvelope(result).data ?? [];
  },

  /**
   * Lấy danh sách bộ câu hỏi đã chốt (RESOLVED) trong kho luyện tập
   */
  async getPracticeCatalog(
    params?: PracticeCatalogParams,
  ): Promise<PracticeCatalogResponse> {
    const query: PracticeCatalogParams = {};
    if (params?.after !== undefined) query.after = params.after;
    if (params?.limit !== undefined) query.limit = params.limit;
    if (params?.subject_id !== undefined) query.subject_id = params.subject_id;
    if (params?.q?.trim()) query.q = params.q.trim();

    const result = await api.GET('/sessions/practice-catalog', {
      params: { query },
    });
    return (
      expectEnvelope(result).data ?? {
        contents: [],
        pagination: { has_next: false, has_prev: false },
      }
    );
  },

  /**
   * Lấy danh sách phiên đề xuất của chính mình kèm phân trang và lọc
   */
  async getMySubmissions(
    params?: MySubmissionsParams,
  ): Promise<SubmissionsResponse> {
    const queryParams: Record<string, string | number> = {};
    if (params?.after !== undefined) queryParams.after = params.after;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.subject_id !== undefined)
      queryParams.subject_id = params.subject_id;
    if (params?.status) queryParams.status = params.status;

    const result = await api.GET('/sessions/my-submissions', {
      params: {
        query: queryParams as unknown as {
          after?: number;
          limit?: number;
          subject_id?: number;
          status?: 'PENDING' | 'REVIEWING' | 'RESOLVED';
        },
      },
    });
    const envelope = expectEnvelope(result);
    return (
      envelope.data ?? {
        contents: [],
        pagination: { has_next: false, has_prev: false },
      }
    );
  },

  /**
   * Xem chi tiết phiên đề xuất của chính mình
   */
  async getMySubmissionDetail(sessionId: number): Promise<MySubmissionDetail> {
    const result = await api.GET('/sessions/my-submissions/{sessionId}', {
      params: {
        path: { sessionId },
      },
    });
    const envelope = expectEnvelope(result);
    if (!envelope.data) {
      throw new Error('Không tìm thấy thông tin phiên đề xuất.');
    }
    return envelope.data;
  },

  /**
   * Đề xuất phiên câu hỏi mới
   */
  async proposeSession(body: ProposeSessionRequest) {
    const result = await api.POST('/sessions/propose', {
      body,
    });
    const envelope = expectEnvelope(result);
    return envelope.data;
  },

  /**
   * Cập nhật phiên đề xuất (chỉ áp dụng khi PENDING)
   */
  async updateMySubmission(
    sessionId: number,
    body: UpdateSubmissionSessionRequest,
  ): Promise<void> {
    const result = await api.PUT('/sessions/my-submissions/{sessionId}', {
      params: {
        path: { sessionId },
      },
      body,
    });
    expectEnvelope(result);
  },

  /**
   * Xóa/hủy phiên đề xuất (chỉ áp dụng khi PENDING)
   */
  async deleteMySubmission(sessionId: number): Promise<void> {
    const result = await api.DELETE('/sessions/my-submissions/{sessionId}', {
      params: {
        path: { sessionId },
      },
    });
    expectEnvelope(result);
  },
};
