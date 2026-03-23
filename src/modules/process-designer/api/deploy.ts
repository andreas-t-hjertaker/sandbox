import {
  getCollection,
  getDocument,
  addDocument,
  updateDocument,
  subscribeToCollection,
  subscribeToDocument,
} from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import type {
  DeployConfig,
  DeployStatus,
  ProcessInstance,
  InstanceStatus,
} from "../types";

// ─── Collection paths ──────────────────────────────────────────────

const PROCESS_COLLECTION = "processDefinitions";
const instancesPath = (processId: string) =>
  `${PROCESS_COLLECTION}/${processId}/instances`;

// ─── Deploy operations ─────────────────────────────────────────────

export async function deployProcess(config: DeployConfig) {
  const ref = await addDocument(instancesPath(config.processId), {
    ...config,
    status: "pending" as DeployStatus,
  });
  return ref.id;
}

export async function updateDeployStatus(
  processId: string,
  instanceId: string,
  status: DeployStatus,
) {
  return updateDocument(instancesPath(processId), instanceId, { status });
}

export async function pauseInstance(processId: string, instanceId: string) {
  return updateDocument(instancesPath(processId), instanceId, {
    status: "paused" as InstanceStatus,
  });
}

export async function resumeInstance(processId: string, instanceId: string) {
  return updateDocument(instancesPath(processId), instanceId, {
    status: "running" as InstanceStatus,
  });
}

export async function cancelInstance(processId: string, instanceId: string) {
  return updateDocument(instancesPath(processId), instanceId, {
    status: "cancelled" as InstanceStatus,
  });
}

// ─── Read instances ────────────────────────────────────────────────

export async function getInstance(processId: string, instanceId: string) {
  return getDocument<ProcessInstance>(instancesPath(processId), instanceId);
}

export async function getInstances(processId: string) {
  return getCollection<ProcessInstance>(
    instancesPath(processId),
    orderBy("startedAt", "desc"),
  );
}

export async function getInstancesByStatus(
  processId: string,
  status: InstanceStatus,
) {
  return getCollection<ProcessInstance>(
    instancesPath(processId),
    where("status", "==", status),
    orderBy("startedAt", "desc"),
  );
}

export async function getActiveInstances(processId: string) {
  return getInstancesByStatus(processId, "running");
}

// ─── Create instance ───────────────────────────────────────────────

export type CreateInstanceInput = Omit<
  ProcessInstance,
  "id" | "startedAt" | "completedAt" | "output" | "status"
>;

export async function createInstance(data: CreateInstanceInput) {
  const ref = await addDocument(instancesPath(data.processId), {
    ...data,
    status: "running" as InstanceStatus,
    output: {},
    currentNodeIds: data.currentNodeIds ?? [],
  });
  return ref.id;
}

export async function completeInstance(
  processId: string,
  instanceId: string,
  output: Record<string, unknown>,
) {
  return updateDocument(instancesPath(processId), instanceId, {
    status: "completed" as InstanceStatus,
    output,
  });
}

export async function failInstance(
  processId: string,
  instanceId: string,
  error: string,
) {
  return updateDocument(instancesPath(processId), instanceId, {
    status: "failed" as InstanceStatus,
    error,
  });
}

// ─── Real-time listeners ───────────────────────────────────────────

export function subscribeToInstances(
  processId: string,
  callback: (instances: (ProcessInstance & { id: string })[]) => void,
) {
  return subscribeToCollection<ProcessInstance>(
    instancesPath(processId),
    callback,
    orderBy("startedAt", "desc"),
  );
}

export function subscribeToInstance(
  processId: string,
  instanceId: string,
  callback: (instance: (ProcessInstance & { id: string }) | null) => void,
) {
  return subscribeToDocument<ProcessInstance>(
    instancesPath(processId),
    instanceId,
    callback,
  );
}
