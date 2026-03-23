import { describe, it, expect } from "vitest";
import {
  createTraceId,
  createSpan,
  endSpan,
  calculateCost,
  aggregateSpans,
} from "../lib/telemetry";

describe("telemetry", () => {
  it("should create unique trace IDs", () => {
    const id1 = createTraceId();
    const id2 = createTraceId();
    expect(id1).not.toBe(id2);
  });

  it("should create a span with correct properties", () => {
    const traceId = createTraceId();
    const span = createSpan(traceId, "test-span", "instance-1", undefined, "node-1");

    expect(span.traceId).toBe(traceId);
    expect(span.name).toBe("test-span");
    expect(span.instanceId).toBe("instance-1");
    expect(span.nodeId).toBe("node-1");
    expect(span.startTime).toBeDefined();
    expect(span.endTime).toBeUndefined();
  });

  it("should end a span with endTime and attributes", () => {
    const span = createSpan("trace", "span", "inst");
    const ended = endSpan(span, { result: "success" });

    expect(ended.endTime).toBeDefined();
    expect(ended.attributes["result"]).toBe("success");
  });

  it("should calculate cost correctly", () => {
    const cost = calculateCost("claude-sonnet-4-20250514", 1000, 500);
    expect(cost).toBeCloseTo(0.003 + 0.0075, 4);
  });

  it("should aggregate spans correctly", () => {
    const traceId = createTraceId();
    const spans = [
      {
        ...createSpan(traceId, "span1", "inst", undefined, "node-1"),
        endTime: Date.now() + 100,
        tokenUsage: { prompt: 100, completion: 50, total: 150 },
        cost: 0.01,
      },
      {
        ...createSpan(traceId, "span2", "inst", undefined, "node-2"),
        endTime: Date.now() + 200,
        tokenUsage: { prompt: 200, completion: 100, total: 300 },
        cost: 0.02,
      },
    ];

    const summary = aggregateSpans(spans);
    expect(summary.totalSpans).toBe(2);
    expect(summary.totalTokens).toBe(450);
    expect(summary.totalCost).toBeCloseTo(0.03, 4);
    expect(summary.spansByNode["node-1"]).toBe(1);
    expect(summary.spansByNode["node-2"]).toBe(1);
  });
});
