import { describe, it, expect } from "vitest";
import { getCursorColor } from "../lib/collaboration";

describe("getCursorColor", () => {
  it("returnerer en gyldig hex-farge", () => {
    const color = getCursorColor("user-123");
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("returnerer konsekvent farge for samme UID", () => {
    const color1 = getCursorColor("abc");
    const color2 = getCursorColor("abc");
    expect(color1).toBe(color2);
  });

  it("gir ulike farger for ulike UIDs (sannsynlig)", () => {
    const colors = new Set(
      ["user-1", "user-2", "user-3", "user-4", "user-5"].map(getCursorColor)
    );
    // Med 8 farger og 5 brukere bør vi se minst 2 forskjellige
    expect(colors.size).toBeGreaterThanOrEqual(2);
  });
});
