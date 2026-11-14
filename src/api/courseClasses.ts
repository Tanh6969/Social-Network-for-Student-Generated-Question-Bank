import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

type Schemas = components['schemas'];
export type CourseClassResponse = Schemas['CourseClassResponse'];
export type LecturerSummaryResponse = Schemas['LecturerSummaryResponse'];

export const courseClassesApi = {
  async listAll(semesterId?: number): Promise<CourseClassResponse[]> {
    return expectEnvelope(await api.GET('/lecturer/course-classes', {
      params: { query: { semester_id: semesterId } },
    })).data ?? [];
  },
  async getDetail(courseClassId: number): Promise<CourseClassResponse | null> {
    return expectEnvelope(await api.GET('/lecturer/course-classes/{courseClassId}', {
      params: { path: { courseClassId } },
    })).data ?? null;
  },
  async getLecturers(): Promise<LecturerSummaryResponse[]> {
    return expectEnvelope(await api.GET('/lecturer/course-classes/lecturers')).data ?? [];
  },
  async create(classCode: string, subjectId: number): Promise<CourseClassResponse | null> {
    return expectEnvelope(await api.POST('/lecturer/course-classes', {
      body: { class_code: classCode, subject_id: subjectId },
    })).data ?? null;
  },
  async assignStudents(courseClassId: number, studentCodes: string[]) {
    return expectEnvelope(await api.POST('/lecturer/course-classes/{courseClassId}/students', {
      params: { path: { courseClassId } },
      body: { student_codes: studentCodes },
    })).data;
  },
};
