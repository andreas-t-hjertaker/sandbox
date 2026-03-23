"use client";

import { useState, type ReactNode } from "react";
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";
import { GripVertical, MessageSquare, LayoutDashboard } from "lucide-react";

interface DesignerLayoutProps {
  chatPanel: ReactNode;
  canvasPanel: ReactNode;
  propertiesPanel: ReactNode;
  showProperties: boolean;
}

export function DesignerLayout({
  chatPanel,
  canvasPanel,
  propertiesPanel,
  showProperties,
}: DesignerLayoutProps) {
  const [mobileTab, setMobileTab] = useState<"chat" | "canvas">("chat");

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Desktop: split view with resizable panels */}
      <div className="hidden h-full w-full md:flex">
        <PanelGroup orientation="horizontal" className="h-full">
          {/* Chat panel - default 40% */}
          <Panel defaultSize="40%" minSize="20%" maxSize="60%">
            <div className="flex h-full flex-col overflow-hidden border-r border-border">
              {chatPanel}
            </div>
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle className="group relative flex w-1.5 items-center justify-center bg-border/50 transition-colors hover:bg-primary/20 active:bg-primary/30">
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </PanelResizeHandle>

          {/* Canvas panel - default 60% */}
          <Panel defaultSize="60%" minSize="30%">
            <div className="flex h-full flex-col overflow-hidden">
              {canvasPanel}
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Mobile: tabbed view */}
      <div className="flex h-full w-full flex-col md:hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border bg-background">
          <button
            type="button"
            onClick={() => setMobileTab("chat")}
            className={`flex flex-1 items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
              mobileTab === "chat"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("canvas")}
            className={`flex flex-1 items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
              mobileTab === "canvas"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Canvas
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === "chat" ? chatPanel : canvasPanel}
        </div>
      </div>

      {/* Properties panel - overlay/sheet from right edge */}
      <div
        className={`absolute inset-y-0 right-0 z-30 flex w-80 transform flex-col border-l border-border bg-background shadow-xl transition-transform duration-200 ease-in-out lg:w-96 ${
          showProperties ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {propertiesPanel}
      </div>

      {/* Backdrop for properties panel on smaller screens */}
      {showProperties && (
        <div className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[1px] md:hidden" />
      )}
    </div>
  );
}
