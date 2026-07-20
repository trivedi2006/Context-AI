export interface ServiceHealth {
  status: 'ok' | 'unavailable' | 'loading';
  details?: string | null;
}

export interface HealthStatus {
  backend: 'ok' | 'unavailable' | 'loading';
  groq: ServiceHealth;
  qdrant: ServiceHealth;
}

export interface ProcessingMetrics {
  pdf_extraction?: number;
  chunking?: number;
  embedding_generation?: number;
  vector_indexing?: number;
  total_processing?: number;
}

export interface UploadResponse {
  status: 'success' | 'error';
  document_name: string;
  total_pages: number;
  total_chunks: number;
  timing_ms: ProcessingMetrics;
  file_size_bytes?: number;
}

export interface Citation {
  page_number: number;
  source: string;
  chunk_id: string;
  excerpt: string;
}

export interface ChatTimingMetrics {
  retrieval_time?: number;
  llm_response_time?: number;
  total_response_time?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timing_ms?: ChatTimingMetrics;
  isStreaming?: boolean;
  timestamp: string;
}

export type UploadStep = 'idle' | 'extracting' | 'chunking' | 'embedding' | 'indexing' | 'ready' | 'error';

export interface UploadProgressState {
  step: UploadStep;
  percentage: number;
  currentStepMessage: string;
  error?: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  google_id?: string | null;
  profile_picture?: string | null;
  provider: 'local' | 'google';
  created_at: string;
}

export interface UserSignup {
  name: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface AuthMessageResponse {
  status: 'success' | 'error';
  message: string;
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

