/**
 * Dead Letter Queue — feilhåndtering for mislykkede agentkjøringer (#25).
 */

import {
  addDocument,
  getCollection,
  updateDocument,
  where,
  orderBy,
} from "@/lib/firebase/firestore";

export type DLQEntry = {
  processId: string;
  instanceId: string;
  stepId: string;
  stepLabel: string;
  error: string;
  stackTrace?: string;
  input: Record<string, unknown>;
  attemptCount: number;
  maxAttempts: number;
  status: "pending" | "retrying" | "resolved" | "escalated";
  assignedTo?: string;
  createdAt: Date;
  resolvedAt?: Date;
};

const COLLECTION = "deadLetterQueue";
const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 2000;

/** Legg til en oppgave i DLQ */
export async function addToDLQ(
  entry: Omit<DLQEntry, "status" | "attemptCount" | "maxAttempts" | "createdAt">
) {
  return addDocument(COLLECTION, {
    ...entry,
    status: "pending",
    attemptCount: 0,
    maxAttempts: MAX_RETRIES,
    createdAt: new Date(),
  });
}

/** Hent DLQ-elementer for en prosess */
export async function getDLQEntries(processId?: string) {
  if (processId) {
    return getCollection<DLQEntry>(
      COLLECTION,
      where("processId", "==", processId),
      orderBy("createdAt", "desc")
    );
  }
  return getCollection<DLQEntry>(COLLECTION, orderBy("createdAt", "desc"));
}

/** Marker som retry (med backoff) */
export async function retryDLQEntry(entryId: string, currentAttempt: number) {
  return updateDocument(COLLECTION, entryId, {
    status: "retrying",
    attemptCount: currentAttempt + 1,
  });
}

/** Eskalér til bruker */
export async function escalateDLQEntry(entryId: string, assignTo: string) {
  return updateDocument(COLLECTION, entryId, {
    status: "escalated",
    assignedTo: assignTo,
  });
}

/** Marker som løst */
export async function resolveDLQEntry(entryId: string) {
  return updateDocument(COLLECTION, entryId, {
    status: "resolved",
    resolvedAt: new Date(),
  });
}

/** Beregn eksponentiell backoff */
export function calculateBackoff(attempt: number): number {
  return BACKOFF_BASE_MS * Math.pow(2, attempt);
}

/** Sjekk om oppgave bør gå til DLQ (etter maks forsøk) */
export function shouldMoveToDLQ(attemptCount: number): boolean {
  return attemptCount >= MAX_RETRIES;
}
