import { config } from '../config/env';

/**
 * 서버에서 제공하는 이미지 경로를 전체 URL로 변환
 * 서버 경로: /images/파일명
 * 전체 URL: http://localhost:8080/images/파일명
 */
export const getImageUrl = (filePath: string): string => {
  // 이미 전체 URL인 경우 그대로 반환
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // /images/... 형태의 경로를 서버 URL과 결합
  // filePath가 /로 시작하지 않으면 추가
  const path = filePath.startsWith('/') ? filePath : `/${filePath}`;

  return `${config.serverUrl}${path}`;
};
