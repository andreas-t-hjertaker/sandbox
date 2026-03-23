"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { CloudProvider, useCloud } from "../context/cloud-provider";
import { CloudAvatar } from "./cloud-avatar";
import { SpeechBubble } from "./speech-bubble";
import { Spotlight } from "./spotlight";
import { useDomScanner } from "../hooks/use-dom-scanner";
import type { ChatConfig } from "../types";

type CloudAssistantProps = {
  config?: ChatConfig;
};

function CloudAssistantInner({ config }: CloudAssistantProps) {
  const { state, dispatch, dismiss, toggleChat, nextTourStep, cancelTour } =
    useCloud();
  const { elements, getElement } = useDomScanner();
  const pathname = usePathname();

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

      {/* Cloud Avatar wrapper med bubble */}
      <div className="fixed right-6 bottom-6 z-[9999]">
        {/* Snakkeboble */}
        <AnimatePresence>
          {state.bubble && state.mode !== "dragging" && (
            <SpeechBubble
              content={state.bubble.message}
              variant={state.bubble.variant}
              autoHide={state.bubble.autoHide}
              onDismiss={dismiss}
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

        <CloudAvatar
          state={
            state.mode === "navigating"
              ? "navigating"
              : state.mode === "dragging"
                ? "idle"
                : state.chatOpen
                  ? "chatOpen"
                  : "idle"
          }
          targetPosition={targetPosition}
          hasNotification={false}
          onClick={handleCloudClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      </div>
    </>
  );
}

/**
 * CloudAssistant — sammensatt komponent som koordinerer alle sky-delene.
 *
 * Wrapper hele appen med CloudProvider og rendrer Cloud Avatar, Speech Bubble og Spotlight.
 */
export function CloudAssistant(props: CloudAssistantProps) {
  return (
    <CloudProvider>
      <CloudAssistantInner {...props} />
    </CloudProvider>
  );
}
