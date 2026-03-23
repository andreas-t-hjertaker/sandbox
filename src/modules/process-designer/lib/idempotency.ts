/**
 * Idempotency utilities for safe re-execution of process steps.
 * Uses event-ID + step-ID deduplication with outbox pattern.
 */

export interface IdempotencyKey {
  eventId: string;
  stepId: string;
}

export function createIdempotencyKey(eventId: string, stepId: string): string {
  return `${eventId}:${stepId}`;
}

/**
 * Outbox entry — stored in Firestore BEFORE the event is published.
 */
export interface OutboxEntry {
  id: string;
  idempotencyKey: string;
  eventId: string;
  stepId: string;
  payload: Record<string, unknown>;
  status: "pending" | "published" | "failed";
  attempts: number;
  createdAt: unknown;
  publishedAt?: unknown;
}

/**
 * Wraps an async handler to make it idempotent.
 * Checks if the operation has already been completed before executing.
 */
export function withIdempotency<TInput, TOutput>(
  handler: (input: TInput) => Promise<TOutput>,
  options: {
    getKey: (input: TInput) => IdempotencyKey;
    checkProcessed: (key: string) => Promise<boolean>;
    markProcessed: (key: string, result: TOutput) => Promise<void>;
  }
): (input: TInput) => Promise<TOutput | null> {
  return async (input: TInput) => {
    const { eventId, stepId } = options.getKey(input);
    const key = createIdempotencyKey(eventId, stepId);

    // Check if already processed
    const alreadyProcessed = await options.checkProcessed(key);
    if (alreadyProcessed) {
      return null; // Already processed, skip
    }

    // Execute handler
    const result = await handler(input);

    // Mark as processed
    await options.markProcessed(key, result);

    return result;
  };
}

/**
 * Retry with exponential backoff for MCP tool calls.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelay = 1000, maxDelay = 30000 } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts - 1) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
