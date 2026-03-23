import { describe, it, expect } from "vitest";
import { autoLayout, layoutNewNodes } from "../lib/auto-layout";
import type { ProcessNode, ProcessEdge } from "../types";

const makeNode = (id: string, type: ProcessNode["type"] = "serviceTask"): ProcessNode => ({
  id,
  type,
  label: id,
  position: { x: 0, y: 0 },
  metadata: {},
});

describe("autoLayout", () => {
  it("returnerer tom array for tom input", () => {
    expect(autoLayout([], [])).toEqual([]);
  });

  it("plasserer noder i lag basert på kanter", () => {
    const nodes = [makeNode("start", "startEvent"), makeNode("task"), makeNode("end", "endEvent")];
    const edges: ProcessEdge[] = [
      { id: "e1", source: "start", target: "task" },
      { id: "e2", source: "task", target: "end" },
    ];

    const result = autoLayout(nodes, edges);
    expect(result).toHaveLength(3);

    // Start skal være til venstre for task, task til venstre for end
    const startX = result.find((n) => n.id === "start")!.position.x;
    const taskX = result.find((n) => n.id === "task")!.position.x;
    const endX = result.find((n) => n.id === "end")!.position.x;

    expect(startX).toBeLessThan(taskX);
    expect(taskX).toBeLessThan(endX);
  });

  it("håndterer parallelle grener", () => {
    const nodes = [
      makeNode("start", "startEvent"),
      makeNode("fork", "parallelGateway"),
      makeNode("a"),
      makeNode("b"),
      makeNode("join", "parallelGateway"),
      makeNode("end", "endEvent"),
    ];
    const edges: ProcessEdge[] = [
      { id: "e1", source: "start", target: "fork" },
      { id: "e2", source: "fork", target: "a" },
      { id: "e3", source: "fork", target: "b" },
      { id: "e4", source: "a", target: "join" },
      { id: "e5", source: "b", target: "join" },
      { id: "e6", source: "join", target: "end" },
    ];

    const result = autoLayout(nodes, edges);
    expect(result).toHaveLength(6);

    // a og b skal ha ulik y-posisjon (parallelle)
    const aY = result.find((n) => n.id === "a")!.position.y;
    const bY = result.find((n) => n.id === "b")!.position.y;
    expect(aY).not.toBe(bY);
  });
});

describe("layoutNewNodes", () => {
  it("plasserer nye noder til høyre for eksisterende", () => {
    const existing = [
      { ...makeNode("start", "startEvent"), position: { x: 0, y: 100 } },
    ];
    const newNodes = [makeNode("task")];
    const edges: ProcessEdge[] = [
      { id: "e1", source: "start", target: "task" },
    ];

    const result = layoutNewNodes(existing, newNodes, edges);
    expect(result).toHaveLength(2);

    const taskX = result.find((n) => n.id === "task")!.position.x;
    expect(taskX).toBeGreaterThan(0);
  });

  it("returnerer eksisterende noder uendret", () => {
    const existing = [
      { ...makeNode("start", "startEvent"), position: { x: 42, y: 77 } },
    ];

    const result = layoutNewNodes(existing, [], []);
    expect(result).toHaveLength(1);
    expect(result[0].position).toEqual({ x: 42, y: 77 });
  });
});
