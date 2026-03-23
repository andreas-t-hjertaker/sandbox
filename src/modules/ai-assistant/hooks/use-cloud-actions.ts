"use client";

import { useCallback, useRef } from "react";
import { parseCloudActions, type CloudAction } from "../lib/cloud-actions";
import type { ScannedElement } from "../types";

type UseCloudActionsOptions = {
  elements: ScannedElement[];
  onNavigate?: (targetId: string, message: string, highlight: boolean) => void;
  onSpeak?: (message: string, variant: string, autoHide?: number) => void;
  onData?: (action: CloudAction & { type: "data" }) => void;
  onTour?: (steps: { targetId: string; message: string }[]) => void;
};

/**
 * Hook for å parse og utføre cloud actions fra LLM-responser.
 */
export function useCloudActions({
  elements,
  onNavigate,
  onSpeak,
  onData,
  onTour,
}: UseCloudActionsOptions) {
  const tourIndexRef = useRef(0);
  const tourStepsRef = useRef<{ targetId: string; message: string }[]>([]);

  /** Parse LLM-respons og ekstraher actions */
  const processResponse = useCallback(
    (response: string) => {
      const { text, actions } = parseCloudActions(response);

      for (const action of actions) {
        executeAction(action);
      }

      return { text, actions };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [elements, onNavigate, onSpeak, onData, onTour]
  );

  /** Utfør en enkelt cloud action */
  const executeAction = useCallback(
    (action: CloudAction) => {
      switch (action.type) {
        case "navigate": {
          const targetExists = elements.some((el) => el.id === action.targetId);
          if (targetExists) {
            onNavigate?.(action.targetId, action.message, action.highlight);
          } else {
            // Element finnes ikke — fallback til speak
            onSpeak?.(action.message, "info");
          }
          break;
        }
        case "speak":
          onSpeak?.(action.message, action.variant, action.autoHide);
          break;
        case "data":
          onData?.(action as CloudAction & { type: "data" });
          break;
        case "tour":
          executeTour(action.steps);
          break;
        case "idle":
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [elements, onNavigate, onSpeak, onData]
  );

  /** Start en flerstegs tour */
  const executeTour = useCallback(
    (steps: { targetId: string; message: string }[]) => {
      tourStepsRef.current = steps;
      tourIndexRef.current = 0;
      onTour?.(steps);

      if (steps.length > 0) {
        const step = steps[0];
        onNavigate?.(step.targetId, step.message, true);
      }
    },
    [onNavigate, onTour]
  );

  /** Gå til neste steg i tour */
  const nextTourStep = useCallback(() => {
    tourIndexRef.current += 1;
    const steps = tourStepsRef.current;

    if (tourIndexRef.current < steps.length) {
      const step = steps[tourIndexRef.current];
      onNavigate?.(step.targetId, step.message, true);
      return { current: tourIndexRef.current, total: steps.length };
    }

    // Tour ferdig
    tourStepsRef.current = [];
    tourIndexRef.current = 0;
    return null;
  }, [onNavigate]);

  /** Avbryt pågående tour */
  const cancelTour = useCallback(() => {
    tourStepsRef.current = [];
    tourIndexRef.current = 0;
  }, []);

  return {
    processResponse,
    executeAction,
    nextTourStep,
    cancelTour,
  };
}
