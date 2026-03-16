import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-accent text-background" : "bg-surface border border-border"
        }`}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-muted" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-accent text-background rounded-2xl rounded-br-md"
            : "bg-surface border border-border text-accent rounded-2xl rounded-bl-md"
        }`}
      >
        <span className="whitespace-pre-wrap">{content}</span>
        {isStreaming && (
          <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-accent align-middle" />
        )}
      </div>
    </div>
  );
}
