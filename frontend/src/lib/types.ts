export interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type DocumentStatus = "pending" | "processing" | "ready" | "failed";

export interface Document {
  id: string;
  original_filename: string;
  file_size: number;
  page_count: number | null;
  chunk_count: number;
  status: DocumentStatus;
  error_message: string | null;
  created_at: string;
}

export interface Citation {
  document_id: string;
  document_name: string;
  page_number: number | null;
  chunk_index: number;
  excerpt: string;
  score?: number;
}

export type ConfidenceLevel = "low" | "medium" | "high";

export interface MessageConfidence {
  confidence_score: number;
  confidence_level: ConfidenceLevel;
  insufficient_context: boolean;
  max_similarity: number;
  avg_similarity: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[] | null;
  confidence?: MessageConfidence | null;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  document_ids: string[];
  document_names?: string[];
  last_message_preview?: string | null;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}
