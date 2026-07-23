import axios from 'axios';
import { HealthStatus } from '@/types';

export const RENDER_BACKEND_URL = 'https://context-ai-6t9i.onrender.com';

export const getApiBaseUrl = (): string => {
  // 1. Explicit Environment Variables (Next.js / Vite / Vercel Build env)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (process.env.VITE_API_URL) {
    return process.env.VITE_API_URL.replace(/\/$/, '');
  }

  // 2. Browser Host Check
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Local Development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000';
    }
  }

  // 3. Fallback for deployed production hostings (Vercel -> Render)
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
