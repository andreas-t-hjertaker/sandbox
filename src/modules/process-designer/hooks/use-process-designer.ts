import { useCallback, useMemo } from "react";
import { useProcessDesignerContext } from "../store";
import type {
  ProcessDefinition,
  ProcessNode,
  ProcessEdge,
  ChatPhase,
  PatchOperation,
} from "../types";
import type { UIState } from "../store";

export function useProcessDesigner() {
  const { state, dispatch } = useProcessDesignerContext();

  // ─── Process Actions ─────────────────────────────────────────────
  const setProcess = useCallback(
    (process: ProcessDefinition) => dispatch({ type: "SET_PROCESS", payload: process }),
    [dispatch],
  );

  const updateProcess = useCallback(
    (changes: Partial<ProcessDefinition>) =>
      dispatch({ type: "UPDATE_PROCESS", payload: changes }),
    [dispatch],
  );

  const applyPatches = useCallback(
    (patches: PatchOperation[]) =>
      dispatch({ type: "APPLY_PATCHES", payload: patches }),
    [dispatch],
  );

  // ─── Node Actions ────────────────────────────────────────────────
  const addNode = useCallback(
    (node: ProcessNode) => dispatch({ type: "ADD_NODE", payload: node }),
    [dispatch],
  );

  const updateNode = useCallback(
    (id: string, changes: Partial<ProcessNode>) =>
      dispatch({ type: "UPDATE_NODE", payload: { id, changes } }),
    [dispatch],
  );

  const removeNode = useCallback(
    (id: string) => dispatch({ type: "REMOVE_NODE", payload: id }),
    [dispatch],
  );

  const setNodes = useCallback(
    (nodes: ProcessNode[]) => dispatch({ type: "SET_NODES", payload: nodes }),
    [dispatch],
  );

  // ─── Edge Actions ────────────────────────────────────────────────
  const addEdge = useCallback(
    (edge: ProcessEdge) => dispatch({ type: "ADD_EDGE", payload: edge }),
    [dispatch],
  );

  const updateEdge = useCallback(
    (id: string, changes: Partial<ProcessEdge>) =>
      dispatch({ type: "UPDATE_EDGE", payload: { id, changes } }),
    [dispatch],
  );

  const removeEdge = useCallback(
    (id: string) => dispatch({ type: "REMOVE_EDGE", payload: id }),
    [dispatch],
  );

  const setEdges = useCallback(
    (edges: ProcessEdge[]) => dispatch({ type: "SET_EDGES", payload: edges }),
    [dispatch],
  );

  // ─── Selection ───────────────────────────────────────────────────
  const selectNode = useCallback(
    (id: string | null) => dispatch({ type: "SELECT_NODE", payload: id }),
    [dispatch],
  );

  const selectEdge = useCallback(
    (id: string | null) => dispatch({ type: "SELECT_EDGE", payload: id }),
    [dispatch],
  );

  // ─── Chat Actions ────────────────────────────────────────────────
  const setChatPhase = useCallback(
    (phase: ChatPhase) => dispatch({ type: "SET_CHAT_PHASE", payload: phase }),
    [dispatch],
  );

  // ─── UI Actions ──────────────────────────────────────────────────
  const setUI = useCallback(
    (changes: Partial<UIState>) => dispatch({ type: "SET_UI", payload: changes }),
    [dispatch],
  );

  const toggleFullscreen = useCallback(
    () => dispatch({ type: "TOGGLE_FULLSCREEN" }),
    [dispatch],
  );

  const togglePropertiesPanel = useCallback(
    () => dispatch({ type: "TOGGLE_PROPERTIES_PANEL" }),
    [dispatch],
  );

  const toggleChatPanel = useCallback(
    () => dispatch({ type: "TOGGLE_CHAT_PANEL" }),
    [dispatch],
  );

  // ─── History ─────────────────────────────────────────────────────
  const undo = useCallback(() => dispatch({ type: "UNDO" }), [dispatch]);
  const redo = useCallback(() => dispatch({ type: "REDO" }), [dispatch]);
  const reset = useCallback(() => dispatch({ type: "RESET" }), [dispatch]);

  // ─── Derived State ───────────────────────────────────────────────
  const selectedNode = useMemo(
    () =>
      state.process?.nodes.find((n) => n.id === state.selectedNodeId) ?? null,
    [state.process?.nodes, state.selectedNodeId],
  );

  const selectedEdge = useMemo(
    () =>
      state.process?.edges.find((e) => e.id === state.selectedEdgeId) ?? null,
    [state.process?.edges, state.selectedEdgeId],
  );

  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;

  return {
    // State
    process: state.process,
    selectedNodeId: state.selectedNodeId,
    selectedEdgeId: state.selectedEdgeId,
    selectedNode,
    selectedEdge,
    chatPhase: state.chatPhase,
    chatMessages: state.chatMessages,
    isChatStreaming: state.isChatStreaming,
    validationResult: state.validationResult,
    deployStatus: state.deployStatus,
    ui: state.ui,
    isDirty: state.isDirty,
    canUndo,
    canRedo,

    // Actions
    setProcess,
    updateProcess,
    applyPatches,
    addNode,
    updateNode,
    removeNode,
    setNodes,
    addEdge,
    updateEdge,
    removeEdge,
    setEdges,
    selectNode,
    selectEdge,
    setChatPhase,
    setUI,
    toggleFullscreen,
    togglePropertiesPanel,
    toggleChatPanel,
    undo,
    redo,
    reset,
    dispatch,
  };
}
