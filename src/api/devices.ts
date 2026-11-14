import { api, expectEnvelope } from './client';
import type { components } from './generated/openapi';

type Schemas = components['schemas'];
export type DeviceResponse = Schemas['DeviceResponse'];
export type DeviceInfoDto = DeviceResponse;
export type DeviceListResponse = Schemas['DeviceListResponse'];
export type SyncFidRequest = Schemas['SyncFidRequest'];
export type UnregisterFidRequest = Schemas['UnregisterFidRequest'];

export const devicesApi = {
  /** GET /devices — Lấy danh sách thiết bị đang đăng nhập. */
  async getMyDevices(): Promise<DeviceResponse[]> {
    const result = await api.GET('/devices');
    return expectEnvelope(result).data?.devices ?? [];
  },

  /** POST /devices/fid — Đồng bộ Firebase Installation ID (FID). */
  async syncFid(body: SyncFidRequest): Promise<void> {
    const result = await api.POST('/devices/fid', { body });
    expectEnvelope(result);
  },

  /** POST /devices/fid/unregister — Hủy đăng ký Firebase Installation ID (FID). */
  async unregisterFid(body: UnregisterFidRequest = { fid: '' }): Promise<void> {
    const result = await api.POST('/devices/fid/unregister', { body });
    expectEnvelope(result);
  },

  /** POST /devices/{deviceId}/logout — Đăng xuất thiết bị chỉ định. */
  async logoutDevice(deviceId: string): Promise<void> {
    const result = await api.POST('/devices/{deviceId}/logout', {
      params: { path: { deviceId } },
    });
    expectEnvelope(result);
  },

  /** DELETE /devices/{deviceId} — Xóa thông tin thiết bị khỏi tài khoản. */
  async deleteDevice(deviceId: string): Promise<void> {
    const result = await api.DELETE('/devices/{deviceId}', {
      params: { path: { deviceId } },
    });
    expectEnvelope(result);
  },
};
