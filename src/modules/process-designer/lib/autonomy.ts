/**
 * Graderbar autonomi — konfigurerbar tillit per prosesssteg (#24).
 */

import type { AutonomyLevel } from "../types";

export type AutonomyConfig = {
  level: AutonomyLevel;
  spendingCapNOK?: number;
  confidenceThreshold?: number;
  escalateToUid?: string;
};

export const AUTONOMY_DESCRIPTIONS: Record<AutonomyLevel, {
  label: string;
  description: string;
  agentBehavior: string;
}> = {
  1: {
    label: "Kun forslag",
    description: "Agenten gjør ingenting, bare foreslår handling",
    agentBehavior: "Observer og rapporter — ingen side-effekter",
  },
  2: {
    label: "Utfør med logging",
    description: "Agenten utfører handlingen, alt logges detaljert",
    agentBehavior: "Utfør og logg all input/output til audit trail",
  },
  3: {
    label: "Utfør med varsling",
    description: "Agenten utfører og varsler ansvarlig bruker",
    agentBehavior: "Utfør, logg, og send varsel til stakeholder",
  },
  4: {
    label: "Full autonom med budsjett",
    description: "Agenten utfører fritt innenfor et definert budsjett",
    agentBehavior: "Utfør autonomt — stopp og eskalér ved budsjettgrense",
  },
  5: {
    label: "Full autonom",
    description: "Agenten utfører uten begrensninger",
    agentBehavior: "Full autonomi — ingen restriksjoner",
  },
};

/** Sjekk om en handling krever eskalering */
export function requiresEscalation(
  config: AutonomyConfig,
  confidence: number,
  amountNOK?: number
): { escalate: boolean; reason?: string } {
  if (config.level === 1) {
    return { escalate: true, reason: "Nivå 1 — kun forslag" };
  }

  if (config.confidenceThreshold && confidence < config.confidenceThreshold) {
    return {
      escalate: true,
      reason: `Konfidansnivå ${(confidence * 100).toFixed(0)}% under terskel ${(config.confidenceThreshold * 100).toFixed(0)}%`,
    };
  }

  if (config.level === 4 && config.spendingCapNOK && amountNOK) {
    if (amountNOK > config.spendingCapNOK) {
      return {
        escalate: true,
        reason: `Beløp ${amountNOK} kr overstiger budsjettgrense ${config.spendingCapNOK} kr`,
      };
    }
  }

  return { escalate: false };
}

/** Standard autonomiinnstilling basert på risiko */
export function defaultAutonomyForRisk(
  risk: "low" | "medium" | "high"
): AutonomyConfig {
  switch (risk) {
    case "low":
      return { level: 4, spendingCapNOK: 10000 };
    case "medium":
      return { level: 3, confidenceThreshold: 0.8 };
    case "high":
      return { level: 2, confidenceThreshold: 0.9 };
  }
}
