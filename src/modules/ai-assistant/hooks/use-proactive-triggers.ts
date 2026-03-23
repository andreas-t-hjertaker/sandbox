"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  evaluateTriggers,
  defaultTriggers,
  type ProactiveTrigger,
  type TriggerContext,
} from "../lib/proactive-triggers";
import type { ScannedElement } from "../types";

const EVAL_INTERVAL_MS = 5000;

type UseProactiveTriggersOptions = {
  elements: ScannedElement[];
  enabled?: boolean;
  customTriggers?: ProactiveTrigger[];
  userData?: Record<string, unknown>;
  onAction?: (action: TriggerContext & { trigger: ProactiveTrigger }) => void;
  onNavigate?: (targetId: string, message: string) => void;
  onSpeak?: (message: string, variant?: "info" | "success" | "warning") => void;
  onTour?: (steps: { targetId: string; message: string }[]) => void;
};

/**
 * Hook som evaluerer proaktive triggere hvert 5. sekund.
 *
 * Respekterer cooldown, brukerinteraksjon resetter timere,
 * og kun én proaktiv handling kjøres om gangen.
 */
export function useProactiveTriggers({
  elements,
  enabled = true,
  customTriggers = [],
  userData,
  onNavigate,
  onSpeak,
  onTour,
}: UseProactiveTriggersOptions) {
  const pathname = usePathname();
  const pageLoadTimeRef = useRef(Date.now());
  const lastInteractionRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset ved route-endring
  useEffect(() => {
    pageLoadTimeRef.current = Date.now();
    lastInteractionRef.current = Date.now();
  }, [pathname]);

  // Lytt etter brukerinteraksjoner
  useEffect(() => {
    const resetInteraction = () => {
      lastInteractionRef.current = Date.now();
    };

    window.addEventListener("click", resetInteraction, { passive: true });
    window.addEventListener("keydown", resetInteraction, { passive: true });
    window.addEventListener("scroll", resetInteraction, { passive: true });
    window.addEventListener("mousemove", resetInteraction, { passive: true });

    return () => {
      window.removeEventListener("click", resetInteraction);
      window.removeEventListener("keydown", resetInteraction);
      window.removeEventListener("scroll", resetInteraction);
      window.removeEventListener("mousemove", resetInteraction);
    };
  }, []);

  const evaluate = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    const ctx: TriggerContext = {
      currentPath: pathname,
      elements,
      timeOnPage: now - pageLoadTimeRef.current,
      lastInteraction: now - lastInteractionRef.current,
      userData,
    };

    const allTriggers = [...defaultTriggers, ...customTriggers];
    const result = evaluateTriggers(ctx, allTriggers);

    if (!result) return;

    const { action } = result;
    switch (action.type) {
      case "navigate":
        onNavigate?.(action.targetId, action.message);
        break;
      case "speak":
        onSpeak?.(action.message, action.variant);
        break;
      case "tour":
        onTour?.(action.steps);
        break;
    }
  }, [enabled, pathname, elements, userData, customTriggers, onNavigate, onSpeak, onTour]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(evaluate, EVAL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, evaluate]);
}
