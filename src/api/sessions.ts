import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

export type SubjectResponse = components['schemas']['SubjectResponse'];
export type CourseClassOptionResponse = components['schemas']['CourseClassOptionResponse'];
export type SubmissionSessionSummary =
  components['schemas']['SubmissionSessionSummaryDto'];
export type SubmissionsResponse = components['schemas']['SubmissionsResponse'];
export type MySubmissionDetail =
  components['schemas']['MySubmissionDetailResponse'];
export type ProposeSessionRequest = Omit<
  components['schemas']['ProposeSessionRequest'],
  'course_class_id'
> & {
  course_class_id?: number;
  subject_id?: number;
};
export type UpdateSubmissionSessionRequest =
  components['schemas']['UpdateSubmissionSessionRequest'] & { subject_id?: number };
export type QuestionProposeDto = components['schemas']['QuestionProposeDto'];
export type QuestionOption = components['schemas']['QuestionOption'];

export interface MySubmissionsParams {
  after?: number;
  limit?: number;
  subject_id?: number;
  status?: 'PENDING' | 'REVIEWING' | 'RESOLVED';
}

export const sessionsApi = {
  /**
   * GET /sessions/my-enrolled-course-classes
   * Lấy danh sách lớp học phần người dùng đang tham gia
   */
  async getMyEnrolledCourseClasses(): Promise<CourseClassOptionResponse[]> {
    const result = await api.GET('/sessions/my-enrolled-course-classes');
    const envelope = expectEnvelope(result);
    return envelope.data ?? [];
  },

  /**
   * Lấy danh sách môn học người dùng đang tham gia (ánh xạ từ lớp học phần hoặc danh mục môn học)
   */
  async getMyEnrolledSubjects(): Promise<SubjectResponse[]> {
    try {
      const classes = await this.getMyEnrolledCourseClasses();
      if (classes.length > 0) {
        const seen = new Set<number>();
        const subjects: SubjectResponse[] = [];
        for (const cls of classes) {
          const sid = cls.subject_id ?? cls.course_class_id;
          if (sid !== undefined && !seen.has(sid)) {
            seen.add(sid);
            subjects.push({
              subject_id: sid,
              code: cls.subject_code,
              name: cls.subject_name,
            });
          }
        }
        return subjects;
      }
    } catch {
      // Fallback to /subjects
    }
    const result = await api.GET('/subjects');
    const envelope = expectEnvelope(result);
    return envelope.data ?? [];
  },

  /**
   * GET /sessions/my-submissions
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
   * GET /sessions/my-submissions/{sessionId}
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
   * POST /sessions/propose
   * Đề xuất phiên câu hỏi mới
   */
  async proposeSession(body: ProposeSessionRequest) {
    const result = await api.POST('/sessions/propose', {
      body: {
        ...body,
        course_class_id: body.course_class_id ?? body.subject_id ?? 100,
      },
    });
    const envelope = expectEnvelope(result);
    return envelope.data;
  },

  /**
   * PUT /sessions/my-submissions/{sessionId}
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
      body: {
        ...body,
        course_class_id: body.course_class_id ?? body.subject_id,
      },
    });
    expectEnvelope(result);
  },

  /**
   * DELETE /sessions/my-submissions/{sessionId}
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
