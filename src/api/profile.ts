import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

export type ProfileResponse = components['schemas']['ProfileResponse'];

export const profileApi = {
  async getMyProfile(): Promise<ProfileResponse> {
    const result = await api.GET('/users/me');
    const profile = expectEnvelope(result).data;
    if (!profile?.user_id) {
      throw new Error('Phản hồi hồ sơ thiếu ID người dùng.');
    }
    return profile;
  },
};
