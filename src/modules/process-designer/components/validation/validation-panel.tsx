"use client";

import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Wrench,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ValidationResult, ValidationIssue } from "../../types";

interface ValidationPanelProps {
  result: ValidationResult | null;
  onNodeClick: (nodeId: string) => void;
  onAutoFix?: (issue: ValidationIssue) => void;
  onValidate: () => void;
  isValidating?: boolean;
}

const severityConfig = {
  error: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
};

export function ValidationPanel({
  result,
  onNodeClick,
  onAutoFix,
  onValidate,
  isValidating,
}: ValidationPanelProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center gap-3 p-6">
        <p className="text-sm text-zinc-500">
          Kjør validering for å sjekke prosessen
        </p>
        <Button size="sm" onClick={onValidate} disabled={isValidating}>
          {isValidating ? "Validerer..." : "Valider prosess"}
        </Button>
      </div>
    );
  }

  const allIssues = [...result.errors, ...result.warnings];

  return (
    <div className="flex flex-col gap-2 p-3">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {result.valid ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="text-sm font-medium">
            {result.valid ? "Prosessen er gyldig" : "Valideringsfeil funnet"}
          </span>
        </div>
        <div className="flex gap-1">
          {result.errors.length > 0 && (
            <Badge variant="secondary" className={severityConfig.error.badge}>
              {result.errors.length} feil
            </Badge>
          )}
          {result.warnings.length > 0 && (
            <Badge variant="secondary" className={severityConfig.warning.badge}>
              {result.warnings.length} advarsler
            </Badge>
          )}
        </div>
      </div>

      {/* Issues list */}
      <div className="space-y-1.5">
        {allIssues.map((issue, i) => {
          const config = severityConfig[issue.severity];
          const Icon = config.icon;

          return (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-md border p-2 ${config.bg} ${config.border}`}
            >
              <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs">{issue.message}</p>
                {issue.nodeId && (
                  <button
                    onClick={() => onNodeClick(issue.nodeId!)}
                    className="mt-1 flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Gå til node
                    <ChevronRight className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
              {issue.fix && onAutoFix && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-1.5 text-[10px]"
                  onClick={() => onAutoFix(issue)}
                  title={issue.fix}
                >
                  <Wrench className="mr-0.5 h-2.5 w-2.5" />
                  Fiks
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Re-validate button */}
      <Button
        size="sm"
        variant="outline"
        onClick={onValidate}
        disabled={isValidating}
        className="mt-2"
      >
        {isValidating ? "Validerer..." : "Valider på nytt"}
      </Button>
    </div>
  );
}
