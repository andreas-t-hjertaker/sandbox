"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ScannedElement } from "../types";

const SELECTOR = "[data-cloud-id]";
const DEBOUNCE_MS = 100;

/**
 * Hook som oppdager og kartlegger elementer med `data-cloud-*` attributter.
 *
 * Bruker MutationObserver for dynamiske elementer, IntersectionObserver
 * for synlighet, og ResizeObserver for posisjonsoppdatering.
 */
export function useDomScanner() {
  const [elements, setElements] = useState<ScannedElement[]>([]);
  const elementMapRef = useRef<Map<string, ScannedElement>>(new Map());
  const visibilityRef = useRef<WeakMap<HTMLElement, boolean>>(new WeakMap());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const scan = useCallback(() => {
    const nodes = document.querySelectorAll<HTMLElement>(SELECTOR);
    const newMap = new Map<string, ScannedElement>();

    nodes.forEach((el) => {
      const id = el.getAttribute("data-cloud-id");
      if (!id) return;

      const label = el.getAttribute("data-cloud-label") || "";
      const type = el.getAttribute("data-cloud-type") || undefined;
      const hint = el.getAttribute("data-cloud-hint") || undefined;
      const rect = el.getBoundingClientRect();
      const visible = visibilityRef.current.get(el) ?? true;

      newMap.set(id, { id, label, type, hint, rect, visible, element: el });
    });

    elementMapRef.current = newMap;
    setElements(Array.from(newMap.values()));
  }, []);

  const debouncedScan = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(scan, DEBOUNCE_MS);
  }, [scan]);

  /** Manuell rescan */
  const rescan = useCallback(() => {
    scan();
  }, [scan]);

  /** Hent et element etter ID */
  const getElement = useCallback(
    (id: string): ScannedElement | undefined => {
      return elementMapRef.current.get(id);
    },
    []
  );

  /** Hent elementer etter type */
  const getElementsByType = useCallback(
    (type: string): ScannedElement[] => {
      return Array.from(elementMapRef.current.values()).filter(
        (el) => el.type === type
      );
    },
    []
  );

  useEffect(() => {
    // Initiell skanning
    scan();

    // MutationObserver for nye/fjernede elementer
    const mutationObserver = new MutationObserver(debouncedScan);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-cloud-id"],
    });

    // IntersectionObserver for synlighet
    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        let changed = false;
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          const wasVisible = visibilityRef.current.get(el);
          const isVisible = entry.isIntersecting;
          if (wasVisible !== isVisible) {
            visibilityRef.current.set(el, isVisible);
            changed = true;
          }
        });
        if (changed) debouncedScan();
      },
      { threshold: 0.1 }
    );

    // ResizeObserver for posisjonsendringer
    resizeObserverRef.current = new ResizeObserver(debouncedScan);

    // Observer eksisterende elementer
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
      intersectionObserverRef.current?.observe(el);
      resizeObserverRef.current?.observe(el);
    });

    // Scroll-listener for rect-oppdatering (throttlet via rAF)
    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(scan);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      mutationObserver.disconnect();
      intersectionObserverRef.current?.disconnect();
      resizeObserverRef.current?.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      cancelAnimationFrame(rafId);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [scan, debouncedScan]);

  return { elements, rescan, getElement, getElementsByType };
}
