import axios from 'axios';
import { HealthStatus } from '@/types';

export const RENDER_BACKEND_URL = 'https://context-ai-6t9i.onrender.com';

export const getApiBaseUrl = (): string => {
  // 1. Local Development Check (Browser or Server-Side Node) - ALWAYS PRIORITIZED
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000';
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://127.0.0.1:8000';
  }

  // 2. Deployed Production Environment Variable Check
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }

  return RENDER_BACKEND_URL;
};

export const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
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
