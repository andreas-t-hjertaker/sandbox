import {
  getCollection,
  getDocument,
  addDocument,
  updateDocument,
  subscribeToCollection,
} from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import type { DLQEntry } from "../types";

// ─── Collection path ───────────────────────────────────────────────

const dlqPath = (processId: string, instanceId: string) =>
  `processDefinitions/${processId}/instances/${instanceId}/dlq`;

// ─── Read ──────────────────────────────────────────────────────────

export async function getDLQEntries(processId: string, instanceId: string) {
  return getCollection<DLQEntry>(
    dlqPath(processId, instanceId),
    orderBy("createdAt", "desc"),
  );
}

export async function getDLQEntry(
  processId: string,
  instanceId: string,
  dlqId: string,
) {
  return getDocument<DLQEntry>(dlqPath(processId, instanceId), dlqId);
}

export async function getDLQEntriesByStatus(
  processId: string,
  instanceId: string,
  status: DLQEntry["status"],
) {
  return getCollection<DLQEntry>(
    dlqPath(processId, instanceId),
    where("status", "==", status),
    orderBy("createdAt", "desc"),
  );
}

export async function getPendingDLQEntries(
  processId: string,
  instanceId: string,
) {
  return getDLQEntriesByStatus(processId, instanceId, "pending");
}

export async function getDLQEntriesByNode(
  processId: string,
  instanceId: string,
  nodeId: string,
) {
  return getCollection<DLQEntry>(
    dlqPath(processId, instanceId),
    where("nodeId", "==", nodeId),
    orderBy("createdAt", "desc"),
  );
}

// ─── Write ─────────────────────────────────────────────────────────

export type CreateDLQEntryInput = Omit<
  DLQEntry,
  "id" | "createdAt" | "resolvedAt" | "resolvedBy"
>;

export async function addDLQEntry(
  processId: string,
  instanceId: string,
  data: CreateDLQEntryInput,
) {
  const ref = await addDocument(dlqPath(processId, instanceId), data);
  return ref.id;
}

export async function retryDLQEntry(
  processId: string,
  instanceId: string,
  dlqId: string,
) {
  const entry = await getDLQEntry(processId, instanceId, dlqId);
  if (!entry) throw new Error(`DLQ entry ${dlqId} not found`);

  return updateDocument(dlqPath(processId, instanceId), dlqId, {
    status: "retrying" as DLQEntry["status"],
    attempts: entry.attempts + 1,
  });
}

export async function resolveDLQEntry(
  processId: string,
  instanceId: string,
  dlqId: string,
  resolvedBy: string,
) {
  return updateDocument(dlqPath(processId, instanceId), dlqId, {
    status: "resolved" as DLQEntry["status"],
    resolvedBy,
  });
}

export async function escalateDLQEntry(
  processId: string,
  instanceId: string,
  dlqId: string,
) {
  return updateDocument(dlqPath(processId, instanceId), dlqId, {
    status: "escalated" as DLQEntry["status"],
  });
}

// ─── Real-time listeners ───────────────────────────────────────────

export function subscribeToDLQEntries(
  processId: string,
  instanceId: string,
  callback: (entries: (DLQEntry & { id: string })[]) => void,
) {
  return subscribeToCollection<DLQEntry>(
    dlqPath(processId, instanceId),
    callback,
    orderBy("createdAt", "desc"),
  );
}

export function subscribeToPendingDLQEntries(
  processId: string,
  instanceId: string,
  callback: (entries: (DLQEntry & { id: string })[]) => void,
) {
  return subscribeToCollection<DLQEntry>(
    dlqPath(processId, instanceId),
    callback,
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
  );
}
