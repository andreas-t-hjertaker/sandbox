"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plug,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import type { MCPToolConfig, MCPServer } from "../../types";
import { PREDEFINED_MCP_SERVERS } from "../../constants";

interface MCPTabProps {
  mcpConfig: MCPToolConfig | undefined;
  onUpdate: (config: MCPToolConfig) => void;
}

type ConnectionStatus = "idle" | "testing" | "connected" | "error";

const defaultConfig: MCPToolConfig = {
  serverId: "",
  toolName: "",
  parameters: {},
};

export function MCPTab({ mcpConfig, onUpdate }: MCPTabProps) {
  const config = mcpConfig ?? defaultConfig;

  const [serverId, setServerId] = useState(config.serverId);
  const [toolName, setToolName] = useState(config.toolName);
  const [parameters, setParameters] = useState<Record<string, unknown>>(
    config.parameters,
  );
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");

  const servers: MCPServer[] = PREDEFINED_MCP_SERVERS.map((s, i) => ({
    ...s,
    id: `server-${i}`,
  }));

  const selectedServer = servers.find((s) => s.id === serverId) ?? null;
  const selectedTool = selectedServer?.tools.find(
    (t) => t.name === toolName,
  );

  // Sync local state when config changes externally
  useEffect(() => {
    const c = mcpConfig ?? defaultConfig;
    setServerId(c.serverId);
    setToolName(c.toolName);
    setParameters(c.parameters);
  }, [mcpConfig]);

  const handleServerChange = (newServerId: string) => {
    setServerId(newServerId);
    setToolName("");
    setParameters({});
    setConnectionStatus("idle");
    onUpdate({ ...config, serverId: newServerId, toolName: "", parameters: {} });
  };

  const handleToolChange = (newToolName: string) => {
    setToolName(newToolName);
    setParameters({});
    onUpdate({ ...config, serverId, toolName: newToolName, parameters: {} });
  };

  const handleParameterChange = (key: string, value: string) => {
    const updated = { ...parameters, [key]: value };
    setParameters(updated);
    onUpdate({ ...config, serverId, toolName, parameters: updated });
  };

  const handleTestConnection = async () => {
    setConnectionStatus("testing");
    // Simulate connection test
    await new Promise((resolve) => globalThis.setTimeout(resolve, 1500));
    setConnectionStatus(serverId ? "connected" : "error");
  };

  const authStatusIcon = () => {
    if (!selectedServer) return null;

    const authType = selectedServer.authType;
    if (authType === "none") {
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          Ingen autentisering
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1">
        <Plug className="h-3 w-3" />
        {authType.toUpperCase()} p&aring;krevd
      </Badge>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Server selector */}
      <div className="space-y-1.5">
        <Label htmlFor="mcp-server">MCP-server</Label>
        <select
          id="mcp-server"
          value={serverId}
          onChange={(e) => handleServerChange(e.target.value)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">Velg server...</option>
          {servers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.category})
            </option>
          ))}
        </select>
        {selectedServer && (
          <p className="text-xs text-muted-foreground">
            {selectedServer.description}
          </p>
        )}
      </div>

      {/* Auth status */}
      {selectedServer && (
        <div className="flex items-center gap-2">
          {authStatusIcon()}
        </div>
      )}

      <Separator />

      {/* Tool selector */}
      <div className="space-y-1.5">
        <Label htmlFor="mcp-tool">Verkt&oslash;y</Label>
        <select
          id="mcp-tool"
          value={toolName}
          onChange={(e) => handleToolChange(e.target.value)}
          disabled={!selectedServer}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
        >
          <option value="">Velg verkt&oslash;y...</option>
          {selectedServer?.tools.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name} &mdash; {t.description}
            </option>
          ))}
        </select>
      </div>

      {/* Parameter configuration */}
      {selectedTool?.inputSchema && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label>Parametere</Label>
            {Object.entries(
              selectedTool.inputSchema as Record<string, unknown>,
            ).map(([key]) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={`param-${key}`} className="text-xs">
                  {key}
                </Label>
                <Input
                  id={`param-${key}`}
                  value={(parameters[key] as string) ?? ""}
                  onChange={(e) =>
                    handleParameterChange(key, e.target.value)
                  }
                  placeholder={`Verdi for ${key}`}
                />
              </div>
            ))}
          </div>
        </>
      )}

      <Separator />

      {/* Connection test */}
      <div className="space-y-2">
        <Button
          variant="outline"
          onClick={handleTestConnection}
          disabled={!serverId || connectionStatus === "testing"}
          className="w-full gap-1.5"
        >
          {connectionStatus === "testing" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plug className="h-4 w-4" />
          )}
          Test tilkobling
        </Button>

        {connectionStatus === "connected" && (
          <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Tilkobling vellykket
          </div>
        )}
        {connectionStatus === "error" && (
          <div className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
            <XCircle className="h-4 w-4" />
            Tilkobling feilet
          </div>
        )}
      </div>
    </div>
  );
}
