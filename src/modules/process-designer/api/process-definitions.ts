import {
  getCollection,
  getDocument,
  addDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  subscribeToDocument,
  batchWrite,
} from "@/lib/firebase/firestore";
import { where, orderBy, serverTimestamp } from "firebase/firestore";
import type {
  ProcessDefinition,
  ProcessNode,
  ProcessEdge,
  ProcessStatus,
} from "../types";

// ─── Collection paths ──────────────────────────────────────────────

const COLLECTION = "processDefinitions";
const versionsPath = (processId: string) =>
  `${COLLECTION}/${processId}/versions`;

// ─── Read ──────────────────────────────────────────────────────────

export async function getProcessDefinition(processId: string) {
  return getDocument<ProcessDefinition>(COLLECTION, processId);
}

export async function getProcessDefinitions(orgId?: string) {
  const constraints = orgId ? [where("orgId", "==", orgId)] : [];
  return getCollection<ProcessDefinition>(
    COLLECTION,
    ...constraints,
    orderBy("updatedAt", "desc"),
  );
}

export async function getProcessDefinitionsByStatus(status: ProcessStatus) {
  return getCollection<ProcessDefinition>(
    COLLECTION,
    where("status", "==", status),
    orderBy("updatedAt", "desc"),
  );
}

export async function getTemplates() {
  return getCollection<ProcessDefinition>(
    COLLECTION,
    where("isTemplate", "==", true),
    orderBy("name", "asc"),
  );
}

// ─── Write ─────────────────────────────────────────────────────────

export type CreateProcessInput = Omit<
  ProcessDefinition,
  "id" | "createdAt" | "updatedAt" | "version"
>;

export async function createProcessDefinition(data: CreateProcessInput) {
  const ref = await addDocument(COLLECTION, {
    ...data,
    version: 1,
    status: data.status ?? "draft",
    nodes: data.nodes ?? [],
    edges: data.edges ?? [],
    tags: data.tags ?? [],
    isTemplate: data.isTemplate ?? false,
  });
  return ref.id;
}

export async function updateProcessDefinition(
  processId: string,
  data: Partial<
    Pick<
      ProcessDefinition,
      | "name"
      | "description"
      | "nodes"
      | "edges"
      | "domainRules"
      | "tags"
      | "status"
    >
  >,
) {
  return updateDocument(COLLECTION, processId, data);
}

export async function updateProcessNodes(
  processId: string,
  nodes: ProcessNode[],
  edges: ProcessEdge[],
) {
  return updateDocument(COLLECTION, processId, { nodes, edges });
}

export async function deleteProcessDefinition(processId: string) {
  return deleteDocument(COLLECTION, processId);
}

// ─── Versioning ────────────────────────────────────────────────────

export interface ProcessVersion {
  versionNumber: number;
  snapshot: Omit<ProcessDefinition, "id">;
  publishedBy: string;
  publishedAt: unknown;
}

export async function publishVersion(
  processId: string,
  publishedBy: string,
) {
  const current = await getProcessDefinition(processId);
  if (!current) throw new Error(`Process ${processId} not found`);

  const nextVersion = current.version + 1;

  // Store the current state as a version snapshot
  const { id: _id, ...snapshot } = current;
  const versionData: Omit<ProcessVersion, "publishedAt"> = {
    versionNumber: current.version,
    snapshot,
    publishedBy,
  };

  const versionRef = await addDocument(versionsPath(processId), versionData);

  // Bump the version and set status to published
  await updateDocument(COLLECTION, processId, {
    version: nextVersion,
    status: "published" as ProcessStatus,
  });

  return { versionId: versionRef.id, version: nextVersion };
}

export async function getVersionHistory(processId: string) {
  return getCollection<ProcessVersion>(
    versionsPath(processId),
    orderBy("versionNumber", "desc"),
  );
}

export async function getVersion(processId: string, versionId: string) {
  return getDocument<ProcessVersion>(versionsPath(processId), versionId);
}

// ─── Real-time listeners ───────────────────────────────────────────

export function subscribeToProcessDefinition(
  processId: string,
  callback: (data: (ProcessDefinition & { id: string }) | null) => void,
) {
  return subscribeToDocument<ProcessDefinition>(
    COLLECTION,
    processId,
    callback,
  );
}

export function subscribeToProcessDefinitions(
  callback: (data: (ProcessDefinition & { id: string })[]) => void,
  orgId?: string,
) {
  const constraints = orgId ? [where("orgId", "==", orgId)] : [];
  return subscribeToCollection<ProcessDefinition>(
    COLLECTION,
    callback,
    ...constraints,
    orderBy("updatedAt", "desc"),
  );
}

// ─── Seed data ─────────────────────────────────────────────────────

export async function seedExampleProcesses(createdBy: string) {
  const exampleProcesses: CreateProcessInput[] = [
    {
      name: "Kundehenvendelse",
      description:
        "Automatisert håndtering av innkommende kundehenvendelser via e-post.",
      status: "published",
      createdBy,
      nodes: [
        {
          id: "start-1",
          type: "startEvent",
          label: "Motta henvendelse",
          position: { x: 100, y: 200 },
          metadata: {},
        },
        {
          id: "service-1",
          type: "serviceTask",
          label: "Klassifiser henvendelse",
          position: { x: 300, y: 200 },
          agentConfig: {
            autonomyLevel: 3,
            llmPrompt:
              "Klassifiser denne kundehenvendelsen etter type og prioritet.",
            tools: ["email-reader", "classifier"],
            maxIterations: 5,
            timeout: 15000,
            humanApprovalRequired: false,
          },
          metadata: {},
        },
        {
          id: "gateway-1",
          type: "exclusiveGateway",
          label: "Prioritet?",
          position: { x: 500, y: 200 },
          metadata: {},
        },
        {
          id: "user-1",
          type: "userTask",
          label: "Manuell behandling",
          position: { x: 700, y: 100 },
          metadata: {},
        },
        {
          id: "service-2",
          type: "serviceTask",
          label: "Auto-svar",
          position: { x: 700, y: 300 },
          agentConfig: {
            autonomyLevel: 4,
            llmPrompt: "Generer et passende svar basert på henvendelsestype.",
            tools: ["email-sender", "template-engine"],
            maxIterations: 3,
            timeout: 20000,
            humanApprovalRequired: false,
          },
          metadata: {},
        },
        {
          id: "end-1",
          type: "endEvent",
          label: "Ferdig",
          position: { x: 900, y: 200 },
          metadata: {},
        },
      ],
      edges: [
        { id: "e-1", source: "start-1", target: "service-1" },
        { id: "e-2", source: "service-1", target: "gateway-1" },
        {
          id: "e-3",
          source: "gateway-1",
          target: "user-1",
          condition: "priority === 'high'",
          label: "Høy prioritet",
        },
        {
          id: "e-4",
          source: "gateway-1",
          target: "service-2",
          condition: "priority !== 'high'",
          label: "Normal",
        },
        { id: "e-5", source: "user-1", target: "end-1" },
        { id: "e-6", source: "service-2", target: "end-1" },
      ],
      tags: ["kundeservice", "e-post", "auto-svar"],
      isTemplate: true,
    },
    {
      name: "Fakturakontroll",
      description:
        "Automatisk kontroll og godkjenning av innkommende fakturaer.",
      status: "draft",
      createdBy,
      nodes: [
        {
          id: "start-1",
          type: "startEvent",
          label: "Motta faktura",
          position: { x: 100, y: 200 },
          metadata: {},
        },
        {
          id: "service-1",
          type: "serviceTask",
          label: "OCR-lesing",
          position: { x: 300, y: 200 },
          agentConfig: {
            autonomyLevel: 5,
            llmPrompt: "Ekstraher fakturadata fra dokumentet.",
            tools: ["ocr-reader"],
            maxIterations: 3,
            timeout: 30000,
            humanApprovalRequired: false,
          },
          metadata: {},
        },
        {
          id: "service-2",
          type: "serviceTask",
          label: "Valider beløp",
          position: { x: 500, y: 200 },
          agentConfig: {
            autonomyLevel: 2,
            llmPrompt:
              "Kontroller at fakturabeløpet stemmer overens med avtale.",
            tools: ["contract-lookup"],
            maxIterations: 5,
            timeout: 15000,
            humanApprovalRequired: false,
          },
          metadata: {},
        },
        {
          id: "end-1",
          type: "endEvent",
          label: "Ferdig",
          position: { x: 700, y: 200 },
          metadata: {},
        },
      ],
      edges: [
        { id: "e-1", source: "start-1", target: "service-1" },
        { id: "e-2", source: "service-1", target: "service-2" },
        { id: "e-3", source: "service-2", target: "end-1" },
      ],
      tags: ["faktura", "økonomi", "OCR"],
      isTemplate: false,
    },
  ];

  const ids: string[] = [];
  for (const process of exampleProcesses) {
    const id = await createProcessDefinition(process);
    ids.push(id);
  }
  return ids;
}
