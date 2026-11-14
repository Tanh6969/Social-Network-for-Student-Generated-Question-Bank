import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

type Schemas = components['schemas'];
export type SearchResultItemDto = Schemas['SearchResultItemDto'];
export type SessionSearchResultDto = Schemas['SessionSearchResultDto'];
export type QuestionSearchResultDto = Schemas['QuestionSearchResultDto'];
export type SearchType =
  'ALL' | 'POST' | 'USER' | 'QUESTION' | 'SESSION' | 'SUBJECT';

export interface SearchParams {
  type?: SearchType;
  /** Để trống = trả về tất cả (đã kiểm tra trên backend thật). */
  query?: string;
  /** Vị trí bắt đầu (offset) — backend trả `pagination.after` cho trang sau. */
  after?: number;
  /** Tối đa 50. */
  limit?: number;
}

export interface SearchPage {
  items: SearchResultItemDto[];
  hasNext: boolean;
  after?: number;
  totalHits: number;
}

export const searchApi = {
  /** GET /search — tìm kiếm toàn văn đa thực thể, phân trang theo offset. */
  async search(params: SearchParams = {}): Promise<SearchPage> {
    const query: SearchParams = {};
    if (params.query?.trim()) query.query = params.query.trim();
    if (params.type) query.type = params.type;
    if (params.after !== undefined) query.after = params.after;
    if (params.limit !== undefined) query.limit = params.limit;

    const result = await api.GET('/search', { params: { query } });
    const data = expectEnvelope(result).data;
    return {
      items: data?.items ?? [],
      hasNext: data?.pagination?.has_next ?? false,
      after: data?.pagination?.after ?? undefined,
      totalHits: data?.total_hits ?? 0,
    };
  },
};
