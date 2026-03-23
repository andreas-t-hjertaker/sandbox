"use client";

import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { ChatPhaseLabels, type ChatMessage } from "../../types";
import { cn } from "@/lib/utils";

function formatRelativeTime(timestamp: unknown): string {
  if (!timestamp) return "";

  const date =
    timestamp instanceof Date ? timestamp : new Date(timestamp as string);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Akkurat n\u00e5";
  if (diffMin < 60) return `${diffMin} min siden`;
  if (diffHr < 24) return `${diffHr}t siden`;
  if (diffDay < 7) return `${diffDay}d siden`;
  return date.toLocaleDateString("nb-NO");
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center px-4 py-2">
        <div className="max-w-md text-center">
          <p className="text-xs italic text-muted-foreground">
            {message.content}
          </p>
          {message.timestamp != null && (
            <span className="text-[10px] text-muted-foreground/60">
              {formatRelativeTime(message.timestamp)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("flex w-full gap-2 px-4 py-1.5", {
        "justify-end": isUser,
        "justify-start": isAssistant,
      })}
    >
      <div
        className={cn("flex max-w-[80%] flex-col gap-1", {
          "items-end": isUser,
          "items-start": isAssistant,
        })}
      >
        {message.phase && (
          <Badge variant="secondary" className="mb-0.5 text-[10px]">
            {ChatPhaseLabels[message.phase]}
          </Badge>
        )}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
            {
              "bg-primary text-primary-foreground rounded-br-md": isUser,
              "bg-muted text-foreground rounded-bl-md": isAssistant,
            }
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:m-0 [&_p:not(:last-child)]:mb-2 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_pre]:my-2 [&_code]:text-xs">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
        {message.timestamp != null && (
          <span className="px-1 text-[10px] text-muted-foreground/60">
            {formatRelativeTime(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}
