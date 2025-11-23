import { apiClient } from './client';

/**
 * 사용자 정보 응답 타입
 */
export interface UserInfoResponse {
  name: string;
  email: string;
}

export const userApi = {
  /**
   * GET /api/v1/users/info - 사용자 정보 조회
   * @returns 사용자 정보 (이름, 이메일)
   */
  getUserInfo: async (): Promise<UserInfoResponse> => {
    const response = await apiClient.get<UserInfoResponse>('/users/info');
    return response.data;
  },
};

