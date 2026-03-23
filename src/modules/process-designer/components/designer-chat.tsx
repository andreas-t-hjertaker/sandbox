"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Trash2 } from "lucide-react";
import {
  type ConversationPhase,
  PHASE_LABELS,
  detectPhase,
  parseLLMResponse,
  applyLLMResponse,
  buildDesignerSystemPrompt,
} from "../lib/llm-orchestrator";
import type { ProcessNode, ProcessEdge } from "../types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  streaming?: boolean;
};

type DesignerChatProps = {
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  onProcessUpdate?: (nodes: ProcessNode[], edges: ProcessEdge[]) => void;
  className?: string;
};

const PHASE_ORDER: ConversationPhase[] = [
  "mapping",
  "structuring",
  "agentifying",
  "validating",
];

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export function DesignerChat({
  nodes,
  edges,
  onProcessUpdate,
  className,
}: DesignerChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const phase = detectPhase({ nodes, edges }, messages.length);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      const assistantId = generateId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsStreaming(true);

      try {
        const { getModel } = await import("@/lib/firebase/ai");
        const systemPrompt = buildDesignerSystemPrompt(phase, { nodes, edges });
        const model = getModel();
        const session = model.startChat({
          systemInstruction: {
            role: "system" as const,
            parts: [{ text: systemPrompt }],
          },
        });

        type StreamResult = {
          stream: AsyncIterable<{ text: () => string }>;
        };

        const result = await (
          session as unknown as {
            sendMessageStream: (msg: string) => Promise<StreamResult>;
          }
        ).sendMessageStream(text.trim());

        let fullText = "";
        for await (const chunk of result.stream) {
          const t = chunk.text();
          if (t) {
            fullText += t;
            const current = fullText;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: current } : m
              )
            );
          }
        }

        // Parser strukturert output
        const { data } = parseLLMResponse(fullText);
        if (data && onProcessUpdate) {
          const updated = applyLLMResponse({ nodes, edges }, data);
          onProcessUpdate(updated.nodes, updated.edges);
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m
          )
        );
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Ukjent feil oppstod";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Beklager, noe gikk galt: ${errorMsg}`, streaming: false }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, phase, nodes, edges, onProcessUpdate]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  // Foreslåtte oppfølgingsspørsmål basert på fase
  const suggestions = getSuggestions(phase, nodes.length);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Faseindikator */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        {PHASE_ORDER.map((p, i) => (
          <div key={p} className="flex items-center gap-1">
            {i > 0 && (
              <div className="h-px w-4 bg-border" />
            )}
            <Badge
              variant={p === phase ? "default" : "outline"}
              className={cn(
                "text-[10px]",
                p === phase && "shadow-sm"
              )}
            >
              {PHASE_LABELS[p]}
            </Badge>
          </div>
        ))}
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleClear}
          disabled={messages.length === 0}
          title="Tøm samtale"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Meldinger */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Beskriv prosessen du vil designe, så hjelper jeg deg steg for steg.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "mb-3 flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.streaming && (
                <Loader2 className="mt-1 h-3 w-3 animate-spin text-muted-foreground" />
              )}
              <time className="mt-1 block text-[10px] opacity-50">
                {msg.timestamp.toLocaleTimeString("nb-NO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      {suggestions.length > 0 && messages.length < 6 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => sendMessage(s)}
              disabled={isStreaming}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Beskriv prosessen..."
          disabled={isStreaming}
          className="min-h-[40px] max-h-[120px] resize-none"
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isStreaming}
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

function getSuggestions(
  phase: ConversationPhase,
  nodeCount: number
): string[] {
  switch (phase) {
    case "mapping":
      return nodeCount === 0
        ? [
            "Fakturamottak og kontering",
            "Månedsavslutning",
            "Lønnskjøring",
          ]
        : ["Legg til feilhåndtering", "Er det parallelle steg?"];
    case "structuring":
      return ["Legg til godkjenningssteg", "Vis prosessen"];
    case "agentifying":
      return ["Foreslå autonominivå", "Hvilke verktøy trenger hvert steg?"];
    case "validating":
      return ["Valider prosessen", "Er den klar for deploy?"];
  }
}
