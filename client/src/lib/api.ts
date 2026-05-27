import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { RefreshResponse, ApiResponse } from '@/types/api';

// ─── In-memory access token store ────────────────────────────────────────────
// Never stored in localStorage/cookies — lives only in JS memory for security
let accessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const getAccessToken = (): string | null => accessToken;

// ─── Axios instance ───────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Send HttpOnly refresh token cookie
  timeout: 10000,
});

// ─── Request interceptor — attach access token ────────────────────────────────
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Promise queue — prevents concurrent refresh calls ────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

// ─── Response interceptor — auto-refresh on 401 ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only intercept 401s that haven't already been retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<ApiResponse<RefreshResponse>>(
          '/api/v1/auth/refresh',
          {},
          { withCredentials: true }
        );

        const newToken = data.data!.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        // Don't redirect here — let the component tree handle it via auth state.
        // window.location.href would cause a full page reload and bypass React Router.
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
