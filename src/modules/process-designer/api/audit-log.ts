import {
  getCollection,
  getDocument,
  addDocument,
  subscribeToCollection,
} from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import type { AuditLogEntry } from "../types";

// ─── Collection path ───────────────────────────────────────────────

const auditLogPath = (processId: string, instanceId: string) =>
  `processDefinitions/${processId}/instances/${instanceId}/auditLog`;

// ─── Read ──────────────────────────────────────────────────────────

export async function getAuditLog(processId: string, instanceId: string) {
  return getCollection<AuditLogEntry>(
    auditLogPath(processId, instanceId),
    orderBy("timestamp", "desc"),
  );
}

export async function getAuditLogEntry(
  processId: string,
  instanceId: string,
  logId: string,
) {
  return getDocument<AuditLogEntry>(
    auditLogPath(processId, instanceId),
    logId,
  );
}

export async function getAuditLogByNode(
  processId: string,
  instanceId: string,
  nodeId: string,
) {
  return getCollection<AuditLogEntry>(
    auditLogPath(processId, instanceId),
    where("nodeId", "==", nodeId),
    orderBy("timestamp", "desc"),
  );
}

export async function getAuditLogByActor(
  processId: string,
  instanceId: string,
  actorId: string,
) {
  return getCollection<AuditLogEntry>(
    auditLogPath(processId, instanceId),
    where("actor.id", "==", actorId),
    orderBy("timestamp", "desc"),
  );
}

// ─── Write ─────────────────────────────────────────────────────────

export type CreateAuditLogInput = Omit<AuditLogEntry, "id" | "timestamp">;

export async function addAuditLogEntry(
  processId: string,
  instanceId: string,
  data: CreateAuditLogInput,
) {
  const ref = await addDocument(auditLogPath(processId, instanceId), data);
  return ref.id;
}

// ─── Real-time listeners ───────────────────────────────────────────

export function subscribeToAuditLog(
  processId: string,
  instanceId: string,
  callback: (entries: (AuditLogEntry & { id: string })[]) => void,
) {
  return subscribeToCollection<AuditLogEntry>(
    auditLogPath(processId, instanceId),
    callback,
    orderBy("timestamp", "desc"),
  );
}
