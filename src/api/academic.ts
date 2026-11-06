import { api, expectEnvelope, type OpBody, type OpQuery } from './client';
import { multipartBody } from './multipart';

export const academicApi = {
  // ==========================================================================
  // 14. Quản trị Học kỳ (Semesters)
  // ==========================================================================

  /**
   * GET /admin/semesters
   */
  async getAllSemesters() {
    const result = await api.GET('/admin/semesters');
    return expectEnvelope(result).data ?? [];
  },

  /**
   * POST /admin/semesters
   */
  async createSemester(body: OpBody<'createSemester'>) {
    const result = await api.POST('/admin/semesters', { body });
    return expectEnvelope(result).data;
  },

  /**
   * PUT /admin/semesters/{semesterId}/activate
   */
  async activateSemester(semesterId: number) {
    const result = await api.PUT('/admin/semesters/{semesterId}/activate', {
      params: { path: { semesterId } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * PUT /admin/semesters/deactive-all
   */
  async deactivateAllSemesters() {
    const result = await api.PUT('/admin/semesters/deactive-all');
    return expectEnvelope(result).data;
  },

  /**
   * DELETE /admin/semesters/{semesterId}
   */
  async deleteSemester(semesterId: number) {
    const result = await api.DELETE('/admin/semesters/{semesterId}', {
      params: { path: { semesterId } },
    });
    return expectEnvelope(result).data;
  },

  // ==========================================================================
  // 15a & 15b. Quản trị & Danh mục Môn học (Subjects)
  // ==========================================================================

  /**
   * POST /admin/subjects
   */
  async createSubject(body: OpBody<'createSubject'>) {
    const result = await api.POST('/admin/subjects', { body });
    return expectEnvelope(result).data;
  },

  /**
   * GET /subjects
   */
  async getAllSubjects() {
    const result = await api.GET('/subjects');
    return expectEnvelope(result).data ?? [];
  },

  // ==========================================================================
  // 16a & 16b. Quản lý Lớp học phần (Course Classes)
  // ==========================================================================

  /**
   * GET /lecturer/course-classes
   */
  async getCourseClasses() {
    const result = await api.GET('/lecturer/course-classes');
    return expectEnvelope(result).data ?? [];
  },

  /**
   * POST /lecturer/course-classes
   */
  async createCourseClass(body: OpBody<'createCourseClass'>) {
    const result = await api.POST('/lecturer/course-classes', { body });
    return expectEnvelope(result).data;
  },

  /**
   * GET /lecturer/course-classes/{courseClassId}
   */
  async getCourseClassDetail(courseClassId: number) {
    const result = await api.GET('/lecturer/course-classes/{courseClassId}', {
      params: { path: { courseClassId } },
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /lecturer/course-classes/my-classes
   */
  async getMyCourseClasses(query?: OpQuery<'getMyCourseClasses'>) {
    const result = await api.GET('/lecturer/course-classes/my-classes', {
      params: { query },
    });
    return expectEnvelope(result).data ?? [];
  },

  /**
   * GET /lecturer/course-classes/lecturers
   */
  async getLecturers() {
    const result = await api.GET('/lecturer/course-classes/lecturers');
    return expectEnvelope(result).data ?? [];
  },

  /**
   * GET /lecturer/course-classes/{courseClassId}/students
   */
  async getClassStudents(courseClassId: number) {
    const result = await api.GET('/lecturer/course-classes/{courseClassId}/students', {
      params: { path: { courseClassId } },
    });
    return expectEnvelope(result).data ?? [];
  },

  /**
   * POST /lecturer/course-classes/{courseClassId}/students
   */
  async assignStudents(courseClassId: number, body: OpBody<'assignStudents'>) {
    const result = await api.POST('/lecturer/course-classes/{courseClassId}/students', {
      params: { path: { courseClassId } },
      body,
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /admin/course-classes/import-excel
   */
  async importCourseClassFromExcel(
    body: OpBody<'importCourseClassFromExcel'>,
    query?: OpQuery<'importCourseClassFromExcel'>,
  ) {
    const result = await api.POST('/admin/course-classes/import-excel', {
      params: { query },
      body,
      bodySerializer: multipartBody,
    });
    return expectEnvelope(result).data;
  },

  // ==========================================================================
  // 19. Luyện tập & Đánh giá Câu hỏi (Question Interaction)
  // ==========================================================================

  /**
   * GET /sessions/{sessionId}/questions
   */
  async getSessionQuestions(sessionId: number) {
    const result = await api.GET('/sessions/{sessionId}/questions', {
      params: { path: { sessionId } },
    });
    return expectEnvelope(result).data ?? [];
  },

  /**
   * GET /users/{userId}/sessions
   */
  async getUserProposedSessions(userId: number, query?: OpQuery<'getUserProposedSessions'>) {
    const result = await api.GET('/users/{userId}/sessions', {
      params: { path: { userId }, query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /questions/{questionId}/answer
   */
  async answerQuestion(questionId: number, body: OpBody<'answerQuestion'>) {
    const result = await api.POST('/questions/{questionId}/answer', {
      params: { path: { questionId } },
      body,
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /questions/{questionId}/rate
   */
  async rateQuestion(questionId: number, body: OpBody<'rateQuestion'>) {
    const result = await api.POST('/questions/{questionId}/rate', {
      params: { path: { questionId } },
      body,
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /questions/{questionId}/ratings
   */
  async getQuestionRatings(questionId: number, query?: OpQuery<'getQuestionRatings'>) {
    const result = await api.GET('/questions/{questionId}/ratings', {
      params: { path: { questionId }, query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /questions/{questionId}/statistics
   */
  async getQuestionStatistics(questionId: number) {
    const result = await api.GET('/questions/{questionId}/statistics', {
      params: { path: { questionId } },
    });
    return expectEnvelope(result).data;
  },

  // ==========================================================================
  // 24. Tích hợp Trí tuệ Nhân tạo (AI Integration)
  // ==========================================================================

  /**
   * POST /questions/{questionId}/ai-refine
   */
  async refineQuestion(questionId: number, body: OpBody<'refineQuestion'>) {
    const result = await api.POST('/questions/{questionId}/ai-refine', {
      params: { path: { questionId } },
      body,
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /questions/{questionId}/ai-apply
   */
  async applyAiRefinement(questionId: number, body: OpBody<'applyAiRefinement'>) {
    const result = await api.POST('/questions/{questionId}/ai-apply', {
      params: { path: { questionId } },
      body,
    });
    return expectEnvelope(result).data;
  },

  /**
   * POST /admin/ai/chat
   */
  async chatWithAi(body: OpBody<'chatWithAi'>) {
    const result = await api.POST('/admin/ai/chat', { body });
    return expectEnvelope(result).data;
  },

  /**
   * GET /admin/ai/chat/sessions
   */
  async getUserChatSessions(query?: OpQuery<'getUserChatSessions'>) {
    const result = await api.GET('/admin/ai/chat/sessions', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },

  /**
   * GET /admin/ai/chat/history
   */
  async getChatHistory(query?: OpQuery<'getChatHistory'>) {
    const result = await api.GET('/admin/ai/chat/history', {
      params: { query },
    });
    return expectEnvelope(result).data;
  },
};
