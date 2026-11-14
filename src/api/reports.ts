import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

type Schemas = components['schemas'];
export type CreateReportRequestDto = Schemas['CreateReportRequestDto'];
export type ReportResponseDto = Schemas['ReportResponseDto'];
export type ReportTargetType = CreateReportRequestDto['target_type'];
export type ViolationType = CreateReportRequestDto['violation_type'];

export const reportsApi = {
  /** POST /report — Gửi báo cáo vi phạm nội dung hoặc người dùng. */
  async createReport(
    body: CreateReportRequestDto,
  ): Promise<ReportResponseDto | undefined> {
    const result = await api.POST('/report', { body });
    return expectEnvelope(result).data;
  },
};
