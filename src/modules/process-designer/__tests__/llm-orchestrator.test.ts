import { describe, it, expect } from "vitest";
import {
  parseLLMResponse,
  applyLLMResponse,
  detectPhase,
  buildDesignerSystemPrompt,
} from "../lib/llm-orchestrator";

describe("parseLLMResponse", () => {
  it("parser gyldig process-data kodeblokk", () => {
    const response = `Her er prosessen din.

\`\`\`process-data
{
  "phase": "structuring",
  "message": "Her er BPMN-strukturen",
  "nodes": [
    { "id": "start", "type": "startEvent", "label": "Start", "position": { "x": 0, "y": 0 } }
  ],
  "edges": []
}
\`\`\`

La meg vite om du vil endre noe.`;

    const { text, data } = parseLLMResponse(response);
    expect(data).not.toBeNull();
    expect(data?.phase).toBe("structuring");
    expect(data?.nodes).toHaveLength(1);
    expect(data?.nodes?.[0].type).toBe("startEvent");
    expect(text).toContain("Her er prosessen din");
    expect(text).not.toContain("process-data");
  });

  it("returnerer null data for ugyldig JSON", () => {
    const response = `\`\`\`process-data
{ invalid json
\`\`\``;

    const { data } = parseLLMResponse(response);
    expect(data).toBeNull();
  });

  it("returnerer null data uten kodeblokk", () => {
    const response = "Bare vanlig tekst uten kodeblokk.";
    const { text, data } = parseLLMResponse(response);
    expect(data).toBeNull();
    expect(text).toBe(response);
  });
});

describe("applyLLMResponse", () => {
  it("erstatter noder når LLM returnerer nye", () => {
    const current = { nodes: [], edges: [] };
    const data = {
      phase: "structuring" as const,
      message: "test",
      nodes: [
        { id: "start", type: "startEvent" as const, label: "Start", position: { x: 0, y: 0 }, metadata: {} },
      ],
      edges: [
        { id: "e1", source: "start", target: "end" },
      ],
    };

    const result = applyLLMResponse(current, data);
    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(1);
  });

  it("beholder eksisterende noder når LLM ikke returnerer nye", () => {
    const existing = {
      nodes: [{ id: "old", type: "serviceTask" as const, label: "Old", position: { x: 0, y: 0 }, metadata: {} }],
      edges: [],
    };
    const data = { phase: "mapping" as const, message: "test" };

    const result = applyLLMResponse(existing, data);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe("old");
  });
});

describe("detectPhase", () => {
  it("returnerer 'mapping' for tom prosess", () => {
    expect(detectPhase({ nodes: [], edges: [] }, 0)).toBe("mapping");
  });

  it("returnerer 'structuring' for prosess med noder uten agent", () => {
    const nodes = [{ id: "n1", type: "serviceTask" as const, label: "T", position: { x: 0, y: 0 }, metadata: {} }];
    expect(detectPhase({ nodes, edges: [] }, 5)).toBe("structuring");
  });

  it("returnerer 'agentifying' for prosess med agentConfig", () => {
    const nodes = [{
      id: "n1", type: "serviceTask" as const, label: "T",
      position: { x: 0, y: 0 }, metadata: {},
      agentConfig: { autonomyLevel: 3 as const, llmPrompt: "test", tools: [], maxIterations: 10, timeout: 30000, humanApprovalRequired: false },
    }];
    expect(detectPhase({ nodes, edges: [] }, 10)).toBe("agentifying");
  });
});

describe("buildDesignerSystemPrompt", () => {
  it("inkluderer BPMN-kunnskap og faseinstruksjoner", () => {
    const prompt = buildDesignerSystemPrompt("mapping");
    expect(prompt).toContain("BPMN 2.0");
    expect(prompt).toContain("Kartlegging");
    expect(prompt).toContain("kartlegging");
  });

  it("inkluderer nåværende prosess når den finnes", () => {
    const nodes = [{ id: "n1", type: "serviceTask" as const, label: "Test", position: { x: 0, y: 0 }, metadata: {} }];
    const prompt = buildDesignerSystemPrompt("structuring", { nodes, edges: [] });
    expect(prompt).toContain('"id": "n1"');
  });
});
