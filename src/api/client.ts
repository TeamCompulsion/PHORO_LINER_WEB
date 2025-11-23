import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { config } from '../config/env';
import { getAuthToken } from '../utils/auth';

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
        if (import.meta.env.DEV) {
          console.error('[API Error]', error.response?.data || error.message);
          if (error.response) {
            console.error('[API Error Response]', {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data,
              headers: error.response.headers,
            });
          }
          if (error.config) {
            console.error('[API Error Request Config]', {
              url: error.config.url,
              method: error.config.method,
              data: error.config.data,
              headers: error.config.headers,
            });
          }
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
