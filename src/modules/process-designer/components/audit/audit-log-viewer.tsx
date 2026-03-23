"use client";

import { useState, useMemo } from "react";
import {
  Search,
  FileText,
  Download,
  Filter,
  User,
  Bot,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AuditLogEntry } from "../../types";

interface AuditLogViewerProps {
  entries: AuditLogEntry[];
  onExportCsv: () => void;
  onExportPdf: () => void;
}

export function AuditLogViewer({
  entries,
  onExportCsv,
  onExportPdf,
}: AuditLogViewerProps) {
  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        !search ||
        e.action.toLowerCase().includes(search.toLowerCase()) ||
        e.nodeId.toLowerCase().includes(search.toLowerCase());
      const matchesActor =
        actorFilter === "all" || e.actor.type === actorFilter;
      return matchesSearch && matchesActor;
    });
  }, [entries, search, actorFilter]);

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="text-sm font-semibold">Revisjonsspor</h3>
          <Badge variant="secondary" className="text-[10px]">
            {entries.length} oppføringer
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onExportCsv}>
            <Download className="mr-1 h-3 w-3" />
            CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={onExportPdf}>
            <Download className="mr-1 h-3 w-3" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk i hendelser..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <select
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          className="h-8 rounded-md border px-2 text-xs"
        >
          <option value="all">Alle aktører</option>
          <option value="user">Brukere</option>
          <option value="agent">Agenter</option>
        </select>
      </div>

      {/* Log entries */}
      <div className="space-y-1">
        {filtered.map((entry) => {
          const isExpanded = expandedId === entry.id;
          return (
            <div key={entry.id} className="rounded-md border">
              <button
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="flex w-full items-center gap-2 p-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 shrink-0 text-zinc-400" />
                ) : (
                  <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
                )}

                {entry.actor.type === "user" ? (
                  <User className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                ) : (
                  <Bot className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                )}

                <span className="flex-1 truncate text-xs font-medium">
                  {entry.action}
                </span>

                <Badge variant="secondary" className="text-[10px]">
                  {entry.nodeId}
                </Badge>

                {entry.autonomyLevel && (
                  <span className="text-[10px] text-zinc-400">
                    Nivå {entry.autonomyLevel}
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className="border-t bg-zinc-50 p-3 dark:bg-zinc-900/50">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="font-medium text-zinc-500">Aktør:</span>
                      <p>
                        {entry.actor.type} ({entry.actor.id})
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-zinc-500">Node:</span>
                      <p>{entry.nodeId}</p>
                    </div>
                  </div>

                  {entry.reasoning && (
                    <div className="mt-2">
                      <span className="text-[10px] font-medium text-zinc-500">
                        Resonnering:
                      </span>
                      <p className="mt-0.5 rounded bg-white p-1.5 text-[10px] dark:bg-zinc-800">
                        {entry.reasoning}
                      </p>
                    </div>
                  )}

                  {Object.keys(entry.input).length > 0 && (
                    <div className="mt-2">
                      <span className="text-[10px] font-medium text-zinc-500">
                        Input:
                      </span>
                      <pre className="mt-0.5 max-h-24 overflow-auto rounded bg-white p-1.5 text-[10px] dark:bg-zinc-800">
                        {JSON.stringify(entry.input, null, 2)}
                      </pre>
                    </div>
                  )}

                  {Object.keys(entry.output).length > 0 && (
                    <div className="mt-2">
                      <span className="text-[10px] font-medium text-zinc-500">
                        Output:
                      </span>
                      <pre className="mt-0.5 max-h-24 overflow-auto rounded bg-white p-1.5 text-[10px] dark:bg-zinc-800">
                        {JSON.stringify(entry.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-xs text-zinc-400">
          Ingen hendelser funnet
        </p>
      )}
    </div>
  );
}
