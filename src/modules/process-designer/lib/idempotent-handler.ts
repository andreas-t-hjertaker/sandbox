/**
 * Idempotent handlers — sikker re-kjøring av prosesssteg (#29).
 */

import { getDocument, addDocument, updateDocument } from "@/lib/firebase/firestore";

export type IdempotencyRecord = {
  eventId: string;
  stepId: string;
  status: "processing" | "completed" | "failed";
  result?: unknown;
  createdAt: Date;
  completedAt?: Date;
};

const COLLECTION = "idempotencyKeys";

/**
 * Utfør en handling idempotent.
 *
 * 1. Sjekk om eventId+stepId allerede er utført
 * 2. Hvis ja, returner cached resultat
 * 3. Hvis nei, opprett record, utfør, lagre resultat
 */
export async function executeIdempotent<T>(
  eventId: string,
  stepId: string,
  handler: () => Promise<T>
): Promise<{ result: T; alreadyProcessed: boolean }> {
  const key = `${eventId}_${stepId}`;

  // Sjekk for eksisterende record
  const existing = await getDocument<IdempotencyRecord>(COLLECTION, key);
  if (existing) {
    if (existing.status === "completed" && existing.result !== undefined) {
      return { result: existing.result as T, alreadyProcessed: true };
    }
    if (existing.status === "processing") {
      // Annen instans prosesserer — vent og sjekk igjen
      throw new Error(`Steg ${stepId} prosesseres allerede for event ${eventId}`);
    }
  }

  // Outbox: lagre event FØR utføring
  await addDocument(COLLECTION, {
    eventId,
    stepId,
    status: "processing",
    createdAt: new Date(),
  });

  try {
    const result = await handler();

    // Lagre resultat
    await updateDocument(COLLECTION, key, {
      status: "completed",
      result,
      completedAt: new Date(),
    });

    return { result, alreadyProcessed: false };
  } catch (error) {
    await updateDocument(COLLECTION, key, {
      status: "failed",
      result: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/** Generer en idempotency-nøkkel for MCP tool calls */
export function generateIdempotencyKey(
  eventId: string,
  stepId: string,
  toolName: string
): string {
  return `${eventId}_${stepId}_${toolName}`;
}
