import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { config } from '../config/env';
import { getAuthToken, logout } from '../utils/auth';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 인증 토큰 추가: Authorization 헤더에 Bearer 토큰 형식으로 추가
        const token = getAuthToken();
        if (token) {
          // headers가 없는 경우를 대비하여 초기화
          if (!config.headers) {
            config.headers = {} as any;
          }
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 요청 전 로깅 (개발 환경에서만)
        if (import.meta.env.DEV) {
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
          if (config.data) {
            console.log('[API Request Body]', JSON.stringify(config.data, null, 2));
          }
          console.log('[API Request Headers]', config.headers);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        if (import.meta.env.DEV) {
          console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }
        return response;
      },
      (error) => {
        // 모든 환경에서 API 에러를 콘솔에 표시
        console.error('[API Error]', error.response?.data || error.message);
        if (error.response) {
          console.error('[API Error Response]', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers,
          });

          // 401 Unauthorized 에러 처리: 인증 토큰이 만료되었거나 유효하지 않은 경우
          if (error.response.status === 401) {
            // 로그인 페이지로의 요청은 제외 (무한 리다이렉트 방지)
            const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/login/kakao';
            const isLoginApi = error.config?.url?.includes('/login');
            
            if (!isLoginPage && !isLoginApi) {
              // 로그아웃 처리 (토큰 제거)
              logout();
              
              // 로그인 페이지로 리다이렉트
              window.location.href = '/login';
            }
          }
        }
        if (error.config) {
          console.error('[API Error Request Config]', {
            url: error.config.url,
            method: error.config.method,
            data: error.config.data,
            headers: error.config.headers,
          });
        }
        return Promise.reject(error);
      }
    );
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().getClient();
