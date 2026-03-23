"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, RotateCcw } from "lucide-react";
import { NODE_COLORS, AUTONOMY_LABELS } from "../constants";
import type { ProcessNode, AgentConfig } from "../types";

type PropertiesPanelProps = {
  node: ProcessNode | null;
  onUpdate: (nodeId: string, updates: Partial<ProcessNode>) => void;
  onClose: () => void;
  className?: string;
};

type Tab = "general" | "agent" | "mcp" | "advanced";

export function PropertiesPanel({
  node,
  onUpdate,
  onClose,
  className,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  if (!node) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: "Generelt" },
    { id: "agent", label: "Agent" },
    { id: "mcp", label: "MCP" },
    { id: "advanced", label: "Avansert" },
  ];

  const color = NODE_COLORS[node.type];

  return (
    <div className={cn("flex h-full flex-col border-l border-border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium">{node.label}</span>
          <Badge variant="outline" className="text-[10px]">
            {node.type}
          </Badge>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 px-2 py-2 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "general" && (
          <GeneralTab node={node} onUpdate={onUpdate} />
        )}
        {activeTab === "agent" && (
          <AgentTab node={node} onUpdate={onUpdate} />
        )}
        {activeTab === "mcp" && (
          <MCPTab node={node} />
        )}
        {activeTab === "advanced" && (
          <AdvancedTab node={node} />
        )}
      </div>
    </div>
  );
}

// ─── General Tab ────────────────────────────────────────

function GeneralTab({
  node,
  onUpdate,
}: {
  node: ProcessNode;
  onUpdate: (id: string, u: Partial<ProcessNode>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="node-label">Navn</Label>
        <Input
          id="node-label"
          value={node.label}
          onChange={(e) => onUpdate(node.id, { label: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>BPMN-type</Label>
        <Badge variant="secondary">{node.type}</Badge>
      </div>

      <div className="space-y-2">
        <Label>Posisjon</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-[10px] text-muted-foreground">X</Label>
            <Input
              type="number"
              value={node.position.x}
              onChange={(e) =>
                onUpdate(node.id, {
                  position: { ...node.position, x: Number(e.target.value) },
                })
              }
            />
          </div>
          <div className="flex-1">
            <Label className="text-[10px] text-muted-foreground">Y</Label>
            <Input
              type="number"
              value={node.position.y}
              onChange={(e) =>
                onUpdate(node.id, {
                  position: { ...node.position, y: Number(e.target.value) },
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Agent Tab ──────────────────────────────────────────

function AgentTab({
  node,
  onUpdate,
}: {
  node: ProcessNode;
  onUpdate: (id: string, u: Partial<ProcessNode>) => void;
}) {
  const config = node.agentConfig;
  const isTask = node.type === "serviceTask" || node.type === "userTask";

  if (!isTask) {
    return (
      <p className="text-sm text-muted-foreground">
        Agentkonfigurasjon er kun tilgjengelig for serviceTask og userTask.
      </p>
    );
  }

  function updateAgent(updates: Partial<AgentConfig>) {
    const current = node.agentConfig || {
      autonomyLevel: 1 as const,
      llmPrompt: "",
      tools: [],
      maxIterations: 10,
      timeout: 30000,
      humanApprovalRequired: true,
    };
    onUpdate(node.id, {
      agentConfig: { ...current, ...updates },
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Autonominivå</Label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="1"
            max="5"
            value={config?.autonomyLevel || 1}
            onChange={(e) =>
              updateAgent({
                autonomyLevel: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
              })
            }
            className="flex-1"
          />
          <Badge variant="outline" className="min-w-[120px] text-center text-[10px]">
            {AUTONOMY_LABELS[(config?.autonomyLevel || 1) - 1]}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-prompt">LLM-prompt</Label>
        <Textarea
          id="agent-prompt"
          value={config?.llmPrompt || ""}
          onChange={(e) => updateAgent({ llmPrompt: e.target.value })}
          placeholder="Beskriv hva agenten skal gjøre..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-tools">Verktøy (kommaseparert)</Label>
        <Input
          id="agent-tools"
          value={config?.tools?.join(", ") || ""}
          onChange={(e) =>
            updateAgent({
              tools: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
            })
          }
          placeholder="tripletex, ocr, bank-api"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Maks iterasjoner</Label>
          <Input
            type="number"
            value={config?.maxIterations || 10}
            onChange={(e) => updateAgent({ maxIterations: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Timeout (ms)</Label>
          <Input
            type="number"
            value={config?.timeout || 30000}
            onChange={(e) => updateAgent({ timeout: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="approval-required"
          checked={config?.humanApprovalRequired ?? true}
          onChange={(e) => updateAgent({ humanApprovalRequired: e.target.checked })}
        />
        <Label htmlFor="approval-required" className="text-xs">
          Krever manuell godkjenning
        </Label>
      </div>

      {!config && (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            updateAgent({
              autonomyLevel: 1,
              llmPrompt: "",
              tools: [],
              maxIterations: 10,
              timeout: 30000,
              humanApprovalRequired: true,
            })
          }
        >
          <RotateCcw className="mr-2 h-3 w-3" />
          Tilbakestill til AI-forslag
        </Button>
      )}
    </div>
  );
}

// ─── MCP Tab ────────────────────────────────────────────

function MCPTab({ node }: { node: ProcessNode }) {
  const config = node.mcpConfig;
  return (
    <div className="space-y-4">
      {config ? (
        <>
          <div className="space-y-2">
            <Label>MCP-server</Label>
            <Badge variant="secondary">{config.serverId}</Badge>
          </div>
          <div className="space-y-2">
            <Label>Verktøy</Label>
            <Badge variant="outline">{config.toolName}</Badge>
          </div>
          <div className="space-y-2">
            <Label>Parametere</Label>
            <pre className="rounded-md bg-muted p-2 text-[10px]">
              {JSON.stringify(config.parameters, null, 2)}
            </pre>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Ingen MCP-konfigurasjon. Dra et verktøy fra MCP-biblioteket til denne noden.
        </p>
      )}
    </div>
  );
}

// ─── Advanced Tab ───────────────────────────────────────

function AdvancedTab({ node }: { node: ProcessNode }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Node-ID</Label>
        <code className="block rounded-md bg-muted px-2 py-1 text-xs">
          {node.id}
        </code>
      </div>
      <div className="space-y-2">
        <Label>JSON-definisjon</Label>
        <pre className="max-h-[400px] overflow-auto rounded-md bg-muted p-2 text-[10px]">
          {JSON.stringify(node, null, 2)}
        </pre>
      </div>
    </div>
  );
}
