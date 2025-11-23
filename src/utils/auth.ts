const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';

/**
 * 인증 토큰 저장
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

/**
 * 인증 토큰 조회
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * 인증 토큰 제거
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

/**
 * 리프레시 토큰 저장
 */
export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

/**
 * 리프레시 토큰 조회
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * 리프레시 토큰 제거
 */
export const removeRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * 사용자 정보 저장
 */
export const setUserInfo = (userInfo: any): void => {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
};

/**
 * 사용자 정보 조회
 */
export const getUserInfo = (): any | null => {
  const userInfo = localStorage.getItem(USER_INFO_KEY);
  return userInfo ? JSON.parse(userInfo) : null;
};

/**
 * 사용자 정보 제거
 */
export const removeUserInfo = (): void => {
  localStorage.removeItem(USER_INFO_KEY);
};

/**
 * 로그아웃 처리
 */
export const logout = (): void => {
  removeAuthToken();
  removeRefreshToken();
  removeUserInfo();
};

/**
 * 로그인 상태 확인
 */
export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

