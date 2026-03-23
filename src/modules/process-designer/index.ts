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
export { bpmnNodeTypes, TaskNode, EventNode, GatewayNode } from "./components/bpmn-nodes";
export { PropertiesPanel } from "./components/properties-panel";
export { MCPLibrary } from "./components/mcp-library";
export { MCPNodeConfig } from "./components/mcp-node-config";
export { ProcessStatusDashboard } from "./components/process-status-dashboard";

// Hooks
export { useStreamingProcess } from "./hooks/use-streaming-process";

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

// BPMN Validering
export { validateProcess } from "./lib/bpmn-validator";
export type { ValidationResult, ValidationIssue, ValidationSeverity } from "./lib/bpmn-validator";

// Auto-layout
export { autoLayout, layoutNewNodes } from "./lib/auto-layout";

// Agentifisering
export { generateAgentifySuggestions, applyAgentifySuggestions } from "./lib/agentify";
export type { AgentifySuggestion, RiskLevel } from "./lib/agentify";

// Deploy
export { generateExecutableProcess } from "./lib/process-deploy";
export type { ExecutableProcess, DeployResult } from "./lib/process-deploy";

// Eksport/Import
export { exportToBPMNXML, importFromBPMNXML, exportToJSON, importFromJSON, downloadFile, copyToClipboard } from "./lib/process-export";

// Maler
export { getTemplates, cloneTemplate, getTemplateCategories, PROCESS_TEMPLATES } from "./lib/process-templates";
export type { ProcessTemplate } from "./lib/process-templates";

// Versjonering
export { diffVersions, isSignificantChange } from "./lib/process-versioning";

// Autonomi
export { requiresEscalation, defaultAutonomyForRisk, AUTONOMY_DESCRIPTIONS } from "./lib/autonomy";

// Audit Trail
export { logAuditEntry, getAuditLog, exportAuditToCSV } from "./lib/audit-trail";

// Dead Letter Queue
export { addToDLQ, getDLQEntries, retryDLQEntry, escalateDLQEntry, resolveDLQEntry } from "./lib/dead-letter-queue";

// Domeneregler
export { getEffectiveRules, saveRules, rulesToPromptSection } from "./lib/process-rules";

// Telemetri
export { trackLLMCall, trackAgentRun, startTelemetry, aggregateProcessMetrics } from "./lib/telemetry";

// Idempotens
export { executeIdempotent, generateIdempotencyKey } from "./lib/idempotent-handler";

// Konstanter
export { NODE_COLORS, AUTONOMY_LABELS, DEFAULT_LAYOUT_DIRECTION } from "./constants";
