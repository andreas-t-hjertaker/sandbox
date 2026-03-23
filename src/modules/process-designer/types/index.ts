// TypeScript-typer
export type {
  BPMNNodeType,
  ProcessNode,
  ProcessEdge,
  AgentConfig,
  MCPToolConfig,
  ProcessDefinition,
  ProcessPatch,
  ProcessMetadata,
  Position,
  AutonomyLevel,
} from "./process-types";

// Zod-skjemaer for runtime-validering
export {
  BPMNNodeTypeSchema,
  PositionSchema,
  AutonomyLevelSchema,
  AgentConfigSchema,
  MCPToolConfigSchema,
  ProcessNodeSchema,
  ProcessEdgeSchema,
  ProcessMetadataSchema,
  ProcessDefinitionSchema,
  ProcessPatchSchema,
  ProcessPatchArraySchema,
} from "./schemas";
