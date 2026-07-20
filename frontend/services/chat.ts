import { Citation } from '@/types';
import { API_BASE_URL } from './system';

export interface StreamChatCallbacks {
  onMetadata?: (citations: Citation[], retrievalTimeMs: number) => void;
  onToken?: (token: string) => void;
  onDone?: (timingMs: { retrieval_time?: number; llm_response_time?: number; total_response_time?: number }) => void;
  onError?: (error: string) => void;
}

export const chatService = {
  async streamChat(
    question: string,
    callbacks: StreamChatCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Network error occurred' }));
        callbacks.onError?.(errorData.detail || `Server returned status code ${response.status}`);
        return;
      }

      if (!response.body) {
        callbacks.onError?.('ReadableStream not supported by response stream.');
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
                callbacks.onMetadata?.(data.citations || [], data.retrieval_time_ms || 0);
              } else if (data.type === 'token') {
                callbacks.onToken?.(data.content || '');
              } else if (data.type === 'done') {
                callbacks.onDone?.(data.timing_ms || {});
              }
            } catch (e) {
              console.error('SSE JSON parsing error:', e, jsonStr);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Stream canceled by user
      }
      callbacks.onError?.(err.message || 'Error establishing connection with AI service.');
    }
  },
};
