import { describe, it, expect } from "vitest";
import {
  createIdempotencyKey,
  withIdempotency,
  retryWithBackoff,
} from "../lib/idempotency";

describe("createIdempotencyKey", () => {
  it("should create a deterministic key", () => {
    expect(createIdempotencyKey("event-1", "step-1")).toBe("event-1:step-1");
    expect(createIdempotencyKey("event-1", "step-1")).toBe("event-1:step-1");
  });
});

describe("withIdempotency", () => {
  it("should execute handler on first call", async () => {
    const processed = new Set<string>();
    const handler = withIdempotency(
      async (input: string) => `result-${input}`,
      {
        getKey: (input) => ({ eventId: input, stepId: "step" }),
        checkProcessed: async (key) => processed.has(key),
        markProcessed: async (key) => { processed.add(key); },
      }
    );

    const result = await handler("test");
    expect(result).toBe("result-test");
  });

  it("should return null on duplicate call", async () => {
    const processed = new Set<string>();
    const handler = withIdempotency(
      async (input: string) => `result-${input}`,
      {
        getKey: (input) => ({ eventId: input, stepId: "step" }),
        checkProcessed: async (key) => processed.has(key),
        markProcessed: async (key) => { processed.add(key); },
      }
    );

    await handler("test");
    const secondResult = await handler("test");
    expect(secondResult).toBeNull();
  });
});

describe("retryWithBackoff", () => {
  it("should succeed on first try", async () => {
    const result = await retryWithBackoff(async () => "success");
    expect(result).toBe("success");
  });

  it("should retry on failure and succeed", async () => {
    let attempts = 0;
    const result = await retryWithBackoff(
      async () => {
        attempts++;
        if (attempts < 2) throw new Error("fail");
        return "success";
      },
      { maxAttempts: 3, baseDelay: 10 }
    );

    expect(result).toBe("success");
    expect(attempts).toBe(2);
  });

  it("should throw after max attempts", async () => {
    await expect(
      retryWithBackoff(
        async () => { throw new Error("always fail"); },
        { maxAttempts: 2, baseDelay: 10 }
      )
    ).rejects.toThrow("always fail");
  });
});
