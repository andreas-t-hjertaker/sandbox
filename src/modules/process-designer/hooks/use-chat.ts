import { useCallback, useRef } from "react";
import { useProcessDesignerContext } from "../store";
import type { ChatMessage, ChatPhase, PatchOperation } from "../types";

interface SendMessageOptions {
  processId?: string;
  onPatchesReceived?: (patches: PatchOperation[]) => void;
}

interface StreamResponse {
  content: string;
  patches?: PatchOperation[];
  suggestions?: string[];
  phase?: ChatPhase;
}

export function useChat() {
  const { state, dispatch } = useProcessDesignerContext();
  const abortControllerRef = useRef<AbortController | null>(null);

  const addMessage = useCallback(
    (message: ChatMessage) => {
      dispatch({ type: "ADD_CHAT_MESSAGE", payload: message });
    },
    [dispatch],
  );

  const updateMessage = useCallback(
    (id: string, content: string) => {
      dispatch({ type: "UPDATE_CHAT_MESSAGE", payload: { id, content } });
    },
    [dispatch],
  );

  const setPhase = useCallback(
    (phase: ChatPhase) => {
      dispatch({ type: "SET_CHAT_PHASE", payload: phase });
    },
    [dispatch],
  );

  const clearMessages = useCallback(() => {
    dispatch({ type: "CLEAR_CHAT_MESSAGES" });
  }, [dispatch]);

  const sendMessage = useCallback(
    async (
      content: string,
      options?: SendMessageOptions,
    ): Promise<StreamResponse | null> => {
      if (state.isChatStreaming) return null;

      // Add user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        phase: state.chatPhase,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ADD_CHAT_MESSAGE", payload: userMessage });

      // Create placeholder assistant message
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        phase: state.chatPhase,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ADD_CHAT_MESSAGE", payload: assistantMessage });
      dispatch({ type: "SET_CHAT_STREAMING", payload: true });

      // Abort any existing request
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let fullContent = "";
      let result: StreamResponse | null = null;

      try {
        const response = await fetch("/api/process-designer/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...state.chatMessages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            phase: state.chatPhase,
            processId: options?.processId ?? state.process?.id,
            process: state.process,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Chat request failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data) as {
                type: string;
                content?: string;
                patches?: PatchOperation[];
                suggestions?: string[];
                phase?: ChatPhase;
              };

              switch (parsed.type) {
                case "text":
                  fullContent += parsed.content ?? "";
                  dispatch({
                    type: "UPDATE_CHAT_MESSAGE",
                    payload: { id: assistantMessageId, content: fullContent },
                  });
                  break;

                case "patches":
                  if (parsed.patches) {
                    dispatch({ type: "APPLY_PATCHES", payload: parsed.patches });
                    options?.onPatchesReceived?.(parsed.patches);
                  }
                  break;

                case "phase":
                  if (parsed.phase) {
                    dispatch({ type: "SET_CHAT_PHASE", payload: parsed.phase });
                  }
                  break;

                case "done":
                  result = {
                    content: fullContent,
                    patches: parsed.patches,
                    suggestions: parsed.suggestions,
                    phase: parsed.phase,
                  };
                  break;
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          const errorContent = "Beklager, noe gikk galt. Vennligst prøv igjen.";
          dispatch({
            type: "UPDATE_CHAT_MESSAGE",
            payload: { id: assistantMessageId, content: errorContent },
          });
          fullContent = errorContent;
        }
      } finally {
        dispatch({ type: "SET_CHAT_STREAMING", payload: false });
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }

      return result ?? { content: fullContent };
    },
    [state.isChatStreaming, state.chatPhase, state.chatMessages, state.process, dispatch],
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    dispatch({ type: "SET_CHAT_STREAMING", payload: false });
  }, [dispatch]);

  return {
    messages: state.chatMessages,
    phase: state.chatPhase,
    isStreaming: state.isChatStreaming,
    sendMessage,
    stopStreaming,
    addMessage,
    updateMessage,
    setPhase,
    clearMessages,
  };
}
