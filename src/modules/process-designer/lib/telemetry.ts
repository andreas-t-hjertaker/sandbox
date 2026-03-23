/**
 * Telemetri-hook — LLM-kall og agentkjøringssporing (#28).
 *
 * Instrumentering for kostnadsoptimalisering og overvåking.
 */

export type LLMCallMetrics = {
  callId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  cost: number;
  processId?: string;
  stepId?: string;
  timestamp: Date;
};

export type AgentRunMetrics = {
  runId: string;
  processId: string;
  instanceId: string;
  stepId: string;
  iterationCount: number;
  totalDurationMs: number;
  llmCallCount: number;
  totalTokens: number;
  totalCost: number;
  success: boolean;
  timestamp: Date;
};

// In-memory metrics buffer for client-side telemetri
const metricsBuffer: (LLMCallMetrics | AgentRunMetrics)[] = [];
const FLUSH_INTERVAL_MS = 30_000;
const MAX_BUFFER_SIZE = 100;

/** Registrer et LLM-kall */
export function trackLLMCall(metrics: LLMCallMetrics): void {
  metricsBuffer.push(metrics);
  if (metricsBuffer.length >= MAX_BUFFER_SIZE) {
    flushMetrics();
  }
}

/** Registrer en agentkjøring */
export function trackAgentRun(metrics: AgentRunMetrics): void {
  metricsBuffer.push(metrics);
  if (metricsBuffer.length >= MAX_BUFFER_SIZE) {
    flushMetrics();
  }
}

/** Flush metrics til backend (stub — implementeres med Langfuse/OTEL) */
async function flushMetrics(): Promise<void> {
  if (metricsBuffer.length === 0) return;
  const batch = metricsBuffer.splice(0, metricsBuffer.length);
  // TODO: Send til Langfuse eller OpenTelemetry collector
  console.debug(`[telemetry] Flushed ${batch.length} metrics`);
}

/** Start periodisk flushing */
export function startTelemetry(): () => void {
  const interval = setInterval(flushMetrics, FLUSH_INTERVAL_MS);
  return () => {
    clearInterval(interval);
    flushMetrics();
  };
}

/** Beregn estimert kostnad basert på tokens */
export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  // Gemini 2.5 Flash prising (omtrentlig)
  const rates: Record<string, { input: number; output: number }> = {
    "gemini-2.5-flash": { input: 0.075 / 1_000_000, output: 0.30 / 1_000_000 },
    default: { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
  };
  const rate = rates[model] || rates.default;
  return promptTokens * rate.input + completionTokens * rate.output;
}

/** Aggreger metrics for en prosess */
export function aggregateProcessMetrics(
  metrics: AgentRunMetrics[]
): {
  totalRuns: number;
  avgDurationMs: number;
  totalTokens: number;
  totalCost: number;
  successRate: number;
} {
  if (metrics.length === 0) {
    return { totalRuns: 0, avgDurationMs: 0, totalTokens: 0, totalCost: 0, successRate: 0 };
  }
  const successful = metrics.filter((m) => m.success).length;
  return {
    totalRuns: metrics.length,
    avgDurationMs: metrics.reduce((s, m) => s + m.totalDurationMs, 0) / metrics.length,
    totalTokens: metrics.reduce((s, m) => s + m.totalTokens, 0),
    totalCost: metrics.reduce((s, m) => s + m.totalCost, 0),
    successRate: (successful / metrics.length) * 100,
  };
}
