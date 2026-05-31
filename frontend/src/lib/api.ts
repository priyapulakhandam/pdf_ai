import { clearAuth, getToken } from "./auth";
import type {
  AuthResponse,
  ChatSession,
  Document,
  Message,
  MessageConfidence,
  User,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
  ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(err.detail || "Request failed", res.status);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  signup: (email: string, password: string, full_name?: string) =>
    request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>("/auth/me"),

  updateProfile: (full_name: string | null) =>
    request<User>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ full_name }),
    }),

  listDocuments: () =>
    request<{ documents: Document[]; total: number }>("/documents"),

  uploadDocument: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<Document>("/documents/upload", { method: "POST", body: form });
  },

  deleteDocument: (id: string) =>
    request<void>(`/documents/${id}`, { method: "DELETE" }),

  reprocessDocument: (id: string) =>
    request<Document>(`/documents/${id}/reprocess`, { method: "POST" }),

  listSessions: () =>
    request<{ sessions: ChatSession[]; total: number }>("/chat/sessions"),

  createSession: (title: string, document_ids: string[]) =>
    request<ChatSession>("/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ title, document_ids }),
    }),

  getSession: (id: string) => request<ChatSession>(`/chat/sessions/${id}`),

  updateSession: (id: string, data: { title?: string; document_ids?: string[] }) =>
    request<ChatSession>(`/chat/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteSession: (id: string) =>
    request<void>(`/chat/sessions/${id}`, { method: "DELETE" }),

  sendMessage: (sessionId: string, content: string) =>
    request<Message>(`/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, stream: false }),
    }),

  streamMessage: async function* (
    sessionId: string,
    content: string,
    handlers?: {
      onCitations?: (citations: Message["citations"]) => void;
      onConfidence?: (confidence: MessageConfidence) => void;
    }
  ): AsyncGenerator<string> {
    const { onCitations, onConfidence } = handlers || {};
    const token = getToken();
    const res = await fetch(
      `${API_URL}/chat/sessions/${sessionId}/messages/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, stream: true }),
      }
    );

    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({ detail: "Stream failed" }));
      throw new ApiError(err.detail || "Stream failed", res.status);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "token") yield parsed.content;
          if (parsed.type === "error") yield parsed.content;
          if (parsed.type === "citations" && onCitations) onCitations(parsed.citations);
          if (parsed.type === "confidence" && onConfidence) {
            onConfidence({
              confidence_score: parsed.confidence_score,
              confidence_level: parsed.confidence_level,
              insufficient_context: parsed.insufficient_context,
              max_similarity: parsed.max_similarity,
              avg_similarity: parsed.avg_similarity,
            });
          }
        } catch {
          /* skip malformed */
        }
      }
    }
  },
};

export { ApiError };
