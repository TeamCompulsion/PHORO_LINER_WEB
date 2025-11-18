export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
  serverUrl: import.meta.env.VITE_SERVER_URL as string,
  naverMapClientId: import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string,
  defaultUserId: Number(import.meta.env.VITE_DEFAULT_USER_ID) || 1,
} as const;

// 환경변수 유효성 검사
export const validateEnv = () => {
  if (!config.apiBaseUrl) {
    console.warn('VITE_API_BASE_URL is not set');
  }
  if (!config.serverUrl) {
    console.warn('VITE_SERVER_URL is not set');
  }
  if (!config.naverMapClientId) {
    console.warn('VITE_NAVER_MAP_CLIENT_ID is not set. Map features will not work.');
  }
};
