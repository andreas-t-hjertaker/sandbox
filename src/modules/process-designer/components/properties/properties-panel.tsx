"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, Settings2, Bot, Plug, Code2 } from "lucide-react";
import type { ProcessNode } from "../../types";
import { GeneralTab } from "./general-tab";
import { AgentTab } from "./agent-tab";
import { MCPTab } from "./mcp-tab";
import { AdvancedTab } from "./advanced-tab";

interface PropertiesPanelProps {
  node: ProcessNode | null;
  onUpdate: (nodeId: string, updates: Partial<ProcessNode>) => void;
  onClose: () => void;
}

const TABS = [
  { key: "general", label: "Generelt", icon: Settings2 },
  { key: "agent", label: "Agent", icon: Bot },
  { key: "mcp", label: "MCP", icon: Plug },
  { key: "advanced", label: "Avansert", icon: Code2 },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function PropertiesPanel({
  node,
  onUpdate,
  onClose,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Settings2 className="h-10 w-10 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Ingen node valgt
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Klikk p&aring; en node i canvas for &aring; redigere egenskaper
          </p>
        </div>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<ProcessNode>) => {
    onUpdate(node.id, updates);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {node.label}
          </h3>
          <p className="text-xs text-muted-foreground">{node.type}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tab buttons */}
      <div className="flex border-b px-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === key
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "general" && (
          <GeneralTab node={node} onUpdate={handleUpdate} />
        )}
        {activeTab === "agent" && (
          <AgentTab
            agentConfig={node.agentConfig}
            onUpdate={(config) =>
              handleUpdate({ agentConfig: config })
            }
          />
        )}
        {activeTab === "mcp" && (
          <MCPTab
            mcpConfig={node.mcpConfig}
            onUpdate={(config) =>
              handleUpdate({ mcpConfig: config })
            }
          />
        )}
        {activeTab === "advanced" && <AdvancedTab node={node} />}
      </div>
    </div>
  );
}
