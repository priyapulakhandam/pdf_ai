import type { User } from "./types";

const TOKEN_KEY = "pdf_chat_token";
const USER_KEY = "pdf_chat_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function notifyProfileUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("pdfchat:profile-updated"));
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
