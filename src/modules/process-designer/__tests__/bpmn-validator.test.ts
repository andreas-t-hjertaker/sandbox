import { describe, it, expect } from "vitest";
import { validateProcess } from "../lib/bpmn-validator";
import type { ProcessNode, ProcessEdge } from "../types";

const makeNode = (overrides: Partial<ProcessNode> & { id: string; type: ProcessNode["type"] }): ProcessNode => ({
  label: overrides.id,
  position: { x: 0, y: 0 },
  metadata: {},
  ...overrides,
});

describe("validateProcess", () => {
  it("returnerer valid for en komplett, minimal prosess", () => {
    const nodes: ProcessNode[] = [
      makeNode({ id: "start", type: "startEvent", label: "Start" }),
      makeNode({ id: "task", type: "serviceTask", label: "Oppgave" }),
      makeNode({ id: "end", type: "endEvent", label: "Slutt" }),
    ];
    const edges: ProcessEdge[] = [
      { id: "e1", source: "start", target: "task" },
      { id: "e2", source: "task", target: "end" },
    ];

    const result = validateProcess(nodes, edges);
    expect(result.valid).toBe(true);
    expect(result.summary.errors).toBe(0);
  });

  it("feiler uten startEvent", () => {
    const nodes: ProcessNode[] = [
      makeNode({ id: "task", type: "serviceTask", label: "Oppgave" }),
      makeNode({ id: "end", type: "endEvent", label: "Slutt" }),
    ];
    const edges: ProcessEdge[] = [
      { id: "e1", source: "task", target: "end" },
    ];

    const result = validateProcess(nodes, edges);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("startEvent"))).toBe(true);
  });

  it("feiler uten endEvent", () => {
    const nodes: ProcessNode[] = [
      makeNode({ id: "start", type: "startEvent", label: "Start" }),
      makeNode({ id: "task", type: "serviceTask", label: "Oppgave" }),
    ];
    const edges: ProcessEdge[] = [
      { id: "e1", source: "start", target: "task" },
    ];

    const result = validateProcess(nodes, edges);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("endEvent"))).toBe(true);
  });

  it("feiler med løse noder", () => {
    const nodes: ProcessNode[] = [
      makeNode({ id: "start", type: "startEvent", label: "Start" }),
      makeNode({ id: "end", type: "endEvent", label: "Slutt" }),
      makeNode({ id: "orphan", type: "serviceTask", label: "Foreldreløs" }),
    ];
    const edges: ProcessEdge[] = [
      { id: "e1", source: "start", target: "end" },
    ];

    const result = validateProcess(nodes, edges);
    expect(result.issues.some((i) => i.nodeId === "orphan" && i.severity === "error")).toBe(true);
  });

  it("advarer om exclusive gateway med færre enn 2 utganger", () => {
    const nodes: ProcessNode[] = [
      makeNode({ id: "start", type: "startEvent", label: "Start" }),
      makeNode({ id: "gw", type: "exclusiveGateway", label: "Sjekk" }),
      makeNode({ id: "end", type: "endEvent", label: "Slutt" }),
    ];
    const edges: ProcessEdge[] = [
      { id: "e1", source: "start", target: "gw" },
      { id: "e2", source: "gw", target: "end" },
    ];

    const result = validateProcess(nodes, edges);
    expect(result.issues.some((i) => i.nodeId === "gw" && i.severity === "warning")).toBe(true);
  });

  it("feiler når kant refererer til ikke-eksisterende node", () => {
    const nodes: ProcessNode[] = [
      makeNode({ id: "start", type: "startEvent", label: "Start" }),
      makeNode({ id: "end", type: "endEvent", label: "Slutt" }),
    ];
    const edges: ProcessEdge[] = [
      { id: "e1", source: "start", target: "end" },
      { id: "e2", source: "start", target: "nonexistent" },
    ];

    const result = validateProcess(nodes, edges);
    expect(result.issues.some((i) => i.message.includes("nonexistent"))).toBe(true);
  });

  it("feiler når startEvent har inngående kant", () => {
    const nodes: ProcessNode[] = [
      makeNode({ id: "start", type: "startEvent", label: "Start" }),
      makeNode({ id: "task", type: "serviceTask", label: "Oppgave" }),
      makeNode({ id: "end", type: "endEvent", label: "Slutt" }),
    ];
    const edges: ProcessEdge[] = [
      { id: "e1", source: "start", target: "task" },
      { id: "e2", source: "task", target: "end" },
      { id: "e3", source: "task", target: "start" },
    ];

    const result = validateProcess(nodes, edges);
    expect(result.issues.some((i) => i.message.includes("inngående"))).toBe(true);
  });
});
