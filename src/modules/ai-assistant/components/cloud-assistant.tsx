"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { CloudProvider, useCloud } from "../context/cloud-provider";
import { CloudAvatar } from "./cloud-avatar";
import { CloudChatPanel } from "./cloud-chat-panel";
import { SpeechBubble } from "./speech-bubble";
import { Spotlight } from "./spotlight";
import { useDomScanner } from "../hooks/use-dom-scanner";
import { useProactiveTriggers } from "../hooks/use-proactive-triggers";
import type { CloudAction } from "../lib/cloud-actions";
import { SLEEP_TIMEOUT_MS, type CloudExpression } from "../lib/cloud-animations";
import type { ChatConfig } from "../types";

type CloudAssistantProps = {
  config?: ChatConfig;
};

function CloudAssistantInner({ config }: CloudAssistantProps) {
  const { state, dispatch, dismiss, navigateTo, speak, startTour, toggleChat, nextTourStep, cancelTour } =
    useCloud();
  const { elements, getElement } = useDomScanner();
  const pathname = usePathname();
  const cloudRef = useRef<HTMLDivElement>(null);
  const [cloudRect, setCloudRect] = useState<DOMRect | undefined>();

  // Oppdater cloudRect når bubble vises
  useEffect(() => {
    if (state.bubble && cloudRef.current) {
      setCloudRect(cloudRef.current.getBoundingClientRect());
    }
  }, [state.bubble]);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const lastInteractionRef = useRef(Date.now());

  // Reset ved route-endring
  useEffect(() => {
    dispatch({ type: "DISMISS" });
  }, [pathname, dispatch]);

  // Track inaktivitet for sleeping-animasjon
  useEffect(() => {
    const resetTimer = () => {
      lastInteractionRef.current = Date.now();
      setIsSleeping(false);
    };
    window.addEventListener("click", resetTimer, { passive: true });
    window.addEventListener("keydown", resetTimer, { passive: true });
    window.addEventListener("mousemove", resetTimer, { passive: true });

    const interval = setInterval(() => {
      if (Date.now() - lastInteractionRef.current > SLEEP_TIMEOUT_MS) {
        setIsSleeping(true);
      }
    }, 10_000);

    return () => {
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("mousemove", resetTimer);
      clearInterval(interval);
    };
  }, []);

  // Beregn expression basert på tilstand
  const expression: CloudExpression = (() => {
    if (isStreaming) return "thinking";
    if (state.mode === "navigating") return "flying";
    if (state.mode === "speaking" || state.mode === "highlighting") return "curious";
    if (state.mode === "touring") return "pointing";
    if (isSleeping && state.mode === "idle" && !state.chatOpen) return "sleeping";
    return "floating";
  })();

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

  // Håndter cloud actions fra LLM-responser
  const handleActions = useCallback(
    (actions: CloudAction[]) => {
      for (const action of actions) {
        switch (action.type) {
          case "navigate": {
            const targetExists = elements.some((el) => el.id === action.targetId);
            if (targetExists) {
              navigateTo(action.targetId, action.message, action.highlight);
            } else {
              speak(action.message, "info");
            }
            break;
          }
          case "speak":
            speak(action.message, action.variant, action.autoHide);
            break;
          case "data":
            dispatch({ type: "SHOW_DATA", message: action.title });
            break;
          case "tour":
            startTour(action.steps);
            break;
          case "idle":
            break;
        }
      }
    },
    [elements, navigateTo, speak, startTour, dispatch]
  );

  // Proaktive triggere
  useProactiveTriggers({
    elements,
    enabled: !state.chatOpen && state.mode === "idle",
    onNavigate: navigateTo,
    onSpeak: speak,
    onTour: (steps) => startTour(steps),
  });

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

      {/* Cloud Avatar + Chat morph container */}
      <div className="fixed right-6 bottom-6 z-[9999] flex flex-col items-end">
        {/* Snakkeboble (bare når chat er lukket) */}
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

        <LayoutGroup>
          <AnimatePresence mode="wait">
            {state.chatOpen ? (
              <CloudChatPanel
                key="chat-panel"
                config={config}
                elements={elements}
                onActions={handleActions}
                onStreamingChange={setIsStreaming}
                onClose={toggleChat}
              />
            ) : (
              <motion.div
                ref={cloudRef}
                key="cloud-avatar"
                layoutId="cloud-morph"
                initial={false}
                animate={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <CloudAvatar
                  state={
                    state.mode === "navigating"
                      ? "navigating"
                      : state.mode === "dragging"
                        ? "idle"
                        : "idle"
                  }
                  expression={expression}
                  targetPosition={targetPosition}
                  hasNotification={false}
                  onClick={handleCloudClick}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </>
  );
}

/**
 * CloudAssistant — sammensatt komponent som koordinerer alle sky-delene.
 *
 * Wrapper hele appen med CloudProvider og rendrer Cloud Avatar, Speech Bubble og Spotlight.
 * Klikk på skyen morphes til chat-panel med smooth animasjon.
 * LLM-responser parses for cloud-action blokker som dispatches til CloudOrchestrator.
 * Proaktive triggere aktivert for tom side og inaktivitet.
 */
export function CloudAssistant(props: CloudAssistantProps) {
  return (
    <CloudProvider>
      <CloudAssistantInner {...props} />
    </CloudProvider>
  );
}
