"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProcessNode, BPMNNodeType } from "../../types";
import { BPMNNodeTypes } from "../../types";

interface GeneralTabProps {
  node: ProcessNode;
  onUpdate: (updates: Partial<ProcessNode>) => void;
}

export function GeneralTab({ node, onUpdate }: GeneralTabProps) {
  const [label, setLabel] = useState(node.label);
  const [description, setDescription] = useState(
    (node.metadata?.description as string) ?? "",
  );
  const [type, setType] = useState<BPMNNodeType>(node.type);
  const [role, setRole] = useState(
    (node.metadata?.role as string) ?? "",
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when the selected node changes
  useEffect(() => {
    setLabel(node.label);
    setDescription((node.metadata?.description as string) ?? "");
    setType(node.type);
    setRole((node.metadata?.role as string) ?? "");
  }, [node.id, node.label, node.type, node.metadata]);

  const debouncedUpdate = useCallback(
    (updates: Partial<ProcessNode>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate(updates);
      }, 300);
    },
    [onUpdate],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleLabelChange = (value: string) => {
    setLabel(value);
    debouncedUpdate({ label: value });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    debouncedUpdate({
      metadata: { ...node.metadata, description: value },
    });
  };

  const handleTypeChange = (value: BPMNNodeType) => {
    setType(value);
    debouncedUpdate({ type: value });
  };

  const handleRoleChange = (value: string) => {
    setRole(value);
    debouncedUpdate({
      metadata: { ...node.metadata, role: value },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="space-y-1.5">
        <Label htmlFor="node-name">Navn</Label>
        <Input
          id="node-name"
          value={label}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="Nodenavn"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="node-description">Beskrivelse</Label>
        <textarea
          id="node-description"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Beskriv hva denne noden gj&oslash;r..."
          rows={3}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="node-type">BPMN-type</Label>
        <select
          id="node-type"
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as BPMNNodeType)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {BPMNNodeTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="node-role">Ansvarlig</Label>
        <Input
          id="node-role"
          value={role}
          onChange={(e) => handleRoleChange(e.target.value)}
          placeholder="Rolle eller person"
        />
      </div>
    </div>
  );
}
