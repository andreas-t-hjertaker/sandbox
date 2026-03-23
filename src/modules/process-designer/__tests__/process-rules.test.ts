import { describe, it, expect } from "vitest";
import { rulesToPromptSection } from "../lib/process-rules";

describe("rulesToPromptSection", () => {
  it("returnerer tom streng for tomme regler", () => {
    expect(rulesToPromptSection("")).toBe("");
    expect(rulesToPromptSection("   ")).toBe("");
  });

  it("wrapper regler i domeneregler-blokk", () => {
    const rules = "- Alltid bruk norsk.\n- Maksimalt 5 iterasjoner.";
    const result = rulesToPromptSection(rules);
    expect(result).toContain("--- DOMENEREGLER (MÅ FØLGES) ---");
    expect(result).toContain("--- SLUTT DOMENEREGLER ---");
    expect(result).toContain("Alltid bruk norsk");
    expect(result).toContain("Maksimalt 5 iterasjoner");
  });
});
