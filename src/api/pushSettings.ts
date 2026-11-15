import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

export type PushSettingsResponseDto =
  components['schemas']['PushSettingsResponseDto'];
export type UpdatePushSettingsRequestDto =
  components['schemas']['UpdatePushSettingsRequestDto'];
export type PushCategorySettingDto =
  components['schemas']['PushCategorySettingDto'];

export const pushSettingsApi = {
  async get(): Promise<PushSettingsResponseDto> {
    const data = expectEnvelope(await api.GET('/settings/push')).data;
    if (!data) throw new Error('Máy chủ không trả về cài đặt thông báo.');
    return data;
  },
  async update(
    settings: UpdatePushSettingsRequestDto,
  ): Promise<PushSettingsResponseDto> {
    const data = expectEnvelope(
      await api.PUT('/settings/push', { body: settings }),
    ).data;
    if (!data) throw new Error('Máy chủ không trả về cài đặt đã cập nhật.');
    return data;
  },
};
