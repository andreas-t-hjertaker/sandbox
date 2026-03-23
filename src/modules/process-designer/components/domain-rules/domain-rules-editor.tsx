"use client";

import { useState, useCallback } from "react";
import { BookOpen, Save, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DomainRulesEditorProps {
  globalRules: string;
  orgRules: string;
  processRules: string;
  onSave: (rules: string) => void;
  onGlobalSave?: (rules: string) => void;
  onOrgSave?: (rules: string) => void;
  readOnly?: boolean;
}

const PLACEHOLDER = `# Regler

## Konteringsprinsipper
- Leverandør X skal alltid på konto 6400
- Telefoni konteres på 6900

## Sikkerhetsgrenser
- Aldri kontér beløp over 100 000 kr uten godkjenning
- Maks 3 automatiske posteringer per batch

## Unntak
- Periodiske fakturaer fra leverandør Y kan auto-konteres uansett beløp
`;

export function DomainRulesEditor({
  globalRules,
  orgRules,
  processRules,
  onSave,
  onGlobalSave,
  onOrgSave,
  readOnly = false,
}: DomainRulesEditorProps) {
  const [localRules, setLocalRules] = useState(processRules);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["process"])
  );
  const hasChanges = localRules !== processRules;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleSave = useCallback(() => {
    onSave(localRules);
  }, [localRules, onSave]);

  const sections = [
    {
      id: "global",
      label: "Globale regler",
      description: "Gjelder alle prosesser i systemet",
      content: globalRules,
      editable: !!onGlobalSave,
      onSave: onGlobalSave,
      badge: "Global",
    },
    {
      id: "org",
      label: "Organisasjonsregler",
      description: "Gjelder alle prosesser i din organisasjon",
      content: orgRules,
      editable: !!onOrgSave,
      onSave: onOrgSave,
      badge: "Org",
    },
    {
      id: "process",
      label: "Prosessregler",
      description: "Spesifikke regler for denne prosessen (overstyrer org og global)",
      content: localRules,
      editable: !readOnly,
      onSave: handleSave,
      badge: "Prosess",
    },
  ];

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Domeneregler</h3>
      </div>

      <p className="text-xs text-zinc-500">
        Regler som agenten alltid følger. Mest spesifikke regler vinner
        (Prosess &gt; Org &gt; Global).
      </p>

      {/* Rule sections */}
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);

        return (
          <div key={section.id} className="rounded-lg border">
            <button
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center gap-2 p-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
              )}
              <span className="flex-1 text-xs font-medium">
                {section.label}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {section.badge}
              </Badge>
            </button>

            {isExpanded && (
              <div className="border-t p-3">
                <p className="mb-2 text-[10px] text-zinc-400">
                  {section.description}
                </p>
                {section.id === "process" ? (
                  <textarea
                    value={localRules}
                    onChange={(e) => setLocalRules(e.target.value)}
                    placeholder={PLACEHOLDER}
                    disabled={readOnly}
                    className="min-h-[200px] w-full rounded-md border bg-white p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-zinc-900"
                  />
                ) : (
                  <pre className="min-h-[80px] rounded-md border bg-zinc-50 p-3 text-xs dark:bg-zinc-900">
                    {section.content || "(Ingen regler definert)"}
                  </pre>
                )}

                {section.id === "process" && !readOnly && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!hasChanges}
                    >
                      <Save className="mr-1 h-3 w-3" />
                      Lagre
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setLocalRules(processRules)}
                      disabled={!hasChanges}
                    >
                      <RotateCcw className="mr-1 h-3 w-3" />
                      Tilbakestill
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
