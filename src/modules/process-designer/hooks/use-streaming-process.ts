"use client";

/**
 * SSE/streaming hook for sanntids BPMN-oppdateringer.
 *
 * Parser JSON-deltas fra LLM-streaming og oppdaterer ReactFlow-canvas
 * inkrementelt. Støtter reconnect ved tap av forbindelse.
 */

import { useState, useCallback, useRef } from "react";
import type { ProcessNode, ProcessEdge } from "../types";
import { parseLLMResponse, applyLLMResponse } from "../lib/llm-orchestrator";
import { layoutNewNodes } from "../lib/auto-layout";

type StreamingState = "idle" | "streaming" | "error" | "reconnecting";

type UseStreamingProcessOptions = {
  onNodesUpdate?: (nodes: ProcessNode[]) => void;
  onEdgesUpdate?: (edges: ProcessEdge[]) => void;
  onPhaseChange?: (phase: string) => void;
};

/**
 * Hook for å håndtere streaming LLM-oppdateringer til BPMN-canvas.
 *
 * Buffrer partielle JSON-chunks og parser de når en komplett
 * process-data blokk er mottatt.
 */
export function useStreamingProcess({
  onNodesUpdate,
  onEdgesUpdate,
  onPhaseChange,
}: UseStreamingProcessOptions = {}) {
  const [streamingState, setStreamingState] = useState<StreamingState>("idle");
  const [pendingText, setPendingText] = useState("");
  const nodesRef = useRef<ProcessNode[]>([]);
  const edgesRef = useRef<ProcessEdge[]>([]);
  const bufferRef = useRef("");

  /**
   * Feed en text-chunk inn i parseren.
   * Kalles for hvert chunk fra LLM streaming.
   */
  const feedChunk = useCallback(
    (chunk: string) => {
      bufferRef.current += chunk;
      setPendingText(bufferRef.current);

      // Sjekk om vi har en komplett process-data blokk
      const fullBuffer = bufferRef.current;
      const startMarker = "```process-data";
      const endMarker = "```";

      const startIdx = fullBuffer.indexOf(startMarker);
      if (startIdx === -1) return;

      const afterStart = startIdx + startMarker.length;
      const endIdx = fullBuffer.indexOf(endMarker, afterStart + 1);
      if (endIdx === -1) return; // Vent på mer data

      // Vi har en komplett blokk — parse den
      const { data } = parseLLMResponse(fullBuffer);

      if (data) {
        const current = {
          nodes: nodesRef.current,
          edges: edgesRef.current,
        };
        const updated = applyLLMResponse(current, data);

        // Inkrementell layout for nye noder
        const existingIds = new Set(nodesRef.current.map((n) => n.id));
        const newNodes = updated.nodes.filter((n) => !existingIds.has(n.id));

        let finalNodes: ProcessNode[];
        if (newNodes.length > 0 && nodesRef.current.length > 0) {
          finalNodes = layoutNewNodes(
            nodesRef.current,
            newNodes,
            updated.edges
          );
        } else {
          finalNodes = updated.nodes;
        }

        nodesRef.current = finalNodes;
        edgesRef.current = updated.edges;

        onNodesUpdate?.(finalNodes);
        onEdgesUpdate?.(updated.edges);

        if (data.phase) {
          onPhaseChange?.(data.phase);
        }
      }

      // Reset buffer etter parsing
      const remaining = fullBuffer.slice(endIdx + endMarker.length);
      bufferRef.current = remaining;
    },
    [onNodesUpdate, onEdgesUpdate, onPhaseChange]
  );

  /** Start streaming-modus */
  const startStreaming = useCallback(() => {
    setStreamingState("streaming");
    bufferRef.current = "";
    setPendingText("");
  }, []);

  /** Stopp streaming-modus */
  const stopStreaming = useCallback(() => {
    setStreamingState("idle");
    bufferRef.current = "";
  }, []);

  /** Sett feilstatus */
  const setError = useCallback(() => {
    setStreamingState("error");
  }, []);

  /** Initialiser med eksisterende prosess-data */
  const initialize = useCallback(
    (nodes: ProcessNode[], edges: ProcessEdge[]) => {
      nodesRef.current = nodes;
      edgesRef.current = edges;
    },
    []
  );

  return {
    streamingState,
    pendingText,
    feedChunk,
    startStreaming,
    stopStreaming,
    setError,
    initialize,
  };
}
