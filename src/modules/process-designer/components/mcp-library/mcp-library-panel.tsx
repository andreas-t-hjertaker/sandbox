"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plug,
  GripVertical,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MCP_CATEGORIES, PREDEFINED_MCP_SERVERS } from "../../constants";
import type { MCPServer } from "../../types";

interface MCPLibraryPanelProps {
  onDragStart: (server: Omit<MCPServer, "id">, toolName: string) => void;
  onAddCustomServer: () => void;
}

const statusIcons = {
  active: <CheckCircle className="h-3 w-3 text-green-500" />,
  inactive: <XCircle className="h-3 w-3 text-zinc-400" />,
  error: <AlertCircle className="h-3 w-3 text-red-500" />,
};

export function MCPLibraryPanel({
  onDragStart,
  onAddCustomServer,
}: MCPLibraryPanelProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Alle");
  const [activeTab, setActiveTab] = useState<"library" | "custom">("library");

  const filtered = useMemo(() => {
    return PREDEFINED_MCP_SERVERS.filter((s) => {
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === "Alle" || s.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <div className="flex h-full flex-col border-l bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b p-3">
        <div className="mb-2 flex items-center gap-2">
          <Plug className="h-4 w-4" />
          <h3 className="text-sm font-semibold">MCP Bibliotek</h3>
        </div>

        {/* Tabs */}
        <div className="mb-2 flex gap-1">
          <button
            onClick={() => setActiveTab("library")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === "library"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            MCP Bibliotek
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === "custom"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Egendefinerte
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk integrasjoner..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1 border-b p-2">
        <button
          onClick={() => setActiveCategory("Alle")}
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
            activeCategory === "Alle"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          Alle
        </button>
        {MCP_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
              activeCategory === cat
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Server list */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === "library" ? (
          <div className="space-y-1.5">
            {filtered.map((server) => (
              <div
                key={server.name}
                className="group rounded-lg border p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {statusIcons[server.status]}
                    <span className="text-xs font-medium">{server.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {server.category}
                  </Badge>
                </div>
                <p className="mb-1.5 text-[10px] text-zinc-500">
                  {server.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {server.tools.map((tool) => (
                    <div
                      key={tool.name}
                      draggable
                      onDragStart={() => onDragStart(server, tool.name)}
                      className="flex cursor-grab items-center gap-1 rounded border bg-zinc-50 px-1.5 py-0.5 text-[10px] transition-colors hover:border-blue-300 hover:bg-blue-50 active:cursor-grabbing dark:bg-zinc-800 dark:hover:bg-zinc-700"
                      title={tool.description}
                    >
                      <GripVertical className="h-2.5 w-2.5 text-zinc-400" />
                      {tool.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-xs text-zinc-400">
                Ingen integrasjoner funnet
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-xs text-zinc-500">
              Ingen egendefinerte MCP-servere ennå
            </p>
            <Button size="sm" variant="outline" onClick={onAddCustomServer}>
              <Plus className="mr-1 h-3 w-3" />
              Legg til MCP-server
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
