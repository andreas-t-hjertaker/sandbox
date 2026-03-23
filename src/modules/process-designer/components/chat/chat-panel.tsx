"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import type { ChatMessage, ChatPhase } from "../../types";
import { PhaseIndicator } from "./phase-indicator";
import { ChatMessageBubble } from "./chat-message-bubble";
import { ChatInput } from "./chat-input";
import { SuggestionChips } from "./suggestion-chips";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  messages: ChatMessage[];
  currentPhase: ChatPhase;
  onSendMessage: (content: string) => void;
  isStreaming: boolean;
  suggestions?: string[];
}

export function ChatPanel({
  messages,
  currentPhase,
  onSendMessage,
  isStreaming,
  suggestions = [],
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isStreaming]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PhaseIndicator currentPhase={currentPhase} />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth py-4"
      >
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center px-6">
            <p className="text-center text-sm text-muted-foreground">
              Start en samtale for &aring; designe prosessen din.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 px-4 py-2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Tenker...
            </span>
          </div>
        )}
      </div>

      {suggestions.length > 0 && !isStreaming && (
        <SuggestionChips suggestions={suggestions} onSelect={onSendMessage} />
      )}

      <ChatInput onSendMessage={onSendMessage} isStreaming={isStreaming} />
    </div>
  );
}
