import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

export type CreateReportRequest = components['schemas']['CreateReportRequestDto'];

export const reportsApi = {
  async create(body: CreateReportRequest): Promise<void> {
    expectEnvelope(await api.POST('/report', { body }));
  },
};
