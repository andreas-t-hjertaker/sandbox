import { describe, it, expect } from "vitest";
import { calculateBackoff, shouldMoveToDLQ } from "../lib/dead-letter-queue";

describe("calculateBackoff", () => {
  it("returnerer 2s for forsøk 0", () => {
    expect(calculateBackoff(0)).toBe(2000);
  });

  it("returnerer 4s for forsøk 1", () => {
    expect(calculateBackoff(1)).toBe(4000);
  });

  it("returnerer 8s for forsøk 2", () => {
    expect(calculateBackoff(2)).toBe(8000);
  });

  it("øker eksponentielt", () => {
    const b0 = calculateBackoff(0);
    const b1 = calculateBackoff(1);
    const b2 = calculateBackoff(2);
    expect(b1).toBe(b0 * 2);
    expect(b2).toBe(b1 * 2);
  });
});

describe("shouldMoveToDLQ", () => {
  it("returnerer false under maks forsøk", () => {
    expect(shouldMoveToDLQ(0)).toBe(false);
    expect(shouldMoveToDLQ(1)).toBe(false);
    expect(shouldMoveToDLQ(2)).toBe(false);
  });

  it("returnerer true ved maks forsøk (3)", () => {
    expect(shouldMoveToDLQ(3)).toBe(true);
  });

  it("returnerer true over maks forsøk", () => {
    expect(shouldMoveToDLQ(5)).toBe(true);
  });
});
