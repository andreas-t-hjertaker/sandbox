import { describe, it, expect } from "vitest";
import {
  detectPhase,
  buildSystemPrompt,
  generateSuggestions,
  buildLLMRequest,
} from "../lib/llm-orchestrator";
import type { ProcessDefinition, ChatMessage } from "../types";

function createProcess(
  overrides: Partial<ProcessDefinition> = {}
): ProcessDefinition {
  return {
    id: "test",
    name: "Test",
    description: "",
    version: 1,
    status: "draft",
    createdBy: "user",
    nodes: [],
    edges: [],
    tags: [],
    isTemplate: false,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function createMessage(role: "user" | "assistant", content: string): ChatMessage {
  return {
    id: `msg-${Math.random()}`,
    role,
    content,
    timestamp: Date.now(),
  };
}

describe("detectPhase", () => {
  it("should return kartlegging for empty process with few messages", () => {
    const messages = [createMessage("user", "Hei")];
    const process = createProcess();
    expect(detectPhase(messages, process)).toBe("kartlegging");
  });

  it("should return strukturering when nodes exist but no agent config", () => {
    const messages = Array.from({ length: 6 }, (_, i) =>
      createMessage("user", `Message ${i}`)
    );
    const process = createProcess({
      nodes: [
        { id: "start", type: "startEvent", label: "Start", position: { x: 0, y: 0 }, metadata: {} },
      ],
    });
    expect(detectPhase(messages, process)).toBe("strukturering");
  });

  it("should return agentifisering when nodes have agent config", () => {
    const messages = [createMessage("user", "Test")];
    const process = createProcess({
      nodes: [
        {
          id: "task",
          type: "serviceTask",
          label: "Task",
          position: { x: 0, y: 0 },
          agentConfig: {
            autonomyLevel: 3,
            llmPrompt: "test",
            tools: [],
            maxIterations: 5,
            timeout: 30000,
            humanApprovalRequired: false,
          },
          metadata: {},
        },
      ],
    });
    expect(detectPhase(messages, process)).toBe("agentifisering");
  });
});

describe("buildSystemPrompt", () => {
  it("should include base prompt", () => {
    const prompt = buildSystemPrompt("kartlegging", createProcess());
    expect(prompt).toContain("Process Agent Designer");
  });

  it("should include phase-specific prompt", () => {
    const prompt = buildSystemPrompt("kartlegging", createProcess());
    expect(prompt).toContain("Hva trigger prosessen");
  });

  it("should include domain rules when provided", () => {
    const prompt = buildSystemPrompt(
      "kartlegging",
      createProcess(),
      "Aldri kontér over 100k"
    );
    expect(prompt).toContain("Aldri kontér over 100k");
    expect(prompt).toContain("Domeneregler");
  });

  it("should include current process info when nodes exist", () => {
    const process = createProcess({
      nodes: [
        { id: "start", type: "startEvent", label: "Start", position: { x: 0, y: 0 }, metadata: {} },
      ],
      edges: [],
    });
    const prompt = buildSystemPrompt("strukturering", process);
    expect(prompt).toContain("Noder: 1");
  });
});

describe("generateSuggestions", () => {
  it("should return phase-appropriate suggestions", () => {
    expect(generateSuggestions("kartlegging").length).toBeGreaterThan(0);
    expect(generateSuggestions("strukturering").length).toBeGreaterThan(0);
    expect(generateSuggestions("agentifisering").length).toBeGreaterThan(0);
    expect(generateSuggestions("validering").length).toBeGreaterThan(0);
  });
});

describe("buildLLMRequest", () => {
  it("should build a valid request", () => {
    const messages = [createMessage("user", "Hello")];
    const process = createProcess();
    const request = buildLLMRequest(messages, process, "kartlegging");

    expect(request.phase).toBe("kartlegging");
    expect(request.processId).toBe("test");
    expect(request.messages).toHaveLength(1);
    expect(request.systemPrompt).toContain("Process Agent Designer");
  });
});
