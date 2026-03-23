"use client";

import { useState, useMemo } from "react";
import { Search, LayoutTemplate, Plus, Tag, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PROCESS_TEMPLATES } from "../../constants";
import type { ProcessTemplate } from "../../types";

interface TemplateGalleryProps {
  customTemplates?: ProcessTemplate[];
  onUseTemplate: (template: ProcessTemplate | (typeof PROCESS_TEMPLATES)[number]) => void;
  onSaveAsTemplate?: () => void;
}

export function TemplateGallery({
  customTemplates = [],
  onUseTemplate,
  onSaveAsTemplate,
}: TemplateGalleryProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Alle");

  const allTemplates = useMemo(() => {
    const builtIn = PROCESS_TEMPLATES.map((t, i) => ({
      ...t,
      id: `builtin-${i}`,
      createdBy: "system",
      createdAt: null,
      isBuiltIn: true,
    }));
    const custom = customTemplates.map((t) => ({ ...t, isBuiltIn: false }));
    return [...builtIn, ...custom];
  }, [customTemplates]);

  const categories = useMemo(() => {
    const cats = new Set(allTemplates.map((t) => t.category));
    return ["Alle", ...Array.from(cats)];
  }, [allTemplates]);

  const filtered = useMemo(() => {
    return allTemplates.filter((t) => {
      const matchesSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory =
        selectedCategory === "Alle" || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allTemplates, search, selectedCategory]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Prosessmaler</h2>
        </div>
        {onSaveAsTemplate && (
          <Button size="sm" variant="outline" onClick={onSaveAsTemplate}>
            <Plus className="mr-1 h-3 w-3" />
            Lagre som mal
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søk maler..."
          className="pl-9"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template) => (
          <div
            key={template.id}
            className="group flex flex-col rounded-lg border p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
          >
            {/* Preview area */}
            <div className="mb-3 flex h-24 items-center justify-center rounded-md bg-zinc-50 text-xs text-zinc-400 dark:bg-zinc-900">
              {template.definition.nodes.length} noder &middot;{" "}
              {template.definition.edges.length} kanter
            </div>

            <h3 className="text-sm font-medium">{template.name}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
              {template.description}
            </p>

            {/* Tags */}
            <div className="mt-2 flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px]"
                >
                  <Tag className="mr-0.5 h-2 w-2" />
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">
                {template.isBuiltIn ? "Innebygd" : "Egendefinert"}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onUseTemplate(template)}
              >
                <Copy className="mr-1 h-3 w-3" />
                Bruk mal
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-zinc-400">
          Ingen maler funnet
        </p>
      )}
    </div>
  );
}
