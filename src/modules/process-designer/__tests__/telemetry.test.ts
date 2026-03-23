import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  trackLLMCall,
  trackAgentRun,
  estimateCost,
  aggregateProcessMetrics,
} from "../lib/telemetry";
import type { LLMCallMetrics, AgentRunMetrics } from "../lib/telemetry";

describe("estimateCost", () => {
  it("beregner kostnad for gemini-2.5-flash", () => {
    const cost = estimateCost("gemini-2.5-flash", 1_000_000, 1_000_000);
    // input: 0.075, output: 0.30
    expect(cost).toBeCloseTo(0.375, 3);
  });

  it("bruker default rate for ukjent modell", () => {
    const cost = estimateCost("unknown-model", 1_000_000, 1_000_000);
    // input: 0.15, output: 0.60
    expect(cost).toBeCloseTo(0.75, 3);
  });

  it("returnerer 0 for 0 tokens", () => {
    expect(estimateCost("gemini-2.5-flash", 0, 0)).toBe(0);
  });
});

describe("aggregateProcessMetrics", () => {
  const makeRun = (overrides: Partial<AgentRunMetrics>): AgentRunMetrics => ({
    runId: "r1",
    processId: "p1",
    instanceId: "i1",
    stepId: "s1",
    iterationCount: 1,
    totalDurationMs: 1000,
    llmCallCount: 1,
    totalTokens: 500,
    totalCost: 0.01,
    success: true,
    timestamp: new Date(),
    ...overrides,
  });

  it("returnerer nullverdier for tom liste", () => {
    const agg = aggregateProcessMetrics([]);
    expect(agg.totalRuns).toBe(0);
    expect(agg.avgDurationMs).toBe(0);
    expect(agg.successRate).toBe(0);
  });

  it("aggregerer flere kjøringer korrekt", () => {
    const runs = [
      makeRun({ totalDurationMs: 1000, totalTokens: 100, totalCost: 0.01, success: true }),
      makeRun({ totalDurationMs: 3000, totalTokens: 200, totalCost: 0.02, success: true }),
      makeRun({ totalDurationMs: 2000, totalTokens: 150, totalCost: 0.015, success: false }),
    ];
    const agg = aggregateProcessMetrics(runs);
    expect(agg.totalRuns).toBe(3);
    expect(agg.avgDurationMs).toBe(2000);
    expect(agg.totalTokens).toBe(450);
    expect(agg.totalCost).toBeCloseTo(0.045);
    expect(agg.successRate).toBeCloseTo(66.67, 1);
  });

  it("beregner 100% success rate når alle lykkes", () => {
    const runs = [makeRun({ success: true }), makeRun({ success: true })];
    const agg = aggregateProcessMetrics(runs);
    expect(agg.successRate).toBe(100);
  });
});

describe("trackLLMCall / trackAgentRun", () => {
  it("aksepterer gyldige LLM-metrikker uten å kaste feil", () => {
    const metrics: LLMCallMetrics = {
      callId: "c1",
      model: "gemini-2.5-flash",
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      latencyMs: 200,
      cost: 0.01,
      timestamp: new Date(),
    };
    expect(() => trackLLMCall(metrics)).not.toThrow();
  });

  it("aksepterer gyldige agent-metrikker uten å kaste feil", () => {
    const metrics: AgentRunMetrics = {
      runId: "r1",
      processId: "p1",
      instanceId: "i1",
      stepId: "s1",
      iterationCount: 2,
      totalDurationMs: 5000,
      llmCallCount: 3,
      totalTokens: 1000,
      totalCost: 0.05,
      success: true,
      timestamp: new Date(),
    };
    expect(() => trackAgentRun(metrics)).not.toThrow();
  });
});
