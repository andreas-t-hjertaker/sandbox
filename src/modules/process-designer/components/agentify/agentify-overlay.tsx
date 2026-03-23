"use client";

import { useState } from "react";
import {
  Bot,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AgentifySuggestion, AutonomyLevel } from "../../types";
import { AutonomyLevelLabels } from "../../types";

interface AgentifyOverlayProps {
  suggestions: AgentifySuggestion[];
  onAccept: (nodeId: string) => void;
  onReject: (nodeId: string) => void;
  onAcceptAll: () => void;
  onAdjust: (nodeId: string, updates: Partial<AgentifySuggestion>) => void;
  isAnalyzing?: boolean;
}

const riskColors = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

const riskLabels = {
  low: "Lav risiko",
  medium: "Middels risiko",
  high: "Høy risiko",
};

export function AgentifyOverlay({
  suggestions,
  onAccept,
  onReject,
  onAcceptAll,
  onAdjust,
  isAnalyzing,
}: AgentifyOverlayProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pending = suggestions.filter((s) => s.accepted === undefined);
  const accepted = suggestions.filter((s) => s.accepted === true);
  const rejected = suggestions.filter((s) => s.accepted === false);

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h3 className="text-sm font-semibold">Agentifisering</h3>
        </div>
        {pending.length > 0 && (
          <Button size="sm" onClick={onAcceptAll}>
            <Check className="mr-1 h-3 w-3" />
            Godkjenn alle ({pending.length})
          </Button>
        )}
      </div>

      {isAnalyzing && (
        <div className="flex items-center gap-2 rounded-md border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/30">
          <Bot className="h-4 w-4 animate-pulse text-purple-500" />
          <span className="text-xs text-purple-700 dark:text-purple-300">
            AI analyserer prosessen og foreslår agentifisering...
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-2 text-[10px]">
        <Badge variant="secondary">
          {pending.length} venter
        </Badge>
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          {accepted.length} godkjent
        </Badge>
        <Badge variant="secondary" className="bg-red-100 text-red-700">
          {rejected.length} avvist
        </Badge>
      </div>

      {/* Suggestions */}
      <div className="space-y-2">
        {suggestions.map((suggestion) => {
          const isExpanded = expandedId === suggestion.nodeId;

          return (
            <div
              key={suggestion.nodeId}
              className={`rounded-lg border transition-colors ${
                suggestion.accepted === true
                  ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                  : suggestion.accepted === false
                    ? "border-red-200 bg-red-50/50 opacity-60 dark:border-red-800 dark:bg-red-950/20"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : suggestion.nodeId)
                }
                className="flex w-full items-center gap-2 p-3 text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 shrink-0 text-zinc-400" />
                ) : (
                  <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
                )}
                <Bot className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                <span className="flex-1 text-xs font-medium">
                  {suggestion.nodeId}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${riskColors[suggestion.riskLevel]}`}
                >
                  {riskLabels[suggestion.riskLevel]}
                </Badge>
                <span className="text-[10px] text-zinc-500">
                  Nivå {suggestion.recommendedAutonomy}
                </span>
              </button>

              {isExpanded && (
                <div className="border-t p-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500">Anbefalt nivå:</span>
                      <p className="font-medium">
                        {suggestion.recommendedAutonomy} —{" "}
                        {AutonomyLevelLabels[suggestion.recommendedAutonomy]}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Verktøy:</span>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {suggestion.suggestedTools.map((tool) => (
                          <Badge
                            key={tool}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <span className="text-xs text-zinc-500">Prompt-utkast:</span>
                    <pre className="mt-0.5 rounded bg-zinc-50 p-2 text-[10px] dark:bg-zinc-900">
                      {suggestion.promptDraft}
                    </pre>
                  </div>

                  <div className="mt-2">
                    <span className="text-xs text-zinc-500">Begrunnelse:</span>
                    <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      {suggestion.explanation}
                    </p>
                  </div>

                  {suggestion.accepted === undefined && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onAccept(suggestion.nodeId)}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Godkjenn
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReject(suggestion.nodeId)}
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Avvis
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
