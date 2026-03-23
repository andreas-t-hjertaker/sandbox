import type { ProcessDefinition, ProcessNode, ProcessEdge } from "../types";

// ─── BPMN 2.0 XML Export ────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function nodeTypeToElement(type: ProcessNode["type"]): string {
  const mapping: Record<string, string> = {
    startEvent: "bpmn:startEvent",
    endEvent: "bpmn:endEvent",
    serviceTask: "bpmn:serviceTask",
    userTask: "bpmn:userTask",
    exclusiveGateway: "bpmn:exclusiveGateway",
    parallelGateway: "bpmn:parallelGateway",
    timerEvent: "bpmn:intermediateCatchEvent",
    errorEvent: "bpmn:boundaryEvent",
  };
  return mapping[type] || "bpmn:task";
}

export function exportToBPMNXml(process: ProcessDefinition): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"'
  );
  lines.push(
    '  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"'
  );
  lines.push(
    '  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"'
  );
  lines.push(
    '  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"'
  );
  lines.push(
    '  xmlns:pad="http://processagentdesigner.io/extensions"'
  );
  lines.push(`  id="Definitions_1" targetNamespace="http://processagentdesigner.io">`);

  // Process
  lines.push(`  <bpmn:process id="${escapeXml(process.id)}" name="${escapeXml(process.name)}" isExecutable="true">`);

  // Nodes
  for (const node of process.nodes) {
    const element = nodeTypeToElement(node.type);
    const incoming = process.edges
      .filter((e) => e.target === node.id)
      .map((e) => `      <bpmn:incoming>${escapeXml(e.id)}</bpmn:incoming>`)
      .join("\n");
    const outgoing = process.edges
      .filter((e) => e.source === node.id)
      .map((e) => `      <bpmn:outgoing>${escapeXml(e.id)}</bpmn:outgoing>`)
      .join("\n");

    lines.push(`    <${element} id="${escapeXml(node.id)}" name="${escapeXml(node.label)}">`);
    if (incoming) lines.push(incoming);
    if (outgoing) lines.push(outgoing);

    // Agent config as extension element
    if (node.agentConfig) {
      lines.push("      <bpmn:extensionElements>");
      lines.push(`        <pad:agentConfig autonomyLevel="${node.agentConfig.autonomyLevel}" timeout="${node.agentConfig.timeout}" humanApproval="${node.agentConfig.humanApprovalRequired}">`);
      lines.push(`          <pad:prompt>${escapeXml(node.agentConfig.llmPrompt)}</pad:prompt>`);
      for (const tool of node.agentConfig.tools) {
        lines.push(`          <pad:tool name="${escapeXml(tool)}" />`);
      }
      lines.push("        </pad:agentConfig>");
      lines.push("      </bpmn:extensionElements>");
    }

    if (node.mcpConfig) {
      if (!node.agentConfig) lines.push("      <bpmn:extensionElements>");
      lines.push(`        <pad:mcpConfig serverId="${escapeXml(node.mcpConfig.serverId)}" toolName="${escapeXml(node.mcpConfig.toolName)}" />`);
      if (!node.agentConfig) lines.push("      </bpmn:extensionElements>");
    }

    lines.push(`    </${element}>`);
  }

  // Edges
  for (const edge of process.edges) {
    lines.push(
      `    <bpmn:sequenceFlow id="${escapeXml(edge.id)}" sourceRef="${escapeXml(edge.source)}" targetRef="${escapeXml(edge.target)}"${edge.label ? ` name="${escapeXml(edge.label)}"` : ""}>`
    );
    if (edge.condition) {
      lines.push(
        `      <bpmn:conditionExpression>${escapeXml(edge.condition)}</bpmn:conditionExpression>`
      );
    }
    lines.push("    </bpmn:sequenceFlow>");
  }

  lines.push("  </bpmn:process>");

  // Diagram
  lines.push(`  <bpmndi:BPMNDiagram id="BPMNDiagram_1">`);
  lines.push(`    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${escapeXml(process.id)}">`);

  for (const node of process.nodes) {
    const width = node.type.includes("Gateway") ? 50 : node.type.includes("Event") || node.type === "startEvent" || node.type === "endEvent" ? 36 : 180;
    const height = node.type.includes("Gateway") ? 50 : node.type.includes("Event") || node.type === "startEvent" || node.type === "endEvent" ? 36 : 60;
    lines.push(`      <bpmndi:BPMNShape id="${escapeXml(node.id)}_di" bpmnElement="${escapeXml(node.id)}">`);
    lines.push(`        <dc:Bounds x="${node.position.x}" y="${node.position.y}" width="${width}" height="${height}" />`);
    lines.push("      </bpmndi:BPMNShape>");
  }

  for (const edge of process.edges) {
    const sourceNode = process.nodes.find((n) => n.id === edge.source);
    const targetNode = process.nodes.find((n) => n.id === edge.target);
    if (sourceNode && targetNode) {
      lines.push(`      <bpmndi:BPMNEdge id="${escapeXml(edge.id)}_di" bpmnElement="${escapeXml(edge.id)}">`);
      lines.push(`        <di:waypoint x="${sourceNode.position.x + 90}" y="${sourceNode.position.y + 30}" />`);
      lines.push(`        <di:waypoint x="${targetNode.position.x}" y="${targetNode.position.y + 30}" />`);
      lines.push("      </bpmndi:BPMNEdge>");
    }
  }

  lines.push("    </bpmndi:BPMNPlane>");
  lines.push("  </bpmndi:BPMNDiagram>");
  lines.push("</bpmn:definitions>");

  return lines.join("\n");
}

// ─── JSON Export ────────────────────────────────────────────────────

export function exportToJson(process: ProcessDefinition): string {
  return JSON.stringify(process, null, 2);
}

// ─── BPMN 2.0 XML Import (basic) ───────────────────────────────────

interface ParsedBPMN {
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  name: string;
}

export function importFromBPMNXml(xml: string): ParsedBPMN {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const nodes: ProcessNode[] = [];
  const edges: ProcessEdge[] = [];

  const bpmnTypeMap: Record<string, ProcessNode["type"]> = {
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

  // Parse process name
  const processEl = doc.querySelector("process");
  const name = processEl?.getAttribute("name") || "Imported Process";

  // Parse nodes
  for (const [localName, nodeType] of Object.entries(bpmnTypeMap)) {
    const elements = doc.getElementsByTagNameNS(
      "http://www.omg.org/spec/BPMN/20100524/MODEL",
      localName
    );
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const id = el.getAttribute("id") || `node-${nodes.length}`;
      const label = el.getAttribute("name") || id;

      // Try to get position from diagram
      let x = nodes.length * 200;
      let y = 150;
      const shape = doc.querySelector(`[bpmnElement="${id}"]`);
      if (shape) {
        const bounds = shape.querySelector("Bounds");
        if (bounds) {
          x = parseFloat(bounds.getAttribute("x") || "0");
          y = parseFloat(bounds.getAttribute("y") || "0");
        }
      }

      nodes.push({
        id,
        type: nodeType,
        label,
        position: { x, y },
        metadata: {},
      });
    }
  }

  // Parse edges
  const flows = doc.getElementsByTagNameNS(
    "http://www.omg.org/spec/BPMN/20100524/MODEL",
    "sequenceFlow"
  );
  for (let i = 0; i < flows.length; i++) {
    const el = flows[i];
    const id = el.getAttribute("id") || `edge-${edges.length}`;
    const source = el.getAttribute("sourceRef") || "";
    const target = el.getAttribute("targetRef") || "";
    const label = el.getAttribute("name") || undefined;

    const conditionEl = el.querySelector("conditionExpression");
    const condition = conditionEl?.textContent || undefined;

    edges.push({ id, source, target, label, condition });
  }

  return { nodes, edges, name };
}

// ─── JSON Import ────────────────────────────────────────────────────

export function importFromJson(json: string): ProcessDefinition {
  return JSON.parse(json) as ProcessDefinition;
}

// ─── Download helper ────────────────────────────────────────────────

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function copyToClipboard(content: string): Promise<void> {
  return navigator.clipboard.writeText(content);
}
