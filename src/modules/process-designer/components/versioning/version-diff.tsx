"use client";

import { useState } from "react";
import {
  GitBranch,
  RotateCcw,
  Plus,
  Minus,
  ArrowRight,
  Clock,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProcessDefinition, ProcessNode, ProcessEdge } from "../../types";

interface VersionEntry {
  version: number;
  comment: string;
  createdBy: string;
  createdAt: string;
  definition: ProcessDefinition;
}

interface VersionDiffProps {
  versions: VersionEntry[];
  currentVersion: number;
  onRestore: (version: number) => void;
  onCreateVersion: (comment: string) => void;
}

interface DiffItem {
  type: "added" | "removed" | "changed";
  kind: "node" | "edge";
  id: string;
  label: string;
  details?: string;
}

function computeDiff(
  oldDef: ProcessDefinition,
  newDef: ProcessDefinition
): DiffItem[] {
  const diffs: DiffItem[] = [];

  const oldNodeIds = new Set(oldDef.nodes.map((n) => n.id));
  const newNodeIds = new Set(newDef.nodes.map((n) => n.id));
  const oldEdgeIds = new Set(oldDef.edges.map((e) => e.id));
  const newEdgeIds = new Set(newDef.edges.map((e) => e.id));

  // Added nodes
  for (const node of newDef.nodes) {
    if (!oldNodeIds.has(node.id)) {
      diffs.push({
        type: "added",
        kind: "node",
        id: node.id,
        label: node.label,
        details: node.type,
      });
    }
  }

  // Removed nodes
  for (const node of oldDef.nodes) {
    if (!newNodeIds.has(node.id)) {
      diffs.push({
        type: "removed",
        kind: "node",
        id: node.id,
        label: node.label,
        details: node.type,
      });
    }
  }

  // Changed nodes
  for (const newNode of newDef.nodes) {
    if (oldNodeIds.has(newNode.id)) {
      const oldNode = oldDef.nodes.find((n) => n.id === newNode.id)!;
      if (JSON.stringify(oldNode) !== JSON.stringify(newNode)) {
        diffs.push({
          type: "changed",
          kind: "node",
          id: newNode.id,
          label: newNode.label,
          details: "Konfigurert endret",
        });
      }
    }
  }

  // Added edges
  for (const edge of newDef.edges) {
    if (!oldEdgeIds.has(edge.id)) {
      diffs.push({
        type: "added",
        kind: "edge",
        id: edge.id,
        label: edge.label || `${edge.source} → ${edge.target}`,
      });
    }
  }

  // Removed edges
  for (const edge of oldDef.edges) {
    if (!newEdgeIds.has(edge.id)) {
      diffs.push({
        type: "removed",
        kind: "edge",
        id: edge.id,
        label: edge.label || `${edge.source} → ${edge.target}`,
      });
    }
  }

  return diffs;
}

const diffColors = {
  added: "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300",
  removed: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300",
  changed: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300",
};

const diffIcons = {
  added: Plus,
  removed: Minus,
  changed: ArrowRight,
};

export function VersionDiff({
  versions,
  currentVersion,
  onRestore,
  onCreateVersion,
}: VersionDiffProps) {
  const [compareFrom, setCompareFrom] = useState<number | null>(
    versions.length >= 2 ? versions[versions.length - 2].version : null
  );
  const [compareTo, setCompareTo] = useState<number>(currentVersion);
  const [newComment, setNewComment] = useState("");

  const diff =
    compareFrom != null
      ? (() => {
          const fromDef = versions.find((v) => v.version === compareFrom)
            ?.definition;
          const toDef = versions.find((v) => v.version === compareTo)
            ?.definition;
          return fromDef && toDef ? computeDiff(fromDef, toDef) : [];
        })()
      : [];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GitBranch className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Versjonshistorikk</h3>
      </div>

      {/* Create new version */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Versjonskommentar..."
          className="flex-1 rounded-md border px-2 py-1 text-xs"
        />
        <Button
          size="sm"
          onClick={() => {
            onCreateVersion(newComment);
            setNewComment("");
          }}
          disabled={!newComment.trim()}
        >
          <Save className="mr-1 h-3 w-3" />
          Lagre versjon
        </Button>
      </div>

      {/* Version timeline */}
      <div className="space-y-1">
        {versions
          .slice()
          .reverse()
          .map((v) => (
            <div
              key={v.version}
              className={`flex items-center gap-2 rounded-md border p-2 transition-colors ${
                v.version === currentVersion
                  ? "border-blue-300 bg-blue-50 dark:bg-blue-950/20"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold dark:bg-zinc-800">
                v{v.version}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">{v.comment}</p>
                <p className="text-[10px] text-zinc-400">
                  {v.createdBy} &middot; {v.createdAt}
                </p>
              </div>
              {v.version === currentVersion ? (
                <Badge variant="secondary" className="text-[10px]">
                  Nåværende
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px]"
                  onClick={() => onRestore(v.version)}
                >
                  <RotateCcw className="mr-0.5 h-2.5 w-2.5" />
                  Gjenopprett
                </Button>
              )}
            </div>
          ))}
      </div>

      {/* Diff comparison */}
      {versions.length >= 2 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-zinc-500">
            Sammenlign versjoner
          </h4>
          <div className="mb-2 flex items-center gap-2">
            <select
              value={compareFrom ?? ""}
              onChange={(e) => setCompareFrom(Number(e.target.value))}
              className="h-7 rounded-md border px-2 text-xs"
            >
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  v{v.version}
                </option>
              ))}
            </select>
            <ArrowRight className="h-3 w-3 text-zinc-400" />
            <select
              value={compareTo}
              onChange={(e) => setCompareTo(Number(e.target.value))}
              className="h-7 rounded-md border px-2 text-xs"
            >
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  v{v.version}
                </option>
              ))}
            </select>
          </div>

          {diff.length > 0 ? (
            <div className="space-y-1">
              {diff.map((d, i) => {
                const Icon = diffIcons[d.type];
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-md border p-2 ${diffColors[d.type]}`}
                  >
                    <Icon className="h-3 w-3" />
                    <Badge variant="secondary" className="text-[10px]">
                      {d.kind}
                    </Badge>
                    <span className="text-xs">{d.label}</span>
                    {d.details && (
                      <span className="text-[10px] opacity-70">
                        ({d.details})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-zinc-400">
              Ingen forskjeller mellom valgte versjoner
            </p>
          )}
        </div>
      )}
    </div>
  );
}
