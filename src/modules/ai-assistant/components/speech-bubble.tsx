"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type BubbleAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "ghost";
};

type StructuredBubbleContent = {
  title?: string;
  body: string;
  table?: { headers: string[]; rows: string[][] };
  list?: string[];
};

type SpeechBubbleProps = {
  content: string | StructuredBubbleContent;
  position?: "left" | "right" | "top" | "bottom";
  variant?: "info" | "action" | "data" | "success" | "warning";
  onDismiss?: () => void;
  autoHide?: number;
  actions?: BubbleAction[];
  cloudRect?: DOMRect;
};

/** Beregn beste posisjon basert på skyens plassering i viewport */
function getAutoPosition(cloudRect?: DOMRect): "left" | "right" | "top" | "bottom" {
  if (!cloudRect) return "top";
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;

  if (cloudRect.right > vw - 340) return "left";
  if (cloudRect.left < 340) return "right";
  if (cloudRect.top < 200) return "bottom";
  return "top";
}

const variantStyles = {
  info: "border-border bg-card",
  action: "border-primary/30 bg-primary/5",
  data: "border-border bg-card",
  success: "border-green-500/30 bg-green-50 dark:bg-green-950/20",
  warning: "border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20",
};

const directionOffset = {
  left: { x: 10, y: 0 },
  right: { x: -10, y: 0 },
  top: { x: 0, y: 10 },
  bottom: { x: 0, y: -10 },
};

export function SpeechBubble({
  content,
  position,
  variant = "info",
  onDismiss,
  autoHide,
  actions,
  cloudRect,
}: SpeechBubbleProps) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const actualPosition = position || getAutoPosition(cloudRect);
  const offset = directionOffset[actualPosition];

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 200);
  }, [onDismiss]);

  useEffect(() => {
    if (autoHide && autoHide > 0) {
      timerRef.current = setTimeout(handleDismiss, autoHide);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [autoHide, handleDismiss]);

  const isStructured = typeof content !== "string";
  const structured = isStructured ? (content as StructuredBubbleContent) : null;
  const textContent = isStructured ? null : (content as string);

  // Posisjonering relativt til skyen
  const positionClasses = {
    left: "right-full mr-3 top-1/2 -translate-y-1/2",
    right: "left-full ml-3 top-1/2 -translate-y-1/2",
    top: "bottom-full mb-3 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-3 left-1/2 -translate-x-1/2",
  };

  // Hale (peker mot skyen)
  const tailClasses = {
    left: "absolute top-1/2 -right-2 -translate-y-1/2 border-8 border-transparent border-l-card",
    right: "absolute top-1/2 -left-2 -translate-y-1/2 border-8 border-transparent border-r-card",
    top: "absolute -bottom-2 left-1/2 -translate-x-1/2 border-8 border-transparent border-t-card",
    bottom: "absolute -top-2 left-1/2 -translate-x-1/2 border-8 border-transparent border-b-card",
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, ...offset }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "absolute z-[9998] w-[280px] max-w-[320px] rounded-xl border p-3 shadow-lg sm:w-[320px]",
            positionClasses[actualPosition],
            variantStyles[variant]
          )}
        >
          {/* Hale */}
          <div className={tailClasses[actualPosition]} />

          {/* Lukk-knapp */}
          {onDismiss && (
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Innhold */}
          <div className="space-y-2 text-sm">
            {textContent && <p>{textContent}</p>}

            {structured && (
              <>
                {structured.title && (
                  <p className="font-medium">{structured.title}</p>
                )}
                <p className="text-muted-foreground">{structured.body}</p>

                {structured.list && (
                  <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
                    {structured.list.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}

                {structured.table && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          {structured.table.headers.map((h, i) => (
                            <th key={i} className="px-1 py-0.5 text-left font-medium">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {structured.table.rows.map((row, i) => (
                          <tr key={i} className="border-b last:border-0">
                            {row.map((cell, j) => (
                              <td key={j} className="px-1 py-0.5">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Handlingsknapper */}
          {actions && actions.length > 0 && (
            <div className="mt-2 flex gap-2">
              {actions.map((action, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={action.variant === "ghost" ? "ghost" : "default"}
                  onClick={action.onClick}
                  className="h-7 text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
