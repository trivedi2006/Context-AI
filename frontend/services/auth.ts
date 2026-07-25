import axios from 'axios';
import { UserResponse, UserSignup, UserLogin, AuthMessageResponse } from '@/types';
import { API_BASE_URL, getApiBaseUrl } from './system';

export const authClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30 seconds to prevent premature client timeouts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor attaching dynamic base URL & Authorization Bearer token
authClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      config.baseURL = getApiBaseUrl();
    }
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const authService = {
  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  },

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  },

  async signup(data: UserSignup): Promise<AuthMessageResponse> {
    const response = await authClient.post<AuthMessageResponse>('/auth/signup', data);
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  },

  async login(data: UserLogin): Promise<AuthMessageResponse> {
    const response = await authClient.post<AuthMessageResponse>('/auth/login', data);
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  },

  getGoogleAuthUrl(): string {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/auth/google/login`;
  },

  async logout(): Promise<void> {
    try {
      await authClient.post('/auth/logout');
    } finally {
      this.clearToken();
    }
  },

  async getMe(): Promise<UserResponse | null> {
    try {
      const response = await authClient.get<UserResponse>('/auth/me');
      return response.data;
    } catch (e) {
      return null;
    }
  },
};
