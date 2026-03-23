"use client";

import { useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PanelLeftClose,
  PanelLeft,
  Maximize2,
  Minimize2,
} from "lucide-react";

type SplitViewLayoutProps = {
  chatPanel: ReactNode;
  canvasPanel: ReactNode;
  propertiesPanel?: ReactNode;
  showProperties?: boolean;
  onToggleProperties?: () => void;
};

const MIN_PANEL_WIDTH = 280;
const DEFAULT_CHAT_RATIO = 0.4;

export function SplitViewLayout({
  chatPanel,
  canvasPanel,
  propertiesPanel,
  showProperties = false,
  onToggleProperties,
}: SplitViewLayoutProps) {
  const [chatRatio, setChatRatio] = useState(DEFAULT_CHAT_RATIO);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [canvasFullscreen, setCanvasFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "canvas">("chat");
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Resize drag-handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newRatio = (e.clientX - containerRect.left) / containerRect.width;
      const minRatio = MIN_PANEL_WIDTH / containerRect.width;
      const maxRatio = 1 - minRatio;
      setChatRatio(Math.max(minRatio, Math.min(maxRatio, newRatio)));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      switch (e.key) {
        case "1":
          e.preventDefault();
          setChatCollapsed(false);
          setCanvasFullscreen(false);
          setActiveTab("chat");
          break;
        case "2":
          e.preventDefault();
          setChatCollapsed(false);
          setCanvasFullscreen(false);
          setActiveTab("canvas");
          break;
        case "3":
          e.preventDefault();
          onToggleProperties?.();
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onToggleProperties]);

  // Mobilvisning med tabs
  const mobileView = (
    <div className="flex h-full flex-col md:hidden">
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "chat"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground"
          )}
        >
          Chat
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("canvas")}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "canvas"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground"
          )}
        >
          Canvas
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" ? chatPanel : canvasPanel}
      </div>
    </div>
  );

  // Desktop split-view
  const desktopView = (
    <div ref={containerRef} className="hidden h-full md:flex">
      {/* Chat-panel */}
      {!canvasFullscreen && (
        <div
          className={cn(
            "flex flex-col overflow-hidden border-r border-border transition-all",
            chatCollapsed ? "w-0" : ""
          )}
          style={
            chatCollapsed ? { width: 0 } : { width: `${chatRatio * 100}%` }
          }
        >
          {!chatCollapsed && chatPanel}
        </div>
      )}

      {/* Drag-handle */}
      {!canvasFullscreen && !chatCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className="flex w-1 cursor-col-resize items-center justify-center bg-border transition-colors hover:bg-primary/20"
        >
          <div className="h-8 w-0.5 rounded-full bg-muted-foreground/30" />
        </div>
      )}

      {/* Canvas-panel */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Canvas toolbar */}
        <div className="flex h-10 items-center gap-1 border-b border-border px-2">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setChatCollapsed(!chatCollapsed)}
            title={chatCollapsed ? "Vis chat" : "Skjul chat"}
          >
            {chatCollapsed ? (
              <PanelLeft className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setCanvasFullscreen(!canvasFullscreen)}
            title={canvasFullscreen ? "Avslutt fullskjerm" : "Fullskjerm"}
          >
            {canvasFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">{canvasPanel}</div>
      </div>

      {/* Properties slide-out panel */}
      {showProperties && propertiesPanel && (
        <div className="w-80 overflow-y-auto border-l border-border">
          {propertiesPanel}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full">
      {mobileView}
      {desktopView}
    </div>
  );
}
