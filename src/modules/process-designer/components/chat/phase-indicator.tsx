"use client";

import { Check } from "lucide-react";
import { ChatPhases, ChatPhaseLabels, type ChatPhase } from "../../types";
import { cn } from "@/lib/utils";

interface PhaseIndicatorProps {
  currentPhase: ChatPhase;
}

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const currentIndex = ChatPhases.indexOf(currentPhase);

  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
      {ChatPhases.map((phase, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={phase} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors",
                  {
                    "bg-primary text-primary-foreground": isCurrent,
                    "bg-primary/20 text-primary": isCompleted,
                    "bg-muted text-muted-foreground": !isCurrent && !isCompleted,
                  }
                )}
              >
                {isCompleted ? <Check className="size-3.5" /> : index + 1}
              </div>
              <span
                className={cn("hidden text-xs font-medium sm:inline", {
                  "text-foreground": isCurrent,
                  "text-primary": isCompleted,
                  "text-muted-foreground": !isCurrent && !isCompleted,
                })}
              >
                {ChatPhaseLabels[phase]}
              </span>
            </div>
            {index < ChatPhases.length - 1 && (
              <div
                className={cn("mx-2 h-px w-6 sm:w-10", {
                  "bg-primary": index < currentIndex,
                  "bg-border": index >= currentIndex,
                })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
