import axios from 'axios';
import { ChatMessage, Citation, DocumentData } from '@/types';
import { API_BASE_URL, getApiBaseUrl } from './system';

export interface ChatSessionData {
  id: string;
  user_id: string;
  document_id: string;
  title: string;
  document?: DocumentData;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  message_count: number;
  messages?: ChatMessage[];
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  config.withCredentials = true;
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const chatService = {
  async getUserDocuments(): Promise<DocumentData[]> {
    const response = await apiClient.get<DocumentData[]>('/documents');
    return response.data;
  },

  async listChatSessions(): Promise<ChatSessionData[]> {
    const response = await apiClient.get<ChatSessionData[]>('/chats');
    return response.data;
  },

  async getChatSession(sessionId: string): Promise<ChatSessionData> {
    const response = await apiClient.get<ChatSessionData>(`/chats/${sessionId}`);
    return response.data;
  },

  async createDocumentChatSession(documentId: string, title?: string): Promise<ChatSessionData> {
    const response = await apiClient.post<ChatSessionData>(`/documents/${documentId}/chats`, { title });
    return response.data;
  },

  async renameChatSession(sessionId: string, title: string): Promise<ChatSessionData> {
    const response = await apiClient.patch<ChatSessionData>(`/chats/${sessionId}`, { title });
    return response.data;
  },

  async deleteChatSession(sessionId: string): Promise<{ status: string; message: string }> {
    const response = await apiClient.delete<{ status: string; message: string }>(`/chats/${sessionId}`);
    return response.data;
  },

  async deleteDocument(documentId: string): Promise<{ status: string; message: string }> {
    const response = await apiClient.delete<{ status: string; message: string }>(`/documents/${documentId}`);
    return response.data;
  },

  async getDocumentStatus(documentId: string): Promise<DocumentData> {
    const response = await apiClient.get<DocumentData>(`/documents/${documentId}`);
    return response.data;
  },

  async sendQuestionStream(
    sessionId: string,
    question: string,
    onToken: (token: string) => void,
    onMetadata: (metadata: { citations: Citation[]; intent: string; confidence: string; retrievalTimeMs: number }) => void,
    onComplete: (finalContent: string, timingMs?: Record<string, number>) => void,
    onError: (error: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/chats/${sessionId}/chat`;

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ question }),
        signal,
      });

      if (!response.ok) {
        let errMessage = 'Failed to generate response.';
        try {
          const errJson = await response.json();
          errMessage = errJson.detail || errMessage;
        } catch (_) {}
        onError(errMessage);
        return;
      }

      if (!response.body) {
        onError('ReadableStream not supported in browser environment.');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.substring(6);
            try {
              const data = JSON.parse(jsonStr);
              if (data.type === 'metadata') {
                onMetadata({
                  citations: data.citations || [],
                  intent: data.intent || 'GENERAL',
                  confidence: data.confidence || 'Medium',
                  retrievalTimeMs: data.retrieval_time_ms || 0,
                });
              } else if (data.type === 'token') {
                accumulatedContent += data.content;
                onToken(data.content);
              } else if (data.type === 'done') {
                onComplete(data.content || accumulatedContent, data.timing_ms);
              }
            } catch (err) {
              loggerError('JSON Parse error in stream chunk:', err);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        loggerError('Chat stream aborted by user.');
        return;
      }
      onError(err.message || 'Network stream error');
    }
  },
};

function loggerError(...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(...args);
  }
}
