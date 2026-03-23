"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import type { ProcessNode } from "../../types";

interface AdvancedTabProps {
  node: ProcessNode;
}

export function AdvancedTab({ node }: AdvancedTabProps) {
  const [copied, setCopied] = useState(false);

  const json = JSON.stringify(node, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = json;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Node-definisjon (JSON)
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-1.5"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Kopiert
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Kopier
            </>
          )}
        </Button>
      </div>

      <pre className="max-h-[60vh] overflow-auto rounded-lg border border-input bg-zinc-50 p-3 text-xs leading-relaxed dark:bg-zinc-900">
        <code className="text-zinc-800 dark:text-zinc-200">
          {json.split("\n").map((line, i) => (
            <span key={i} className="block">
              <span className="mr-3 inline-block w-6 text-right text-zinc-400 select-none">
                {i + 1}
              </span>
              {colorizeJsonLine(line)}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

/**
 * Basic JSON syntax highlighting using Tailwind classes.
 */
function colorizeJsonLine(line: string) {
  // Match JSON keys, strings, numbers, booleans, null
  const parts = line.split(
    /("(?:[^"\\]|\\.)*")\s*(:?)|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
  );

  return parts.map((part, i) => {
    if (part === undefined || part === "") return null;

    // Colon separator
    if (part === ":") {
      return (
        <span key={i} className="text-zinc-600 dark:text-zinc-400">
          :
        </span>
      );
    }

    // Booleans & null
    if (part === "true" || part === "false" || part === "null") {
      return (
        <span key={i} className="text-purple-600 dark:text-purple-400">
          {part}
        </span>
      );
    }

    // Numbers
    if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(part)) {
      return (
        <span key={i} className="text-amber-600 dark:text-amber-400">
          {part}
        </span>
      );
    }

    // Strings (check if followed by colon = key)
    if (part.startsWith('"') && part.endsWith('"')) {
      // Peek ahead: if next non-empty part is ":", this is a key
      const nextPart = parts[i + 1];
      if (nextPart === ":") {
        return (
          <span key={i} className="text-blue-600 dark:text-blue-400">
            {part}
          </span>
        );
      }
      return (
        <span key={i} className="text-green-600 dark:text-green-400">
          {part}
        </span>
      );
    }

    return <span key={i}>{part}</span>;
  });
}
