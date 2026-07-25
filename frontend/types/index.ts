export interface User {
  id: string;
  name: string;
  email: string;
  provider: 'local' | 'google';
  profile_picture?: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  provider: 'local' | 'google';
  profile_picture?: string;
  is_verified?: boolean;
}

export interface UserLogin {
  email: string;
  password?: string;
  remember_me?: boolean;
}

export interface UserSignup {
  name: string;
  email: string;
  password?: string;
}

export interface AuthMessageResponse {
  status: string;
  message: string;
  token?: string;
  user?: UserResponse;
}

export interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  login: (data: UserLogin) => Promise<void>;
  signup: (data: UserSignup) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

export interface DocumentData {
  id: string;
  user_id: string;
  filename: string;
  display_name: string;
  file_hash: string;
  storage_url?: string;
  file_size: number;
  page_count: number;
  mime_type: string;
  processing_status: 'processing' | 'ready' | 'error';
  embedding_status: 'processing' | 'ready' | 'error';
  error_message?: string;
  qdrant_collection: string;
  created_at: string;
  updated_at: string;
  chat_session_count: number;
}

export interface UploadResponse {
  status: 'success' | 'processing' | 'error';
  document_id: string;
  chat_session_id?: string;
  document_name: string;
  total_pages: number;
  total_chunks: number;
  file_size_bytes?: number;
  is_cached?: boolean;
  document_status: 'processing' | 'ready' | 'error';
  timing_ms?: Record<string, number>;
}

export interface Citation {
  chunk_id: string;
  page_number: number;
  source: string;
  snippet: string;
  relevance_score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: string;
  timingMs?: {
    retrievalTime?: number;
    totalResponseTime?: number;
  };
}

export type ProgressStep = 'idle' | 'uploading' | 'extracting' | 'chunking' | 'embedding' | 'indexing' | 'ready' | 'error';
export type UploadStep = ProgressStep;

export interface UploadProgressState {
  step: ProgressStep;
  progressPercent: number;
  message: string;
  detail?: string;
  error?: string;
}

export interface HealthStatus {
  backend: 'connected' | 'unavailable';
  groq: {
    status: 'connected' | 'unavailable';
    latencyMs?: number;
    details?: string;
  };
  qdrant: {
    status: 'connected' | 'unavailable';
    latencyMs?: number;
    details?: string;
  };
}
