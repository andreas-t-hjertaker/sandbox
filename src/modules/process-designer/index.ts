/**
 * Process Designer — modul for BPMN-prosessdesign med AI-agentifisering
 *
 * Public API for modulen. Alle konsumenter importerer herfra.
 */

// Typer
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
} from "./types";

// Zod-skjemaer
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
} from "./types";

// Komponenter
export { SplitViewLayout } from "./components/split-view-layout";

// Konstanter
export { NODE_COLORS, AUTONOMY_LABELS, DEFAULT_LAYOUT_DIRECTION } from "./constants";
