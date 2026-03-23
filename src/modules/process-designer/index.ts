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
} from "./types/process-types";

// Konstanter
export { NODE_COLORS, AUTONOMY_LABELS, DEFAULT_LAYOUT_DIRECTION } from "./constants";
