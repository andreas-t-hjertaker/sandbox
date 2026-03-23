import { z } from "zod";

// ─── BPMN Node Types ────────────────────────────────────────────────
export const BPMNNodeTypes = [
  "startEvent",
  "endEvent",
  "serviceTask",
  "userTask",
  "exclusiveGateway",
  "parallelGateway",
  "timerEvent",
  "errorEvent",
] as const;

export type BPMNNodeType = (typeof BPMNNodeTypes)[number];

// ─── Autonomy Levels ────────────────────────────────────────────────
export const AutonomyLevels = [1, 2, 3, 4, 5] as const;
export type AutonomyLevel = (typeof AutonomyLevels)[number];

export const AutonomyLevelLabels: Record<AutonomyLevel, string> = {
  1: "Kun forslag",
  2: "Utfør med logging",
  3: "Utfør med varsling",
  4: "Full autonom med spending cap",
  5: "Full autonom",
};

// ─── Agent Config ───────────────────────────────────────────────────
export const AgentConfigSchema = z.object({
  autonomyLevel: z.number().min(1).max(5) as z.ZodType<AutonomyLevel>,
  llmPrompt: z.string().min(1),
  tools: z.array(z.string()),
  maxIterations: z.number().int().positive().default(10),
  timeout: z.number().int().positive().default(30000),
  humanApprovalRequired: z.boolean().default(false),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// ─── MCP Tool Config ────────────────────────────────────────────────
export const MCPAuthConfigSchema = z.object({
  type: z.enum(["apiKey", "oauth", "bearer", "none"]),
  credentials: z.record(z.string(), z.string()).optional(),
});

export type MCPAuthConfig = z.infer<typeof MCPAuthConfigSchema>;

export const MCPToolConfigSchema = z.object({
  serverId: z.string().min(1),
  toolName: z.string().min(1),
  parameters: z.record(z.string(), z.unknown()).default({}),
  authConfig: MCPAuthConfigSchema.optional(),
});

export type MCPToolConfig = z.infer<typeof MCPToolConfigSchema>;

// ─── Position ───────────────────────────────────────────────────────
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type Position = z.infer<typeof PositionSchema>;

// ─── Process Node ───────────────────────────────────────────────────
export const ProcessNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(BPMNNodeTypes),
  label: z.string().min(1),
  position: PositionSchema,
  agentConfig: AgentConfigSchema.optional(),
  mcpConfig: MCPToolConfigSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type ProcessNode = z.infer<typeof ProcessNodeSchema>;

// ─── Process Edge ───────────────────────────────────────────────────
export const ProcessEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  condition: z.string().optional(),
  label: z.string().optional(),
});

export type ProcessEdge = z.infer<typeof ProcessEdgeSchema>;

// ─── Process Status ─────────────────────────────────────────────────
export const ProcessStatuses = [
  "draft",
  "published",
  "archived",
] as const;

export type ProcessStatus = (typeof ProcessStatuses)[number];

// ─── Process Definition ─────────────────────────────────────────────
export const ProcessDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  version: z.number().int().positive().default(1),
  status: z.enum(ProcessStatuses).default("draft"),
  createdBy: z.string().min(1),
  orgId: z.string().optional(),
  nodes: z.array(ProcessNodeSchema),
  edges: z.array(ProcessEdgeSchema),
  domainRules: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isTemplate: z.boolean().default(false),
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
});

export type ProcessDefinition = z.infer<typeof ProcessDefinitionSchema>;

// ─── Process Patch (JSON Patch RFC 6902) ────────────────────────────
export const PatchOperationSchema = z.object({
  op: z.enum(["add", "remove", "replace", "move", "copy", "test"]),
  path: z.string(),
  value: z.unknown().optional(),
  from: z.string().optional(),
});

export type PatchOperation = z.infer<typeof PatchOperationSchema>;

export const ProcessPatchSchema = z.array(PatchOperationSchema);
export type ProcessPatch = z.infer<typeof ProcessPatchSchema>;

// ─── Chat Phase ─────────────────────────────────────────────────────
export const ChatPhases = [
  "kartlegging",
  "strukturering",
  "agentifisering",
  "validering",
] as const;

export type ChatPhase = (typeof ChatPhases)[number];

export const ChatPhaseLabels: Record<ChatPhase, string> = {
  kartlegging: "Kartlegging",
  strukturering: "Strukturering",
  agentifisering: "Agentifisering",
  validering: "Validering",
};

// ─── Chat Message ───────────────────────────────────────────────────
export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  phase: z.enum(ChatPhases).optional(),
  patches: ProcessPatchSchema.optional(),
  suggestions: z.array(z.string()).optional(),
  timestamp: z.unknown(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ─── MCP Server Definition ──────────────────────────────────────────
export const MCPTransportTypes = ["stdio", "sse", "streamable-http"] as const;
export type MCPTransport = (typeof MCPTransportTypes)[number];

export const MCPServerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().default(""),
  url: z.string().url(),
  transport: z.enum(MCPTransportTypes),
  tools: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      inputSchema: z.record(z.string(), z.unknown()).optional(),
    })
  ),
  authType: z.enum(["apiKey", "oauth", "bearer", "none"]),
  status: z.enum(["active", "inactive", "error"]),
  icon: z.string().optional(),
});

export type MCPServer = z.infer<typeof MCPServerSchema>;

// ─── Validation ─────────────────────────────────────────────────────
export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  nodeId?: string;
  edgeId?: string;
  fix?: string;
}

// ─── Deploy ─────────────────────────────────────────────────────────
export const DeployStatuses = [
  "pending",
  "deploying",
  "active",
  "paused",
  "stopped",
  "failed",
] as const;

export type DeployStatus = (typeof DeployStatuses)[number];

export interface DeployConfig {
  processId: string;
  version: number;
  environment: "staging" | "production";
  triggers: ProcessTrigger[];
  deployedAt?: unknown;
  deployedBy?: string;
  status: DeployStatus;
}

export interface ProcessTrigger {
  type: "manual" | "schedule" | "firestore" | "webhook";
  config: Record<string, unknown>;
}

// ─── Process Instance (Runtime) ─────────────────────────────────────
export const InstanceStatuses = [
  "running",
  "completed",
  "failed",
  "paused",
  "cancelled",
] as const;

export type InstanceStatus = (typeof InstanceStatuses)[number];

export interface ProcessInstance {
  id: string;
  processId: string;
  version: number;
  status: InstanceStatus;
  currentNodeIds: string[];
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  startedAt: unknown;
  completedAt?: unknown;
  error?: string;
}

// ─── Audit Log ──────────────────────────────────────────────────────
export interface AuditLogEntry {
  id: string;
  instanceId: string;
  nodeId: string;
  actor: { type: "user" | "agent"; id: string };
  action: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  reasoning?: string;
  autonomyLevel?: AutonomyLevel;
  timestamp: unknown;
}

// ─── Dead Letter Queue ──────────────────────────────────────────────
export interface DLQEntry {
  id: string;
  instanceId: string;
  nodeId: string;
  error: string;
  stackTrace?: string;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: unknown;
  createdAt: unknown;
  resolvedAt?: unknown;
  resolvedBy?: string;
  status: "pending" | "retrying" | "resolved" | "escalated";
}

// ─── Telemetry ──────────────────────────────────────────────────────
export interface TelemetrySpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  instanceId: string;
  nodeId?: string;
  startTime: unknown;
  endTime?: unknown;
  attributes: Record<string, unknown>;
  tokenUsage?: { prompt: number; completion: number; total: number };
  cost?: number;
}

// ─── Process Template ───────────────────────────────────────────────
export interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  definition: Omit<ProcessDefinition, "id" | "createdBy" | "createdAt" | "updatedAt">;
  usageCount: number;
  createdBy: string;
  createdAt: unknown;
}

// ─── Agentification Suggestion ──────────────────────────────────────
export interface AgentifySuggestion {
  nodeId: string;
  recommendedAutonomy: AutonomyLevel;
  suggestedTools: string[];
  promptDraft: string;
  riskLevel: "low" | "medium" | "high";
  explanation: string;
  accepted?: boolean;
}
