"use client";

import { useState, useMemo } from "react";
import {
  Inbox,
  RotateCcw,
  UserPlus,
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DLQEntry } from "../../types";

interface DLQPanelProps {
  entries: DLQEntry[];
  onRetry: (entryId: string) => void;
  onEscalate: (entryId: string) => void;
  onResolve: (entryId: string) => void;
}

const statusConfig = {
  pending: { label: "Venter", color: "bg-amber-100 text-amber-700", icon: Clock },
  retrying: { label: "Prøver igjen", color: "bg-blue-100 text-blue-700", icon: RotateCcw },
  resolved: { label: "Løst", color: "bg-green-100 text-green-700", icon: CheckCircle },
  escalated: { label: "Eskalert", color: "bg-red-100 text-red-700", icon: UserPlus },
};

export function DLQPanel({
  entries,
  onRetry,
  onEscalate,
  onResolve,
}: DLQPanelProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        !search ||
        e.error.toLowerCase().includes(search.toLowerCase()) ||
        e.nodeId.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [entries, search, statusFilter]);

  const stats = useMemo(() => ({
    pending: entries.filter((e) => e.status === "pending").length,
    retrying: entries.filter((e) => e.status === "retrying").length,
    resolved: entries.filter((e) => e.status === "resolved").length,
    escalated: entries.filter((e) => e.status === "escalated").length,
  }), [entries]);

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Inbox className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Dead Letter Queue</h3>
        {stats.pending > 0 && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            {stats.pending} venter
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {(Object.entries(stats) as [keyof typeof stats, number][]).map(
          ([status, count]) => {
            const cfg = statusConfig[status];
            return (
              <div key={status} className="rounded-md border p-2 text-center">
                <p className="text-lg font-bold">{count}</p>
                <p className="text-[10px] text-zinc-500">{cfg.label}</p>
              </div>
            );
          }
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk feilmeldinger..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 rounded-md border px-2 text-xs"
        >
          <option value="all">Alle</option>
          <option value="pending">Venter</option>
          <option value="retrying">Prøver igjen</option>
          <option value="escalated">Eskalert</option>
          <option value="resolved">Løst</option>
        </select>
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {filtered.map((entry) => {
          const cfg = statusConfig[entry.status];
          const StatusIcon = cfg.icon;

          return (
            <div key={entry.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-xs font-medium">{entry.nodeId}</span>
                  <Badge variant="secondary" className={`text-[10px] ${cfg.color}`}>
                    <StatusIcon className="mr-0.5 h-2.5 w-2.5" />
                    {cfg.label}
                  </Badge>
                </div>
                <span className="text-[10px] text-zinc-400">
                  Forsøk: {entry.attempts}/{entry.maxAttempts}
                </span>
              </div>

              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {entry.error}
              </p>

              {entry.stackTrace && (
                <pre className="mt-1.5 max-h-16 overflow-auto rounded bg-zinc-50 p-1.5 text-[10px] text-zinc-500 dark:bg-zinc-900">
                  {entry.stackTrace}
                </pre>
              )}

              {entry.status !== "resolved" && (
                <div className="mt-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px]"
                    onClick={() => onRetry(entry.id)}
                    disabled={entry.status === "retrying"}
                  >
                    <RotateCcw className="mr-0.5 h-2.5 w-2.5" />
                    Prøv igjen
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px]"
                    onClick={() => onEscalate(entry.id)}
                    disabled={entry.status === "escalated"}
                  >
                    <UserPlus className="mr-0.5 h-2.5 w-2.5" />
                    Eskalér
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px]"
                    onClick={() => onResolve(entry.id)}
                  >
                    <CheckCircle className="mr-0.5 h-2.5 w-2.5" />
                    Løst
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-xs text-zinc-400">
          Ingen elementer i køen
        </p>
      )}
    </div>
  );
}
