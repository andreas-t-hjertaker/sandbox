"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SpotlightProps = {
  targetId: string;
  message?: string;
  onDismiss: () => void;
  padding?: number;
  getElement?: (id: string) => { rect: DOMRect; element: HTMLElement } | undefined;
};

export function Spotlight({
  targetId,
  onDismiss,
  padding = 8,
  getElement,
}: SpotlightProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>(0);

  const updateRect = useCallback(() => {
    let rect: DOMRect | undefined;

    if (getElement) {
      rect = getElement(targetId)?.rect;
    } else {
      const el = document.querySelector<HTMLElement>(
        `[data-cloud-id="${targetId}"]`
      );
      rect = el?.getBoundingClientRect();
    }

    if (rect) {
      setTargetRect(rect);
    }
  }, [targetId, getElement]);

  useEffect(() => {
    updateRect();

    const handleUpdate = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateRect);
    };

    window.addEventListener("scroll", handleUpdate, { passive: true });
    window.addEventListener("resize", handleUpdate, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleUpdate);
      window.removeEventListener("resize", handleUpdate);
      cancelAnimationFrame(rafRef.current);
    };
  }, [updateRect]);

  // Keyboard: Escape lukker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  if (!targetRect) return null;

  const holeX = targetRect.x - padding;
  const holeY = targetRect.y - padding;
  const holeW = targetRect.width + padding * 2;
  const holeH = targetRect.height + padding * 2;
  const holeBorderRadius = 8;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9998]"
        onClick={onDismiss}
      >
        {/* Overlay med hull */}
        <svg className="absolute inset-0 h-full w-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={holeX}
                y={holeY}
                width={holeW}
                height={holeH}
                rx={holeBorderRadius}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.5)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Pulserende ring rundt target */}
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(59,130,246,0.4)",
              "0 0 0 8px rgba(59,130,246,0)",
              "0 0 0 0 rgba(59,130,246,0)",
            ],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="pointer-events-none absolute rounded-lg border-2 border-primary"
          style={{
            left: holeX,
            top: holeY,
            width: holeW,
            height: holeH,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
