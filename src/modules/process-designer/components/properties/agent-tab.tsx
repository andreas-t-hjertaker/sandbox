"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, X, Plus } from "lucide-react";
import type { AgentConfig, AutonomyLevel } from "../../types";
import { AutonomyLevelLabels } from "../../types";

interface AgentTabProps {
  agentConfig: AgentConfig | undefined;
  onUpdate: (config: AgentConfig) => void;
}

const defaultConfig: AgentConfig = {
  autonomyLevel: 3,
  llmPrompt: "",
  tools: [],
  maxIterations: 10,
  timeout: 30000,
  humanApprovalRequired: false,
};

export function AgentTab({ agentConfig, onUpdate }: AgentTabProps) {
  const config = agentConfig ?? defaultConfig;

  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>(
    config.autonomyLevel as AutonomyLevel,
  );
  const [llmPrompt, setLlmPrompt] = useState(config.llmPrompt);
  const [tools, setTools] = useState<string[]>(config.tools);
  const [maxIterations, setMaxIterations] = useState(config.maxIterations);
  const [timeout, setTimeout_] = useState(config.timeout);
  const [humanApprovalRequired, setHumanApprovalRequired] = useState(
    config.humanApprovalRequired,
  );
  const [newTool, setNewTool] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when config changes externally
  useEffect(() => {
    const c = agentConfig ?? defaultConfig;
    setAutonomyLevel(c.autonomyLevel as AutonomyLevel);
    setLlmPrompt(c.llmPrompt);
    setTools(c.tools);
    setMaxIterations(c.maxIterations);
    setTimeout_(c.timeout);
    setHumanApprovalRequired(c.humanApprovalRequired);
  }, [agentConfig]);

  const debouncedUpdate = useCallback(
    (updates: Partial<AgentConfig>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = globalThis.setTimeout(() => {
        onUpdate({ ...config, ...updates });
      }, 300);
    },
    [onUpdate, config],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleAddTool = () => {
    const trimmed = newTool.trim();
    if (trimmed && !tools.includes(trimmed)) {
      const updated = [...tools, trimmed];
      setTools(updated);
      setNewTool("");
      debouncedUpdate({ tools: updated });
    }
  };

  const handleRemoveTool = (tool: string) => {
    const updated = tools.filter((t) => t !== tool);
    setTools(updated);
    debouncedUpdate({ tools: updated });
  };

  const handleReset = () => {
    onUpdate(defaultConfig);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Autonomy Level */}
      <div className="space-y-2">
        <Label htmlFor="autonomy-level">
          Autonominiv&aring;: {autonomyLevel} &mdash;{" "}
          {AutonomyLevelLabels[autonomyLevel]}
        </Label>
        <input
          id="autonomy-level"
          type="range"
          min={1}
          max={5}
          step={1}
          value={autonomyLevel}
          onChange={(e) => {
            const val = Number(e.target.value) as AutonomyLevel;
            setAutonomyLevel(val);
            debouncedUpdate({ autonomyLevel: val });
          }}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 - Kun forslag</span>
          <span>5 - Full autonom</span>
        </div>
      </div>

      <Separator />

      {/* LLM Prompt */}
      <div className="space-y-1.5">
        <Label htmlFor="llm-prompt">LLM-prompt</Label>
        <textarea
          id="llm-prompt"
          value={llmPrompt}
          onChange={(e) => {
            setLlmPrompt(e.target.value);
            debouncedUpdate({ llmPrompt: e.target.value });
          }}
          rows={5}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 font-mono text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          placeholder="Skriv instruksjoner til agenten..."
        />
      </div>

      <Separator />

      {/* Tools */}
      <div className="space-y-2">
        <Label>Verkt&oslash;y</Label>
        <div className="flex flex-wrap gap-1.5">
          {tools.map((tool) => (
            <Badge
              key={tool}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {tool}
              <button
                type="button"
                onClick={() => handleRemoveTool(tool)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Input
            value={newTool}
            onChange={(e) => setNewTool(e.target.value)}
            placeholder="Legg til verkt&oslash;y..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTool();
              }
            }}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleAddTool}
            disabled={!newTool.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Max Iterations */}
      <div className="space-y-1.5">
        <Label htmlFor="max-iterations">Maks iterasjoner</Label>
        <Input
          id="max-iterations"
          type="number"
          min={1}
          value={maxIterations}
          onChange={(e) => {
            const val = Number(e.target.value);
            setMaxIterations(val);
            debouncedUpdate({ maxIterations: val });
          }}
        />
      </div>

      {/* Timeout */}
      <div className="space-y-1.5">
        <Label htmlFor="timeout">Timeout (ms)</Label>
        <Input
          id="timeout"
          type="number"
          min={1000}
          step={1000}
          value={timeout}
          onChange={(e) => {
            const val = Number(e.target.value);
            setTimeout_(val);
            debouncedUpdate({ timeout: val });
          }}
        />
      </div>

      <Separator />

      {/* Human Approval */}
      <div className="flex items-center justify-between">
        <Label htmlFor="human-approval" className="cursor-pointer">
          Krever menneskelig godkjenning
        </Label>
        <button
          id="human-approval"
          type="button"
          role="switch"
          aria-checked={humanApprovalRequired}
          onClick={() => {
            const val = !humanApprovalRequired;
            setHumanApprovalRequired(val);
            debouncedUpdate({ humanApprovalRequired: val });
          }}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
            humanApprovalRequired
              ? "bg-primary"
              : "bg-zinc-300 dark:bg-zinc-600"
          }`}
        >
          <span
            className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              humanApprovalRequired ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <Separator />

      {/* Reset */}
      <Button variant="outline" onClick={handleReset} className="gap-1.5">
        <RotateCcw className="h-4 w-4" />
        Tilbakestill til AI-forslag
      </Button>
    </div>
  );
}
