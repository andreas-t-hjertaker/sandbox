"use client";

import { useRef, useCallback, type KeyboardEvent, type ChangeEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isStreaming: boolean;
}

export function ChatInput({ onSendMessage, isStreaming }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const lineHeight = 24;
    const maxHeight = lineHeight * 5;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const content = textarea.value.trim();
    if (!content || isStreaming) return;
    onSendMessage(content);
    textarea.value = "";
    textarea.style.height = "auto";
  }, [onSendMessage, isStreaming]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback(
    (_e: ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
    },
    [adjustHeight]
  );

  return (
    <div className="flex items-end gap-2 border-t border-border bg-background p-3">
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder="Beskriv prosessen din..."
        disabled={isStreaming}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-6 outline-none transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-input/30"
        )}
      />
      <Button
        size="icon"
        disabled={isStreaming}
        onClick={handleSend}
        aria-label="Send melding"
      >
        <Send className="size-4" />
      </Button>
    </div>
  );
}
