"use client";

/**
 * MCP-node konfigurasjon — verktøyvelger og parametermapping.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Check, AlertCircle } from "lucide-react";
import type { MCPToolConfig } from "../types";
import type { MCPServerDefinition, MCPServerTool } from "../api/mcp-registry";

type MCPNodeConfigProps = {
  currentConfig?: MCPToolConfig;
  server: MCPServerDefinition;
  onSave: (config: MCPToolConfig) => void;
};

type TestStatus = "idle" | "testing" | "success" | "error";

export function MCPNodeConfig({
  currentConfig,
  server,
  onSave,
}: MCPNodeConfigProps) {
  const [selectedTool, setSelectedTool] = useState<MCPServerTool | null>(
    currentConfig
      ? server.tools.find((t) => t.name === currentConfig.toolName) || null
      : null
  );
  const [params, setParams] = useState<Record<string, string>>(
    (currentConfig?.parameters as Record<string, string>) || {}
  );
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");

  function handleSelectTool(tool: MCPServerTool) {
    setSelectedTool(tool);
    // Sett default-parametere
    const defaults: Record<string, string> = {};
    Object.entries(tool.parameters).forEach(([key]) => {
      defaults[key] = params[key] || "";
    });
    setParams(defaults);
  }

  function handleSave() {
    if (!selectedTool) return;
    onSave({
      serverId: server.name,
      toolName: selectedTool.name,
      parameters: params,
      authConfig:
        server.authType !== "none"
          ? { type: server.authType, secretRef: `mcp_${server.name.toLowerCase().replace(/\s/g, "_")}` }
          : undefined,
    });
  }

  async function handleTest() {
    setTestStatus("testing");
    // Simuler test-kall (i produksjon: kall MCP-serveren)
    await new Promise((r) => setTimeout(r, 1500));
    setTestStatus(Math.random() > 0.3 ? "success" : "error");
    setTimeout(() => setTestStatus("idle"), 3000);
  }

  return (
    <div className="space-y-4">
      {/* Server-info */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{server.name}</Badge>
        <Badge variant="outline" className="text-[10px]">
          {server.transport}
        </Badge>
      </div>

      {/* Verktøyvelger */}
      <div className="space-y-2">
        <Label>Velg verktøy</Label>
        <div className="space-y-1">
          {server.tools.map((tool) => (
            <button
              key={tool.name}
              type="button"
              onClick={() => handleSelectTool(tool)}
              className={`w-full rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                selectedTool?.name === tool.name
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent/50"
              }`}
            >
              <p className="font-medium">{tool.name}</p>
              <p className="text-muted-foreground">{tool.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Parameter-konfigurasjon */}
      {selectedTool && Object.keys(selectedTool.parameters).length > 0 && (
        <div className="space-y-2">
          <Label>Parametere</Label>
          {Object.entries(selectedTool.parameters).map(([key, param]) => (
            <div key={key} className="space-y-1">
              <Label className="text-[10px]">
                {key}
                {param.required && <span className="text-destructive"> *</span>}
              </Label>
              <Input
                value={params[key] || ""}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder={param.description}
                className="h-8 text-xs"
              />
            </div>
          ))}
        </div>
      )}

      {/* Auth-info */}
      {server.authType !== "none" && (
        <div className="rounded-md bg-muted/50 p-2 text-[10px] text-muted-foreground">
          Autentisering: {server.authType} — konfigureres i prosjektinnstillinger
        </div>
      )}

      {/* Handlinger */}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={!selectedTool}>
          Lagre
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleTest}
          disabled={!selectedTool || testStatus === "testing"}
        >
          {testStatus === "testing" && (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          )}
          {testStatus === "success" && (
            <Check className="mr-1 h-3 w-3 text-green-500" />
          )}
          {testStatus === "error" && (
            <AlertCircle className="mr-1 h-3 w-3 text-red-500" />
          )}
          {testStatus === "idle" && <Play className="mr-1 h-3 w-3" />}
          Test
        </Button>
      </div>

      {/* JSON-visning */}
      {selectedTool && (
        <details className="text-[10px]">
          <summary className="cursor-pointer text-muted-foreground">
            Vis MCP-konfigurasjon (JSON)
          </summary>
          <pre className="mt-1 rounded-md bg-muted p-2">
            {JSON.stringify(
              {
                serverId: server.name,
                toolName: selectedTool.name,
                parameters: params,
                authConfig:
                  server.authType !== "none"
                    ? { type: server.authType }
                    : undefined,
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}
