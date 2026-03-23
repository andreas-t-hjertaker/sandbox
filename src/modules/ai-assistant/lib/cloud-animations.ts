/**
 * Animasjonsuttrykk for Cloud Avatar.
 *
 * Definerer varianter for ulike tilstander: idle, thinking, celebrating, etc.
 * Alle animasjoner bruker GPU-akselererte egenskaper (transform/opacity).
 */

import type { Variants, Transition } from "framer-motion";

/** Cloud Avatar expression type */
export type CloudExpression =
  | "floating"
  | "sleeping"
  | "curious"
  | "thinking"
  | "flying"
  | "celebrating"
  | "confused"
  | "pointing";

/** Sjekk om brukeren foretrekker redusert bevegelse */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Animasjonsvarianter for sky-kroppen */
export const cloudVariants: Record<CloudExpression, {
  animate: Record<string, unknown>;
  transition: Transition;
}> = {
  floating: {
    animate: { y: [0, -6, 0] },
    transition: { repeat: Infinity, duration: 3, ease: "easeInOut" },
  },
  sleeping: {
    animate: { scale: [1, 1.02, 1], opacity: [1, 0.85, 1] },
    transition: { repeat: Infinity, duration: 4, ease: "easeInOut" },
  },
  curious: {
    animate: { rotate: [0, 8, 0] },
    transition: { duration: 0.5, ease: "easeOut" },
  },
  thinking: {
    animate: { scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] },
    transition: { repeat: Infinity, duration: 1.5 },
  },
  flying: {
    animate: { scaleX: [1, 1.1, 1], scaleY: [1, 0.92, 1] },
    transition: { duration: 0.3 },
  },
  celebrating: {
    animate: { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] },
    transition: { duration: 0.5 },
  },
  confused: {
    animate: { x: [0, -5, 5, -5, 0] },
    transition: { duration: 0.4 },
  },
  pointing: {
    animate: { rotate: [0, -15, -12] },
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

/** Mikro-interaksjonsvarianter */
export const microInteractions = {
  hover: { scale: 1.08, filter: "brightness(1.1)" },
  tap: { scale: 0.92, scaleY: 0.85 },
  dragStart: { y: -10, scale: 1.05 },
  dragEnd: {
    y: [0, -5, 0],
    transition: { type: "spring" as const, stiffness: 500, damping: 15 },
  },
} as const;

/** SVG-øyne for ulike uttrykk */
export const eyeVariants: Record<CloudExpression, {
  left: { cx: number; cy: number; r: number };
  right: { cx: number; cy: number; r: number };
}> = {
  floating: { left: { cx: 24, cy: 20, r: 2 }, right: { cx: 38, cy: 20, r: 2 } },
  sleeping: { left: { cx: 24, cy: 21, r: 0.5 }, right: { cx: 38, cy: 21, r: 0.5 } },
  curious: { left: { cx: 26, cy: 19, r: 2.2 }, right: { cx: 40, cy: 19, r: 2.2 } },
  thinking: { left: { cx: 23, cy: 18, r: 1.8 }, right: { cx: 37, cy: 18, r: 1.8 } },
  flying: { left: { cx: 22, cy: 20, r: 1.5 }, right: { cx: 36, cy: 20, r: 1.5 } },
  celebrating: { left: { cx: 24, cy: 19, r: 2.5 }, right: { cx: 38, cy: 19, r: 2.5 } },
  confused: { left: { cx: 25, cy: 19, r: 2 }, right: { cx: 37, cy: 21, r: 1.5 } },
  pointing: { left: { cx: 25, cy: 20, r: 2 }, right: { cx: 39, cy: 20, r: 2 } },
};

/** SVG-munn for ulike uttrykk */
export const mouthVariants: Record<CloudExpression, string> = {
  floating: "M28 25c1.5 2 5.5 2 7 0",        // smil
  sleeping: "M29 25h4",                         // rett linje
  curious: "M28 25c1.5 1 5.5 1 7 0",          // lite smil
  thinking: "M29 26c1 -1 4 -1 5 0",           // liten o
  flying: "M28 24c1.5 2 5.5 2 7 0",           // åpen munn
  celebrating: "M27 24c2 3 6 3 8 0",          // stort smil
  confused: "M28 26c1 -1.5 5 1.5 6 0",        // bølget
  pointing: "M28 25c1.5 1.5 5.5 1.5 7 0",    // halvt smil
};

/** Inaktivitetstid før sleeping (ms) */
export const SLEEP_TIMEOUT_MS = 120_000;

/**
 * Velg uttrykk basert på tilstand.
 * Returnerer reduced-motion-safe varianter.
 */
export function getExpression(
  expression: CloudExpression
): { animate: Record<string, unknown>; transition: Transition } {
  if (prefersReducedMotion()) {
    return { animate: {}, transition: { duration: 0 } };
  }
  return cloudVariants[expression];
}
