import { describe, it, expect } from "vitest";
import { exportToBPMNXML, exportToJSON, importFromJSON } from "../lib/process-export";
import type { ProcessNode, ProcessEdge, ProcessDefinition } from "../types";

const testNodes: ProcessNode[] = [
  { id: "start", type: "startEvent", label: "Start", position: { x: 0, y: 100 }, metadata: {} },
  { id: "task", type: "serviceTask", label: "Oppgave", position: { x: 200, y: 100 }, metadata: {},
    agentConfig: { autonomyLevel: 3, llmPrompt: "Gjør noe", tools: ["tool1"], maxIterations: 10, timeout: 30000, humanApprovalRequired: false } },
  { id: "end", type: "endEvent", label: "Slutt", position: { x: 400, y: 100 }, metadata: {} },
];

const testEdges: ProcessEdge[] = [
  { id: "e1", source: "start", target: "task" },
  { id: "e2", source: "task", target: "end" },
];

describe("exportToBPMNXML", () => {
  it("genererer gyldig BPMN 2.0 XML", () => {
    const xml = exportToBPMNXML(testNodes, testEdges);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<definitions");
    expect(xml).toContain("<process");
    expect(xml).toContain("<startEvent");
    expect(xml).toContain("<serviceTask");
    expect(xml).toContain("<endEvent");
    expect(xml).toContain("<sequenceFlow");
    expect(xml).toContain("BPMNDiagram");
  });

  it("inkluderer agent extension elements", () => {
    const xml = exportToBPMNXML(testNodes, testEdges);
    expect(xml).toContain("agent:config");
    expect(xml).toContain('autonomyLevel="3"');
    expect(xml).toContain("agent:prompt");
    expect(xml).toContain("agent:tool");
  });

  it("escaper spesialtegn i labels", () => {
    const nodes: ProcessNode[] = [
      { id: "n1", type: "serviceTask", label: 'Test & "stuff" <here>', position: { x: 0, y: 0 }, metadata: {} },
    ];
    const xml = exportToBPMNXML(nodes, []);
    expect(xml).toContain("&amp;");
    expect(xml).toContain("&quot;");
    expect(xml).toContain("&lt;");
  });
});

describe("JSON export/import", () => {
  it("roundtrips en prosessdefinisjon", () => {
    const def: ProcessDefinition = {
      id: "test",
      metadata: {
        name: "Test", description: "Desc", version: 1, status: "draft",
        createdBy: "u1", orgId: "o1", createdAt: new Date(), updatedAt: new Date(),
      },
      nodes: testNodes,
      edges: testEdges,
    };

    const json = exportToJSON(def);
    const imported = importFromJSON(json);
    expect(imported).not.toBeNull();
    expect(imported!.nodes).toHaveLength(3);
    expect(imported!.edges).toHaveLength(2);
  });

  it("returnerer null for ugyldig JSON", () => {
    expect(importFromJSON("not json")).toBeNull();
    expect(importFromJSON('{"foo": "bar"}')).toBeNull();
  });
});
