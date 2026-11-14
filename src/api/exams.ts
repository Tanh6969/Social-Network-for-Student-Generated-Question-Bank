import { api, expectEnvelope } from './client';
import { isApiSession } from './session-mode';
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

export type DifficultyDistribution =
  components['schemas']['DifficultyDistribution'];
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
export type ClassStudentResponse =
  components['schemas']['ClassStudentResponse'];
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

/** Envelope thành công nhưng thiếu `data` — coi là lỗi, không bịa dữ liệu. */
function requireData<T>(data: T | undefined | null, what: string): T {
  if (data === undefined || data === null) {
    throw new Error(`Máy chủ không trả về ${what}.`);
  }
  return data;
}

// ============================================================================
// Demo data — chỉ dùng khi KHÔNG có phiên đăng nhập thật (isApiSession() = false)
// ============================================================================

const demoExams = {
  generateExam(data: GenerateExamRequest): ExamDetailResponse {
    return generateMockExamLocally(data);
  },

  getMyExams(params?: GetMyExamsParams): ExamListResponse {
    let items = loadStoredMockExams();
    if (params?.subject_id !== undefined && params.subject_id > 0) {
      const sub = MOCK_SUBJECTS.find((s) => s.subject_id === params.subject_id);
      if (sub) items = items.filter((e) => e.subject_name === sub.name);
    }

    const limit = params?.limit || 10;
    let startIndex = 0;
    if (params?.after !== undefined) {
      const foundIdx = items.findIndex((e) => e.exam_id === params.after);
      if (foundIdx !== -1) startIndex = foundIdx + 1;
    }

    const sliced = items.slice(startIndex, startIndex + limit);
    const hasNext = startIndex + limit < items.length;
    const nextCursor =
      hasNext && sliced.length > 0
        ? sliced[sliced.length - 1].exam_id
        : undefined;

    return {
      items: sliced,
      pagination: {
        after: nextCursor,
        has_next: hasNext,
        has_prev: startIndex > 0,
      },
    };
  },

  getExamDetail(examId: number): ExamDetailResponse {
    return (
      loadStoredMockExamDetails()[examId] ??
      generateMockExamLocally({
        subject_id: 1,
        class_ids: [101],
        title: `Đề thi #${examId}`,
        question_count: 5,
      })
    );
  },

  exportExam(examId: number): ExportResponse {
    return generateMockExportLocally(`Đề thi #${examId}`, 30);
  },

  exportQuestions(params: ExportQuestionsParams): ExportResponse {
    const sub = MOCK_SUBJECTS.find((s) => s.subject_id === params.subject_id);
    const subName = sub?.name || 'Môn học #' + params.subject_id;
    return generateMockExportLocally(`Ngân hàng câu hỏi ${subName}`, 85);
  },
};

// ============================================================================
// Exam service
// Phiên thật: chỉ gọi REST theo Swagger, lỗi được ném ra nguyên văn cho UI hiển thị.
// Không bao giờ quay về dữ liệu mock khi API lỗi hoặc trả rỗng.
// ============================================================================

export const examsApi = {
  /** POST /exams/generate — tự động sinh đề thi từ ngân hàng câu hỏi đã APPROVED */
  async generateExam(data: GenerateExamRequest): Promise<ExamDetailResponse> {
    if (!isApiSession()) return demoExams.generateExam(data);

    const envelope = expectEnvelope(
      await api.POST('/exams/generate', { body: data }),
    );
    return requireData(envelope.data, 'đề thi vừa sinh');
  },

  /** GET /exams/my-exams — danh sách đề thi của giảng viên (cursor + lọc môn) */
  async getMyExams(params?: GetMyExamsParams): Promise<ExamListResponse> {
    if (!isApiSession()) return demoExams.getMyExams(params);

    const query: { after?: number; limit?: number; subject_id?: number } = {};
    if (params?.after !== undefined) query.after = params.after;
    if (params?.limit !== undefined) query.limit = params.limit;
    if (params?.subject_id !== undefined && params.subject_id > 0) {
      query.subject_id = params.subject_id;
    }

    const envelope = expectEnvelope(
      await api.GET('/exams/my-exams', { params: { query } }),
    );
    return (
      envelope.data ?? {
        items: [],
        pagination: { has_next: false, has_prev: false },
      }
    );
  },

  /** GET /exams/{examId} — chi tiết đề thi và danh sách câu hỏi */
  async getExamDetail(examId: number): Promise<ExamDetailResponse> {
    if (!isApiSession()) return demoExams.getExamDetail(examId);

    const envelope = expectEnvelope(
      await api.GET('/exams/{examId}', { params: { path: { examId } } }),
    );
    return requireData(envelope.data, `chi tiết đề thi #${examId}`);
  },

  /** GET /exams/{examId}/export — xuất file đề thi (PDF / Excel), trả về link tải */
  async exportExam(
    examId: number,
    params?: ExportExamParams,
  ): Promise<ExportResponse> {
    if (!isApiSession()) return demoExams.exportExam(examId);

    const query: {
      format?: string;
      include_answer_key?: boolean;
      paper_size?: string;
    } = {};
    if (params?.format) query.format = params.format;
    if (params?.include_answer_key !== undefined) {
      query.include_answer_key = params.include_answer_key;
    }
    if (params?.paper_size) query.paper_size = params.paper_size;

    const envelope = expectEnvelope(
      await api.GET('/exams/{examId}/export', {
        params: { path: { examId }, query },
      }),
    );
    return requireData(envelope.data, 'link tải file đề thi');
  },

  /** GET /lecturer/questions/export — xuất toàn bộ câu hỏi môn học ra PDF / Excel */
  async exportQuestions(
    params: ExportQuestionsParams,
  ): Promise<ExportResponse> {
    if (!isApiSession()) return demoExams.exportQuestions(params);

    const query: {
      subject_id: number;
      format?: string;
      include_answer?: boolean;
    } = {
      subject_id: params.subject_id,
    };
    if (params.format) query.format = params.format;
    if (params.include_answer !== undefined)
      query.include_answer = params.include_answer;

    const envelope = expectEnvelope(
      await api.GET('/lecturer/questions/export', { params: { query } }),
    );
    return requireData(envelope.data, 'link tải file ngân hàng câu hỏi');
  },

  /** GET /lecturer/course-classes/my-classes — lớp học phần giảng viên phụ trách */
  async getMyCourseClasses(): Promise<CourseClassResponse[]> {
    if (!isApiSession()) return MOCK_COURSE_CLASSES;

    const envelope = expectEnvelope(
      await api.GET('/lecturer/course-classes/my-classes'),
    );
    return envelope.data ?? [];
  },

  /** GET /lecturer/course-classes/{courseClassId}/students — sinh viên trong lớp */
  async getClassStudents(
    courseClass: CourseClassResponse,
  ): Promise<ClassStudentResponse[]> {
    if (!isApiSession()) return buildMockClassStudents(courseClass);

    const courseClassId = courseClass.course_class_id;
    if (courseClassId === undefined) {
      throw new Error('Lớp học phần không có mã định danh.');
    }
    const envelope = expectEnvelope(
      await api.GET('/lecturer/course-classes/{courseClassId}/students', {
        params: { path: { courseClassId } },
      }),
    );
    return envelope.data ?? [];
  },

  /** GET /subjects — danh mục tất cả môn học */
  async getAllSubjects(): Promise<SubjectResponse[]> {
    if (!isApiSession()) return MOCK_SUBJECTS;

    const envelope = expectEnvelope(await api.GET('/subjects'));
    return envelope.data ?? [];
  },
};
