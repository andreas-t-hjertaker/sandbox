/**
 * Revisjonsspor — komplett audit trail for alle agenthandlinger (#26).
 */

import { addDocument, getCollection, orderBy, where } from "@/lib/firebase/firestore";

export type AuditAction =
  | "agent_execute"
  | "agent_suggest"
  | "human_approve"
  | "human_reject"
  | "human_override"
  | "system_error"
  | "system_retry"
  | "deploy"
  | "config_change";

export type AuditEntry = {
  processId: string;
  instanceId?: string;
  stepId?: string;
  action: AuditAction;
  actor: { type: "user" | "agent"; uid: string; name: string };
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  reasoning?: string;
  decision?: string;
  autonomyLevel?: number;
  confidence?: number;
  durationMs?: number;
  createdAt: Date;
};

/** Logg en audit-hendelse */
export async function logAuditEntry(
  processId: string,
  entry: Omit<AuditEntry, "processId" | "createdAt">
) {
  const path = `processDefinitions/${processId}/auditLog`;
  return addDocument(path, {
    ...entry,
    processId,
    createdAt: new Date(),
  });
}

/** Hent audit-logg for en prosess */
export async function getAuditLog(processId: string, instanceId?: string) {
  const path = `processDefinitions/${processId}/auditLog`;
  if (instanceId) {
    return getCollection<AuditEntry>(
      path,
      where("instanceId", "==", instanceId),
      orderBy("createdAt", "desc")
    );
  }
  return getCollection<AuditEntry>(path, orderBy("createdAt", "desc"));
}

/** Eksporter audit-logg som CSV */
export function exportAuditToCSV(entries: AuditEntry[]): string {
  const headers = [
    "Tidspunkt", "Handling", "Aktør", "Steg",
    "Beslutning", "Autonominivå", "Varighet (ms)",
  ];

  const rows = entries.map((e) => [
    e.createdAt.toISOString(),
    e.action,
    `${e.actor.type}:${e.actor.name}`,
    e.stepId || "",
    e.decision || "",
    e.autonomyLevel?.toString() || "",
    e.durationMs?.toString() || "",
  ]);

  return [
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
  ].join("\n");
}
