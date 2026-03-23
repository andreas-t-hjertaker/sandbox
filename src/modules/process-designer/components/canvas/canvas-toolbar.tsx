"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutGrid,
  CheckCircle2,
  Maximize2,
  ArrowRightLeft,
  ArrowUpDown,
  Fullscreen,
} from "lucide-react";

interface CanvasToolbarProps {
  onAutoLayout: () => void;
  onValidate: () => void;
  onZoomToFit: () => void;
  onToggleDirection: () => void;
  onToggleFullscreen: () => void;
  direction: "LR" | "TB";
}

export function CanvasToolbar({
  onAutoLayout,
  onValidate,
  onZoomToFit,
  onToggleDirection,
  onToggleFullscreen,
  direction,
}: CanvasToolbarProps) {
  return (
    <div className="flex items-center gap-1 border-b bg-background px-2 py-1.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={onAutoLayout}
        className="gap-1.5 text-xs"
        title="Auto-layout (Ctrl+Shift+L)"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Auto-layout
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onValidate}
        className="gap-1.5 text-xs"
        title="Valider (Ctrl+Shift+V)"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Valider
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomToFit}
        className="gap-1.5 text-xs"
        title="Zoom til innhold"
      >
        <Maximize2 className="h-3.5 w-3.5" />
        Tilpass
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleDirection}
        className="gap-1.5 text-xs"
        title={`Retning: ${direction === "LR" ? "Venstre-Hoyre" : "Topp-Bunn"}`}
      >
        {direction === "LR" ? (
          <ArrowRightLeft className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5" />
        )}
        {direction === "LR" ? "LR" : "TB"}
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleFullscreen}
        className="gap-1.5 text-xs"
        title="Fullskjerm (Ctrl+Shift+F)"
      >
        <Fullscreen className="h-3.5 w-3.5" />
        Fullskjerm
      </Button>
    </div>
  );
}
