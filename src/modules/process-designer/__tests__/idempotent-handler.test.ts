import { describe, it, expect } from "vitest";
import { generateIdempotencyKey } from "../lib/idempotent-handler";

describe("generateIdempotencyKey", () => {
  it("kombinerer eventId, stepId og toolName", () => {
    const key = generateIdempotencyKey("evt-1", "step-2", "xero.createInvoice");
    expect(key).toBe("evt-1_step-2_xero.createInvoice");
  });

  it("genererer unike nøkler for ulike kombinasjoner", () => {
    const k1 = generateIdempotencyKey("e1", "s1", "tool1");
    const k2 = generateIdempotencyKey("e1", "s1", "tool2");
    const k3 = generateIdempotencyKey("e1", "s2", "tool1");
    expect(new Set([k1, k2, k3]).size).toBe(3);
  });
});
