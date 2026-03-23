import { describe, it, expect } from "vitest";
import { exportToBPMNXml, exportToJson, importFromJson } from "../lib/bpmn-export";
import type { ProcessDefinition } from "../types";

const testProcess: ProcessDefinition = {
  id: "test-process",
  name: "Test Export Process",
  description: "A test process for export",
  version: 1,
  status: "draft",
  createdBy: "test",
  nodes: [
    { id: "start", type: "startEvent", label: "Start", position: { x: 0, y: 150 }, metadata: {} },
    {
      id: "task1",
      type: "serviceTask",
      label: "Do Work",
      position: { x: 200, y: 150 },
      agentConfig: {
        autonomyLevel: 3,
        llmPrompt: "Process the data",
        tools: ["tool1", "tool2"],
        maxIterations: 5,
        timeout: 30000,
        humanApprovalRequired: false,
      },
      metadata: {},
    },
    { id: "end", type: "endEvent", label: "End", position: { x: 400, y: 150 }, metadata: {} },
  ],
  edges: [
    { id: "e1", source: "start", target: "task1" },
    { id: "e2", source: "task1", target: "end" },
  ],
  tags: ["test"],
  isTemplate: false,
  createdAt: null,
  updatedAt: null,
};

describe("BPMN XML Export", () => {
  it("should export valid XML structure", () => {
    const xml = exportToBPMNXml(testProcess);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("bpmn:definitions");
    expect(xml).toContain("bpmn:process");
    expect(xml).toContain("bpmn:startEvent");
    expect(xml).toContain("bpmn:endEvent");
    expect(xml).toContain("bpmn:serviceTask");
    expect(xml).toContain("bpmn:sequenceFlow");
  });

  it("should include agent config as extension elements", () => {
    const xml = exportToBPMNXml(testProcess);
    expect(xml).toContain("pad:agentConfig");
    expect(xml).toContain('autonomyLevel="3"');
    expect(xml).toContain("pad:prompt");
    expect(xml).toContain("Process the data");
    expect(xml).toContain('pad:tool name="tool1"');
  });

  it("should include diagram information", () => {
    const xml = exportToBPMNXml(testProcess);
    expect(xml).toContain("bpmndi:BPMNDiagram");
    expect(xml).toContain("bpmndi:BPMNShape");
    expect(xml).toContain("bpmndi:BPMNEdge");
    expect(xml).toContain("dc:Bounds");
  });

  it("should escape XML special characters", () => {
    const processWithSpecialChars: ProcessDefinition = {
      ...testProcess,
      name: 'Test & "Special" <chars>',
    };
    const xml = exportToBPMNXml(processWithSpecialChars);
    expect(xml).toContain("&amp;");
    expect(xml).toContain("&quot;");
    expect(xml).toContain("&lt;");
    expect(xml).toContain("&gt;");
  });
});

describe("JSON Export/Import", () => {
  it("should export valid JSON", () => {
    const json = exportToJson(testProcess);
    const parsed = JSON.parse(json);
    expect(parsed.id).toBe("test-process");
    expect(parsed.nodes).toHaveLength(3);
    expect(parsed.edges).toHaveLength(2);
  });

  it("should roundtrip correctly", () => {
    const json = exportToJson(testProcess);
    const imported = importFromJson(json);
    expect(imported.id).toBe(testProcess.id);
    expect(imported.name).toBe(testProcess.name);
    expect(imported.nodes).toHaveLength(testProcess.nodes.length);
    expect(imported.edges).toHaveLength(testProcess.edges.length);
  });
});
