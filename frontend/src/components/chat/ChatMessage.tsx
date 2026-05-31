"use client";

import ReactMarkdown from "react-markdown";
import { BookOpen } from "lucide-react";
import type { Citation, Message } from "@/lib/types";

function Citations({ citations }: { citations: Citation[] }) {
  return (
    <div className="mt-3 space-y-2 border-t border-slate-700 pt-3">
      <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
        <BookOpen className="h-3 w-3" />
        Sources
      </p>
      {citations.map((c, i) => (
        <div key={i} className="text-xs rounded-lg bg-slate-800/80 p-2 border border-slate-700">
          <p className="font-medium text-brand-300">
            {c.document_name}
            {c.page_number != null && ` · Page ${c.page_number}`}
          </p>
          <p className="text-slate-400 mt-1 line-clamp-3">{c.excerpt}</p>
        </div>
      ))}
    </div>
  );
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-brand-600 text-white"
            : "glass text-slate-100"
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {message.citations && message.citations.length > 0 && (
          <Citations citations={message.citations} />
        )}
      </div>
    </div>
  );
}
