import axios from 'axios';
import { HealthStatus, UploadResponse, Citation } from '@/types';
import { API_BASE_URL, getApiBaseUrl } from '@/services/system';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

export const checkHealth = async (): Promise<HealthStatus> => {
  const response = await apiClient.get<HealthStatus>('/health');
  return response.data;
};

export const uploadPDF = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteDocument = async (): Promise<{ status: string; message: string }> => {
  const response = await apiClient.delete('/document');
  return response.data;
};

export const streamChat = async (
  question: string,
  onMetadata: (citations: Citation[], retrievalTimeMs: number) => void,
  onToken: (token: string) => void,
  onDone: (timingMs: any) => void,
  onError: (error: string) => void
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
      onError(errorData.detail || `Server returned error status ${response.status}`);
      return;
    }

    if (!response.body) {
      onError('ReadableStream not supported by browser.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.replace('data: ', '');
          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'metadata') {
              onMetadata(data.citations || [], data.retrieval_time_ms || 0);
            } else if (data.type === 'token') {
              onToken(data.content || '');
            } else if (data.type === 'done') {
              onDone(data.timing_ms || {});
            }
          } catch (e) {
            console.error('Failed to parse SSE payload:', e, jsonStr);
          }
        }
      }
    }
  } catch (err: any) {
    onError(err.message || 'An error occurred while communicating with backend.');
  }
};
