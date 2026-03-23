/** Standard BPMN-nodefarger */
export const NODE_COLORS = {
  startEvent: "#22c55e",    // grønn
  endEvent: "#ef4444",      // rød
  serviceTask: "#3b82f6",   // blå (autonom agent)
  userTask: "#10b981",      // grønn (human-in-the-loop)
  exclusiveGateway: "#f59e0b", // gul
  parallelGateway: "#f59e0b",  // gul
  timerEvent: "#8b5cf6",    // lilla
  errorEvent: "#ef4444",    // rød
} as const;

/** Autonominivå-labels */
export const AUTONOMY_LABELS = [
  "Kun forslag",
  "Utfør med logging",
  "Utfør med varsling",
  "Full autonom (budsjett)",
  "Full autonom",
] as const;

/** Standard layout-retning */
export const DEFAULT_LAYOUT_DIRECTION = "LR" as const;
