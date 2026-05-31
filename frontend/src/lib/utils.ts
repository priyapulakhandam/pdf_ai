import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** API datetimes are UTC; append Z when the string has no timezone. */
export function parseApiDate(date: string): Date {
  if (!date) return new Date();
  const hasTz = date.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(date);
  return new Date(hasTz ? date : `${date}Z`);
}

export function formatRelativeTime(date: string) {
  const d = parseApiDate(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 0) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function prettyPdfName(filename: string): string {
  return filename.replace(/\.pdf$/i, "");
}

export function sessionDisplayTitle(session: {
  title: string;
  document_names?: string[];
}): string {
  const names = session.document_names;
  if (names?.length) {
    if (names.length === 1) return prettyPdfName(names[0]);
    return `${prettyPdfName(names[0])} + ${names.length - 1} more`;
  }
  return session.title;
}

export function sessionPreview(session: {
  last_message_preview?: string | null;
  messages?: { content: string }[];
}): string {
  if (session.last_message_preview) return session.last_message_preview;
  const last = session.messages?.[session.messages.length - 1];
  if (last) {
    const text = last.content.trim();
    return text.slice(0, 72) + (text.length > 72 ? "…" : "");
  }
  return "Start a conversation…";
}

export function sessionActivityTime(session: {
  last_message_at?: string | null;
  updated_at: string;
  created_at: string;
}): string {
  return formatRelativeTime(
    session.last_message_at || session.updated_at || session.created_at
  );
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Pending",
    processing: "Processing",
    ready: "Indexed",
    failed: "Failed",
  };
  return map[status] || status;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function userInitials(name: string | null | undefined, email: string | undefined) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email?.slice(0, 2).toUpperCase() || "U";
}
