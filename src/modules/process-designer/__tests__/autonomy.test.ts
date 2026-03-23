import { describe, it, expect } from "vitest";
import {
  requiresEscalation,
  defaultAutonomyForRisk,
  AUTONOMY_DESCRIPTIONS,
} from "../lib/autonomy";
import type { AutonomyConfig } from "../lib/autonomy";

describe("requiresEscalation", () => {
  it("eskalerer alltid for nivå 1", () => {
    const config: AutonomyConfig = { level: 1 };
    const result = requiresEscalation(config, 0.99);
    expect(result.escalate).toBe(true);
    expect(result.reason).toContain("Nivå 1");
  });

  it("eskalerer når konfidans er under terskel", () => {
    const config: AutonomyConfig = { level: 3, confidenceThreshold: 0.8 };
    const result = requiresEscalation(config, 0.5);
    expect(result.escalate).toBe(true);
    expect(result.reason).toContain("50%");
  });

  it("eskalerer ikke når konfidans er over terskel", () => {
    const config: AutonomyConfig = { level: 3, confidenceThreshold: 0.8 };
    const result = requiresEscalation(config, 0.9);
    expect(result.escalate).toBe(false);
  });

  it("eskalerer nivå 4 når beløp overstiger budsjettgrense", () => {
    const config: AutonomyConfig = { level: 4, spendingCapNOK: 5000 };
    const result = requiresEscalation(config, 0.95, 10000);
    expect(result.escalate).toBe(true);
    expect(result.reason).toContain("10000");
    expect(result.reason).toContain("5000");
  });

  it("eskalerer ikke nivå 4 innenfor budsjett", () => {
    const config: AutonomyConfig = { level: 4, spendingCapNOK: 5000 };
    const result = requiresEscalation(config, 0.95, 3000);
    expect(result.escalate).toBe(false);
  });

  it("eskalerer ikke for nivå 5", () => {
    const config: AutonomyConfig = { level: 5 };
    const result = requiresEscalation(config, 0.1);
    expect(result.escalate).toBe(false);
  });
});

describe("defaultAutonomyForRisk", () => {
  it("returnerer nivå 4 for lav risiko", () => {
    const config = defaultAutonomyForRisk("low");
    expect(config.level).toBe(4);
    expect(config.spendingCapNOK).toBe(10000);
  });

  it("returnerer nivå 3 for medium risiko", () => {
    const config = defaultAutonomyForRisk("medium");
    expect(config.level).toBe(3);
    expect(config.confidenceThreshold).toBe(0.8);
  });

  it("returnerer nivå 2 for høy risiko", () => {
    const config = defaultAutonomyForRisk("high");
    expect(config.level).toBe(2);
    expect(config.confidenceThreshold).toBe(0.9);
  });
});

describe("AUTONOMY_DESCRIPTIONS", () => {
  it("har beskrivelser for alle 5 nivåer", () => {
    for (let i = 1; i <= 5; i++) {
      const desc = AUTONOMY_DESCRIPTIONS[i as 1 | 2 | 3 | 4 | 5];
      expect(desc).toBeDefined();
      expect(desc.label).toBeTruthy();
      expect(desc.description).toBeTruthy();
      expect(desc.agentBehavior).toBeTruthy();
    }
  });
});
