"use client";

import { Shield, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AutonomyLevel, ProcessNode } from "../../types";
import { AutonomyLevelLabels } from "../../types";

interface AutonomyConfigProps {
  nodes: ProcessNode[];
  defaultLevel: AutonomyLevel;
  onDefaultChange: (level: AutonomyLevel) => void;
  onNodeLevelChange: (nodeId: string, level: AutonomyLevel) => void;
  confidenceThreshold: number;
  onThresholdChange: (threshold: number) => void;
}

const levelColors: Record<AutonomyLevel, string> = {
  1: "bg-zinc-100 text-zinc-700 border-zinc-300",
  2: "bg-blue-100 text-blue-700 border-blue-300",
  3: "bg-amber-100 text-amber-700 border-amber-300",
  4: "bg-orange-100 text-orange-700 border-orange-300",
  5: "bg-red-100 text-red-700 border-red-300",
};

const riskIndicators: Record<AutonomyLevel, { label: string; color: string }> = {
  1: { label: "Ingen risiko", color: "text-green-600" },
  2: { label: "Lav risiko", color: "text-blue-600" },
  3: { label: "Middels risiko", color: "text-amber-600" },
  4: { label: "Høy risiko", color: "text-orange-600" },
  5: { label: "Svært høy risiko", color: "text-red-600" },
};

export function AutonomyConfig({
  nodes,
  defaultLevel,
  onDefaultChange,
  onNodeLevelChange,
  confidenceThreshold,
  onThresholdChange,
}: AutonomyConfigProps) {
  const agentNodes = nodes.filter((n) => n.agentConfig);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Graderbar autonomi</h3>
      </div>

      {/* Default level */}
      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-500">
          Standard autonominivå
        </label>
        <div className="grid grid-cols-5 gap-1">
          {([1, 2, 3, 4, 5] as AutonomyLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => onDefaultChange(level)}
              className={`rounded-md border p-2 text-center text-[10px] font-medium transition-colors ${
                defaultLevel === level
                  ? levelColors[level]
                  : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              }`}
            >
              <div className="text-lg">{level}</div>
              <div className="mt-0.5 leading-tight">
                {AutonomyLevelLabels[level].split(" ").slice(0, 2).join(" ")}
              </div>
            </button>
          ))}
        </div>
        <p className={`mt-1 text-[10px] ${riskIndicators[defaultLevel].color}`}>
          <AlertTriangle className="mr-0.5 inline h-2.5 w-2.5" />
          {riskIndicators[defaultLevel].label}: {AutonomyLevelLabels[defaultLevel]}
        </p>
      </div>

      {/* Confidence threshold */}
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">
          Eskalerings-terskel (confidence)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            value={confidenceThreshold}
            onChange={(e) => onThresholdChange(Number(e.target.value))}
            className="flex-1"
          />
          <span className="w-10 text-right text-xs font-medium">
            {confidenceThreshold}%
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-zinc-400">
          <Info className="mr-0.5 inline h-2.5 w-2.5" />
          Under denne terskelen eskaleres til human-in-the-loop
        </p>
      </div>

      {/* Per-node overrides */}
      <div>
        <h4 className="mb-2 text-xs font-medium text-zinc-500">
          Per-node overstyring
        </h4>
        <div className="space-y-1.5">
          {agentNodes.map((node) => {
            const level = node.agentConfig!.autonomyLevel;
            return (
              <div
                key={node.id}
                className="flex items-center justify-between rounded-md border p-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{node.label}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {node.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  {([1, 2, 3, 4, 5] as AutonomyLevel[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => onNodeLevelChange(node.id, l)}
                      className={`h-6 w-6 rounded text-[10px] font-bold transition-colors ${
                        level === l
                          ? levelColors[l]
                          : "text-zinc-300 hover:text-zinc-500 dark:text-zinc-600"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {agentNodes.length === 0 && (
            <p className="py-4 text-center text-xs text-zinc-400">
              Ingen agent-noder konfigurert
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
