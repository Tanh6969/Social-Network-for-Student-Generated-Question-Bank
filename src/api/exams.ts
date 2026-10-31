import { api, expectEnvelope } from './client';
import { tokenStore } from './token';
import type { components } from './generated/openapi';
import {
  loadStoredMockExams,
  loadStoredMockExamDetails,
  generateMockExamLocally,
  generateMockExportLocally,
  MOCK_SUBJECTS,
  MOCK_COURSE_CLASSES,
  buildMockClassStudents,
} from '../features/lecturer/mockExamData';

// ============================================================================
// TypeScript Types re-exported from OpenAPI Schema
// ============================================================================

export type DifficultyDistribution = components['schemas']['DifficultyDistribution'];
export type GenerateExamRequest = components['schemas']['GenerateExamRequest'];
export type ExamDetailResponse = components['schemas']['ExamDetailResponse'];
export type ExamQuestionDto = components['schemas']['ExamQuestionDto'];
export type ExamOptionDto = components['schemas']['OptionDto'];
export type ExamStatistic = components['schemas']['Statistic'];
export type ExamItem = components['schemas']['ExamItem'];
export type ExamListResponse = components['schemas']['ExamListResponse'];
export type CursorPaginationDto = components['schemas']['CursorPaginationDto'];
export type ExportResponse = components['schemas']['ExportResponse'];
export type CourseClassResponse = components['schemas']['CourseClassResponse'];
export type ClassStudentResponse = components['schemas']['ClassStudentResponse'];
export type SubjectResponse = components['schemas']['SubjectResponse'];

export interface GetMyExamsParams {
  after?: number;
  limit?: number;
  subject_id?: number;
}

export interface ExportExamParams {
  format?: 'pdf' | 'excel' | 'xlsx' | string;
  include_answer_key?: boolean;
  paper_size?: 'A4' | 'Letter' | string;
}

export interface ExportQuestionsParams {
  subject_id: number;
  format?: 'pdf' | 'excel' | 'xlsx' | string;
  include_answer?: boolean;
}

// ============================================================================
// Exam Service & API Client Wrapper with Offline Mock Fallback
// ============================================================================

export const examsApi = {
  /**
   * Tự động sinh đề thi từ ngân hàng câu hỏi đã APPROVED
   * POST /exams/generate
   */
  async generateExam(data: GenerateExamRequest): Promise<ExamDetailResponse> {
    const token = tokenStore.get();
    if (!token) {
      return generateMockExamLocally(data);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const result = await api.POST('/exams/generate', {
        body: data,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const envelope = expectEnvelope(result);
      if (envelope.data) return envelope.data;
      return generateMockExamLocally(data);
    } catch {
      // Fallback locally when server is offline (ERR_CONNECTION_REFUSED)
      return generateMockExamLocally(data);
    }
  },

  /**
   * Lấy danh sách đề thi của giảng viên đăng nhập (phân trang cursor + lọc môn học)
   * GET /exams/my-exams
   */
  async getMyExams(params?: GetMyExamsParams): Promise<ExamListResponse> {
    const token = tokenStore.get();

    // Helper for mock pagination
    const getMockResponse = (): ExamListResponse => {
      let items = loadStoredMockExams();
      if (params?.subject_id !== undefined && params.subject_id > 0) {
        const sub = MOCK_SUBJECTS.find((s) => s.subject_id === params.subject_id);
        if (sub) {
          items = items.filter((e) => e.subject_name === sub.name);
        }
      }

      const limit = params?.limit || 10;
      let startIndex = 0;
      if (params?.after !== undefined) {
        const foundIdx = items.findIndex((e) => e.exam_id === params.after);
        if (foundIdx !== -1) startIndex = foundIdx + 1;
      }

      const sliced = items.slice(startIndex, startIndex + limit);
      const hasNext = startIndex + limit < items.length;
      const nextCursor = hasNext && sliced.length > 0 ? sliced[sliced.length - 1].exam_id : undefined;

      return {
        items: sliced,
        pagination: {
          after: nextCursor,
          has_next: hasNext,
          has_prev: startIndex > 0,
        },
      };
    };

    if (!token) {
      return getMockResponse();
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const query: Record<string, string | number> = {};
      if (params?.after !== undefined) query.after = params.after;
      if (params?.limit !== undefined) query.limit = params.limit;
      if (params?.subject_id !== undefined && params.subject_id > 0) {
        query.subject_id = params.subject_id;
      }

      const result = await api.GET('/exams/my-exams', {
        params: {
          query: query as {
            after?: number;
            limit?: number;
            subject_id?: number;
          },
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const envelope = expectEnvelope(result);
      if (envelope.data && envelope.data.items && envelope.data.items.length > 0) {
        return envelope.data;
      }
      return getMockResponse();
    } catch {
      // Return mock data immediately if server is offline (ERR_CONNECTION_REFUSED)
      return getMockResponse();
    }
  },

  /**
   * Xem chi tiết đề thi và danh sách câu hỏi
   * GET /exams/{examId}
   */
  async getExamDetail(examId: number): Promise<ExamDetailResponse> {
    const token = tokenStore.get();
    const mockDetails = loadStoredMockExamDetails();

    if (!token) {
      if (mockDetails[examId]) return mockDetails[examId];
      // Generate a mock detail if not found
      return generateMockExamLocally({
        subject_id: 1,
        class_ids: [101],
        title: `Đề thi #${examId}`,
        question_count: 5,
      });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const result = await api.GET('/exams/{examId}', {
        params: {
          path: { examId },
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const envelope = expectEnvelope(result);
      if (envelope.data) return envelope.data;
      return mockDetails[examId] || generateMockExamLocally({
        subject_id: 1,
        class_ids: [101],
        title: `Đề thi #${examId}`,
        question_count: 5,
      });
    } catch {
      return mockDetails[examId] || generateMockExamLocally({
        subject_id: 1,
        class_ids: [101],
        title: `Đề thi #${examId}`,
        question_count: 5,
      });
    }
  },

  /**
   * Xuất file đề thi (PDF / Excel)
   * GET /exams/{examId}/export
   */
  async exportExam(examId: number, params?: ExportExamParams): Promise<ExportResponse> {
    const token = tokenStore.get();
    if (!token) {
      return generateMockExportLocally(`Đề thi #${examId}`, 30);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const query: Record<string, string | boolean> = {};
      if (params?.format) query.format = params.format;
      if (params?.include_answer_key !== undefined) {
        query.include_answer_key = params.include_answer_key;
      }
      if (params?.paper_size) query.paper_size = params.paper_size;

      const result = await api.GET('/exams/{examId}/export', {
        params: {
          path: { examId },
          query: query as {
            format?: string;
            include_answer_key?: boolean;
            paper_size?: string;
          },
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const envelope = expectEnvelope(result);
      if (envelope.data) return envelope.data;
      return generateMockExportLocally(`Đề thi #${examId}`, 30);
    } catch {
      return generateMockExportLocally(`Đề thi #${examId}`, 30);
    }
  },

  /**
   * Giảng viên xuất toàn bộ câu hỏi môn học ra PDF hoặc Excel
   * GET /lecturer/questions/export
   */
  async exportQuestions(params: ExportQuestionsParams): Promise<ExportResponse> {
    const token = tokenStore.get();
    const sub = MOCK_SUBJECTS.find((s) => s.subject_id === params.subject_id);
    const subName = sub?.name || 'Môn học #' + params.subject_id;

    if (!token) {
      return generateMockExportLocally(`Ngân hàng câu hỏi ${subName}`, 85);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const query: Record<string, string | number | boolean> = {
        subject_id: params.subject_id,
      };
      if (params.format) query.format = params.format;
      if (params.include_answer !== undefined) query.include_answer = params.include_answer;

      const result = await api.GET('/lecturer/questions/export', {
        params: {
          query: query as {
            subject_id: number;
            format?: string;
            include_answer?: boolean;
          },
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const envelope = expectEnvelope(result);
      if (envelope.data) return envelope.data;
      return generateMockExportLocally(`Ngân hàng câu hỏi ${subName}`, 85);
    } catch {
      return generateMockExportLocally(`Ngân hàng câu hỏi ${subName}`, 85);
    }
  },

  /**
   * Lấy danh sách lớp học phần do Giảng viên hiện tại phụ trách
   * GET /lecturer/course-classes/my-classes
   */
  async getMyCourseClasses(): Promise<CourseClassResponse[]> {
    const token = tokenStore.get();
    if (!token) return MOCK_COURSE_CLASSES;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const result = await api.GET('/lecturer/course-classes/my-classes', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const envelope = expectEnvelope(result);
      if (envelope.data && envelope.data.length > 0) return envelope.data;
      return MOCK_COURSE_CLASSES;
    } catch {
      return MOCK_COURSE_CLASSES;
    }
  },

  /**
   * Lấy danh sách sinh viên trong lớp học phần
   * GET /lecturer/course-classes/{courseClassId}/students
   */
  async getClassStudents(courseClass: CourseClassResponse): Promise<ClassStudentResponse[]> {
    const token = tokenStore.get();
    const courseClassId = courseClass.course_class_id;
    if (!token || courseClassId === undefined) return buildMockClassStudents(courseClass);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const result = await api.GET('/lecturer/course-classes/{courseClassId}/students', {
        params: { path: { courseClassId } },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const envelope = expectEnvelope(result);
      return envelope.data ?? [];
    } catch {
      return buildMockClassStudents(courseClass);
    }
  },

  /**
   * Lấy danh mục tất cả môn học trong hệ thống
   * GET /subjects
   */
  async getAllSubjects(): Promise<SubjectResponse[]> {
    const token = tokenStore.get();
    if (!token) return MOCK_SUBJECTS;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const result = await api.GET('/subjects', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const envelope = expectEnvelope(result);
      if (envelope.data && envelope.data.length > 0) return envelope.data;
      return MOCK_SUBJECTS;
    } catch {
      return MOCK_SUBJECTS;
    }
  },
};
