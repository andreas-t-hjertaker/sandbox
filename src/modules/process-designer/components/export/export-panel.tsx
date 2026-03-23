"use client";

import { useState, useRef } from "react";
import {
  Download,
  Upload,
  Copy,
  FileCode,
  FileJson,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  exportToBPMNXml,
  exportToJson,
  importFromBPMNXml,
  importFromJson,
  downloadFile,
  copyToClipboard,
} from "../../lib/bpmn-export";
import type { ProcessDefinition } from "../../types";

interface ExportPanelProps {
  process: ProcessDefinition;
  onImport: (data: { nodes: ProcessDefinition["nodes"]; edges: ProcessDefinition["edges"]; name: string }) => void;
}

export function ExportPanel({ process, onImport }: ExportPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async (format: "xml" | "json") => {
    const content = format === "xml" ? exportToBPMNXml(process) : exportToJson(process);
    await copyToClipboard(content);
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (format: "xml" | "json") => {
    if (format === "xml") {
      downloadFile(
        exportToBPMNXml(process),
        `${process.name}.bpmn`,
        "application/xml"
      );
    } else {
      downloadFile(
        exportToJson(process),
        `${process.name}.json`,
        "application/json"
      );
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (file.name.endsWith(".json")) {
        const def = importFromJson(content);
        onImport({ nodes: def.nodes, edges: def.edges, name: def.name });
      } else {
        const result = importFromBPMNXml(content);
        onImport(result);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Download className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Eksporter / Importer</h3>
      </div>

      {/* Export */}
      <div>
        <h4 className="mb-2 text-xs font-medium text-zinc-500">Eksporter</h4>
        <div className="grid grid-cols-2 gap-2">
          {/* BPMN XML */}
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <FileCode className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium">BPMN 2.0 XML</span>
            </div>
            <p className="mb-2 text-[10px] text-zinc-500">
              Standard BPMN-format for Camunda, Bizagi etc.
            </p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px]"
                onClick={() => handleDownload("xml")}
              >
                <Download className="mr-0.5 h-2.5 w-2.5" />
                Last ned
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[10px]"
                onClick={() => handleCopy("xml")}
              >
                {copied === "xml" ? (
                  <Check className="mr-0.5 h-2.5 w-2.5 text-green-500" />
                ) : (
                  <Copy className="mr-0.5 h-2.5 w-2.5" />
                )}
                Kopier
              </Button>
            </div>
          </div>

          {/* JSON */}
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <FileJson className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium">JSON</span>
            </div>
            <p className="mb-2 text-[10px] text-zinc-500">
              Internt format med agent-konfigurasjon
            </p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px]"
                onClick={() => handleDownload("json")}
              >
                <Download className="mr-0.5 h-2.5 w-2.5" />
                Last ned
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[10px]"
                onClick={() => handleCopy("json")}
              >
                {copied === "json" ? (
                  <Check className="mr-0.5 h-2.5 w-2.5 text-green-500" />
                ) : (
                  <Copy className="mr-0.5 h-2.5 w-2.5" />
                )}
                Kopier
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Import */}
      <div>
        <h4 className="mb-2 text-xs font-medium text-zinc-500">Importer</h4>
        <input
          ref={fileInputRef}
          type="file"
          accept=".bpmn,.xml,.json"
          onChange={handleFileImport}
          className="hidden"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-1 h-3 w-3" />
          Importer fra fil (.bpmn, .xml, .json)
        </Button>
        <p className="mt-1 text-[10px] text-zinc-400">
          Støtter BPMN 2.0 XML og JSON-format
        </p>
      </div>
    </div>
  );
}
