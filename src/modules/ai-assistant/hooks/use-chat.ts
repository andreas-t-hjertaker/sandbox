"use client";

import { useState, useCallback, useRef } from "react";
import { getModel } from "@/lib/firebase/ai";
import { generateId } from "@/lib/utils";
import { buildSystemPrompt } from "../lib/system-prompt";
import { parseCloudActions, type CloudAction } from "../lib/cloud-actions";
import type { ChatMessage, ChatConfig, AssistantContext, ScannedElement } from "../types";

type ChatSession = {
  sendMessageStream: (msg: string) => Promise<{
    stream: AsyncIterable<{ text: () => string }>;
  }>;
};

type UseChatOptions = {
  context: AssistantContext;
  config?: ChatConfig;
  elements?: ScannedElement[];
  onCloudActions?: (actions: CloudAction[]) => void;
  onStreamingChange?: (streaming: boolean) => void;
};

export function useChatSession(
  contextOrOptions: AssistantContext | UseChatOptions,
  configArg?: ChatConfig
) {
  // Support both old (context, config) and new (options) signatures
  const isOptions = "context" in contextOrOptions && !("appName" in contextOrOptions);
  const options: UseChatOptions = isOptions
    ? contextOrOptions as UseChatOptions
    : { context: contextOrOptions as AssistantContext, config: configArg };

  const { context, config, elements, onCloudActions, onStreamingChange } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const chatRef = useRef<ChatSession | null>(null);
  const contextRef = useRef(context);
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  // Opprett ny chat-sesjon med gjeldende kontekst + element-kontekst
  function createSession() {
    const elementData = elementsRef.current?.map((el) => ({
      id: el.id,
      label: el.label,
      type: el.type,
      hint: el.hint,
    }));

    const systemPrompt = config?.systemPrompt
      ? config.systemPrompt
      : buildSystemPrompt(context, undefined, elementData);

    const model = getModel(config?.modelName);
    const session = model.startChat({
      systemInstruction: {
        role: "system" as const,
        parts: [{ text: systemPrompt }],
      },
    });
    chatRef.current = session as unknown as ChatSession;
    contextRef.current = context;
    return session;
  }

  // Sørg for at vi har en sesjon, opprett ny hvis kontekst har endret seg
  function getSession() {
    if (
      !chatRef.current ||
      contextRef.current.currentPath !== context.currentPath ||
      contextRef.current.user?.uid !== context.user?.uid
    ) {
      return createSession();
    }
    return chatRef.current;
  }

  const setStreamingState = useCallback(
    (streaming: boolean) => {
      setIsStreaming(streaming);
      onStreamingChange?.(streaming);
    },
    [onStreamingChange]
  );

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
      setStreamingState(true);

      try {
        const session = getSession();
        const result = await (session as ChatSession).sendMessageStream(
          text.trim()
        );

        let fullText = "";
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            fullText += chunkText;
            const current = fullText;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: current }
                  : m
              )
            );
          }
        }

        // Parse cloud actions fra ferdig respons
        const { text: cleanText, actions } = parseCloudActions(fullText);

        // Oppdater melding med ren tekst (uten cloud-action blokker)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: cleanText, streaming: false }
              : m
          )
        );

        // Dispatch cloud actions
        if (actions.length > 0) {
          onCloudActions?.(actions);
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Ukjent feil oppstod";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: `Beklager, noe gikk galt: ${errorMsg}`,
                  streaming: false,
                }
              : m
          )
        );
      } finally {
        setStreamingState(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isStreaming, context, setStreamingState]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    chatRef.current = null;
  }, []);

  return { messages, sendMessage, clearMessages, isStreaming };
}
