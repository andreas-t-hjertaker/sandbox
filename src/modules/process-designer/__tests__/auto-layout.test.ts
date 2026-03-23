import { describe, it, expect } from "vitest";
import { autoLayout, incrementalLayout } from "../lib/auto-layout";
import type { ProcessNode, ProcessEdge } from "../types";

const testNodes: ProcessNode[] = [
  { id: "start", type: "startEvent", label: "Start", position: { x: 0, y: 0 }, metadata: {} },
  { id: "task1", type: "serviceTask", label: "Task 1", position: { x: 0, y: 0 }, metadata: {} },
  { id: "task2", type: "serviceTask", label: "Task 2", position: { x: 0, y: 0 }, metadata: {} },
  { id: "end", type: "endEvent", label: "End", position: { x: 0, y: 0 }, metadata: {} },
];

const testEdges: ProcessEdge[] = [
  { id: "e1", source: "start", target: "task1" },
  { id: "e2", source: "task1", target: "task2" },
  { id: "e3", source: "task2", target: "end" },
];

describe("autoLayout", () => {
  it("should assign unique positions to all nodes", () => {
    const result = autoLayout(testNodes, testEdges);
    expect(result.nodes).toHaveLength(4);

    const positions = result.nodes.map((n) => `${n.position.x},${n.position.y}`);
    const uniquePositions = new Set(positions);
    expect(uniquePositions.size).toBe(4);
  });

  it("should maintain left-to-right order for LR direction", () => {
    const result = autoLayout(testNodes, testEdges, { direction: "LR" });
    const startNode = result.nodes.find((n) => n.id === "start")!;
    const endNode = result.nodes.find((n) => n.id === "end")!;
    expect(endNode.position.x).toBeGreaterThan(startNode.position.x);
  });

  it("should maintain top-to-bottom order for TB direction", () => {
    const result = autoLayout(testNodes, testEdges, { direction: "TB" });
    const startNode = result.nodes.find((n) => n.id === "start")!;
    const endNode = result.nodes.find((n) => n.id === "end")!;
    expect(endNode.position.y).toBeGreaterThan(startNode.position.y);
  });

  it("should preserve edges", () => {
    const result = autoLayout(testNodes, testEdges);
    expect(result.edges).toEqual(testEdges);
  });
});

describe("incrementalLayout", () => {
  it("should not move existing nodes", () => {
    const existingNodes: ProcessNode[] = [
      { id: "start", type: "startEvent", label: "Start", position: { x: 100, y: 200 }, metadata: {} },
      { id: "task1", type: "serviceTask", label: "Task 1", position: { x: 300, y: 200 }, metadata: {} },
    ];
    const newNodes: ProcessNode[] = [
      { id: "end", type: "endEvent", label: "End", position: { x: 0, y: 0 }, metadata: {} },
    ];
    const edges: ProcessEdge[] = [
      { id: "e1", source: "start", target: "task1" },
      { id: "e2", source: "task1", target: "end" },
    ];

    const result = incrementalLayout(existingNodes, newNodes, edges);
    const startNode = result.nodes.find((n) => n.id === "start")!;
    const task1Node = result.nodes.find((n) => n.id === "task1")!;

    expect(startNode.position).toEqual({ x: 100, y: 200 });
    expect(task1Node.position).toEqual({ x: 300, y: 200 });
  });
});
