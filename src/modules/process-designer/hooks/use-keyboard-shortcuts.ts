import { useCallback, useEffect } from "react";
import { KEYBOARD_SHORTCUTS } from "../constants";

// ─── Types ───────────────────────────────────────────────────────────

export interface KeyboardShortcutHandlers {
  onFocusChat?: () => void;
  onFocusCanvas?: () => void;
  onFocusProperties?: () => void;
  onToggleFullscreen?: () => void;
  onAutoLayout?: () => void;
  onValidate?: () => void;
  onDeploy?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

// ─── Parse shortcut string ───────────────────────────────────────────

interface ParsedShortcut {
  mod: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
}

function parseShortcut(shortcut: string): ParsedShortcut {
  const parts = shortcut.toLowerCase().split("+");
  return {
    mod: parts.includes("mod"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
    key: parts.filter((p) => !["mod", "shift", "alt"].includes(p))[0] ?? "",
  };
}

function matchesShortcut(event: KeyboardEvent, parsed: ParsedShortcut): boolean {
  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? event.metaKey : event.ctrlKey;

  return (
    modKey === parsed.mod &&
    event.shiftKey === parsed.shift &&
    event.altKey === parsed.alt &&
    event.key.toLowerCase() === parsed.key
  );
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Allow mod-based shortcuts even in input fields for undo/redo
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      if (isInputFocused && !modKey) return;

      const shortcutMap: Array<{
        shortcut: string;
        handler: (() => void) | undefined;
      }> = [
        { shortcut: KEYBOARD_SHORTCUTS.focusChat, handler: handlers.onFocusChat },
        { shortcut: KEYBOARD_SHORTCUTS.focusCanvas, handler: handlers.onFocusCanvas },
        { shortcut: KEYBOARD_SHORTCUTS.focusProperties, handler: handlers.onFocusProperties },
        { shortcut: KEYBOARD_SHORTCUTS.toggleFullscreen, handler: handlers.onToggleFullscreen },
        { shortcut: KEYBOARD_SHORTCUTS.autoLayout, handler: handlers.onAutoLayout },
        { shortcut: KEYBOARD_SHORTCUTS.validate, handler: handlers.onValidate },
        { shortcut: KEYBOARD_SHORTCUTS.deploy, handler: handlers.onDeploy },
        { shortcut: KEYBOARD_SHORTCUTS.undo, handler: handlers.onUndo },
        { shortcut: KEYBOARD_SHORTCUTS.redo, handler: handlers.onRedo },
      ];

      for (const { shortcut, handler } of shortcutMap) {
        if (!handler) continue;

        const parsed = parseShortcut(shortcut);
        if (matchesShortcut(event, parsed)) {
          event.preventDefault();
          event.stopPropagation();
          handler();
          return;
        }
      }
    },
    [handlers],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}

// ─── Utility: format shortcut for display ────────────────────────────

export function formatShortcut(shortcut: string): string {
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return shortcut
    .split("+")
    .map((part) => {
      switch (part.toLowerCase()) {
        case "mod":
          return isMac ? "\u2318" : "Ctrl";
        case "shift":
          return isMac ? "\u21E7" : "Shift";
        case "alt":
          return isMac ? "\u2325" : "Alt";
        default:
          return part.toUpperCase();
      }
    })
    .join(isMac ? "" : "+");
}
