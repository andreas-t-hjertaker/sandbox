import { describe, it, expect } from "vitest";
import { diffVersions, isSignificantChange } from "../lib/process-versioning";
import type { ProcessNode, ProcessEdge } from "../types";

const makeNode = (overrides: Partial<ProcessNode> & { id: string; type: ProcessNode["type"] }): ProcessNode => ({
  label: overrides.id,
  position: { x: 0, y: 0 },
  metadata: {},
  ...overrides,
});

describe("diffVersions", () => {
  it("oppdager nye noder", () => {
    const before = {
      nodes: [makeNode({ id: "a", type: "startEvent" })],
      edges: [],
    };
    const after = {
      nodes: [makeNode({ id: "a", type: "startEvent" }), makeNode({ id: "b", type: "serviceTask" })],
      edges: [],
    };
    const diff = diffVersions(before, after);
    expect(diff.addedNodes).toEqual(["b"]);
    expect(diff.removedNodes).toEqual([]);
  });

  it("oppdager fjernede noder", () => {
    const before = {
      nodes: [makeNode({ id: "a", type: "startEvent" }), makeNode({ id: "b", type: "serviceTask" })],
      edges: [],
    };
    const after = {
      nodes: [makeNode({ id: "a", type: "startEvent" })],
      edges: [],
    };
    const diff = diffVersions(before, after);
    expect(diff.removedNodes).toEqual(["b"]);
  });

  it("oppdager endret label", () => {
    const before = {
      nodes: [makeNode({ id: "a", type: "serviceTask", label: "Gammel" })],
      edges: [],
    };
    const after = {
      nodes: [makeNode({ id: "a", type: "serviceTask", label: "Ny" })],
      edges: [],
    };
    const diff = diffVersions(before, after);
    expect(diff.modifiedNodes).toHaveLength(1);
    expect(diff.modifiedNodes[0].changes.some((c) => c.includes("label"))).toBe(true);
  });

  it("oppdager endret type", () => {
    const before = {
      nodes: [makeNode({ id: "a", type: "serviceTask", label: "A" })],
      edges: [],
    };
    const after = {
      nodes: [makeNode({ id: "a", type: "userTask", label: "A" })],
      edges: [],
    };
    const diff = diffVersions(before, after);
    expect(diff.modifiedNodes[0].changes.some((c) => c.includes("type"))).toBe(true);
  });

  it("oppdager endrede kanter", () => {
    const nodes = [makeNode({ id: "a", type: "startEvent" }), makeNode({ id: "b", type: "endEvent" })];
    const before = { nodes, edges: [{ id: "e1", source: "a", target: "b" }] as ProcessEdge[] };
    const after = { nodes, edges: [{ id: "e2", source: "a", target: "b" }] as ProcessEdge[] };
    const diff = diffVersions(before, after);
    expect(diff.removedEdges).toEqual(["e1"]);
    expect(diff.addedEdges).toEqual(["e2"]);
  });

  it("returnerer tom diff for identiske versjoner", () => {
    const version = {
      nodes: [makeNode({ id: "a", type: "startEvent" })],
      edges: [{ id: "e1", source: "a", target: "a" }] as ProcessEdge[],
    };
    const diff = diffVersions(version, version);
    expect(diff.addedNodes).toEqual([]);
    expect(diff.removedNodes).toEqual([]);
    expect(diff.modifiedNodes).toEqual([]);
    expect(diff.addedEdges).toEqual([]);
    expect(diff.removedEdges).toEqual([]);
  });
});

describe("isSignificantChange", () => {
  it("returnerer true for nye noder", () => {
    expect(isSignificantChange({
      addedNodes: ["x"], removedNodes: [], modifiedNodes: [],
      addedEdges: [], removedEdges: [],
    })).toBe(true);
  });

  it("returnerer true for fjernede noder", () => {
    expect(isSignificantChange({
      addedNodes: [], removedNodes: ["x"], modifiedNodes: [],
      addedEdges: [], removedEdges: [],
    })).toBe(true);
  });

  it("returnerer false for kun posisjonsendringer", () => {
    expect(isSignificantChange({
      addedNodes: [], removedNodes: [],
      modifiedNodes: [{ id: "a", changes: ["posisjon endret"] }],
      addedEdges: [], removedEdges: [],
    })).toBe(false);
  });

  it("returnerer true for label + posisjonsendring", () => {
    expect(isSignificantChange({
      addedNodes: [], removedNodes: [],
      modifiedNodes: [{ id: "a", changes: ["posisjon endret", "label: \"A\" → \"B\""] }],
      addedEdges: [], removedEdges: [],
    })).toBe(true);
  });
});
