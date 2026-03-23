/**
 * Firestore CRUD-operasjoner for prosessdefinisjoner.
 *
 * Collection: processDefinitions/{processId}
 * Subcollections: versions/{versionId}, nodes/{nodeId}, edges/{edgeId}
 */

import {
  addDocument,
  getDocument,
  getCollection,
  updateDocument,
  deleteDocument,
  subscribeToDocument,
  subscribeToCollection,
  where,
  orderBy,
} from "@/lib/firebase/firestore";
import type {
  ProcessDefinition,
  ProcessNode,
  ProcessEdge,
  ProcessMetadata,
} from "../types";

const COLLECTION = "processDefinitions";

/** Firestore-dokumentstruktur for prosessdefinisjon */
type ProcessDefinitionDoc = Omit<ProcessMetadata, "createdAt" | "updatedAt"> & {
  bpmnData: {
    nodes: ProcessNode[];
    edges: ProcessEdge[];
  };
};

// --- CRUD for prosessdefinisjoner ---

export async function createProcessDefinition(
  metadata: Omit<ProcessMetadata, "createdAt" | "updatedAt" | "version">,
  nodes: ProcessNode[] = [],
  edges: ProcessEdge[] = []
) {
  const data: Omit<ProcessDefinitionDoc, "createdAt" | "updatedAt"> = {
    ...metadata,
    version: 1,
    bpmnData: { nodes, edges },
  };
  return addDocument(COLLECTION, data);
}

export async function getProcessDefinition(id: string) {
  return getDocument<ProcessDefinitionDoc>(COLLECTION, id);
}

export async function listProcessDefinitions(orgId: string) {
  return getCollection<ProcessDefinitionDoc>(
    COLLECTION,
    where("orgId", "==", orgId),
    orderBy("updatedAt", "desc")
  );
}

export async function updateProcessDefinition(
  id: string,
  data: Partial<ProcessDefinitionDoc>
) {
  return updateDocument(COLLECTION, id, data);
}

export async function deleteProcessDefinition(id: string) {
  return deleteDocument(COLLECTION, id);
}

// --- Sanntidslyttere ---

export function subscribeToProcessDefinition(
  id: string,
  callback: (data: (ProcessDefinitionDoc & { id: string }) | null) => void
) {
  return subscribeToDocument<ProcessDefinitionDoc>(COLLECTION, id, callback);
}

export function subscribeToProcessDefinitions(
  orgId: string,
  callback: (data: (ProcessDefinitionDoc & { id: string })[]) => void
) {
  return subscribeToCollection<ProcessDefinitionDoc>(
    COLLECTION,
    callback,
    where("orgId", "==", orgId),
    orderBy("updatedAt", "desc")
  );
}

// --- Versjonering ---

export async function createVersion(
  processId: string,
  snapshot: { nodes: ProcessNode[]; edges: ProcessEdge[] },
  comment?: string
) {
  const versionPath = `${COLLECTION}/${processId}/versions`;
  return addDocument(versionPath, {
    bpmnData: snapshot,
    comment: comment || "",
  });
}

export async function listVersions(processId: string) {
  const versionPath = `${COLLECTION}/${processId}/versions`;
  return getCollection(versionPath, orderBy("createdAt", "desc"));
}

// --- Seed-data ---

export const SEED_PROCESSES: Omit<ProcessDefinition, "id">[] = [
  {
    metadata: {
      name: "Fakturamottak",
      description: "Automatisk mottak og kontering av inngående fakturaer",
      version: 1,
      status: "draft",
      createdBy: "seed",
      orgId: "demo-org",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    nodes: [
      { id: "start", type: "startEvent", label: "Faktura mottatt", position: { x: 0, y: 100 }, metadata: {} },
      { id: "scan", type: "serviceTask", label: "OCR-skanning", position: { x: 200, y: 100 }, metadata: {},
        agentConfig: { autonomyLevel: 5, llmPrompt: "Ekstraher data fra faktura", tools: ["ocr"], maxIterations: 3, timeout: 30000, humanApprovalRequired: false } },
      { id: "check", type: "exclusiveGateway", label: "Beløp > 100k?", position: { x: 400, y: 100 }, metadata: {} },
      { id: "approve", type: "userTask", label: "Manuell godkjenning", position: { x: 600, y: 0 }, metadata: {} },
      { id: "book", type: "serviceTask", label: "Kontér faktura", position: { x: 600, y: 200 }, metadata: {},
        agentConfig: { autonomyLevel: 3, llmPrompt: "Kontér faktura basert på leverandør og kategori", tools: ["tripletex"], maxIterations: 5, timeout: 60000, humanApprovalRequired: false } },
      { id: "end", type: "endEvent", label: "Ferdig", position: { x: 800, y: 100 }, metadata: {} },
    ],
    edges: [
      { id: "e1", source: "start", target: "scan" },
      { id: "e2", source: "scan", target: "check" },
      { id: "e3", source: "check", target: "approve", condition: "amount > 100000", label: "Ja" },
      { id: "e4", source: "check", target: "book", condition: "amount <= 100000", label: "Nei" },
      { id: "e5", source: "approve", target: "book" },
      { id: "e6", source: "book", target: "end" },
    ],
  },
  {
    metadata: {
      name: "Månedsavslutning",
      description: "Automatisert månedsavslutning med avstemming og rapportering",
      version: 1,
      status: "draft",
      createdBy: "seed",
      orgId: "demo-org",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    nodes: [
      { id: "start", type: "timerEvent", label: "Siste virkedag", position: { x: 0, y: 100 }, metadata: {} },
      { id: "reconcile", type: "serviceTask", label: "Bankavstemminger", position: { x: 200, y: 100 }, metadata: {},
        agentConfig: { autonomyLevel: 4, llmPrompt: "Avstem banktransaksjoner mot bokførte poster", tools: ["bank-api", "tripletex"], maxIterations: 10, timeout: 120000, humanApprovalRequired: false } },
      { id: "parallel-start", type: "parallelGateway", label: "Parallelle oppgaver", position: { x: 400, y: 100 }, metadata: {} },
      { id: "mva", type: "serviceTask", label: "MVA-beregning", position: { x: 600, y: 0 }, metadata: {} },
      { id: "payroll", type: "serviceTask", label: "Lønnsjustering", position: { x: 600, y: 200 }, metadata: {} },
      { id: "parallel-end", type: "parallelGateway", label: "Samle", position: { x: 800, y: 100 }, metadata: {} },
      { id: "report", type: "serviceTask", label: "Generer rapport", position: { x: 1000, y: 100 }, metadata: {} },
      { id: "review", type: "userTask", label: "Revisor gjennomgang", position: { x: 1200, y: 100 }, metadata: {} },
      { id: "end", type: "endEvent", label: "Måned avsluttet", position: { x: 1400, y: 100 }, metadata: {} },
    ],
    edges: [
      { id: "e1", source: "start", target: "reconcile" },
      { id: "e2", source: "reconcile", target: "parallel-start" },
      { id: "e3", source: "parallel-start", target: "mva" },
      { id: "e4", source: "parallel-start", target: "payroll" },
      { id: "e5", source: "mva", target: "parallel-end" },
      { id: "e6", source: "payroll", target: "parallel-end" },
      { id: "e7", source: "parallel-end", target: "report" },
      { id: "e8", source: "report", target: "review" },
      { id: "e9", source: "review", target: "end" },
    ],
  },
];
