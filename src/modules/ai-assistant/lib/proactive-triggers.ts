/**
 * Proaktive triggere for skyassistenten.
 *
 * Generisk trigger-system som evaluerer betingelser og foreslår handlinger.
 * Hvert prosjekt som kloner sandbox kan utvide med domene-spesifikke triggere.
 */

import type { ScannedElement } from "../types";

export type TriggerContext = {
  currentPath: string;
  elements: ScannedElement[];
  timeOnPage: number;
  lastInteraction: number;
  userData?: Record<string, unknown>;
};

export type CloudTriggerAction =
  | { type: "navigate"; targetId: string; message: string }
  | { type: "speak"; message: string; variant?: "info" | "success" | "warning" }
  | { type: "tour"; steps: { targetId: string; message: string }[] };

export type ProactiveTrigger = {
  id: string;
  condition: (ctx: TriggerContext) => boolean;
  cooldownMs: number;
  action: CloudTriggerAction;
  priority: number;
};

/** Boilerplate-triggere som fungerer i alle prosjekter */
export const defaultTriggers: ProactiveTrigger[] = [
  {
    id: "tom-side",
    condition: (ctx) => {
      const actionElements = ctx.elements.filter(
        (el) => el.type === "action" || el.type === "kpi"
      );
      return actionElements.length === 0 && ctx.timeOnPage > 3000;
    },
    cooldownMs: 300_000,
    action: {
      type: "speak",
      message: "Det ser tomt ut her! Vil du opprette noe nytt?",
      variant: "info",
    },
    priority: 5,
  },
  {
    id: "inaktivitet",
    condition: (ctx) => ctx.lastInteraction > 60_000,
    cooldownMs: 120_000,
    action: {
      type: "speak",
      message: "Er det noe jeg kan hjelpe deg med?",
      variant: "info",
    },
    priority: 1,
  },
];

/** Hent cooldown-status fra sessionStorage */
function getCooldown(triggerId: string): number {
  if (typeof window === "undefined") return 0;
  const stored = sessionStorage.getItem(`cloud-trigger-${triggerId}`);
  return stored ? Number(stored) : 0;
}

/** Sett cooldown i sessionStorage */
function setCooldown(triggerId: string, cooldownMs: number): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    `cloud-trigger-${triggerId}`,
    String(Date.now() + cooldownMs)
  );
}

/** Evaluer alle triggere og returner den høyest prioriterte som matcher */
export function evaluateTriggers(
  ctx: TriggerContext,
  triggers: ProactiveTrigger[]
): { trigger: ProactiveTrigger; action: CloudTriggerAction } | null {
  const now = Date.now();

  const matching = triggers
    .filter((t) => {
      const cooldownUntil = getCooldown(t.id);
      if (now < cooldownUntil) return false;
      try {
        return t.condition(ctx);
      } catch {
        return false;
      }
    })
    .sort((a, b) => b.priority - a.priority);

  if (matching.length === 0) return null;

  const winner = matching[0];
  setCooldown(winner.id, winner.cooldownMs);
  return { trigger: winner, action: winner.action };
}
