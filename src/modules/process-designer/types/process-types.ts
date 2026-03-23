/**
 * TypeScript-typesystem for BPMN 2.0 tilpasset agentisk utførelse.
 *
 * Disse typene representerer prosessdefinisjoner som kan designes visuelt
 * og deployes som AI-agent-pipelines.
 */

/** Alle støttede BPMN-nodetyper */
export type BPMNNodeType =
  | "startEvent"
  | "endEvent"
  | "serviceTask"
  | "userTask"
  | "exclusiveGateway"
  | "parallelGateway"
  | "timerEvent"
  | "errorEvent";

/** Posisjon på canvas */
export type Position = {
  x: number;
  y: number;
};

/** Autonominivå 1-5 */
export type AutonomyLevel = 1 | 2 | 3 | 4 | 5;

/** Konfigurasjon for en AI-agent tilknyttet en node */
export type AgentConfig = {
  autonomyLevel: AutonomyLevel;
  llmPrompt: string;
  tools: string[];
  maxIterations: number;
  timeout: number;
  humanApprovalRequired: boolean;
};

/** MCP-verktøykonfigurasjon for en node */
export type MCPToolConfig = {
  serverId: string;
  toolName: string;
  parameters: Record<string, unknown>;
  authConfig?: {
    type: "api-key" | "oauth" | "bearer";
    secretRef: string;
  };
};

/** En node i prosessdefinisjonen */
export type ProcessNode = {
  id: string;
  type: BPMNNodeType;
  label: string;
  position: Position;
  agentConfig?: AgentConfig;
  mcpConfig?: MCPToolConfig;
  metadata: Record<string, unknown>;
};

/** En kant (forbindelse) mellom to noder */
export type ProcessEdge = {
  id: string;
  source: string;
  target: string;
  condition?: string;
  label?: string;
};

/** Metadata for en prosessdefinisjon */
export type ProcessMetadata = {
  name: string;
  description: string;
  version: number;
  status: "draft" | "published" | "archived";
  createdBy: string;
  orgId: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Komplett prosessdefinisjon */
export type ProcessDefinition = {
  id: string;
  metadata: ProcessMetadata;
  nodes: ProcessNode[];
  edges: ProcessEdge[];
};

/** JSON Patch (RFC 6902) for inkrementelle oppdateringer */
export type ProcessPatch = {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
};
