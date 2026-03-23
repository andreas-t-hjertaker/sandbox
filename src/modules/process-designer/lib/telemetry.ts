import type { TelemetrySpan } from "../types";

/**
 * Telemetry utilities for LLM call tracking and process monitoring.
 * Integrates with Langfuse-style tracing and OpenTelemetry spans.
 */

// ─── Span creation ──────────────────────────────────────────────────

let spanCounter = 0;

function generateId(): string {
  return `${Date.now()}-${++spanCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTraceId(): string {
  return generateId();
}

export function createSpan(
  traceId: string,
  name: string,
  instanceId: string,
  parentSpanId?: string,
  nodeId?: string
): TelemetrySpan {
  return {
    traceId,
    spanId: generateId(),
    parentSpanId,
    name,
    instanceId,
    nodeId,
    startTime: Date.now(),
    attributes: {},
  };
}

export function endSpan(
  span: TelemetrySpan,
  attributes?: Record<string, unknown>
): TelemetrySpan {
  return {
    ...span,
    endTime: Date.now(),
    attributes: { ...span.attributes, ...attributes },
  };
}

// ─── LLM-specific tracking ─────────────────────────────────────────

export interface LLMCallMetrics {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  cost: number;
}

const TOKEN_COSTS: Record<string, { prompt: number; completion: number }> = {
  "claude-sonnet-4-20250514": { prompt: 0.003, completion: 0.015 },
  "claude-opus-4-20250514": { prompt: 0.015, completion: 0.075 },
  "claude-haiku-4-20250514": { prompt: 0.0008, completion: 0.004 },
  default: { prompt: 0.003, completion: 0.015 },
};

export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const costs = TOKEN_COSTS[model] || TOKEN_COSTS["default"];
  return (
    (promptTokens / 1000) * costs.prompt +
    (completionTokens / 1000) * costs.completion
  );
}

export function createLLMSpan(
  traceId: string,
  instanceId: string,
  parentSpanId: string,
  nodeId: string,
  metrics: LLMCallMetrics
): TelemetrySpan {
  return {
    traceId,
    spanId: generateId(),
    parentSpanId,
    name: `llm.${metrics.model}`,
    instanceId,
    nodeId,
    startTime: Date.now() - metrics.latencyMs,
    endTime: Date.now(),
    attributes: {
      "llm.model": metrics.model,
      "llm.latency_ms": metrics.latencyMs,
    },
    tokenUsage: {
      prompt: metrics.promptTokens,
      completion: metrics.completionTokens,
      total: metrics.totalTokens,
    },
    cost: metrics.cost,
  };
}

// ─── Aggregation ────────────────────────────────────────────────────

export interface TelemetrySummary {
  totalSpans: number;
  totalDurationMs: number;
  totalTokens: number;
  totalCost: number;
  avgLatencyMs: number;
  errorRate: number;
  spansByNode: Record<string, number>;
}

export function aggregateSpans(spans: TelemetrySpan[]): TelemetrySummary {
  const llmSpans = spans.filter((s) => s.tokenUsage);
  const errorSpans = spans.filter((s) => s.attributes["error"]);

  const totalTokens = llmSpans.reduce(
    (sum, s) => sum + (s.tokenUsage?.total || 0),
    0
  );
  const totalCost = llmSpans.reduce((sum, s) => sum + (s.cost || 0), 0);
  const totalDuration = spans.reduce((sum, s) => {
    if (s.startTime && s.endTime) {
      return sum + ((s.endTime as number) - (s.startTime as number));
    }
    return sum;
  }, 0);

  const spansByNode: Record<string, number> = {};
  for (const span of spans) {
    if (span.nodeId) {
      spansByNode[span.nodeId] = (spansByNode[span.nodeId] || 0) + 1;
    }
  }

  return {
    totalSpans: spans.length,
    totalDurationMs: totalDuration,
    totalTokens,
    totalCost,
    avgLatencyMs: llmSpans.length > 0 ? totalDuration / llmSpans.length : 0,
    errorRate: spans.length > 0 ? errorSpans.length / spans.length : 0,
    spansByNode,
  };
}
