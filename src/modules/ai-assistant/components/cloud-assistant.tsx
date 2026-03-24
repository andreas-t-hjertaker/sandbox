"use client";

import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { CloudProvider, useCloud } from "../context/cloud-provider";
import { CloudAvatar } from "./cloud-avatar";
import { SpeechBubble } from "./speech-bubble";
import { Spotlight } from "./spotlight";
import { useDomScanner } from "../hooks/use-dom-scanner";
import { useProactiveTriggers } from "../hooks/use-proactive-triggers";
import { useCloudActions } from "../hooks/use-cloud-actions";
import { useChatSession } from "../hooks/use-chat";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { getDefaultContext } from "../lib/context";
import type { CloudAction } from "../lib/cloud-actions";
import type { ChatConfig } from "../types";

type CloudAssistantProps = {
  config?: ChatConfig;
};

function CloudAssistantInner({ config }: CloudAssistantProps) {
  const {
    state,
    dispatch,
    dismiss,
    navigateTo,
    speak,
    startTour,
    toggleChat,
    nextTourStep,
    cancelTour,
  } = useCloud();
  const { elements, getElement } = useDomScanner();
  const pathname = usePathname();
  const { user } = useAuth();

  // Build context for AI
  const context = useMemo(() => {
    if (config?.contextProvider) {
      return config.contextProvider();
    }
    return getDefaultContext(user, pathname);
  }, [user, pathname, config]);

  // Cloud action callbacks
  const handleNavigate = useCallback(
    (targetId: string, message: string, highlight = true) => {
      navigateTo(targetId, message, highlight);
    },
    [navigateTo]
  );

  const handleSpeak = useCallback(
    (message: string, variant?: string, autoHide?: number) => {
      speak(
        message,
        (variant as "info" | "success" | "warning") || "info",
        autoHide
      );
    },
    [speak]
  );

  const handleTour = useCallback(
    (steps: { targetId: string; message: string }[]) => {
      startTour(steps);
    },
    [startTour]
  );

  // useCloudActions for parsing LLM responses
  const { processResponse } = useCloudActions({
    elements,
    onNavigate: handleNavigate,
    onSpeak: handleSpeak,
    onTour: handleTour,
  });

  // Handle cloud actions from chat
  const handleCloudActions = useCallback(
    (actions: CloudAction[]) => {
      for (const action of actions) {
        switch (action.type) {
          case "navigate":
            handleNavigate(action.targetId, action.message, action.highlight);
            break;
          case "speak":
            handleSpeak(action.message, action.variant, action.autoHide);
            break;
          case "tour":
            handleTour(action.steps);
            break;
          case "data":
            dispatch({
              type: "SHOW_DATA",
              message: action.title,
              variant: "info",
            });
            break;
          case "idle":
            break;
        }
      }
    },
    [handleNavigate, handleSpeak, handleTour, dispatch]
  );

  // Handle streaming state changes
  const handleStreamingChange = useCallback(
    (streaming: boolean) => {
      dispatch({ type: "SET_STREAMING", isStreaming: streaming });
    },
    [dispatch]
  );

  // Chat session with element context and cloud actions
  const { messages, sendMessage, clearMessages, isStreaming } = useChatSession({
    context,
    config,
    elements,
    onCloudActions: handleCloudActions,
    onStreamingChange: handleStreamingChange,
  });

  // Proactive triggers
  useProactiveTriggers({
    elements,
    enabled: !state.chatOpen && state.mode === "idle",
    onNavigate: handleNavigate,
    onSpeak: (message, variant) => handleSpeak(message, variant),
    onTour: handleTour,
  });

  // Reset ved route-endring
  useEffect(() => {
    dispatch({ type: "DISMISS" });
  }, [pathname, dispatch]);

  const handleCloudClick = () => {
    if (state.mode === "touring") {
      nextTourStep();
    } else {
      toggleChat();
    }
  };

  const handleDragStart = () => {
    dispatch({ type: "DRAG_START" });
  };

  const handleDragEnd = () => {
    dispatch({ type: "DRAG_END" });
  };

  // Beregn target-posisjon for navigasjon
  const targetPosition =
    state.activeTarget && state.mode === "navigating"
      ? (() => {
          const el = getElement(state.activeTarget);
          if (!el) return undefined;
          return {
            x: el.rect.x + el.rect.width / 2 - window.innerWidth + 24 + 28,
            y: el.rect.y - 60 - window.innerHeight + 24 + 28,
          };
        })()
      : undefined;

  // Track cloud avatar DOMRect for speech bubble positioning
  const cloudWrapperRef = useRef<HTMLDivElement>(null);
  const [cloudRect, setCloudRect] = useState<DOMRect | undefined>();

  useEffect(() => {
    if (!state.bubble || state.chatOpen) return;
    const el = cloudWrapperRef.current;
    if (el) setCloudRect(el.getBoundingClientRect());
  }, [state.bubble, state.chatOpen]);

  const welcomeMessage =
    config?.welcomeMessage || "Hei! Jeg er din AI-assistent. Spør meg om hva som helst!";
  const placeholder = config?.placeholder || "Skriv en melding...";

  return (
    <>
      {/* Spotlight overlay */}
      <AnimatePresence>
        {(state.mode === "highlighting" || state.mode === "touring") &&
          state.activeTarget && (
            <Spotlight
              targetId={state.activeTarget}
              onDismiss={state.mode === "touring" ? cancelTour : dismiss}
              getElement={getElement}
            />
          )}
      </AnimatePresence>

      {/* Cloud Avatar wrapper med morph-animasjon */}
      <div ref={cloudWrapperRef} className="fixed right-6 bottom-6 z-[9999]">
        {/* Snakkeboble */}
        <AnimatePresence>
          {state.bubble && state.mode !== "dragging" && !state.chatOpen && (
            <SpeechBubble
              content={state.bubble.message}
              variant={state.bubble.variant}
              autoHide={state.bubble.autoHide}
              onDismiss={dismiss}
              cloudRect={cloudRect}
              actions={
                state.mode === "touring" && state.tour
                  ? [
                      {
                        label: `Neste (${state.tour.current + 1}/${state.tour.steps.length})`,
                        onClick: nextTourStep,
                      },
                      {
                        label: "Avslutt",
                        onClick: cancelTour,
                        variant: "ghost",
                      },
                    ]
                  : undefined
              }
            />
          )}
        </AnimatePresence>

        {/* Morph container — sky → chat-panel */}
        <motion.div
          layout
          layoutId="cloud-morph"
          animate={
            state.chatOpen
              ? {
                  width: 380,
                  height: 480,
                  borderRadius: 16,
                }
              : {
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                }
          }
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative overflow-hidden"
          style={{ originX: 1, originY: 1 }}
        >
          {/* Chat-innhold (synlig når åpen) */}
          <AnimatePresence>
            {state.chatOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                className="flex h-full w-full flex-col border border-border bg-card shadow-xl"
                style={{ borderRadius: 16 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <span className="text-sm font-medium">
                    {config?.title || "ketl assistent"}
                  </span>
                  <div className="flex gap-1">
                    {messages.length > 0 && (
                      <button
                        type="button"
                        onClick={clearMessages}
                        className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        Tøm
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={toggleChat}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      Lukk
                    </button>
                  </div>
                </div>
                <ChatMessages
                  messages={messages}
                  welcomeMessage={welcomeMessage}
                />
                <ChatInput
                  onSend={sendMessage}
                  disabled={isStreaming}
                  placeholder={placeholder}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sky-avatar (synlig når lukket) */}
          <AnimatePresence>
            {!state.chatOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0"
              >
                <CloudAvatar
                  state={
                    state.mode === "navigating"
                      ? "navigating"
                      : state.mode === "dragging"
                        ? "idle"
                        : "idle"
                  }
                  isStreaming={state.isStreaming}
                  targetPosition={targetPosition}
                  hasNotification={messages.length > 0 && !isStreaming}
                  onClick={handleCloudClick}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}

/**
 * CloudAssistant — sammensatt komponent som koordinerer alle sky-delene.
 *
 * Wrapper hele appen med CloudProvider og rendrer Cloud Avatar,
 * Chat, Speech Bubble, Spotlight og aktiverer proaktive triggere.
 */
export function CloudAssistant(props: CloudAssistantProps) {
  return (
    <CloudProvider>
      <CloudAssistantInner {...props} />
    </CloudProvider>
  );
}
