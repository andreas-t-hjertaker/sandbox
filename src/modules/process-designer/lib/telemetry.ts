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

export type TelemetryExporter = (
  batch: (LLMCallMetrics | AgentRunMetrics)[]
) => Promise<void>;

/** Firestore-basert exporter (standard) */
async function firestoreExporter(
  batch: (LLMCallMetrics | AgentRunMetrics)[]
): Promise<void> {
  const { addDocument } = await import("@/lib/firebase/firestore");
  const promises = batch.map((entry) => {
    const kind = "runId" in entry ? "agent_run" : "llm_call";
    return addDocument("telemetryEvents", {
      kind,
      ...entry,
      timestamp: entry.timestamp.toISOString(),
      flushedAt: new Date().toISOString(),
    });
  });
  await Promise.all(promises);
}

/** OpenTelemetry-kompatibel HTTP exporter */
async function otelHttpExporter(
  batch: (LLMCallMetrics | AgentRunMetrics)[],
  endpoint: string
): Promise<void> {
  const spans = batch.map((entry) => {
    const kind = "runId" in entry ? "agent_run" : "llm_call";
    const id = "runId" in entry ? entry.runId : entry.callId;
    return {
      traceId: id,
      spanId: id,
      name: kind,
      kind: 1, // SPAN_KIND_INTERNAL
      startTimeUnixNano: entry.timestamp.getTime() * 1_000_000,
      endTimeUnixNano:
        (entry.timestamp.getTime() +
          ("totalDurationMs" in entry ? entry.totalDurationMs : entry.latencyMs)) *
        1_000_000,
      attributes: Object.entries(entry)
        .filter(([, v]) => typeof v !== "object")
        .map(([k, v]) => ({
          key: k,
          value:
            typeof v === "number"
              ? { intValue: v }
              : { stringValue: String(v) },
        })),
    };
  });

  await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resourceSpans: [
        {
          resource: { attributes: [{ key: "service.name", value: { stringValue: "process-designer" } }] },
          scopeSpans: [{ spans }],
        },
      ],
    }),
  });
}

let activeExporter: TelemetryExporter = firestoreExporter;

/** Konfigurer telemetri-exporter */
export function setTelemetryExporter(exporter: TelemetryExporter): void {
  activeExporter = exporter;
}

/** Bruk OpenTelemetry HTTP exporter */
export function useOtelExporter(endpoint: string): void {
  activeExporter = (batch) => otelHttpExporter(batch, endpoint);
}

/** Flush metrics til konfigurert backend */
async function flushMetrics(): Promise<void> {
  if (metricsBuffer.length === 0) return;
  const batch = metricsBuffer.splice(0, metricsBuffer.length);
  try {
    await activeExporter(batch);
    console.debug(`[telemetry] Flushed ${batch.length} metrics`);
  } catch (err) {
    // Re-legg batch tilbake ved feil slik at vi ikke mister data
    metricsBuffer.unshift(...batch);
    console.warn(`[telemetry] Flush feilet, ${batch.length} metrics beholdt i buffer`, err);
  }
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
