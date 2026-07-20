import axios from 'axios';
import { HealthStatus } from '@/types';

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return 'http://localhost:8000';
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
    config.baseURL = `${window.location.protocol}//${window.location.hostname}:8000`;
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
