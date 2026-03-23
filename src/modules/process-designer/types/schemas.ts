/**
 * Zod-skjemaer for runtime-validering av BPMN og agentmodell-typer.
 *
 * Bruker Zod v4 (frontend). Disse skjemaene validerer data fra LLM,
 * Firestore og brukerinput.
 */

import { z } from "zod";

/** Alle støttede BPMN-nodetyper */
export const BPMNNodeTypeSchema = z.enum([
  "startEvent",
  "endEvent",
  "serviceTask",
  "userTask",
  "exclusiveGateway",
  "parallelGateway",
  "timerEvent",
  "errorEvent",
]);

/** Posisjon på canvas */
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

/** Autonominivå 1-5 */
export const AutonomyLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

/** Konfigurasjon for en AI-agent */
export const AgentConfigSchema = z.object({
  autonomyLevel: AutonomyLevelSchema,
  llmPrompt: z.string().min(1),
  tools: z.array(z.string()),
  maxIterations: z.number().int().positive().default(10),
  timeout: z.number().int().positive().default(30000),
  humanApprovalRequired: z.boolean().default(false),
});

/** MCP-verktøykonfigurasjon */
export const MCPToolConfigSchema = z.object({
  serverId: z.string().min(1),
  toolName: z.string().min(1),
  parameters: z.record(z.unknown()),
  authConfig: z
    .object({
      type: z.enum(["api-key", "oauth", "bearer"]),
      secretRef: z.string().min(1),
    })
    .optional(),
});

/** En BPMN-node */
export const ProcessNodeSchema = z.object({
  id: z.string().min(1),
  type: BPMNNodeTypeSchema,
  label: z.string().min(1),
  position: PositionSchema,
  agentConfig: AgentConfigSchema.optional(),
  mcpConfig: MCPToolConfigSchema.optional(),
  metadata: z.record(z.unknown()).default({}),
});

/** En kant mellom noder */
export const ProcessEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  condition: z.string().optional(),
  label: z.string().optional(),
});

/** Metadata for prosessdefinisjon */
export const ProcessMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  version: z.number().int().nonnegative(),
  status: z.enum(["draft", "published", "archived"]),
  createdBy: z.string().min(1),
  orgId: z.string().min(1),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/** Komplett prosessdefinisjon */
export const ProcessDefinitionSchema = z.object({
  id: z.string().min(1),
  metadata: ProcessMetadataSchema,
  nodes: z.array(ProcessNodeSchema),
  edges: z.array(ProcessEdgeSchema),
});

/** JSON Patch (RFC 6902) */
export const ProcessPatchSchema = z.object({
  op: z.enum(["add", "remove", "replace", "move", "copy", "test"]),
  path: z.string().min(1),
  value: z.unknown().optional(),
  from: z.string().optional(),
});

/** Array av patches for inkrementelle oppdateringer */
export const ProcessPatchArraySchema = z.array(ProcessPatchSchema);
