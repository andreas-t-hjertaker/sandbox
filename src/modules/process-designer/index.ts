// ─── Process Designer Module ─────────────────────────────────────────
// Public API for the Process Agent Designer module.
// Import everything from this file: `@modules/process-designer`

// Types
export * from "./types";

// Constants
export * from "./constants";

// Library utilities
export * from "./lib";

// Store
export { ProcessDesignerProvider, useProcessDesignerContext } from "./store/process-store";

// Hooks
export {
  useProcessDesigner,
  useChat,
  useCanvas,
  useValidation,
  useAutoLayout,
  useKeyboardShortcuts,
} from "./hooks";

// Layout
export { DesignerLayout } from "./components/layout";

// Chat components
export { ChatPanel } from "./components/chat";

// Canvas components
export { ProcessCanvas } from "./components/canvas/process-canvas";
export { CanvasToolbar } from "./components/canvas/canvas-toolbar";
export { nodeTypes } from "./components/canvas/bpmn-nodes";

// Properties panel
export { PropertiesPanel } from "./components/properties";

// MCP Library
export { MCPLibraryPanel } from "./components/mcp-library";

// Validation
export { ValidationPanel } from "./components/validation";

// Deploy
export { DeployPanel } from "./components/deploy";

// Dashboard
export { ProcessDashboard } from "./components/dashboard";

// Templates
export { TemplateGallery } from "./components/templates";

// Export/Import
export { ExportPanel } from "./components/export";

// Collaboration
export { CollaborationOverlay } from "./components/collaboration";

// Autonomy
export { AutonomyConfig } from "./components/autonomy";

// Audit
export { AuditLogViewer } from "./components/audit";

// DLQ
export { DLQPanel } from "./components/dlq";

// Domain Rules
export { DomainRulesEditor } from "./components/domain-rules";

// Versioning
export { VersionDiff } from "./components/versioning";

// Agentification
export { AgentifyOverlay } from "./components/agentify";
