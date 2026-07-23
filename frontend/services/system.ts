import axios from 'axios';
import { HealthStatus } from '@/types';

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    return `${window.location.protocol}//${host}:8000`;
  }
  return 'http://127.0.0.1:8000';
};

export const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL) {
    const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    config.baseURL = `${window.location.protocol}//${host}:8000`;
  }
  return config;
});

export const systemService = {
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      const response = await apiClient.get<HealthStatus>('/health');
      return response.data;
    } catch (error) {
      return {
        backend: 'unavailable',
        groq: { status: 'unavailable', details: 'Cannot connect to FastAPI backend' },
        qdrant: { status: 'unavailable', details: 'Cannot connect to Qdrant cluster' },
      };
    }
  },
};
