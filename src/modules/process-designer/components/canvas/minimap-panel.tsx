"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Map, ChevronDown, ChevronUp } from "lucide-react";

interface MinimapPanelProps {
  /** Whether the minimap is initially visible */
  defaultVisible?: boolean;
}

/**
 * A collapsible minimap overlay toggle. The actual MiniMap rendering
 * is handled inside ProcessCanvas via ReactFlow's built-in MiniMap.
 * This component provides a toggle button to show/hide the minimap
 * overlay for users who prefer more canvas space.
 */
export function MinimapPanel({ defaultVisible = true }: MinimapPanelProps) {
  const [visible, setVisible] = useState(defaultVisible);

  return (
    <div className="absolute bottom-4 right-4 z-10">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setVisible(!visible)}
        className="gap-1.5 bg-background/90 text-xs shadow-sm backdrop-blur-sm"
        title={visible ? "Skjul minikart" : "Vis minikart"}
      >
        <Map className="h-3.5 w-3.5" />
        Minikart
        {visible ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3" />
        )}
      </Button>

      {/*
        Visibility hint: the actual ReactFlow MiniMap is rendered inside
        ProcessCanvas. This CSS class can be used to toggle it.
        Consumers can conditionally apply `[&_.react-flow__minimap]:hidden`
        to the canvas wrapper based on the visible state from a shared store.
      */}
      {!visible && (
        <style>{`.react-flow__minimap { display: none !important; }`}</style>
      )}
    </div>
  );
}
