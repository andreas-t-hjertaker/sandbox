/**
 * Prosesseksport — BPMN 2.0 XML og JSON-eksport/import.
 */

import type { ProcessNode, ProcessEdge, ProcessDefinition } from "../types";

// ─── JSON eksport/import ────────────────────────────────

export function exportToJSON(definition: ProcessDefinition): string {
  return JSON.stringify(definition, null, 2);
}

export function importFromJSON(json: string): ProcessDefinition | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed.nodes && parsed.edges && parsed.metadata) {
      return parsed as ProcessDefinition;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── BPMN 2.0 XML eksport ──────────────────────────────

const BPMN_NS = "http://www.omg.org/spec/BPMN/20100524/MODEL";
const BPMNDI_NS = "http://www.omg.org/spec/BPMN/20100524/DI";
const DC_NS = "http://www.omg.org/spec/DD/20100524/DC";
const DI_NS = "http://www.omg.org/spec/DD/20100524/DI";
const AGENT_NS = "http://ketl.cloud/bpmn/agent-extensions";

const BPMN_ELEMENT_MAP: Record<string, string> = {
  startEvent: "startEvent",
  endEvent: "endEvent",
  serviceTask: "serviceTask",
  userTask: "userTask",
  exclusiveGateway: "exclusiveGateway",
  parallelGateway: "parallelGateway",
  timerEvent: "intermediateCatchEvent",
  errorEvent: "boundaryEvent",
};

export function exportToBPMNXML(
  nodes: ProcessNode[],
  edges: ProcessEdge[],
  processName = "Process_1"
): string {
  const lines: string[] = [];

  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<definitions xmlns="${BPMN_NS}"`);
  lines.push(`  xmlns:bpmndi="${BPMNDI_NS}"`);
  lines.push(`  xmlns:dc="${DC_NS}"`);
  lines.push(`  xmlns:di="${DI_NS}"`);
  lines.push(`  xmlns:agent="${AGENT_NS}"`);
  lines.push(`  id="Definitions_1">`);
  lines.push(`  <process id="${processName}" isExecutable="true">`);

  // Noder
  nodes.forEach((node) => {
    const bpmnTag = BPMN_ELEMENT_MAP[node.type] || "task";
    lines.push(`    <${bpmnTag} id="${xmlEscape(node.id)}" name="${xmlEscape(node.label)}">`);

    // Agent extensions
    if (node.agentConfig) {
      lines.push(`      <extensionElements>`);
      lines.push(`        <agent:config`);
      lines.push(`          autonomyLevel="${node.agentConfig.autonomyLevel}"`);
      lines.push(`          maxIterations="${node.agentConfig.maxIterations}"`);
      lines.push(`          timeout="${node.agentConfig.timeout}"`);
      lines.push(`          humanApprovalRequired="${node.agentConfig.humanApprovalRequired}">`);
      lines.push(`          <agent:prompt>${xmlEscape(node.agentConfig.llmPrompt)}</agent:prompt>`);
      node.agentConfig.tools.forEach((tool) => {
        lines.push(`          <agent:tool name="${xmlEscape(tool)}" />`);
      });
      lines.push(`        </agent:config>`);
      lines.push(`      </extensionElements>`);
    }

    // Timer for timerEvents
    if (node.type === "timerEvent") {
      lines.push(`      <timerEventDefinition />`);
    }

    // Inngående og utgående kanter
    edges
      .filter((e) => e.target === node.id)
      .forEach((e) => lines.push(`      <incoming>${xmlEscape(e.id)}</incoming>`));
    edges
      .filter((e) => e.source === node.id)
      .forEach((e) => lines.push(`      <outgoing>${xmlEscape(e.id)}</outgoing>`));

    lines.push(`    </${bpmnTag}>`);
  });

  // Kanter
  edges.forEach((edge) => {
    const condAttr = edge.condition
      ? ` conditionExpression="${xmlEscape(edge.condition)}"`
      : "";
    const nameAttr = edge.label
      ? ` name="${xmlEscape(edge.label)}"`
      : "";
    lines.push(
      `    <sequenceFlow id="${xmlEscape(edge.id)}" sourceRef="${xmlEscape(edge.source)}" targetRef="${xmlEscape(edge.target)}"${nameAttr}${condAttr} />`
    );
  });

  lines.push(`  </process>`);

  // BPMN Diagram (layout-info)
  lines.push(`  <bpmndi:BPMNDiagram id="BPMNDiagram_1">`);
  lines.push(`    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processName}">`);

  nodes.forEach((node) => {
    const isEvent = ["startEvent", "endEvent", "timerEvent", "errorEvent"].includes(node.type);
    const isGateway = ["exclusiveGateway", "parallelGateway"].includes(node.type);
    const w = isEvent ? 36 : isGateway ? 50 : 160;
    const h = isEvent ? 36 : isGateway ? 50 : 60;

    lines.push(`      <bpmndi:BPMNShape id="${xmlEscape(node.id)}_di" bpmnElement="${xmlEscape(node.id)}">`);
    lines.push(`        <dc:Bounds x="${node.position.x}" y="${node.position.y}" width="${w}" height="${h}" />`);
    lines.push(`      </bpmndi:BPMNShape>`);
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  edges.forEach((edge) => {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) return;
    lines.push(`      <bpmndi:BPMNEdge id="${xmlEscape(edge.id)}_di" bpmnElement="${xmlEscape(edge.id)}">`);
    lines.push(`        <di:waypoint x="${src.position.x + 80}" y="${src.position.y + 25}" />`);
    lines.push(`        <di:waypoint x="${tgt.position.x}" y="${tgt.position.y + 25}" />`);
    lines.push(`      </bpmndi:BPMNEdge>`);
  });

  lines.push(`    </bpmndi:BPMNPlane>`);
  lines.push(`  </bpmndi:BPMNDiagram>`);
  lines.push(`</definitions>`);

  return lines.join("\n");
}

// ─── BPMN 2.0 XML import (basic) ───────────────────────

export function importFromBPMNXML(xml: string): {
  nodes: ProcessNode[];
  edges: ProcessEdge[];
} | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");

    if (doc.querySelector("parsererror")) return null;

    const process = doc.querySelector("process");
    if (!process) return null;

    const nodes: ProcessNode[] = [];
    const edges: ProcessEdge[] = [];

    // Parse noder
    const nodeElements = process.querySelectorAll(
      "startEvent, endEvent, serviceTask, userTask, exclusiveGateway, parallelGateway, intermediateCatchEvent, boundaryEvent, task"
    );

    let xPos = 0;
    nodeElements.forEach((el) => {
      const id = el.getAttribute("id") || `node_${nodes.length}`;
      const label = el.getAttribute("name") || el.tagName;
      const typeMap: Record<string, string> = {
        startEvent: "startEvent",
        endEvent: "endEvent",
        serviceTask: "serviceTask",
        userTask: "userTask",
        exclusiveGateway: "exclusiveGateway",
        parallelGateway: "parallelGateway",
        intermediateCatchEvent: "timerEvent",
        boundaryEvent: "errorEvent",
        task: "serviceTask",
      };

      nodes.push({
        id,
        type: (typeMap[el.tagName] || "serviceTask") as ProcessNode["type"],
        label,
        position: { x: xPos, y: 100 },
        metadata: {},
      });

      xPos += 200;
    });

    // Parse kanter
    process.querySelectorAll("sequenceFlow").forEach((el) => {
      edges.push({
        id: el.getAttribute("id") || `edge_${edges.length}`,
        source: el.getAttribute("sourceRef") || "",
        target: el.getAttribute("targetRef") || "",
        condition: el.getAttribute("conditionExpression") || undefined,
        label: el.getAttribute("name") || undefined,
      });
    });

    return { nodes, edges };
  } catch {
    return null;
  }
}

// ─── Last ned som fil ───────────────────────────────────

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

// ─── Hjelpere ───────────────────────────────────────────

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
