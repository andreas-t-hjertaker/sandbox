import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
  useCallback,
  useMemo,
  createElement,
} from "react";
import type {
  ProcessDefinition,
  ProcessNode,
  ProcessEdge,
  ChatPhase,
  ChatMessage,
  ValidationResult,
  DeployStatus,
  PatchOperation,
} from "../types";

// ─── UI State ────────────────────────────────────────────────────────
export interface UIState {
  chatPanelSize: number;
  canvasPanelSize: number;
  propertiesPanelSize: number;
  isFullscreen: boolean;
  isPropertiesPanelOpen: boolean;
  isChatPanelOpen: boolean;
}

const defaultUIState: UIState = {
  chatPanelSize: 25,
  canvasPanelSize: 50,
  propertiesPanelSize: 25,
  isFullscreen: false,
  isPropertiesPanelOpen: true,
  isChatPanelOpen: true,
};

// ─── Process Designer State ──────────────────────────────────────────
export interface ProcessDesignerState {
  process: ProcessDefinition | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  chatPhase: ChatPhase;
  chatMessages: ChatMessage[];
  isChatStreaming: boolean;
  validationResult: ValidationResult | null;
  deployStatus: DeployStatus | null;
  ui: UIState;
  undoStack: ProcessDefinition[];
  redoStack: ProcessDefinition[];
  isDirty: boolean;
}

export const initialState: ProcessDesignerState = {
  process: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  chatPhase: "kartlegging",
  chatMessages: [],
  isChatStreaming: false,
  validationResult: null,
  deployStatus: null,
  ui: defaultUIState,
  undoStack: [],
  redoStack: [],
  isDirty: false,
};

// ─── Actions ─────────────────────────────────────────────────────────
export type ProcessDesignerAction =
  | { type: "SET_PROCESS"; payload: ProcessDefinition }
  | { type: "UPDATE_PROCESS"; payload: Partial<ProcessDefinition> }
  | { type: "APPLY_PATCHES"; payload: PatchOperation[] }
  | { type: "ADD_NODE"; payload: ProcessNode }
  | { type: "UPDATE_NODE"; payload: { id: string; changes: Partial<ProcessNode> } }
  | { type: "REMOVE_NODE"; payload: string }
  | { type: "ADD_EDGE"; payload: ProcessEdge }
  | { type: "UPDATE_EDGE"; payload: { id: string; changes: Partial<ProcessEdge> } }
  | { type: "REMOVE_EDGE"; payload: string }
  | { type: "SET_NODES"; payload: ProcessNode[] }
  | { type: "SET_EDGES"; payload: ProcessEdge[] }
  | { type: "SELECT_NODE"; payload: string | null }
  | { type: "SELECT_EDGE"; payload: string | null }
  | { type: "SET_CHAT_PHASE"; payload: ChatPhase }
  | { type: "ADD_CHAT_MESSAGE"; payload: ChatMessage }
  | { type: "UPDATE_CHAT_MESSAGE"; payload: { id: string; content: string } }
  | { type: "CLEAR_CHAT_MESSAGES" }
  | { type: "SET_CHAT_STREAMING"; payload: boolean }
  | { type: "SET_VALIDATION_RESULT"; payload: ValidationResult | null }
  | { type: "SET_DEPLOY_STATUS"; payload: DeployStatus | null }
  | { type: "SET_UI"; payload: Partial<UIState> }
  | { type: "TOGGLE_FULLSCREEN" }
  | { type: "TOGGLE_PROPERTIES_PANEL" }
  | { type: "TOGGLE_CHAT_PANEL" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET" };

// ─── Helpers ─────────────────────────────────────────────────────────
function pushUndo(
  state: ProcessDesignerState,
): Pick<ProcessDesignerState, "undoStack" | "redoStack"> {
  if (!state.process) return { undoStack: state.undoStack, redoStack: state.redoStack };
  return {
    undoStack: [...state.undoStack.slice(-49), state.process],
    redoStack: [],
  };
}

function applyPatches(
  process: ProcessDefinition,
  patches: PatchOperation[],
): ProcessDefinition {
  let result = structuredClone(process);
  for (const patch of patches) {
    const segments = patch.path.split("/").filter(Boolean);
    if (patch.op === "replace" || patch.op === "add") {
      let target: Record<string, unknown> = result as unknown as Record<string, unknown>;
      for (let i = 0; i < segments.length - 1; i++) {
        target = target[segments[i]] as Record<string, unknown>;
      }
      target[segments[segments.length - 1]] = patch.value;
    } else if (patch.op === "remove") {
      let target: Record<string, unknown> = result as unknown as Record<string, unknown>;
      for (let i = 0; i < segments.length - 1; i++) {
        target = target[segments[i]] as Record<string, unknown>;
      }
      const key = segments[segments.length - 1];
      if (Array.isArray(target)) {
        target.splice(Number(key), 1);
      } else {
        delete target[key];
      }
    }
  }
  return result;
}

// ─── Reducer ─────────────────────────────────────────────────────────
export function processDesignerReducer(
  state: ProcessDesignerState,
  action: ProcessDesignerAction,
): ProcessDesignerState {
  switch (action.type) {
    case "SET_PROCESS":
      return {
        ...state,
        process: action.payload,
        isDirty: false,
        undoStack: [],
        redoStack: [],
        validationResult: null,
      };

    case "UPDATE_PROCESS": {
      if (!state.process) return state;
      return {
        ...state,
        ...pushUndo(state),
        process: { ...state.process, ...action.payload },
        isDirty: true,
      };
    }

    case "APPLY_PATCHES": {
      if (!state.process) return state;
      return {
        ...state,
        ...pushUndo(state),
        process: applyPatches(state.process, action.payload),
        isDirty: true,
      };
    }

    case "ADD_NODE": {
      if (!state.process) return state;
      return {
        ...state,
        ...pushUndo(state),
        process: {
          ...state.process,
          nodes: [...state.process.nodes, action.payload],
        },
        isDirty: true,
      };
    }

    case "UPDATE_NODE": {
      if (!state.process) return state;
      return {
        ...state,
        ...pushUndo(state),
        process: {
          ...state.process,
          nodes: state.process.nodes.map((n) =>
            n.id === action.payload.id ? { ...n, ...action.payload.changes } : n,
          ),
        },
        isDirty: true,
      };
    }

    case "REMOVE_NODE": {
      if (!state.process) return state;
      return {
        ...state,
        ...pushUndo(state),
        process: {
          ...state.process,
          nodes: state.process.nodes.filter((n) => n.id !== action.payload),
          edges: state.process.edges.filter(
            (e) => e.source !== action.payload && e.target !== action.payload,
          ),
        },
        selectedNodeId:
          state.selectedNodeId === action.payload ? null : state.selectedNodeId,
        isDirty: true,
      };
    }

    case "ADD_EDGE": {
      if (!state.process) return state;
      return {
        ...state,
        ...pushUndo(state),
        process: {
          ...state.process,
          edges: [...state.process.edges, action.payload],
        },
        isDirty: true,
      };
    }

    case "UPDATE_EDGE": {
      if (!state.process) return state;
      return {
        ...state,
        ...pushUndo(state),
        process: {
          ...state.process,
          edges: state.process.edges.map((e) =>
            e.id === action.payload.id ? { ...e, ...action.payload.changes } : e,
          ),
        },
        isDirty: true,
      };
    }

    case "REMOVE_EDGE": {
      if (!state.process) return state;
      return {
        ...state,
        ...pushUndo(state),
        process: {
          ...state.process,
          edges: state.process.edges.filter((e) => e.id !== action.payload),
        },
        selectedEdgeId:
          state.selectedEdgeId === action.payload ? null : state.selectedEdgeId,
        isDirty: true,
      };
    }

    case "SET_NODES": {
      if (!state.process) return state;
      return {
        ...state,
        ...pushUndo(state),
        process: { ...state.process, nodes: action.payload },
        isDirty: true,
      };
    }

    case "SET_EDGES": {
      if (!state.process) return state;
      return {
        ...state,
        ...pushUndo(state),
        process: { ...state.process, edges: action.payload },
        isDirty: true,
      };
    }

    case "SELECT_NODE":
      return {
        ...state,
        selectedNodeId: action.payload,
        selectedEdgeId: action.payload ? null : state.selectedEdgeId,
      };

    case "SELECT_EDGE":
      return {
        ...state,
        selectedEdgeId: action.payload,
        selectedNodeId: action.payload ? null : state.selectedNodeId,
      };

    case "SET_CHAT_PHASE":
      return { ...state, chatPhase: action.payload };

    case "ADD_CHAT_MESSAGE":
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload],
      };

    case "UPDATE_CHAT_MESSAGE":
      return {
        ...state,
        chatMessages: state.chatMessages.map((m) =>
          m.id === action.payload.id
            ? { ...m, content: action.payload.content }
            : m,
        ),
      };

    case "CLEAR_CHAT_MESSAGES":
      return { ...state, chatMessages: [] };

    case "SET_CHAT_STREAMING":
      return { ...state, isChatStreaming: action.payload };

    case "SET_VALIDATION_RESULT":
      return { ...state, validationResult: action.payload };

    case "SET_DEPLOY_STATUS":
      return { ...state, deployStatus: action.payload };

    case "SET_UI":
      return { ...state, ui: { ...state.ui, ...action.payload } };

    case "TOGGLE_FULLSCREEN":
      return {
        ...state,
        ui: { ...state.ui, isFullscreen: !state.ui.isFullscreen },
      };

    case "TOGGLE_PROPERTIES_PANEL":
      return {
        ...state,
        ui: {
          ...state.ui,
          isPropertiesPanelOpen: !state.ui.isPropertiesPanelOpen,
        },
      };

    case "TOGGLE_CHAT_PANEL":
      return {
        ...state,
        ui: { ...state.ui, isChatPanelOpen: !state.ui.isChatPanelOpen },
      };

    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const previous = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        process: previous,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: state.process
          ? [...state.redoStack, state.process]
          : state.redoStack,
        isDirty: true,
      };
    }

    case "REDO": {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        process: next,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: state.process
          ? [...state.undoStack, state.process]
          : state.undoStack,
        isDirty: true,
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────
export interface ProcessDesignerContextValue {
  state: ProcessDesignerState;
  dispatch: Dispatch<ProcessDesignerAction>;
}

export const ProcessDesignerContext =
  createContext<ProcessDesignerContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────
export interface ProcessDesignerProviderProps {
  children: ReactNode;
  initialProcess?: ProcessDefinition;
}

export function ProcessDesignerProvider({
  children,
  initialProcess,
}: ProcessDesignerProviderProps) {
  const [state, dispatch] = useReducer(
    processDesignerReducer,
    initialProcess
      ? { ...initialState, process: initialProcess }
      : initialState,
  );

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return createElement(
    ProcessDesignerContext.Provider,
    { value },
    children,
  );
}

// ─── Base Hook ───────────────────────────────────────────────────────
export function useProcessDesignerContext(): ProcessDesignerContextValue {
  const context = useContext(ProcessDesignerContext);
  if (!context) {
    throw new Error(
      "useProcessDesignerContext must be used within a ProcessDesignerProvider",
    );
  }
  return context;
}
