"use client";

/**
 * MCP Tool Library — sidepanel med tilgjengelige MCP-servere.
 *
 * Viser kategoriserte MCP-integrasjoner som kan dras inn i prosessen.
 */

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, ExternalLink } from "lucide-react";
import { SEED_MCP_SERVERS, type MCPServerDefinition } from "../api/mcp-registry";

type MCPLibraryProps = {
  servers?: (MCPServerDefinition & { id: string })[];
  onSelectServer?: (server: MCPServerDefinition, toolName: string) => void;
  className?: string;
};

type Tab = "library" | "custom";

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  inactive: "bg-yellow-500",
  error: "bg-red-500",
};

const authLabels: Record<string, string> = {
  none: "Offentlig",
  "api-key": "API-nøkkel",
  oauth: "OAuth",
  bearer: "Bearer",
};

export function MCPLibrary({
  servers,
  onSelectServer,
  className,
}: MCPLibraryProps) {
  const [activeTab, setActiveTab] = useState<Tab>("library");
  const [search, setSearch] = useState("");
  const [expandedServer, setExpandedServer] = useState<string | null>(null);

  // Bruk seed-data som fallback
  const allServers = useMemo(() => {
    if (servers && servers.length > 0) return servers;
    return SEED_MCP_SERVERS.map((s, i) => ({ ...s, id: `seed-${i}` }));
  }, [servers]);

  // Filtrer og kategoriser
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allServers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tools.some((t) => t.name.toLowerCase().includes(q))
    );
  }, [allServers, search]);

  const categories = useMemo(() => {
    const cats = new Map<string, (MCPServerDefinition & { id: string })[]>();
    filtered.forEach((s) => {
      if (!cats.has(s.category)) cats.set(s.category, []);
      cats.get(s.category)!.push(s);
    });
    return cats;
  }, [filtered]);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("library")}
          className={cn(
            "flex-1 px-3 py-2 text-xs font-medium",
            activeTab === "library"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground"
          )}
        >
          MCP Bibliotek
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("custom")}
          className={cn(
            "flex-1 px-3 py-2 text-xs font-medium",
            activeTab === "custom"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground"
          )}
        >
          Egendefinerte
        </button>
      </div>

      {/* Søk */}
      <div className="relative px-3 py-2">
        <Search className="absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søk MCP-servere..."
          className="h-8 pl-8 text-xs"
        />
      </div>

      {/* Server-liste */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {activeTab === "library" ? (
          Array.from(categories.entries()).map(([category, servers]) => (
            <div key={category} className="mb-4">
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </h3>
              <div className="space-y-1.5">
                {servers.map((server) => (
                  <MCPServerCard
                    key={server.id}
                    server={server}
                    expanded={expandedServer === server.id}
                    onToggle={() =>
                      setExpandedServer(
                        expandedServer === server.id ? null : server.id
                      )
                    }
                    onSelectTool={(toolName) =>
                      onSelectServer?.(server, toolName)
                    }
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="mb-2 text-sm text-muted-foreground">
                Legg til egne MCP-servere
              </p>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-3 w-3" />
                Legg til server
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MCPServerCard({
  server,
  expanded,
  onToggle,
  onSelectTool,
}: {
  server: MCPServerDefinition & { id: string };
  expanded: boolean;
  onToggle: () => void;
  onSelectTool: (toolName: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <div
          className={cn("h-2 w-2 rounded-full", statusColors[server.status])}
        />
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs font-medium">{server.name}</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {server.description}
          </p>
        </div>
        <Badge variant="outline" className="text-[8px] shrink-0">
          {authLabels[server.authType]}
        </Badge>
      </button>

      {expanded && (
        <div className="border-t border-border px-3 py-2">
          <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">
            Verktøy ({server.tools.length})
          </p>
          <div className="space-y-1">
            {server.tools.map((tool) => (
              <div
                key={tool.name}
                className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1"
              >
                <div>
                  <p className="text-[10px] font-medium">{tool.name}</p>
                  <p className="text-[9px] text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => onSelectTool(tool.name)}
                  title="Legg til i prosess"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground">
            <ExternalLink className="h-2.5 w-2.5" />
            <span className="truncate">{server.url}</span>
          </div>
        </div>
      )}
    </div>
  );
}
