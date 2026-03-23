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
export { DesignerChat } from "./components/designer-chat";
export { BPMNCanvas, toReactFlowNodes, toReactFlowEdges, fromReactFlowNodes } from "./components/bpmn-canvas";

// LLM Orchestrator
export {
  buildDesignerSystemPrompt,
  parseLLMResponse,
  applyLLMResponse,
  detectPhase,
  PHASE_LABELS,
  LLMResponseSchema,
} from "./lib/llm-orchestrator";
export type { ConversationPhase, LLMResponse } from "./lib/llm-orchestrator";

// Konstanter
export { NODE_COLORS, AUTONOMY_LABELS, DEFAULT_LAYOUT_DIRECTION } from "./constants";
