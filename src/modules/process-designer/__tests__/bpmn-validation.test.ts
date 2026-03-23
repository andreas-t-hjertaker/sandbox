import { describe, it, expect } from "vitest";
import { validateProcess } from "../lib/bpmn-validation";
import type { ProcessDefinition } from "../types";

function createProcess(
  overrides: Partial<ProcessDefinition> = {}
): ProcessDefinition {
  return {
    id: "test",
    name: "Test Process",
    description: "",
    version: 1,
    status: "draft",
    createdBy: "test-user",
    nodes: [],
    edges: [],
    tags: [],
    isTemplate: false,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

describe("validateProcess", () => {
  it("should fail when no startEvent exists", () => {
    const result = validateProcess(
      createProcess({
        nodes: [{ id: "end", type: "endEvent", label: "End", position: { x: 0, y: 0 }, metadata: {} }],
      })
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("startEvent"))).toBe(true);
  });

  it("should fail when no endEvent exists", () => {
    const result = validateProcess(
      createProcess({
        nodes: [{ id: "start", type: "startEvent", label: "Start", position: { x: 0, y: 0 }, metadata: {} }],
      })
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("endEvent"))).toBe(true);
  });

  it("should pass for a valid minimal process", () => {
    const result = validateProcess(
      createProcess({
        nodes: [
          { id: "start", type: "startEvent", label: "Start", position: { x: 0, y: 0 }, metadata: {} },
          { id: "task", type: "serviceTask", label: "Do Work", position: { x: 200, y: 0 }, metadata: {} },
          { id: "end", type: "endEvent", label: "End", position: { x: 400, y: 0 }, metadata: {} },
        ],
        edges: [
          { id: "e1", source: "start", target: "task" },
          { id: "e2", source: "task", target: "end" },
        ],
      })
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should detect orphan nodes", () => {
    const result = validateProcess(
      createProcess({
        nodes: [
          { id: "start", type: "startEvent", label: "Start", position: { x: 0, y: 0 }, metadata: {} },
          { id: "orphan", type: "serviceTask", label: "Orphan", position: { x: 200, y: 0 }, metadata: {} },
          { id: "end", type: "endEvent", label: "End", position: { x: 400, y: 0 }, metadata: {} },
        ],
        edges: [
          { id: "e1", source: "start", target: "end" },
        ],
      })
    );
    expect(result.errors.some((e) => e.message.includes("ikke tilkoblet"))).toBe(true);
  });

  it("should detect multiple startEvents", () => {
    const result = validateProcess(
      createProcess({
        nodes: [
          { id: "start1", type: "startEvent", label: "Start 1", position: { x: 0, y: 0 }, metadata: {} },
          { id: "start2", type: "startEvent", label: "Start 2", position: { x: 0, y: 100 }, metadata: {} },
          { id: "end", type: "endEvent", label: "End", position: { x: 400, y: 0 }, metadata: {} },
        ],
        edges: [
          { id: "e1", source: "start1", target: "end" },
          { id: "e2", source: "start2", target: "end" },
        ],
      })
    );
    expect(result.errors.some((e) => e.message.includes("2 startEvents"))).toBe(true);
  });

  it("should warn when gateway has fewer than 2 outgoing edges", () => {
    const result = validateProcess(
      createProcess({
        nodes: [
          { id: "start", type: "startEvent", label: "Start", position: { x: 0, y: 0 }, metadata: {} },
          { id: "gw", type: "exclusiveGateway", label: "Decision", position: { x: 200, y: 0 }, metadata: {} },
          { id: "end", type: "endEvent", label: "End", position: { x: 400, y: 0 }, metadata: {} },
        ],
        edges: [
          { id: "e1", source: "start", target: "gw" },
          { id: "e2", source: "gw", target: "end" },
        ],
      })
    );
    expect(result.errors.some((e) => e.message.includes("minst 2 utgående"))).toBe(true);
  });

  it("should warn about serviceTask without agentConfig", () => {
    const result = validateProcess(
      createProcess({
        nodes: [
          { id: "start", type: "startEvent", label: "Start", position: { x: 0, y: 0 }, metadata: {} },
          { id: "task", type: "serviceTask", label: "Task", position: { x: 200, y: 0 }, metadata: {} },
          { id: "end", type: "endEvent", label: "End", position: { x: 400, y: 0 }, metadata: {} },
        ],
        edges: [
          { id: "e1", source: "start", target: "task" },
          { id: "e2", source: "task", target: "end" },
        ],
      })
    );
    expect(result.warnings.some((w) => w.message.includes("agent-konfigurasjon"))).toBe(true);
  });

  it("should detect startEvent with incoming edges", () => {
    const result = validateProcess(
      createProcess({
        nodes: [
          { id: "start", type: "startEvent", label: "Start", position: { x: 0, y: 0 }, metadata: {} },
          { id: "task", type: "serviceTask", label: "Task", position: { x: 200, y: 0 }, metadata: {} },
          { id: "end", type: "endEvent", label: "End", position: { x: 400, y: 0 }, metadata: {} },
        ],
        edges: [
          { id: "e1", source: "start", target: "task" },
          { id: "e2", source: "task", target: "end" },
          { id: "e3", source: "task", target: "start" },
        ],
      })
    );
    expect(result.errors.some((e) => e.message.includes("innkommende kanter"))).toBe(true);
  });
});
