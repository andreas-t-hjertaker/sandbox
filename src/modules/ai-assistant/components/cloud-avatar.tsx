"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useAnimationControls,
  type PanInfo,
} from "framer-motion";
import { springPresets } from "@/components/motion/presets";
import {
  cloudVariants,
  eyeVariants,
  mouthVariants,
  SLEEP_TIMEOUT_MS,
  type CloudExpression,
} from "../lib/cloud-animations";

export type CloudAvatarState = "idle" | "navigating" | "highlighting" | "chatOpen" | "dragging";

type CloudAvatarProps = {
  state?: CloudAvatarState;
  expression?: CloudExpression;
  isStreaming?: boolean;
  targetPosition?: { x: number; y: number };
  hasNotification?: boolean;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  homePosition?: { x: number; y: number };
};

/** Default hjemmeposisjon (bunn-høyre) */
const DEFAULT_HOME = { x: -24, y: -24 };

/** Terskel for å skille klikk fra drag (piksel) */
const DRAG_THRESHOLD = 5;

/** Map state + context til riktig CloudExpression */
function resolveExpression(
  state: CloudAvatarState,
  explicit?: CloudExpression,
  isStreaming?: boolean,
  lastActivityMs?: number,
): CloudExpression {
  if (explicit) return explicit;
  if (isStreaming) return "thinking";
  if (state === "navigating") return "flying";
  if (state === "highlighting") return "pointing";
  if (state === "chatOpen") return "curious";
  if (lastActivityMs && lastActivityMs > SLEEP_TIMEOUT_MS) return "sleeping";
  return "floating";
}

export function CloudAvatar({
  state = "idle",
  expression: explicitExpression,
  isStreaming = false,
  targetPosition,
  hasNotification = false,
  onClick,
  onDragStart,
  onDragEnd,
  homePosition = DEFAULT_HOME,
}: CloudAvatarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastActivityRef = useRef(Date.now());
  const [lastActivityMs, setLastActivityMs] = useState(0);
  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track inactivity for sleeping expression
  useEffect(() => {
    const resetActivity = () => { lastActivityRef.current = Date.now(); };
    window.addEventListener("click", resetActivity, { passive: true });
    window.addEventListener("keydown", resetActivity, { passive: true });
    const timer = setInterval(() => {
      setLastActivityMs(Date.now() - lastActivityRef.current);
    }, 10_000);
    return () => {
      window.removeEventListener("click", resetActivity);
      window.removeEventListener("keydown", resetActivity);
      clearInterval(timer);
    };
  }, []);

  const currentExpression = resolveExpression(state, explicitExpression, isStreaming, lastActivityMs);
  const bodyAnim = cloudVariants[currentExpression];
  const eyes = eyeVariants[currentExpression];
  const mouth = mouthVariants[currentExpression];

  // Naviger til target-posisjon
  useEffect(() => {
    if (state === "navigating" && targetPosition) {
      controls.start({
        x: targetPosition.x,
        y: targetPosition.y,
        transition: { type: "spring", stiffness: 200, damping: 20 },
      });
    }
  }, [state, targetPosition, controls]);

  const handleDragStart = useCallback(
    (_: unknown, info: PanInfo) => {
      dragStartRef.current = { x: info.point.x, y: info.point.y };
    },
    []
  );

  const handleDrag = useCallback(
    (_: unknown, info: PanInfo) => {
      if (!isDragging && dragStartRef.current) {
        const dx = Math.abs(info.point.x - dragStartRef.current.x);
        const dy = Math.abs(info.point.y - dragStartRef.current.y);
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          setIsDragging(true);
          onDragStart?.();
        }
      }
    },
    [isDragging, onDragStart]
  );

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      // Snap tilbake til hjemmeposisjon
      controls.start({
        x: 0,
        y: 0,
        transition: springPresets.bounce,
      });
      onDragEnd?.();
    }
    setIsDragging(false);
    dragStartRef.current = null;
  }, [isDragging, controls, onDragEnd]);

  const handleTap = useCallback(() => {
    if (!isDragging) {
      onClick?.();
    }
  }, [isDragging, onClick]);

  // Respekter prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const expressionAnimation = prefersReducedMotion
    ? {}
    : { ...bodyAnim.animate, transition: bodyAnim.transition };

  return (
    <div
      ref={containerRef}
      className="fixed right-6 bottom-6 z-[9999]"
      style={{ transform: `translate(${homePosition.x}px, ${homePosition.y}px)` }}
    >
      <motion.div
        drag
        dragElastic={0.15}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 25 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        animate={state === "navigating" ? controls : expressionAnimation}
        style={{ x, y }}
        whileHover={prefersReducedMotion ? {} : { scale: 1.08 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        className="relative flex h-14 w-14 cursor-grab items-center justify-center active:cursor-grabbing"
      >
        {/* Sky-SVG */}
        <svg
          viewBox="0 0 64 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-14 w-14 drop-shadow-lg"
        >
          <defs>
            <linearGradient id="cloud-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.75" />
            </linearGradient>
          </defs>
          <path
            d="M52 34H14C7.4 34 2 28.6 2 22c0-5.5 3.7-10.1 8.8-11.5C12.2 4.5 17.6 0 24 0c5.2 0 9.7 2.8 12.2 7 1-.4 2.1-.6 3.3-.6 5 0 9.1 3.7 9.8 8.5C55.3 16 60 21.2 60 27.5 60 31.1 56.4 34 52 34Z"
            fill="url(#cloud-grad)"
          />
          {/* Øyne — dynamisk basert på expression */}
          <circle cx={eyes.left.cx} cy={eyes.left.cy} r={eyes.left.r} fill="hsl(var(--background))" />
          <circle cx={eyes.right.cx} cy={eyes.right.cy} r={eyes.right.r} fill="hsl(var(--background))" />
          {/* Munn — dynamisk basert på expression */}
          <path
            d={mouth}
            stroke="hsl(var(--background))"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Notifikasjonsprikk */}
        {hasNotification && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive"
          />
        )}

        {/* Glow-effekt ved notifikasjon */}
        {hasNotification && !prefersReducedMotion && (
          <motion.span
            animate={{
              scale: [1, 1.6, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full bg-foreground/20"
          />
        )}
      </motion.div>
    </div>
  );
}
