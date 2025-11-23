import { apiClient } from './client';

/**
 * 카카오 로그인 인증 URL 요청
 * 서버는 302 FOUND 응답과 함께 Location 헤더에 카카오 인증 URL을 반환합니다.
 * @returns redirect URL (카카오 인증 페이지 URL)
 */
export const getKakaoAuthorizationUrl = async (): Promise<string> => {
  try {
    const response = await apiClient.get('/users/login/kakao/authorization', {
      maxRedirects: 0, // 리다이렉트를 자동으로 따라가지 않음
      validateStatus: (status) => status === 302 || status === 200,
    });

    // 302 FOUND 응답인 경우 Location 헤더에서 URL 추출
    if (response.status === 302) {
      // Location 헤더는 대소문자 구분 없이 접근 가능
      const location = response.headers.location || response.headers.Location;
      if (location) {
        return location;
      }
      throw new Error('Location 헤더가 없습니다.');
    }

    // 200 응답인 경우 (일부 서버는 200으로 리다이렉트 URL 반환)
    if (response.data && typeof response.data === 'string') {
      return response.data;
    }

    throw new Error('카카오 인증 URL을 가져올 수 없습니다.');
  } catch (error: any) {
    // axios가 302를 에러로 처리하는 경우 Location 헤더 확인
    if (error.response?.status === 302) {
      const location = error.response.headers.location || error.response.headers.Location;
      if (location) {
        return location;
      }
    }
    throw error;
  }
};

/**
 * 카카오 로그인 콜백 처리
 * @param code 카카오 인증 코드
 * @returns 로그인 성공 응답
 */
export const loginWithKakao = async (code: string): Promise<any> => {
  const response = await apiClient.get('/users/login/kakao', {
    params: { code },
  });
  return response.data;
};

